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
    const userId = req.user?.id;

    const objectStorageService = new ObjectStorageService();
    
    // Set ACL policy for uploaded file
    const cloudPath = await objectStorageService.trySetObjectEntityAclPolicy(
      uploadedFileURL,
      {
        owner: userId,
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