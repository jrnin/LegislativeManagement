const { Pool } = require('@neondatabase/serverless');
const ws = require("ws");

// Configure neon for WebSocket
const neonConfig = require('@neondatabase/serverless').neonConfig;
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Migration mapping
const pathMappings = {
  '/uploads/avatars/': '/public-objects/public/avatars/',
  '/uploads/news/': '/public-objects/public/news/',
  '/uploads/activities/': '/objects/.private/activities/',
  '/uploads/documents/': '/objects/.private/documents/',
};

function mapUploadPath(originalPath) {
  if (!originalPath) return originalPath;
  
  for (const [oldPath, newPath] of Object.entries(pathMappings)) {
    if (originalPath.startsWith(oldPath)) {
      return originalPath.replace(oldPath, newPath);
    }
  }
  return originalPath;
}

async function migrateReferences() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database references migration...');
    
    const migrationResults = {
      users: { updated: 0, errors: 0 },
      activities: { updated: 0, errors: 0 },
      documents: { updated: 0, errors: 0 },
      news: { updated: 0, errors: 0 }
    };

    // Update user avatars
    console.log('\n📂 Updating user avatars...');
    const usersResult = await client.query(
      "SELECT id, profile_image_url FROM users WHERE profile_image_url LIKE '/uploads/%'"
    );
    
    for (const user of usersResult.rows) {
      try {
        const newPath = mapUploadPath(user.profile_image_url);
        await client.query(
          "UPDATE users SET profile_image_url = $1 WHERE id = $2",
          [newPath, user.id]
        );
        migrationResults.users.updated++;
        console.log(`   ✅ User ${user.id}: ${user.profile_image_url} → ${newPath}`);
      } catch (error) {
        console.error(`   ❌ Error updating user ${user.id}:`, error.message);
        migrationResults.users.errors++;
      }
    }

    // Update legislative activities
    console.log('\n📂 Updating legislative activities...');
    const activitiesResult = await client.query(
      "SELECT id, file_path FROM legislative_activities WHERE file_path LIKE '/uploads/%'"
    );
    
    for (const activity of activitiesResult.rows) {
      try {
        const newPath = mapUploadPath(activity.file_path);
        await client.query(
          "UPDATE legislative_activities SET file_path = $1 WHERE id = $2",
          [newPath, activity.id]
        );
        migrationResults.activities.updated++;
        console.log(`   ✅ Activity ${activity.id}: ${activity.file_path} → ${newPath}`);
      } catch (error) {
        console.error(`   ❌ Error updating activity ${activity.id}:`, error.message);
        migrationResults.activities.errors++;
      }
    }

    // Update documents
    console.log('\n📂 Updating documents...');
    const documentsResult = await client.query(
      "SELECT id, file_path FROM documents WHERE file_path LIKE '/uploads/%'"
    );
    
    for (const doc of documentsResult.rows) {
      try {
        const newPath = mapUploadPath(doc.file_path);
        await client.query(
          "UPDATE documents SET file_path = $1 WHERE id = $2",
          [newPath, doc.id]
        );
        migrationResults.documents.updated++;
        console.log(`   ✅ Document ${doc.id}: ${doc.file_path} → ${newPath}`);
      } catch (error) {
        console.error(`   ❌ Error updating document ${doc.id}:`, error.message);
        migrationResults.documents.errors++;
      }
    }

    // Update news articles
    console.log('\n📂 Updating news articles...');
    const newsResult = await client.query(
      "SELECT id, image_url FROM news_articles WHERE image_url LIKE '/uploads/%'"
    );
    
    for (const article of newsResult.rows) {
      try {
        const newPath = mapUploadPath(article.image_url);
        await client.query(
          "UPDATE news_articles SET image_url = $1 WHERE id = $2",
          [newPath, article.id]
        );
        migrationResults.news.updated++;
        console.log(`   ✅ News ${article.id}: ${article.image_url} → ${newPath}`);
      } catch (error) {
        console.error(`   ❌ Error updating news ${article.id}:`, error.message);
        migrationResults.news.errors++;
      }
    }

    // Summary
    const totalUpdated = Object.values(migrationResults).reduce((sum, r) => sum + r.updated, 0);
    const totalErrors = Object.values(migrationResults).reduce((sum, r) => sum + r.errors, 0);

    console.log('\n📊 MIGRATION SUMMARY');
    console.log('====================');
    console.log(`✅ Total updated: ${totalUpdated}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    
    for (const [category, data] of Object.entries(migrationResults)) {
      console.log(`📂 ${category.toUpperCase()}: ${data.updated} updated, ${data.errors} errors`);
    }

    if (totalErrors === 0) {
      console.log('\n🎉 Database migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
    }

    return migrationResults;

  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateReferences().catch(console.error);
}

module.exports = { migrateReferences };