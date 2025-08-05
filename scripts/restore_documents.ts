import { execSync } from 'child_process';
import fs from 'fs';

async function restoreDocumentsFromBackup() {
  console.log('🔄 Restaurando registros de documentos do backup...');
  
  try {
    // Extract document records from backup
    console.log('📋 Extraindo dados dos documentos do backup...');
    
    const extractCommand = `
      gunzip -c backup_20250731.sql.gz | 
      grep "INSERT INTO.*documents" | 
      head -100
    `;
    
    const documentInserts = execSync(extractCommand, { encoding: 'utf8' });
    
    if (!documentInserts.trim()) {
      console.log('❌ Nenhum registro de documento encontrado no backup');
      return;
    }
    
    // Parse the INSERT statements to extract individual records
    const insertLines = documentInserts.trim().split('\n');
    console.log(`📊 Encontradas ${insertLines.length} linhas de inserção`);
    
    let restoredCount = 0;
    
    for (const line of insertLines) {
      try {
        // Extract values from INSERT statement
        const valuesMatch = line.match(/INSERT INTO documents.*?VALUES\s*\((.*)\);/);
        if (!valuesMatch) continue;
        
        const values = valuesMatch[1];
        console.log(`🔄 Processando: ${values.substring(0, 100)}...`);
        
        // Create SQL to insert the document record
        const insertSql = `INSERT INTO documents (id, document_number, document_type, document_date, author_type, description, file_path, file_name, file_type, status, activity_id, event_id, parent_document_id, created_at, updated_at) VALUES (${values});`;
        
        // Try to execute the insert (will skip if ID already exists)
        try {
          await execSqlDirectly(insertSql);
          restoredCount++;
          console.log(`✅ Documento restaurado`);
        } catch (error) {
          if (error.message.includes('duplicate key')) {
            console.log(`⚠️  Documento já existe, pulando...`);
          } else {
            console.log(`❌ Erro inserindo documento: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Erro processando linha: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Restauração concluída!`);
    console.log(`✅ ${restoredCount} documentos restaurados`);
    console.log(`⚠️  Nota: Arquivos físicos ainda não existem, apenas os registros foram restaurados`);
    
  } catch (error) {
    console.error('❌ Erro durante a restauração:', error);
  }
}

async function execSqlDirectly(sql: string) {
  // Use the database connection directly
  const { execSync } = require('child_process');
  
  const command = `echo "${sql.replace(/"/g, '\\"')}" | psql "${process.env.DATABASE_URL}"`;
  
  try {
    execSync(command, { encoding: 'utf8' });
  } catch (error) {
    throw new Error(error.message);
  }
}

// Run restoration
restoreDocumentsFromBackup().catch(console.error);