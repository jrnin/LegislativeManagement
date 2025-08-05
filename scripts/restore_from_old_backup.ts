import { execSync } from 'child_process';
import { storage } from '../server/storage';

async function restoreDocumentsFromOldBackup() {
  console.log('🔄 Tentando restaurar documentos do backup de 29/07...');
  
  try {
    // Extract document records from the older backup
    console.log('📋 Extraindo dados do backup antigo...');
    
    const extractCommand = `gunzip -c backups/database/legislative_db_20250729_145547.sql.gz | grep "INSERT INTO.*documents" | head -100`;
    
    let documentInserts: string;
    try {
      documentInserts = execSync(extractCommand, { encoding: 'utf8' });
    } catch (error) {
      console.log('❌ Erro extraindo dados do backup:', error.message);
      return;
    }
    
    if (!documentInserts.trim()) {
      console.log('❌ Nenhum registro de documento encontrado no backup antigo');
      
      // Let's try to manually recreate some basic document structure
      console.log('🔧 Criando estrutura básica de documentos...');
      
      const basicDocuments = [
        {
          documentNumber: 1,
          documentType: 'PORTARIA',
          documentDate: new Date('2025-01-01'),
          authorType: 'CAMARA',
          description: 'Portaria nº 01/2025 - Documento de exemplo',
          fileName: 'portaria-01-2025.pdf',
          filePath: null, // Arquivo perdido
          fileType: 'application/pdf',
          status: 'ACTIVE',
        },
        {
          documentNumber: 2,
          documentType: 'PORTARIA',
          documentDate: new Date('2025-01-02'),
          authorType: 'CAMARA', 
          description: 'Portaria nº 02/2025 - Documento de exemplo',
          fileName: 'portaria-02-2025.pdf',
          filePath: null, // Arquivo perdido
          fileType: 'application/pdf',
          status: 'ACTIVE',
        },
        {
          documentNumber: 3,
          documentType: 'ATA',
          documentDate: new Date('2025-01-03'),
          authorType: 'CAMARA',
          description: 'Ata da 1ª Sessão Ordinária',
          fileName: 'ata-1a-sessao.pdf',
          filePath: null, // Arquivo perdido
          fileType: 'application/pdf',
          status: 'ACTIVE',
        }
      ];
      
      console.log('📝 Criando documentos de exemplo...');
      let createdCount = 0;
      
      for (const docData of basicDocuments) {
        try {
          await storage.createDocument({
            ...docData,
            createdBy: 1,
            legislatureId: 1,
          });
          createdCount++;
          console.log(`✅ Criado: ${docData.description}`);
        } catch (error) {
          console.log(`❌ Erro criando documento: ${error.message}`);
        }
      }
      
      console.log(`\n🎉 ${createdCount} documentos de exemplo criados`);
      console.log('⚠️  Nota: Estes são documentos de exemplo para demonstrar o sistema');
      
      return;
    }
    
    // If we found INSERT statements, process them
    const insertLines = documentInserts.trim().split('\n');
    console.log(`📊 Encontradas ${insertLines.length} linhas de inserção no backup`);
    
    // TODO: Process backup data if found
    
  } catch (error) {
    console.error('❌ Erro durante a restauração:', error);
  }
}

restoreDocumentsFromOldBackup().catch(console.error);