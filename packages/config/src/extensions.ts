import cosmiconfig from "./cosmiconfig";

const client: string[] = cosmiconfig.extensions?.client ?? [
  ".client.tsx",
  ".client.jsx",
  ".client.ts",
  ".client.mjs",
  ".client.js",
  ".client.cjs",
  ".client.json",
  ".tsx",
  ".jsx",
  ".ts",
  ".mjs",
  ".js",
  ".cjs",
  ".json",
];

const server: string[] = cosmiconfig.extensions?.server ?? [
  ...client.map((extname) => extname.replace("client", "server")),
  ".node",
];

export default { client, server };
