const { Storage } = require("@google-cloud/storage");

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Configure Object Storage client
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

async function listObjectStorageContents() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  
  if (!bucketId) {
    console.error('❌ DEFAULT_OBJECT_STORAGE_BUCKET_ID not found');
    return;
  }

  console.log('🗂️ OBJECT STORAGE CONTENTS');
  console.log('==========================');
  console.log(`📦 Bucket: ${bucketId}\n`);

  try {
    const bucket = objectStorageClient.bucket(bucketId);
    const [files] = await bucket.getFiles();

    if (files.length === 0) {
      console.log('📭 Bucket is empty');
      return;
    }

    // Group files by directory
    const directories = {};
    let totalSize = 0;

    for (const file of files) {
      const parts = file.name.split('/');
      const dir = parts.slice(0, -1).join('/') || 'root';
      const fileName = parts[parts.length - 1];
      
      if (!directories[dir]) {
        directories[dir] = [];
      }
      
      const [metadata] = await file.getMetadata();
      const size = parseInt(metadata.size || 0);
      totalSize += size;
      
      directories[dir].push({
        name: fileName,
        size: size,
        created: metadata.timeCreated,
        contentType: metadata.contentType
      });
    }

    // Display organized structure
    for (const [dirPath, files] of Object.entries(directories)) {
      console.log(`📁 ${dirPath}/`);
      
      for (const file of files) {
        const sizeStr = formatFileSize(file.size);
        const date = new Date(file.created).toLocaleDateString('pt-BR');
        console.log(`   📄 ${file.name} (${sizeStr}) - ${date}`);
      }
      console.log('');
    }

    console.log('📊 SUMMARY');
    console.log('===========');
    console.log(`📄 Total files: ${files.length}`);
    console.log(`💾 Total size: ${formatFileSize(totalSize)}`);
    console.log(`📂 Directories: ${Object.keys(directories).length}`);

  } catch (error) {
    console.error('❌ Error listing files:', error.message);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run if called directly
if (require.main === module) {
  listObjectStorageContents().catch(console.error);
}

module.exports = { listObjectStorageContents };