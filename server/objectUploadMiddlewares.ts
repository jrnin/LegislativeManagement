import { Request, Response, NextFunction } from "express";
import { ObjectStorageService } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

// Extended Request interface to include uploaded file info
interface UploadRequest extends Request {
  uploadedFile?: {
    cloudPath: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
}

// Avatar upload middleware for Object Storage
export const handleObjectAvatarUpload = async (req: UploadRequest, res: Response, next: NextFunction) => {
  try {
    const objectStorageService = new ObjectStorageService();
    
    // Generate upload URL for avatar
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    
    // Return upload URL for frontend to use
    req.uploadedFile = {
      cloudPath: '', // Will be set after upload
      originalName: req.body.originalName || 'avatar',
      size: 0,
      mimeType: req.body.mimeType || 'image/jpeg'
    };
    
    // Store upload URL for frontend
    req.body.uploadURL = uploadURL;
    next();
  } catch (error) {
    console.error('Error preparing avatar upload:', error);
    res.status(500).json({ error: 'Failed to prepare file upload' });
  }
};

// Activity upload middleware for Object Storage  
export const handleObjectActivityUpload = async (req: UploadRequest, res: Response, next: NextFunction) => {
  try {
    const objectStorageService = new ObjectStorageService();
    
    // Generate upload URL for activity document
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    
    req.uploadedFile = {
      cloudPath: '',
      originalName: req.body.originalName || 'document',
      size: 0,
      mimeType: req.body.mimeType || 'application/pdf'
    };
    
    req.body.uploadURL = uploadURL;
    next();
  } catch (error) {
    console.error('Error preparing activity upload:', error);
    res.status(500).json({ error: 'Failed to prepare file upload' });
  }
};

// News upload middleware for Object Storage
export const handleObjectNewsUpload = async (req: UploadRequest, res: Response, next: NextFunction) => {
  try {
    const objectStorageService = new ObjectStorageService();
    
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    
    req.uploadedFile = {
      cloudPath: '',
      originalName: req.body.originalName || 'news-image',
      size: 0,
      mimeType: req.body.mimeType || 'image/jpeg'
    };
    
    req.body.uploadURL = uploadURL;
    next();
  } catch (error) {
    console.error('Error preparing news upload:', error);
    res.status(500).json({ error: 'Failed to prepare file upload' });
  }
};

// Document upload middleware for Object Storage with organized structure
export const handleObjectDocumentUpload = async (req: UploadRequest, res: Response, next: NextFunction) => {
  try {
    const objectStorageService = new ObjectStorageService();
    
    // Use organized document upload URL with year/month structure
    const uploadURL = await objectStorageService.getDocumentUploadURL();
    
    req.uploadedFile = {
      cloudPath: '',
      originalName: req.body.originalName || 'document',
      size: 0,
      mimeType: req.body.mimeType || 'application/pdf'
    };
    
    req.body.uploadURL = uploadURL;
    next();
  } catch (error) {
    console.error('Error preparing document upload:', error);
    res.status(500).json({ error: 'Failed to prepare file upload' });
  }
};

// Post-upload processing middleware
export const processObjectUpload = async (req: UploadRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.body.uploadedFileURL) {
      return next(); // No file was uploaded
    }

    const { uploadedFileURL, entityType = 'general', visibility = 'private' } = req.body;
    
    // Determine user ID from different authentication sources
    let userId: string | undefined;
    
    if ((req as any).user) {
      // Check Replit auth first
      if ((req as any).user.claims?.sub) {
        userId = (req as any).user.claims.sub;
      } else if ((req as any).user.id) {
        userId = (req as any).user.id;
      }
    }
    
    // Fallback to session authentication
    if (!userId && (req.session as any)?.userId) {
      userId = (req.session as any).userId;
    }
    
    // Final fallback to middleware-attached userId
    if (!userId && (req as any).userId) {
      userId = (req as any).userId;
    }

    const objectStorageService = new ObjectStorageService();
    
    // Set ACL policy for uploaded file (only if userId is available)
    const cloudPath = await objectStorageService.trySetObjectEntityAclPolicy(
      uploadedFileURL,
      {
        owner: userId || 'system', // Fallback to 'system' if no user ID available
        visibility: visibility,
        aclRules: visibility === 'private' ? [{
          group: { type: 'admin_only' as any, id: 'admin' },
          permission: ObjectPermission.READ
        }] : undefined
      }
    );

    // Update request with final cloud path
    req.uploadedFile = {
      ...req.uploadedFile!,
      cloudPath: cloudPath
    };

    next();
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
};

// URL mapping utility for backward compatibility
export const mapUploadPath = (originalPath: string): string => {
  if (!originalPath) return originalPath;
  
  // Map old upload paths to new Object Storage paths
  const pathMappings = {
    '/uploads/avatars/': '/public-objects/public/avatars/',
    '/uploads/news/': '/public-objects/public/news/',
    '/uploads/activities/': '/objects/.private/activities/',
    '/uploads/documents/': '/objects/.private/documents/',
  };

  for (const [oldPath, newPath] of Object.entries(pathMappings)) {
    if (originalPath.startsWith(oldPath)) {
      return originalPath.replace(oldPath, newPath);
    }
  }

  return originalPath;
};