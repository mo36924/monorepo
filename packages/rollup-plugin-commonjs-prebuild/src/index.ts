import { resolve } from "path";
import { fs } from "memfs";
import type { Plugin } from "rollup";
import webpack from "webpack";

type Files = { [name: string]: { code: string; map: string } };
const cache: { [key: string]: Promise<Files> } = Object.create(null);
const outputDir = resolve(".cache");

const webpackBuild = async (prebuild: string[][]) => {
  const chunkNames = [...new Set(prebuild.flat())];
  const files: Files = Object.create(null);

  for (let i = 0; i < prebuild.length; i++) {
    const packages = prebuild[i];
    const entry: { [name: string]: any } = Object.create(null);

    if (packages.length === 1) {
      const packageName = packages[0];
      entry[packageName] = packageName;
    } else {
      let chunkName = "chunk";

      while (chunkNames.includes(chunkName)) {
        chunkName = `_${chunkName}`;
      }

      chunkNames.push(chunkName);

      for (const packageName of packages) {
        entry[packageName] = { import: packageName, dependOn: chunkName };
      }

      entry[chunkName] = packages;
    }

    await new Promise<void>((_resolve, reject) => {
      const compiler = webpack({
        mode: "production",
        entry,
        output: {
          path: outputDir,
          filename: "[name].js",
          libraryTarget: "commonjs2",
          devtoolModuleFilenameTemplate(info: any) {
            return info.resourcePath.replace(/^webpack\//, `webpack/${i}/`);
          },
        },
        target: "node",
        devtool: "source-map",
        externals({ request }, callback) {
          if (!request || packages.includes(request) || request.startsWith(".")) {
            callback();
          } else {
            callback(undefined, { commonjs2: request });
          }
        },
      });

      compiler.outputFileSystem = fs as any;

      compiler.run((err) => {
        if (err) {
          reject(err);
          return;
        }

        compiler.close((err) => {
          if (err) {
            reject(err);
            return;
          }

          _resolve();
        });
      });
    });

    for (const packageName of Object.keys(entry)) {
      const id = `${resolve(outputDir, packageName)}.js`;
      const mapId = `${id}.map`;

      files[id] = {
        code: fs.readFileSync(id, "utf8") as string,
        map: fs.existsSync(mapId) ? (fs.readFileSync(mapId, "utf8") as string) : `{"mappings":""}`,
      };
    }
  }

  return files;
};

export default (options: { prebuild?: (string | string[])[]; cache?: boolean } = {}): Plugin => {
  const prebuild = (options.prebuild || [])
    .map((packages) => (typeof packages === "string" ? [packages] : [...packages].sort()))
    .filter((packages) => packages.length > 0)
    .map((packages) => JSON.stringify(packages))
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((value) => JSON.parse(value) as string[]);

  if (!prebuild.length) {
    return { name: "commonjs-prebuild" };
  }

  const packages = [...new Set(prebuild.flat())];
  let files: Files = Object.create(null);

  return {
    name: "commonjs-prebuild",
    async buildStart() {
      if (options.cache) {
        files = await (cache[JSON.stringify(prebuild)] ??= webpackBuild(prebuild));
      } else {
        files = await webpackBuild(prebuild);
      }
    },
    async resolveId(source, importer) {
      if (importer != null && files[importer] && source[0] === ".") {
        return resolve(importer, "..", source);
      }

      if (packages.includes(source)) {
        const resolvedId = await this.resolve(source);

        if (resolvedId) {
          return { ...resolvedId, id: `${resolve(outputDir, source)}.js` };
        }
      }
    },
    load(id) {
      return files[id];
    },
  };
};
