export interface Operation {
  type: "insert" | "delete" | "update";
  position: number;
  content?: string;
  oldContent?: string;
  timestamp: number;
  userId?: string;
}

export class OT {
  private static transformInsertInsert(op1: Operation, op2: Operation): Operation {
    if (op1.position < op2.position) {
      return op2;
    } else {
      return {
        ...op2,
        position: op2.position + (op1.content?.length || 0),
      };
    }
  }

  private static transformInsertDelete(op1: Operation, op2: Operation): Operation {
    if (op1.position < op2.position) {
      return op2;
    } else if (op1.position >= op2.position + (op2.content?.length || 0)) {
      return {
        ...op2,
        position: op2.position - (op1.content?.length || 0),
      };
    } else {
      // partial overlap, need to split operation
      return {
        ...op2,
        position: op2.position,
        content: op2.content?.slice(0, op1.position - op2.position),
      };
    }
  }

  private static transformUpdateUpdate(op1: Operation, op2: Operation): Operation {
    if (op1.position < op2.position) {
      return op2;
    } else if (op1.position > op2.position + (op2.content?.length || 0)) {
      return {
        ...op2,
        position: op2.position + (op1.content?.length || 0) - (op1.oldContent?.length || 0),
      };
    } else {
      // overlap case, need to merge updates
      return {
        ...op2,
        content: op2.content,
        oldContent: op2.oldContent,
      };
    }
  }

  private static transformUpdateDelete(op1: Operation, op2: Operation): Operation {
    if (op1.position < op2.position) {
      return op2;
    } else if (op1.position >= op2.position + (op2.content?.length || 0)) {
      return {
        ...op2,
        position: op2.position - (op1.content?.length || 0) + (op1.oldContent?.length || 0),
      };
    } else {
      // partial overlap, need to adjust delete range
      return {
        ...op2,
        position: op2.position,
        content: op2.content?.slice(0, op1.position - op2.position),
      };
    }
  }

  public static transform(op1: Operation, op2: Operation): Operation {
    if (op1.type === "insert" && op2.type === "insert") {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === "insert" && op2.type === "delete") {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === "delete" && op2.type === "insert") {
      return this.transformInsertDelete(op2, op1);
    } else if (op1.type === "update" && op2.type === "update") {
      return this.transformUpdateUpdate(op1, op2);
    } else if (op1.type === "update" && op2.type === "delete") {
      return this.transformUpdateDelete(op1, op2);
    } else if (op1.type === "delete" && op2.type === "update") {
      return this.transformUpdateDelete(op2, op1);
    } else {
      // delete-delete conversion
      if (op1.position < op2.position) {
        return op2;
      } else {
        return {
          ...op2,
          position: op2.position - (op1.content?.length || 0),
        };
      }
    }
  }

  public static applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case "insert":
        if (operation.content) {
          return content.slice(0, operation.position) + operation.content + content.slice(operation.position);
        }
        return content;

      case "delete":
        return (
          content.slice(0, operation.position) + content.slice(operation.position + (operation.content?.length || 0))
        );

      case "update":
        if (operation.content && operation.oldContent) {
          return (
            content.slice(0, operation.position) +
            operation.content +
            content.slice(operation.position + operation.oldContent.length)
          );
        }
        return content;

      default:
        return content;
    }
  }

  public static findFirstDiffsPos(a: string, b: string): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        return i;
      }
    }
    return -1;
  }
}

export function findFirstDiffsPos(a: string, b: string): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return i;
    }
  }
  return -1;
}
