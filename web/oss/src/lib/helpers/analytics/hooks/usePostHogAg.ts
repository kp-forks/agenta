import {useCallback} from "react"

import {useAtom} from "jotai"
import {type PostHog} from "posthog-js"

import {useProfileData} from "@/oss/contexts/profile.context"
import useIsomorphicLayoutEffect from "@/oss/hooks/useIsomorphicLayoutEffect"
import {isDemo, generateOrRetrieveDistinctId} from "@/oss/lib/helpers/utils"

import {posthogAtom} from "../store/atoms"

interface ExtendedPostHog extends PostHog {
    identify: PostHog["identify"]
    capture: PostHog["capture"]
}

export const usePostHogAg = (): ExtendedPostHog | null => {
    const trackingEnabled = process.env.NEXT_PUBLIC_TELEMETRY_TRACKING_ENABLED === "true"
    const {user} = useProfileData()
    const [posthog] = useAtom(posthogAtom)

    const _id: string | undefined = isDemo() ? user?.email : generateOrRetrieveDistinctId()
    const capture: PostHog["capture"] = useCallback(
        (...args) => {
            if (trackingEnabled && user?.id) {
                return posthog?.capture?.(...args)
            }
            return undefined
        },
        [posthog, trackingEnabled, user?.id],
    )
    const identify: PostHog["identify"] = useCallback(
        (id, ...args) => {
            if (trackingEnabled && user?.id) {
                posthog?.identify?.(_id !== undefined ? _id : id, ...args)
            }
        },
        [_id, posthog, trackingEnabled, user?.id],
    )
    useIsomorphicLayoutEffect(() => {
        if (!posthog) return

        if (!trackingEnabled) {
            posthog.opt_out_capturing()
        }
    }, [posthog, trackingEnabled])

    useIsomorphicLayoutEffect(() => {
        if (!posthog) return
        if (posthog.get_distinct_id() !== _id) identify()
    }, [posthog, _id])

    return Object.assign({}, posthog, {identify, capture}) as ExtendedPostHog
}
