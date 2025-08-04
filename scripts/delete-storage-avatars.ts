import { objectStorageClient } from '../server/objectStorage';

async function deleteStorageAvatars() {
  try {
    console.log('🗑️ Iniciando exclusão de avatares do Object Storage...');
    
    // Obter o bucket padrão
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      throw new Error('DEFAULT_OBJECT_STORAGE_BUCKET_ID não encontrado');
    }
    
    console.log(`📦 Bucket: ${bucketId}`);
    
    const bucket = objectStorageClient.bucket(bucketId);
    
    // Listar todos os arquivos no diretório public/avatars/
    const [files] = await bucket.getFiles({
      prefix: 'public/avatars/',
    });
    
    console.log(`📁 Encontrados ${files.length} arquivos de avatar para exclusão`);
    
    if (files.length === 0) {
      console.log('✅ Nenhum arquivo encontrado para exclusão');
      return;
    }
    
    // Excluir cada arquivo
    let deletedCount = 0;
    const errors: Array<{ file: string; error: string }> = [];
    
    for (const file of files) {
      try {
        await file.delete();
        console.log(`🗑️ Excluído: ${file.name}`);
        deletedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro ao excluir ${file.name}:`, errorMessage);
        errors.push({ file: file.name, error: errorMessage });
      }
    }
    
    console.log('\n📊 RELATÓRIO DE EXCLUSÃO:');
    console.log(`Total de arquivos encontrados: ${files.length}`);
    console.log(`Arquivos excluídos com sucesso: ${deletedCount}`);
    console.log(`Arquivos com erro: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Arquivos com erro na exclusão:');
      errors.forEach(e => {
        console.log(`  - ${e.file}: ${e.error}`);
      });
    }
    
    if (deletedCount === files.length) {
      console.log('\n✅ Todos os avatares foram excluídos com sucesso do Object Storage!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a exclusão:', error);
  }
}

// Executar o script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteStorageAvatars().catch(console.error);
}