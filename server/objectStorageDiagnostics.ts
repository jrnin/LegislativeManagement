import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { storage } from "./storage";

export interface DiagnosticResult {
  entityType: string;
  entityId: number;
  expectedPath: string;
  exists: boolean;
  issue: string | null;
  fixable: boolean;
}

export class ObjectStorageDiagnostics {
  private objectStorage = new ObjectStorageService();

  /**
   * Diagnoses all documents to find Object Storage issues
   */
  async diagnoseDocuments(): Promise<DiagnosticResult[]> {
    const documents = await storage.getAllDocuments();
    const results: DiagnosticResult[] = [];

    for (const doc of documents) {
      if (!doc.filePath) {
        // Document without file is OK
        continue;
      }

      const result: DiagnosticResult = {
        entityType: 'document',
        entityId: doc.id,
        expectedPath: doc.filePath,
        exists: false,
        issue: null,
        fixable: false
      };

      try {
        if (doc.filePath.startsWith('/objects/')) {
          // Check Object Storage file
          const objectFile = await this.objectStorage.getObjectEntityFile(doc.filePath);
          const [exists] = await objectFile.exists();
          result.exists = exists;
          
          if (!exists) {
            result.issue = 'Object Storage file not found';
            result.fixable = false; // Cannot recover lost files
          }
        } else {
          // Legacy local file
          result.issue = 'Using legacy local storage path';
          result.fixable = true; // Could migrate to Object Storage
        }
      } catch (error) {
        if (error instanceof ObjectNotFoundError) {
          result.issue = 'Object Storage path invalid or file missing';
          result.fixable = false;
        } else {
          result.issue = `Error checking file: ${(error as any)?.message || "Unknown error"}`;
          result.fixable = false;
        }
      }

      if (result.issue) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Diagnoses all activities to find Object Storage issues
   */
  async diagnoseActivities(): Promise<DiagnosticResult[]> {
    const activities = await storage.getAllLegislativeActivities();
    const results: DiagnosticResult[] = [];

    for (const activity of activities) {
      if (!activity.filePath) {
        // Activity without file is OK
        continue;
      }

      const result: DiagnosticResult = {
        entityType: 'activity',
        entityId: activity.id,
        expectedPath: activity.filePath,
        exists: false,
        issue: null,
        fixable: false
      };

      try {
        if (activity.filePath.startsWith('/objects/')) {
          // Check Object Storage file
          const objectFile = await this.objectStorage.getObjectEntityFile(activity.filePath);
          const [exists] = await objectFile.exists();
          result.exists = exists;
          
          if (!exists) {
            result.issue = 'Object Storage file not found';
            result.fixable = false; // Cannot recover lost files
          }
        } else {
          // Legacy local file
          result.issue = 'Using legacy local storage path';
          result.fixable = true; // Could migrate to Object Storage
        }
      } catch (error: any) {
        if (error instanceof ObjectNotFoundError) {
          result.issue = 'Object Storage path invalid or file missing';
          result.fixable = false;
        } else {
          result.issue = `Error checking file: ${error?.message || "Unknown error"}`;
          result.fixable = false;
        }
      }

      if (result.issue) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Cleans up database references to missing files
   */
  async cleanupMissingReferences(dryRun: boolean = true): Promise<{
    documentsCleanedUp: number;
    activitiesCleanedUp: number;
    changes: string[];
  }> {
    const changes: string[] = [];
    let documentsCleanedUp = 0;
    let activitiesCleanedUp = 0;

    // Diagnose issues
    const documentIssues = await this.diagnoseDocuments();
    const activityIssues = await this.diagnoseActivities();

    // Process documents
    for (const issue of documentIssues) {
      if (!issue.exists && issue.expectedPath.startsWith('/objects/')) {
        const change = `Document ${issue.entityId}: Remove reference to missing file ${issue.expectedPath}`;
        changes.push(change);
        
        if (!dryRun) {
          await storage.updateDocument(issue.entityId, {
            filePath: null,
            fileName: null,
            fileType: null
          });
          documentsCleanedUp++;
        }
      }
    }

    // Process activities
    for (const issue of activityIssues) {
      if (!issue.exists && issue.expectedPath.startsWith('/objects/')) {
        const change = `Activity ${issue.entityId}: Remove reference to missing file ${issue.expectedPath}`;
        changes.push(change);
        
        if (!dryRun) {
          await storage.updateLegislativeActivity(issue.entityId, {
            filePath: null,
            fileName: null,
            fileType: null
          });
          activitiesCleanedUp++;
        }
      }
    }

    return {
      documentsCleanedUp,
      activitiesCleanedUp,
      changes
    };
  }

  /**
   * Gets a comprehensive report of Object Storage health
   */
  async getHealthReport(): Promise<{
    totalDocuments: number;
    totalActivities: number;
    documentsWithFiles: number;
    activitiesWithFiles: number;
    objectStorageFiles: number;
    legacyFiles: number;
    missingFiles: number;
    issues: DiagnosticResult[];
  }> {
    const documentIssues = await this.diagnoseDocuments();
    const activityIssues = await this.diagnoseActivities();
    const allIssues = [...documentIssues, ...activityIssues];

    const documents = await storage.getAllDocuments();
    const activities = await storage.getAllLegislativeActivities();

    const documentsWithFiles = documents.filter(d => d.filePath).length;
    const activitiesWithFiles = activities.filter(a => a.filePath).length;

    const objectStorageFiles = [...documents, ...activities]
      .filter(item => item.filePath?.startsWith('/objects/'))
      .length;

    const legacyFiles = [...documents, ...activities]
      .filter(item => item.filePath && !item.filePath.startsWith('/objects/'))
      .length;

    const missingFiles = allIssues.filter(issue => !issue.exists).length;

    return {
      totalDocuments: documents.length,
      totalActivities: activities.length,
      documentsWithFiles,
      activitiesWithFiles,
      objectStorageFiles,
      legacyFiles,
      missingFiles,
      issues: allIssues
    };
  }
}