export type Operation = {
  type: "insert" | "delete";
  pos: number;
  char?: string;
};

export function transform(op: Operation, history: Operation[]): Operation {
  const newOp = { ...op };
  for (const h of history) {
    if (h.type === "insert") {
      if (newOp.pos > h.pos) newOp.pos += 1;
      else if (newOp.pos === h.pos) newOp.pos += 1;
    }

    if (h.type === "delete") {
      if (newOp.pos > h.pos) newOp.pos -= 1;
      else if (newOp.pos === h.pos) newOp.pos -= 1;
    }
  }

  return newOp;
}

export function applyOperation(text: string, op: Operation): string {
  if (op.type === "insert" && op.char) {
    return text.slice(0, op.pos) + op.char + text.slice(op.pos);
  }
  if (op.type === "delete") {
    return text.slice(0, op.pos) + text.slice(op.pos + 1);
  }
  return text;
}
