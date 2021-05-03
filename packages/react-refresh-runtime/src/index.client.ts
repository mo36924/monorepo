import { components } from "./components";

if (typeof EventSource === "function") {
  const sse = new EventSource("/sse");
  let i = 0;

  sse.onmessage = (e) => {
    const pathname = new URL(JSON.parse(e.data)).pathname;

    if (components.has(pathname)) {
      import(`${pathname}?${i++}`);
    }
  };
}

export { components };
