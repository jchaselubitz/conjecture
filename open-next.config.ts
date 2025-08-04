import { defineConfig } from "@open-next/cli";

export default defineConfig({
 // Enable Edge Runtime for better performance
 experimental: {
  // Enable edge runtime for all routes
  edgeRuntime: true,
 },
 // Optimize for Netlify
 platform: "netlify",
 // Bundle optimization settings
 bundle: {
  // Enable tree shaking
  treeShaking: true,
  // Optimize dependencies
  optimizeDeps: true,
 },
});
