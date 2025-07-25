import {ChangeEvent, memo, useCallback} from "react"

import {Input} from "antd"

import LabelInput from "@/oss/components/ModelRegistry/assets/LabelInput"
import {useDebounceInput} from "@/oss/hooks/useDebounceInput"

import {SimpleInputProps} from "./types"

/**
 * Debounced controlled input for string values.
 * Renders either a labeled input or a standard input based on the `as` prop.
 */

const SimpleInput = ({
    value,
    placeholder,
    onChange,
    className,
    disabled,
    as,
    label,
    view,
    withTooltip,
    description,
    editorProps,
    ...props
}: SimpleInputProps) => {
    const [localValue, setLocalValue] = useDebounceInput<string>(value, onChange, 300, "")

    const handleLocalValueChange = useCallback(
        (value: ChangeEvent<HTMLInputElement>) => {
            setLocalValue(value.target.value)
        },
        [setLocalValue],
    )

    const change = useCallback(
        (value: string) => {
            onChange(value)
        },
        [onChange],
    )

    if (as === "SimpleInputWithLabel") {
        return (
            <LabelInput
                placeholder={placeholder}
                label={label}
                value={localValue}
                onChange={handleLocalValueChange}
                disabled={disabled}
                className={className}
                multiLine
            />
        )
    }

    return (
        <Input
            {...props}
            value={value}
            onChange={change}
            className={className}
            view={view}
            description={description}
            placeholder={placeholder}
            tooltip={withTooltip ? description : undefined}
            disabled={disabled}
            {...(editorProps || {})}
            {...(disabled
                ? {
                      state: "disabled",
                  }
                : {})}
        />
    )
}

export default memo(SimpleInput)
