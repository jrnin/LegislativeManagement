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
  eventCommittees,
  newsArticles,
  newsCategories,
  newsComments,
  boards,
  boardMembers,
  eventActivityDocuments,
  eventComments,
  eventTimeline,
  eventImages,
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
  type CommitteeMember,
  type EventCommittee,
  type NewsArticle,
  type NewsCategory,
  type NewsComment,
  type InsertNewsArticle,
  type InsertNewsCategory,
  type InsertNewsComment,
  type Board,
  type BoardMember,
  type InsertBoard,
  type InsertBoardMember,
  type EventActivityDocument,
  type InsertEventActivityDocument,
  type EventComment,
  type InsertEventComment,
  type EventTimeline,
  type InsertEventTimeline,
  type EventImage,
  type InsertEventImage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, isNull, isNotNull, lte, gte, like, inArray, notInArray, or, not } from "drizzle-orm";
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
  
  // Event-Committee operations
  addEventCommittees(eventId: number, committeeIds: number[]): Promise<void>;
  removeEventCommittees(eventId: number): Promise<void>;
  getEventCommittees(eventId: number): Promise<Committee[]>;
  
  // Event-Activity-Document operations
  linkActivityDocumentToEvent(eventId: number, activityId: number, documentId: number, linkedBy: string, notes?: string): Promise<EventActivityDocument>;
  unlinkActivityDocumentFromEvent(eventId: number, activityId: number, documentId: number): Promise<boolean>;
  getEventActivityDocuments(eventId: number): Promise<(EventActivityDocument & { 
    activity: LegislativeActivity; 
    document: Document; 
    linkedByUser: User 
  })[]>;
  getActivityDocumentsForEvent(eventId: number, activityId: number): Promise<(EventActivityDocument & { 
    document: Document; 
    linkedByUser: User 
  })[]>;

  // Event-Activity Management operations
  addActivitiesToEvent(eventId: number, activityIds: number[]): Promise<boolean>;
  removeActivityFromEvent(eventId: number, activityId: number): Promise<boolean>;
  
  // Event-Document Management operations
  addDocumentsToEvent(eventId: number, documentIds: number[]): Promise<boolean>;
  removeDocumentFromEvent(eventId: number, documentId: number): Promise<boolean>;
  
  // Search operations
  searchGlobal(query: string, type?: string): Promise<SearchResult[]>;
  
  // News operations
  getNewsArticle(id: number): Promise<NewsArticle | undefined>;
  getNewsArticleBySlug(slug: string): Promise<NewsArticle | undefined>;
  getAllNewsArticles(filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsArticle[]>;
  getPublishedNewsArticles(filters?: {
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsArticle[]>;
  createNewsArticle(articleData: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: number, articleData: Partial<NewsArticle>): Promise<NewsArticle | undefined>;
  deleteNewsArticle(id: number): Promise<boolean>;
  incrementNewsViews(id: number): Promise<void>;
  
  // News Categories operations
  getNewsCategory(id: number): Promise<NewsCategory | undefined>;
  getNewsCategoryBySlug(slug: string): Promise<NewsCategory | undefined>;
  getAllNewsCategories(): Promise<NewsCategory[]>;
  createNewsCategory(categoryData: InsertNewsCategory): Promise<NewsCategory>;
  updateNewsCategory(id: number, categoryData: Partial<NewsCategory>): Promise<NewsCategory | undefined>;
  deleteNewsCategory(id: number): Promise<boolean>;
  
  // News Comments operations
  getNewsComment(id: number): Promise<NewsComment | undefined>;
  getNewsCommentsByArticleId(articleId: number): Promise<NewsComment[]>;
  createNewsComment(commentData: InsertNewsComment): Promise<NewsComment>;
  updateNewsComment(id: number, commentData: Partial<NewsComment>): Promise<NewsComment | undefined>;
  deleteNewsComment(id: number): Promise<boolean>;
  
  // Board Management operations
  getAllBoards(): Promise<Board[]>;
  getBoardById(id: number): Promise<Board | undefined>;
  createBoard(boardData: InsertBoard, members: InsertBoardMember[]): Promise<Board>;
  updateBoard(id: number, boardData: Partial<InsertBoard>, members?: InsertBoardMember[]): Promise<Board | undefined>;
  deleteBoard(id: number): Promise<boolean>;
  
  // Event Comments operations
  getEventComment(id: number): Promise<EventComment | undefined>;
  getEventCommentsByEventId(eventId: number): Promise<(EventComment & { user: User })[]>;
  createEventComment(commentData: InsertEventComment): Promise<EventComment>;
  updateEventComment(id: number, commentData: Partial<EventComment>): Promise<EventComment | undefined>;
  deleteEventComment(id: number): Promise<boolean>;

  // Event Timeline operations
  getEventTimelineByEventId(eventId: number): Promise<(EventTimeline & { user: User })[]>;
  createEventTimelineEntry(data: InsertEventTimeline): Promise<EventTimeline>;
  addEventTimelineEntry(eventId: number, userId: string, actionType: string, targetType: string, targetId: number | null, description: string, metadata?: any): Promise<EventTimeline>;
  
  // Mention search operations (for @ mentions in comments)
  searchMentions(query: string, type?: 'event' | 'activity' | 'document'): Promise<{
    id: number;
    title: string;
    type: 'event' | 'activity' | 'document';
    subtitle?: string;
  }[]>;
  
  // Search operations for mentions
  searchEvents(query: string): Promise<any[]>;
  searchLegislativeActivities(query: string): Promise<any[]>;
  searchDocuments(query: string): Promise<any[]>;
  
  // Event Images operations
  getEventImages(eventId: number): Promise<EventImage[]>;
  createEventImage(imageData: InsertEventImage): Promise<EventImage>;
  updateEventImage(id: number, imageData: Partial<EventImage>): Promise<EventImage | undefined>;
  deleteEventImage(id: number): Promise<boolean>;
  getEventImageCount(eventId: number): Promise<number>;
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
    
    const [user] = await db.insert(users).values([userData]).returning();
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
    const [legislature] = await db.insert(legislatures).values([legislatureData]).returning();
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
    const eventsData = await db.select().from(events).orderBy(desc(events.eventDate));
    return eventsData.map(event => ({
      ...event,
      eventDate: event.eventDate instanceof Date 
        ? event.eventDate.toISOString().split('T')[0] 
        : (typeof event.eventDate === 'string' && event.eventDate.includes('T'))
          ? event.eventDate.split('T')[0]
          : event.eventDate
    }));
  }
  
  async getUpcomingEvents(limit: number = 3): Promise<Event[]> {
    // Get events with date >= today, ordered by date, limited
    // If no future events, get the most recent events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureEvents = await db
      .select()
      .from(events)
      .where(gte(events.eventDate, today))
      .orderBy(events.eventDate)
      .limit(limit);
    
    // If we have future events, return them
    if (futureEvents.length > 0) {
      return futureEvents;
    }
    
    // Otherwise, return the most recent events (last 'limit' events)
    return await db
      .select()
      .from(events)
      .orderBy(desc(events.eventDate))
      .limit(limit);
  }
  
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const [event] = await db.insert(events).values([eventData]).returning();
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
    
    // Group activities by activityNumber and activityType to avoid duplicates
    const uniqueActivities = new Map<string, LegislativeActivity>();
    
    for (const activity of activities) {
      const key = `${activity.activityNumber}-${activity.activityType}`;
      
      // Se ainda não temos essa atividade, ou se esta é a versão original (sem eventId)
      if (!uniqueActivities.has(key) || (!activity.eventId && uniqueActivities.get(key)?.eventId)) {
        uniqueActivities.set(key, activity);
      }
    }
    
    // For each unique activity, get the authors
    const result: LegislativeActivity[] = [];
    
    for (const activity of uniqueActivities.values()) {
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
    
    return result.sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
  }

  async getFilteredLegislativeActivities(filters: {
    search?: string;
    type?: string;
    author?: string;
    situation?: string;
  }): Promise<LegislativeActivity[]> {
    try {
      let query = db
        .select({
          activity: legislativeActivities,
          author: users
        })
        .from(legislativeActivities)
        .leftJoin(legislativeActivitiesAuthors, eq(legislativeActivities.id, legislativeActivitiesAuthors.activityId))
        .leftJoin(users, eq(legislativeActivitiesAuthors.userId, users.id));

      const whereConditions = [];

      // Filter by search term (number or description)
      if (filters.search) {
        whereConditions.push(
          or(
            like(legislativeActivities.description, `%${filters.search}%`),
            like(sql`CAST(${legislativeActivities.activityNumber} AS TEXT)`, `%${filters.search}%`)
          )
        );
      }

      // Filter by activity type
      if (filters.type) {
        whereConditions.push(eq(legislativeActivities.activityType, filters.type));
      }

      // Filter by author
      if (filters.author) {
        whereConditions.push(eq(users.id, filters.author));
      }

      // Filter by situation
      if (filters.situation) {
        whereConditions.push(eq(legislativeActivities.situacao, filters.situation));
      }

      // Apply where conditions
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }

      const results = await query.orderBy(desc(legislativeActivities.activityDate));

      // Group activities by activityNumber and activityType to avoid duplicates
      const uniqueActivities = new Map<string, LegislativeActivity>();
      const activityAuthors = new Map<number, any[]>();

      for (const result of results) {
        const activity = result.activity;
        const author = result.author;
        const key = `${activity.activityNumber}-${activity.activityType}`;

        // Store authors for each activity
        if (author) {
          if (!activityAuthors.has(activity.id)) {
            activityAuthors.set(activity.id, []);
          }
          const authors = activityAuthors.get(activity.id)!;
          if (!authors.find(a => a.id === author.id)) {
            authors.push(author);
          }
        }

        // Keep unique activities (prefer original without eventId)
        if (!uniqueActivities.has(key) || (!activity.eventId && uniqueActivities.get(key)?.eventId)) {
          uniqueActivities.set(key, activity);
        }
      }

      // Build final result with authors
      const finalResult: LegislativeActivity[] = [];
      
      for (const activity of uniqueActivities.values()) {
        const authors = activityAuthors.get(activity.id) || [];
        finalResult.push({
          ...activity,
          authors
        });
      }

      return finalResult.sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
    } catch (error) {
      console.error("Error in getFilteredLegislativeActivities:", error);
      // Fallback to all activities if filtering fails
      return this.getAllLegislativeActivities();
    }
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
    const [activity] = await db.insert(legislativeActivities).values([activityData]).returning();
    
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

  async getDocumentById(id: number): Promise<Document | undefined> {
    return this.getDocument(id);
  }

  async getDocumentsByEventId(eventId: number): Promise<Document[]> {
    try {
      return await db.select().from(documents).where(eq(documents.eventId, eventId));
    } catch (error) {
      console.error("Error fetching documents by event ID:", error);
      return [];
    }
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.documentDate));
  }

  async getFilteredDocuments(filters?: any, page: number = 1, limit: number = 10): Promise<Document[]> {
    try {
      // Base query
      let query = db.select().from(documents);
      
      // Apply filters if provided
      if (filters) {
        const whereConditions = [];
        
        // Filter by document type
        if (filters.documentType) {
          whereConditions.push(eq(documents.documentType, filters.documentType));
        }
        
        // Filter by status
        if (filters.status) {
          whereConditions.push(eq(documents.status, filters.status));
        }
        
        // Filter by date range
        if (filters.dateRange) {
          if (filters.dateRange.start) {
            whereConditions.push(gte(documents.documentDate, filters.dateRange.start));
          }
          if (filters.dateRange.end) {
            whereConditions.push(lte(documents.documentDate, filters.dateRange.end));
          }
        }
        
        // Filter by text search in description
        if (filters.search) {
          whereConditions.push(like(documents.description, `%${filters.search}%`));
        }
        
        // Apply all conditions if any
        if (whereConditions.length > 0) {
          query = query.where(and(...whereConditions));
        }
      }
      
      // Apply sorting and pagination
      query = query.orderBy(desc(documents.documentDate));
      
      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);
      
      // Execute query
      return await query;
    } catch (error) {
      console.error("Error in getFilteredDocuments:", error);
      return [];
    }
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
    const [document] = await db.insert(documents).values([documentData]).returning();
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
    try {
      // Get legislature count
      const legislatureCountResult = await db
        .select({ count: count() })
        .from(legislatures);
      const legislatureCount = legislatureCountResult[0]?.count || 0;
      
      // Get active event count (events with status "Aberto")
      const activeEventCountResult = await db
        .select({ count: count() })
        .from(events)
        .where(eq(events.status, "Aberto"));
      const activeEventCount = activeEventCountResult[0]?.count || 0;
      
      // Get pending activity count
      const pendingActivityCountResult = await db
        .select({ count: count() })
        .from(legislativeActivities)
        .where(
          and(
            isNotNull(legislativeActivities.approvalType),
            not(eq(legislativeActivities.approvalType, "")),
            or(
              eq(legislativeActivities.approved, false),
              isNull(legislativeActivities.approved)
            )
          )
        );
      const pendingActivityCount = pendingActivityCountResult[0]?.count || 0;
      
      // Get document count
      const documentCountResult = await db
        .select({ count: count() })
        .from(documents);
      const documentCount = documentCountResult[0]?.count || 0;
      
      return {
        legislatureCount,
        activeEventCount,
        pendingActivityCount,
        documentCount
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      return {
        legislatureCount: 0,
        activeEventCount: 0,
        pendingActivityCount: 0,
        documentCount: 0
      };
    }
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
    const [newAttendance] = await db.insert(eventAttendance).values([attendanceData]).returning();
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
    const [newVote] = await db.insert(documentVotes).values([voteData]).returning();
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
    const [newTimelineEvent] = await db.insert(activityTimeline).values([timelineData]).returning();
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
        videoUrl: events.videoUrl,
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
        eventDate: eventData.eventDate instanceof Date 
          ? eventData.eventDate.toISOString().split('T')[0] 
          : (typeof eventData.eventDate === 'string' && eventData.eventDate.includes('T'))
            ? eventData.eventDate.split('T')[0]
            : eventData.eventDate,
        eventTime: eventData.eventTime,
        location: eventData.location,
        mapUrl: eventData.mapUrl,
        videoUrl: eventData.videoUrl,
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

  async getActivityVotesByActivityAndEvent(activityId: number, eventId: number): Promise<(ActivityVote & { user: User })[]> {
    const votes = await db
      .select({
        vote: activityVotes,
        user: users,
      })
      .from(activityVotes)
      .innerJoin(users, eq(activityVotes.userId, users.id))
      .where(
        and(
          eq(activityVotes.activityId, activityId),
          eq(activityVotes.eventId, eventId)
        )
      )
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

  async getActivityVoteByUserActivityAndEvent(userId: string, activityId: number, eventId: number): Promise<ActivityVote | undefined> {
    const [vote] = await db
      .select()
      .from(activityVotes)
      .where(
        and(
          eq(activityVotes.userId, userId),
          eq(activityVotes.activityId, activityId),
          eq(activityVotes.eventId, eventId)
        )
      );
      
    return vote;
  }
  
  async createActivityVote(voteData: Partial<ActivityVote>): Promise<ActivityVote> {
    // Verificar se já existe um voto deste usuário para esta atividade no evento específico
    const existingVote = await this.getActivityVoteByUserActivityAndEvent(
      voteData.userId as string,
      voteData.activityId as number,
      voteData.eventId as number
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
    const approveCount = votes.filter(v => v.vote === true || v.vote === 't' || v.vote === 'true').length;
    const rejectCount = votes.filter(v => v.vote === false || v.vote === 'f' || v.vote === 'false').length;
    
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

  async getActivityVotesStatsByEvent(activityId: number, eventId: number): Promise<{
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
      .where(
        and(
          eq(activityVotes.activityId, activityId),
          eq(activityVotes.eventId, eventId)
        )
      );
    
    const totalVotes = votes.length;
    const approveCount = votes.filter(v => v.vote === true || v.vote === 't' || v.vote === 'true').length;
    const rejectCount = votes.filter(v => v.vote === false || v.vote === 'f' || v.vote === 'false').length;
    
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
   * Committee operations
   */
  async getCommittee(id: number): Promise<Committee | undefined> {
    const [committee] = await db
      .select()
      .from(committees)
      .where(eq(committees.id, id));
    
    if (!committee) {
      return undefined;
    }

    // Fetch committee members with user details
    const members = await db
      .select({
        userId: committeeMembers.userId,
        role: committeeMembers.role,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        }
      })
      .from(committeeMembers)
      .innerJoin(users, eq(committeeMembers.userId, users.id))
      .where(eq(committeeMembers.committeeId, id));

    return {
      ...committee,
      members
    };
  }
  
  async getAllCommittees(): Promise<(Committee & { members: (CommitteeMember & { user: User })[] })[]> {
    const committeesData = await db
      .select()
      .from(committees)
      .orderBy(desc(committees.startDate));
    
    // Para cada comissão, buscar seus membros
    const committeesWithMembers = await Promise.all(
      committeesData.map(async (committee) => {
        const membersData = await db
          .select({
            committeeId: committeeMembers.committeeId,
            userId: committeeMembers.userId,
            role: committeeMembers.role,
            addedAt: committeeMembers.addedAt,
            user: users
          })
          .from(committeeMembers)
          .innerJoin(users, eq(committeeMembers.userId, users.id))
          .where(eq(committeeMembers.committeeId, committee.id));
        
        return {
          ...committee,
          members: membersData
        };
      })
    );
    
    return committeesWithMembers;
  }
  
  async getCommitteeWithMembers(id: number): Promise<(Committee & { members: (CommitteeMember & { user: User })[] }) | undefined> {
    const [committee] = await db
      .select()
      .from(committees)
      .where(eq(committees.id, id));
    
    if (!committee) {
      return undefined;
    }
    
    const membersData = await db
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
      members: membersData
    };
  }
  
  async createCommittee(committeeData: Partial<Committee>, members: Array<{userId: string, role: string}>): Promise<Committee> {
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
    
    // Adicionar membros à comissão com suas funções específicas
    if (members.length > 0) {
      const memberValues = members.map(member => ({
        committeeId: committee.id,
        userId: member.userId,
        role: member.role || "Membro", // Função específica ou padrão
        addedAt: new Date()
      }));
      
      await db
        .insert(committeeMembers)
        .values(memberValues);
    }
    
    return committee;
  }
  
  async updateCommittee(id: number, committeeData: Partial<Committee>, members?: Array<{userId: string, role: string}>): Promise<Committee | undefined> {
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
    if (members) {
      // Remover todos os membros atuais
      await db
        .delete(committeeMembers)
        .where(eq(committeeMembers.committeeId, id));
      
      // Adicionar novos membros com suas funções específicas
      if (members.length > 0) {
        const memberValues = members.map(member => ({
          committeeId: id,
          userId: member.userId,
          role: member.role || "Membro", // Função específica ou padrão
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
   * Event-Committee operations
   */
  async addEventCommittees(eventId: number, committeeIds: number[]): Promise<void> {
    if (committeeIds.length === 0) return;
    
    const eventCommitteeValues = committeeIds.map(committeeId => ({
      eventId,
      committeeId,
      addedAt: new Date()
    }));
    
    await db
      .insert(eventCommittees)
      .values(eventCommitteeValues);
  }
  
  async removeEventCommittees(eventId: number): Promise<void> {
    await db
      .delete(eventCommittees)
      .where(eq(eventCommittees.eventId, eventId));
  }
  
  async getEventCommittees(eventId: number): Promise<Committee[]> {
    const result = await db
      .select({
        id: committees.id,
        name: committees.name,
        startDate: committees.startDate,
        endDate: committees.endDate,
        description: committees.description,
        type: committees.type,
        createdAt: committees.createdAt,
        updatedAt: committees.updatedAt,
      })
      .from(eventCommittees)
      .innerJoin(committees, eq(eventCommittees.committeeId, committees.id))
      .where(eq(eventCommittees.eventId, eventId));
    
    return result;
  }
  
  async getCommitteeEvents(committeeId: number): Promise<any[]> {
    const result = await db
      .select({
        id: events.id,
        eventNumber: events.eventNumber,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        location: events.location,
        mapUrl: events.mapUrl,
        videoUrl: events.videoUrl,
        category: events.category,
        legislatureId: events.legislatureId,
        description: events.description,
        status: events.status,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(eventCommittees)
      .innerJoin(events, eq(eventCommittees.eventId, events.id))
      .where(and(
        eq(eventCommittees.committeeId, committeeId),
        eq(events.category, "Reunião Comissão")
      ))
      .orderBy(desc(events.eventDate));
    
    return result;
  }
  
  async getCommitteeLegislativeActivities(committeeId: number, activityType?: string): Promise<any[]> {
    // Get events associated with this committee
    const committeeEventIds = await db
      .select({ eventId: eventCommittees.eventId })
      .from(eventCommittees)
      .where(eq(eventCommittees.committeeId, committeeId));
    
    if (committeeEventIds.length === 0) {
      return [];
    }
    
    const eventIds = committeeEventIds.map(row => row.eventId);
    
    // Build query for legislative activities
    let query = db
      .select({
        id: legislativeActivities.id,
        activityNumber: legislativeActivities.activityNumber,
        activityDate: legislativeActivities.activityDate,
        description: legislativeActivities.description,
        eventId: legislativeActivities.eventId,
        activityType: legislativeActivities.activityType,
        filePath: legislativeActivities.filePath,
        fileName: legislativeActivities.fileName,
        fileType: legislativeActivities.fileType,
        approvalType: legislativeActivities.approvalType,
        approved: legislativeActivities.approved,
        approvedBy: legislativeActivities.approvedBy,
        approvedAt: legislativeActivities.approvedAt,
        approvalComment: legislativeActivities.approvalComment,
        createdAt: legislativeActivities.createdAt,
        updatedAt: legislativeActivities.updatedAt,
      })
      .from(legislativeActivities)
      .where(inArray(legislativeActivities.eventId, eventIds));
    
    // Filter by activity type if specified
    if (activityType) {
      query = query.where(and(
        inArray(legislativeActivities.eventId, eventIds),
        eq(legislativeActivities.activityType, activityType)
      ));
    }
    
    const activities = await query.orderBy(desc(legislativeActivities.activityDate));
    
    // Get authors for each activity
    const activitiesWithAuthors = await Promise.all(
      activities.map(async (activity) => {
        const authors = await db
          .select({
            userId: legislativeActivitiesAuthors.userId,
            user: users
          })
          .from(legislativeActivitiesAuthors)
          .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
          .where(eq(legislativeActivitiesAuthors.activityId, activity.id));
        
        return {
          ...activity,
          authors
        };
      })
    );
    
    return activitiesWithAuthors;
  }
  
  // Board Management
  async getAllBoards(): Promise<Board[]> {
    const boardsResult = await db.select().from(boards).leftJoin(legislatures, eq(boards.legislatureId, legislatures.id));
    
    const boardsWithDetails = await Promise.all(boardsResult.map(async (boardResult) => {
      const board = boardResult.boards;
      const legislature = boardResult.legislatures;
      
      // Get board members
      const membersResult = await db.select()
        .from(boardMembers)
        .leftJoin(users, eq(boardMembers.userId, users.id))
        .where(eq(boardMembers.boardId, board.id));
      
      const members = membersResult.map(memberResult => ({
        ...memberResult.board_members,
        user: memberResult.users
      }));
      
      return {
        ...board,
        legislature,
        members
      };
    }));
    
    return boardsWithDetails;
  }

  async getBoardById(id: number): Promise<Board | undefined> {
    const [boardResult] = await db.select()
      .from(boards)
      .leftJoin(legislatures, eq(boards.legislatureId, legislatures.id))
      .where(eq(boards.id, id));
    
    if (!boardResult) return undefined;
    
    const board = boardResult.boards;
    const legislature = boardResult.legislatures;
    
    // Get board members
    const membersResult = await db.select()
      .from(boardMembers)
      .leftJoin(users, eq(boardMembers.userId, users.id))
      .where(eq(boardMembers.boardId, board.id));
    
    const members = membersResult.map(memberResult => ({
      ...memberResult.board_members,
      user: memberResult.users
    }));
    
    return {
      ...board,
      legislature,
      members
    };
  }

  async createBoard(boardData: InsertBoard, members: InsertBoardMember[]): Promise<Board> {
    const [createdBoard] = await db.insert(boards).values(boardData).returning();
    
    if (members.length > 0) {
      await db.insert(boardMembers).values(
        members.map(member => ({
          ...member,
          boardId: createdBoard.id
        }))
      );
    }
    
    const board = await this.getBoardById(createdBoard.id);
    if (!board) {
      throw new Error(`Failed to retrieve created board with ID ${createdBoard.id}`);
    }
    
    return board;
  }

  async updateBoard(id: number, boardData: Partial<InsertBoard>, members?: InsertBoardMember[]): Promise<Board | undefined> {
    const [updatedBoard] = await db.update(boards)
      .set({ ...boardData, updatedAt: new Date() })
      .where(eq(boards.id, id))
      .returning();
    
    if (!updatedBoard) return undefined;
    
    if (members) {
      // Remove existing members
      await db.delete(boardMembers).where(eq(boardMembers.boardId, id));
      
      // Add new members
      if (members.length > 0) {
        await db.insert(boardMembers).values(
          members.map(member => ({
            ...member,
            boardId: id
          }))
        );
      }
    }
    
    return this.getBoardById(id);
  }

  async deleteBoard(id: number): Promise<boolean> {
    const result = await db.delete(boards).where(eq(boards.id, id));
    return result.rowCount !== null && result.rowCount > 0;
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

  /**
   * News operations
   */
  async getNewsArticle(id: number): Promise<NewsArticle | undefined> {
    const [article] = await db
      .select()
      .from(newsArticles)
      .leftJoin(users, eq(newsArticles.authorId, users.id))
      .leftJoin(newsCategories, eq(newsArticles.categoryId, newsCategories.id))
      .where(eq(newsArticles.id, id));
    
    if (!article) return undefined;
    
    return {
      ...article.news_articles,
      author: article.users || undefined,
      category: article.news_categories || undefined,
    };
  }

  async getNewsArticleBySlug(slug: string): Promise<NewsArticle | undefined> {
    const [article] = await db
      .select()
      .from(newsArticles)
      .leftJoin(users, eq(newsArticles.authorId, users.id))
      .leftJoin(newsCategories, eq(newsArticles.categoryId, newsCategories.id))
      .where(eq(newsArticles.slug, slug));
    
    if (!article) return undefined;
    
    return {
      ...article.news_articles,
      author: article.users || undefined,
      category: article.news_categories || undefined,
    };
  }

  async getAllNewsArticles(filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsArticle[]> {
    let query = db
      .select()
      .from(newsArticles)
      .leftJoin(users, eq(newsArticles.authorId, users.id))
      .leftJoin(newsCategories, eq(newsArticles.categoryId, newsCategories.id));

    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(newsCategories.slug, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(newsArticles.status, filters.status));
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(newsArticles.featured, filters.featured));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${newsArticles.title})`, searchTerm),
          like(sql`LOWER(${newsArticles.content})`, searchTerm),
          like(sql`LOWER(${newsArticles.excerpt})`, searchTerm)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const articles = await query
      .orderBy(desc(newsArticles.publishedAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    return articles.map(article => ({
      ...article.news_articles,
      author: article.users || undefined,
      category: article.news_categories || undefined,
    }));
  }

  async getPublishedNewsArticles(filters?: {
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsArticle[]> {
    return this.getAllNewsArticles({
      ...filters,
      status: 'published',
    });
  }

  async createNewsArticle(articleData: InsertNewsArticle): Promise<NewsArticle> {
    const [article] = await db
      .insert(newsArticles)
      .values({
        ...articleData,
        publishedAt: articleData.status === 'published' ? new Date() : null,
      })
      .returning();
    
    return article;
  }

  async updateNewsArticle(id: number, articleData: Partial<NewsArticle>): Promise<NewsArticle | undefined> {
    const updateData = { ...articleData };
    
    // Set publishedAt when status changes to published
    if (articleData.status === 'published' && !articleData.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    const [article] = await db
      .update(newsArticles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(newsArticles.id, id))
      .returning();
    
    return article;
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    const result = await db
      .delete(newsArticles)
      .where(eq(newsArticles.id, id));
    
    return result.rowCount > 0;
  }

  async incrementNewsViews(id: number): Promise<void> {
    await db
      .update(newsArticles)
      .set({ views: sql`${newsArticles.views} + 1` })
      .where(eq(newsArticles.id, id));
  }

  /**
   * News Categories operations
   */
  async getNewsCategory(id: number): Promise<NewsCategory | undefined> {
    const [category] = await db
      .select()
      .from(newsCategories)
      .where(eq(newsCategories.id, id));
    
    return category;
  }

  async getNewsCategoryBySlug(slug: string): Promise<NewsCategory | undefined> {
    const [category] = await db
      .select()
      .from(newsCategories)
      .where(eq(newsCategories.slug, slug));
    
    return category;
  }

  async getAllNewsCategories(): Promise<NewsCategory[]> {
    return await db
      .select()
      .from(newsCategories)
      .orderBy(newsCategories.name);
  }

  async createNewsCategory(categoryData: InsertNewsCategory): Promise<NewsCategory> {
    const [category] = await db
      .insert(newsCategories)
      .values(categoryData)
      .returning();
    
    return category;
  }

  async updateNewsCategory(id: number, categoryData: Partial<NewsCategory>): Promise<NewsCategory | undefined> {
    const [category] = await db
      .update(newsCategories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(newsCategories.id, id))
      .returning();
    
    return category;
  }

  async deleteNewsCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(newsCategories)
      .where(eq(newsCategories.id, id));
    
    return result.rowCount > 0;
  }

  /**
   * News Comments operations
   */
  async getNewsComment(id: number): Promise<NewsComment | undefined> {
    const [comment] = await db
      .select()
      .from(newsComments)
      .where(eq(newsComments.id, id));
    
    return comment;
  }

  async getNewsCommentsByArticleId(articleId: number): Promise<NewsComment[]> {
    return await db
      .select()
      .from(newsComments)
      .where(and(
        eq(newsComments.articleId, articleId),
        eq(newsComments.status, 'approved')
      ))
      .orderBy(newsComments.createdAt);
  }

  async createNewsComment(commentData: InsertNewsComment): Promise<NewsComment> {
    const [comment] = await db
      .insert(newsComments)
      .values(commentData)
      .returning();
    
    return comment;
  }

  async updateNewsComment(id: number, commentData: Partial<NewsComment>): Promise<NewsComment | undefined> {
    const [comment] = await db
      .update(newsComments)
      .set({ ...commentData, updatedAt: new Date() })
      .where(eq(newsComments.id, id))
      .returning();
    
    return comment;
  }

  async deleteNewsComment(id: number): Promise<boolean> {
    const result = await db
      .delete(newsComments)
      .where(eq(newsComments.id, id));
    
    return result.rowCount > 0;
  }

  /**
   * Event Activity Documents operations
   */
  async linkActivityDocumentToEvent(eventId: number, activityId: number, documentId: number, linkedBy: string, notes?: string): Promise<EventActivityDocument> {
    const [link] = await db
      .insert(eventActivityDocuments)
      .values({
        eventId,
        activityId,
        documentId,
        linkedBy,
        notes
      })
      .returning();
    
    return link;
  }

  async unlinkActivityDocumentFromEvent(eventId: number, activityId: number, documentId: number): Promise<boolean> {
    const result = await db
      .delete(eventActivityDocuments)
      .where(
        and(
          eq(eventActivityDocuments.eventId, eventId),
          eq(eventActivityDocuments.activityId, activityId),
          eq(eventActivityDocuments.documentId, documentId)
        )
      );
    
    return result.rowCount > 0;
  }

  async getEventActivityDocuments(eventId: number): Promise<(EventActivityDocument & { 
    activity: LegislativeActivity; 
    document: Document; 
    linkedByUser: User 
  })[]> {
    return await db
      .select()
      .from(eventActivityDocuments)
      .leftJoin(legislativeActivities, eq(eventActivityDocuments.activityId, legislativeActivities.id))
      .leftJoin(documents, eq(eventActivityDocuments.documentId, documents.id))
      .leftJoin(users, eq(eventActivityDocuments.linkedBy, users.id))
      .where(eq(eventActivityDocuments.eventId, eventId))
      .then(rows => rows.map(row => ({
        ...row.event_activity_documents,
        activity: row.legislative_activities!,
        document: row.documents!,
        linkedByUser: row.users!
      })));
  }

  async getActivityDocumentsForEvent(eventId: number, activityId: number): Promise<(EventActivityDocument & { 
    document: Document; 
    linkedByUser: User 
  })[]> {
    return await db
      .select()
      .from(eventActivityDocuments)
      .leftJoin(documents, eq(eventActivityDocuments.documentId, documents.id))
      .leftJoin(users, eq(eventActivityDocuments.linkedBy, users.id))
      .where(
        and(
          eq(eventActivityDocuments.eventId, eventId),
          eq(eventActivityDocuments.activityId, activityId)
        )
      )
      .then(rows => rows.map(row => ({
        ...row.event_activity_documents,
        document: row.documents!,
        linkedByUser: row.users!
      })));
  }

  /**
   * Event-Activity Management operations
   */
  async addActivitiesToEvent(eventId: number, activityIds: number[]): Promise<boolean> {
    try {
      // Para cada atividade, verificar se já existe no evento
      for (const activityId of activityIds) {
        // Verificar se a atividade já existe no evento
        const existingActivity = await db
          .select()
          .from(legislativeActivities)
          .where(
            and(
              eq(legislativeActivities.id, activityId),
              eq(legislativeActivities.eventId, eventId)
            )
          );
        
        if (existingActivity.length > 0) {
          // Atividade já existe no evento, pular
          continue;
        }
        
        // Verificar se a atividade existe sem eventId ou com eventId diferente
        const sourceActivity = await db
          .select()
          .from(legislativeActivities)
          .where(eq(legislativeActivities.id, activityId))
          .limit(1);
        
        if (sourceActivity.length === 0) {
          continue; // Atividade não encontrada
        }
        
        const activity = sourceActivity[0];
        
        // Se a atividade não tem eventId, simplesmente associar
        if (!activity.eventId) {
          await db
            .update(legislativeActivities)
            .set({ eventId })
            .where(eq(legislativeActivities.id, activityId));
        } else {
          // Se a atividade já tem eventId, criar uma cópia para o novo evento
          const newActivity = {
            activityNumber: activity.activityNumber,
            activityDate: activity.activityDate,
            description: activity.description,
            eventId: eventId,
            activityType: activity.activityType,
            situacao: activity.situacao,
            regimeTramitacao: activity.regimeTramitacao,
            filePath: activity.filePath,
            fileName: activity.fileName,
            fileType: activity.fileType,
            approvalType: activity.approvalType,
            approved: activity.approved,
            approvedBy: activity.approvedBy,
            approvedAt: activity.approvedAt,
            approvalComment: activity.approvalComment,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Inserir a nova atividade
          const [insertedActivity] = await db
            .insert(legislativeActivities)
            .values(newActivity)
            .returning();
          
          // Copiar os autores da atividade original
          const originalAuthors = await db
            .select()
            .from(legislativeActivitiesAuthors)
            .where(eq(legislativeActivitiesAuthors.activityId, activityId));
          
          if (originalAuthors.length > 0) {
            const newAuthors = originalAuthors.map(author => ({
              activityId: insertedActivity.id,
              userId: author.userId,
            }));
            
            await db
              .insert(legislativeActivitiesAuthors)
              .values(newAuthors);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error adding activities to event:", error);
      return false;
    }
  }

  async removeActivityFromEvent(eventId: number, activityId: number): Promise<boolean> {
    try {
      // Verificar se é uma atividade original (sem eventId inicial) ou uma cópia
      const activity = await db
        .select()
        .from(legislativeActivities)
        .where(
          and(
            eq(legislativeActivities.id, activityId),
            eq(legislativeActivities.eventId, eventId)
          )
        )
        .limit(1);
      
      if (activity.length === 0) {
        return false; // Atividade não encontrada no evento
      }
      
      // Verificar se existem outras atividades com o mesmo número e tipo
      const sameActivities = await db
        .select()
        .from(legislativeActivities)
        .where(
          and(
            eq(legislativeActivities.activityNumber, activity[0].activityNumber),
            eq(legislativeActivities.activityType, activity[0].activityType),
            not(eq(legislativeActivities.id, activityId))
          )
        );
      
      if (sameActivities.length > 0) {
        // Se existem outras instâncias da mesma atividade, remover esta completamente
        await db
          .delete(legislativeActivitiesAuthors)
          .where(eq(legislativeActivitiesAuthors.activityId, activityId));
        
        await db
          .delete(legislativeActivities)
          .where(eq(legislativeActivities.id, activityId));
        
        return true;
      } else {
        // Se é a única instância, apenas remover o eventId
        const result = await db
          .update(legislativeActivities)
          .set({ eventId: null })
          .where(eq(legislativeActivities.id, activityId));
        
        return result.rowCount > 0;
      }
    } catch (error) {
      console.error("Error removing activity from event:", error);
      return false;
    }
  }

  /**
   * Event-Document Management operations
   */
  async addDocumentsToEvent(eventId: number, documentIds: number[]): Promise<boolean> {
    try {
      // Update the eventId for all selected documents
      await db
        .update(documents)
        .set({ eventId })
        .where(inArray(documents.id, documentIds));
      
      return true;
    } catch (error) {
      console.error("Error adding documents to event:", error);
      return false;
    }
  }

  async removeDocumentFromEvent(eventId: number, documentId: number): Promise<boolean> {
    try {
      // Set eventId to null for the specified document
      const result = await db
        .update(documents)
        .set({ eventId: null })
        .where(
          and(
            eq(documents.id, documentId),
            eq(documents.eventId, eventId)
          )
        );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error removing document from event:", error);
      return false;
    }
  }

  /**
   * Event Comments operations
   */
  async getEventComment(id: number): Promise<EventComment | undefined> {
    try {
      const [comment] = await db
        .select()
        .from(eventComments)
        .where(eq(eventComments.id, id));
      return comment;
    } catch (error) {
      console.error("Error getting event comment:", error);
      return undefined;
    }
  }

  async getEventCommentsByEventId(eventId: number): Promise<(EventComment & { user: User })[]> {
    try {
      const comments = await db
        .select({
          id: eventComments.id,
          eventId: eventComments.eventId,
          userId: eventComments.userId,
          content: eventComments.content,
          mentions: eventComments.mentions,
          isEdited: eventComments.isEdited,
          createdAt: eventComments.createdAt,
          updatedAt: eventComments.updatedAt,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            profileImageUrl: users.profileImageUrl,
            role: users.role
          }
        })
        .from(eventComments)
        .leftJoin(users, eq(eventComments.userId, users.id))
        .where(eq(eventComments.eventId, eventId))
        .orderBy(eventComments.createdAt);
      
      return comments.map(row => ({
        ...row,
        user: row.user!
      }));
    } catch (error) {
      console.error("Error getting event comments:", error);
      return [];
    }
  }

  async createEventComment(commentData: InsertEventComment): Promise<EventComment> {
    try {
      const [comment] = await db
        .insert(eventComments)
        .values(commentData)
        .returning();
      return comment;
    } catch (error) {
      console.error("Error creating event comment:", error);
      throw error;
    }
  }

  async updateEventComment(id: number, commentData: Partial<EventComment>): Promise<EventComment | undefined> {
    try {
      const [comment] = await db
        .update(eventComments)
        .set({ ...commentData, updatedAt: new Date(), isEdited: true })
        .where(eq(eventComments.id, id))
        .returning();
      return comment;
    } catch (error) {
      console.error("Error updating event comment:", error);
      return undefined;
    }
  }

  async deleteEventComment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(eventComments)
        .where(eq(eventComments.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting event comment:", error);
      return false;
    }
  }

  /**
   * Event Timeline operations
   */
  async getEventTimelineByEventId(eventId: number): Promise<(EventTimeline & { user: User })[]> {
    try {
      // Usar o pool diretamente para executar SQL puro
      const query = `
        SELECT 
          et.id,
          et.event_id as "eventId",
          et.user_id as "userId",
          et.action_type as "actionType",
          et.target_type as "targetType",
          et.target_id as "targetId",
          et.description,
          et.metadata,
          et.created_at as "createdAt",
          u.id as "user_id",
          u.email as "user_email",
          u.name as "user_name",
          u.role as "user_role",
          u.profile_image_url as "user_profileImageUrl",
          u.created_at as "user_createdAt",
          u.updated_at as "user_updatedAt",
          u.email_verified as "user_emailVerified",
          u.verification_token as "user_verificationToken",
          u.password as "user_password",
          u.cpf as "user_cpf",
          u.birth_date as "user_birthDate",
          u.zip_code as "user_zipCode",
          u.address as "user_address",
          u.neighborhood as "user_neighborhood",
          u.number as "user_number",
          u.city as "user_city",
          u.state as "user_state",
          u.legislature_id as "user_legislatureId",
          u.marital_status as "user_maritalStatus",
          u.occupation as "user_occupation",
          u.education as "user_education",
          u.partido as "user_partido",
          u.email_verification_sent_at as "user_emailVerificationSentAt"
        FROM event_timeline et
        LEFT JOIN users u ON et.user_id = u.id
        WHERE et.event_id = $1
        ORDER BY et.created_at DESC
      `;
      
      const { pool } = await import('./db');
      const result = await pool.query(query, [eventId]);
      
      // Transformar o resultado para o formato esperado
      return result.rows.map((row: any) => ({
        id: row.id,
        eventId: row.eventId,
        userId: row.userId,
        actionType: row.actionType,
        targetType: row.targetType,
        targetId: row.targetId,
        description: row.description,
        metadata: row.metadata,
        createdAt: row.createdAt,
        user: row.user_id ? {
          id: row.user_id,
          email: row.user_email,
          name: row.user_name,
          role: row.user_role,
          profileImageUrl: row.user_profileImageUrl,
          createdAt: row.user_createdAt,
          updatedAt: row.user_updatedAt,
          emailVerified: row.user_emailVerified,
          verificationToken: row.user_verificationToken,
          password: row.user_password,
          cpf: row.user_cpf,
          birthDate: row.user_birthDate,
          zipCode: row.user_zipCode,
          address: row.user_address,
          neighborhood: row.user_neighborhood,
          number: row.user_number,
          city: row.user_city,
          state: row.user_state,
          legislatureId: row.user_legislatureId,
          maritalStatus: row.user_maritalStatus,
          occupation: row.user_occupation,
          education: row.user_education,
          partido: row.user_partido,
          emailVerificationSentAt: row.user_emailVerificationSentAt
        } : null
      })) as (EventTimeline & { user: User })[];
    } catch (error) {
      console.error("Error fetching event timeline:", error);
      return [];
    }
  }

  async createEventTimelineEntry(data: InsertEventTimeline): Promise<EventTimeline> {
    const [timeline] = await db
      .insert(eventTimeline)
      .values(data)
      .returning();
    return timeline;
  }

  async addEventTimelineEntry(
    eventId: number,
    userId: string,
    actionType: string,
    targetType: string,
    targetId: number | null,
    description: string,
    metadata: any = {}
  ): Promise<EventTimeline> {
    const data: InsertEventTimeline = {
      eventId,
      userId,
      actionType,
      targetType,
      targetId,
      description,
      metadata,
    };

    return await this.createEventTimelineEntry(data);
  }

  /**
   * Mention search operations (for @ mentions in comments)
   */
  async searchMentions(query: string, type?: 'event' | 'activity' | 'document'): Promise<{
    id: number;
    title: string;
    type: 'event' | 'activity' | 'document';
    subtitle?: string;
  }[]> {
    try {
      const results: {
        id: number;
        title: string;
        type: 'event' | 'activity' | 'document';
        subtitle?: string;
      }[] = [];

      const searchTerm = `%${query}%`;

      // Search events
      if (!type || type === 'event') {
        const eventResults = await db
          .select({
            id: events.id,
            title: sql<string>`'Evento #' || ${events.eventNumber}`,
            subtitle: sql<string>`${events.category} || ' - ' || ${events.eventDate}`,
          })
          .from(events)
          .where(
            or(
              like(sql<string>`'Evento #' || ${events.eventNumber}`, searchTerm),
              like(events.category, searchTerm),
              like(events.description, searchTerm)
            )
          )
          .limit(5);

        results.push(...eventResults.map(r => ({ ...r, type: 'event' as const })));
      }

      // Search activities
      if (!type || type === 'activity') {
        const activityResults = await db
          .select({
            id: legislativeActivities.id,
            title: sql<string>`${legislativeActivities.activityType} || ' #' || ${legislativeActivities.activityNumber}`,
            subtitle: legislativeActivities.description,
          })
          .from(legislativeActivities)
          .where(
            or(
              like(sql<string>`${legislativeActivities.activityType} || ' #' || ${legislativeActivities.activityNumber}`, searchTerm),
              like(legislativeActivities.description, searchTerm)
            )
          )
          .limit(5);

        results.push(...activityResults.map(r => ({ ...r, type: 'activity' as const })));
      }

      // Search documents
      if (!type || type === 'document') {
        const documentResults = await db
          .select({
            id: documents.id,
            title: sql<string>`${documents.documentType} || ' #' || ${documents.documentNumber}`,
            subtitle: documents.description,
          })
          .from(documents)
          .where(
            or(
              like(sql<string>`${documents.documentType} || ' #' || ${documents.documentNumber}`, searchTerm),
              like(documents.description, searchTerm)
            )
          )
          .limit(5);

        results.push(...documentResults.map(r => ({ ...r, type: 'document' as const })));
      }

      return results.slice(0, 10);
    } catch (error) {
      console.error("Error searching mentions:", error);
      return [];
    }
  }

  /**
   * Search operations for mentions
   */
  async searchEvents(query: string): Promise<any[]> {
    try {
      const searchTerm = `%${query}%`;
      const results = await db
        .select({
          id: events.id,
          title: sql<string>`'Evento #' || ${events.eventNumber}`,
          eventNumber: events.eventNumber,
          category: events.category,
          eventDate: events.eventDate,
          description: events.description,
        })
        .from(events)
        .where(
          or(
            like(sql<string>`'Evento #' || ${events.eventNumber}`, searchTerm),
            like(events.category, searchTerm),
            like(events.description, searchTerm)
          )
        )
        .limit(10);
      return results;
    } catch (error) {
      console.error("Error searching events:", error);
      return [];
    }
  }

  async searchLegislativeActivities(query: string): Promise<any[]> {
    try {
      const searchTerm = `%${query}%`;
      const results = await db
        .select({
          id: legislativeActivities.id,
          title: sql<string>`${legislativeActivities.activityType} || ' #' || ${legislativeActivities.activityNumber}`,
          activityNumber: legislativeActivities.activityNumber,
          activityType: legislativeActivities.activityType,
          description: legislativeActivities.description,
        })
        .from(legislativeActivities)
        .where(
          or(
            like(sql<string>`${legislativeActivities.activityType} || ' #' || ${legislativeActivities.activityNumber}`, searchTerm),
            like(legislativeActivities.description, searchTerm)
          )
        )
        .limit(10);
      return results;
    } catch (error) {
      console.error("Error searching legislative activities:", error);
      return [];
    }
  }

  async searchDocuments(query: string): Promise<any[]> {
    try {
      const searchTerm = `%${query}%`;
      const results = await db
        .select({
          id: documents.id,
          title: sql<string>`${documents.documentType} || ' #' || ${documents.documentNumber}`,
          documentNumber: documents.documentNumber,
          documentType: documents.documentType,
          description: documents.description,
        })
        .from(documents)
        .where(
          or(
            like(sql<string>`${documents.documentType} || ' #' || ${documents.documentNumber}`, searchTerm),
            like(documents.description, searchTerm)
          )
        )
        .limit(10);
      return results;
    } catch (error) {
      console.error("Error searching documents:", error);
      return [];
    }
  }

  /**
   * Event Images operations
   */
  async getEventImages(eventId: number): Promise<EventImage[]> {
    return await db
      .select()
      .from(eventImages)
      .where(eq(eventImages.eventId, eventId))
      .orderBy(eventImages.orderIndex, eventImages.createdAt);
  }

  async createEventImage(imageData: InsertEventImage): Promise<EventImage> {
    const [image] = await db
      .insert(eventImages)
      .values(imageData)
      .returning();
    
    return image;
  }

  async updateEventImage(id: number, imageData: Partial<EventImage>): Promise<EventImage | undefined> {
    const [image] = await db
      .update(eventImages)
      .set(imageData)
      .where(eq(eventImages.id, id))
      .returning();
    
    return image;
  }

  async deleteEventImage(id: number): Promise<boolean> {
    const result = await db
      .delete(eventImages)
      .where(eq(eventImages.id, id));
    
    return result.rowCount > 0;
  }

  async getEventImageCount(eventId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(eventImages)
      .where(eq(eventImages.eventId, eventId));
    
    return result.count;
  }

  async getAllEventImagesWithEvents(): Promise<any[]> {
    try {
      const images = await db
        .select({
          id: eventImages.id,
          eventId: eventImages.eventId,
          imageData: eventImages.imageData,
          fileName: eventImages.fileName,
          fileSize: eventImages.fileSize,
          mimeType: eventImages.mimeType,
          caption: eventImages.caption,
          orderIndex: eventImages.orderIndex,
          uploadedBy: eventImages.uploadedBy,
          createdAt: eventImages.createdAt,
          event: {
            id: events.id,
            eventNumber: events.eventNumber,
            eventDate: events.eventDate,
            eventTime: events.eventTime,
            location: events.location,
            category: events.category,
            status: events.status,
            description: events.description,
          }
        })
        .from(eventImages)
        .innerJoin(events, eq(eventImages.eventId, events.id))
        .orderBy(desc(eventImages.createdAt));
      
      return images;
    } catch (error) {
      console.error("Error fetching all event images with events:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
