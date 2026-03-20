// This file exists to satisfy Next.js edge-runtime module resolution
// while proxy.ts handles the actual Node.js runtime middleware logic.
export { proxy as middleware, config } from "./proxy";
