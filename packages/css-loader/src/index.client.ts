// let supportReplaceSync = false;

// try {
//   supportReplaceSync = !!(new CSSStyleSheet() as any).replaceSync;
// } catch {}

export default (css: string) => {
  // if (supportReplaceSync && !css.includes("@import")) {
  //   const style = new CSSStyleSheet();
  //   (style as any).replaceSync(css);
  //   (document as any).adoptedStyleSheets = [...(document as any).adoptedStyleSheets, style];
  // } else {
  const style = document.createElement("style");
  style.setAttribute("type", "text/css");
  style.innerHTML = css;
  document.head.appendChild(style);
  // }
};
