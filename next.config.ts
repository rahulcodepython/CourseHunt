import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ik.imagekit.io",
                port: '',
                pathname: '/egg4kxv60/**',
            },
        ],
    },
};

export default nextConfig;
