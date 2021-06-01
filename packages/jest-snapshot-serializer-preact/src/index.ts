import { isValidElement, VNode } from "preact";
import render from "preact-render-to-string/dist/jsx";

export function test(value: any) {
  return isValidElement(value) && "type" in value && "props" in value && "key" in value && "ref" in value;
}

export function serialize(value: VNode) {
  return render(value);
}
