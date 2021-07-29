type ClassValue = string | number | boolean | null | undefined | ClassDictionary | ClassArray;
type ClassDictionary = {
  [id: string]: boolean | null | undefined;
};
type ClassArray = ClassValue[];

const classNames = (...args: ClassValue[]): string => {
  const classes = [];

  for (const arg of args) {
    switch (typeof arg) {
      case "string":
      case "number":
        classes.push(arg);
        continue;
      case "object":
        if (Array.isArray(arg)) {
          const className = classNames(...arg);

          if (className) {
            classes.push(className);
          }
        } else if (arg) {
          for (const [key, value] of Object.entries(arg)) {
            if (value) {
              classes.push(key);
            }
          }
        }
    }
  }

  return classes.join(" ");
};

export default classNames;
