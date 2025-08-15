import fs from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';

// Dados originais dos arquivos extraídos do backup
const originalFiles = [
  { id: 33, activity_number: 2, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753874226243-e86b53bb8b52.pdf', file_name: 'INDICAÇÃO Nº 002 2025.pdf' },
  { id: 37, activity_number: 4, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753874282306-1d5bcb56fdce.pdf', file_name: 'INDICAÇÃO Nº 004 2025.pdf' },
  { id: 35, activity_number: 1, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753874348643-7761eda43f71.pdf', file_name: 'PROJETO RESOLUÇÃO 001 2025.pdf' },
  { id: 42, activity_number: 8, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753874802689-1eb9226e122f.pdf', file_name: 'INDICAÇÃO Nº 008 2025.pdf' },
  { id: 34, activity_number: 1, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753890592534-c7daef17a495.pdf', file_name: 'PROJETO DE LEI Nº 001 2025.pdf' },
  { id: 32, activity_number: 1, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753890637705-f9e48087d430.pdf', file_name: 'INDICAÇÃO Nº 001 2025.pdf' },
  { id: 38, activity_number: 5, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753890667516-edcc10cc6d82.pdf', file_name: 'INDICAÇÃO Nº 005 2025.pdf' },
  { id: 55, activity_number: 16, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753874949954-9b5e8a544b55.pdf', file_name: 'INDICAÇÃO Nº 016 2025.pdf' },
  { id: 63, activity_number: 24, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753875064858-29ffe87c926e.pdf', file_name: 'INDICAÇÃO Nº 024 2025.pdf' },
  { id: 70, activity_number: 3, file_path: '/home/runner/workspace/uploads/1753799116167-2d402fa493d5.pdf', file_name: 'PROJETO DE LEI Nº 003 2025.pdf' },
  { id: 74, activity_number: 71, file_path: '/home/runner/workspace/uploads/activities/2025/07/1753843750426-659a3f7c3e96.pdf', file_name: 'INDICAÇÃO Nº 071 2025.pdf' },
  { id: 147, activity_number: 71, file_path: '/home/runner/workspace/uploads/activities/2025/08/1754079959393-750e20648646.pdf', file_name: 'INDICAÇÃO Nº 071 2025.pdf' }
];

async function restoreFilePaths() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log('🔄 Iniciando restauração de caminhos de arquivos...');
  
  let restored = 0;
  let skipped = 0;
  
  for (const fileData of originalFiles) {
    try {
      // Verificar se o arquivo realmente existe
      if (fs.existsSync(fileData.file_path)) {
        // Restaurar o caminho no banco de dados
        await pool.query(
          `UPDATE legislative_activities 
           SET file_path = $1, file_name = $2, file_type = 'application/pdf'
           WHERE id = $3`,
          [fileData.file_path, fileData.file_name, fileData.id]
        );
        
        console.log(`✅ Restaurado: ID ${fileData.id} - ${fileData.file_name}`);
        restored++;
      } else {
        console.log(`⚠️  Arquivo não encontrado: ID ${fileData.id} - ${fileData.file_path}`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ID ${fileData.id}:`, error.message);
    }
  }
  
  console.log(`\n📊 Relatório de restauração:`);
  console.log(`   ✅ Arquivos restaurados: ${restored}`);
  console.log(`   ⚠️  Arquivos não encontrados: ${skipped}`);
  console.log(`   📁 Total processado: ${originalFiles.length}`);
  
  await pool.end();
}

// Executar se chamado diretamente
restoreFilePaths().catch(console.error);

export { restoreFilePaths };