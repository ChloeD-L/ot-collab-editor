export type Operation = {
  type: "insert" | "delete";
  pos: number;
  char?: string;
};

export function applyOperation(text: string, op: Operation): string {
  if (op.type === "insert" && op.char) {
    return text.slice(0, op.pos) + op.char + text.slice(op.pos);
  }
  if (op.type === "delete") {
    return text.slice(0, op.pos) + text.slice(op.pos + 1);
  }
  return text;
}

export function findFirstDiffsPos(a: string, b: string): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return i;
    }
  }
  return -1;
}
