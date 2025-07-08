import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { requireAuth, requireAdmin, handleFileUpload, handleAvatarUpload } from "./middlewares";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendAccountCreatedEmail, sendActivityApprovalRequest, sendEventNotificationEmail } from "./sendgrid";
import { z } from "zod";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { format } from "date-fns";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  committees,
  committeeMembers, 
  documents as documentsTable,
  legislativeActivities,
  legislativeActivitiesAuthors
} from "@shared/schema";
import { eq, and, inArray } from 'drizzle-orm';

// Declarar a função sendNotification que será inicializada no escopo global
let sendNotification: (target: 'all' | string | string[], notification: any) => void;

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar sessões do Express
  app.use(session({
    secret: process.env.SESSION_SECRET || 'legislative-system-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 semana
    }
  }));
  
  // Set up authentication
  await setupAuth(app);
  
  // Initialize upload directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // AUTH ROUTES
  
  // Get current authenticated user
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let user = null;
      
      // Check if authenticated via Replit first
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        console.log("User authenticated via Replit:", req.user);
        
        // For Replit auth, try to find user in database by email or create if needed
        if (req.user.email) {
          user = await storage.getUserByEmail(req.user.email);
          
          // If user doesn't exist in database but is authenticated via Replit, create them
          if (!user && req.user.name && req.user.email) {
            console.log("Creating new user from Replit auth:", req.user.email);
            try {
              user = await storage.createUser({
                name: req.user.name,
                email: req.user.email,
                role: 'user',
                emailVerified: true, // Replit users are already verified
                password: null // No password for Replit auth users
              });
            } catch (error) {
              console.error("Error creating user from Replit auth:", error);
            }
          }
        }
        
        // If still no user found, use Replit user data directly
        if (!user) {
          user = {
            id: req.user.id || req.user.sub,
            name: req.user.name,
            email: req.user.email,
            role: 'user',
            emailVerified: true
          };
        }
      } 
      // Check if authenticated via session (email/password login)
      else {
        const userId = (req.session as any).userId;
        
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        console.log("User authenticated via session, userId:", userId);
        user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Remove sensitive information
      const { password, verificationToken, ...userData } = user;
      console.log("Returning user data:", userData.email, userData.role);
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Falha ao buscar usuário" });
    }
  });
  
  // Register new user
  app.post('/api/register', async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      });
      
      const validated = schema.parse(req.body);
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(validated.email);
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "Este email já está em uso" 
        });
      }
      
      // Generate a random ID
      const userId = crypto.randomUUID();
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validated.password, salt);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Create user
      const user = await storage.createUser({
        id: userId,
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        verificationToken,
        emailVerified: false,
        emailVerificationSentAt: new Date(),
        role: "councilor", // Default role
      });
      
      // Send verification email
      const host = req.headers.host || "";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const baseUrl = `${protocol}://${host}`;
      
      console.log(`Enviando email de verificação para ${user.email}`);
      const emailSent = await sendVerificationEmail(user, verificationToken, baseUrl);
      
      if (!emailSent) {
        console.warn(`Failed to send verification email to ${user.email}`);
      } else {
        console.log(`Email de verificação enviado com sucesso para ${user.email}`);
      }
      
      // Para ambiente de desenvolvimento, mostrar o token e url para verificação manual
      if (process.env.NODE_ENV === 'development') {
        console.log('==== INFORMAÇÕES PARA TESTE ====');
        console.log('Token de verificação:', verificationToken);
        console.log(`URL de verificação: ${baseUrl}/api/verify-email?token=${verificationToken}`);
        console.log('===============================');
        
        // Incluir o token na resposta apenas em ambiente de desenvolvimento
        return res.status(201).json({ 
          success: true,
          message: "Cadastro realizado com sucesso. Em ambiente de produção você receberia um email para ativar sua conta.",
          // Estas informações só devem ser enviadas em ambiente de desenvolvimento
          debug: {
            verificationToken,
            verificationUrl: `${baseUrl}/api/verify-email?token=${verificationToken}`
          }
        });
      }
      
      // Resposta padrão para produção
      res.status(201).json({ 
        success: true,
        message: "Cadastro realizado com sucesso. Verifique seu email para ativar sua conta." 
      });
    } catch (error) {
      console.error("Error creating user:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: error.errors[0].message 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Erro ao processar cadastro" 
      });
    }
  });
  
  // Login with email
  app.post('/api/login/email', async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      });
      
      const validated = schema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validated.email);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Credenciais inválidas" 
        });
      }
      
      // TEMPORÁRIO: Permitindo login sem verificação de email
      // Foi solicitado para habilitar login sem verificação de email temporariamente
      console.log("Login sem verificação de email HABILITADO temporariamente!");
      
      /* Código original comentado temporariamente:
      if (!user.emailVerified) {
        return res.status(403).json({ 
          success: false,
          message: "Email não verificado. Verifique sua caixa de entrada para ativar sua conta." 
        });
      }
      */
      
      // Verify password using bcrypt
      const isPasswordValid = user.password && await bcrypt.compare(validated.password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: "Credenciais inválidas" 
        });
      }
      
      // Create session
      (req.session as any).userId = user.id;
      
      // Return user data (excluding sensitive information)
      const { password, verificationToken, ...userData } = user;
      
      res.json({ 
        success: true,
        message: "Login realizado com sucesso",
        user: userData
      });
    } catch (error) {
      console.error("Error during login:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: error.errors[0].message 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Erro ao processar login" 
      });
    }
  });
  
  // Logout route
  app.get('/api/logout', (req, res) => {
    try {
      // Clear the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Erro ao fazer logout:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro ao encerrar a sessão'
          });
        }
        
        // Redirect to login page
        res.json({
          success: true,
          message: 'Logout realizado com sucesso'
        });
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar logout'
      });
    }
  });
  
  // Verify email
  app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;
    
    console.log("Recebida solicitação de verificação de email com token:", token);
    
    if (!token || typeof token !== 'string') {
      console.log("Token inválido ou não fornecido");
      return res.redirect('/verify-email?verified=false&message=Token+inválido+ou+não+fornecido');
    }
    
    try {
      // Get user by token
      console.log("Buscando usuário pelo token");
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        console.log("Usuário não encontrado para o token fornecido");
        return res.redirect('/verify-email?verified=false&message=Token+inválido+ou+expirado');
      }
      
      console.log("Usuário encontrado:", user.id, user.email);
      
      // Verify the email
      console.log("Verificando email");
      const verified = await storage.verifyEmail(token);
      
      if (verified) {
        console.log("Email verificado com sucesso");
        
        // Send welcome email
        const host = req.headers.host || "";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const baseUrl = `${protocol}://${host}`;
        
        console.log("Enviando email de boas-vindas");
        const emailSent = await sendWelcomeEmail(user, baseUrl);
        console.log("Email de boas-vindas enviado:", emailSent);
        
        // Mostrar URL de verificação para teste em modo de desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('DEPURAÇÃO - Token de verificação:', token);
          console.log(`DEPURAÇÃO - URL de verificação: ${baseUrl}/api/verify-email?token=${token}`);
          console.log(`DEPURAÇÃO - URL após redirecionamento: ${baseUrl}/verify-email?verified=true`);
        }
        
        return res.redirect('/verify-email?verified=true');
      } else {
        console.log("Falha ao verificar email");
        return res.redirect('/verify-email?verified=false&message=Token+inválido+ou+expirado');
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.redirect('/verify-email?verified=false&message=Erro+ao+verificar+email');
    }
  });
  
  // USER ROUTES
  
  // Get all users
  app.get('/api/users', requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
  
  // Get single user
  app.get('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remover senha e outros campos sensíveis antes de retornar
      const { password, verificationToken, resetToken, resetTokenExpiry, ...userWithoutSensitiveInfo } = user;
      
      res.json(userWithoutSensitiveInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });
  
  // Create user (admin only)
  app.post('/api/users', requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        email: z.string().email("Email inválido"),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        zipCode: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        number: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        role: z.enum(["admin", "councilor"]),
        legislatureId: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? Number(val) : val).optional(),
        maritalStatus: z.string().optional(),
        occupation: z.string().optional(),
        education: z.string().optional(),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      });
      
      const validated = schema.parse(req.body);
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(validated.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Já existe um usuário com este email" });
      }
      
      // Se o CPF foi fornecido, verifica se já existe um usuário com este CPF
      if (validated.cpf) {
        const usersWithCpf = await storage.getAllUsers();
        const existingUserWithCpf = usersWithCpf.find(user => user.cpf === validated.cpf);
        
        if (existingUserWithCpf) {
          return res.status(400).json({ message: "Já existe um usuário com este CPF" });
        }
      }
      
      // Generate a random ID if not provided by auth
      const userId = crypto.randomUUID();
      
      // Create user
      const user = await storage.createUser({
        id: userId,
        ...validated,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : undefined,
        emailVerified: false,
      });
      
      // Send verification email
      const host = req.headers.host || "";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const baseUrl = `${protocol}://${host}`;
      
      await sendAccountCreatedEmail(user, baseUrl, validated.password);
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });
  
  // Upload avatar for user
  app.post('/api/users/:id/avatar', requireAuth, handleAvatarUpload('avatar'), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.userId;
      const currentUser = await storage.getUser(currentUserId);
      const currentUserIsAdmin = currentUser?.role === "admin";
      
      // Verificar permissões (apenas o próprio usuário ou administradores podem atualizar)
      if (currentUserId !== userId && !currentUserIsAdmin) {
        return res.status(403).json({ message: "Você não tem permissão para editar este usuário" });
      }
      
      // Verificar se o arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
      }
      
      // O middleware handleAvatarUpload já adicionou profileImageUrl ao req.body
      const avatarUrl = req.body.profileImageUrl;
      
      // Atualizar o usuário com a nova URL do avatar
      const updatedUser = await storage.updateUser(userId, { 
        profileImageUrl: avatarUrl,
        updatedAt: new Date()
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({
        message: "Avatar atualizado com sucesso",
        profileImageUrl: updatedUser.profileImageUrl,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Erro ao fazer upload do avatar" });
    }
  });
  
  app.put('/api/users/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.userId; // Pega o ID do usuário da sessão
      const currentUser = await storage.getUser(currentUserId);
      const currentUserIsAdmin = currentUser?.role === "admin";
      
      // Only allow admins to update other users
      if (userId !== currentUserId && !currentUserIsAdmin) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      const schema = z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
        email: z.string().email("Email inválido").optional(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        zipCode: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        number: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        role: z.enum(["admin", "councilor"]).optional(),
        legislatureId: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? Number(val) : val).optional(),
        maritalStatus: z.string().optional(),
        occupation: z.string().optional(),
        education: z.string().optional(),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
      });
      
      const validated = schema.parse(req.body);
      
      // If email is changing, make sure it's not already taken
      if (validated.email) {
        const existingUser = await storage.getUserByEmail(validated.email);
        
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Já existe um usuário com este email" });
        }
      }
      
      // Create update data
      const updateData = {
        ...validated,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : undefined,
      };
      
      // If password is being updated, hash it
      if (validated.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validated.password, salt);
        updateData.password = hashedPassword;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      // Verificar se é um erro do drizzle ou do PostgreSQL
      const err = error as any;
      if (err.code && (err.code.startsWith('22') || err.code.startsWith('23'))) {
        // Códigos 22xxx são erros de dados e 23xxx são violações de integridade
        return res.status(400).json({ 
          message: "Erro nos dados enviados. Verifique os campos e tente novamente.",
          detail: err.detail || err.message
        });
      }
      
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });
  
  // Delete user (admin only)
  app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Delete user
      await storage.deleteUser(userId);
      
      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });
  
  // LEGISLATURE ROUTES
  
  // Get all legislatures
  app.get('/api/legislatures', requireAuth, async (req, res) => {
    try {
      const legislatures = await storage.getAllLegislatures();
      res.json(legislatures);
    } catch (error) {
      console.error("Error fetching legislatures:", error);
      res.status(500).json({ message: "Erro ao buscar legislaturas" });
    }
  });
  
  // Get single legislature
  app.get('/api/legislatures/:id', requireAuth, async (req, res) => {
    try {
      const legislature = await storage.getLegislature(Number(req.params.id));
      
      if (!legislature) {
        return res.status(404).json({ message: "Legislatura não encontrada" });
      }
      
      res.json(legislature);
    } catch (error) {
      console.error("Error fetching legislature:", error);
      res.status(500).json({ message: "Erro ao buscar legislatura" });
    }
  });
  
  // Create legislature (admin only)
  app.post('/api/legislatures', requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        number: z.number().int().positive(),
        startDate: z.string().refine(val => !isNaN(Date.parse(val))),
        endDate: z.string().refine(val => !isNaN(Date.parse(val))),
      });
      
      const validated = schema.parse(req.body);
      
      // Create legislature
      const legislature = await storage.createLegislature({
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
      });
      
      res.status(201).json(legislature);
    } catch (error) {
      console.error("Error creating legislature:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao criar legislatura" });
    }
  });
  
  // Update legislature (admin only)
  app.put('/api/legislatures/:id', requireAdmin, async (req, res) => {
    try {
      const legislatureId = Number(req.params.id);
      
      const schema = z.object({
        number: z.number().int().positive().optional(),
        startDate: z.string().refine(val => !isNaN(Date.parse(val))).optional(),
        endDate: z.string().refine(val => !isNaN(Date.parse(val))).optional(),
      });
      
      const validated = schema.parse(req.body);
      
      // Update legislature
      const updatedLegislature = await storage.updateLegislature(legislatureId, {
        ...validated,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      });
      
      if (!updatedLegislature) {
        return res.status(404).json({ message: "Legislatura não encontrada" });
      }
      
      res.json(updatedLegislature);
    } catch (error) {
      console.error("Error updating legislature:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao atualizar legislatura" });
    }
  });
  
  // Delete legislature (admin only)
  app.delete('/api/legislatures/:id', requireAdmin, async (req, res) => {
    try {
      const legislatureId = Number(req.params.id);
      
      // Check if legislature exists
      const legislature = await storage.getLegislature(legislatureId);
      
      if (!legislature) {
        return res.status(404).json({ message: "Legislatura não encontrada" });
      }
      
      // Delete legislature
      await storage.deleteLegislature(legislatureId);
      
      res.json({ message: "Legislatura excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting legislature:", error);
      res.status(500).json({ message: "Erro ao excluir legislatura" });
    }
  });
  
  // EVENT ROUTES
  
  // Get all events
  app.get('/api/events', requireAuth, async (req, res) => {
    try {
      const { category } = req.query;
      const events = await storage.getAllEvents();
      
      // Filtrar por categoria se especificada
      let filteredEvents = events;
      if (category && typeof category === 'string') {
        filteredEvents = events.filter(event => event.category === category);
      }
      
      // Para eventos de reunião de comissão, incluir as comissões associadas
      if (category === "Reunião Comissão") {
        const eventsWithCommittees = await Promise.all(filteredEvents.map(async (event) => {
          let committees = [];
          try {
            committees = await storage.getEventCommittees(event.id);
          } catch (error) {
            console.error(`Erro ao buscar comissões para evento ${event.id}:`, error);
          }
          return { ...event, committees: committees || [] };
        }));
        res.json(eventsWithCommittees);
      } else {
        res.json(filteredEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });
  
  // Get upcoming events
  app.get('/api/events/upcoming', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 3;
      const events = await storage.getUpcomingEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Erro ao buscar próximos eventos" });
    }
  });
  
  // Get single event
  app.get('/api/events/:id', requireAuth, async (req, res) => {
    try {
      const event = await storage.getEvent(Number(req.params.id));
      
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Erro ao buscar evento" });
    }
  });
  
  // Get event with all details (activities, attendance, etc)
  app.get('/api/events/:id/details', requireAuth, async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      console.log(`API: Getting details for event ID: ${eventId}`);
      
      // Verificar se o ID do evento é válido
      if (isNaN(eventId) || eventId <= 0) {
        console.error(`Invalid event ID: ${req.params.id}`);
        return res.status(400).json({ message: "ID de evento inválido" });
      }
      
      // Buscar evento com detalhes
      const eventDetails = await storage.getEventWithDetails(eventId);
      
      // Verificar se o evento foi encontrado
      if (!eventDetails) {
        console.log(`Event not found for ID: ${eventId}`);
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      // Log de sucesso
      console.log(`Successfully fetched details for event ID: ${eventId}`);
      res.json(eventDetails);
    } catch (error) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ 
        message: "Erro ao buscar detalhes do evento",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create event (admin only)
  app.post('/api/events', requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        eventNumber: z.number().int().positive(),
        eventDate: z.string().refine(val => !isNaN(Date.parse(val))),
        eventTime: z.string(),
        location: z.string(),
        mapUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        category: z.string(),
        committeeIds: z.array(z.number()).optional(),
        legislatureId: z.number().int().positive(),
        description: z.string(),
        status: z.string(),
      });
      
      const validated = schema.parse(req.body);
      
      // Create event
      const event = await storage.createEvent({
        ...validated,
        eventDate: new Date(validated.eventDate),
      });
      
      // Handle committee associations for "Reunião Comissão" events
      if (validated.category === "Reunião Comissão" && validated.committeeIds && validated.committeeIds.length > 0) {
        await storage.addEventCommittees(event.id, validated.committeeIds);
      }
      
      // Send email notification to all councilors
      try {
        const councilors = await storage.getCouncilors();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        console.log(`Enviando notificação de novo evento para ${councilors.length} vereadores`);
        
        // Send emails to all councilors asynchronously
        const emailPromises = councilors.map(async (councilor) => {
          try {
            const success = await sendEventNotificationEmail(councilor, event, baseUrl);
            if (success) {
              console.log(`E-mail de notificação enviado com sucesso para: ${councilor.email}`);
            } else {
              console.error(`Falha ao enviar e-mail para: ${councilor.email}`);
            }
            return success;
          } catch (emailError) {
            console.error(`Erro ao enviar e-mail para ${councilor.email}:`, emailError);
            return false;
          }
        });
        
        const emailResults = await Promise.allSettled(emailPromises);
        const successCount = emailResults.filter(result => 
          result.status === 'fulfilled' && result.value === true
        ).length;
        
        console.log(`Notificações enviadas: ${successCount}/${councilors.length}`);
        
      } catch (emailError) {
        console.error("Erro ao enviar notificações por e-mail:", emailError);
        // Não falha a criação do evento se o e-mail falhar
      }
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao criar evento" });
    }
  });
  
  // Update event (admin only)
  app.put('/api/events/:id', requireAuth, async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      
      const schema = z.object({
        eventNumber: z.number().int().positive().optional(),
        eventDate: z.string().refine(val => !isNaN(Date.parse(val))).optional(),
        eventTime: z.string().optional(),
        location: z.string().optional(),
        mapUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        category: z.string().optional(),
        committeeIds: z.array(z.number()).optional(),
        legislatureId: z.number().int().positive().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
      });
      
      const validated = schema.parse(req.body);
      
      // Update event
      const updatedEvent = await storage.updateEvent(eventId, {
        ...validated,
        eventDate: validated.eventDate ? new Date(validated.eventDate) : undefined,
      });
      
      // Handle committee associations for "Reunião Comissão" events
      if (validated.category === "Reunião Comissão" && validated.committeeIds !== undefined) {
        // Remove existing committee associations
        await storage.removeEventCommittees(eventId);
        // Add new committee associations
        if (validated.committeeIds.length > 0) {
          await storage.addEventCommittees(eventId, validated.committeeIds);
        }
      } else if (validated.category && validated.category !== "Reunião Comissão") {
        // If changing from "Reunião Comissão" to another category, remove committee associations
        await storage.removeEventCommittees(eventId);
      }
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao atualizar evento" });
    }
  });
  
  // Delete event
  app.delete('/api/events/:id', requireAuth, async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      
      // Check if event exists
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      // Delete event
      await storage.deleteEvent(eventId);
      
      res.json({ message: "Evento excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Erro ao excluir evento" });
    }
  });
  
  // LEGISLATIVE ACTIVITY ROUTES
  
  // Get all legislative activities
  app.get('/api/activities', requireAuth, async (req, res) => {
    try {
      const activities = await storage.getAllLegislativeActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Erro ao buscar atividades" });
    }
  });
  
  // Get recent legislative activities
  app.get('/api/activities/recent', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 3;
      const activities = await storage.getRecentLegislativeActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Erro ao buscar atividades recentes" });
    }
  });
  
  // Get single legislative activity
  app.get('/api/activities/:id', requireAuth, async (req, res) => {
    try {
      const activity = await storage.getLegislativeActivity(Number(req.params.id));
      
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Erro ao buscar atividade" });
    }
  });
  
  // Create legislative activity
  app.post('/api/activities', requireAuth, handleFileUpload('file'), async (req: any, res) => {
    try {
      const schema = z.object({
        activityNumber: z.number().int().positive(),
        activityDate: z.string().refine(val => !isNaN(Date.parse(val))),
        description: z.string(),
        eventId: z.number().int().positive(),
        activityType: z.string(),
        situacao: z.string(),
        approvalType: z.enum(["none", "councilors", "committees"]).optional(),
        authorIds: z.array(z.string()).min(1, "Pelo menos um autor deve ser selecionado"),
      });
      
      // Parse form data
      const data = {
        ...req.body,
        activityNumber: Number(req.body.activityNumber),
        eventId: Number(req.body.eventId),
        approvalType: req.body.approvalType || "none",
        authorIds: Array.isArray(req.body.authorIds) ? req.body.authorIds : [req.body.authorIds],
      };
      
      const validated = schema.parse(data);
      
      // Handle file upload if present
      let fileInfo = {};
      
      if (req.file) {
        fileInfo = {
          filePath: req.file.path,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
        };
      }
      
      // Create activity
      const activity = await storage.createLegislativeActivity(
        {
          ...validated,
          activityDate: new Date(validated.activityDate),
          ...fileInfo,
        },
        validated.authorIds
      );
      
      // If activity needs approval, send emails to authorized persons
      if (validated.approvalType && validated.approvalType !== "none") {
        // Get users to notify based on approval type
        const host = req.headers.host || "";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const baseUrl = `${protocol}://${host}`;
        
        if (validated.approvalType === "councilors") {
          // Notify all councilors
          const allUsers = await storage.getAllUsers();
          const councilors = allUsers.filter(user => user.role === "councilor");
          
          for (const councilor of councilors) {
            await sendActivityApprovalRequest(councilor, activity, baseUrl);
          }
        } else if (validated.approvalType === "committees") {
          // Notify admins for committee approval management
          const allUsers = await storage.getAllUsers();
          const adminUsers = allUsers.filter(user => user.role === "admin");
          
          for (const admin of adminUsers) {
            await sendActivityApprovalRequest(admin, activity, baseUrl);
          }
        }
      }
      
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao criar atividade" });
    }
  });
  
  // Update legislative activity
  app.put('/api/activities/:id', requireAuth, handleFileUpload('file'), async (req: any, res) => {
    try {
      const activityId = Number(req.params.id);
      
      // Get current activity to check permissions
      const currentActivity = await storage.getLegislativeActivity(activityId);
      
      if (!currentActivity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Check if user is authorized (either admin or one of the authors)
      const currentUser = await storage.getUser(req.user.claims.sub);
      const isAdmin = currentUser?.role === "admin";
      const isAuthor = currentActivity.authors?.some(author => author.id === currentUser?.id);
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      const schema = z.object({
        activityNumber: z.number().int().positive().optional(),
        activityDate: z.string().refine(val => !isNaN(Date.parse(val))).optional(),
        description: z.string().optional(),
        eventId: z.number().int().positive().optional(),
        activityType: z.string().optional(),
        situacao: z.string().optional(),
        needsApproval: z.boolean().optional(),
        approved: z.boolean().optional(),
        authorIds: z.array(z.string()).min(1, "Pelo menos um autor deve ser selecionado").optional(),
      });
      
      // Parse form data
      const data = {
        ...req.body,
        activityNumber: req.body.activityNumber ? Number(req.body.activityNumber) : undefined,
        eventId: req.body.eventId ? Number(req.body.eventId) : undefined,
        needsApproval: req.body.needsApproval !== undefined ? req.body.needsApproval === 'true' : undefined,
        approved: req.body.approved !== undefined ? req.body.approved === 'true' : undefined,
        authorIds: req.body.authorIds ? 
          (Array.isArray(req.body.authorIds) ? req.body.authorIds : [req.body.authorIds]) : 
          undefined,
      };
      
      const validated = schema.parse(data);
      
      // Handle file upload if present
      let fileInfo = {};
      
      if (req.file) {
        fileInfo = {
          filePath: req.file.path,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
        };
        
        // If there was a previous file, delete it
        if (currentActivity.filePath && fs.existsSync(currentActivity.filePath)) {
          fs.unlinkSync(currentActivity.filePath);
        }
      }
      
      // Update activity
      const updatedActivity = await storage.updateLegislativeActivity(
        activityId,
        {
          ...validated,
          activityDate: validated.activityDate ? new Date(validated.activityDate) : undefined,
          ...fileInfo,
        },
        validated.authorIds
      );
      
      if (!updatedActivity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      res.json(updatedActivity);
    } catch (error) {
      console.error("Error updating activity:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao atualizar atividade" });
    }
  });
  
  // Delete legislative activity
  app.delete('/api/activities/:id', requireAuth, async (req: any, res) => {
    try {
      const activityId = Number(req.params.id);
      
      // Get current activity to check permissions
      const activity = await storage.getLegislativeActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Check if user is authorized (either admin or one of the authors)
      const currentUser = await storage.getUser(req.user.id);
      const isAdmin = currentUser?.role === "admin";
      const isAuthor = activity.authors?.some(author => author.id === currentUser?.id);
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      // Delete associated file if it exists
      if (activity.filePath && fs.existsSync(activity.filePath)) {
        fs.unlinkSync(activity.filePath);
      }
      
      // Delete activity
      await storage.deleteLegislativeActivity(activityId);
      
      res.json({ message: "Atividade excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Erro ao excluir atividade" });
    }
  });
  
  // DOCUMENT ROUTES
  
  // Get all documents
  app.get('/api/documents', requireAuth, async (req, res) => {
    try {
      const { 
        type, 
        status, 
        startDate, 
        endDate, 
        search, 
        page = '1', 
        limit = '10'
      } = req.query;

      // Converter para números
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 10;
      
      // Construir objeto de filtro
      const filters: any = {};
      
      if (type) filters.documentType = type;
      if (status) filters.status = status;
      
      // Filtro de data
      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) filters.dateRange.start = new Date(startDate as string);
        if (endDate) filters.dateRange.end = new Date(endDate as string);
      }
      
      // Filtro de busca por texto
      if (search) filters.search = search as string;
      
      // Obter documentos do banco de dados
      const documents = await storage.getAllDocuments(filters, pageNum, limitNum);
      
      // Obter total de documentos para paginação
      const total = await storage.getDocumentsCount(filters);
      
      res.json({
        documents,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos" });
    }
  });
  
  // Get single document
  app.get('/api/documents/:id', requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(Number(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Erro ao buscar documento" });
    }
  });
  
  // Get document history
  app.get('/api/documents/:id/history', requireAuth, async (req, res) => {
    try {
      const documents = await storage.getDocumentHistory(Number(req.params.id));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching document history:", error);
      res.status(500).json({ message: "Erro ao buscar histórico do documento" });
    }
  });
  
  // Create document
  app.post('/api/documents', requireAuth, handleFileUpload('file'), async (req: any, res) => {
    try {
      const schema = z.object({
        documentNumber: z.number().int().positive(),
        documentType: z.string(),
        documentDate: z.string().refine(val => !isNaN(Date.parse(val))),
        authorType: z.string(),
        description: z.string(),
        status: z.string(),
        activityId: z.number().int().positive().optional(),
        eventId: z.number().int().positive().optional(),
        parentDocumentId: z.number().int().positive().optional(),
      });
      
      // Parse form data
      const data = {
        ...req.body,
        documentNumber: Number(req.body.documentNumber),
        activityId: req.body.activityId ? Number(req.body.activityId) : undefined,
        eventId: req.body.eventId ? Number(req.body.eventId) : undefined,
        parentDocumentId: req.body.parentDocumentId ? Number(req.body.parentDocumentId) : undefined,
      };
      
      const validated = schema.parse(data);
      
      // Handle file upload if present
      let fileInfo = {};
      
      if (req.file) {
        fileInfo = {
          filePath: req.file.path,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
        };
      }
      
      // Create document
      const document = await storage.createDocument({
        ...validated,
        documentDate: new Date(validated.documentDate),
        ...fileInfo,
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao criar documento" });
    }
  });
  
  // Update document
  app.put('/api/documents/:id', requireAuth, handleFileUpload('file'), async (req: any, res) => {
    try {
      const documentId = Number(req.params.id);
      
      // Only admins can update documents directly
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Permissão negada" });
      }
      
      // Get current document
      const currentDocument = await storage.getDocument(documentId);
      
      if (!currentDocument) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      const schema = z.object({
        documentNumber: z.number().int().positive().optional(),
        documentType: z.string().optional(),
        documentDate: z.string().refine(val => !isNaN(Date.parse(val))).optional(),
        authorType: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        activityId: z.number().int().positive().optional(),
        eventId: z.number().int().positive().optional(),
        parentDocumentId: z.number().int().positive().optional(),
      });
      
      // Parse form data
      const data = {
        ...req.body,
        documentNumber: req.body.documentNumber ? Number(req.body.documentNumber) : undefined,
        activityId: req.body.activityId ? Number(req.body.activityId) : undefined,
        eventId: req.body.eventId ? Number(req.body.eventId) : undefined,
        parentDocumentId: req.body.parentDocumentId ? Number(req.body.parentDocumentId) : undefined,
      };
      
      const validated = schema.parse(data);
      
      // Handle file upload if present
      let fileInfo = {};
      
      if (req.file) {
        fileInfo = {
          filePath: req.file.path,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
        };
        
        // If there was a previous file, delete it
        if (currentDocument.filePath && fs.existsSync(currentDocument.filePath)) {
          fs.unlinkSync(currentDocument.filePath);
        }
      }
      
      // Update document
      const updatedDocument = await storage.updateDocument(
        documentId,
        {
          ...validated,
          documentDate: validated.documentDate ? new Date(validated.documentDate) : undefined,
          ...fileInfo,
        }
      );
      
      if (!updatedDocument) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao atualizar documento" });
    }
  });
  
  // Delete document
  app.delete('/api/documents/:id', requireAdmin, async (req, res) => {
    try {
      const documentId = Number(req.params.id);
      
      // Get document to delete associated file
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      
      // Delete associated file if it exists
      if (document.filePath && fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
      
      // Delete document
      await storage.deleteDocument(documentId);
      
      res.json({ message: "Documento excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Erro ao excluir documento" });
    }
  });
  
  // Download file
  app.get('/api/files/:type/:id', requireAuth, async (req, res) => {
    try {
      const type = req.params.type;
      const id = Number(req.params.id);
      
      let filePath, fileName, fileType;
      
      if (type === 'activities') {
        const activity = await storage.getLegislativeActivity(id);
        
        if (!activity || !activity.filePath) {
          return res.status(404).json({ message: "Arquivo não encontrado" });
        }
        
        filePath = activity.filePath;
        fileName = activity.fileName;
        fileType = activity.fileType;
      } else if (type === 'documents') {
        const document = await storage.getDocument(id);
        
        if (!document || !document.filePath) {
          return res.status(404).json({ message: "Arquivo não encontrado" });
        }
        
        filePath = document.filePath;
        fileName = document.fileName;
        fileType = document.fileType;
      } else {
        return res.status(400).json({ message: "Tipo inválido" });
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Check if download is requested
      const isDownload = req.query.download === 'true';
      
      // Set appropriate headers
      res.setHeader('Content-Type', fileType ? fileType : 'application/octet-stream');
      
      if (isDownload) {
        // Force download with attachment disposition
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName || 'download')}"`);
      } else {
        // Allow browser to display the file if possible (PDF, images, etc)
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName || 'view')}"`);
      }
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Erro ao baixar arquivo" });
    }
  });
  
  // DASHBOARD ROUTES
  
  // Get dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas do dashboard" });
    }
  });
  
  // COMMITTEE ROUTES
  
  // Get all committees
  app.get('/api/committees', requireAuth, async (req, res) => {
    try {
      const committees = await storage.getAllCommittees();
      res.json(committees);
    } catch (error) {
      console.error("Error fetching committees:", error);
      res.status(500).json({ message: "Erro ao buscar comissões" });
    }
  });
  
  // Get single committee with members
  app.get('/api/committees/:id', requireAuth, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }
      
      const committee = await storage.getCommitteeWithMembers(committeeId);
      
      if (!committee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }
      
      res.json(committee);
    } catch (error) {
      console.error("Error fetching committee:", error);
      res.status(500).json({ message: "Erro ao buscar comissão" });
    }
  });
  
  // Create new committee (admin only)
  app.post('/api/committees', requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Data de início inválida"
        }),
        endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Data de término inválida"
        }),
        description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
        type: z.string().min(3, "Tipo deve ter pelo menos 3 caracteres"),
        members: z.array(z.object({
          userId: z.string(),
          role: z.string(),
        })).optional(),
      });
      
      const validated = schema.parse(req.body);
      
      const committeeData = {
        name: validated.name,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        description: validated.description,
        type: validated.type,
      };
      
      const members = validated.members || [];
      
      // Validar funções dos membros
      const validRoles = ["Presidente", "Vice-Presidente", "Relator", "1º Suplente", "2º Suplente", "3º Suplente", "Membro"];
      for (const member of members) {
        if (!validRoles.includes(member.role)) {
          return res.status(400).json({ 
            message: `Função inválida: ${member.role}. Funções válidas: ${validRoles.join(", ")}` 
          });
        }
      }
      
      const committee = await storage.createCommittee(committeeData, members);
      
      // Notificar membros sobre sua inclusão na comissão
      for (const member of members) {
        try {
          sendNotification(member.userId, {
            type: "committee_member_added",
            title: "Adicionado à Comissão",
            message: `Você foi adicionado à comissão "${committee.name}" como ${member.role}.`,
            data: {
              committeeId: committee.id,
              committeeName: committee.name,
              role: member.role,
            },
            createdAt: new Date(),
          });
        } catch (notificationError) {
          console.error("Erro ao enviar notificação para membro:", notificationError);
        }
      }
      
      // Notificar usuários sobre a criação da nova comissão
      try {
        sendNotification("all", {
          type: "committee_created",
          title: "Nova Comissão Criada",
          message: `A comissão "${committee.name}" foi criada.`,
          data: {
            committeeId: committee.id,
            committeeName: committee.name,
          },
          createdAt: new Date(),
        });
      } catch (notificationError) {
        console.error("Erro ao enviar notificação geral:", notificationError);
      }
      
      res.status(201).json(committee);
    } catch (error) {
      console.error("Error creating committee:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao criar comissão" });
    }
  });
  
  // Update committee (admin only)
  app.put('/api/committees/:id', requireAdmin, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      
      console.log(`[COMMITTEE UPDATE] ID: ${committeeId}, Body:`, JSON.stringify(req.body, null, 2));
      
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }
      
      const schema = z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
        startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Data de início inválida"
        }).optional(),
        endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Data de término inválida"
        }).optional(),
        description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres").optional(),
        type: z.string().min(3, "Tipo deve ter pelo menos 3 caracteres").optional(),
        members: z.array(z.object({
          userId: z.string(),
          role: z.string(),
        })).optional(),
      });
      
      const validated = schema.parse(req.body);
      console.log(`[COMMITTEE UPDATE] Validated data:`, JSON.stringify(validated, null, 2));
      
      const committeeData: any = {};
      
      if (validated.name) committeeData.name = validated.name;
      if (validated.startDate) committeeData.startDate = new Date(validated.startDate);
      if (validated.endDate) committeeData.endDate = new Date(validated.endDate);
      if (validated.description) committeeData.description = validated.description;
      if (validated.type) committeeData.type = validated.type;
      
      console.log(`[COMMITTEE UPDATE] Committee data:`, JSON.stringify(committeeData, null, 2));
      
      const members = validated.members || [];
      console.log(`[COMMITTEE UPDATE] Members:`, JSON.stringify(members, null, 2));
      
      // Validar funções dos membros
      const validRoles = ["Presidente", "Vice-Presidente", "Relator", "1º Suplente", "2º Suplente", "3º Suplente", "Membro"];
      for (const member of members) {
        if (!validRoles.includes(member.role)) {
          return res.status(400).json({ 
            message: `Função inválida: ${member.role}. Funções válidas: ${validRoles.join(", ")}` 
          });
        }
      }
      
      const updatedCommittee = await storage.updateCommittee(
        committeeId, 
        committeeData, 
        members
      );
      
      console.log(`[COMMITTEE UPDATE] Updated committee:`, JSON.stringify(updatedCommittee, null, 2));
      
      if (!updatedCommittee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }
      
      // Notificar membros sobre a atualização da comissão
      for (const member of members) {
        try {
          sendNotification(member.userId, {
            type: "committee_updated",
            title: "Comissão Atualizada",
            message: `A comissão "${updatedCommittee.name}" foi atualizada. Sua função: ${member.role}.`,
            data: {
              committeeId: updatedCommittee.id,
              committeeName: updatedCommittee.name,
              role: member.role,
            },
            createdAt: new Date(),
          });
        } catch (notificationError) {
          console.error("Erro ao enviar notificação para membro:", notificationError);
        }
      }
      
      // Notificar usuários sobre a atualização da comissão
      try {
        sendNotification("all", {
          type: "committee_updated",
          title: "Comissão Atualizada",
          message: `A comissão "${updatedCommittee.name}" foi atualizada.`,
          data: {
            committeeId: updatedCommittee.id,
            committeeName: updatedCommittee.name,
          },
          createdAt: new Date(),
        });
      } catch (notificationError) {
        console.error("Erro ao enviar notificação geral:", notificationError);
      }
      
      res.json(updatedCommittee);
    } catch (error) {
      console.error("Error updating committee:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao atualizar comissão" });
    }
  });
  
  // Delete committee (admin only)
  app.delete('/api/committees/:id', requireAdmin, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }
      
      // Get committee details before deletion for notification
      const committee = await storage.getCommittee(committeeId);
      
      if (!committee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }
      
      const deleted = await storage.deleteCommittee(committeeId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }
      
      // Notificar usuários sobre a remoção da comissão
      sendNotification("all", {
        type: "committee_deleted",
        title: "Comissão Removida",
        message: `A comissão "${committee.name}" foi removida.`,
        data: {
          committeeId: committee.id,
          committeeName: committee.name,
        },
        createdAt: new Date(),
      });
      
      res.json({ success: true, message: "Comissão removida com sucesso" });
    } catch (error) {
      console.error("Error deleting committee:", error);
      res.status(500).json({ message: "Erro ao remover comissão" });
    }
  });
  
  // Get committee members
  app.get('/api/committees/:id/members', requireAuth, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }
      
      const members = await storage.getCommitteeMembersByCommitteeId(committeeId);
      
      res.json(members);
    } catch (error) {
      console.error("Error fetching committee members:", error);
      res.status(500).json({ message: "Erro ao buscar membros da comissão" });
    }
  });
  
  // Add member to committee (admin only)
  app.post('/api/committees/:id/members', requireAdmin, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }
      
      const schema = z.object({
        userId: z.string(),
        role: z.string().optional(),
      });
      
      const validated = schema.parse(req.body);
      
      // Verificar se o comitê existe
      const committee = await storage.getCommittee(committeeId);
      
      if (!committee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUser(validated.userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const member = await storage.addCommitteeMember(
        committeeId,
        validated.userId,
        validated.role
      );
      
      // Notificar o usuário adicionado à comissão
      sendNotification(validated.userId, {
        type: "committee_member_added",
        title: "Adicionado à Comissão",
        message: `Você foi adicionado à comissão "${committee.name}" como ${validated.role || 'membro'}.`,
        data: {
          committeeId: committee.id,
          committeeName: committee.name,
          role: validated.role || 'membro',
        },
        createdAt: new Date(),
      });
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding committee member:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao adicionar membro à comissão" });
    }
  });
  
  // Update committee member role (admin only)
  app.put('/api/committees/:committeeId/members/:userId', requireAdmin, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.committeeId);
      const userId = req.params.userId;
      
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }
      
      const schema = z.object({
        role: z.string().min(1, "Papel/função é obrigatório"),
      });
      
      const validated = schema.parse(req.body);
      
      // Verificar se o comitê existe
      const committee = await storage.getCommittee(committeeId);
      
      if (!committee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const updatedMember = await storage.updateCommitteeMemberRole(
        committeeId,
        userId,
        validated.role
      );
      
      if (!updatedMember) {
        return res.status(404).json({ message: "Membro não encontrado nesta comissão" });
      }
      
      // Notificar o usuário sobre a alteração de papel na comissão
      sendNotification(userId, {
        type: "committee_role_updated",
        title: "Função Atualizada em Comissão",
        message: `Sua função na comissão "${committee.name}" foi atualizada para ${validated.role}.`,
        data: {
          committeeId: committee.id,
          committeeName: committee.name,
          role: validated.role,
        },
        createdAt: new Date(),
      });
      
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating committee member role:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      res.status(500).json({ message: "Erro ao atualizar papel do membro na comissão" });
    }
  });
  
  // Remove member from committee (admin only)
  app.delete('/api/committees/:committeeId/members/:userId', requireAdmin, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.committeeId);
      const userId = req.params.userId;
      
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }
      
      // Verificar se o comitê existe
      const committee = await storage.getCommittee(committeeId);
      
      if (!committee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const removed = await storage.removeCommitteeMember(committeeId, userId);
      
      if (!removed) {
        return res.status(404).json({ message: "Membro não encontrado nesta comissão" });
      }
      
      // Notificar o usuário sobre a remoção da comissão
      sendNotification(userId, {
        type: "committee_member_removed",
        title: "Removido da Comissão",
        message: `Você foi removido da comissão "${committee.name}".`,
        data: {
          committeeId: committee.id,
          committeeName: committee.name,
        },
        createdAt: new Date(),
      });
      
      res.json({ success: true, message: "Membro removido da comissão com sucesso" });
    } catch (error) {
      console.error("Error removing committee member:", error);
      res.status(500).json({ message: "Erro ao remover membro da comissão" });
    }
  });
  
  // Get all councilors for committee selection
  app.get('/api/councilors', requireAuth, async (req, res) => {
    try {
      const councilors = await storage.getCouncilors();
      res.json(councilors);
    } catch (error) {
      console.error("Error fetching councilors:", error);
      res.status(500).json({ message: "Erro ao buscar vereadores" });
    }
  });
  
  // SEARCH ROUTES
  
  // Global search across all entities
  app.get('/api/search', requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      const type = req.query.type as string | undefined;
      
      if (!query || query.length < 3) {
        return res.json([]);
      }
      
      const results = await storage.searchGlobal(query, type);
      res.json(results);
    } catch (error) {
      console.error('Error performing search:', error);
      res.status(500).json({ message: 'Erro ao realizar busca' });
    }
  });

  // NEWS API ENDPOINTS
  
  // Get all news articles (public)
  app.get('/api/public/news', async (req, res) => {
    try {
      const { 
        category, 
        featured, 
        search, 
        page = '1', 
        limit = '12' 
      } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 12;
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        category: category as string,
        featured: featured === 'true' ? true : undefined,
        search: search as string,
        limit: limitNum,
        offset: offset
      };

      const articles = await storage.getPublishedNewsArticles(filters);
      
      res.json({
        articles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          hasMore: articles.length === limitNum
        }
      });
    } catch (error) {
      console.error("Error fetching news articles:", error);
      res.status(500).json({ message: "Erro ao buscar notícias" });
    }
  });

  // Get news categories (public) - must come before slug route
  app.get('/api/public/news/categories', async (req, res) => {
    try {
      const categories = await storage.getAllNewsCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching news categories:", error);
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  // Get single news article by slug (public)
  app.get('/api/public/news/:slug', async (req, res) => {
    try {
      const article = await storage.getNewsArticleBySlug(req.params.slug);
      
      if (!article || article.status !== 'published') {
        return res.status(404).json({ message: "Notícia não encontrada" });
      }

      // Increment view count
      await storage.incrementNewsViews(article.id);
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching news article:", error);
      res.status(500).json({ message: "Erro ao buscar notícia" });
    }
  });

  // EVENT ATTENDANCE ROUTES
  
  // Get attendance for an event
  app.get('/api/events/:eventId/attendance', requireAuth, async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const attendance = await storage.getEventAttendanceByEventId(eventId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching event attendance:", error);
      res.status(500).json({ message: "Erro ao buscar registro de presença" });
    }
  });
  
  // Register attendance for an event
  app.post('/api/events/:eventId/attendance', requireAuth, async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      
      // Adicionar logs para depuração
      console.log('Authentication debug:');
      console.log('req.user:', req.user);
      console.log('req.isAuthenticated:', req.isAuthenticated);
      console.log('req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'Not a function');
      console.log('session userId:', (req.session as any)?.userId);
      console.log('Body:', req.body);
      
      // Determinar o ID do usuário com base na fonte de autenticação
      let userId;
      let registeredBy;
      
      // Utilizando o ID enviado no corpo da requisição como prioridade
      if (req.body.userId) {
        userId = req.body.userId;
        registeredBy = req.body.registeredBy || req.body.userId;
      } else if (req.user) {
        // Autenticação Replit
        userId = (req.user as any)?.claims?.sub;
        registeredBy = (req.user as any)?.claims?.sub;
      } else if ((req.session as any)?.userId) {
        // Autenticação via sessão
        userId = (req.session as any).userId;
        registeredBy = (req.session as any).userId;
      } else if ((req as any).userId) {
        // Valor anexado pelo middleware
        userId = (req as any).userId;
        registeredBy = (req as any).userId;
      }
      
      if (!userId) {
        return res.status(400).json({ message: "ID do usuário não especificado" });
      }
      
      console.log(`Registrando presença para usuário ID: ${userId}, evento ID: ${eventId}`);
      
      const attendanceData = {
        eventId,
        userId,
        status: req.body.status || "Presente",
        registeredAt: new Date(),
        registeredBy: registeredBy || userId,
        notes: req.body.notes || null
      };
      
      const attendance = await storage.createEventAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error registering attendance:", error);
      res.status(500).json({ message: "Erro ao registrar presença" });
    }
  });
  
  // Update attendance
  app.put('/api/events/attendance/:id', requireAuth, async (req, res) => {
    try {
      const attendanceId = Number(req.params.id);
      const updatedAttendance = await storage.updateEventAttendance(attendanceId, req.body);
      
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Registro de presença não encontrado" });
      }
      
      res.json(updatedAttendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ message: "Erro ao atualizar registro de presença" });
    }
  });

  // Delete attendance
  app.delete('/api/events/attendance/:id', requireAuth, async (req, res) => {
    try {
      const attendanceId = Number(req.params.id);
      const result = await storage.deleteEventAttendance(attendanceId);
      
      if (!result) {
        return res.status(404).json({ message: "Registro de presença não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({ message: "Erro ao excluir registro de presença" });
    }
  });
  
  // DOCUMENT VOTES ROUTES
  
  // Get votes for a document
  app.get('/api/documents/:documentId/votes', requireAuth, async (req, res) => {
    try {
      const documentId = Number(req.params.documentId);
      const votes = await storage.getDocumentVotesByDocumentId(documentId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching document votes:", error);
      res.status(500).json({ message: "Erro ao buscar votos do documento" });
    }
  });
  
  // Get user's vote on a document
  app.get('/api/documents/:documentId/my-vote', requireAuth, async (req, res) => {
    try {
      const documentId = Number(req.params.documentId);
      const userId = (req.user as any).id;
      
      const vote = await storage.getDocumentVoteByUserAndDocument(userId, documentId);
      
      if (!vote) {
        return res.status(404).json({ message: "Voto não encontrado" });
      }
      
      res.json(vote);
    } catch (error) {
      console.error("Error fetching document vote:", error);
      res.status(500).json({ message: "Erro ao buscar voto do documento" });
    }
  });
  
  // Vote on a document
  app.post('/api/documents/:documentId/vote', requireAuth, async (req, res) => {
    try {
      const documentId = Number(req.params.documentId);
      const userId = (req.user as any).id;
      
      // Validate vote
      if (!['Favorável', 'Contrário', 'Abstenção'].includes(req.body.vote)) {
        return res.status(400).json({ message: "Voto inválido. Deve ser 'Favorável', 'Contrário' ou 'Abstenção'" });
      }
      
      const voteData = {
        documentId,
        userId,
        vote: req.body.vote,
        votedAt: new Date(),
        comment: req.body.comment || null
      };
      
      const vote = await storage.createDocumentVote(voteData);
      res.status(201).json(vote);
    } catch (error) {
      console.error("Error voting on document:", error);
      res.status(500).json({ message: "Erro ao registrar voto" });
    }
  });
  
  // Update vote (owner or admin)
  app.put('/api/documents/votes/:id', requireAuth, async (req, res) => {
    try {
      const voteId = Number(req.params.id);
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === 'admin';
      
      // Get existing vote
      const existingVote = await storage.getDocumentVote(voteId);
      
      if (!existingVote) {
        return res.status(404).json({ message: "Voto não encontrado" });
      }
      
      // Check if user is the owner of the vote or an admin
      if (existingVote.userId !== userId && !isAdmin) {
        return res.status(403).json({ message: "Não autorizado a editar este voto" });
      }
      
      // Validate vote
      if (req.body.vote && !['Favorável', 'Contrário', 'Abstenção'].includes(req.body.vote)) {
        return res.status(400).json({ message: "Voto inválido. Deve ser 'Favorável', 'Contrário' ou 'Abstenção'" });
      }
      
      const updatedVote = await storage.updateDocumentVote(voteId, {
        ...req.body,
        updatedAt: new Date()
      });
      
      res.json(updatedVote);
    } catch (error) {
      console.error("Error updating vote:", error);
      res.status(500).json({ message: "Erro ao atualizar voto" });
    }
  });
  
  // Delete vote (admin only)
  app.delete('/api/documents/votes/:id', requireAdmin, async (req, res) => {
    try {
      const voteId = Number(req.params.id);
      const result = await storage.deleteDocumentVote(voteId);
      
      if (!result) {
        return res.status(404).json({ message: "Voto não encontrado" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting vote:", error);
      res.status(500).json({ message: "Erro ao excluir voto" });
    }
  });
  
  // ACTIVITY TIMELINE ROUTES
  
  // Get timeline for an activity
  app.get('/api/legislative-activities/:activityId/timeline', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const timeline = await storage.getActivityTimelineByActivityId(activityId);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching activity timeline:", error);
      res.status(500).json({ message: "Erro ao buscar linha do tempo da atividade" });
    }
  });
  
  // Add event to activity timeline
  app.post('/api/legislative-activities/:activityId/timeline', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const userId = (req.user as any).id;
      
      const timelineData = {
        activityId,
        eventDate: new Date(),
        description: req.body.description,
        eventType: req.body.eventType || "Atualização",
        createdBy: userId,
        metadata: req.body.metadata || {}
      };
      
      const timelineEvent = await storage.createActivityTimeline(timelineData);
      res.status(201).json(timelineEvent);
    } catch (error) {
      console.error("Error adding timeline event:", error);
      res.status(500).json({ message: "Erro ao adicionar evento na linha do tempo" });
    }
  });

  // Get councilors list
  app.get('/api/councilors', requireAuth, async (req, res) => {
    try {
      const councilors = await storage.getCouncilors();
      res.json(councilors);
    } catch (error) {
      console.error("Error fetching councilors:", error);
      res.status(500).json({ message: "Erro ao buscar vereadores" });
    }
  });
  
  // Obter atividades legislativas de um vereador específico
  app.get('/api/users/:id/activities', requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Buscar atividades relacionadas ao vereador através da tabela de autores
      const activities = await storage.getLegislativeActivitiesByAuthor(userId);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching councilor activities:", error);
      res.status(500).json({ message: "Erro ao buscar atividades do vereador" });
    }
  });
  
  // Obter documentos relacionados a um vereador específico
  app.get('/api/users/:id/documents', requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Buscar documentos relacionados ao vereador usando o método do storage
      const userDocuments = await storage.getDocumentsByUser(userId);
      
      res.json(userDocuments);
    } catch (error) {
      console.error("Error fetching councilor documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos do vereador" });
    }
  });
  
  // Obter comissões das quais um vereador participa
  app.get('/api/users/:id/committees', requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Buscar comissões onde o usuário é membro usando o método do storage
      const committeesData = await storage.getCommitteesByMember(userId);
      
      res.json(committeesData);
    } catch (error) {
      console.error("Error fetching councilor committees:", error);
      res.status(500).json({ message: "Erro ao buscar comissões do vereador" });
    }
  });
  
  // Aprovar ou rejeitar uma atividade legislativa
  app.post('/api/activities/:activityId/approve', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const { approved, comment } = req.body;
      
      // Verificar se o usuário está autenticado
      // Se o usuário estiver autenticado por sessão, req.user pode já estar definido pelo middleware
      // Mas também verificamos req.userId que pode ter sido definido pelo middleware requireAuth
      if (!req.user && !(req as any).userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Obter o userId de req.user ou diretamente de req.userId
      const userId = (req.user as any)?.id || (req as any).userId;
      console.log("Usuário autenticado:", userId);
      
      // Validar dados
      if (approved === undefined || approved === null) {
        return res.status(400).json({ message: "O campo 'approved' é obrigatório" });
      }
      
      // Buscar a atividade
      const activity = await storage.getLegislativeActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Verificar se o usuário é administrador
      try {
        const user = await storage.getUser(userId);
        console.log("Usuário encontrado:", user);
        
        // Hardcoded para o usuário root que deve ser admin
        if (userId === 'root') {
          console.log("Usuário root tem permissão de administrador");
        } else if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: "Apenas administradores podem aprovar ou rejeitar atividades" });
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        // Se o usuário for root, permitimos a operação mesmo se houver erro ao buscar
        if (userId !== 'root') {
          return res.status(500).json({ message: "Erro ao verificar permissões do usuário" });
        }
      }
      
      // Atualizar o status de aprovação
      const updatedActivity = await storage.updateLegislativeActivity(activityId, {
        approved: approved,
        approvedBy: userId,
        approvedAt: new Date(),
        approvalComment: comment || null
      });
      
      // Registrar no timeline da atividade
      await storage.createActivityTimeline({
        activityId,
        description: approved ? "Atividade aprovada" : "Atividade rejeitada",
        eventType: approved ? "approval" : "rejection",
        createdBy: userId,
        eventDate: new Date(),
        metadata: {
          comment: comment || null
        }
      });
      
      // Buscar informações sobre o usuário que aprovou/rejeitou
      const approver = await storage.getUser(userId);
      
      // Buscar autores da atividade para notificá-los
      const authorIds = activity.authors ? activity.authors.map((author: any) => author.id) : [];
      
      // Enviar notificação via WebSocket
      if (typeof sendNotification === 'function') {
        // Criar mensagem de notificação
        const actionText = approved ? 'aprovou' : 'rejeitou';
        const notificationMessage = `${approver ? approver.name : 'Um administrador'} ${actionText} a atividade ${activity.activityType} Nº ${activity.activityNumber}`;
        
        // Notificar autores da atividade
        if (authorIds.length > 0) {
          sendNotification(authorIds, {
            type: 'activity_approval',
            activityId,
            activity: {
              id: activityId,
              title: `${activity.activityType} Nº ${activity.activityNumber}`,
              description: activity.description
            },
            approver: {
              id: userId,
              name: approver ? approver.name : 'Administrador',
              approved: approved
            },
            comment: comment || null,
            message: notificationMessage,
            timestamp: new Date().toISOString()
          });
        }
        
        // Notificação para todos os usuários
        sendNotification('all', {
          type: 'activity_status_change',
          activityId,
          activity: {
            id: activityId,
            title: `${activity.activityType} Nº ${activity.activityNumber}`,
            description: activity.description,
            status: approved ? 'Aprovado' : 'Rejeitado'
          },
          message: notificationMessage,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({ 
        message: "Atividade atualizada com sucesso", 
        approved: approved,
        activity: updatedActivity
      });
    } catch (error) {
      console.error("Error approving activity:", error);
      res.status(500).json({ 
        message: "Erro ao aprovar/rejeitar atividade",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // ROUTES FOR ACTIVITY VOTES
  
  // Get all votes for an activity
  app.get('/api/activities/:activityId/votes', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      
      // Verificar se a atividade existe
      const activity = await storage.getLegislativeActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Buscar os votos
      const votes = await storage.getActivityVotesByActivityId(activityId);
      
      // Buscar estatísticas de votação
      const stats = await storage.getActivityVotesStats(activityId);
      
      // Retornar votos e estatísticas
      res.json({
        votes,
        stats
      });
    } catch (error) {
      console.error("Error fetching activity votes:", error);
      res.status(500).json({ message: "Erro ao buscar votos da atividade" });
    }
  });
  
  // Submit vote for an activity
  app.post('/api/activities/:activityId/votes', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const { vote, comment } = req.body;
      
      // Verificar se o usuário está autenticado
      if (!req.user && !(req as any).userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Obter o userId de req.user ou diretamente de req.userId
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id || (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({ message: "ID do usuário não disponível" });
      }
      
      // Verificar se a atividade existe
      const activity = await storage.getLegislativeActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Verificar se a atividade requer aprovação
      if (!activity.needsApproval) {
        return res.status(400).json({ message: "Esta atividade não requer votação" });
      }
      
      // Verificar se o voto é válido
      if (vote === undefined || vote === null) {
        return res.status(400).json({ message: "O campo 'vote' é obrigatório" });
      }
      
      // Registrar o voto
      const savedVote = await storage.createActivityVote({
        activityId,
        userId,
        vote,
        comment: comment || null,
        votedAt: new Date()
      });
      
      // Registrar no timeline da atividade
      await storage.createActivityTimeline({
        activityId,
        description: vote ? "Voto favorável registrado" : "Voto contrário registrado",
        eventType: "vote",
        createdBy: userId,
        eventDate: new Date(),
        metadata: {
          voteId: savedVote.id,
          vote,
          comment: comment || null
        }
      });
      
      // Buscar estatísticas atualizadas
      const stats = await storage.getActivityVotesStats(activityId);
      
      // Buscar informações sobre o usuário que votou
      const voter = await storage.getUser(userId);
      
      // Buscar dados completos da atividade
      const activityDetails = await storage.getLegislativeActivity(activityId);
      
      // Enviar notificação via WebSocket
      if (typeof sendNotification === 'function') {
        if (activityDetails) {
          // Notificação para todos os usuários conectados
          sendNotification('all', {
            type: 'activity_vote',
            activityId,
            activity: {
              id: activityId,
              title: `${activityDetails.activityType} Nº ${activityDetails.activityNumber}`,
              description: activityDetails.description
            },
            voter: {
              id: userId,
              name: voter ? voter.name : 'Usuário',
              vote: vote
            },
            stats: stats,
            message: `${voter ? voter.name : 'Um usuário'} ${vote ? 'aprovou' : 'rejeitou'} a atividade ${activityDetails.activityType} Nº ${activityDetails.activityNumber}`,
            timestamp: new Date().toISOString()
          });
        } else {
          // Notificação simplificada caso não encontre os detalhes da atividade
          sendNotification('all', {
            type: 'activity_vote',
            activityId,
            voter: {
              id: userId,
              name: voter ? voter.name : 'Usuário',
              vote: vote
            },
            stats: stats,
            message: `${voter ? voter.name : 'Um usuário'} ${vote ? 'aprovou' : 'rejeitou'} uma atividade`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      res.json({
        message: "Voto registrado com sucesso",
        vote: savedVote,
        stats
      });
    } catch (error) {
      console.error("Error submitting activity vote:", error);
      res.status(500).json({ message: "Erro ao registrar voto" });
    }
  });
  
  // Get vote statistics for an activity
  app.get('/api/activities/:activityId/votes/stats', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      
      // Verificar se a atividade existe
      const activity = await storage.getLegislativeActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Buscar estatísticas de votação
      const stats = await storage.getActivityVotesStats(activityId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching vote statistics:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas de votação" });
    }
  });
  
  // Get user's vote for an activity
  app.get('/api/activities/:activityId/votes/my', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      
      // Verificar se o usuário está autenticado
      if (!req.user && !(req as any).userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Obter o userId de req.user ou diretamente de req.userId
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id || (req as any).userId;
      console.log("Usuário autenticado pela sessão:", userId);
      
      if (!userId) {
        return res.status(401).json({ message: "ID do usuário não disponível" });
      }
      
      // Buscar o voto do usuário
      const vote = await storage.getActivityVoteByUserAndActivity(userId, activityId);
      
      if (!vote) {
        return res.status(200).json(null);
      }
      
      res.json(vote);
    } catch (error) {
      console.error("Error fetching user's vote:", error);
      res.status(500).json({ message: "Erro ao buscar voto do usuário" });
    }
  });

  // Admin route for batch voting - allows administrator to register votes for multiple councilors
  app.post('/api/activities/:activityId/votes/admin', requireAdmin, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const { votes } = req.body; // Expected format: [{ userId: string, vote: boolean, comment?: string }]
      
      // Validar entrada
      if (!Array.isArray(votes) || votes.length === 0) {
        return res.status(400).json({ message: "Lista de votos é obrigatória e deve conter pelo menos um voto" });
      }
      
      // Verificar se a atividade existe
      const activity = await storage.getLegislativeActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Validar esquema de cada voto
      const voteSchema = z.object({
        userId: z.string().min(1, "ID do usuário é obrigatório"),
        vote: z.boolean(),
        comment: z.string().optional()
      });
      
      const validatedVotes = votes.map((vote, index) => {
        try {
          return voteSchema.parse(vote);
        } catch (error) {
          throw new Error(`Voto ${index + 1} inválido: ${error instanceof z.ZodError ? error.errors[0].message : 'Formato inválido'}`);
        }
      });
      
      // Verificar se todos os usuários existem e são vereadores
      for (const voteData of validatedVotes) {
        const user = await storage.getUser(voteData.userId);
        if (!user) {
          return res.status(400).json({ message: `Usuário ${voteData.userId} não encontrado` });
        }
        if (user.role !== "councilor") {
          return res.status(400).json({ message: `Usuário ${user.name} não é um vereador` });
        }
      }
      
      // Registrar todos os votos
      const savedVotes = [];
      const adminUser = await storage.getUser(req.user?.claims?.sub || req.user?.id || (req as any).userId);
      
      for (const voteData of validatedVotes) {
        const savedVote = await storage.createActivityVote({
          activityId,
          userId: voteData.userId,
          vote: voteData.vote,
          comment: voteData.comment || null,
          votedAt: new Date()
        });
        
        savedVotes.push(savedVote);
        
        // Registrar no timeline da atividade
        const voter = await storage.getUser(voteData.userId);
        await storage.createActivityTimeline({
          activityId,
          description: `Voto ${voteData.vote ? 'favorável' : 'contrário'} registrado por administrador para ${voter?.name || voteData.userId}`,
          eventType: "admin_vote",
          createdBy: adminUser?.id || "system",
          eventDate: new Date(),
          metadata: {
            voteId: savedVote.id,
            voterId: voteData.userId,
            voterName: voter?.name,
            vote: voteData.vote,
            comment: voteData.comment || null,
            registeredByAdmin: true,
            adminId: adminUser?.id,
            adminName: adminUser?.name
          }
        });
      }
      
      // Buscar estatísticas atualizadas
      const stats = await storage.getActivityVotesStats(activityId);
      
      // Buscar dados completos da atividade
      const activityDetails = await storage.getLegislativeActivity(activityId);
      
      // Enviar notificação via WebSocket para votação administrativa
      if (typeof sendNotification === 'function' && activityDetails) {
        sendNotification('all', {
          type: 'admin_batch_vote',
          activityId,
          activity: {
            id: activityId,
            title: `${activityDetails.activityType} Nº ${activityDetails.activityNumber}`,
            description: activityDetails.description
          },
          adminName: adminUser?.name || 'Administrador',
          votesCount: savedVotes.length,
          stats: stats,
          message: `${adminUser?.name || 'Administrador'} registrou ${savedVotes.length} votos para a atividade ${activityDetails.activityType} Nº ${activityDetails.activityNumber}`,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        message: `${savedVotes.length} votos registrados com sucesso`,
        votes: savedVotes,
        stats
      });
    } catch (error) {
      console.error("Error submitting admin batch votes:", error);
      res.status(500).json({ 
        message: "Erro ao registrar votos administrativos",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Obter o histórico de eventos da atividade (timeline)
  app.get('/api/activities/:activityId/timeline', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "ID de atividade inválido" });
      }
      
      // Verificar se a atividade existe
      const activity = await storage.getLegislativeActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Buscar o histórico da timeline
      const timeline = await storage.getActivityTimelineByActivityId(activityId);
      
      // Para cada item da timeline, buscar dados do usuário que criou
      const timelineWithUsers = await Promise.all(timeline.map(async (item) => {
        if (!item.createdBy) return item;
        
        try {
          const user = await storage.getUser(item.createdBy);
          return { ...item, user };
        } catch (error) {
          console.error(`Erro ao buscar usuário ${item.createdBy} para timeline:`, error);
          return item;
        }
      }));
      
      // Retornar os eventos da timeline
      res.json(timelineWithUsers);
    } catch (error) {
      console.error("Error fetching activity timeline:", error);
      res.status(500).json({ message: "Erro ao buscar histórico da atividade" });
    }
  });

  // COMMITTEES ROUTES

  // Get all committees
  app.get('/api/committees', requireAuth, async (req, res) => {
    try {
      const committees = await storage.getAllCommittees();
      res.json(committees);
    } catch (error) {
      console.error("Error fetching committees:", error);
      res.status(500).json({ message: "Erro ao buscar comissões" });
    }
  });

  // Get a single committee with members
  app.get('/api/committees/:id', requireAuth, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }

      const committee = await storage.getCommitteeWithMembers(committeeId);
      if (!committee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }

      res.json(committee);
    } catch (error) {
      console.error("Error fetching committee:", error);
      res.status(500).json({ message: "Erro ao buscar comissão" });
    }
  });

  // Get committee members
  app.get('/api/committees/:id/members', requireAuth, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }

      const members = await storage.getCommitteeMembersByCommitteeId(committeeId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching committee members:", error);
      res.status(500).json({ message: "Erro ao buscar membros da comissão" });
    }
  });

  // Get committee events
  app.get('/api/committees/:id/events', requireAuth, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }

      const events = await storage.getCommitteeEvents(committeeId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching committee events:", error);
      res.status(500).json({ message: "Erro ao buscar eventos da comissão" });
    }
  });

  // Get committee legislative activities
  app.get('/api/committees/:id/activities', requireAuth, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }

      const activityType = req.query.type as string;
      const activities = await storage.getCommitteeLegislativeActivities(committeeId, activityType);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching committee activities:", error);
      res.status(500).json({ message: "Erro ao buscar atividades da comissão" });
    }
  });

  // Create a new committee
  app.post('/api/committees', requireAuth, requireAdmin, async (req, res) => {
    try {
      const committeeData = {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };

      const memberIds = req.body.members || [];

      // Verificar se temos todas as informações necessárias
      if (!committeeData.name) {
        return res.status(400).json({ message: "Nome da comissão é obrigatório" });
      }
      
      if (!committeeData.type) {
        return res.status(400).json({ message: "Tipo da comissão é obrigatório" });
      }
      
      if (!committeeData.startDate || isNaN(committeeData.startDate.getTime())) {
        return res.status(400).json({ message: "Data de início inválida" });
      }
      
      if (!committeeData.endDate || isNaN(committeeData.endDate.getTime())) {
        return res.status(400).json({ message: "Data de término inválida" });
      }

      console.log("Criando comissão com dados:", JSON.stringify(committeeData));
      console.log("Membros:", memberIds);

      const newCommittee = await storage.createCommittee(committeeData, memberIds);
      console.log("Comissão criada com sucesso:", newCommittee);

      try {
        // Tentar enviar notificação, mas não falhar se der erro
        if (typeof sendNotification === 'function') {
          sendNotification('all', {
            type: 'COMMITTEE_CREATED',
            title: 'Nova Comissão Criada',
            message: `A comissão "${committeeData.name}" foi criada.`,
            data: newCommittee
          });
        }
      } catch (notificationError) {
        console.error("Erro ao enviar notificação, mas comissão foi criada:", notificationError);
      }

      res.status(201).json(newCommittee);
    } catch (error: any) {
      console.error("Error creating committee:", error);
      const errorMessage = error.message || "Erro ao criar comissão";
      res.status(500).json({ message: errorMessage });
    }
  });



  // Delete a committee
  app.delete('/api/committees/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }

      // Obter o nome da comissão antes de excluí-la
      const committee = await storage.getCommittee(committeeId);
      if (!committee) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }

      const deleted = await storage.deleteCommittee(committeeId);
      if (!deleted) {
        return res.status(404).json({ message: "Comissão não encontrada" });
      }

      // Notificar usuários sobre a exclusão da comissão
      sendNotification('all', {
        type: 'COMMITTEE_DELETED',
        title: 'Comissão Excluída',
        message: `A comissão "${committee.name}" foi excluída.`,
        data: { id: committeeId }
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting committee:", error);
      res.status(500).json({ message: "Erro ao excluir comissão" });
    }
  });

  // Update committee member role
  app.put('/api/committees/:id/members/:userId', requireAuth, requireAdmin, async (req, res) => {
    try {
      const committeeId = parseInt(req.params.id);
      const userId = req.params.userId;
      const { role } = req.body;

      if (isNaN(committeeId)) {
        return res.status(400).json({ message: "ID da comissão inválido" });
      }

      if (!role) {
        return res.status(400).json({ message: "Função é obrigatória" });
      }

      // Remover o membro atual
      await storage.removeCommitteeMember(committeeId, userId);
      
      // Adicionar novamente com a nova função
      const member = await storage.addCommitteeMember(committeeId, userId, role);

      // Notificar o membro sobre a mudança de função
      sendNotification(userId, {
        type: 'COMMITTEE_ROLE_UPDATED',
        title: 'Função Atualizada',
        message: `Sua função na comissão foi atualizada para ${role}.`,
        data: { committeeId, userId, role }
      });

      res.json(member);
    } catch (error) {
      console.error("Error updating committee member role:", error);
      res.status(500).json({ message: "Erro ao atualizar função do membro" });
    }
  });

  // Get all councilors (for committee member selection)
  app.get('/api/councilors', requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsersByRole('councilor');
      res.json(users);
    } catch (error) {
      console.error("Error fetching councilors:", error);
      res.status(500).json({ message: "Erro ao buscar vereadores" });
    }
  });
  
  // Rota pública para obter vereadores (sem autenticação)
  app.get('/api/public/councilors', async (req, res) => {
    try {
      const councilors = await storage.getUsersByRole('councilor');
      res.json(councilors);
    } catch (error) {
      console.error("Erro ao buscar vereadores para exibição pública:", error);
      res.status(500).json({ message: "Erro ao buscar vereadores" });
    }
  });
  
  // Rota pública para obter documentos (sem autenticação)
  app.get('/api/public/documents', async (req, res) => {
    try {
      // Parâmetros de filtro e paginação
      const { 
        type, 
        status, 
        search, 
        page = '1', 
        limit = '15'
      } = req.query;

      // Converter para números
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 15;
      
      console.log("Buscando documentos públicos com filtros:", req.query);
      
      // Construir objeto de filtro
      const filters: any = {};
      
      if (type) filters.documentType = type;
      if (status) filters.status = status;
      if (search) filters.search = search as string;
      
      // Buscar documentos filtrados com paginação
      const documents = await storage.getFilteredDocuments(filters, pageNum, limitNum);
      
      // Buscar contagem total para paginação
      const total = await storage.getDocumentsCount(filters);
      
      // Obtendo tipos de documentos e status distintos para os filtros
      // Vamos extrair todos os tipos e status únicos dos documentos
      const allDocuments = await storage.getAllDocuments();
      const documentTypes = [...new Set(allDocuments.map(doc => doc.documentType).filter(Boolean))];
      const statusTypes = [...new Set(allDocuments.map(doc => doc.status).filter(Boolean))];
      
      res.json({
        documents,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        },
        filters: {
          documentTypes,
          statusTypes
        }
      });
    } catch (error) {
      console.error("Erro ao buscar documentos para exibição pública:", error);
      res.status(500).json({ message: "Erro ao buscar documentos", error: error.message });
    }
  });

  // Rota pública para obter detalhes de um vereador específico (sem autenticação)
  app.get('/api/public/councilors/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Buscar o vereador primeiro
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Verificar se é realmente um vereador antes de continuar
      if (user.role !== 'councilor') {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Buscar apenas as atividades e comissões relacionadas
      const activities = await storage.getLegislativeActivitiesByAuthor(id);
      const committees = await storage.getCommitteesByMember(id);
      
      // Montar o objeto de resposta
      const councilor = {
        ...user,
        activities,
        documents: [], // Retornamos um array vazio para evitar erros
        committees
      };
      
      res.json(councilor);
    } catch (error) {
      console.error(`Erro ao buscar detalhes do vereador ${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar detalhes do vereador" });
    }
  });

  // Rota pública para obter detalhes de uma atividade legislativa específica
  app.get('/api/public/legislative-activities/:id', async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const activity = await storage.getLegislativeActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Verificar se a atividade está aprovada para exibição pública
      if (activity.approved === false) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      res.json(activity);
    } catch (error) {
      console.error(`Erro ao buscar atividade ${req.params.id}:`, error);
      res.status(500).json({ message: "Erro ao buscar atividade" });
    }
  });

  // Rota pública para obter atividades legislativas (sem autenticação)
  app.get('/api/public/legislative-activities', async (req, res) => {
    console.log("API de atividades legislativas chamada");
    
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Obter parâmetros de consulta
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const activityType = req.query.activityType as string;
      const status = req.query.status as string;
      const search = req.query.search as string;
      
      // Buscar todas as atividades aprovadas do banco de dados
      const allActivities = await storage.getAllLegislativeActivities();
      
      // Filtrar apenas atividades aprovadas para exibição pública
      let filteredActivities = allActivities.filter(activity => 
        activity.approved === true || activity.approved === null
      );
      
      // Aplicar filtros se fornecidos
      if (activityType) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.activityType === activityType
        );
      }
      
      if (status) {
        filteredActivities = filteredActivities.filter(activity => {
          // Mapear status baseado na aprovação
          const activityStatus = activity.approved === true ? 'aprovada' : 
                               activity.approved === false ? 'rejeitada' : 'pendente';
          return activityStatus === status;
        });
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredActivities = filteredActivities.filter(activity =>
          activity.description.toLowerCase().includes(searchLower) ||
          activity.activityType.toLowerCase().includes(searchLower)
        );
      }
      
      // Ordenar por data mais recente
      filteredActivities.sort((a, b) => 
        new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
      );
      
      // Calcular paginação
      const total = filteredActivities.length;
      const pages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedActivities = filteredActivities.slice(offset, offset + limit);
      
      // Transformar dados para o formato esperado pelo frontend
      const formattedActivities = paginatedActivities.map(activity => {
        const year = new Date(activity.activityDate).getFullYear();
        const activityStatus = activity.approved === true ? 'aprovada' : 
                             activity.approved === false ? 'rejeitada' : 'pendente';
        
        return {
          id: activity.id,
          title: `${activity.activityType} Nº ${activity.activityNumber}/${year}`,
          description: activity.description,
          type: activity.activityType,
          status: activityStatus,
          sessionDate: activity.activityDate,
          authors: activity.authors || []
        };
      });
      
      // Obter tipos únicos de atividade e status para filtros
      const uniqueActivityTypes = [...new Set(allActivities.map(a => a.activityType))];
      const uniqueStatusTypes = ['aprovada', 'pendente', 'rejeitada'];
      
      const response = {
        activities: formattedActivities,
        pagination: {
          total,
          page,
          limit,
          pages
        },
        filters: {
          activityTypes: uniqueActivityTypes,
          statusTypes: uniqueStatusTypes
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error("Erro ao buscar atividades legislativas:", error);
      res.status(500).json({ 
        activities: [],
        pagination: { total: 0, page: 1, limit: 0, pages: 0 },
        filters: { activityTypes: [], statusTypes: [] },
        error: "Erro interno do servidor"
      });
    }
  });



  // Rota pública para obter eventos do mês atual (sem autenticação)
  app.get('/api/public/events', async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Buscar todos os eventos do sistema
      const allEvents = await storage.getAllEvents();
      
      if (!allEvents || allEvents.length === 0) {
        return res.json([]);
      }
      
      // Filtrar eventos do mês atual
      const currentMonthEvents = allEvents.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      });
      
      // Ordenar por data (mais próximos primeiro)
      currentMonthEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      
      // Formatar eventos para o frontend público
      const formattedEvents = currentMonthEvents.map(event => ({
        id: event.id,
        title: `${event.category} #${event.eventNumber}`,
        date: format(new Date(event.eventDate), 'dd/MM/yyyy'),
        time: event.eventTime || '00:00',
        location: event.location || 'Local não informado',
        type: event.category,
        status: event.status,
        description: event.description
      }));
      
      res.json(formattedEvents);
    } catch (error) {
      console.error("Erro ao buscar eventos públicos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota pública para obter todos os eventos (sem autenticação)
  app.get('/api/public/events/all', async (req, res) => {
    try {
      const { category } = req.query;
      
      // Buscar todos os eventos do sistema
      const allEvents = await storage.getAllEvents();
      
      if (!allEvents || allEvents.length === 0) {
        return res.json([]);
      }
      
      // Filtrar por categoria se especificada
      let filteredEvents = allEvents;
      if (category && typeof category === 'string') {
        filteredEvents = allEvents.filter(event => event.category === category);
      }
      
      // Ordenar por data (mais próximos primeiro)
      filteredEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      
      // Formatar eventos para o frontend público incluindo comissões
      const formattedEvents = await Promise.all(filteredEvents.map(async (event) => {
        let committees = [];
        try {
          // Buscar comissões associadas ao evento se for do tipo "Reunião Comissão"
          if (event.category === "Reunião Comissão") {
            committees = await storage.getEventCommittees(event.id);
          }
        } catch (error) {
          console.error(`Erro ao buscar comissões para evento ${event.id}:`, error);
        }

        return {
          id: event.id,
          title: `${event.category} #${event.eventNumber}`,
          date: format(new Date(event.eventDate), 'dd/MM/yyyy'),
          time: event.eventTime || '00:00',
          location: event.location || 'Local não informado',
          type: event.category,
          status: event.status,
          description: event.description,
          eventNumber: event.eventNumber,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          category: event.category,
          legislatureId: event.legislatureId,
          mapUrl: event.mapUrl,
          committees: committees || []
        };
      }));
      
      res.json(formattedEvents);
    } catch (error) {
      console.error("Erro ao buscar todos os eventos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota pública para obter detalhes de um evento específico (sem autenticação)
  app.get('/api/public/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "ID do evento inválido" });
      }
      
      // Buscar evento no banco de dados
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      // Formatar evento para o frontend público
      const formattedEvent = {
        id: event.id,
        title: `${event.category} #${event.eventNumber}`,
        date: format(new Date(event.eventDate), 'dd/MM/yyyy'),
        time: event.eventTime || '00:00',
        location: event.location || 'Local não informado',
        mapUrl: event.mapUrl,
        type: event.category,
        status: event.status,
        description: event.description,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        eventNumber: event.eventNumber,
        category: event.category
      };
      
      res.json(formattedEvent);
    } catch (error) {
      console.error("Erro ao buscar evento público:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota pública para obter detalhes completos de um evento (atividades, documentos, presenças, linha do tempo)
  app.get('/api/public/events/:id/details', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "ID do evento inválido" });
      }
      
      // Buscar evento com todos os detalhes usando o método completo
      const eventWithDetails = await storage.getEventWithDetails(eventId);
      
      if (!eventWithDetails) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      // Formatar dados para o frontend público
      const formattedEvent = {
        id: eventWithDetails.id,
        title: `${eventWithDetails.category} #${eventWithDetails.eventNumber}`,
        description: eventWithDetails.description,
        status: eventWithDetails.status,
        eventDate: eventWithDetails.eventDate,
        eventTime: eventWithDetails.eventTime,
        location: eventWithDetails.location,
        mapUrl: eventWithDetails.mapUrl,
        videoUrl: eventWithDetails.videoUrl,
        category: eventWithDetails.category,
        eventNumber: eventWithDetails.eventNumber,
        legislatureId: eventWithDetails.legislatureId,
        createdAt: eventWithDetails.createdAt,
        updatedAt: eventWithDetails.updatedAt,
        
        // Informações da legislatura
        legislature: eventWithDetails.legislature,
        
        // Atividades legislativas com autores
        activities: eventWithDetails.activities.map((activity: any) => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          status: activity.status,
          activityNumber: activity.activityNumber,
          activityDate: activity.activityDate,
          type: activity.type,
          authors: activity.authors || []
        })),
        
        // Documentos do evento
        documents: eventWithDetails.documents.map((document: any) => ({
          id: document.id,
          fileName: document.fileName,
          documentType: document.documentType,
          status: document.status,
          description: document.description,
          documentNumber: document.documentNumber,
          documentDate: document.documentDate,
          filePath: document.filePath,
          eventId: document.eventId
        })),
        
        // Lista de presença
        attendance: eventWithDetails.attendance.map((record: any) => ({
          id: record.id,
          status: record.status,
          notes: record.notes,
          registeredAt: record.registeredAt,
          userId: record.userId,
          user: record.user ? {
            id: record.user.id,
            name: record.user.name,
            role: record.user.role,
            profileImageUrl: record.user.profileImageUrl
          } : null
        }))
      };
      
      res.json(formattedEvent);
    } catch (error) {
      console.error("Erro ao buscar detalhes completos do evento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota pública para obter legislaturas (sem autenticação)
  app.get('/api/public/legislatures', async (req, res) => {
    try {
      const legislatures = await storage.getAllLegislatures();
      res.json(legislatures || []);
    } catch (error) {
      console.error("Erro ao buscar legislaturas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota pública para obter comissões (sem autenticação)
  app.get('/api/public/committees', async (req, res) => {
    try {
      const committees = await storage.getAllCommittees();
      
      // Buscar membros para cada comissão
      const committeesWithMembers = await Promise.all(
        committees.map(async (committee) => {
          const fullCommittee = await storage.getCommitteeWithMembers(committee.id);
          return fullCommittee || committee;
        })
      );
      
      res.json(committeesWithMembers);
    } catch (error) {
      console.error("Erro ao buscar comissões:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota pública para obter documentos de um evento (sem autenticação)
  app.get('/api/public/events/:id/documents', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "ID do evento inválido" });
      }
      
      const documents = await storage.getDocumentsByEventId(eventId);
      
      // Filtrar apenas documentos com arquivo válido
      const validDocuments = documents.filter(doc => doc.filePath && doc.fileName);
      
      res.json(validDocuments);
    } catch (error) {
      console.error("Erro ao buscar documentos do evento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Contact form API endpoint (public)
  app.post('/api/public/contato', async (req, res) => {
    try {
      const schema = z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("E-mail inválido"),
        estado: z.string().min(1, "Estado é obrigatório"),
        cidade: z.string().min(1, "Cidade é obrigatória"),
        mensagem: z.string().min(1, "Mensagem é obrigatória")
      });

      const validated = schema.parse(req.body);

      // Import the sendEmail function
      const { sendEmail } = await import('./sendgrid');

      // Prepare email content
      const emailContent = {
        to: 'contato@jaiba.mg.leg.br',
        subject: `Novo contato do site - ${validated.nome}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #48654e; border-bottom: 2px solid #48654e; padding-bottom: 10px;">
              Nova Mensagem de Contato
            </h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #48654e; margin-top: 0;">Dados do Remetente:</h3>
              <p><strong>Nome:</strong> ${validated.nome}</p>
              <p><strong>E-mail:</strong> ${validated.email}</p>
              <p><strong>Estado:</strong> ${validated.estado}</p>
              <p><strong>Cidade:</strong> ${validated.cidade}</p>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-left: 4px solid #48654e; margin: 20px 0;">
              <h3 style="color: #48654e; margin-top: 0;">Mensagem:</h3>
              <p style="white-space: pre-line;">${validated.mensagem}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                Esta mensagem foi enviada através do formulário de contato do site da Câmara Municipal de Jaíba.
              </p>
            </div>
          </div>
        `,
        text: `
Nova Mensagem de Contato

Dados do Remetente:
Nome: ${validated.nome}
E-mail: ${validated.email}
Estado: ${validated.estado}
Cidade: ${validated.cidade}

Mensagem:
${validated.mensagem}

Data/Hora: ${new Date().toLocaleString('pt-BR')}
Esta mensagem foi enviada através do formulário de contato do site da Câmara Municipal de Jaíba.
        `
      };

      // Send email
      const emailSent = await sendEmail(emailContent);

      if (emailSent) {
        console.log(`Mensagem de contato enviada de: ${validated.email}`);
        res.json({ 
          success: true, 
          message: "Mensagem enviada com sucesso!" 
        });
      } else {
        throw new Error('Falha ao enviar e-mail');
      }

    } catch (error) {
      console.error("Erro ao processar formulário de contato:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }

      // Em desenvolvimento, registrar a submissão e retornar sucesso para testes da interface
      if (process.env.NODE_ENV === 'development') {
        console.log('=== FORMULÁRIO DE CONTATO SUBMETIDO ===');
        console.log('Dados recebidos no formulário de contato');
        console.log('=======================================');
        
        return res.json({ 
          success: true, 
          message: "Mensagem recebida! (Modo desenvolvimento - verifique os logs do servidor)" 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor. Tente novamente mais tarde." 
      });
    }
  });

  // Rota pública para download de documentos (sem autenticação)
  app.get('/api/public/documents/download/:id', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ error: "ID do documento inválido" });
      }
      
      const document = await storage.getDocumentById(documentId);
      
      if (!document || !document.filePath || !document.fileName) {
        return res.status(404).json({ error: "Documento não encontrado ou sem arquivo" });
      }
      
      const filePath = path.join(process.cwd(), document.filePath);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
      }
      
      // Definir headers para download
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Enviar o arquivo
      res.sendFile(filePath);
    } catch (error) {
      console.error("Erro ao fazer download do documento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota pública para download de arquivo de atividade legislativa (sem autenticação)
  app.get('/api/public/activities/:id/download', async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "ID da atividade inválido" });
      }
      
      // Buscar a atividade no banco de dados
      const activity = await storage.getLegislativeActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      // Verificar se a atividade tem arquivo anexado
      if (!activity.filePath || !activity.fileName) {
        return res.status(404).json({ message: "Arquivo não encontrado para esta atividade" });
      }
      
      // Verificar se o arquivo existe no sistema de arquivos
      let filePath;
      
      // Se o filePath já é absoluto, use-o diretamente
      if (path.isAbsolute(activity.filePath)) {
        filePath = activity.filePath;
      } else {
        // Se é relativo, combine com o diretório de trabalho
        filePath = path.join(process.cwd(), activity.filePath);
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo não encontrado no servidor" });
      }
      
      // Definir o tipo de conteúdo baseado na extensão do arquivo
      const ext = path.extname(activity.fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
        default:
          contentType = 'application/octet-stream';
      }
      
      // Configurar cabeçalhos para download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${activity.fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Enviar o arquivo
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Erro ao ler arquivo:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Erro ao ler o arquivo" });
        }
      });
      
    } catch (error) {
      console.error("Erro ao fazer download da atividade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota pública para obter documentos de um vereador específico (sem autenticação)
  app.get('/api/public/councilors/:id/documents', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o vereador existe
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Verificar se é realmente um vereador
      if (user.role !== 'councilor') {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Buscar documentos relacionados ao vereador usando o método do storage
      const userDocuments = await storage.getDocumentsByUser(id);
      
      // Filtrar apenas documentos públicos ou aprovados para a visualização pública
      const publicDocuments = userDocuments.filter(doc => 
        doc.status === 'aprovado' || doc.status === 'publicado' || doc.status === 'arquivado'
      );
      
      res.json(publicDocuments);
    } catch (error) {
      console.error("Erro ao buscar documentos do vereador:", error);
      res.status(500).json({ message: "Erro ao buscar documentos", error: error.message });
    }
  });

  // Rota pública para obter atividades legislativas de um vereador específico (sem autenticação)
  app.get('/api/public/councilors/:id/activities', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o vereador existe
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Verificar se é realmente um vereador
      if (user.role !== 'councilor') {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      console.log(`Buscando atividades legislativas para o usuário ${id}`);
      
      // Buscar atividades legislativas do vereador
      const activities = await storage.getLegislativeActivitiesByAuthor(id);
      
      console.log(`Encontradas ${activities.length} atividades para o usuário ${id}`);
      
      res.json(activities);
    } catch (error) {
      console.error("Erro ao buscar atividades do vereador:", error);
      res.status(500).json({ message: "Erro ao buscar atividades", error: error.message });
    }
  });

  // Rota pública para obter comissões de um vereador específico (sem autenticação)
  app.get('/api/public/councilors/:id/committees', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o vereador existe
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Verificar se é realmente um vereador
      if (user.role !== 'councilor') {
        return res.status(404).json({ message: "Vereador não encontrado" });
      }
      
      // Buscar comissões do vereador
      const committees = await storage.getCommitteesByMember(id);
      
      console.log(`Usuário ${id} ${committees.length > 0 ? 'é membro de' : 'não é membro de nenhuma'} ${committees.length > 0 ? committees.length + ' comissões' : 'comissão'}`);
      
      res.json(committees);
    } catch (error) {
      console.error("Erro ao buscar comissões do vereador:", error);
      res.status(500).json({ message: "Erro ao buscar comissões", error: error.message });
    }
  });

  // Criar o servidor HTTP
  const httpServer = createServer(app);
  
  // Configurar o servidor WebSocket
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });
  
  // Armazenar as conexões dos clientes
  const clients = new Map<string, WebSocket>();
  
  // Evento de conexão WebSocket
  wss.on('connection', (ws: WebSocket) => {
    console.log('Nova conexão WebSocket estabelecida');
    
    // Gerar ID único para este cliente
    const clientId = crypto.randomUUID();
    clients.set(clientId, ws);
    
    // Enviar mensagem de confirmação de conexão
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Conexão estabelecida com sucesso',
      clientId
    }));
    
    // Lidar com mensagens recebidas do cliente
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Mensagem recebida:', data);
        
        // Identificar o tipo de mensagem (autenticação, inscrição em tópicos, etc.)
        if (data.type === 'auth') {
          // Autenticar o usuário
          if (data.userId) {
            // Associar usuário a esta conexão
            clients.set(data.userId, ws);
            console.log(`Usuário ${data.userId} autenticado via WebSocket`);
          }
        }
        
        // Outras ações conforme necessário
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });
    
    // Lidar com fechamento de conexão
    ws.on('close', () => {
      console.log('Conexão WebSocket fechada');
      clients.delete(clientId);
    });
  });
  
  // Inicializar a função para enviar notificações em tempo real
  sendNotification = (target: 'all' | string | string[], notification: any) => {
    try {
      // Se o cliente Map não estiver inicializado, não enviar notificações
      if (!clients) {
        console.log('Mapa de clientes WebSocket não inicializado. Notificações desativadas.');
        return;
      }
      
      const message = JSON.stringify(notification);
      
      if (target === 'all') {
        // Enviar para todos os clientes conectados
        let sentCount = 0;
        clients.forEach((client) => {
          if (client && client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
              sentCount++;
            } catch (err) {
              console.error('Erro ao enviar mensagem para cliente:', err);
            }
          }
        });
        console.log(`Notificação enviada para ${sentCount} clientes conectados`);
      } else if (Array.isArray(target)) {
        // Enviar para uma lista de usuários específicos
        let sentCount = 0;
        target.forEach(userId => {
          const client = clients.get(userId);
          if (client && client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
              sentCount++;
            } catch (err) {
              console.error(`Erro ao enviar mensagem para usuário ${userId}:`, err);
            }
          }
        });
        console.log(`Notificação enviada para ${sentCount}/${target.length} usuários específicos`);
      } else {
        // Enviar para um único usuário
        const client = clients.get(target);
        if (client && client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
            console.log(`Notificação enviada para usuário ${target}`);
          } catch (err) {
            console.error(`Erro ao enviar mensagem para usuário ${target}:`, err);
          }
        } else {
          console.log(`Cliente não encontrado ou não está pronto para o usuário: ${target}`);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };
  
  // Expor apenas o servidor WebSocket globalmente para uso em outros módulos
  (global as any).wss = wss;
  
  // Mesa Diretora routes
  app.get('/api/boards', async (req, res) => {
    try {
      const boards = await storage.getAllBoards();
      res.json(boards);
    } catch (error) {
      console.error('Error fetching boards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/boards', async (req, res) => {
    try {
      const validationResult = insertBoardSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.issues });
      }

      const { members, ...boardData } = req.body;
      const board = await storage.createBoard(boardData, members || []);
      res.status(201).json(board);
    } catch (error) {
      console.error('Error creating board:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/boards/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Check if the id is a valid number
      if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid board ID' });
      }
      
      const board = await storage.getBoardById(Number(id));
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }
      res.json(board);
    } catch (error) {
      console.error('Error fetching board:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/boards/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertBoardSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.issues });
      }

      const { members, ...boardData } = req.body;
      const board = await storage.updateBoard(Number(id), boardData, members);
      res.json(board);
    } catch (error) {
      console.error('Error updating board:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/boards/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBoard(Number(id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting board:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return httpServer;
}
