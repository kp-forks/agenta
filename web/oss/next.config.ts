import path from "path"

const isDevelopment = process.env.NODE_ENV === "development"

const COMMON_CONFIG = {
    output: "standalone",
    reactStrictMode: true,
    pageExtensions: ["ts", "tsx", "js", "jsx"],
    productionBrowserSourceMaps: true,
    images: {
        remotePatterns: [{hostname: "fps.cdnpk.net"}],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/apps",
                permanent: true,
            },
        ]
    },
    ...(!isDevelopment
        ? {
              transpilePackages: [
                  "@lobehub/ui",
                  "@lobehub/icons",
                  "@lobehub/fluent-emoji",
                  "rc-util",
                  "antd",
                  "rc-pagination",
                  "rc-picker",
                  "rc-tree",
                  "rc-input",
                  "rc-table",
                  "@ant-design/icons",
                  "@ant-design/icons-svg",
              ],
              webpack: (config, {webpack, isServer}) => {
                  const envs = {}
                  config.cache = false

                  Object.keys(process.env).forEach((env) => {
                      if (env.startsWith("NEXT_PUBLIC_")) {
                          envs[env] = process.env[env]
                      }
                  })

                  config.module.rules.push({
                      test: /\.d\.ts$/,
                      loader: "swc-loader",
                  })

                  if (!isServer) {
                      config.plugins.push(
                          new webpack.DefinePlugin({
                              "process.env": JSON.stringify(envs),
                          }),
                      )
                  }

                  return config
              },
          }
        : {
              transpilePackages: ["@lobehub/ui", "@lobehub/icons", "@lobehub/fluent-emoji"],
              experimental: {
                  turbo: {
                      root: path.resolve(__dirname, ".."),
                  },
              },
          }),
}

export default COMMON_CONFIG
