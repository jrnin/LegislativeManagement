#!/bin/bash

# Sistema de Restauração Legislativo - Câmara de Jaíba
# Este script restaura backups do banco de dados e arquivos

set -e

# Configurações
BACKUP_DIR="/home/runner/workspace/backups"
DB_BACKUP_DIR="$BACKUP_DIR/database"
FILES_BACKUP_DIR="$BACKUP_DIR/files"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Sistema de Restauração Legislativo ===${NC}"

# Verificar se há backups disponíveis
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}✗ Diretório de backup não encontrado: $BACKUP_DIR${NC}"
    exit 1
fi

# Listar backups disponíveis
echo -e "${YELLOW}Backups disponíveis:${NC}"
echo -e "${BLUE}=== Banco de Dados ===${NC}"
ls -la "$DB_BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print NR". "$9" ("$5" bytes, "$6" "$7" "$8")"}' || echo "Nenhum backup de banco encontrado"

echo -e "${BLUE}=== Arquivos ===${NC}"
ls -la "$FILES_BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | awk '{print NR". "$9" ("$5" bytes, "$6" "$7" "$8")"}' || echo "Nenhum backup de arquivos encontrado"

echo -e "${BLUE}=== Configuração ===${NC}"
ls -la "$FILES_BACKUP_DIR"/config_*.tar.gz 2>/dev/null | awk '{print NR". "$9" ("$5" bytes, "$6" "$7" "$8")"}' || echo "Nenhum backup de configuração encontrado"

echo -e "${BLUE}=== Código Fonte ===${NC}"
ls -la "$FILES_BACKUP_DIR"/source_*.tar.gz 2>/dev/null | awk '{print NR". "$9" ("$5" bytes, "$6" "$7" "$8")"}' || echo "Nenhum backup de código fonte encontrado"

echo ""
echo -e "${YELLOW}Para restaurar um backup específico, use:${NC}"
echo -e "${GREEN}Banco de dados:${NC} ./scripts/restore.sh db <nome_do_arquivo.sql.gz>"
echo -e "${GREEN}Arquivos:${NC} ./scripts/restore.sh files <nome_do_arquivo.tar.gz>"
echo -e "${GREEN}Configuração:${NC} ./scripts/restore.sh config <nome_do_arquivo.tar.gz>"
echo -e "${GREEN}Código fonte:${NC} ./scripts/restore.sh source <nome_do_arquivo.tar.gz>"

# Verificar argumentos
if [ $# -lt 2 ]; then
    echo -e "${YELLOW}Exemplo: ./scripts/restore.sh db legislative_db_20250729_143022.sql.gz${NC}"
    exit 0
fi

TYPE=$1
FILE=$2

case $TYPE in
    "db")
        echo -e "${YELLOW}Restaurando banco de dados de: $FILE${NC}"
        if [ ! -f "$DB_BACKUP_DIR/$FILE" ]; then
            echo -e "${RED}✗ Arquivo não encontrado: $DB_BACKUP_DIR/$FILE${NC}"
            exit 1
        fi
        
        echo -e "${RED}⚠ ATENÇÃO: Esta operação irá substituir TODOS os dados atuais!${NC}"
        read -p "Deseja continuar? (digite 'CONFIRMO' para prosseguir): " confirm
        if [ "$confirm" != "CONFIRMO" ]; then
            echo -e "${YELLOW}Operação cancelada.${NC}"
            exit 0
        fi
        
        # Descomprimir e restaurar
        gunzip -c "$DB_BACKUP_DIR/$FILE" | psql "$DATABASE_URL"
        echo -e "${GREEN}✓ Banco de dados restaurado com sucesso!${NC}"
        ;;
        
    "files")
        echo -e "${YELLOW}Restaurando arquivos de: $FILE${NC}"
        if [ ! -f "$FILES_BACKUP_DIR/$FILE" ]; then
            echo -e "${RED}✗ Arquivo não encontrado: $FILES_BACKUP_DIR/$FILE${NC}"
            exit 1
        fi
        
        echo -e "${RED}⚠ ATENÇÃO: Esta operação irá substituir todos os arquivos atuais!${NC}"
        read -p "Deseja continuar? (digite 'CONFIRMO' para prosseguir): " confirm
        if [ "$confirm" != "CONFIRMO" ]; then
            echo -e "${YELLOW}Operação cancelada.${NC}"
            exit 0
        fi
        
        # Fazer backup dos arquivos atuais antes de restaurar
        if [ -d "/home/runner/workspace/uploads" ]; then
            mv /home/runner/workspace/uploads /home/runner/workspace/uploads_backup_$(date +%s)
            echo -e "${YELLOW}Arquivos atuais salvos como backup${NC}"
        fi
        
        # Restaurar arquivos
        tar -xzf "$FILES_BACKUP_DIR/$FILE" -C /home/runner/workspace/
        echo -e "${GREEN}✓ Arquivos restaurados com sucesso!${NC}"
        ;;
        
    "config")
        echo -e "${YELLOW}Restaurando configuração de: $FILE${NC}"
        if [ ! -f "$FILES_BACKUP_DIR/$FILE" ]; then
            echo -e "${RED}✗ Arquivo não encontrado: $FILES_BACKUP_DIR/$FILE${NC}"
            exit 1
        fi
        
        tar -xzf "$FILES_BACKUP_DIR/$FILE" -C /home/runner/workspace/
        echo -e "${GREEN}✓ Configuração restaurada com sucesso!${NC}"
        ;;
        
    "source")
        echo -e "${YELLOW}Restaurando código fonte de: $FILE${NC}"
        if [ ! -f "$FILES_BACKUP_DIR/$FILE" ]; then
            echo -e "${RED}✗ Arquivo não encontrado: $FILES_BACKUP_DIR/$FILE${NC}"
            exit 1
        fi
        
        echo -e "${RED}⚠ ATENÇÃO: Esta operação irá substituir o código fonte atual!${NC}"
        read -p "Deseja continuar? (digite 'CONFIRMO' para prosseguir): " confirm
        if [ "$confirm" != "CONFIRMO" ]; then
            echo -e "${YELLOW}Operação cancelada.${NC}"
            exit 0
        fi
        
        tar -xzf "$FILES_BACKUP_DIR/$FILE" -C /home/runner/workspace/
        echo -e "${GREEN}✓ Código fonte restaurado com sucesso!${NC}"
        echo -e "${YELLOW}Lembre-se de executar 'npm install' se necessário${NC}"
        ;;
        
    *)
        echo -e "${RED}✗ Tipo inválido: $TYPE${NC}"
        echo -e "${YELLOW}Tipos válidos: db, files, config, source${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}=== Restauração concluída! ===${NC}"