import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { requireAuth, requireAdmin, handleFileUpload } from "./middlewares";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendAccountCreatedEmail, sendActivityApprovalRequest } from "./sendgrid";
import { z } from "zod";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

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
      const userId = (req.session as any).userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password, verificationToken, ...userData } = user;
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
      
      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({ 
          success: false,
          message: "Email não verificado. Verifique sua caixa de entrada para ativar sua conta." 
        });
      }
      
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
      
      res.json(user);
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
        legislatureId: z.number().optional(),
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
  
  // Update user
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
        legislatureId: z.number().optional(),
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
      const events = await storage.getAllEvents();
      res.json(events);
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
        category: z.string(),
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
        category: z.string().optional(),
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
        needsApproval: z.boolean().optional(),
        authorIds: z.array(z.string()).min(1, "Pelo menos um autor deve ser selecionado"),
      });
      
      // Parse form data
      const data = {
        ...req.body,
        activityNumber: Number(req.body.activityNumber),
        eventId: Number(req.body.eventId),
        needsApproval: req.body.needsApproval === 'true',
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
      if (validated.needsApproval) {
        // Get admins to notify
        const admins = await storage.getAllUsers();
        const adminUsers = admins.filter(user => user.role === "admin");
        
        // Generate base URL
        const host = req.headers.host || "";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const baseUrl = `${protocol}://${host}`;
        
        // Send emails
        for (const admin of adminUsers) {
          await sendActivityApprovalRequest(admin, activity, baseUrl);
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
      const currentUser = await storage.getUser(req.user.claims.sub);
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
      const documents = await storage.getAllDocuments();
      res.json(documents);
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
  
  // Aprovar ou rejeitar uma atividade legislativa
  app.post('/api/activities/:activityId/approve', requireAuth, async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const { approved, comment } = req.body;
      const userId = (req.user as any).id;
      
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
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem aprovar ou rejeitar atividades" });
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
      
      res.json(updatedActivity);
    } catch (error) {
      console.error("Error approving activity:", error);
      res.status(500).json({ message: "Erro ao aprovar/rejeitar atividade" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
