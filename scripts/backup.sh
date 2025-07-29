#!/bin/bash

# Sistema de Backup Legislativo - Câmara de Jaíba
# Este script cria backups completos do banco de dados e arquivos

set -e

# Configurações
BACKUP_DIR="/home/runner/workspace/backups"
DB_BACKUP_DIR="$BACKUP_DIR/database"
FILES_BACKUP_DIR="$BACKUP_DIR/files"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Sistema de Backup Legislativo ===${NC}"
echo -e "${YELLOW}Iniciando backup em $(date)${NC}"

# Criar diretórios de backup se não existirem
mkdir -p "$DB_BACKUP_DIR"
mkdir -p "$FILES_BACKUP_DIR"

# Backup do Banco de Dados PostgreSQL
echo -e "${YELLOW}1. Fazendo backup do banco de dados...${NC}"
if [ -n "$DATABASE_URL" ]; then
    DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
    pg_dump "$DATABASE_URL" > "$DB_BACKUP_DIR/legislative_db_$TIMESTAMP.sql"
    
    # Comprimir o backup do banco
    gzip "$DB_BACKUP_DIR/legislative_db_$TIMESTAMP.sql"
    echo -e "${GREEN}✓ Backup do banco criado: legislative_db_$TIMESTAMP.sql.gz${NC}"
else
    echo -e "${RED}✗ DATABASE_URL não encontrada${NC}"
    exit 1
fi

# Backup dos arquivos de upload
echo -e "${YELLOW}2. Fazendo backup dos arquivos...${NC}"
if [ -d "/home/runner/workspace/uploads" ]; then
    tar -czf "$FILES_BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C /home/runner/workspace uploads/
    echo -e "${GREEN}✓ Backup dos arquivos criado: uploads_$TIMESTAMP.tar.gz${NC}"
else
    echo -e "${YELLOW}⚠ Diretório uploads não encontrado${NC}"
fi

# Backup da configuração do sistema
echo -e "${YELLOW}3. Fazendo backup da configuração...${NC}"
CONFIG_FILES=("package.json" "package-lock.json" "tsconfig.json" "drizzle.config.ts" "vite.config.ts" "tailwind.config.ts" "replit.md")
tar -czf "$FILES_BACKUP_DIR/config_$TIMESTAMP.tar.gz" -C /home/runner/workspace ${CONFIG_FILES[@]} 2>/dev/null || true
echo -e "${GREEN}✓ Backup da configuração criado: config_$TIMESTAMP.tar.gz${NC}"

# Backup do código fonte (opcional)
echo -e "${YELLOW}4. Fazendo backup do código fonte...${NC}"
tar -czf "$FILES_BACKUP_DIR/source_$TIMESTAMP.tar.gz" -C /home/runner/workspace \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='backups' \
    client/ server/ shared/ migrations/ mobile/ 2>/dev/null || true
echo -e "${GREEN}✓ Backup do código fonte criado: source_$TIMESTAMP.tar.gz${NC}"

# Listar tamanhos dos backups
echo -e "${YELLOW}5. Resumo dos backups criados:${NC}"
du -h "$DB_BACKUP_DIR"/*.gz 2>/dev/null | tail -1 || echo "Nenhum backup de banco encontrado"
du -h "$FILES_BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "Nenhum backup de arquivos encontrado"

# Limpeza de backups antigos (manter apenas os últimos 7 dias)
echo -e "${YELLOW}6. Limpando backups antigos (>7 dias)...${NC}"
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo -e "${GREEN}=== Backup concluído com sucesso! ===${NC}"
echo -e "${GREEN}Local dos backups: $BACKUP_DIR${NC}"
echo -e "${YELLOW}Concluído em $(date)${NC}"