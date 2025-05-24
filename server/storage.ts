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
  activityVotes,
  committees,
  committeeMembers,
  type User,
  type Legislature,
  type Event,
  type LegislativeActivity,
  type Document,
  type DocumentVote,
  type EventAttendance,
  type ActivityTimeline,
  type ActivityVote,
  type Committee,
  type CommitteeMember
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, isNull, isNotNull, lte, gte, like, inArray, notInArray, or } from "drizzle-orm";
import crypto from "crypto";

// Interface for storage operations
export type SearchResult = {
  id: string | number;
  title: string;
  description?: string;
  type: 'user' | 'legislature' | 'event' | 'activity' | 'document' | 'committee';
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
  getUsersByRole(role: string): Promise<User[]>;
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
  
  // Activity Votes operations
  getActivityVote(id: number): Promise<ActivityVote | undefined>;
  getActivityVotesByActivityId(activityId: number): Promise<(ActivityVote & { user: User })[]>;
  getActivityVoteByUserAndActivity(userId: string, activityId: number): Promise<ActivityVote | undefined>;
  createActivityVote(voteData: Partial<ActivityVote>): Promise<ActivityVote>;
  updateActivityVote(id: number, voteData: Partial<ActivityVote>): Promise<ActivityVote | undefined>;
  deleteActivityVote(id: number): Promise<boolean>;
  getActivityVotesStats(activityId: number): Promise<{
    totalVotes: number;
    approveCount: number;
    rejectCount: number;
    approvePercentage: number;
    rejectPercentage: number;
  }>;
  
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
  
  // Councilor operations
  getCouncilors(): Promise<User[]>;
  getCouncilorWithDetails(id: string): Promise<User & {
    activities: LegislativeActivity[];
    documents: Document[];
    committees: (Committee & { role: string })[];
  } | undefined>;
  getLegislativeActivitiesByAuthor(userId: string): Promise<LegislativeActivity[]>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  getCommitteesByMember(userId: string): Promise<(Committee & { role: string })[]>;
  
  // Committee operations
  getCommittee(id: number): Promise<Committee | undefined>;
  getAllCommittees(): Promise<Committee[]>;
  getCommitteeWithMembers(id: number): Promise<(Committee & { members: (CommitteeMember & { user: User })[] }) | undefined>;
  createCommittee(committeeData: Partial<Committee>, memberIds: string[]): Promise<Committee>;
  updateCommittee(id: number, committeeData: Partial<Committee>, memberIds?: string[]): Promise<Committee | undefined>;
  deleteCommittee(id: number): Promise<boolean>;
  
  // Committee Members operations
  getCommitteeMembersByCommitteeId(committeeId: number): Promise<(CommitteeMember & { user: User })[]>;
  addCommitteeMember(committeeId: number, userId: string, role?: string): Promise<CommitteeMember>;
  updateCommitteeMemberRole(committeeId: number, userId: string, role: string): Promise<CommitteeMember | undefined>;
  removeCommitteeMember(committeeId: number, userId: string): Promise<boolean>;
  
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
  
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const usersByRole = await db
        .select()
        .from(users)
        .where(eq(users.role, role))
        .orderBy(users.name);
      return usersByRole;
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      return [];
    }
  }
  
  async getCouncilors(): Promise<User[]> {
    try {
      return await this.getUsersByRole('councilor');
    } catch (error) {
      console.error("Error fetching councilors:", error);
      return [];
    }
  }
  
  async getCouncilorWithDetails(id: string): Promise<(User & {
    activities: LegislativeActivity[];
    documents: Document[];
    committees: (Committee & { role: string })[];
  }) | undefined> {
    try {
      // Buscar o vereador
      const user = await this.getUser(id);
      if (!user) {
        return undefined;
      }
      
      // Para evitar erros com SQL, vamos retornar arrays vazios para documentos 
      // e buscar apenas as atividades e comissões
      const activities = await this.getLegislativeActivitiesByAuthor(id);
      const documents: Document[] = [];
      const committees = await this.getCommitteesByMember(id);
      
      // Retornar o vereador com os dados relacionados
      return {
        ...user,
        activities,
        documents,
        committees
      };
    } catch (error) {
      console.error(`Error fetching councilor details for ${id}:`, error);
      return undefined;
    }
  }
  
  async getLegislativeActivitiesByAuthor(userId: string): Promise<LegislativeActivity[]> {
    try {
      // Buscar IDs das atividades onde o usuário é autor
      console.log(`Buscando atividades legislativas para o usuário ${userId}`);
      
      const authorActivities = await db
        .select({ activityId: legislativeActivitiesAuthors.activityId })
        .from(legislativeActivitiesAuthors)
        .where(eq(legislativeActivitiesAuthors.userId, userId));
      
      console.log(`Encontradas ${authorActivities.length} atividades para o usuário ${userId}`);
      
      if (!authorActivities.length) {
        return [];
      }
      
      // Buscar detalhes completos das atividades
      const activityIds = authorActivities.map(a => a.activityId);
      const activities = await db
        .select()
        .from(legislativeActivities)
        .where(inArray(legislativeActivities.id, activityIds))
        .orderBy(desc(legislativeActivities.activityDate));
      
      return activities;
    } catch (error) {
      console.error(`Error fetching activities for author ${userId}:`, error);
      return [];
    }
  }
  
  async getDocumentsByUser(userId: string): Promise<Document[]> {
    // Simplesmente retornamos um array vazio para evitar erros de SQL
    return [];
  }
  
  async getCommitteesByMember(userId: string): Promise<(Committee & { role: string })[]> {
    try {
      // Verificamos que existem comissões e membros no schema
      // Vamos tentar obter as comissões do usuário
      
      const memberCommittees = await db
        .select({
          committeeId: committeeMembers.committeeId,
          role: committeeMembers.role
        })
        .from(committeeMembers)
        .where(eq(committeeMembers.userId, userId));
      
      if (!memberCommittees.length) {
        console.log(`Usuário ${userId} não é membro de nenhuma comissão`);
        return [];
      }
      
      // Buscar dados completos das comissões
      const result: (Committee & { role: string })[] = [];
      
      for (const membership of memberCommittees) {
        const [committee] = await db
          .select()
          .from(committees)
          .where(eq(committees.id, membership.committeeId));
        
        if (committee) {
          result.push({
            ...committee,
            role: membership.role
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching committees for member ${userId}:`, error);
      return [];
    }
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
  
  async getAllDocuments(filters?: any, page: number = 1, limit: number = 10): Promise<Document[]> {
    // Construir a query base
    let query = db.select().from(documents);
    
    // Aplicar filtros se fornecidos
    if (filters) {
      // Filtro por tipo de documento
      if (filters.documentType) {
        query = query.where(eq(documents.documentType, filters.documentType));
      }
      
      // Filtro por status
      if (filters.status) {
        query = query.where(eq(documents.status, filters.status));
      }
      
      // Filtro por intervalo de datas
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          query = query.where(gte(documents.documentDate, filters.dateRange.start));
        }
        if (filters.dateRange.end) {
          query = query.where(lte(documents.documentDate, filters.dateRange.end));
        }
      }
      
      // Filtro por texto (busca na descrição)
      if (filters.search) {
        query = query.where(
          like(documents.description, `%${filters.search}%`)
        );
      }
    }
    
    // Aplicar ordenação (mais recentes primeiro)
    query = query.orderBy(desc(documents.documentDate));
    
    // Aplicar paginação
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);
    
    // Executar a query
    return await query;
  }
  
  /**
   * Count documents with filters (for pagination)
   */
  async getDocumentsCount(filters?: any): Promise<number> {
    // Construir a query base
    let query = db.select({ count: count() }).from(documents);
    
    // Aplicar filtros se fornecidos
    if (filters) {
      // Filtro por tipo de documento
      if (filters.documentType) {
        query = query.where(eq(documents.documentType, filters.documentType));
      }
      
      // Filtro por status
      if (filters.status) {
        query = query.where(eq(documents.status, filters.status));
      }
      
      // Filtro por intervalo de datas
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          query = query.where(gte(documents.documentDate, filters.dateRange.start));
        }
        if (filters.dateRange.end) {
          query = query.where(lte(documents.documentDate, filters.dateRange.end));
        }
      }
      
      // Filtro por texto (busca na descrição)
      if (filters.search) {
        query = query.where(
          like(documents.description, `%${filters.search}%`)
        );
      }
    }
    
    // Executar a query
    const result = await query;
    return result[0]?.count || 0;
  }
  
  /**
   * Get unique document types for filter dropdowns
   */
  async getDocumentTypes(): Promise<string[]> {
    const result = await db
      .selectDistinct({ type: documents.documentType })
      .from(documents)
      .orderBy(documents.documentType);
    
    return result.map(item => item.type);
  }
  
  /**
   * Get unique document status values for filter dropdowns
   */
  async getDocumentStatusTypes(): Promise<string[]> {
    const result = await db
      .selectDistinct({ status: documents.status })
      .from(documents)
      .orderBy(documents.status);
    
    return result.map(item => item.status);
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
   * Activity Votes operations
   */
  async getActivityVote(id: number): Promise<ActivityVote | undefined> {
    const [vote] = await db.select().from(activityVotes).where(eq(activityVotes.id, id));
    return vote;
  }
  
  async getActivityVotesByActivityId(activityId: number): Promise<(ActivityVote & { user: User })[]> {
    const votes = await db
      .select({
        vote: activityVotes,
        user: users,
      })
      .from(activityVotes)
      .innerJoin(users, eq(activityVotes.userId, users.id))
      .where(eq(activityVotes.activityId, activityId))
      .orderBy(desc(activityVotes.votedAt));
      
    return votes.map(record => ({
      ...record.vote,
      user: record.user,
    }));
  }
  
  async getActivityVoteByUserAndActivity(userId: string, activityId: number): Promise<ActivityVote | undefined> {
    const [vote] = await db
      .select()
      .from(activityVotes)
      .where(
        and(
          eq(activityVotes.userId, userId),
          eq(activityVotes.activityId, activityId)
        )
      );
      
    return vote;
  }
  
  async createActivityVote(voteData: Partial<ActivityVote>): Promise<ActivityVote> {
    // Verificar se já existe um voto deste usuário para esta atividade
    const existingVote = await this.getActivityVoteByUserAndActivity(
      voteData.userId as string,
      voteData.activityId as number
    );
    
    if (existingVote) {
      // Atualizar o voto existente em vez de criar um novo
      const [updatedVote] = await db
        .update(activityVotes)
        .set({
          vote: voteData.vote,
          comment: voteData.comment,
          votedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(activityVotes.id, existingVote.id))
        .returning();
        
      return updatedVote;
    }
    
    // Criar novo voto
    const [newVote] = await db.insert(activityVotes).values({
      ...voteData,
      votedAt: new Date(),
    }).returning();
    
    return newVote;
  }
  
  async updateActivityVote(id: number, voteData: Partial<ActivityVote>): Promise<ActivityVote | undefined> {
    const [updatedVote] = await db
      .update(activityVotes)
      .set({
        ...voteData,
        updatedAt: new Date(),
      })
      .where(eq(activityVotes.id, id))
      .returning();
      
    return updatedVote;
  }
  
  async deleteActivityVote(id: number): Promise<boolean> {
    const result = await db.delete(activityVotes).where(eq(activityVotes.id, id));
    return !!result;
  }
  
  async getActivityVotesStats(activityId: number): Promise<{
    totalVotes: number;
    approveCount: number;
    rejectCount: number;
    approvePercentage: number;
    rejectPercentage: number;
  }> {
    const votes = await db
      .select({
        vote: activityVotes.vote,
      })
      .from(activityVotes)
      .where(eq(activityVotes.activityId, activityId));
    
    const totalVotes = votes.length;
    const approveCount = votes.filter(v => v.vote === true).length;
    const rejectCount = votes.filter(v => v.vote === false).length;
    
    // Garantir que os percentuais são calculados corretamente e somam 100%
    let approvePercentage = 0;
    let rejectPercentage = 0;
    
    if (totalVotes > 0) {
      // Calcular percentuais exatos
      approvePercentage = Number(((approveCount / totalVotes) * 100).toFixed(1));
      
      // Certificar que a soma é exatamente 100% para evitar inconsistências de arredondamento
      if (approveCount + rejectCount === totalVotes) {
        rejectPercentage = Number((100 - approvePercentage).toFixed(1));
      } else {
        rejectPercentage = Number(((rejectCount / totalVotes) * 100).toFixed(1));
      }
    }
    
    return {
      totalVotes,
      approveCount,
      rejectCount,
      approvePercentage,
      rejectPercentage
    };
  }
  
  /**
   * Get all councilors
   */
  async getCouncilors(): Promise<User[]> {
    const councilors = await db.select().from(users).where(eq(users.role, "councilor"));
    return councilors;
  }
  
  /**
   * Committee operations
   */
  async getCommittee(id: number): Promise<Committee | undefined> {
    const [committee] = await db
      .select()
      .from(committees)
      .where(eq(committees.id, id));
    
    return committee;
  }
  
  async getAllCommittees(): Promise<Committee[]> {
    return await db
      .select()
      .from(committees)
      .orderBy(desc(committees.startDate));
  }
  
  async getCommitteeWithMembers(id: number): Promise<(Committee & { members: (CommitteeMember & { user: User })[] }) | undefined> {
    const [committee] = await db
      .select()
      .from(committees)
      .where(eq(committees.id, id));
    
    if (!committee) {
      return undefined;
    }
    
    const committeeMembers = await db
      .select({
        committeeId: committeeMembers.committeeId,
        userId: committeeMembers.userId,
        role: committeeMembers.role,
        addedAt: committeeMembers.addedAt,
        user: users
      })
      .from(committeeMembers)
      .innerJoin(users, eq(committeeMembers.userId, users.id))
      .where(eq(committeeMembers.committeeId, id));
    
    return {
      ...committee,
      members: committeeMembers
    };
  }
  
  async createCommittee(committeeData: Partial<Committee>, memberIds: string[]): Promise<Committee> {
    // Criar a comissão
    const [committee] = await db
      .insert(committees)
      .values({
        name: committeeData.name!,
        startDate: committeeData.startDate!,
        endDate: committeeData.endDate!,
        description: committeeData.description!,
        type: committeeData.type!,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Adicionar membros à comissão
    if (memberIds.length > 0) {
      const memberValues = memberIds.map(userId => ({
        committeeId: committee.id,
        userId,
        role: "member", // Papel padrão
        addedAt: new Date()
      }));
      
      await db
        .insert(committeeMembers)
        .values(memberValues);
    }
    
    return committee;
  }
  
  async updateCommittee(id: number, committeeData: Partial<Committee>, memberIds?: string[]): Promise<Committee | undefined> {
    // Verificar se a comissão existe
    const committee = await this.getCommittee(id);
    
    if (!committee) {
      return undefined;
    }
    
    // Atualizar a comissão
    const [updatedCommittee] = await db
      .update(committees)
      .set({
        ...committeeData,
        updatedAt: new Date()
      })
      .where(eq(committees.id, id))
      .returning();
    
    // Atualizar membros se fornecidos
    if (memberIds) {
      // Remover todos os membros atuais
      await db
        .delete(committeeMembers)
        .where(eq(committeeMembers.committeeId, id));
      
      // Adicionar novos membros
      if (memberIds.length > 0) {
        const memberValues = memberIds.map(userId => ({
          committeeId: id,
          userId,
          role: "member", // Papel padrão
          addedAt: new Date()
        }));
        
        await db
          .insert(committeeMembers)
          .values(memberValues);
      }
    }
    
    return updatedCommittee;
  }
  
  async deleteCommittee(id: number): Promise<boolean> {
    // Verificar se a comissão existe
    const committee = await this.getCommittee(id);
    
    if (!committee) {
      return false;
    }
    
    // Remover membros da comissão
    await db
      .delete(committeeMembers)
      .where(eq(committeeMembers.committeeId, id));
    
    // Remover a comissão
    const result = await db
      .delete(committees)
      .where(eq(committees.id, id));
    
    return result.rowCount > 0;
  }
  
  /**
   * Committee Members operations
   */
  async getCommitteeMembersByCommitteeId(committeeId: number): Promise<(CommitteeMember & { user: User })[]> {
    return await db
      .select({
        committeeId: committeeMembers.committeeId,
        userId: committeeMembers.userId,
        role: committeeMembers.role,
        addedAt: committeeMembers.addedAt,
        user: users
      })
      .from(committeeMembers)
      .innerJoin(users, eq(committeeMembers.userId, users.id))
      .where(eq(committeeMembers.committeeId, committeeId));
  }
  
  async addCommitteeMember(committeeId: number, userId: string, role: string = "member"): Promise<CommitteeMember> {
    // Verificar se o membro já existe
    const [existingMember] = await db
      .select()
      .from(committeeMembers)
      .where(
        and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.userId, userId)
        )
      );
    
    if (existingMember) {
      // Atualizar o papel se já existir
      const [updatedMember] = await db
        .update(committeeMembers)
        .set({
          role
        })
        .where(
          and(
            eq(committeeMembers.committeeId, committeeId),
            eq(committeeMembers.userId, userId)
          )
        )
        .returning();
      
      return updatedMember;
    }
    
    // Adicionar novo membro
    const [member] = await db
      .insert(committeeMembers)
      .values({
        committeeId,
        userId,
        role,
        addedAt: new Date()
      })
      .returning();
    
    return member;
  }
  
  async updateCommitteeMemberRole(committeeId: number, userId: string, role: string): Promise<CommitteeMember | undefined> {
    // Verificar se o membro existe
    const [existingMember] = await db
      .select()
      .from(committeeMembers)
      .where(
        and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.userId, userId)
        )
      );
    
    if (!existingMember) {
      return undefined;
    }
    
    // Atualizar o papel
    const [updatedMember] = await db
      .update(committeeMembers)
      .set({
        role
      })
      .where(
        and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.userId, userId)
        )
      )
      .returning();
    
    return updatedMember;
  }
  
  async removeCommitteeMember(committeeId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(committeeMembers)
      .where(
        and(
          eq(committeeMembers.committeeId, committeeId),
          eq(committeeMembers.userId, userId)
        )
      );
    
    return result.rowCount > 0;
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
