import {
  users,
  legislatures,
  events,
  legislativeActivities,
  legislativeActivitiesAuthors,
  documents,
  documentVotes,
  eventAttendance,
  activityTimeline,
  type User,
  type Legislature,
  type Event,
  type LegislativeActivity,
  type Document,
  type DocumentVote,
  type EventAttendance,
  type ActivityTimeline
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, isNull, isNotNull, lte, gte, like, inArray, notInArray, or } from "drizzle-orm";
import crypto from "crypto";

// Interface for storage operations
export type SearchResult = {
  id: string | number;
  title: string;
  description?: string;
  type: 'user' | 'legislature' | 'event' | 'activity' | 'document';
  date?: string;
  status?: string;
  category?: string;
  url: string;
  highlight?: string;
};

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
  
  // Event Attendance operations
  getEventAttendance(id: number): Promise<EventAttendance | undefined>;
  getEventAttendanceByEventId(eventId: number): Promise<EventAttendance[]>;
  createEventAttendance(attendanceData: Partial<EventAttendance>): Promise<EventAttendance>;
  updateEventAttendance(id: number, attendanceData: Partial<EventAttendance>): Promise<EventAttendance | undefined>;
  deleteEventAttendance(id: number): Promise<boolean>;
  
  // Document Votes operations
  getDocumentVote(id: number): Promise<DocumentVote | undefined>;
  getDocumentVotesByDocumentId(documentId: number): Promise<DocumentVote[]>;
  getDocumentVoteByUserAndDocument(userId: string, documentId: number): Promise<DocumentVote | undefined>;
  createDocumentVote(voteData: Partial<DocumentVote>): Promise<DocumentVote>;
  updateDocumentVote(id: number, voteData: Partial<DocumentVote>): Promise<DocumentVote | undefined>;
  deleteDocumentVote(id: number): Promise<boolean>;
  
  // Activity Timeline operations
  getActivityTimeline(id: number): Promise<ActivityTimeline | undefined>;
  getActivityTimelineByActivityId(activityId: number): Promise<ActivityTimeline[]>;
  createActivityTimeline(timelineData: Partial<ActivityTimeline>): Promise<ActivityTimeline>;
  
  // Extended Event operations
  getEventWithDetails(id: number): Promise<Event & {
    activities: LegislativeActivity[];
    attendance: EventAttendance[];
    documents: Document[];
    legislature: Legislature;
  } | undefined>;
  
  // Get all councilors
  getCouncilors(): Promise<User[]>;
  
  // Search operations
  searchGlobal(query: string, type?: string): Promise<SearchResult[]>;
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

  /**
   * Event Attendance operations
   */
  async getEventAttendance(id: number): Promise<EventAttendance | undefined> {
    const [attendance] = await db.select().from(eventAttendance).where(eq(eventAttendance.id, id));
    return attendance;
  }
  
  async getEventAttendanceByEventId(eventId: number): Promise<EventAttendance[]> {
    const attendanceRecords = await db
      .select({
        attendance: eventAttendance,
        user: users,
      })
      .from(eventAttendance)
      .leftJoin(users, eq(eventAttendance.userId, users.id))
      .where(eq(eventAttendance.eventId, eventId));
      
    return attendanceRecords.map(record => ({
      ...record.attendance,
      user: record.user,
    })) as EventAttendance[];
  }
  
  async createEventAttendance(attendanceData: Partial<EventAttendance>): Promise<EventAttendance> {
    const [newAttendance] = await db.insert(eventAttendance).values(attendanceData).returning();
    return newAttendance;
  }
  
  async updateEventAttendance(id: number, attendanceData: Partial<EventAttendance>): Promise<EventAttendance | undefined> {
    const [updatedAttendance] = await db
      .update(eventAttendance)
      .set({
        ...attendanceData,
        updatedAt: new Date(),
      })
      .where(eq(eventAttendance.id, id))
      .returning();
      
    return updatedAttendance;
  }
  
  async deleteEventAttendance(id: number): Promise<boolean> {
    const result = await db.delete(eventAttendance).where(eq(eventAttendance.id, id));
    return !!result;
  }
  
  /**
   * Document Votes operations
   */
  async getDocumentVote(id: number): Promise<DocumentVote | undefined> {
    const [vote] = await db.select().from(documentVotes).where(eq(documentVotes.id, id));
    return vote;
  }
  
  async getDocumentVotesByDocumentId(documentId: number): Promise<DocumentVote[]> {
    const votes = await db
      .select({
        vote: documentVotes,
        user: users,
      })
      .from(documentVotes)
      .leftJoin(users, eq(documentVotes.userId, users.id))
      .where(eq(documentVotes.documentId, documentId));
      
    return votes.map(record => ({
      ...record.vote,
      user: record.user,
    })) as DocumentVote[];
  }
  
  async getDocumentVoteByUserAndDocument(userId: string, documentId: number): Promise<DocumentVote | undefined> {
    const [vote] = await db
      .select()
      .from(documentVotes)
      .where(
        and(
          eq(documentVotes.userId, userId),
          eq(documentVotes.documentId, documentId)
        )
      );
      
    return vote;
  }
  
  async createDocumentVote(voteData: Partial<DocumentVote>): Promise<DocumentVote> {
    // Check if user already voted on this document
    const existingVote = await this.getDocumentVoteByUserAndDocument(
      voteData.userId as string, 
      voteData.documentId as number
    );
    
    if (existingVote) {
      // Update existing vote instead of creating a new one
      const [updatedVote] = await db
        .update(documentVotes)
        .set({
          vote: voteData.vote,
          comment: voteData.comment,
          votedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(documentVotes.id, existingVote.id))
        .returning();
        
      return updatedVote;
    }
    
    // Create new vote
    const [newVote] = await db.insert(documentVotes).values(voteData).returning();
    return newVote;
  }
  
  async updateDocumentVote(id: number, voteData: Partial<DocumentVote>): Promise<DocumentVote | undefined> {
    const [updatedVote] = await db
      .update(documentVotes)
      .set({
        ...voteData,
        updatedAt: new Date(),
      })
      .where(eq(documentVotes.id, id))
      .returning();
      
    return updatedVote;
  }
  
  async deleteDocumentVote(id: number): Promise<boolean> {
    const result = await db.delete(documentVotes).where(eq(documentVotes.id, id));
    return !!result;
  }
  
  /**
   * Activity Timeline operations
   */
  async getActivityTimeline(id: number): Promise<ActivityTimeline | undefined> {
    const [timelineEvent] = await db.select().from(activityTimeline).where(eq(activityTimeline.id, id));
    return timelineEvent;
  }
  
  async getActivityTimelineByActivityId(activityId: number): Promise<ActivityTimeline[]> {
    const timeline = await db
      .select({
        timelineEvent: activityTimeline,
        user: users,
      })
      .from(activityTimeline)
      .leftJoin(users, eq(activityTimeline.createdBy, users.id))
      .where(eq(activityTimeline.activityId, activityId))
      .orderBy(desc(activityTimeline.eventDate));
      
    return timeline.map(record => ({
      ...record.timelineEvent,
      user: record.user,
    })) as ActivityTimeline[];
  }
  
  async createActivityTimeline(timelineData: Partial<ActivityTimeline>): Promise<ActivityTimeline> {
    const [newTimelineEvent] = await db.insert(activityTimeline).values(timelineData).returning();
    return newTimelineEvent;
  }
  
  /**
   * Extended Event operations
   */
  async getEventWithDetails(id: number): Promise<Event & {
    activities: LegislativeActivity[];
    attendance: EventAttendance[];
    documents: Document[];
    legislature: Legislature;
  } | undefined> {
    try {
      console.log("Getting event details for ID:", id);
      
      // Abordagem com SQL bruto para garantir compatibilidade
      // Busca o evento
      const eventQuery = db.select({
        id: events.id,
        eventNumber: events.eventNumber,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        location: events.location,
        mapUrl: events.mapUrl,
        category: events.category,
        description: events.description,
        status: events.status,
        legislatureId: events.legislatureId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        legislature_id: legislatures.id,
        legislature_number: legislatures.number,
        start_date: legislatures.startDate,
        end_date: legislatures.endDate
      })
      .from(events)
      .innerJoin(legislatures, eq(events.legislatureId, legislatures.id))
      .where(eq(events.id, id));
      
      const eventResult = await eventQuery;
      console.log("Event query result:", eventResult[0] ? "Found" : "Not found");
      
      if (!eventResult.length) {
        console.log("Event not found with ID:", id);
        return undefined;
      }
      
      // Extrair evento e legislature
      const eventData = eventResult[0];
      const event = {
        id: eventData.id,
        eventNumber: eventData.eventNumber,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime,
        location: eventData.location,
        mapUrl: eventData.mapUrl,
        category: eventData.category,
        description: eventData.description,
        status: eventData.status,
        legislatureId: eventData.legislatureId,
        createdAt: eventData.createdAt,
        updatedAt: eventData.updatedAt
      };
      
      const legislature = {
        id: eventData.legislature_id,
        number: eventData.legislature_number,
        startDate: eventData.start_date,
        endDate: eventData.end_date,
        createdAt: null,
        updatedAt: null
      };
      
      console.log("Event data processed successfully");
      
      // Buscar atividades do evento
      const activitiesResult = await db
        .select()
        .from(legislativeActivities)
        .where(eq(legislativeActivities.eventId, id))
        .orderBy(desc(legislativeActivities.activityDate));
      console.log(`Found ${activitiesResult.length} activities for event`);
      
      // Buscar atendimentos do evento
      const attendanceResult = await this.getEventAttendanceByEventId(id);
      console.log(`Found ${attendanceResult.length} attendance records`);
      
      // Buscar documentos do evento
      let documentsResult = [];
      try {
        documentsResult = await db
          .select()
          .from(documents)
          .where(eq(documents.eventId, id));
        console.log(`Found ${documentsResult.length} documents`);
      } catch (error) {
        console.error("Error fetching documents:", error);
        documentsResult = [];
      }
      
      // Processar atividades e autores
      const activitiesWithAuthors = await Promise.all(
        activitiesResult.map(async (activity) => {
          try {
            // Buscar autores usando Drizzle
            const authorsResult = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                profileImageUrl: users.profileImageUrl,
                active: users.active,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt
              })
              .from(users)
              .innerJoin(
                legislativeActivitiesAuthors,
                eq(users.id, legislativeActivitiesAuthors.userId)
              )
              .where(eq(legislativeActivitiesAuthors.activityId, activity.id));
            
            // Adiciona os autores à atividade
            activity.authors = authorsResult;
            
            return activity;
          } catch (error) {
            console.error(`Error fetching authors for activity ${activity.id}:`, error);
            activity.authors = [];
            return activity;
          }
        })
      );
      
      console.log("Successfully processed event details");
      
      // Construir e retornar o resultado completo
      return {
        ...event,
        legislature,
        activities: activitiesWithAuthors,
        attendance: attendanceResult,
        documents: documentsResult,
      };
    } catch (error) {
      console.error("Error in getEventWithDetails:", error);
      throw error;
    }
  }
  
  /**
   * Get all councilors
   */
  async getCouncilors(): Promise<User[]> {
    const councilors = await db.select().from(users).where(eq(users.role, "councilor"));
    return councilors;
  }
  
  /**
   * Search across all entities
   */
  async searchGlobal(query: string, type?: string): Promise<SearchResult[]> {
    if (!query || query.length < 3) {
      return [];
    }
    
    // Prepare search term for LIKE queries
    const searchTerm = `%${query.toLowerCase()}%`;
    const results: SearchResult[] = [];
    
    // Function to find matches and highlight them
    const findHighlight = (text: string | null) => {
      if (!text) return undefined;
      
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerText.indexOf(lowerQuery);
      
      if (index === -1) return undefined;
      
      // Get a slice of text around the match
      const start = Math.max(0, index - 20);
      const end = Math.min(text.length, index + query.length + 20);
      return text.slice(start, end);
    };
    
    // Search users if not filtering by type or type is 'user'
    if (!type || type === 'all' || type === 'user') {
      const userResults = await db
        .select()
        .from(users)
        .where(
          or(
            like(sql`LOWER(${users.name})`, searchTerm),
            like(sql`LOWER(${users.email})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...userResults.map(user => ({
          id: user.id,
          title: user.name,
          description: user.email,
          type: 'user',
          status: user.active ? 'ativo' : 'inativo',
          url: `/users/${user.id}`,
          highlight: findHighlight(user.name),
        }))
      );
    }
    
    // Search legislatures if not filtering by type or type is 'legislature'
    if (!type || type === 'all' || type === 'legislature') {
      const legislatureResults = await db
        .select()
        .from(legislatures)
        .where(
          or(
            like(sql`LOWER(${legislatures.name})`, searchTerm),
            like(sql`LOWER(${legislatures.description})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...legislatureResults.map(legislature => ({
          id: legislature.id,
          title: legislature.name,
          description: legislature.description,
          type: 'legislature',
          date: legislature.startDate?.toISOString(),
          status: new Date() >= new Date(legislature.startDate) && 
                 new Date() <= new Date(legislature.endDate) ? 'ativo' : 'inativo',
          url: `/legislatures/${legislature.id}`,
          highlight: findHighlight(legislature.description),
        }))
      );
    }
    
    // Search events if not filtering by type or type is 'event'
    if (!type || type === 'all' || type === 'event') {
      const eventResults = await db
        .select()
        .from(events)
        .where(
          or(
            like(sql`LOWER(${events.category})`, searchTerm),
            like(sql`LOWER(${events.description})`, searchTerm),
            like(sql`LOWER(${events.location})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...eventResults.map(event => ({
          id: event.id,
          title: `${event.category} #${event.eventNumber}`,
          description: event.description,
          type: 'event',
          date: event.eventDate?.toISOString(),
          status: event.status,
          category: event.category,
          url: `/events/${event.id}`,
          highlight: findHighlight(event.description),
        }))
      );
    }
    
    // Search legislative activities if not filtering by type or type is 'activity'
    if (!type || type === 'all' || type === 'activity') {
      const activityResults = await db
        .select()
        .from(legislativeActivities)
        .where(
          or(
            like(sql`LOWER(${legislativeActivities.activityType})`, searchTerm),
            like(sql`LOWER(${legislativeActivities.description})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...activityResults.map(activity => ({
          id: activity.id,
          title: `${activity.activityType} #${activity.activityNumber}`,
          description: activity.description,
          type: 'activity',
          date: activity.activityDate?.toISOString(),
          status: activity.needsApproval ? 'pendente' : (activity.approved ? 'aprovado' : 'rejeitado'),
          category: activity.activityType,
          url: `/activities/${activity.id}`,
          highlight: findHighlight(activity.description),
        }))
      );
    }
    
    // Search documents if not filtering by type or type is 'document'
    if (!type || type === 'all' || type === 'document') {
      const documentResults = await db
        .select()
        .from(documents)
        .where(
          or(
            like(sql`LOWER(${documents.title})`, searchTerm),
            like(sql`LOWER(${documents.description})`, searchTerm),
            like(sql`LOWER(${documents.content})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...documentResults.map(document => ({
          id: document.id,
          title: document.title,
          description: document.description,
          type: 'document',
          date: document.createdAt?.toISOString(),
          status: document.status,
          url: `/documents/${document.id}`,
          highlight: findHighlight(document.content) || findHighlight(document.description),
        }))
      );
    }
    
    // Sort by relevance (prioritize title matches)
    return results.sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(query.toLowerCase());
      const bTitleMatch = b.title.toLowerCase().includes(query.toLowerCase());
      
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // If both match or don't match in title, sort by date (newer first)
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      return 0;
    });
  }
}

export const storage = new DatabaseStorage();
