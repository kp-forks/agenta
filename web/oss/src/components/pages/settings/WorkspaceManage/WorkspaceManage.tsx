import {useEffect, useMemo, useState, type FC} from "react"

import {GearSix, PencilSimple, Plus} from "@phosphor-icons/react"
import {Button, Input, Space, Spin, Table, Tag, Typography, message} from "antd"
import {ColumnsType} from "antd/es/table"
import {useAtom} from "jotai"
import dynamic from "next/dynamic"

import {useOrgData} from "@/oss/contexts/org.context"
import {useProfileData} from "@/oss/contexts/profile.context"
import {useQueryParam} from "@/oss/hooks/useQuery"
import {workspaceRolesAtom} from "@/oss/lib/atoms/organization"
import {formatDay} from "@/oss/lib/helpers/dateTimeHelper"
import {getUsernameFromEmail, isDemo} from "@/oss/lib/helpers/utils"
import {WorkspaceMember} from "@/oss/lib/Types"
import {updateOrganization} from "@/oss/services/organization/api"
import {fetchAllWorkspaceRoles, updateWorkspace} from "@/oss/services/workspace/api"

import AvatarWithLabel from "./assets/AvatarWithLabel"
import {Actions, Roles} from "./cellRenderers"

const InvitedUserLinkModal = dynamic(() => import("./Modals/InvitedUserLinkModal"), {ssr: false})
const InviteUsersModal = dynamic(() => import("./Modals/InviteUsersModal"), {ssr: false})

const WorkspaceManage: FC = () => {
    const {user: signedInUser} = useProfileData()
    const {selectedOrg, setSelectedOrg, loading, refetch} = useOrgData()
    const [searchTerm, setSearchTerm] = useState("")
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isInvitedUserLinkModalOpen, setIsInvitedUserLinkModalOpen] = useState(false)
    const [invitedUserData, setInvitedUserData] = useState<{email: string; uri: string}>({
        email: "",
        uri: "",
    })
    const setRoles = useAtom(workspaceRolesAtom)[1]
    const [queryInviteModalOpen, setQueryInviteModalOpen] = useQueryParam("inviteModal")

    const orgId = selectedOrg?.id
    const workspaceId = selectedOrg?.default_workspace?.id
    const workspace = selectedOrg?.default_workspace

    const [isEditingName, setIsEditingName] = useState(false)
    const [workspaceNameInput, setWorkspaceNameInput] = useState(workspace?.name || "")

    useEffect(() => {
        setWorkspaceNameInput(workspace?.name || "")
    }, [workspace?.name])

    const members = workspace?.members || []

    useEffect(() => {
        fetchAllWorkspaceRoles().then(setRoles).catch(console.error)
    }, [])

    const filteredMembers = useMemo(() => {
        if (searchTerm) {
            return members.filter((member) =>
                member.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }
        return members
    }, [members, searchTerm])

    const columns = useMemo(
        () =>
            (
                [
                    {
                        dataIndex: ["user", "username"],
                        key: "username",
                        title: "Name",
                        onHeaderCell: () => ({
                            style: {minWidth: 180},
                        }),
                        render: (_, member) => {
                            const {user} = member
                            const name = user.username || getUsernameFromEmail(user.email)
                            return (
                                <Space>
                                    <AvatarWithLabel name={name} />
                                    {user.email === signedInUser?.email && (
                                        <Tag color="processing">you</Tag>
                                    )}
                                </Space>
                            )
                        },
                    },
                    {
                        dataIndex: ["user", "email"],
                        key: "email",
                        title: "Email",
                    },
                    isDemo()
                        ? {
                              dataIndex: "roles",
                              key: "role",
                              title: "Roles",
                              render: (_, member) => (
                                  <Roles
                                      member={member}
                                      signedInUser={signedInUser!}
                                      orgId={orgId!}
                                      workspaceId={workspaceId!}
                                  />
                              ),
                          }
                        : null,
                    {
                        dataIndex: ["user", "created_at"],
                        key: "created_at",
                        title: "Creation Date",
                        onHeaderCell: () => ({
                            style: {minWidth: 160},
                        }),
                        render: (_, member) => {
                            const {user} = member

                            const isMember = !("status" in user) || user.status === "member"
                            let color = "warning"
                            let text = "Invitation Pending"
                            if (user.status === "expired") {
                                color = "error"
                                text = "Invitation Expired"
                            }
                            return (
                                <Space direction="vertical">
                                    <Typography.Text>
                                        {formatDay({date: user.created_at})}
                                    </Typography.Text>
                                    {!isMember && <Tag color={color}>{text}</Tag>}
                                </Space>
                            )
                        },
                    },
                    {
                        title: <GearSix size={16} />,
                        key: "key",
                        width: 56,
                        fixed: "right",
                        align: "center",
                        render: (_, member) => {
                            return (
                                <Actions
                                    member={member}
                                    hidden={
                                        member.user.email === signedInUser?.email ||
                                        member.user.id === selectedOrg?.owner
                                    }
                                    orgId={orgId!}
                                    workspaceId={workspaceId!}
                                    onResendInvite={(data: any) => {
                                        if (!isDemo() && data.uri) {
                                            setInvitedUserData(data)
                                            setIsInvitedUserLinkModalOpen(true)
                                        }
                                    }}
                                />
                            )
                        },
                    },
                ] as ColumnsType<WorkspaceMember>
            ).filter(Boolean),
        [selectedOrg?.id],
    )

    const handleSaveWorkspaceName = async () => {
        if (!workspaceId || !orgId) return
        try {
            await Promise.all([
                updateWorkspace({orgId, workspaceId, name: workspaceNameInput}),
                updateOrganization(orgId, workspaceNameInput),
            ])
            setSelectedOrg((prev) =>
                prev
                    ? {
                          ...prev,
                          name: workspaceNameInput,
                          default_workspace: {
                              ...prev.default_workspace,
                              name: workspaceNameInput,
                          },
                      }
                    : prev,
            )
            refetch()
            message.success("Workspace renamed")
            setIsEditingName(false)
        } catch (error) {
            console.error(error)
            message.error("Failed to rename workspace")
        }
    }

    return (
        <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2 group">
                {!isEditingName ? (
                    <>
                        <Typography.Text className="font-medium" data-cy="workspace-name">
                            {workspace?.name}
                        </Typography.Text>
                        <Button
                            type="text"
                            size="small"
                            className="opacity-0 group-hover:opacity-100"
                            icon={<PencilSimple size={14} />}
                            onClick={() => setIsEditingName(true)}
                        />
                    </>
                ) : (
                    <>
                        <Input
                            value={workspaceNameInput}
                            onChange={(e) => setWorkspaceNameInput(e.target.value)}
                            className="w-[250px]"
                            autoFocus
                        />
                        <Button type="primary" size="small" onClick={handleSaveWorkspaceName}>
                            Save
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                setIsEditingName(false)
                                setWorkspaceNameInput(workspace?.name || "")
                            }}
                        >
                            Cancel
                        </Button>
                    </>
                )}
            </div>
            <div className="flex items-center justify-between gap-2">
                <Input.Search
                    placeholder="Search"
                    className="w-[400px]"
                    allowClear
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Button
                    type="primary"
                    icon={<Plus size={14} className="mt-0.2" />}
                    onClick={() => setIsInviteModalOpen(true)}
                >
                    Invite members
                </Button>
            </div>

            <Spin spinning={loading}>
                <Table<WorkspaceMember>
                    dataSource={filteredMembers}
                    columns={columns}
                    pagination={false}
                    bordered
                    scroll={{x: true}}
                />
            </Spin>

            <InviteUsersModal
                setQueryInviteModalOpen={setQueryInviteModalOpen}
                open={queryInviteModalOpen === "open" || isInviteModalOpen}
                onCancel={() => setIsInviteModalOpen(false)}
                workspaceId={workspaceId!}
                onSuccess={(data) => {
                    if (!isDemo() && data?.uri) {
                        setInvitedUserData(data)
                        setIsInvitedUserLinkModalOpen(true)
                    }
                }}
            />
            {!isDemo() && (
                <InvitedUserLinkModal
                    open={isInvitedUserLinkModalOpen}
                    onCancel={() => {
                        setIsInvitedUserLinkModalOpen(false)
                        refetch()
                    }}
                    invitedUserData={invitedUserData}
                />
            )}
        </section>
    )
}

export default WorkspaceManage
