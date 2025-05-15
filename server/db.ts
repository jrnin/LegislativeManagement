import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração do WebSocket do Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Adicionar opções para melhorar estabilidade da conexão
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,  // Limitar número máximo de conexões
  idleTimeoutMillis: 30000,  // 30 segundos em vez do padrão 10s
  maxUses: 100  // Reconectar após 100 usos
});

export const db = drizzle({ client: pool, schema });
