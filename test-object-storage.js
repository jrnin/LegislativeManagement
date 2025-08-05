// Test script to check Object Storage
const fetch = require('node-fetch');

async function testObjectStorage() {
  console.log('Testing Object Storage for documents...');
  
  try {
    // Test 1: Check if we can get upload URL (this will fail due to auth, but we can see the structure)
    console.log('1. Testing upload URL endpoint...');
    const uploadResponse = await fetch('http://localhost:5000/api/documents/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Upload URL Status:', uploadResponse.status);
    const uploadResult = await uploadResponse.text();
    console.log('Upload URL Response:', uploadResult);
    
    // Test 2: Test creating document with Object Storage data (simulated)
    console.log('\n2. Testing document creation with Object Storage URL...');
    const docData = {
      documentNumber: 999,
      documentType: "Teste",
      documentDate: "2025-08-05",
      authorType: "Mesa Diretora",
      description: "Teste de Object Storage",
      status: "Em análise",
      uploadedFileURL: "https://storage.googleapis.com/test-bucket/test-file.pdf",
      originalFileName: "test-document.pdf",
      mimeType: "application/pdf"
    };
    
    const docResponse = await fetch('http://localhost:5000/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(docData)
    });
    
    console.log('Document Creation Status:', docResponse.status);
    const docResult = await docResponse.text();
    console.log('Document Creation Response:', docResult);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testObjectStorage();