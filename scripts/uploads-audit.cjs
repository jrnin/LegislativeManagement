#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Script para auditoria do diretório /uploads
 * Gera logs detalhados de todas as atividades de arquivo nos últimos N dias
 */

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DEFAULT_DAYS = 6;

// Função para formatar data
function formatDate(date) {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

// Função para formatar tamanho de arquivo
function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Função para calcular hash MD5 de um arquivo
function calculateFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5');
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    return 'ERROR: ' + error.message;
  }
}

// Função para escanear diretório recursivamente
function scanDirectory(dir, cutoffDate, results = []) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        scanDirectory(fullPath, cutoffDate, results);
      } else if (stats.isFile()) {
        // Verificar se o arquivo foi modificado após a data de corte
        if (stats.mtime >= cutoffDate) {
          const relativePath = path.relative(UPLOADS_DIR, fullPath);
          const fileHash = calculateFileHash(fullPath);
          
          results.push({
            path: relativePath,
            fullPath: fullPath,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
            hash: fileHash,
            extension: path.extname(fullPath).toLowerCase(),
            category: getFileCategory(relativePath)
          });
        }
      }
    }
  } catch (error) {
    console.error(`Erro ao escanear diretório ${dir}:`, error.message);
  }
  
  return results;
}

// Função para categorizar arquivos
function getFileCategory(relativePath) {
  if (relativePath.includes('activities/')) return 'Atividade Legislativa';
  if (relativePath.includes('documents/')) return 'Documento';
  if (relativePath.includes('events/')) return 'Evento';
  if (relativePath.includes('avatars/')) return 'Avatar de Usuário';
  if (relativePath.includes('news/')) return 'Imagem de Notícia';
  return 'Geral';
}

// Função para gerar relatório
function generateReport(files, days) {
  const report = {
    timestamp: new Date().toISOString(),
    auditPeriod: `${days} dias`,
    cutoffDate: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)),
    summary: {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      categories: {}
    },
    files: files.sort((a, b) => b.modified - a.modified)
  };
  
  // Agrupar por categoria
  files.forEach(file => {
    if (!report.summary.categories[file.category]) {
      report.summary.categories[file.category] = {
        count: 0,
        size: 0
      };
    }
    report.summary.categories[file.category].count++;
    report.summary.categories[file.category].size += file.size;
  });
  
  // Formatar tamanhos nas categorias
  Object.keys(report.summary.categories).forEach(category => {
    report.summary.categories[category].sizeFormatted = 
      formatFileSize(report.summary.categories[category].size);
  });
  
  report.summary.totalSizeFormatted = formatFileSize(report.summary.totalSize);
  
  return report;
}

// Função para gerar log em formato texto
function generateTextLog(report) {
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push(`RELATÓRIO DE AUDITORIA DO DIRETÓRIO /uploads`);
  lines.push('='.repeat(80));
  lines.push(`Data da Auditoria: ${formatDate(new Date(report.timestamp))}`);
  lines.push(`Período Analisado: ${report.auditPeriod} (desde ${formatDate(report.cutoffDate)})`);
  lines.push('');
  
  lines.push('RESUMO GERAL:');
  lines.push('-'.repeat(40));
  lines.push(`Total de Arquivos: ${report.summary.totalFiles}`);
  lines.push(`Tamanho Total: ${report.summary.totalSizeFormatted}`);
  lines.push('');
  
  lines.push('POR CATEGORIA:');
  lines.push('-'.repeat(40));
  Object.entries(report.summary.categories).forEach(([category, data]) => {
    lines.push(`${category}: ${data.count} arquivos (${data.sizeFormatted})`);
  });
  lines.push('');
  
  lines.push('DETALHES DOS ARQUIVOS:');
  lines.push('-'.repeat(80));
  lines.push('Data/Hora'.padEnd(20) + 'Tamanho'.padEnd(12) + 'Categoria'.padEnd(20) + 'Arquivo');
  lines.push('-'.repeat(80));
  
  report.files.forEach(file => {
    const dateStr = formatDate(file.modified);
    const sizeStr = file.sizeFormatted;
    const categoryStr = file.category;
    const pathStr = file.path;
    
    lines.push(`${dateStr.padEnd(20)}${sizeStr.padEnd(12)}${categoryStr.padEnd(20)}${pathStr}`);
  });
  
  lines.push('');
  lines.push('HASHES MD5 DOS ARQUIVOS:');
  lines.push('-'.repeat(80));
  
  report.files.forEach(file => {
    lines.push(`${file.hash}  ${file.path}`);
  });
  
  return lines.join('\n');
}

// Função principal
function main() {
  const args = process.argv.slice(2);
  const days = args.length > 0 ? parseInt(args[0]) : DEFAULT_DAYS;
  
  if (isNaN(days) || days <= 0) {
    console.error('Erro: Número de dias deve ser um valor positivo');
    process.exit(1);
  }
  
  console.log(`Iniciando auditoria do diretório /uploads para os últimos ${days} dias...`);
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error(`Erro: Diretório ${UPLOADS_DIR} não encontrado`);
    process.exit(1);
  }
  
  const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  console.log(`Analisando arquivos modificados desde: ${formatDate(cutoffDate)}`);
  
  const files = scanDirectory(UPLOADS_DIR, cutoffDate);
  const report = generateReport(files, days);
  
  // Gerar nome do arquivo de log
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logFileName = `uploads-audit-${timestamp}.log`;
  const jsonFileName = `uploads-audit-${timestamp}.json`;
  
  // Salvar relatório em texto
  const textLog = generateTextLog(report);
  fs.writeFileSync(logFileName, textLog);
  
  // Salvar relatório em JSON
  fs.writeFileSync(jsonFileName, JSON.stringify(report, null, 2));
  
  console.log('');
  console.log('='.repeat(60));
  console.log(`Auditoria concluída!`);
  console.log(`Período analisado: ${days} dias`);
  console.log(`Arquivos encontrados: ${report.summary.totalFiles}`);
  console.log(`Tamanho total: ${report.summary.totalSizeFormatted}`);
  console.log('');
  console.log(`Relatórios salvos:`);
  console.log(`- Texto: ${logFileName}`);
  console.log(`- JSON:  ${jsonFileName}`);
  console.log('='.repeat(60));
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  generateReport,
  generateTextLog,
  formatDate,
  formatFileSize
};