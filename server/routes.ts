import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAdmin, handleFileUpload } from "./middlewares";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendAccountCreatedEmail, sendActivityApprovalRequest } from "./sendgrid";
import { z } from "zod";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);
  
  // Initialize upload directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // AUTH ROUTES
  
  // Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
  
  // Get single user
  app.get('/api/users/:id', isAuthenticated, async (req, res) => {
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
  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserIsAdmin = (req.user.claims.sub && (await storage.getUser(req.user.claims.sub))?.role === "admin");
      
      // Only allow admins to update other users
      if (userId !== req.user.claims.sub && !currentUserIsAdmin) {
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
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        ...validated,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : undefined,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
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
  app.get('/api/legislatures', isAuthenticated, async (req, res) => {
    try {
      const legislatures = await storage.getAllLegislatures();
      res.json(legislatures);
    } catch (error) {
      console.error("Error fetching legislatures:", error);
      res.status(500).json({ message: "Erro ao buscar legislaturas" });
    }
  });
  
  // Get single legislature
  app.get('/api/legislatures/:id', isAuthenticated, async (req, res) => {
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
  app.get('/api/events', isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });
  
  // Get upcoming events
  app.get('/api/events/upcoming', isAuthenticated, async (req, res) => {
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
  app.get('/api/events/:id', isAuthenticated, async (req, res) => {
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
  
  // Create event (admin only)
  app.post('/api/events', requireAdmin, async (req, res) => {
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
  app.put('/api/events/:id', requireAdmin, async (req, res) => {
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
  
  // Delete event (admin only)
  app.delete('/api/events/:id', requireAdmin, async (req, res) => {
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
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getAllLegislativeActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Erro ao buscar atividades" });
    }
  });
  
  // Get recent legislative activities
  app.get('/api/activities/recent', isAuthenticated, async (req, res) => {
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
  app.get('/api/activities/:id', isAuthenticated, async (req, res) => {
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
  app.post('/api/activities', isAuthenticated, handleFileUpload('file'), async (req: any, res) => {
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
  app.put('/api/activities/:id', isAuthenticated, handleFileUpload('file'), async (req: any, res) => {
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
  app.delete('/api/activities/:id', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos" });
    }
  });
  
  // Get single document
  app.get('/api/documents/:id', isAuthenticated, async (req, res) => {
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
  app.get('/api/documents/:id/history', isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocumentHistory(Number(req.params.id));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching document history:", error);
      res.status(500).json({ message: "Erro ao buscar histórico do documento" });
    }
  });
  
  // Create document
  app.post('/api/documents', isAuthenticated, handleFileUpload('file'), async (req: any, res) => {
    try {
      const schema = z.object({
        documentNumber: z.number().int().positive(),
        documentType: z.string(),
        documentDate: z.string().refine(val => !isNaN(Date.parse(val))),
        authorType: z.string(),
        description: z.string(),
        status: z.string(),
        activityId: z.number().int().positive().optional(),
        parentDocumentId: z.number().int().positive().optional(),
      });
      
      // Parse form data
      const data = {
        ...req.body,
        documentNumber: Number(req.body.documentNumber),
        activityId: req.body.activityId ? Number(req.body.activityId) : undefined,
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
  app.put('/api/documents/:id', isAuthenticated, handleFileUpload('file'), async (req: any, res) => {
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
        parentDocumentId: z.number().int().positive().optional(),
      });
      
      // Parse form data
      const data = {
        ...req.body,
        documentNumber: req.body.documentNumber ? Number(req.body.documentNumber) : undefined,
        activityId: req.body.activityId ? Number(req.body.activityId) : undefined,
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
  app.get('/api/files/:type/:id', isAuthenticated, async (req, res) => {
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
      
      // Set appropriate headers
      res.setHeader('Content-Type', fileType ? fileType : 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName || 'download')}"`);
      
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
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas do dashboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
