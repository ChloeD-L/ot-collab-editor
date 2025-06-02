import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { Operation, OT } from "../../utils/ot";
import { WebSocketService } from "../../utils/websocket";

export const DocumentEditor: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>("");
  const [shadowContent, setShadowContent] = useState<string>("");
  const [pendingOps, setPendingOps] = useState<Operation[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelection = useRef<{ start: number; end: number } | null>(null);
  const userId = "user_" + Math.random().toString(36).substr(2, 9); // Temporary user ID generation

  // Save selection position
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current!);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const end = preCaretRange.toString().length;

      preCaretRange.setStart(range.startContainer, range.startOffset);
      const start = preCaretRange.toString().length;

      lastSelection.current = { start, end };
    }
  }, []);

  // Restore selection position
  const restoreSelection = useCallback(() => {
    if (!lastSelection.current || !editorRef.current) return;

    const { start, end } = lastSelection.current;
    const selection = window.getSelection();
    const range = document.createRange();

    let charCount = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;

    const traverse = (node: Node) => {
      if (startNode && endNode) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const nextCount = charCount + node.textContent!.length;

        if (!startNode && charCount <= start && start <= nextCount) {
          startNode = node;
          startOffset = start - charCount;
        }

        if (!endNode && charCount <= end && end <= nextCount) {
          endNode = node;
          endOffset = end - charCount;
        }

        charCount = nextCount;
      } else {
        for (const child of Array.from(node.childNodes)) {
          traverse(child);
        }
      }
    };

    traverse(editorRef.current);

    if (startNode && endNode) {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  useEffect(() => {
    if (!documentId) {
      navigate("/");
      return;
    }

    const ws = new WebSocketService(documentId);
    ws.onOperation((operation) => {
      // Transform and apply remote operations
      const transformedOps = pendingOps.map((pendingOp) => OT.transform(pendingOp, operation));

      // Update shadow content
      let newShadowContent = shadowContent;
      transformedOps.forEach((op) => {
        newShadowContent = OT.applyOperation(newShadowContent, op);
      });
      setShadowContent(newShadowContent);

      // Apply remote operation to current content
      setContent((prev) => {
        const newContent = OT.applyOperation(prev, operation);
        // Restore selection in next render cycle
        setTimeout(restoreSelection, 0);
        return newContent;
      });
    });

    ws.connect();
    setWsService(ws);
    setIsConnected(true);

    return () => {
      ws.disconnect();
      setIsConnected(false);
    };
  }, [documentId]);

  // Handle local edits
  const handleLocalEdit = useCallback(
    (newContent: string) => {
      saveSelection();

      // Calculate operation type and content
      let operation: Operation;
      const oldContent = content;
      const diffPos = OT.findFirstDiffsPos(oldContent, newContent);

      if (diffPos === -1) return; // No changes

      if (newContent.length > oldContent.length) {
        // Insert operation
        operation = {
          type: "insert",
          position: diffPos,
          content: newContent.slice(diffPos),
          timestamp: Date.now(),
          userId,
        };
      } else if (newContent.length < oldContent.length) {
        // Delete operation
        operation = {
          type: "delete",
          position: diffPos,
          content: oldContent.slice(diffPos, diffPos + (oldContent.length - newContent.length)),
          timestamp: Date.now(),
          userId,
        };
      } else {
        // Update operation
        operation = {
          type: "update",
          position: diffPos,
          content: newContent.slice(diffPos),
          oldContent: oldContent.slice(diffPos),
          timestamp: Date.now(),
          userId,
        };
      }

      setContent(newContent);
      setPendingOps((prev) => [...prev, operation]);

      // Send operation to server
      if (wsService) {
        wsService.sendOperation(operation);
      }
    },
    [content, wsService, userId]
  );

  return (
    <div className="document-editor">
      <div className="editor-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Documents
        </button>
        <div className="editor-status">Connection: {isConnected ? "Connected" : "Disconnected"}</div>
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={(e) => handleLocalEdit(e.currentTarget.textContent || "")}
        onSelect={saveSelection}
        suppressContentEditableWarning
      >
        {content}
      </div>
    </div>
  );
};
