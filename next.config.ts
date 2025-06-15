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
            {
                protocol: "https",
                hostname: "raw.githubusercontent.com",
                port: '',
                pathname: '/rahulcodepython/file-storage/main/**',
            },
        ],

    },
};

export default nextConfig;
