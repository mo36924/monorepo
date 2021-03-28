import { createRequire } from "module";
import { join } from "path";
import process from "process";
import type { ConfigAPI, default as babel, TransformOptions } from "@babel/core";
// @ts-ignore
import constant from "@babel/plugin-transform-react-constant-elements";
import env, { Options as envOptions } from "@babel/preset-env";
// @ts-ignore
import react from "@babel/preset-react";
// @ts-ignore
import typescript from "@babel/preset-typescript";
import commonjs, { Options as commonjsOptions } from "@mo36924/babel-plugin-commonjs";
import deadCodeElimination from "@mo36924/babel-plugin-dead-code-elimination";
import iifeUnwrap from "@mo36924/babel-plugin-iife-unwrap";
import inject, { Options as injectOptions } from "@mo36924/babel-plugin-inject";
import jsxDev from "@mo36924/babel-plugin-jsx-development";
import replace from "@mo36924/babel-plugin-replace";
import resolve, { Options as resolveOptions } from "@mo36924/babel-plugin-resolve";
import subpath from "@mo36924/babel-plugin-resolve-subpath";

const _require = createRequire(join(process.cwd(), "index.js"));

type Api = ConfigAPI & typeof babel;

export type Options = {
  env?: "production" | "development" | "test";
  target?: "client" | "server";
  nomodule?: boolean;
  jsx?: "react" | "preact";
  inject?: injectOptions;
  exports?: commonjsOptions;
};

const { NODE_ENV, NODE_TARGET, NODE_NOMODULE } = process.env;

export default (_api: Api, options: Options): TransformOptions => {
  const {
    env: __ENV__ = NODE_ENV ?? "production",
    target: __TARGET__ = NODE_TARGET ?? "server",
    nomodule = NODE_NOMODULE !== "false" && !!NODE_NOMODULE,
    jsx = "react",
    inject: _inject = {},
    exports = {},
  } = options;

  if (jsx === "react") {
    for (const mod of [
      "react",
      "react-dom",
      "react-dom/server",
      "react-dom/server.browser",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ]) {
      try {
        exports[mod] = Object.keys(_require(mod));
      } catch {}
    }
  }

  const __PROD__ = __ENV__ === "production" || undefined;
  const __DEV__ = __ENV__ === "development" || undefined;
  const __TEST__ = __ENV__ === "test" || undefined;
  const __SERVER__ = __TARGET__ === "server" || undefined;
  const __CLIENT__ = !__SERVER__ || undefined;
  const __NOMODULE__ = (__CLIENT__ && nomodule) || undefined;

  return {
    presets: [
      [
        env,
        {
          bugfixes: true,
          modules: false,
          loose: false,
          ignoreBrowserslistConfig: true,
          targets: __SERVER__
            ? {
                node: true,
              }
            : __NOMODULE__
            ? {
                android: "4.4",
                chrome: "41",
                edge: "16",
                firefox: "60",
                ie: "11",
                ios: "10.3",
                opera: "48",
                safari: "10.1",
                samsung: "8.2",
              }
            : {
                esmodules: true,
              },
          useBuiltIns: false,
        } as envOptions,
      ],
      [typescript],
      [
        react,
        {
          runtime: "automatic",
          development: __DEV__,
          importSource: jsx,
        },
      ],
    ],
    plugins: [
      [
        replace,
        {
          "typeof self": __SERVER__ ? '"undefined"' : '"object"',
          "typeof global": __SERVER__ ? '"object"' : '"undefined"',
          "typeof process": '"object"',
          "process.env.NODE_ENV": `"${__ENV__}"`,
          __ENV__: `"${__ENV__}"`,
          __TARGET__: `"${__TARGET__}"`,
          __PROD__,
          __DEV__,
          __TEST__,
          __SERVER__,
          __CLIENT__,
          __NOMODULE__,
          ...(__NOMODULE__ ? {} : { "typeof Event": __SERVER__ ? '"undefined"' : '"function"' }),
          ...(__SERVER__ && { "typeof window": '"undefined"' }),
        },
      ],
      [deadCodeElimination],
      [iifeUnwrap],
      [
        resolve,
        {
          ignoreBuiltins: __SERVER__,
          ignoreBareImport: __SERVER__,
          aliasFields: __SERVER__ ? [] : ["browser"],
          mainFields: __SERVER__ ? ["module", "main"] : ["browser", "module", "main"],
          conditionNames: __SERVER__ ? ["import", "require"] : ["browser", "import", "require"],
          extensions: __SERVER__
            ? [
                ".server.tsx",
                ".server.ts",
                ".server.jsx",
                ".server.mjs",
                ".server.js",
                ".server.cjs",
                ".server.json",
                ".tsx",
                ".ts",
                ".jsx",
                ".mjs",
                ".js",
                ".cjs",
                ".json",
                ".node",
              ]
            : [
                ".client.tsx",
                ".client.ts",
                ".client.jsx",
                ".client.mjs",
                ".client.js",
                ".client.cjs",
                ".client.json",
                ".tsx",
                ".ts",
                ".jsx",
                ".mjs",
                ".js",
                ".cjs",
                ".json",
                ".node",
              ],
          alias:
            jsx === "preact"
              ? {
                  react: "preact/compat",
                  "react-dom": "preact/compat",
                }
              : {},
        } as resolveOptions,
      ],
      [subpath, __SERVER__ ? {} : false],
      [commonjs, __SERVER__ ? false : exports],
      [
        inject,
        {
          declarations: {
            ..._inject.declarations,
            changestate: ["@mo36924/changestate", "default"],
            pageMatch: ["@mo36924/page-match", "default"],
            pages: ["@mo36924/pages", "default"],
            Children: ["react", "Children"],
            Component: ["react", "Component"],
            Fragment: ["react", "Fragment"],
            PureComponent: ["react", "PureComponent"],
            StrictMode: ["react", "StrictMode"],
            Suspense: ["react", "Suspense"],
            cloneElement: ["react", "cloneElement"],
            createContext: ["react", "createContext"],
            createElement: ["react", "createElement"],
            createFactory: ["react", "createFactory"],
            createRef: ["react", "createRef"],
            forwardRef: ["react", "forwardRef"],
            isValidElement: ["react", "isValidElement"],
            lazy: ["@mo36924/react-lazy", "default"],
            memo: ["react", "memo"],
            useCallback: ["react", "useCallback"],
            useContext: ["react", "useContext"],
            useDebugValue: ["react", "useDebugValue"],
            useEffect: ["react", "useEffect"],
            useImperativeHandle: ["react", "useImperativeHandle"],
            useLayoutEffect: ["react", "useLayoutEffect"],
            useMemo: ["react", "useMemo"],
            useReducer: ["react", "useReducer"],
            useRef: ["react", "useRef"],
            useState: ["react", "useState"],
            createPortal: ["react-dom", "createPortal"],
            findDOMNode: ["react-dom", "findDOMNode"],
            hydrate: ["react-dom", "hydrate"],
            render: ["react-dom", "render"],
            unmountComponentAtNode: ["react-dom", "unmountComponentAtNode"],
            renderToStaticMarkup: ["react-dom/server", "renderToStaticMarkup"],
            renderToString: ["react-dom/server", "renderToString"],
          },
        } as injectOptions,
      ],
      [jsxDev, __PROD__ ? false : {}],
      [constant, __PROD__ ? {} : false],
    ],
  };
};
