import type { JSX as _JSX } from "preact";

type Element = {
  type:
    | string
    | ((
        props: any,
        context: any,
      ) => Element | null | Promise<Element | null> | Generator<Element | null> | AsyncGenerator<Element | null>);
  props: any;
  key: string | number | null | undefined;
};

export type Child = Element | string | number | bigint | boolean | null | undefined;
export type Children = Child[] | Child;

export declare namespace JSX {
  interface ElementChildrenAttribute {
    children: any;
  }

  interface IntrinsicElements extends Omit<_JSX.IntrinsicElements, "children" | "className"> {
    children?: Children;
  }
}

const voidElements = new Set<string>([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const propertyNames: { [key: string]: string } = Object.assign(Object.create(null), {
  acceptCharset: "accept-charset",
  httpEquiv: "http-equiv",
  accentHeight: "accent-height",
  alignmentBaseline: "alignment-baseline",
  arabicForm: "arabic-form",
  baselineShift: "baseline-shift",
  capHeight: "cap-height",
  clipPath: "clip-path",
  clipRule: "clip-rule",
  colorInterpolation: "color-interpolation",
  colorInterpolationFilters: "color-interpolation-filters",
  colorProfile: "color-profile",
  colorRendering: "color-rendering",
  dominantBaseline: "dominant-baseline",
  enableBackground: "enable-background",
  fillOpacity: "fill-opacity",
  fillRule: "fill-rule",
  floodOpacity: "flood-opacity",
  floodColor: "flood-color",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontSizeAdjust: "font-size-adjust",
  fontStretch: "font-stretch",
  fontStyle: "font-style",
  fontVariant: "font-variant",
  fontWeight: "font-weight",
  glyphName: "glyph-name",
  glyphOrientationHorizontal: "glyph-orientation-horizontal",
  glyphOrientationVertical: "glyph-orientation-vertical",
  horizAdvX: "horiz-adv-x",
  horizOriginX: "horiz-origin-x",
  imageRendering: "image-rendering",
  letterSpacing: "letter-spacing",
  lightingColor: "lighting-color",
  markerEnd: "marker-end",
  markerMid: "marker-mid",
  markerStart: "marker-start",
  overlinePosition: "overline-position",
  overlineThickness: "overline-thickness",
  paintOrder: "paint-order",
  panose1: "panose-1",
  pointerEvents: "pointer-events",
  renderingIntent: "rendering-intent",
  shapeRendering: "shape-rendering",
  stopColor: "stop-color",
  stopOpacity: "stop-opacity",
  strikethroughPosition: "strikethrough-position",
  strikethroughThickness: "strikethrough-thickness",
  strokeDasharray: "stroke-dasharray",
  strokeDashoffset: "stroke-dashoffset",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeMiterlimit: "stroke-miterlimit",
  strokeWidth: "stroke-width",
  strokeOpacity: "stroke-opacity",
  textAnchor: "text-anchor",
  textDecoration: "text-decoration",
  textRendering: "text-rendering",
  underlinePosition: "underline-position",
  underlineThickness: "underline-thickness",
  unicodeBidi: "unicode-bidi",
  unicodeRange: "unicode-range",
  unitsPerEm: "units-per-em",
  vAlphabetic: "v-alphabetic",
  vectorEffect: "vector-effect",
  vertAdvY: "vert-adv-y",
  vertOriginX: "vert-origin-x",
  vertOriginY: "vert-origin-y",
  vHanging: "v-hanging",
  vIdeographic: "v-ideographic",
  vMathematical: "v-mathematical",
  wordSpacing: "word-spacing",
  writingMode: "writing-mode",
  xHeight: "x-height",
});

export const Fragment = (props: { children?: Children }) => props.children;

export const jsx = (
  type: string | ((props: any, context: any) => any),
  props: any,
  key?: string | number | null,
): Element => ({
  type,
  props,
  key,
});

export const jsxs = jsx;
export const jsxDEV = jsx;

const escapeHtml = (value: string, attribute?: boolean) => {
  const delim = attribute ? '"' : "<";
  const escDelim = attribute ? "&quot;" : "&lt;";
  let iDelim = value.indexOf(delim);
  let iAmp = value.indexOf("&");

  if (iDelim < 0 && iAmp < 0) {
    return value;
  }

  let left = 0;
  let out = "";

  while (iDelim >= 0 && iAmp >= 0) {
    if (iDelim < iAmp) {
      if (left < iDelim) {
        out += value.substring(left, iDelim);
      }

      out += escDelim;
      left = iDelim + 1;
      iDelim = value.indexOf(delim, left);
    } else {
      if (left < iAmp) {
        out += value.substring(left, iAmp);
      }

      out += "&amp;";
      left = iAmp + 1;
      iAmp = value.indexOf("&", left);
    }
  }

  if (iDelim >= 0) {
    do {
      if (left < iDelim) {
        out += value.substring(left, iDelim);
      }

      out += escDelim;
      left = iDelim + 1;
      iDelim = value.indexOf(delim, left);
    } while (iDelim >= 0);
  } else {
    while (iAmp >= 0) {
      if (left < iAmp) {
        out += value.substring(left, iAmp);
      }

      out += "&amp;";
      left = iAmp + 1;
      iAmp = value.indexOf("&", left);
    }
  }

  return left < value.length ? out + value.substring(left) : out;
};

export const render = async (children: Children, context: any = {}): Promise<string> => {
  if (children == null) {
    return "";
  }

  switch (typeof children) {
    case "boolean":
      return "";
    case "string":
      return escapeHtml(children);
    case "number":
    case "bigint":
      return children.toString();
  }

  if (Array.isArray(children)) {
    const results = await Promise.all(children.map((child) => render(child, context)));
    return results.join("");
  }

  const { type, props } = children;

  if (type === Fragment) {
    return render(props.children, context);
  }

  if (typeof type === "function") {
    const result = type(props, context);

    if (result == null) {
      return "";
    } else if ("type" in result) {
      return render(result, context);
    } else if ("then" in result) {
      return render(await result, context);
    } else {
      let value: Element | null | undefined = null;

      while (true) {
        const _result = await result.next();

        if (_result.done === true) {
          return render(value, context);
        } else if (_result.value === undefined) {
          await result.return(undefined);
          return render(value, context);
        } else {
          value = _result.value;
        }
      }
    }
  }

  let attributes = "";
  let _children: any;

  if (props) {
    for (const key of Object.keys(props).sort()) {
      const value = props[key];

      if (key === "children") {
        _children = value;
        continue;
      }

      const name = propertyNames[key] ?? key.toLowerCase();

      if (value === true) {
        attributes += ` ${name}`;
        continue;
      }

      switch (typeof value) {
        case "string":
          attributes += ` ${name}="${escapeHtml(value, true)}"`;
          continue;
        case "number":
        case "bigint":
          attributes += ` ${name}="${value}"`;
          continue;
      }
    }
  }

  return `<${type}${attributes}>${voidElements.has(type) ? "" : `${await render(_children, context)}</${type}>`}`;
};
