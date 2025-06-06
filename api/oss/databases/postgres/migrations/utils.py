import os
import tempfile
import subprocess

from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

from oss.src.utils.env import env


# Config (can override via env)
POSTGRES_URI = (
    os.getenv("POSTGRES_URI")
    or env.POSTGRES_URI_CORE
    or env.POSTGRES_URI_TRACING
    or "postgresql://username:password@localhost:5432/agenta_oss"
)
DB_PROTOCOL = POSTGRES_URI.split("://")[0].replace("+asyncpg", "")
DB_USER = POSTGRES_URI.split("://")[1].split(":")[0]
DB_PASS = POSTGRES_URI.split("://")[1].split(":")[1].split("@")[0]
DB_HOST = POSTGRES_URI.split("@")[1].split(":")[0]
DB_PORT = POSTGRES_URI.split(":")[-1].split("/")[0]
ADMIN_DB = "postgres"

POSTGRES_URI_POSTGRES = (
    f"{DB_PROTOCOL}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{ADMIN_DB}"
)

# Rename/create map: {'old_name': 'new_name'}
RENAME_MAP = {
    "agenta_oss": "agenta_oss_core",
    "supertokens_oss": "agenta_oss_supertokens",
    "agenta_oss_tracing": "agenta_oss_tracing",
}

NODES_TF = {
    "agenta_oss_core": "agenta_oss_tracing",
}


def copy_nodes_from_core_to_tracing():
    engine = create_engine(
        POSTGRES_URI_POSTGRES,
        isolation_level="AUTOCOMMIT",
    )

    with engine.connect() as conn:
        for old_name, new_name in NODES_TF.items():
            old_exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": old_name},
            ).scalar()

            new_exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": new_name},
            ).scalar()

            if old_exists and new_exists:
                # Check if the nodes table exists in old_name database
                check_url = f"{DB_PROTOCOL}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{old_name}"
                check_engine = create_engine(check_url)
                with check_engine.connect() as conn:
                    result = conn.execute(
                        text("SELECT to_regclass('public.nodes')")
                    ).scalar()
                    if result is None:
                        print(
                            f"⚠️ Table 'nodes' does not exist in '{old_name}'. Skipping copy."
                        )
                        return

                    count = conn.execute(
                        text("SELECT COUNT(*) FROM public.nodes")
                    ).scalar()

                    if count == 0:
                        print(
                            f"⚠️ Table 'nodes' is empty in '{old_name}'. Skipping copy."
                        )
                        return

                check_url = f"{DB_PROTOCOL}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{new_name}"
                check_engine = create_engine(check_url)

                with check_engine.connect() as conn:
                    count = conn.execute(
                        text("SELECT COUNT(*) FROM public.nodes")
                    ).scalar()

                    if count > 0:
                        print(
                            f"⚠️ Table 'nodes' already exists in '{new_name}' with {count} rows. Skipping copy."
                        )
                        return

                with tempfile.NamedTemporaryFile(suffix=".sql", delete=False) as tmp:
                    dump_file = tmp.name

                try:
                    # Step 1: Dump the 'nodes' table to file
                    subprocess.run(
                        [
                            "pg_dump",
                            "-h",
                            DB_HOST,
                            "-p",
                            str(DB_PORT),
                            "-U",
                            DB_USER,
                            "-d",
                            old_name,
                            "-t",
                            "nodes",
                            "--format=custom",  # requires -f, not stdout redirection
                            "--no-owner",
                            "--no-privileges",
                            "-f",
                            dump_file,
                        ],
                        check=True,
                        env={**os.environ, "PGPASSWORD": DB_PASS},
                    )

                    print(f"✔ Dumped 'nodes' table to '{dump_file}'")

                    # Step 2: Restore the dump into the new database
                    subprocess.run(
                        [
                            "pg_restore",
                            "--data-only",
                            "--no-owner",
                            "--no-privileges",
                            "-h",
                            DB_HOST,
                            "-p",
                            str(DB_PORT),
                            "-U",
                            DB_USER,
                            "-d",
                            new_name,
                            dump_file,
                        ],
                        check=True,
                        env={**os.environ, "PGPASSWORD": DB_PASS},
                    )

                    print(f"✔ Restored 'nodes' table into '{new_name}'")

                    # Step 3: Verify 'nodes' exists in both DBs, then drop from old
                    source_engine = create_engine(
                        f"{DB_PROTOCOL}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{old_name}"
                    )
                    dest_engine = create_engine(
                        f"{DB_PROTOCOL}://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{new_name}"
                    )

                    with source_engine.connect().execution_options(
                        autocommit=True
                    ) as src, dest_engine.connect() as dst:
                        src_exists = src.execute(
                            text("SELECT to_regclass('public.nodes')")
                        ).scalar()
                        dst_exists = dst.execute(
                            text("SELECT to_regclass('public.nodes')")
                        ).scalar()

                        if src_exists and dst_exists:
                            subprocess.run(
                                [
                                    "psql",
                                    "-h",
                                    DB_HOST,
                                    "-p",
                                    str(DB_PORT),
                                    "-U",
                                    DB_USER,
                                    "-d",
                                    old_name,
                                    "-c",
                                    "TRUNCATE TABLE public.nodes CASCADE",
                                ],
                                check=True,
                                env={**os.environ, "PGPASSWORD": DB_PASS},
                            )

                            count = src.execute(
                                text("SELECT COUNT(*) FROM public.nodes")
                            ).scalar()

                            print(f"✅ Remaining rows: {count}")

                except subprocess.CalledProcessError as e:
                    print(f"❌ pg_dump/psql failed: {e}")
                finally:
                    if os.path.exists(dump_file):
                        os.remove(dump_file)


def split_core_and_tracing():
    engine = create_engine(
        POSTGRES_URI_POSTGRES,
        isolation_level="AUTOCOMMIT",
    )

    with engine.connect() as conn:
        for old_name, new_name in RENAME_MAP.items():
            old_exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": old_name},
            ).scalar()

            new_exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": new_name},
            ).scalar()

            if old_exists and not new_exists:
                print(f"Renaming database '{old_name}' → '{new_name}'...")
                try:
                    conn.execute(
                        text(f"ALTER DATABASE {old_name} RENAME TO {new_name}")
                    )
                    print(f"✔ Renamed '{old_name}' to '{new_name}'")
                except ProgrammingError as e:
                    print(f"❌ Failed to rename '{old_name}': {e}")

            elif not old_exists and new_exists:
                print(
                    f"'{old_name}' does not exist, but '{new_name}' already exists. No action taken."
                )

            elif not old_exists and not new_exists:
                print(
                    f"Neither '{old_name}' nor '{new_name}' exists. Creating '{new_name}'..."
                )
                try:
                    # Ensure the role exists
                    conn.execute(
                        text(
                            f"""
                            DO $$
                            BEGIN
                                IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{DB_USER}') THEN
                                    EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', '{DB_USER}', '{DB_PASS}');
                                END IF;
                            END
                            $$;
                            """
                        )
                    )
                    print(f"✔ Ensured role '{DB_USER}' exists")

                    # Create the new database
                    conn.execute(text(f"CREATE DATABASE {new_name}"))
                    print(f"✔ Created database '{new_name}'")

                    # Grant privileges on the database to the role
                    conn.execute(
                        text(
                            f"GRANT ALL PRIVILEGES ON DATABASE {new_name} TO {DB_USER}"
                        )
                    )
                    print(
                        f"✔ Granted privileges on database '{new_name}' to '{DB_USER}'"
                    )

                    # Connect to the new database to grant schema permissions
                    new_db_url = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{new_name}"

                    with create_engine(
                        new_db_url, isolation_level="AUTOCOMMIT"
                    ).connect() as new_db_conn:
                        new_db_conn.execute(
                            text(f"GRANT ALL ON SCHEMA public TO {DB_USER}")
                        )
                        print(
                            f"✔ Granted privileges on schema 'public' in '{new_name}' to '{DB_USER}'"
                        )

                except ProgrammingError as e:
                    print(
                        f"❌ Failed during creation or configuration of '{new_name}': {e}"
                    )

            else:
                print(f"Both '{old_name}' and '{new_name}' exist. No action taken.")
