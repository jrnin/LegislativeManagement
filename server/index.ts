import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir arquivos estáticos dos diretórios de uploads
app.use('/uploads', express.static('uploads'));

/**
 * Configura um usuário root para administração do sistema
 */
async function setupRootUser() {
  try {
    // Credenciais do usuário root (fixas para este usuário especial)
    const rootEmail = "root@sistema-legislativo.com";
    const rootPassword = "admin@123"; // Senha padrão inicial que pode ser alterada depois
    
    // Verificar se o usuário root já existe
    const existingUser = await storage.getUserByEmail(rootEmail);
    
    if (existingUser) {
      log("Usuário root já existe no sistema");
      return;
    }
    
    // Criar usuário root
    log("Criando usuário root administrativo...");
    
    // Gerar ID e hash da senha
    const userId = "root";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rootPassword, salt);
    
    // Criar usuário com atributos específicos
    await storage.createUser({
      id: userId,
      name: "Administrador do Sistema",
      email: rootEmail,
      password: hashedPassword,
      role: "admin", // Nível máximo de acesso
      emailVerified: true // Já verificado
    });
    
    log("Usuário root criado com sucesso");
    log("Email: root@sistema-legislativo.com");
    log("Senha: admin@123");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    log(`Erro ao criar usuário root: ${errorMessage}`);
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Configurar usuário root na inicialização
  await setupRootUser();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
