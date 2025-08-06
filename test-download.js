// Teste direto da funcionalidade de download
const { storage } = require('./server/storage.js');
const { ObjectStorageService } = require('./server/objectStorage.js');

async function testDownload() {
  console.log("Testando download do documento ID 204...");
  
  try {
    // Testar getDocument
    const document = await storage.getDocument(204);
    console.log("Documento encontrado:", {
      id: document?.id,
      filePath: document?.filePath,
      fileName: document?.fileName,
      fileType: document?.fileType
    });
    
    if (!document) {
      console.log("Documento não encontrado!");
      return;
    }
    
    if (!document.filePath) {
      console.log("Documento não tem filePath!");
      return;
    }
    
    console.log(`filePath: "${document.filePath}"`);
    console.log(`Starts with /objects/: ${document.filePath.startsWith('/objects/')}`);
    
    if (document.filePath.startsWith('/objects/')) {
      console.log("Testando Object Storage...");
      
      try {
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(document.filePath);
        console.log("Object Storage file encontrado:", objectFile.name);
      } catch (error) {
        console.error("Erro no Object Storage:", error.message);
      }
    }
    
  } catch (error) {
    console.error("Erro no teste:", error);
  }
}

testDownload();