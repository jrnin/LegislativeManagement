import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import multer, { MulterError } from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for documents with organized directories
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine subdirectory based on the route or file type
    let subDir = '';

    // Check the request path to determine the type
    if (req.path.includes('/activities')) {
      subDir = 'activities';
    } else if (req.path.includes('/documents')) {
      subDir = 'documents';
    } else if (req.path.includes('/events')) {
      subDir = 'events';
    } else {
      subDir = 'general';
    }

    const targetDir = path.join(uploadDir, subDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
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

// Ensure news directory exists
const newsDir = path.join(process.cwd(), "uploads", "news");
if (!fs.existsSync(newsDir)) {
  fs.mkdirSync(newsDir, { recursive: true });
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

// Configure news storage
const newsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, newsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(6).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, "news-" + uniqueSuffix + ext);
  },
});

// Configure file filter for regular documents
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile?: boolean) => void) => {
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
const avatarFileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile?: boolean) => void) => {
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

// Upload instance specifically for news
export const uploadNews = multer({
  storage: newsStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for news images
  },
  fileFilter: avatarFileFilter, // Use same filter as avatars (images only)
});

// Helper function to create organized storage based on context
const createOrganizedStorage = (baseSubDir: string) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      // Create more specific subdirectories based on date and type
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');

      const targetDir = path.join(uploadDir, baseSubDir, `${year}`, `${month}`);

      // Create directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      cb(null, targetDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with timestamp and random string
      const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(6).toString("hex");
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  });
};

// Create specific upload instances for different contexts
export const uploadActivities = multer({
  storage: createOrganizedStorage('activities'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

export const uploadDocuments = multer({
  storage: createOrganizedStorage('documents'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

export const uploadEvents = multer({
  storage: createOrganizedStorage('events'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

export const handleFileUpload = (fieldName: string = 'file') => {
  return upload.single(fieldName);
};

// Enhanced file upload handlers for specific contexts
export const handleActivityUpload = (fieldName: string = 'file') => {
  return uploadActivities.single(fieldName);
};

export const handleDocumentUpload = (fieldName: string = 'file') => {
  return uploadDocuments.single(fieldName);
};

export const handleEventUpload = (fieldName: string = 'file') => {
  return uploadEvents.single(fieldName);
};

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