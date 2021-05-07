import { watch } from "fs";
import { resolve } from "path";

type Listener = (absolutePath: string) => Promise<void> | void;
const watches = new Set<string>();
const listeners: Listener[] = [];

const add = (path: string) => {
  const absolutePath = resolve(path);

  if (watches.has(absolutePath)) {
    return;
  }

  try {
    const watcher = watch(absolutePath, async (event) => {
      if (event === "rename") {
        watcher.close();
        watches.delete(absolutePath);
        return;
      }

      for (const listener of listeners) {
        try {
          await listener(absolutePath);
        } catch {}
      }
    });

    watches.add(absolutePath);
  } catch {}
};

const onchange = (listener: Listener) => {
  listeners.push(listener);
};

export default { watches, listeners, add, onchange };
