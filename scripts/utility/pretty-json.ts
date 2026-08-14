/**
 * JSON serializer that matches Prettier's default JSON layout (printWidth 80,
 * tabWidth 2): objects always expand, primitive arrays stay on one line when
 * they fit. Collectors write this so format-on-save is a no-op.
 */
const DEFAULT_PRINT_WIDTH = 80;
const DEFAULT_TAB_WIDTH = 2;

export function stringifyPrettyJson(
  value: unknown,
  options?: { printWidth?: number; tabWidth?: number },
): string {
  const printWidth = options?.printWidth ?? DEFAULT_PRINT_WIDTH;
  const tabWidth = options?.tabWidth ?? DEFAULT_TAB_WIDTH;
  return `${printJson(value, 0, 0, printWidth, tabWidth)}\n`;
}

function printJson(
  value: unknown,
  indent: number,
  column: number,
  printWidth: number,
  tabWidth: number,
): string {
  if (value === undefined) return "null";
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return printArray(value, indent, column, printWidth, tabWidth);
  }
  if (typeof value === "object") {
    return printObject(
      value as Record<string, unknown>,
      indent,
      printWidth,
      tabWidth,
    );
  }
  throw new TypeError(`Cannot serialize ${typeof value} to JSON`);
}

function printObject(
  obj: Record<string, unknown>,
  indent: number,
  printWidth: number,
  tabWidth: number,
): string {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "{}";

  const inner = indent + tabWidth;
  const lines = entries.map(([key, v], i) => {
    const keyPart = `${" ".repeat(inner)}${JSON.stringify(key)}: `;
    const printed = printJson(v, inner, keyPart.length, printWidth, tabWidth);
    const comma = i < entries.length - 1 ? "," : "";
    return `${keyPart}${printed}${comma}`;
  });
  return `{\n${lines.join("\n")}\n${" ".repeat(indent)}}`;
}

function printArray(
  arr: unknown[],
  indent: number,
  column: number,
  printWidth: number,
  tabWidth: number,
): string {
  if (arr.length === 0) return "[]";

  const inner = indent + tabWidth;
  const elements = arr.map((el) =>
    printJson(el, inner, inner, printWidth, tabWidth),
  );
  const inline = `[${elements.join(", ")}]`;
  const canInline = elements.every((el) => !el.includes("\n"));
  if (canInline && column + inline.length <= printWidth) {
    return inline;
  }

  const pad = " ".repeat(inner);
  const close = " ".repeat(indent);
  const lines = elements.map(
    (el, i) => `${pad}${el}${i < arr.length - 1 ? "," : ""}`,
  );
  return `[\n${lines.join("\n")}\n${close}]`;
}
