import postcss from "postcss";
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";

export default async () => async (path: string, data: string) => {
  if (!/\.css$/.test(path)) {
    return;
  }

  const { css } = await postcss(postcssImport() as any, tailwindcss()).process(data, {
    from: path,
  });

  return css;
};
