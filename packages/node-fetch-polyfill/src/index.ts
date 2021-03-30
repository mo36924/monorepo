import _fetch, {
  Headers as _Headers,
  Request as _Request,
  RequestInfo as _RequestInfo,
  RequestInit as _RequestInit,
  Response as _Response,
} from "node-fetch";

if (!globalThis.fetch) {
  const __fetch = (url: _RequestInfo, init?: _RequestInit) => {
    if (typeof url === "string") {
      url = new URL(url, __fetch.url).href;
    } else if ("url" in url) {
      url = new _Request(new URL(url.url, __fetch.url).href, url);
    } else {
      url = url.href;
    }

    return _fetch(url, init);
  };

  __fetch.url = new URL(`http://127.0.0.1:${process.env.PORT || 3000}/`);
  (globalThis as any).fetch = __fetch;
  (globalThis as any).Headers = _Headers;
  (globalThis as any).Request = _Request;
  (globalThis as any).Response = _Response;
}
