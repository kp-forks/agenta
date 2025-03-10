import os
import logging
from typing import Dict, Optional

from oss.src.utils.common import isCloudEE
from oss.src.models.api.api_models import Image
from oss.src.models.db_models import AppVariantDB, DeploymentDB
from oss.src.services import db_manager, docker_utils
from docker.errors import DockerException

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


agenta_registry_repo = os.getenv("REGISTRY_REPO_NAME")


async def start_service(
    app_variant_db: AppVariantDB, project_id: str, env_vars: Dict[str, str]
) -> DeploymentDB:
    """
    Start a service.

    Args:
        app_variant_db (AppVariantDB): The app variant to start.
        project_id (str): The ID of the project the app variant belongs to.
        env_vars (Dict[str, str]): The environment variables to pass to the container.

    Returns:
        True if successful, False otherwise.
    """

    if isCloudEE():
        uri_path = f"{app_variant_db.project_id}/{app_variant_db.app.app_name}/{app_variant_db.base_name}"
        container_name = f"{app_variant_db.app.app_name}-{app_variant_db.base_name}-{app_variant_db.project_id}"
    else:
        uri_path = f"{app_variant_db.project_id}/{app_variant_db.app.app_name}/{app_variant_db.base_name}"
        container_name = f"{app_variant_db.app.app_name}-{app_variant_db.base_name}-{app_variant_db.project_id}"

    logger.debug("Starting service with the following parameters:")
    logger.debug(f"image_name: {app_variant_db.image.tags}")
    logger.debug(f"uri_path: {uri_path}")
    logger.debug(f"container_name: {container_name}")
    logger.debug(f"env_vars: {env_vars}")

    results = docker_utils.start_container(
        image_name=app_variant_db.image.tags,
        uri_path=uri_path,
        container_name=container_name,
        env_vars=env_vars,
    )

    uri = results["uri"]
    container_id = results["container_id"]
    container_name = results["container_name"]

    logger.info(
        f"Started Docker container for app variant {app_variant_db.app.app_name}/{app_variant_db.variant_name} at URI {uri}"
    )

    deployment = await db_manager.create_deployment(
        app_id=str(app_variant_db.app.id),
        project_id=project_id,
        container_name=container_name,
        container_id=container_id,
        uri=uri,
        status="running",
    )
    return deployment


async def remove_image(image: Image):
    """
    Remove a Docker image from the system.

    Args:
        image (Image): The Docker image to remove.

    Returns:
        None
    """
    try:
        if not isCloudEE() and image.deletable:
            docker_utils.delete_image(image.docker_id)
        logger.info(f"Image {image.docker_id} deleted")
    except RuntimeError as e:
        logger.error(f"Error deleting image {image.docker_id}: {e}")
        raise e


async def stop_service(deployment: DeploymentDB):
    """
    Stops the Docker container associated with the given deployment.

    Args:
        deployment (DeploymentDB): The deployment to stop.

    Returns:
        None
    """
    docker_utils.delete_container(deployment.container_id)
    logger.info(f"Container {deployment.container_id} deleted")


async def stop_and_delete_service(deployment: DeploymentDB):
    """
    Stop and delete a Docker container associated with a deployment.

    Args:
        deployment (DeploymentDB): The deployment object associated with the container.

    Returns:
        None
    """
    logger.debug(f"Stopping container {deployment.container_id}")
    container_id = deployment.container_id
    docker_utils.stop_container(container_id)
    logger.info(f"Container {container_id} stopped")
    docker_utils.delete_container(container_id)
    logger.info(f"Container {container_id} deleted")


async def validate_image(image: Image) -> bool:
    """
    Validates the given image by checking if it has tags, if the tags start with the registry name, and if the image exists in the list of Docker images.

    Args:
        image (Image): The image to be validated.

    Raises:
        ValueError: If the image tags are empty or do not start with the registry name.
        DockerException: If the image does not exist in the list of Docker images.
    """
    if image.tags in ["", None]:
        msg = "Image tags cannot be empty"
        logger.error(msg)
        raise ValueError(msg)

    if isCloudEE():
        image = Image(**image.model_dump())

    if not image.tags.startswith(agenta_registry_repo):
        raise ValueError(
            f"Image should have a tag starting with the registry name ({agenta_registry_repo})\n Image Tags: {image.tags}"
        )

    if image not in docker_utils.list_images():
        raise DockerException(
            f"Image {image.docker_id} with tags {image.tags} not found"
        )
    return True


def get_deployment_uri(uri: str) -> str:
    """
    Replaces localhost with the appropriate hostname in the given URI.

    Args:
        uri (str): The URI to be processed.

    Returns:
        str: The processed URI.
    """

    return uri.replace("http://localhost", "http://host.docker.internal")
