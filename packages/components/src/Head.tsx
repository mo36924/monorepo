import type { PropsWithChildren } from "react";

export const Head = (props: PropsWithChildren<{ prefix?: "website" | "article" }>) => (
  <head
    prefix={props.prefix && `og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/${props.prefix}#`}
  >
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <link rel="icon" type="image/x-icon" href={typeof FAVICON_ICO === "string" ? FAVICON_ICO : "/favicon.ico"} />
    {props.children}
    <script src={typeof ENTRY_MODULE === "string" ? ENTRY_MODULE : "/index.js"} type="module" />
    <script src={typeof ENTRY_NO_MODULE === "string" ? ENTRY_NO_MODULE : "/index.system.js"} noModule defer />
  </head>
);
