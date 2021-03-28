import page, { ImportPage, PageComponent } from "@mo36924/page";
import type { ReactElement } from "react";

export type StaticPages = { [path: string]: ImportPage<any> };
export type DynamicPages = [regexp: RegExp, names: string[], importPage: ImportPage<any>][];
export type Match = (url: URL) => ReactElement<any, PageComponent<any>> | null;

export default (staticPages: StaticPages, dynamicPages: DynamicPages): Match => {
  const staticPageComponents: { [path: string]: PageComponent<any> } = Object.create(null);

  const dynamicPageComponents: [
    regexp: RegExp,
    names: string[],
    page: PageComponent<any>,
  ][] = dynamicPages.map((dynamicPage) => [dynamicPage[0], dynamicPage[1], page(dynamicPage[2])]);

  Object.keys(staticPages).forEach((path) => (staticPageComponents[path] = page(staticPages[path])));

  return (url: URL) => {
    const pathname = url.pathname;
    const props: { [name: string]: string } = {};
    let Page = staticPageComponents[pathname];

    if (!Page) {
      dynamicPageComponents.some((dynamicPageComponent) => {
        const matches = pathname.match(dynamicPageComponent[0]);

        if (matches) {
          dynamicPageComponent[1].forEach((name, index) => (props[name] = matches[index + 1]));
          Page = dynamicPageComponent[2];
          return true;
        }
      });
    }

    return Page ? <Page {...props} /> : null;
  };
};
