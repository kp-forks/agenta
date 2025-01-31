import {useCallback} from "react"

import clsx from "clsx"

import AddButton from "@/components/NewPlayground/assets/AddButton"
import {componentLogger} from "@/components/NewPlayground/assets/utilities/componentLogger"
import usePlayground from "@/components/NewPlayground/hooks/usePlayground"
import {createInputRow} from "@/components/NewPlayground/hooks/usePlayground/assets/inputHelpers"
import GenerationCompletionRow from "../GenerationCompletionRow"
import {getMetadataLazy} from "@/components/NewPlayground/state"

import type {GenerationCompletionProps} from "./types"
import type {PlaygroundStateData} from "@/components/NewPlayground/hooks/usePlayground/types"
import type {
    ArrayMetadata,
    ObjectMetadata,
} from "@/components/NewPlayground/assets/utilities/genericTransformer/types"
import {findPropertyInObject} from "@/lib/hooks/useStatelessVariant/assets/helpers"

const GenerationCompletion = ({
    className,
    variantId,
    rowClassName,
    rowId,
    withControls,
}: GenerationCompletionProps) => {
    const {inputRowIds, mutate, viewType} = usePlayground({
        variantId,
        registerToWebWorker: true,
        stateSelector: useCallback(
            (state: PlaygroundStateData) => {
                const selectedVariants = state.selected.length > 1
                const inputRowId = findPropertyInObject(state, rowId)
                const inputRows = state.generationData.inputs.value || []

                const rowIds = selectedVariants
                    ? inputRows.map((inputRow) => inputRow.__id)
                    : [inputRowId?.__id]
                return {inputRowIds: rowIds}
            },
            [rowId, variantId],
        ),
    })

    const addNewInputRow = useCallback(() => {
        mutate((clonedState) => {
            if (!clonedState) return clonedState

            const _metadata = getMetadataLazy<ArrayMetadata>(
                clonedState?.generationData.inputs.__metadata,
            )

            const itemMetadata = _metadata?.itemMetadata as ObjectMetadata

            if (!itemMetadata) return clonedState

            const inputKeys = Object.keys(itemMetadata.properties)
            const newRow = createInputRow(inputKeys, itemMetadata)

            clonedState.generationData.inputs.value.push(newRow)

            return clonedState
        })
    }, [mutate])

    componentLogger("GenerationTestView", inputRowIds)

    return (
        <div className={clsx(["flex flex-col", {"gap-2": viewType === "single"}], className)}>
            {inputRowIds.map((inputRowId) => {
                return (
                    <GenerationCompletionRow
                        key={inputRowId}
                        variantId={variantId}
                        rowId={inputRowId}
                        className={rowClassName}
                    />
                )
            })}

            {withControls ? (
                <div
                    className={clsx([
                        "flex items-center gap-2 mx-4 mt-2",
                        {"mb-10": viewType !== "comparison"},
                    ])}
                >
                    <AddButton size="small" label="Input" onClick={addNewInputRow} />
                </div>
            ) : null}
        </div>
    )
}

export default GenerationCompletion
