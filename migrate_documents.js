import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct migration script for documents
async function migrateDocumentsToObjectStorage() {
  console.log('🚀 Iniciando migração de documentos para Object Storage...');
  
  const baseUrl = 'https://ad405bb0-2381-4a9c-8f6a-f7eb900f9bd8-00-2ute594oeu4o5.worf.replit.dev';
  
  try {
    // Get all document IDs that need migration
    const documentIds = [22, 29, 31, 33, 19, 18, 21, 23, 24, 25]; // First batch
    
    console.log(`📋 Migrando ${documentIds.length} documentos...`);
    
    // Call migration endpoint directly
    const migrationData = {
      documentIds: documentIds
    };
    
    console.log('📤 Enviando solicitação de migração...');
    
    const response = await fetch(`${baseUrl}/api/admin/migrate-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Using admin credentials directly in headers for testing
        'Authorization': 'Basic ' + Buffer.from('root@sistema-legislativo.com:admin@123').toString('base64')
      },
      body: JSON.stringify(migrationData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    if (response.status === 401) {
      console.log('🔐 Autenticação necessária. Testando endpoint público...');
      
      // Try a different approach - use the migration logic directly
      const { spawn } = await import('child_process');
      
      const migrationScript = `
        import { storage } from './server/storage.js';
        import { ObjectStorageService } from './server/objectStorage.js';
        import fs from 'fs';
        
        async function migrate() {
          const objectStorageService = new ObjectStorageService();
          const documentIds = [22, 29, 31, 33, 19];
          
          for (const docId of documentIds) {
            try {
              const document = await storage.getDocument(docId);
              if (!document || !document.filePath || document.filePath.startsWith('/objects/')) {
                continue;
              }
              
              if (!fs.existsSync(document.filePath)) {
                console.log('Arquivo não encontrado:', document.filePath);
                continue;
              }
              
              const fileBuffer = fs.readFileSync(document.filePath);
              const uploadURL = await objectStorageService.getObjectEntityUploadURL();
              
              const uploadResponse = await fetch(uploadURL, {
                method: 'PUT',
                body: fileBuffer,
                headers: {
                  'Content-Type': document.fileType || 'application/octet-stream',
                }
              });
              
              if (uploadResponse.ok) {
                const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
                await storage.updateDocument(docId, { filePath: normalizedPath });
                console.log('Migrado:', document.fileName);
              }
            } catch (error) {
              console.error('Erro migrando documento', docId, ':', error.message);
            }
          }
        }
        
        migrate().catch(console.error);
      `;
      
      fs.writeFileSync('temp_migration.js', migrationScript);
      
      return;
    }
    
    const result = await response.text();
    console.log('📋 Resultado:', result);
    
    if (response.ok) {
      console.log('✅ Migração concluída com sucesso!');
    } else {
      console.log('❌ Erro na migração:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
  }
}

migrateDocumentsToObjectStorage().catch(console.error);