import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    allowedDevOrigins: ['localhost', 'coursehunt.localhost'],
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "ik.imagekit.io", port: "", pathname: "/egg4kxv60/**" },
            { protocol: "https", hostname: "raw.githubusercontent.com", port: "", pathname: "/rahulcodepython/file-storage/main/**" },
            { protocol: "https", hostname: "lh3.googleusercontent.com", port: "", pathname: "/**" },
            { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
            { protocol: "https", hostname: "avatars.githubusercontent.com", port: "", pathname: "/**" },
            { protocol: "https", hostname: "avatar.vercel.sh", port: "", pathname: "/**" },
        ],
    },
};

export default nextConfig;
