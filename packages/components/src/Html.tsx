import type { PropsWithChildren } from "react";

export const Html = (props: PropsWithChildren<{ lang?: string }>) => <html {...props} />;
