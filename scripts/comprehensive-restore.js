import fs from 'fs';
import { Pool } from '@neondatabase/serverless';

async function comprehensiveRestore() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log('🔄 Iniciando restauração abrangente de caminhos de arquivos...');
  
  // Ler dados do backup
  const backupData = fs.readFileSync('backup_activities_data.txt', 'utf8');
  const lines = backupData.trim().split('\n');
  
  let restored = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const line of lines) {
    try {
      // Parse da linha do backup (formato tab-separated)
      const parts = line.split('\t');
      if (parts.length < 7) continue;
      
      const id = parseInt(parts[0]);
      const activityNumber = parseInt(parts[1]);
      const filePath = parts[6];
      const fileName = parts[7];
      const fileType = parts[8];
      
      // Pular se não há arquivo
      if (!filePath || filePath === '\\N' || !fileName || fileName === '\\N') {
        continue;
      }
      
      // Verificar se o arquivo existe
      if (fs.existsSync(filePath)) {
        // Verificar se a atividade existe no banco atual
        const existingActivity = await pool.query(
          'SELECT id, file_path FROM legislative_activities WHERE id = $1',
          [id]
        );
        
        if (existingActivity.rows.length > 0) {
          const currentActivity = existingActivity.rows[0];
          
          // Só restaurar se não há caminho atual ou se está vazio
          if (!currentActivity.file_path) {
            await pool.query(
              `UPDATE legislative_activities 
               SET file_path = $1, file_name = $2, file_type = $3
               WHERE id = $4`,
              [filePath, fileName, fileType || 'application/pdf', id]
            );
            
            console.log(`✅ Restaurado: ID ${id} - Atividade ${activityNumber} - ${fileName}`);
            restored++;
          } else {
            console.log(`⏭️  Pulado: ID ${id} - Já tem arquivo: ${currentActivity.file_path}`);
          }
        } else {
          console.log(`⚠️  Atividade não encontrada no banco: ID ${id}`);
        }
      } else {
        console.log(`❌ Arquivo não encontrado: ID ${id} - ${filePath}`);
        notFound++;
      }
      
    } catch (error) {
      console.error(`💥 Erro ao processar linha: ${line.substring(0, 100)}...`, error.message);
      errors++;
    }
  }
  
  console.log(`\n📊 Relatório de restauração abrangente:`);
  console.log(`   ✅ Arquivos restaurados: ${restored}`);
  console.log(`   ❌ Arquivos não encontrados: ${notFound}`);
  console.log(`   💥 Erros de processamento: ${errors}`);
  console.log(`   📁 Total de linhas processadas: ${lines.length}`);
  
  await pool.end();
}

// Executar
comprehensiveRestore().catch(console.error);

export { comprehensiveRestore };