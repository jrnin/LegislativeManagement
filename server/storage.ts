import {
  users,
  legislatures,
  events,
  legislativeActivities,
  legislativeActivitiesAuthors,
  documents,
  type User,
  type Legislature,
  type Event,
  type LegislativeActivity,
  type Document
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, isNull, isNotNull, lte, gte, like } from "drizzle-orm";
import crypto from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  upsertUser(userData: Partial<User>): Promise<User>;
  verifyEmail(token: string): Promise<boolean>;
  
  // Legislature operations
  getLegislature(id: number): Promise<Legislature | undefined>;
  getAllLegislatures(): Promise<Legislature[]>;
  createLegislature(legislatureData: Partial<Legislature>): Promise<Legislature>;
  updateLegislature(id: number, legislatureData: Partial<Legislature>): Promise<Legislature | undefined>;
  deleteLegislature(id: number): Promise<boolean>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  createEvent(eventData: Partial<Event>): Promise<Event>;
  updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Legislative Activity operations
  getLegislativeActivity(id: number): Promise<LegislativeActivity | undefined>;
  getAllLegislativeActivities(): Promise<LegislativeActivity[]>;
  getRecentLegislativeActivities(limit?: number): Promise<LegislativeActivity[]>;
  createLegislativeActivity(activityData: Partial<LegislativeActivity>, authorIds: string[]): Promise<LegislativeActivity>;
  updateLegislativeActivity(id: number, activityData: Partial<LegislativeActivity>, authorIds?: string[]): Promise<LegislativeActivity | undefined>;
  deleteLegislativeActivity(id: number): Promise<boolean>;
  
  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentHistory(id: number): Promise<Document[]>;
  createDocument(documentData: Partial<Document>): Promise<Document>;
  updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Dashboard operations
  getDashboardStats(): Promise<{
    legislatureCount: number;
    activeEventCount: number;
    pendingActivityCount: number;
    documentCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  /**
   * User operations
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }
  
  async createUser(userData: Partial<User>): Promise<User> {
    // Generate a verification token if needed
    if (!userData.emailVerified) {
      userData.verificationToken = crypto.randomBytes(32).toString('hex');
      userData.emailVerificationSentAt = new Date();
    }
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }
  
  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    
    return true;
  }
  
  async upsertUser(userData: Partial<User>): Promise<User> {
    // If user doesn't exist, create
    if (!userData.id) {
      return this.createUser(userData);
    }
    
    const existingUser = await this.getUser(userData.id);
    
    if (!existingUser) {
      // Create new user
      return this.createUser({
        ...userData,
        emailVerified: true, // Users from OAuth are already verified
      });
    } else {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      
      return user;
    }
  }
  
  async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
    
    if (!user) {
      return false;
    }
    
    // Update user to verified status
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    return true;
  }
  
  /**
   * Legislature operations
   */
  async getLegislature(id: number): Promise<Legislature | undefined> {
    const [legislature] = await db.select().from(legislatures).where(eq(legislatures.id, id));
    return legislature;
  }
  
  async getAllLegislatures(): Promise<Legislature[]> {
    return await db.select().from(legislatures).orderBy(desc(legislatures.number));
  }
  
  async createLegislature(legislatureData: Partial<Legislature>): Promise<Legislature> {
    const [legislature] = await db.insert(legislatures).values(legislatureData).returning();
    return legislature;
  }
  
  async updateLegislature(id: number, legislatureData: Partial<Legislature>): Promise<Legislature | undefined> {
    const [legislature] = await db
      .update(legislatures)
      .set({
        ...legislatureData,
        updatedAt: new Date(),
      })
      .where(eq(legislatures.id, id))
      .returning();
    
    return legislature;
  }
  
  async deleteLegislature(id: number): Promise<boolean> {
    const result = await db
      .delete(legislatures)
      .where(eq(legislatures.id, id));
    
    return true;
  }
  
  /**
   * Event operations
   */
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }
  
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }
  
  async getUpcomingEvents(limit: number = 3): Promise<Event[]> {
    // Get events with date >= today, ordered by date, limited
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(events)
      .where(gte(events.eventDate, today))
      .orderBy(events.eventDate)
      .limit(limit);
  }
  
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }
  
  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    
    return event;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(eq(events.id, id));
    
    return true;
  }
  
  /**
   * Legislative Activity operations
   */
  async getLegislativeActivity(id: number): Promise<LegislativeActivity | undefined> {
    const [activity] = await db.select().from(legislativeActivities).where(eq(legislativeActivities.id, id));
    
    if (!activity) {
      return undefined;
    }
    
    // Get authors
    const authors = await db
      .select({
        user: users
      })
      .from(legislativeActivitiesAuthors)
      .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
      .where(eq(legislativeActivitiesAuthors.activityId, id));
    
    // Return activity with authors
    return {
      ...activity,
      authors: authors.map(a => a.user)
    };
  }
  
  async getAllLegislativeActivities(): Promise<LegislativeActivity[]> {
    const activities = await db.select().from(legislativeActivities).orderBy(desc(legislativeActivities.activityDate));
    
    // For each activity, get the authors
    const result: LegislativeActivity[] = [];
    
    for (const activity of activities) {
      const authors = await db
        .select({
          user: users
        })
        .from(legislativeActivitiesAuthors)
        .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
        .where(eq(legislativeActivitiesAuthors.activityId, activity.id));
      
      result.push({
        ...activity,
        authors: authors.map(a => a.user)
      });
    }
    
    return result;
  }
  
  async getRecentLegislativeActivities(limit: number = 3): Promise<LegislativeActivity[]> {
    const activities = await db
      .select()
      .from(legislativeActivities)
      .orderBy(desc(legislativeActivities.createdAt))
      .limit(limit);
    
    // For each activity, get the authors
    const result: LegislativeActivity[] = [];
    
    for (const activity of activities) {
      const authors = await db
        .select({
          user: users
        })
        .from(legislativeActivitiesAuthors)
        .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
        .where(eq(legislativeActivitiesAuthors.activityId, activity.id));
      
      result.push({
        ...activity,
        authors: authors.map(a => a.user)
      });
    }
    
    return result;
  }
  
  async createLegislativeActivity(activityData: Partial<LegislativeActivity>, authorIds: string[]): Promise<LegislativeActivity> {
    // First, create the activity
    const [activity] = await db.insert(legislativeActivities).values(activityData).returning();
    
    // Then, add authors
    if (authorIds && authorIds.length > 0) {
      const authorEntries = authorIds.map(userId => ({
        activityId: activity.id,
        userId,
      }));
      
      await db.insert(legislativeActivitiesAuthors).values(authorEntries);
    }
    
    // Get authors to return complete activity
    const authors = await db
      .select({
        user: users
      })
      .from(legislativeActivitiesAuthors)
      .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
      .where(eq(legislativeActivitiesAuthors.activityId, activity.id));
    
    return {
      ...activity,
      authors: authors.map(a => a.user)
    };
  }
  
  async updateLegislativeActivity(id: number, activityData: Partial<LegislativeActivity>, authorIds?: string[]): Promise<LegislativeActivity | undefined> {
    // First, update the activity
    const [activity] = await db
      .update(legislativeActivities)
      .set({
        ...activityData,
        updatedAt: new Date(),
      })
      .where(eq(legislativeActivities.id, id))
      .returning();
    
    if (!activity) {
      return undefined;
    }
    
    // If authorIds are provided, update the authors
    if (authorIds !== undefined) {
      // Remove existing authors
      await db
        .delete(legislativeActivitiesAuthors)
        .where(eq(legislativeActivitiesAuthors.activityId, id));
      
      // Add new authors
      if (authorIds.length > 0) {
        const authorEntries = authorIds.map(userId => ({
          activityId: id,
          userId,
        }));
        
        await db.insert(legislativeActivitiesAuthors).values(authorEntries);
      }
    }
    
    // Get updated authors
    const authors = await db
      .select({
        user: users
      })
      .from(legislativeActivitiesAuthors)
      .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
      .where(eq(legislativeActivitiesAuthors.activityId, id));
    
    return {
      ...activity,
      authors: authors.map(a => a.user)
    };
  }
  
  async deleteLegislativeActivity(id: number): Promise<boolean> {
    // First, remove authors
    await db
      .delete(legislativeActivitiesAuthors)
      .where(eq(legislativeActivitiesAuthors.activityId, id));
    
    // Then, remove activity
    await db
      .delete(legislativeActivities)
      .where(eq(legislativeActivities.id, id));
    
    return true;
  }
  
  /**
   * Document operations
   */
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.documentDate));
  }
  
  async getDocumentHistory(id: number): Promise<Document[]> {
    // Get the main document
    const mainDoc = await this.getDocument(id);
    
    if (!mainDoc) {
      return [];
    }
    
    // If document has a parent, start from the parent
    const rootDocId = mainDoc.parentDocumentId || mainDoc.id;
    
    // Get all documents in the hierarchy (parent and all children)
    return await db
      .select()
      .from(documents)
      .where(
        sql`${documents.id} = ${rootDocId} OR ${documents.parentDocumentId} = ${rootDocId}`
      )
      .orderBy(documents.createdAt);
  }
  
  async createDocument(documentData: Partial<Document>): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }
  
  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({
        ...documentData,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    
    return document;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(eq(documents.id, id));
    
    return true;
  }
  
  /**
   * Dashboard operations
   */
  async getDashboardStats(): Promise<{
    legislatureCount: number;
    activeEventCount: number;
    pendingActivityCount: number;
    documentCount: number;
  }> {
    // Get legislature count
    const [{ count: legislatureCount }] = await db
      .select({ count: count() })
      .from(legislatures);
    
    // Get active event count
    const [{ count: activeEventCount }] = await db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.status, "Aberto"),
          gte(events.eventDate, new Date())
        )
      );
    
    // Get pending activity count
    const [{ count: pendingActivityCount }] = await db
      .select({ count: count() })
      .from(legislativeActivities)
      .where(
        and(
          eq(legislativeActivities.needsApproval, true),
          eq(legislativeActivities.approved, false)
        )
      );
    
    // Get document count
    const [{ count: documentCount }] = await db
      .select({ count: count() })
      .from(documents);
    
    return {
      legislatureCount,
      activeEventCount,
      pendingActivityCount,
      documentCount
    };
  }
}

export const storage = new DatabaseStorage();
