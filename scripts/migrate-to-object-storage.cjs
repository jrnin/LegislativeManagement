const fs = require('fs').promises;
const path = require('path');
const { Storage } = require('@google-cloud/storage');

// Configuration for Object Storage
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Initialize Google Cloud Storage client
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

// Migration categories mapping
const MIGRATION_MAPPING = {
  'avatars': {
    bucket: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID,
    prefix: 'public/avatars',
    visibility: 'public',
    description: 'User profile images'
  },
  'news': {
    bucket: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID,
    prefix: 'public/news',
    visibility: 'public',
    description: 'News article images'
  },
  'activities': {
    bucket: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID,
    prefix: '.private/activities',
    visibility: 'private',
    description: 'Legislative activity documents'
  },
  'documents': {
    bucket: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID,
    prefix: '.private/documents',
    visibility: 'private',
    description: 'Official documents'
  }
};

// Parse object path for bucket and object name
function parseObjectPath(fullPath) {
  if (!fullPath.startsWith("/")) {
    fullPath = `/${fullPath}`;
  }
  const pathParts = fullPath.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

// Set ACL policy for migrated file
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
  
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

// Get all files recursively from a directory
async function getAllFiles(dirPath, basePath = '') {
  const files = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else {
        const stats = await fs.stat(fullPath);
        files.push({
          localPath: fullPath,
          relativePath: relativePath.replace(/\\/g, '/'),
          name: entry.name,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}:`, error.message);
  }
  
  return files;
}

// Upload file to Object Storage
async function uploadFile(localPath, category, relativePath) {
  const mapping = MIGRATION_MAPPING[category];
  if (!mapping) {
    throw new Error(`No mapping found for category: ${category}`);
  }

  // Construct cloud path
  const cloudPath = `/${mapping.bucket}/${mapping.prefix}/${relativePath}`;
  const { bucketName, objectName } = parseObjectPath(cloudPath);
  
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  console.log(`Uploading ${localPath} to ${cloudPath}...`);
  
  // Upload file
  await bucket.upload(localPath, {
    destination: objectName,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  // Set ACL policy
  const aclPolicy = {
    owner: 'system',
    visibility: mapping.visibility,
    aclRules: mapping.visibility === 'private' ? [{
      group: { type: 'admin_only', id: 'admin' },
      permission: 'read'
    }] : undefined
  };
  
  await setObjectAclPolicy(file, aclPolicy);
  
  return {
    localPath,
    cloudPath: `/${mapping.visibility === 'public' ? 'public-objects' : 'objects'}${cloudPath.substring(cloudPath.indexOf('/', 1))}`,
    category,
    size: (await fs.stat(localPath)).size
  };
}

// Main migration function
async function migrateUploads() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const migrationReport = {
    startTime: new Date(),
    categories: {},
    totalFiles: 0,
    totalSize: 0,
    errors: [],
    success: []
  };

  console.log('🚀 Starting Object Storage migration...');
  console.log(`📁 Source directory: ${uploadsDir}`);
  
  // Check if uploads directory exists
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    console.error('❌ Uploads directory not found:', uploadsDir);
    return;
  }

  // Process each category
  for (const [category, mapping] of Object.entries(MIGRATION_MAPPING)) {
    const categoryDir = path.join(uploadsDir, category);
    
    console.log(`\n📂 Processing category: ${category} (${mapping.description})`);
    
    try {
      await fs.access(categoryDir);
      const files = await getAllFiles(categoryDir);
      
      migrationReport.categories[category] = {
        description: mapping.description,
        visibility: mapping.visibility,
        totalFiles: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        migrated: 0,
        errors: []
      };

      console.log(`   Found ${files.length} files (${formatSize(migrationReport.categories[category].totalSize)})`);

      // Upload each file
      for (const file of files) {
        try {
          const result = await uploadFile(file.localPath, category, file.relativePath);
          migrationReport.categories[category].migrated++;
          migrationReport.success.push(result);
          migrationReport.totalFiles++;
          migrationReport.totalSize += result.size;
          
          console.log(`   ✅ ${file.name} → ${result.cloudPath}`);
        } catch (error) {
          const errorInfo = {
            category,
            file: file.relativePath,
            error: error.message
          };
          migrationReport.categories[category].errors.push(errorInfo);
          migrationReport.errors.push(errorInfo);
          console.log(`   ❌ Failed: ${file.name} - ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ⚠️  Category directory not found: ${categoryDir}`);
      migrationReport.categories[category] = {
        description: mapping.description,
        totalFiles: 0,
        totalSize: 0,
        migrated: 0,
        errors: [{ error: 'Directory not found' }]
      };
    }
  }

  // Generate migration report
  migrationReport.endTime = new Date();
  migrationReport.duration = migrationReport.endTime - migrationReport.startTime;

  console.log('\n📊 MIGRATION SUMMARY');
  console.log('====================');
  console.log(`⏱️  Duration: ${Math.round(migrationReport.duration / 1000)}s`);
  console.log(`📁 Total files migrated: ${migrationReport.totalFiles}`);
  console.log(`💾 Total size: ${formatSize(migrationReport.totalSize)}`);
  console.log(`❌ Total errors: ${migrationReport.errors.length}`);

  for (const [category, data] of Object.entries(migrationReport.categories)) {
    console.log(`\n📂 ${category.toUpperCase()}`);
    console.log(`   Description: ${data.description}`);
    console.log(`   Visibility: ${data.visibility}`);
    console.log(`   Files: ${data.migrated}/${data.totalFiles} migrated`);
    console.log(`   Size: ${formatSize(data.totalSize)}`);
    if (data.errors.length > 0) {
      console.log(`   Errors: ${data.errors.length}`);
    }
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), `migration-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(migrationReport, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);

  if (migrationReport.errors.length === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with some errors. Check the report for details.');
  }

  return migrationReport;
}

// Utility function to format file sizes
function formatSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Run migration if called directly
if (require.main === module) {
  migrateUploads().catch(console.error);
}

module.exports = { migrateUploads };