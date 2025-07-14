import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./index.css";

// Componente de teste simples
function TestApp() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px' }}>Sistema de Gerenciamento Legislativo</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Sistema funcionando corretamente!</p>
      <button 
        onClick={() => alert('Login funcionando!')}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Teste de Login
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TestApp />
  </QueryClientProvider>
);
