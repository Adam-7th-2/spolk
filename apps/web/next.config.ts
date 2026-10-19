import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  experimental:{serverActions:{bodySizeLimit:"32mb"}},
  serverExternalPackages:["@electric-sql/pglite"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  distDir: process.env.SPOLK_NEXT_OUTPUT || ".next",
  async headers() { return [{ source: "/(.*)", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" }
  ] }]; }
};
export default config;
