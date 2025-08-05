import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test Object Storage upload functionality
async function testObjectStorageUpload() {
  console.log('🧪 Testando Object Storage para documentos...');
  
  const baseUrl = 'https://ad405bb0-2381-4a9c-8f6a-f7eb900f9bd8-00-2ute594oeu4o5.worf.replit.dev';
  
  try {
    // 1. Login to get session
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'root@sistema-legislativo.com',
        password: 'admin@123'
      })
    });
    
    // Get cookies from login
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Falha no login');
      return;
    }
    
    // 2. Get upload URL
    console.log('2. Obtendo URL de upload...');
    const uploadUrlResponse = await fetch(`${baseUrl}/api/documents/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      }
    });
    
    if (uploadUrlResponse.status !== 200) {
      console.log('❌ Falha ao obter URL de upload:', uploadUrlResponse.status);
      const errorText = await uploadUrlResponse.text();
      console.log('Erro:', errorText);
      return;
    }
    
    const { uploadURL } = await uploadUrlResponse.json();
    console.log('✅ URL de upload obtida com sucesso');
    
    // 3. Create a test file
    const testContent = 'Este é um documento de teste para Object Storage.\nData: ' + new Date().toISOString();
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    // 4. Upload file to Object Storage
    console.log('3. Fazendo upload do arquivo...');
    const fileBuffer = fs.readFileSync(testFilePath);
    
    const uploadResponse = await fetch(uploadURL, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
    
    if (uploadResponse.status !== 200) {
      console.log('❌ Falha no upload:', uploadResponse.status);
      return;
    }
    
    console.log('✅ Arquivo enviado para Object Storage com sucesso');
    
    // 5. Create document in database
    console.log('4. Criando documento no banco de dados...');
    const documentData = {
      documentNumber: Math.floor(Math.random() * 1000) + 1000,
      documentType: 'Teste Object Storage',
      documentDate: new Date().toISOString().split('T')[0],
      authorType: 'Sistema',
      description: 'Documento de teste para validar Object Storage',
      status: 'Ativo',
      fileName: 'test-document.txt',
      fileType: 'text/plain',
      filePath: uploadURL.replace('https://storage.googleapis.com', ''),
      fileUploadUrl: uploadURL
    };
    
    const createDocResponse = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      body: JSON.stringify(documentData)
    });
    
    if (createDocResponse.status !== 201) {
      console.log('❌ Falha ao criar documento:', createDocResponse.status);
      const errorText = await createDocResponse.text();
      console.log('Erro:', errorText);
      return;
    }
    
    const createdDoc = await createDocResponse.json();
    console.log('✅ Documento criado com sucesso. ID:', createdDoc.id);
    
    // 6. Test download
    console.log('5. Testando download...');
    const downloadResponse = await fetch(`${baseUrl}/api/download/documents/${createdDoc.id}`, {
      headers: {
        'Cookie': cookies || '',
      }
    });
    
    if (downloadResponse.status !== 200) {
      console.log('❌ Falha no download:', downloadResponse.status);
      return;
    }
    
    const downloadedContent = await downloadResponse.text();
    console.log('✅ Download realizado com sucesso');
    console.log('Conteúdo:', downloadedContent.substring(0, 100) + '...');
    
    // Cleanup
    fs.unlinkSync(testFilePath);
    
    console.log('\n🎉 TESTE COMPLETO COM SUCESSO!');
    console.log('📊 Object Storage está funcionando corretamente para documentos');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testObjectStorageUpload().catch(console.error);