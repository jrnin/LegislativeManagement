const SimpleLoginPage = () => {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to bottom, #f0f4f8, #d9e2ec)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        background: 'white'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#1a56db'
        }}>
          Sistema de Gerenciamento Legislativo
        </h1>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          window.location.href = "/api/login";
        }}>
          <div style={{marginBottom: '1.5rem'}}>
            <p style={{textAlign: 'center', color: '#4b5563', marginBottom: '1rem'}}>
              Clique no botão abaixo para fazer login usando sua conta Replit
            </p>
            
            <button 
              type="submit"
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '500',
                textAlign: 'center',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              Login com Replit
            </button>
          </div>
        </form>
        
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{fontSize: '0.875rem', color: '#4b5563'}}>
            O Sistema de Gerenciamento Legislativo é uma plataforma para controle 
            eficiente de atividades legislativas, documentos e eventos da Câmara Municipal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLoginPage;