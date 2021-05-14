import cache from "@mo36924/rollup-plugin-cache";

export default (caches: { [pathname: string]: string | Buffer }) => cache({ files: caches });
