import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(6).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Ensure avatar directory exists
const avatarDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Configure avatar storage
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(6).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, "avatar-" + uniqueSuffix + ext);
  },
});

// Configure file filter for regular documents
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept common document formats
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/jpeg",
    "image/png",
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de arquivo não suportado. Use PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG ou PNG."));
  }
};

// Configure file filter for avatars
const avatarFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image formats for avatars
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de imagem não suportado. Use JPG, PNG, GIF ou WebP."));
  }
};

// Create multer upload instances
export const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: documentFileFilter,
});

// Upload instance specifically for avatars
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for avatars
  },
  fileFilter: avatarFileFilter,
});

/**
 * Middleware to check if the route is public and should bypass authentication
 */
export function isPublicRoute(req: Request): boolean {
  // Lista de rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/api/public/',        // Todas as rotas que começam com /api/public/
    '/api/verify-email',   // Rota de verificação de email
    '/api/login',          // Rotas de login
    '/api/register',       // Rota de registro
    '/api/auth/user'       // Rota para verificar usuário atual
  ];
  
  // Verifica se a URL atual é uma rota pública
  return publicRoutes.some(route => 
    route.endsWith('/') 
      ? req.path.startsWith(route) 
      : req.path === route || req.path.startsWith(route + '/')
  );
}

/**
 * Middleware to check if user is authenticated with custom session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Se for uma rota pública, permitir acesso sem autenticação
  if (isPublicRoute(req)) {
    return next();
  }
  
  // Verificar primeiramente se o usuário está autenticado pelo Replit
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("Usuário autenticado pelo Replit:", req.user);
    next();
    return;
  }
  
  // Se não estiver autenticado pelo Replit, verificar autenticação pela sessão
  const userId = (req.session as any).userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Você precisa estar autenticado para acessar este recurso." });
  }
  
  // Attach the userId and req.user to the request for compatibility
  (req as any).userId = userId;
  (req as any).user = { id: userId };
  console.log("Usuário autenticado pela sessão:", userId);
  next();
}

/**
 * Middleware to check if user is an administrator
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Se for uma rota pública, permitir acesso sem autenticação
  if (isPublicRoute(req)) {
    return next();
  }
  
  const userId = (req.session as any).userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Você precisa estar autenticado para acessar este recurso." });
  }
  
  try {
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Acesso restrito. Apenas administradores podem realizar esta ação." });
    }
    
    // Attach the user to the request for convenience
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ message: "Erro ao verificar permissões do usuário." });
  }
}

/**
 * Middleware to load the current user from the database
 */
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any).userId;
  
  if (userId) {
    try {
      const user = await storage.getUser(userId);
      
      if (user) {
        // Store the user in res.locals for views and in req for API access
        res.locals.currentUser = user;
        (req as any).currentUser = user;
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }
  next();
}

/**
 * Middleware to parse form data with file uploads
 */
export const handleFileUpload = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

/**
 * Middleware to handle avatar file uploads
 */
export const handleAvatarUpload = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadAvatar.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      // Se o arquivo foi enviado, adicione o caminho ao objeto body para uso posterior
      if (req.file) {
        const basePath = '/uploads/avatars/';
        const avatarPath = basePath + path.basename(req.file.path);
        req.body.profileImageUrl = avatarPath;
      }
      
      next();
    });
  };
};
