import type { StyleProps } from "./Style.client";

export type { StyleProps };

export const Style = ({ children = "", ...props }: StyleProps) => {
  return <style {...props} dangerouslySetInnerHTML={{ __html: children }} />;
};
