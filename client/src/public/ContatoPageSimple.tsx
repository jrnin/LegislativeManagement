export default function ContatoPageSimple() {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6" style={{color: '#48654e'}}>
            Entre em Contato
          </h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Digite seu nome"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">E-mail *</label>
                <input 
                  type="email" 
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Estado *</label>
                  <select className="w-full p-3 border border-gray-300 rounded-md">
                    <option value="">Selecione</option>
                    <option value="MG">MG</option>
                    <option value="SP">SP</option>
                    <option value="RJ">RJ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade *</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Digite sua cidade"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mensagem *</label>
                <textarea 
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Escreva sua mensagem..."
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="w-full p-3 text-white rounded-md"
                style={{backgroundColor: '#48654e'}}
              >
                Enviar Mensagem
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}