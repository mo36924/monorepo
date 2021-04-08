import { css, favicon, module, nomodule } from "@mo36924/config";
import type { PropsWithChildren } from "react";

export const Head = (props: PropsWithChildren<{ prefix?: "website" | "article" }>) => (
  <head
    prefix={props.prefix && `og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/${props.prefix}#`}
  >
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <link rel="icon" type="image/x-icon" href={favicon} />
    {props.children}
    <link rel="stylesheet" href={css} />
    <script src={module} type="module" />
    <script src={nomodule} noModule defer />
  </head>
);
