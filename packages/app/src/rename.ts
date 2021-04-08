import { parse, traverse, types as t } from "@babel/core";
import type { OutputChunk, RollupOutput } from "rollup";
import hash from "./hash";

type Chunk = { fileName: string; code: string };
type Chunks = Chunk[];
type Sources = { start: number; end: number; value: string }[];
type ChunkWithSources = (Chunk & { sources: Sources })[];

const getChunks = ({ output }: RollupOutput) => {
  if (!output[0].isEntry) {
    throw new Error("The first chunk is not an entry file");
  }

  return output
    .filter((chunk): chunk is OutputChunk => chunk.type === "chunk")
    .map(({ fileName, code }) => ({ fileName, code }));
};

const getHashes = (chunks: Chunks) =>
  Object.fromEntries(chunks.map(({ fileName, code }) => [fileName, `${hash(code)}.js`]));

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

  return sources;
};

const getChunkWithSources = (chunks: Chunks) =>
  chunks.map(({ fileName, code }) => ({ fileName, code, sources: getSources(code) }));

const renameChunkWithSources = (chunkWithSources: ChunkWithSources) => {
  const hashes = getHashes(chunkWithSources);
  return chunkWithSources.map(({ fileName, code, sources }) => {
    let gap = 0;

    code = sources.reduce((code, source) => {
      const start = source.start + gap;
      const end = source.end + gap;
      const importSourceValue = source.value;
      const importSourceLength = end - start;
      const fileName = importSourceValue.replace(/^\.\//, "");
      const _importSourceValue = `./${hashes[fileName]}`;
      const _importSource = JSON.stringify(_importSourceValue);
      const _importSourceLength = _importSource.length;
      source.start = start;
      source.end = start + _importSourceLength;
      source.value = _importSourceValue;
      gap += _importSourceLength - importSourceLength;
      return `${code.slice(0, start)}${_importSource}${code.slice(end)}`;
    }, code);

    return { fileName: hashes[fileName], code, sources };
  });
};

const renameChunkNames = (rollupOutput: RollupOutput) => {
  const chunks = getChunks(rollupOutput);
  let chunkWithSources = getChunkWithSources(chunks);
  chunkWithSources = renameChunkWithSources(chunkWithSources);
  chunkWithSources = renameChunkWithSources(chunkWithSources);
  return chunkWithSources;
};

export default (rollupOutput: RollupOutput): [path: string, data: string][] => {
  const chunks = renameChunkNames(rollupOutput);
  return chunks.map((chunk) => [chunk.fileName, chunk.code]);
};
