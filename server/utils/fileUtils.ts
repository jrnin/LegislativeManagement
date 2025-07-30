
import path from 'path';
import fs from 'fs';

export interface FileLocation {
  directory: string;
  relativePath: string;
  fullPath: string;
}

/**
 * Determina o diretório apropriado para um tipo de arquivo
 */
export function getFileDirectory(fileType: 'activity' | 'document' | 'event' | 'avatar' | 'news' | 'general'): string {
  const baseDir = path.join(process.cwd(), 'uploads');
  
  switch (fileType) {
    case 'activity':
      return path.join(baseDir, 'activities');
    case 'document':
      return path.join(baseDir, 'documents');
    case 'event':
      return path.join(baseDir, 'events');
    case 'avatar':
      return path.join(baseDir, 'avatars');
    case 'news':
      return path.join(baseDir, 'news');
    default:
      return path.join(baseDir, 'general');
  }
}

/**
 * Cria um diretório organizado por data
 */
export function createDateOrganizedDirectory(baseType: string): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  const targetDir = path.join(
    process.cwd(), 
    'uploads', 
    baseType, 
    String(year), 
    month
  );
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  return targetDir;
}

/**
 * Gera um nome de arquivo único
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  return `${timestamp}-${randomString}${ext}`;
}

/**
 * Obter URL pública para um arquivo
 */  
export function getPublicFileUrl(filePath: string): string {
  // Remove o caminho base e mantem apenas o caminho relativo a partir de uploads/
  const uploadsIndex = filePath.indexOf('uploads');
  if (uploadsIndex !== -1) {
    return '/' + filePath.substring(uploadsIndex);
  }
  return filePath;
}

/**
 * Verificar se um arquivo existe e retornar informações
 */
export function getFileInfo(filePath: string): FileLocation | null {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const stats = fs.statSync(fullPath);
    const relativePath = path.relative(path.join(process.cwd(), 'uploads'), fullPath);
    const directory = path.dirname(relativePath);
    
    return {
      directory,
      relativePath,
      fullPath,
    };
  } catch (error) {
    return null;
  }
}
