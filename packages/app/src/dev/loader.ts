import { once } from "events";
import { get, IncomingMessage } from "http";
import { fileURLToPath } from "url";
import { workerData } from "worker_threads";

type Resolve = (
  specifier: string,
  context: { parentURL?: string; conditions: string[] },
  defaultResolve: Resolve,
) => Promise<{ url: string }>;
type GetFormat = (url: string, context: { format: string }, defaultGetSource: GetFormat) => Promise<{ format: string }>;
type GetSource = (
  url: string,
  context: { format: string },
  defaultGetSource: GetSource,
) => Promise<{ source: string | Uint8Array }>;

const devServerUrl: "http://127.0.0.1:${devServerPort}" | null | undefined = workerData?.devServerUrl;
const filename = fileURLToPath(import.meta.url);
let resolve: Resolve | undefined = undefined;
let getFormat: GetFormat | undefined = undefined;
let getSource: GetSource | undefined = undefined;

if (devServerUrl) {
  resolve = async (specifier, context, defaultResolve) => {
    if (
      !context.parentURL?.includes("@mo36924/jsx-dev-runtime") &&
      (specifier === "react/jsx-dev-runtime" ||
        specifier === "react/jsx-dev-runtime.js" ||
        specifier === "react/jsx-runtime" ||
        specifier === "react/jsx-runtime.js")
    ) {
      return defaultResolve("@mo36924/jsx-dev-runtime", context, defaultResolve);
    }

    return defaultResolve(specifier, context, defaultResolve);
  };

  getFormat = async (url, context, defaultGetFormat) => {
    if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
      return { format: "module" };
    }

    return defaultGetFormat(url, context, defaultGetFormat);
  };

  getSource = async (url, context, defaultGetSource) => {
    if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
      const [res]: IncomingMessage[] = await once(get(devServerUrl + url.slice(7)), "response");
      const data: Buffer[] = [];

      for await (const chunk of res) {
        data.push(chunk);
      }

      const buffer = Buffer.concat(data);
      return { source: buffer };
    }

    return defaultGetSource(url, context, defaultGetSource);
  };
}

export { filename, resolve, getFormat, getSource };
