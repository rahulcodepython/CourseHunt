import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    async rewrites() {
        return [
            {
                source: "/api/v1/:path*",
                destination: "http://localhost:8080/api/v1/:path*",
            },
        ];
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "ik.imagekit.io", port: "", pathname: "/egg4kxv60/**" },
            { protocol: "https", hostname: "raw.githubusercontent.com", port: "", pathname: "/rahulcodepython/file-storage/main/**" },
            { protocol: "https", hostname: "lh3.googleusercontent.com", port: "", pathname: "/**" },
        ],
    },
};

export default nextConfig;
