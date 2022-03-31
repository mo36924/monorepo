import {
  ComponentType,
  FunctionComponent,
  LazyExoticComponent,
  ReactChild,
  ReactElement,
  ReactNode,
  ReactPortal,
  Suspense as _Suspense,
  lazy as _lazy,
  isValidElement,
} from "react";
import { jsx } from "react/jsx-runtime";

export const lazy: {
  <T extends ComponentType<any>>(factory: () => Promise<T | { default: T }>): LazyExoticComponent<T>;
  (factory: () => Promise<ReactElement<any, any> | null | undefined>): LazyExoticComponent<ComponentType<any>>;
} = (
  factory: () => Promise<ComponentType<any> | { default: ComponentType<any> } | ReactElement | null | undefined>,
): LazyExoticComponent<ComponentType<any>> =>
  _lazy(() =>
    factory().then((mod): { default: ComponentType<any> } => ({
      default: mod == null ? () => null : isValidElement(mod) ? () => mod : "default" in mod ? mod.default : mod,
    })),
  );

type LazyFragment = {} | Iterable<LazyNode>;

type LazyNode =
  | ReactChild
  | LazyFragment
  | ReactPortal
  | boolean
  | null
  | undefined
  | (() => Promise<ComponentType<any> | { default: ComponentType<any> } | ReactElement | null | undefined>);

const toReactNode = (lazyNode: LazyNode): ReactNode =>
  typeof lazyNode === "function"
    ? jsx(lazy(lazyNode as any), {})
    : lazyNode && typeof (lazyNode as Iterable<LazyNode>)[Symbol.iterator] === "function"
    ? [...(lazyNode as Iterable<LazyNode>)].map((node) => toReactNode(node))
    : (lazyNode as ReactNode);

export const Suspense: FunctionComponent<{ children?: LazyNode; fallback?: NonNullable<ReactNode> | null }> = ({
  children,
  fallback = null,
}) => jsx(_Suspense, { children: toReactNode(children), fallback });
