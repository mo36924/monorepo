import sleep from "@mo36924/sleep";

export default async <T>(fn: () => T | Promise<T>, count: number = 60, interval: number = 1000): Promise<T> => {
  let error: any;

  while (count--) {
    try {
      const result = await fn();
      return result;
    } catch (_error) {
      if (count) {
        await sleep(interval);
      } else {
        error = _error;
      }
    }
  }

  throw error;
};
