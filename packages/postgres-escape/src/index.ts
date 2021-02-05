export const escapeIdentifier = (str: string) => `"${str.replace(/"/g, '""')}"`;

export const escapeLiteral = (val: string | number | boolean | Date | null | undefined) => {
  if (val === null || val === undefined) {
    return "NULL";
  }

  switch (typeof val) {
    case "boolean":
      return val ? "TRUE" : "FALSE";
    case "number":
      return val.toString();

    case "object":
      if (val instanceof Date) {
        const iso = val.toISOString();
        return `'${iso.slice(0, 10)} ${iso.slice(11, 23)}'`;
      }
  }

  let hasBackslash = false;
  let escaped = "'";

  for (let i = 0, len = val.length; i < len; i++) {
    const c = val[i];

    if (c === "'") {
      escaped += c + c;
    } else if (c === "\\") {
      escaped += c + c;
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }

  escaped += "'";

  if (hasBackslash === true) {
    escaped = "E" + escaped;
  }

  return escaped;
};
