import { createHash } from "crypto";
import base64url from "@mo36924/base64url";

export default (data: string | Buffer) => base64url(createHash("sha256").update(data).digest("base64"));
