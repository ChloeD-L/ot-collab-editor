import { Operation } from "./ot";

export class WebSocketService {
  private ws: WebSocket | null = null;
  private documentId: string;
  private onOperationCallback: ((operation: Operation) => void) | null = null;

  constructor(documentId: string) {
    this.documentId = documentId;
  }

  public connect() {
    this.ws = new WebSocket(`ws://localhost:3001/ws/${this.documentId}`);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
    };

    this.ws.onmessage = (event) => {
      const operation: Operation = JSON.parse(event.data);
      if (this.onOperationCallback) {
        this.onOperationCallback(operation);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      // Try to reconnect
      setTimeout(() => this.connect(), 1000);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  public sendOperation(operation: Operation) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(operation));
    }
  }

  public onOperation(callback: (operation: Operation) => void) {
    this.onOperationCallback = callback;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
