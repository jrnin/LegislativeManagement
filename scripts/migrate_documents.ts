import fs from 'fs';
import { storage } from '../server/storage';
import { ObjectStorageService } from '../server/objectStorage';

async function migrateDocuments() {
  console.log('🚀 Iniciando migração de documentos para Object Storage...');
  
  try {
    const objectStorageService = new ObjectStorageService();
    
    // Get all documents with local file paths
    const allDocuments = await storage.getAllDocuments();
    const documentsToMigrate = allDocuments.filter(doc => 
      doc.filePath && 
      !doc.filePath.startsWith('/objects/') && 
      doc.filePath.includes('/home/runner/workspace/uploads/')
    );
    
    console.log(`📋 Encontrados ${documentsToMigrate.length} documentos para migrar`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const document of documentsToMigrate) {
      try {
        console.log(`📄 Migrando: ${document.fileName} (ID: ${document.id})`);
        
        // Check if local file exists
        if (!fs.existsSync(document.filePath)) {
          console.log(`❌ Arquivo não encontrado: ${document.filePath}`);
          errorCount++;
          continue;
        }
        
        // Read the file
        const fileBuffer = fs.readFileSync(document.filePath);
        console.log(`📖 Arquivo lido: ${fileBuffer.length} bytes`);
        
        // Get upload URL from Object Storage
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        console.log(`🔗 URL de upload obtida: ${uploadURL.substring(0, 50)}...`);
        
        // Upload file to Object Storage
        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: fileBuffer,
          headers: {
            'Content-Type': document.fileType || 'application/octet-stream',
          },
        });
        
        if (!uploadResponse.ok) {
          console.log(`❌ Falha no upload para documento ${document.id}: ${uploadResponse.status}`);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Upload realizado com sucesso`);
        
        // Get the normalized path
        const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
        console.log(`🔄 Caminho normalizado: ${normalizedPath}`);
        
        // Set ACL policy
        await objectStorageService.trySetObjectEntityAclPolicy(
          uploadURL,
          {
            owner: 'system-migration',
            visibility: "private",
            aclRules: []
          }
        );
        
        console.log(`🔒 Política de ACL configurada`);
        
        // Update document with new path
        await storage.updateDocument(document.id, {
          filePath: normalizedPath,
        });
        
        console.log(`💾 Documento ${document.id} atualizado no banco de dados`);
        console.log(`✅ SUCESSO: ${document.fileName} migrado de ${document.filePath} para ${normalizedPath}`);
        
        migratedCount++;
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Erro migrando documento ${document.id} (${document.fileName}):`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA!');
    console.log(`✅ Documentos migrados com sucesso: ${migratedCount}`);
    console.log(`❌ Documentos com erro: ${errorCount}`);
    console.log(`📊 Total processado: ${migratedCount + errorCount}/${documentsToMigrate.length}`);
    
  } catch (error) {
    console.error('❌ Erro fatal durante a migração:', error);
  }
}

// Run migration
migrateDocuments().catch(console.error);