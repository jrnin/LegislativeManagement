import { storage } from '../server/storage';
import { ObjectStorageService } from '../server/objectStorage';

async function createTestDocument() {
  console.log('📝 Criando documento de teste via Object Storage...');
  
  try {
    const objectStorageService = new ObjectStorageService();
    
    // Create a simple PDF content (for demonstration)
    const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Documento de Teste - Object Storage) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000212 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
306
%%EOF`;
    
    // Convert to buffer
    const fileBuffer = Buffer.from(testPdfContent, 'utf8');
    
    // Get upload URL
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    console.log('🔗 URL de upload obtida');
    
    // Upload to Object Storage
    const uploadResponse = await fetch(uploadURL, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload falhou: ${uploadResponse.status}`);
    }
    
    console.log('✅ Arquivo enviado para Object Storage');
    
    // Set ACL policy
    const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    await objectStorageService.trySetObjectEntityAclPolicy(
      uploadURL,
      {
        owner: 'system-test',
        visibility: "private",
        aclRules: []
      }
    );
    
    console.log('🔒 Política de ACL configurada');
    
    // Create document record in database
    const documentData = {
      documentNumber: 999,
      exerciseYear: 2025,
      documentDate: new Date('2025-08-05'),
      title: 'Documento de Teste - Object Storage',
      description: 'Documento criado automaticamente para testar a integração com Object Storage',
      fileName: 'teste-object-storage.pdf',
      filePath: normalizedPath,
      fileType: 'application/pdf',
      fileSize: fileBuffer.length,
      category: 'PORTARIA',
      documentType: 'PORTARIA',
      authorType: 'CAMARA', // Campo obrigatório
      status: 'ACTIVE',
      isPublic: false,
      createdBy: 1,
      legislatureId: 1,
    };
    
    const newDocument = await storage.createDocument(documentData);
    
    console.log(`📋 Documento criado no banco de dados (ID: ${newDocument.id})`);
    console.log(`📁 Caminho no Object Storage: ${normalizedPath}`);
    console.log(`📊 Tamanho do arquivo: ${fileBuffer.length} bytes`);
    
    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('✅ Object Storage está funcionando perfeitamente');
    console.log('✅ Documento criado e armazenado na nuvem');
    console.log('✅ Registro salvo no banco de dados');
    
    return newDocument;
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    throw error;
  }
}

// Run test
createTestDocument().catch(console.error);