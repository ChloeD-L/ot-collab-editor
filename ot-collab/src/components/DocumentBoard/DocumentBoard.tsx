import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentEditor } from "../DocumentEditor/DocumentEditor";

interface Document {
  id: string;
  title: string;
  lastModified: Date;
  collaborators: string[];
}

export const DocumentBoard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const navigate = useNavigate();
  const userId = "user_" + Math.random().toString(36).substr(2, 9); // Temporary user ID generation

  // Mock document list
  useEffect(() => {
    // TODO: Fetch documents from backend
    const mockDocuments: Document[] = [
      {
        id: "doc1",
        title: "Project Plan",
        lastModified: new Date(),
        collaborators: ["user1", "user2"],
      },
      {
        id: "doc2",
        title: "Meeting Notes",
        lastModified: new Date(),
        collaborators: ["user1"],
      },
    ];
    setDocuments(mockDocuments);
  }, []);

  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) return;

    const newDoc: Document = {
      id: "doc_" + Date.now(),
      title: newDocTitle,
      lastModified: new Date(),
      collaborators: [userId],
    };

    setDocuments((prev) => [...prev, newDoc]);
    setNewDocTitle("");
    setIsCreating(false);
    navigate(`/document/${newDoc.id}`);
  };

  const handleSelectDocument = (docId: string) => {
    navigate(`/document/${docId}`);
  };

  return (
    <div className="document-board">
      <div className="board-header">
        <h2>Collaborative Documents</h2>
        <button className="create-doc-btn" onClick={() => setIsCreating(true)}>
          New Document
        </button>
      </div>

      {isCreating && (
        <div className="create-doc-modal">
          <div className="modal-content">
            <h3>Create New Document</h3>
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Enter document title"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setIsCreating(false)}>Cancel</button>
              <button onClick={handleCreateDocument}>Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="documents-container">
        <div className="documents-list">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`document-item ${selectedDoc === doc.id ? "selected" : ""}`}
              onClick={() => {
                setSelectedDoc(doc.id);
                handleSelectDocument(doc.id);
              }}
            >
              <div className="doc-title">{doc.title}</div>
              <div className="doc-info">
                <span className="last-modified">Last modified: {doc.lastModified.toLocaleString()}</span>
                <span className="collaborators">Collaborators: {doc.collaborators.length}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="editor-container">
          {selectedDoc ? <DocumentEditor /> : <div className="no-doc-selected">Select a document to start editing</div>}
        </div>
      </div>
    </div>
  );
};
