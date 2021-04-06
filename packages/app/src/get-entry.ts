import type { Chunks } from "./rename-chunk-names";

export default (chunks: Chunks) => chunks.find(({ isEntry }) => isEntry)?.fileName;
