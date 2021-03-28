import type { PropsWithChildren } from "react";

export const Head = (props: PropsWithChildren<{ prefix?: "website" | "article" }>) => (
  <head
    prefix={props.prefix && `og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/${props.prefix}#`}
  >
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    {props.children}
    <script src="/index.js" type="module"></script>
    <script src="/index.system.js" noModule defer></script>
  </head>
);
