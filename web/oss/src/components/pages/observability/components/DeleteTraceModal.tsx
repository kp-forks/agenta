import {useState} from "react"

import {DeleteOutlined} from "@ant-design/icons"
import {Modal} from "antd"

import {useObservabilityData} from "@/oss/contexts/observability.context"
import {deleteTrace} from "@/oss/services/observability/core"

type DeleteTraceModalProps = {
    setSelectedTraceId: (val: string) => void
    activeTraceNodeId: string
} & React.ComponentProps<typeof Modal>

const DeleteTraceModal = ({
    setSelectedTraceId,
    activeTraceNodeId,
    ...props
}: DeleteTraceModalProps) => {
    const {fetchTraces} = useObservabilityData()
    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async () => {
        try {
            setIsLoading(true)
            await deleteTrace(activeTraceNodeId)
            fetchTraces()
            setSelectedTraceId("")
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <Modal
            centered
            destroyOnHidden
            width={380}
            title={"Are you sure you want to delete?"}
            okButtonProps={{icon: <DeleteOutlined />, danger: true, loading: isLoading}}
            okText={"Delete"}
            onOk={handleDelete}
            {...props}
        >
            This action is not reversible.
        </Modal>
    )
}

export default DeleteTraceModal
