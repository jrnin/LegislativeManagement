
#!/bin/bash

# Script para reorganizar arquivos existentes no diretório uploads
# Organiza por tipo e data para melhor estruturação

set -e

UPLOADS_DIR="/home/runner/workspace/uploads"
BACKUP_DIR="/home/runner/workspace/uploads_backup_$(date +%s)"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Reorganização do Diretório Uploads ===${NC}"

# Criar backup dos arquivos atuais
echo -e "${YELLOW}1. Criando backup dos arquivos atuais...${NC}"
if [ -d "$UPLOADS_DIR" ]; then
    cp -r "$UPLOADS_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup criado em: $BACKUP_DIR${NC}"
else
    echo -e "${RED}✗ Diretório uploads não encontrado${NC}"
    exit 1
fi

# Criar estrutura de diretórios organizados
echo -e "${YELLOW}2. Criando estrutura de diretórios...${NC}"
mkdir -p "$UPLOADS_DIR/activities/2025"
mkdir -p "$UPLOADS_DIR/documents/2025"
mkdir -p "$UPLOADS_DIR/events/2025"
mkdir -p "$UPLOADS_DIR/general/2025"

# Organizar arquivos PDF e DOCX por tipo (baseado nos nomes dos arquivos na database)
echo -e "${YELLOW}3. Organizando arquivos por tipo...${NC}"

# Mover arquivos PDF e DOCX gerais para diretório apropriado
for file in "$UPLOADS_DIR"/*.pdf "$UPLOADS_DIR"/*.docx 2>/dev/null; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Por padrão, mover para documents se não conseguir determinar o tipo
        mv "$file" "$UPLOADS_DIR/documents/2025/$filename"
        echo "Movido: $filename → documents/2025/"
    fi
done

echo -e "${GREEN}✓ Reorganização concluída!${NC}"
echo -e "${YELLOW}Estrutura atual:${NC}"
tree "$UPLOADS_DIR" -L 3 2>/dev/null || ls -la "$UPLOADS_DIR"

echo -e "${YELLOW}Backup dos arquivos originais disponível em: $BACKUP_DIR${NC}"
