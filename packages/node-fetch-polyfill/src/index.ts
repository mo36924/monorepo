import _fetch, {
  Headers as _Headers,
  Request as _Request,
  RequestInfo as _RequestInfo,
  RequestInit as _RequestInit,
  Response as _Response,
} from "node-fetch";

let _baseUrl: string = `http://127.0.0.1:${process.env.PORT || 3000}`;

export const getBaseUrl = () => _baseUrl;

export const setBaseUrl = (url: string) => {
  _baseUrl = url;
};

if (!globalThis.fetch) {
  const __fetch = (url: _RequestInfo, init?: _RequestInit) => {
    if (typeof url === "string") {
      url = new URL(url, _baseUrl);
    } else if ("url" in url) {
      url = new _Request(new URL(url.url, _baseUrl), init);
    }

    return _fetch(url, init);
  };

  (globalThis as any).fetch = __fetch;
  (globalThis as any).Headers = _Headers;
  (globalThis as any).Request = _Request;
  (globalThis as any).Response = _Response;
}
