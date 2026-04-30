import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devHelperModulePath = path.resolve(__dirname, "src/app/sign-in/[[...sign-in]]/dev-signin-helper.tsx");
const devHelperStubPath = path.resolve(__dirname, "src/app/sign-in/[[...sign-in]]/dev-signin-helper.stub.tsx");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (!dev) {
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        [devHelperModulePath]: devHelperStubPath
      };
    }
    return config;
  }
};

export default nextConfig;
