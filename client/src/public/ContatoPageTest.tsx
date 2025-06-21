export default function ContatoPageTest() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#48654e', marginBottom: '20px' }}>Página de Contato - Teste</h1>
      <p>Esta é uma página de teste para verificar se o roteamento está funcionando.</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Formulário Simples</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Nome" 
            style={{ 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px' 
            }} 
          />
          <input 
            type="email" 
            placeholder="E-mail" 
            style={{ 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px' 
            }} 
          />
          <textarea 
            placeholder="Mensagem" 
            rows={4}
            style={{ 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px' 
            }} 
          />
          <button 
            type="button"
            style={{ 
              padding: '12px', 
              backgroundColor: '#48654e', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
            onClick={() => alert('Formulário funcionando!')}
          >
            Testar Envio
          </button>
        </form>
      </div>
    </div>
  );
}