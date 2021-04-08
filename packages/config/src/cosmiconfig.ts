import { cosmiconfigSync } from "cosmiconfig";

export default cosmiconfigSync("app").search()?.config ?? {};
