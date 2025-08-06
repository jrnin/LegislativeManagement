// Script para gerar slugs para usuários existentes
import { db } from '../server/db.ts';
import { users } from '../shared/schema.ts';
import { eq, isNull } from 'drizzle-orm';

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "");
}

async function generateUserSlugs() {
  try {
    console.log('Gerando slugs para usuários existentes...');
    
    // Buscar todos os usuários sem slug (incluindo NULL)
    const usersWithoutSlug = await db.select().from(users).where(isNull(users.slug));
    
    console.log(`Encontrados ${usersWithoutSlug.length} usuários sem slug`);
    
    for (const user of usersWithoutSlug) {
      let baseSlug = generateSlug(user.name);
      let slug = baseSlug;
      let counter = 1;
      
      // Verificar se o slug já existe e adicionar contador se necessário
      while (true) {
        const existingUser = await db.select().from(users).where(eq(users.slug, slug)).limit(1);
        
        if (existingUser.length === 0) {
          break;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // Atualizar o usuário com o slug
      await db.update(users)
        .set({ slug })
        .where(eq(users.id, user.id));
      
      console.log(`✓ ${user.name} -> ${slug}`);
    }
    
    console.log('✅ Slugs gerados com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao gerar slugs:', error);
    process.exit(1);
  }
}

generateUserSlugs();