const changestate = "changestate";

declare global {
  interface Window {
    onchangestate?: null | ((this: Window, ev: Event) => any);
  }
}

if (typeof window !== "undefined" && window.onchangestate === undefined) {
  window.onchangestate = null;

  const createEvent =
    typeof Event === "function"
      ? (type: string) => new Event(type)
      : (type: string) => {
          const event = document.createEvent("Event");
          event.initEvent(type, false, false);
          return event;
        };

  const events = ["pushState", "replaceState"] as const;
  const origin = location.origin + "/";

  events.forEach((method) => {
    const original = history[method].bind(history);
    const type = method.toLowerCase();

    history[method] = (...args) => {
      original(...args);
      dispatchEvent(createEvent(type));
    };
  });

  [...events, "popstate"].forEach((type) => {
    addEventListener(type.toLowerCase(), () => {
      const event = createEvent(changestate);
      dispatchEvent(event);

      if (typeof window.onchangestate === "function") {
        window.onchangestate(event);
      }
    });
  });

  addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button) {
      return;
    }

    let t: any = e.target;

    do {
      if (`${t.nodeName}`.toLowerCase() === "a") {
        if (t.hasAttribute("download") || t.getAttribute("rel") === "external") {
          return;
        }

        const url = t.href;

        if (url.startsWith(origin)) {
          e.preventDefault();
          history.pushState(null, "", url);
        }

        return;
      }
    } while ((t = t.parentNode));
  });
}

export default changestate;
