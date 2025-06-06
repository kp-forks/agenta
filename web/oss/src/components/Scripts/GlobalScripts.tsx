import dynamic from "next/dynamic"
import Head from "next/head"
import Script from "next/script"

import {isDemo} from "@/oss/lib/helpers/utils"

const CloudScripts = dynamic(() => import("@/oss/components/Scripts/assets/CloudScripts"), {
    ssr: false,
})

const GlobalScripts = () => {
    if (isDemo()) {
        return <CloudScripts />
    }

    return (
        <>
            <Head>
                <title>Agenta: The LLMOps platform.</title>
                <link rel="shortcut icon" href="/assets/favicon.ico" />
            </Head>

            <Script src="/__env.js" strategy="beforeInteractive" />
        </>
    )
}

export default GlobalScripts
