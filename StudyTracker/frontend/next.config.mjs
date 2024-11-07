/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, {isServer}) => {
        if (!isServer) {
            config.resolve.fallback = {
                child_process: false,
                fs: false,
                net: false,
                tls:false,
                dns:false,
                '@napi-rs/snappy': false,
                'timers/promises': false,
            };
        }
        return config;
    },
};

export default nextConfig;
