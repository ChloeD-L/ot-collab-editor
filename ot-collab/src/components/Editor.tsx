import { useEffect, useRef, useState } from "react";
import { Operation, applyOperation, findFirstDiffsPos } from "../utils/ot";

export default function Editor() {
  const [text, setText] = useState("hello");
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:4000");

    socket.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "init") {
        setText(msg.text);
      }
      if (msg.type === "op") {
        setText((prev: string) => applyOperation(prev, msg.op));
      }
    };

    return () => socket.current?.close();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const pos = findFirstDiffsPos(text, newVal);
    if (pos === -1) return;

    const op: Operation =
      newVal.length > text.length ? { type: "insert", pos, char: newVal[pos] } : { type: "delete", pos };
    setText((prev) => applyOperation(prev, op));
    socket.current?.send(JSON.stringify({ type: "op", op }));
  };

  return (
    <div>
      <h2>Editor</h2>
      <input type="text" value={text} onChange={onChange} style={{ width: "300px" }} />
    </div>
  );
}
