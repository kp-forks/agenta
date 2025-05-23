import {DrawerProps} from "antd"

import {EnhancedObjectConfig} from "@/oss/lib/shared/variant/genericTransformer/types"
import {AgentaConfigPrompt, EnhancedVariant} from "@/oss/lib/shared/variant/transformer/types"

type DrawerType = "variant" | "deployment"
type DrawerVariant = EnhancedVariant<EnhancedObjectConfig<AgentaConfigPrompt>>
interface Revert {
    isDisabled?: boolean
    onClick: () => void
    isLoading: boolean
}

export type ViewType = "prompt" | "parameters"

export interface VariantDrawerProps extends DrawerProps {
    onClose?: (arg: any) => void
    variants: DrawerVariant[]
    type: DrawerType
    revert?: Revert
}

export interface VariantDrawerTitleProps {
    selectedVariant: DrawerVariant
    onClose: () => void
    variants: DrawerVariant[]
    isDirty: boolean
    isLoading: boolean
    selectedDrawerVariant?: EnhancedVariant<EnhancedObjectConfig<AgentaConfigPrompt>>
    viewAs: ViewType
}

export interface VariantDrawerContentProps {
    selectedVariant: DrawerVariant
    promptIds: string[]
    isLoading: boolean
    variants: DrawerVariant[]
    type: DrawerType
    onChangeViewAs: (view: ViewType) => void
}

export interface DeploymentDrawerTitleProps {
    selectedVariant: DrawerVariant
    onClose: () => void
    revert?: Revert
    isLoading: boolean
}
