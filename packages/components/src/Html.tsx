import type { ComponentChildren } from "preact";

export const Html = (props: { lang?: string; children?: ComponentChildren }) => <html {...props} />;
