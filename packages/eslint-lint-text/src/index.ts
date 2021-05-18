import { ESLint } from "eslint";

export default async (code: string, filepath?: string) => {
  const eslint = new ESLint({ fix: true });
  const results = await eslint.lintText(code, { filePath: filepath });
  const { messages, output } = results[0];

  if (messages.length) {
    const { format } = await eslint.loadFormatter("codeframe");
    throw new Error(format(results));
  }

  return output ?? code;
};
