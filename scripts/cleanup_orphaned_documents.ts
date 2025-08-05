import fs from 'fs';
import { storage } from '../server/storage';

async function cleanupOrphanedDocuments() {
  console.log('🧹 Iniciando limpeza de documentos órfãos...');
  
  try {
    // Get all documents
    const allDocuments = await storage.getAllDocuments();
    console.log(`📋 Total de documentos no banco: ${allDocuments.length}`);
    
    const orphanedDocuments = [];
    const validDocuments = [];
    
    for (const document of allDocuments) {
      // Skip documents that are already in Object Storage
      if (document.filePath && document.filePath.startsWith('/objects/')) {
        validDocuments.push(document);
        continue;
      }
      
      // Check if local file exists
      if (document.filePath && !fs.existsSync(document.filePath)) {
        orphanedDocuments.push(document);
        console.log(`🗑️  Órfão encontrado: ${document.fileName} (ID: ${document.id}) - ${document.filePath}`);
      } else {
        validDocuments.push(document);
      }
    }
    
    console.log(`\n📊 Resumo da análise:`);
    console.log(`✅ Documentos válidos: ${validDocuments.length}`);
    console.log(`🗑️  Documentos órfãos: ${orphanedDocuments.length}`);
    
    if (orphanedDocuments.length > 0) {
      console.log(`\n🗑️  Removendo ${orphanedDocuments.length} registros órfãos...`);
      
      for (const document of orphanedDocuments) {
        try {
          await storage.deleteDocument(document.id);
          console.log(`✅ Removido: ${document.fileName} (ID: ${document.id})`);
        } catch (error) {
          console.error(`❌ Erro removendo documento ${document.id}:`, error.message);
        }
      }
      
      console.log(`\n🎉 Limpeza concluída!`);
      console.log(`🗑️  ${orphanedDocuments.length} registros órfãos removidos`);
      console.log(`✅ ${validDocuments.length} documentos válidos mantidos`);
    } else {
      console.log(`\n✅ Nenhum documento órfão encontrado!`);
    }
    
    // Final verification
    const remainingDocuments = await storage.getAllDocuments();
    console.log(`\n📊 Estado final: ${remainingDocuments.length} documentos no banco de dados`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Run cleanup
cleanupOrphanedDocuments().catch(console.error);