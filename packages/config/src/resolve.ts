import { resolve } from "path";
import _resolve, { SyncOpts } from "resolve";
import extensions from "./extensions";

const cwd = process.cwd();

const clientOptions: SyncOpts = {
  basedir: cwd,
  extensions: extensions.client,
};

const serverOptions: SyncOpts = {
  basedir: cwd,
  extensions: extensions.server,
};

const client = (path: string) => {
  try {
    return _resolve.sync(resolve(path), clientOptions);
  } catch {}
};

const server = (path: string) => {
  try {
    return _resolve.sync(resolve(path), serverOptions);
  } catch {}
};

export default { client, server };
