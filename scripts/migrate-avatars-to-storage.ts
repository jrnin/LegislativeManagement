import fs from 'fs';
import path from 'path';
import { ObjectStorageService, objectStorageClient } from '../server/objectStorage';
import { storage } from '../server/storage';

/**
 * Script para migrar avatares do diretório local para Object Storage
 * e atualizar as URLs no banco de dados para garantir persistência
 */

async function migrateAvatarsToObjectStorage() {
  console.log('🚀 Iniciando migração de avatares para Object Storage...');
  
  const objectStorageService = new ObjectStorageService();
  const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
  
  // Verificar se o diretório existe
  if (!fs.existsSync(avatarDir)) {
    console.log('❌ Diretório de avatares não encontrado');
    return;
  }
  
  // Obter todos os arquivos de avatar
  const avatarFiles = fs.readdirSync(avatarDir).filter(file => 
    file.startsWith('avatar-') && 
    (file.endsWith('.jpg') || file.endsWith('.jpeg') || 
     file.endsWith('.png') || file.endsWith('.webp'))
  );
  
  console.log(`📁 Encontrados ${avatarFiles.length} arquivos de avatar`);
  
  // Obter o bucket do object storage
  const publicPaths = objectStorageService.getPublicObjectSearchPaths();
  const bucketPath = publicPaths[0]; // /replit-objstore-xxxxx/public
  const bucketName = bucketPath.split('/')[1];
  const bucket = objectStorageClient.bucket(bucketName);
  
  console.log(`☁️ Bucket Object Storage: ${bucketName}`);
  
  let migratedCount = 0;
  const migrationResults: Array<{
    localFile: string;
    cloudUrl: string;
    success: boolean;
    error?: string;
  }> = [];
  
  for (const avatarFile of avatarFiles) {
    try {
      const localFilePath = path.join(avatarDir, avatarFile);
      const cloudObjectPath = `public/avatars/${avatarFile}`;
      const cloudFile = bucket.file(cloudObjectPath);
      
      // Verificar se o arquivo já existe no Object Storage
      const [exists] = await cloudFile.exists();
      
      if (!exists) {
        console.log(`📤 Uploading ${avatarFile}...`);
        
        // Upload do arquivo para Object Storage
        await bucket.upload(localFilePath, {
          destination: cloudObjectPath,
          metadata: {
            contentType: getContentType(avatarFile),
            metadata: {
              'migrated-from': 'local-uploads',
              'migration-date': new Date().toISOString()
            }
          }
        });
        
        console.log(`✅ ${avatarFile} migrated successfully`);
      } else {
        console.log(`⏭️ ${avatarFile} already exists in Object Storage`);
      }
      
      const cloudUrl = `/public-objects/public/avatars/${avatarFile}`;
      migrationResults.push({
        localFile: avatarFile,
        cloudUrl,
        success: true
      });
      
      migratedCount++;
      
    } catch (error) {
      console.error(`❌ Error migrating ${avatarFile}:`, error);
      migrationResults.push({
        localFile: avatarFile,
        cloudUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log(`✅ Migração concluída: ${migratedCount}/${avatarFiles.length} arquivos`);
  
  // Agora, atualizar as URLs no banco de dados para usuários que têm avatares quebrados
  console.log('🔄 Atualizando URLs no banco de dados...');
  
  try {
    // Obter usuários com URLs de avatar locais ou quebradas
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      if (user.profileImageUrl) {
        // Se a URL aponta para uploads locais, tentar encontrar correspondência no Object Storage
        if (user.profileImageUrl.startsWith('/uploads/avatars/')) {
          const filename = path.basename(user.profileImageUrl);
          const migrationResult = migrationResults.find(r => r.localFile === filename && r.success);
          
          if (migrationResult) {
            await storage.updateUser(user.id, {
              profileImageUrl: migrationResult.cloudUrl
            });
            console.log(`🔗 Updated ${user.email}: ${migrationResult.cloudUrl}`);
          }
        }
        // Se a URL já aponta para Object Storage mas está quebrada, tentar reparar
        else if (user.profileImageUrl.startsWith('/public-objects/')) {
          const filename = path.basename(user.profileImageUrl);
          const migrationResult = migrationResults.find(r => r.localFile === filename && r.success);
          
          if (migrationResult) {
            await storage.updateUser(user.id, {
              profileImageUrl: migrationResult.cloudUrl
            });
            console.log(`🔧 Fixed ${user.email}: ${migrationResult.cloudUrl}`);
          }
        }
      }
    }
    
    console.log('✅ URLs do banco de dados atualizadas com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar URLs no banco:', error);
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO DE MIGRAÇÃO:');
  console.log(`Total de arquivos processados: ${avatarFiles.length}`);
  console.log(`Arquivos migrados com sucesso: ${migrationResults.filter(r => r.success).length}`);
  console.log(`Arquivos com erro: ${migrationResults.filter(r => !r.success).length}`);
  
  if (migrationResults.some(r => !r.success)) {
    console.log('\n❌ Arquivos com erro:');
    migrationResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.localFile}: ${r.error}`);
    });
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

// Executar o script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAvatarsToObjectStorage().catch(console.error);
}

export { migrateAvatarsToObjectStorage };