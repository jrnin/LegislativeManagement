#!/usr/bin/env tsx

import { db } from "../server/db";
import { documents } from "../shared/schema";
import { ObjectStorageService } from "../server/objectStorage";
import { ObjectPermission } from "../server/objectAcl";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

interface MigrationResult {
  totalDocuments: number;
  documentsWithFiles: number;
  migratedSuccessfully: number;
  migrationErrors: number;
  errors: string[];
}

async function migrateDocumentsToObjectStorage(): Promise<MigrationResult> {
  console.log("🚀 Iniciando migração de documentos para Object Storage...");
  
  const result: MigrationResult = {
    totalDocuments: 0,
    documentsWithFiles: 0,
    migratedSuccessfully: 0,
    migrationErrors: 0,
    errors: []
  };

  try {
    // Get all documents from database
    const allDocuments = await db.select().from(documents);
    result.totalDocuments = allDocuments.length;
    
    console.log(`📋 Encontrados ${result.totalDocuments} documentos no banco de dados`);

    const objectStorageService = new ObjectStorageService();

    for (const document of allDocuments) {
      if (!document.filePath) {
        console.log(`⏭️  Documento ID ${document.id} não possui arquivo anexado, pulando...`);
        continue;
      }

      result.documentsWithFiles++;
      
      try {
        // Check if file path is already in Object Storage format
        if (document.filePath.startsWith('/objects/')) {
          console.log(`✅ Documento ID ${document.id} já está no Object Storage: ${document.filePath}`);
          continue;
        }

        // Determine if file exists in local file system
        const localFilePath = path.resolve(document.filePath);
        if (!fs.existsSync(localFilePath)) {
          const error = `❌ Arquivo local não encontrado: ${localFilePath}`;
          console.log(error);
          result.errors.push(`Documento ID ${document.id}: ${error}`);
          result.migrationErrors++;
          continue;
        }

        console.log(`📤 Migrando documento ID ${document.id}: ${document.fileName || 'sem nome'}`);

        // Get organized upload URL based on document date
        const documentDate = new Date(document.documentDate);
        const year = documentDate.getFullYear();
        const month = String(documentDate.getMonth() + 1).padStart(2, '0');
        
        // Read file content
        const fileContent = fs.readFileSync(localFilePath);
        const fileStats = fs.statSync(localFilePath);

        // Get upload URL for organized structure
        const uploadURL = await objectStorageService.getDocumentUploadURL();
        
        // Upload file to Object Storage
        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: fileContent,
          headers: {
            'Content-Type': document.fileType || 'application/octet-stream',
            'Content-Length': fileStats.size.toString()
          }
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        // Set ACL policy for the uploaded file
        const cloudPath = await objectStorageService.trySetObjectEntityAclPolicy(
          uploadURL,
          {
            owner: 'system-migration',
            visibility: 'private',
            aclRules: [{
              group: { type: 'admin_only' as any, id: 'admin' },
              permission: ObjectPermission.READ
            }]
          }
        );

        // Update document record in database with new cloud path
        await db.update(documents)
          .set({
            filePath: cloudPath,
            updatedAt: new Date()
          })
          .where(eq(documents.id, document.id));

        console.log(`✅ Documento ID ${document.id} migrado com sucesso para: ${cloudPath}`);
        result.migratedSuccessfully++;

        // Optional: Remove local file after successful migration
        // fs.unlinkSync(localFilePath);
        // console.log(`🗑️  Arquivo local removido: ${localFilePath}`);

      } catch (error) {
        const errorMsg = `Erro ao migrar documento ID ${document.id}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.migrationErrors++;
      }
    }

  } catch (error) {
    console.error("❌ Erro geral na migração:", error);
    result.errors.push(`Erro geral: ${error.message}`);
  }

  return result;
}

async function main() {
  console.log("=".repeat(60));
  console.log("📦 MIGRAÇÃO DE DOCUMENTOS PARA OBJECT STORAGE");
  console.log("=".repeat(60));

  const startTime = Date.now();
  
  try {
    const result = await migrateDocumentsToObjectStorage();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 RELATÓRIO DA MIGRAÇÃO");
    console.log("=".repeat(60));
    console.log(`⏱️  Tempo total: ${duration}s`);
    console.log(`📋 Total de documentos: ${result.totalDocuments}`);
    console.log(`📎 Documentos com arquivos: ${result.documentsWithFiles}`);
    console.log(`✅ Migrados com sucesso: ${result.migratedSuccessfully}`);
    console.log(`❌ Erros de migração: ${result.migrationErrors}`);
    
    if (result.errors.length > 0) {
      console.log("\n🚨 ERROS ENCONTRADOS:");
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (result.migratedSuccessfully > 0) {
      console.log("\n🎉 Migração concluída! Os documentos foram organizados na estrutura:");
      console.log("📁 /uploads/documents/YYYY/MM/[arquivo-id]");
    }

  } catch (error) {
    console.error("💥 Falha crítica na migração:", error);
    process.exit(1);
  }
}

// Execute migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log("\n✨ Migração finalizada!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erro fatal:", error);
      process.exit(1);
    });
}

export { migrateDocumentsToObjectStorage };