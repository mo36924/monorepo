import { clientUrl, cssUrl, iconUrl } from "@mo36924/config";
import type { PropsWithChildren } from "react";

const icon = <link rel="icon" type="image/x-icon" href={iconUrl} />;
const css = cssUrl ? <link rel="stylesheet" href={cssUrl} /> : null;
const script = clientUrl ? <script src={clientUrl} type="module" /> : null;

export const Head = (props: PropsWithChildren<{ prefix?: "website" | "article" }>) => (
  <head
    prefix={props.prefix && `og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/${props.prefix}#`}
  >
    {icon}
    {props.children}
    {css}
    {script}
  </head>
);
