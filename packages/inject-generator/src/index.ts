import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import prettier from "prettier";

type Options = {
  path?: string;
};

const inject = `
import type React from "react";
import type ReactDom from "react-dom";
import type ReactDomServer from "react-dom/server";

declare global {
  const changestate: "changestate";
  const Children: typeof React.Children;
  const Component: typeof React.Component;
  const Fragment: typeof React.Fragment;
  const PureComponent: typeof React.PureComponent;
  const StrictMode: typeof React.StrictMode;
  const Suspense: typeof React.Suspense;
  const cloneElement: typeof React.cloneElement;
  const createContext: typeof React.createContext;
  const createElement: typeof React.createElement;
  const createFactory: typeof React.createFactory;
  const createRef: typeof React.createRef;
  const forwardRef: typeof React.forwardRef;
  const isValidElement: typeof React.isValidElement;
  const lazy: typeof React.lazy;
  const memo: typeof React.memo;
  const useCallback: typeof React.useCallback;
  const useContext: typeof React.useContext;
  const useDebugValue: typeof React.useDebugValue;
  const useEffect: typeof React.useEffect;
  const useImperativeHandle: typeof React.useImperativeHandle;
  const useLayoutEffect: typeof React.useLayoutEffect;
  const useMemo: typeof React.useMemo;
  const useReducer: typeof React.useReducer;
  const useRef: typeof React.useRef;
  const useState: typeof React.useState;
  const createPortal: typeof ReactDom.createPortal;
  const findDOMNode: typeof ReactDom.findDOMNode;
  const hydrate: typeof ReactDom.hydrate;
  const render: typeof ReactDom.render;
  const unmountComponentAtNode: typeof ReactDom.unmountComponentAtNode;
  const renderToStaticMarkup: typeof ReactDomServer.renderToStaticMarkup;
  const renderToString: typeof ReactDomServer.renderToString;
  type ComponentType<T = {}> = React.ComponentType<T>;
}
`;

let formatted = "";

export default async (options: Options = {}) => {
  const path = options.path ?? "inject.d.ts";

  if (!formatted) {
    const prettierConfig = await prettier.resolveConfig(path);
    formatted = prettier.format(inject, { ...prettierConfig, filepath: path });
  }

  try {
    await writeFile(path, formatted);
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, formatted);
  }
};