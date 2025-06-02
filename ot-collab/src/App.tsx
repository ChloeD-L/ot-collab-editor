import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DocumentBoard } from "./components/DocumentBoard/DocumentBoard";
import { DocumentEditor } from "./components/DocumentEditor/DocumentEditor";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<DocumentBoard />} />
        <Route path="/document/:documentId" element={<DocumentEditor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
