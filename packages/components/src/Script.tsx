import type { ScriptProps } from "./Script.client";

export type { ScriptProps };

export const Script = ({ children = "", ...props }: ScriptProps) => {
  return <script {...props} dangerouslySetInnerHTML={{ __html: children }} />;
};
