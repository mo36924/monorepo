import { watch, watchFile, promises, unwatchFile, readFileSync } from "fs";
import { resolve } from "path";

const { readFile } = promises;
const cache: { [path: string]: string } = Object.create(null);

export default (path: string, callback: (data: string) => void) => {
  path = resolve(path);

  const _watch = () => {
    try {
      const watcher = watch(path, async () => {
        try {
          const data = await readFile(path, "utf8");

          if (cache[path] !== data) {
            cache[path] = data;
            callback(data);
          }
        } catch {
          watcher.close();
          _watchFile();
        }
      });
    } catch {
      _watchFile();
    }
  };

  const _watchFile = () =>
    watchFile(path, async () => {
      try {
        const data = await readFile(path, "utf8");
        unwatchFile(path);
        _watch();

        if (cache[path] !== data) {
          cache[path] = data;
          callback(data);
        }
      } catch {}
    });

  _watch();
};
