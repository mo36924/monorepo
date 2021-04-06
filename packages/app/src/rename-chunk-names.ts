import { createHash } from "crypto";
import { parse, traverse, types as t } from "@babel/core";
import base64url from "base64url";
import type { OutputChunk, RollupOutput } from "rollup";

export type Chunks = { isEntry: boolean; fileName: string; code: string }[];
type Sources = { start: number; end: number; value: string }[];
type ChunkWithSources = (Chunks[number] & { sources: Sources })[];

export const getChunks = ({ output }: RollupOutput) =>
  output
    .filter((chunk): chunk is OutputChunk => chunk.type === "chunk")
    .map(({ isEntry, fileName, code }) => ({ isEntry, fileName, code }));

const getHashes = (chunks: Chunks) =>
  Object.fromEntries(
    chunks.map(({ fileName, code }) => [
      `./${fileName}`,
      `${base64url(createHash("sha256").update(code).digest("base64"))}.js`,
    ]),
  );

const getSources = (code: string) => {
  const ast = parse(code, { sourceType: "module", babelrc: false, configFile: false });
  const sources: Sources = [];

  traverse(ast, {
    enter({ node, parent }) {
      if (
        (t.isImportDeclaration(node) || t.isExportAllDeclaration(node) || t.isExportNamedDeclaration(node)) &&
        node.source?.start != null &&
        node.source?.end != null
      ) {
        const { start, end, value } = node.source;
        sources.push({ start, end, value });
      } else if (
        t.isImport(node) &&
        t.isCallExpression(parent) &&
        parent.arguments.length === 1 &&
        t.isStringLiteral(parent.arguments[0]) &&
        parent.arguments[0].start != null &&
        parent.arguments[0].end != null
      ) {
        const { start, end, value } = parent.arguments[0];
        sources.push({ start, end, value });
      }
    },
  });

  return sources.reverse();
};

const getChunkWithSources = (chunks: Chunks) =>
  chunks.map(({ isEntry, fileName, code }) => ({ isEntry, fileName, code, sources: getSources(code) }));

const renameChunkNames = (chunkWithSources: ChunkWithSources) => {
  const hashes = getHashes(chunkWithSources);
  return chunkWithSources.map(({ isEntry, fileName, code, sources }) => {
    code = sources.reduce((code, source) => {
      const { start, end, value } = source;
      const _value = JSON.stringify(`./${hashes[value]}`);
      source.end = start + _value.length;
      source.value = _value;
      return `${code.slice(0, start)}${_value}${code.slice(end)}`;
    }, code);

    return { isEntry, fileName: hashes[`./${fileName}`], code, sources };
  });
};

export default (rollupOutput: RollupOutput) => {
  const chunks = getChunks(rollupOutput);
  let chunkWithSources = getChunkWithSources(chunks);
  chunkWithSources = renameChunkNames(chunkWithSources);
  chunkWithSources = renameChunkNames(chunkWithSources);
  return chunkWithSources;
};
