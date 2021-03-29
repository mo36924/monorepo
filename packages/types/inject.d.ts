import type * as components from "@mo36924/components";
import type _hydrate from "@mo36924/hydrate";
import type { PromisePageModule as _PromisePageModule } from "@mo36924/page";
import type _pageMatch from "@mo36924/page-match";
import type _pages from "@mo36924/pages";
import type React from "react";
import type ReactDom from "react-dom";
import type ReactDomServer from "react-dom/server";

declare global {
  const { Body, Head, Html, Title } = components;
  const hydrate: typeof _hydrate;
  const pageMatch: typeof _pageMatch;
  const pages: typeof _pages;
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
  const render: typeof ReactDom.render;
  const unmountComponentAtNode: typeof ReactDom.unmountComponentAtNode;
  const renderToStaticMarkup: typeof ReactDomServer.renderToStaticMarkup;
  const renderToString: typeof ReactDomServer.renderToString;
  type PromisePageModule<T> = _PromisePageModule<T>;
  type ComponentType<T = {}> = React.ComponentType<T>;
}