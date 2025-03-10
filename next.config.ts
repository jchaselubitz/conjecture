// Import the necessary modules
import { NextConfig } from "next";
import withPWA from "next-pwa";
/** @type {NextConfig} */

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NEXT_PUBLIC_CONTEXT === "development",
  // skipWaiting: false,
  // cacheOnFrontEndNav: true,
});

const config: NextConfig = {
  ...pwaConfig,
  images: {
    domains: ["conjecture.dev", "app.conjecture.dev"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
  // reactStrictMode: false,
  // logging: {
  //   fetches: {
  //     fullUrl: true,
  //   },
  // },
};

export default config;
