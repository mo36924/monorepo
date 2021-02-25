export const escapeId = (value: string) => `"${value.replace(/"/g, '""')}"`;

export const escape = (value: string | number | boolean | Date | null | undefined) => {
  if (value === null || value === undefined) {
    return "NULL";
  }

  switch (typeof value) {
    case "boolean":
      return value ? "TRUE" : "FALSE";
    case "number":
      return value.toString();

    case "object":
      if (value instanceof Date) {
        const iso = value.toISOString();
        return `'${iso.slice(0, 10)} ${iso.slice(11, 23)}'`;
      }

      return String(value);
  }

  let hasBackslash = false;
  let escaped = "'";

  for (let i = 0, len = value.length; i < len; i++) {
    const c = value[i];

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
