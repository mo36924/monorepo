import { resolve } from "path";
import { fs } from "memfs";
import type { Plugin, ResolvedId } from "rollup";
import webpack from "webpack";

export default (options: (string | string[])[] = []): Plugin => {
  const flatPackages = options.flat();

  if (!flatPackages.length) {
    return { name: "commonjs-prebuild" };
  }

  const _options = options
    .map((packages) => (typeof packages === "string" ? [packages] : packages))
    .filter((packages) => packages.length > 0);

  const resolvedIds: { [packageName: string]: ResolvedId | undefined } = Object.create(null);
  const files: { [name: string]: { code: string; map: string } } = Object.create(null);
  const outputDir = resolve(".cache");

  return {
    name: "commonjs-prebuild",
    async buildStart() {
      const chunkNames = [...flatPackages];

      for (let i = 0; i < _options.length; i++) {
        const packages = _options[i];
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

        for (const packageName of packages) {
          const resolvedId = await this.resolve(packageName);

          if (resolvedId) {
            const id = `${resolve(outputDir, packageName)}.js`;
            const _resolvedId = { ...resolvedId, id };
            resolvedIds[packageName] = _resolvedId;
          }
        }

        for (const packageName of Object.keys(entry)) {
          const id = `${resolve(outputDir, packageName)}.js`;
          const mapId = `${id}.map`;

          files[id] = {
            code: fs.readFileSync(id, "utf8") as string,
            map: fs.existsSync(mapId) ? (fs.readFileSync(mapId, "utf8") as string) : `{"mappings":""}`,
          };
        }
      }
    },
    resolveId(source, importer) {
      if (importer != null && files[importer] && source[0] === ".") {
        return resolve(importer, "..", source);
      }

      return resolvedIds[source];
    },
    load(id) {
      return files[id];
    },
  };
};
