export const css = "/index.css";
export const module = "/index.js";
export const nomodule = "/index.system.js";
export const favicon = "data:image/x-icon;base64,";

if (typeof self !== "undefined") {
  throw new Error("@mo36924/entrypoint module is not available in the browser");
}
