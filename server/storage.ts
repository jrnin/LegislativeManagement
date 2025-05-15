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
import * as committeeImpl from "./committee-impl";

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
  
  // Committee operations
  getCommittee(id: number): Promise<Committee | undefined>;
  getCommitteeWithMembers(id: number): Promise<(Committee & { members: CommitteeMember[] }) | undefined>;
  getAllCommittees(): Promise<Committee[]>;
  getActiveCommittees(): Promise<Committee[]>;
  getCommitteeMembers(committeeId: number): Promise<CommitteeMember[]>;
  createCommittee(committeeData: Partial<Committee>): Promise<Committee>;
  updateCommittee(id: number, committeeData: Partial<Committee>): Promise<Committee | undefined>;
  deleteCommittee(id: number): Promise<boolean>;
  addCommitteeMember(committeeId: number, userId: string, role?: string): Promise<CommitteeMember>;
  updateCommitteeMember(committeeId: number, userId: string, role: string): Promise<CommitteeMember | undefined>;
  removeCommitteeMember(committeeId: number, userId: string): Promise<boolean>;
  
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
  
  // Get all councilors
  getCouncilors(): Promise<User[]>;
  
  // Search operations
  searchGlobal(query: string, type?: string): Promise<SearchResult[]>;
}

class DatabaseStorage implements IStorage {
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
    // Generate verification token if not provided
    if (!userData.verificationToken) {
      userData.verificationToken = crypto.randomBytes(32).toString("hex");
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
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async upsertUser(userData: Partial<User>): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUser(userData.id!);
    
    if (existingUser) {
      // Update existing user
      return this.updateUser(userData.id!, userData) as Promise<User>;
    } else {
      // Create new user
      return this.createUser(userData);
    }
  }
  
  async verifyEmail(token: string): Promise<boolean> {
    const user = await this.getUserByVerificationToken(token);
    
    if (!user) {
      return false;
    }
    
    // Mark email as verified and clear verification token
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
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  /**
   * Committee operations
   */
  async getCommittee(id: number): Promise<Committee | undefined> {
    return committeeImpl.getCommittee(id);
  }
  
  async getCommitteeWithMembers(id: number): Promise<(Committee & { members: CommitteeMember[] }) | undefined> {
    return committeeImpl.getCommitteeWithMembers(id);
  }
  
  async getAllCommittees(): Promise<Committee[]> {
    return committeeImpl.getAllCommittees();
  }
  
  async getActiveCommittees(): Promise<Committee[]> {
    return committeeImpl.getActiveCommittees();
  }
  
  async getCommitteeMembers(committeeId: number): Promise<CommitteeMember[]> {
    return committeeImpl.getCommitteeMembers(committeeId);
  }
  
  async createCommittee(committeeData: Partial<Committee>): Promise<Committee> {
    return committeeImpl.createCommittee(committeeData);
  }
  
  async updateCommittee(id: number, committeeData: Partial<Committee>): Promise<Committee | undefined> {
    return committeeImpl.updateCommittee(id, committeeData);
  }
  
  async deleteCommittee(id: number): Promise<boolean> {
    return committeeImpl.deleteCommittee(id);
  }
  
  async addCommitteeMember(committeeId: number, userId: string, role: string = "Membro"): Promise<CommitteeMember> {
    return committeeImpl.addCommitteeMember(committeeId, userId, role);
  }
  
  async updateCommitteeMember(committeeId: number, userId: string, role: string): Promise<CommitteeMember | undefined> {
    return committeeImpl.updateCommitteeMember(committeeId, userId, role);
  }
  
  async removeCommitteeMember(committeeId: number, userId: string): Promise<boolean> {
    return committeeImpl.removeCommitteeMember(committeeId, userId);
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
    return await db
      .select()
      .from(events)
      .where(gte(events.eventDate, new Date()))
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
    // Remove related records first
    await db
      .delete(eventAttendance)
      .where(eq(eventAttendance.eventId, id));
    
    await db
      .delete(legislativeActivities)
      .where(eq(legislativeActivities.eventId, id));
    
    await db
      .delete(documents)
      .where(eq(documents.eventId, id));
    
    // Then delete the event
    const result = await db
      .delete(events)
      .where(eq(events.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  /**
   * Legislative Activity operations
   */
  async getLegislativeActivity(id: number): Promise<LegislativeActivity | undefined> {
    const [activity] = await db.select().from(legislativeActivities).where(eq(legislativeActivities.id, id));
    
    if (activity) {
      // Get authors
      const authorsData = await db
        .select({
          user: users,
        })
        .from(legislativeActivitiesAuthors)
        .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
        .where(eq(legislativeActivitiesAuthors.activityId, id));
      
      return {
        ...activity,
        authors: authorsData.map(a => a.user),
      };
    }
    
    return activity;
  }
  
  async getAllLegislativeActivities(): Promise<LegislativeActivity[]> {
    const activities = await db.select().from(legislativeActivities).orderBy(desc(legislativeActivities.activityDate));
    
    // Get all activity authors in one query
    const allActivityIds = activities.map(a => a.id);
    
    const authorsData = await db
      .select({
        activityId: legislativeActivitiesAuthors.activityId,
        user: users,
      })
      .from(legislativeActivitiesAuthors)
      .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
      .where(inArray(legislativeActivitiesAuthors.activityId, allActivityIds));
    
    // Group authors by activity ID
    const authorsByActivity = new Map<number, User[]>();
    
    for (const authorData of authorsData) {
      if (!authorsByActivity.has(authorData.activityId)) {
        authorsByActivity.set(authorData.activityId, []);
      }
      
      authorsByActivity.get(authorData.activityId)!.push(authorData.user);
    }
    
    // Merge activities with their authors
    return activities.map(activity => ({
      ...activity,
      authors: authorsByActivity.get(activity.id) || [],
    }));
  }
  
  async getRecentLegislativeActivities(limit: number = 3): Promise<LegislativeActivity[]> {
    const activities = await db
      .select()
      .from(legislativeActivities)
      .orderBy(desc(legislativeActivities.activityDate))
      .limit(limit);
    
    // Get activity authors
    const allActivityIds = activities.map(a => a.id);
    
    const authorsData = await db
      .select({
        activityId: legislativeActivitiesAuthors.activityId,
        user: users,
      })
      .from(legislativeActivitiesAuthors)
      .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
      .where(inArray(legislativeActivitiesAuthors.activityId, allActivityIds));
    
    // Group authors by activity ID
    const authorsByActivity = new Map<number, User[]>();
    
    for (const authorData of authorsData) {
      if (!authorsByActivity.has(authorData.activityId)) {
        authorsByActivity.set(authorData.activityId, []);
      }
      
      authorsByActivity.get(authorData.activityId)!.push(authorData.user);
    }
    
    // Merge activities with their authors
    return activities.map(activity => ({
      ...activity,
      authors: authorsByActivity.get(activity.id) || [],
    }));
  }
  
  async createLegislativeActivity(activityData: Partial<LegislativeActivity>, authorIds: string[]): Promise<LegislativeActivity> {
    // Create the activity
    const [activity] = await db.insert(legislativeActivities).values(activityData).returning();
    
    // Create author relationships
    if (authorIds.length > 0) {
      const authorRelationships = authorIds.map(userId => ({
        activityId: activity.id,
        userId,
      }));
      
      await db.insert(legislativeActivitiesAuthors).values(authorRelationships);
    }
    
    // Create a timeline entry for creation
    await this.createActivityTimeline({
      activityId: activity.id,
      eventType: "Criação",
      description: "Atividade legislativa criada",
      createdBy: authorIds[0] || "system",
    });
    
    // Return the activity with authors
    const authors = await db
      .select({
        user: users,
      })
      .from(users)
      .where(inArray(users.id, authorIds));
    
    return {
      ...activity,
      authors: authors.map(a => a.user),
    };
  }
  
  async updateLegislativeActivity(id: number, activityData: Partial<LegislativeActivity>, authorIds?: string[]): Promise<LegislativeActivity | undefined> {
    // Check if activity exists
    const activity = await this.getLegislativeActivity(id);
    
    if (!activity) {
      return undefined;
    }
    
    // Update activity data
    const [updatedActivity] = await db
      .update(legislativeActivities)
      .set({
        ...activityData,
        updatedAt: new Date(),
      })
      .where(eq(legislativeActivities.id, id))
      .returning();
    
    // Update authors if provided
    if (authorIds) {
      // Delete existing author relationships
      await db.delete(legislativeActivitiesAuthors).where(eq(legislativeActivitiesAuthors.activityId, id));
      
      // Create new author relationships
      if (authorIds.length > 0) {
        const authorRelationships = authorIds.map(userId => ({
          activityId: id,
          userId,
        }));
        
        await db.insert(legislativeActivitiesAuthors).values(authorRelationships);
      }
    }
    
    // Create a timeline entry for update
    await this.createActivityTimeline({
      activityId: id,
      eventType: "Atualização",
      description: "Atividade legislativa atualizada",
      createdBy: authorIds?.[0] || activity.authors?.[0]?.id || "system",
    });
    
    // Return the updated activity with authors
    return this.getLegislativeActivity(id);
  }
  
  async deleteLegislativeActivity(id: number): Promise<boolean> {
    // Delete author relationships first
    await db.delete(legislativeActivitiesAuthors).where(eq(legislativeActivitiesAuthors.activityId, id));
    
    // Delete activity timeline
    await db.delete(activityTimeline).where(eq(activityTimeline.activityId, id));
    
    // Delete activity votes
    await db.delete(activityVotes).where(eq(activityVotes.activityId, id));
    
    // Delete the activity
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
        or(
          eq(documents.id, rootDocId), 
          eq(documents.parentDocumentId, rootDocId)
        )
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
    // Delete related document votes first
    await db.delete(documentVotes).where(eq(documentVotes.documentId, id));
    
    // Delete the document
    const result = await db
      .delete(documents)
      .where(eq(documents.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
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
          isNull(legislativeActivities.approved)
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
    const [attendance] = await db
      .update(eventAttendance)
      .set({
        ...attendanceData,
        updatedAt: new Date(),
      })
      .where(eq(eventAttendance.id, id))
      .returning();
    
    return attendance;
  }
  
  async deleteEventAttendance(id: number): Promise<boolean> {
    const result = await db
      .delete(eventAttendance)
      .where(eq(eventAttendance.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  /**
   * Document Votes operations
   */
  async getDocumentVote(id: number): Promise<DocumentVote | undefined> {
    const [vote] = await db.select().from(documentVotes).where(eq(documentVotes.id, id));
    return vote;
  }
  
  async getDocumentVotesByDocumentId(documentId: number): Promise<DocumentVote[]> {
    return await db
      .select()
      .from(documentVotes)
      .where(eq(documentVotes.documentId, documentId));
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
    // Check if vote already exists
    const existingVote = await this.getDocumentVoteByUserAndDocument(
      voteData.userId!,
      voteData.documentId!
    );
    
    if (existingVote) {
      // Update existing vote
      const [updatedVote] = await db
        .update(documentVotes)
        .set({
          vote: voteData.vote!,
          comment: voteData.comment,
          votedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(documentVotes.id, existingVote.id))
        .returning();
      
      return updatedVote;
    } else {
      // Create new vote
      const [newVote] = await db
        .insert(documentVotes)
        .values({
          ...voteData,
          votedAt: new Date(),
        })
        .returning();
      
      return newVote;
    }
  }
  
  async updateDocumentVote(id: number, voteData: Partial<DocumentVote>): Promise<DocumentVote | undefined> {
    const [vote] = await db
      .update(documentVotes)
      .set({
        ...voteData,
        votedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(documentVotes.id, id))
      .returning();
    
    return vote;
  }
  
  async deleteDocumentVote(id: number): Promise<boolean> {
    const result = await db
      .delete(documentVotes)
      .where(eq(documentVotes.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  /**
   * Activity Timeline operations
   */
  async getActivityTimeline(id: number): Promise<ActivityTimeline | undefined> {
    const [timeline] = await db.select().from(activityTimeline).where(eq(activityTimeline.id, id));
    return timeline;
  }
  
  async getActivityTimelineByActivityId(activityId: number): Promise<ActivityTimeline[]> {
    return await db
      .select()
      .from(activityTimeline)
      .where(eq(activityTimeline.activityId, activityId))
      .orderBy(desc(activityTimeline.eventDate));
  }
  
  async createActivityTimeline(timelineData: Partial<ActivityTimeline>): Promise<ActivityTimeline> {
    const [timeline] = await db
      .insert(activityTimeline)
      .values({
        ...timelineData,
        eventDate: timelineData.eventDate || new Date(),
      })
      .returning();
    
    return timeline;
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
      .where(eq(activityVotes.activityId, activityId));
    
    return votes.map(v => ({
      ...v.vote,
      user: v.user,
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
    // Check if vote already exists
    const existingVote = await this.getActivityVoteByUserAndActivity(
      voteData.userId!,
      voteData.activityId!
    );
    
    if (existingVote) {
      // Update existing vote
      const [updatedVote] = await db
        .update(activityVotes)
        .set({
          vote: voteData.vote,
          comment: voteData.comment,
          updatedAt: new Date(),
        })
        .where(eq(activityVotes.id, existingVote.id))
        .returning();
      
      // Add timeline entry for vote update
      await this.createActivityTimeline({
        activityId: voteData.activityId!,
        eventType: "Votação",
        description: `Voto atualizado: ${voteData.vote ? "Aprovado" : "Reprovado"}`,
        createdBy: voteData.userId!,
      });
      
      return updatedVote;
    } else {
      // Create new vote
      const [newVote] = await db
        .insert(activityVotes)
        .values(voteData)
        .returning();
      
      // Add timeline entry for new vote
      await this.createActivityTimeline({
        activityId: voteData.activityId!,
        eventType: "Votação",
        description: `Novo voto: ${voteData.vote ? "Aprovado" : "Reprovado"}`,
        createdBy: voteData.userId!,
      });
      
      return newVote;
    }
  }
  
  async updateActivityVote(id: number, voteData: Partial<ActivityVote>): Promise<ActivityVote | undefined> {
    const [vote] = await db
      .update(activityVotes)
      .set({
        ...voteData,
        updatedAt: new Date(),
      })
      .where(eq(activityVotes.id, id))
      .returning();
    
    if (vote) {
      // Add timeline entry for vote update
      await this.createActivityTimeline({
        activityId: vote.activityId,
        eventType: "Votação",
        description: `Voto atualizado: ${vote.vote ? "Aprovado" : "Reprovado"}`,
        createdBy: vote.userId,
      });
    }
    
    return vote;
  }
  
  async deleteActivityVote(id: number): Promise<boolean> {
    // Get vote info before deletion
    const vote = await this.getActivityVote(id);
    
    if (vote) {
      // Add timeline entry for vote deletion
      await this.createActivityTimeline({
        activityId: vote.activityId,
        eventType: "Votação",
        description: "Voto removido",
        createdBy: vote.userId,
      });
    }
    
    const result = await db
      .delete(activityVotes)
      .where(eq(activityVotes.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
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
        userId: activityVotes.userId,
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
   * Extended Event operations
   */
  async getEventWithDetails(id: number): Promise<Event & {
    activities: LegislativeActivity[];
    attendance: EventAttendance[];
    documents: Document[];
    legislature: Legislature;
  } | undefined> {
    // Get the event
    const event = await this.getEvent(id);
    
    if (!event) {
      return undefined;
    }
    
    // Get related legislature
    const legislature = await this.getLegislature(event.legislatureId);
    
    if (!legislature) {
      throw new Error(`Legislature not found for event ${id}`);
    }
    
    // Get related activities
    const activities = await db
      .select()
      .from(legislativeActivities)
      .where(eq(legislativeActivities.eventId, id));
    
    // Get activity authors
    const activityIds = activities.map(a => a.id);
    
    let authorsByActivity = new Map<number, User[]>();
    
    if (activityIds.length > 0) {
      const authorsData = await db
        .select({
          activityId: legislativeActivitiesAuthors.activityId,
          author: users,
        })
        .from(legislativeActivitiesAuthors)
        .innerJoin(users, eq(legislativeActivitiesAuthors.userId, users.id))
        .where(inArray(legislativeActivitiesAuthors.activityId, activityIds));
      
      // Group authors by activity ID
      authorsByActivity = authorsData.reduce((map, item) => {
        if (!map.has(item.activityId)) {
          map.set(item.activityId, []);
        }
        map.get(item.activityId)!.push(item.author);
        return map;
      }, new Map<number, User[]>());
    }
    
    // Add authors to activities
    const activitiesWithAuthors = activities.map(activity => ({
      ...activity,
      authors: authorsByActivity.get(activity.id) || [],
    }));
    
    // Get attendance records
    const attendance = await this.getEventAttendanceByEventId(id);
    
    // Get related documents
    const documents = await db
      .select()
      .from(documents)
      .where(eq(documents.eventId, id));
    
    // Return the event with all related details
    return {
      ...event,
      activities: activitiesWithAuthors,
      attendance,
      documents,
      legislature,
    };
  }
  
  /**
   * Search operations
   */
  async searchGlobal(query: string, type?: string): Promise<SearchResult[]> {
    if (!query || query.length < 3) {
      return [];
    }
    
    const searchTerm = `%${query.toLowerCase()}%`;
    const results: SearchResult[] = [];
    
    // Helper function to find highlighted text for search results
    const findHighlight = (text?: string): string | undefined => {
      if (!text) return undefined;
      
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const position = lowerText.indexOf(lowerQuery);
      
      if (position === -1) return undefined;
      
      const start = Math.max(0, position - 30);
      const end = Math.min(text.length, position + query.length + 30);
      let highlight = text.substring(start, end);
      
      if (start > 0) highlight = `...${highlight}`;
      if (end < text.length) highlight = `${highlight}...`;
      
      return highlight;
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
          url: `/users/${user.id}`,
        }))
      );
    }
    
    // Search legislatures if not filtering by type or type is 'legislature'
    if (!type || type === 'all' || type === 'legislature') {
      const legislatureResults = await db
        .select()
        .from(legislatures)
        .where(like(sql`CAST(${legislatures.number} AS TEXT)`, searchTerm))
        .limit(10);
      
      results.push(
        ...legislatureResults.map(legislature => ({
          id: legislature.id,
          title: `Legislatura ${legislature.number}`,
          description: `${new Date(legislature.startDate).toLocaleDateString()} - ${new Date(legislature.endDate).toLocaleDateString()}`,
          type: 'legislature',
          url: `/legislatures/${legislature.id}`,
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
            like(sql`LOWER(${events.description})`, searchTerm),
            like(sql`LOWER(${events.location})`, searchTerm),
            like(sql`LOWER(${events.category})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...eventResults.map(event => ({
          id: event.id,
          title: `${event.category} - ${new Date(event.eventDate).toLocaleDateString()}`,
          description: event.description,
          type: 'event',
          date: event.eventDate.toISOString(),
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
            like(sql`LOWER(${legislativeActivities.description})`, searchTerm),
            like(sql`LOWER(${legislativeActivities.activityType})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...activityResults.map(activity => ({
          id: activity.id,
          title: `${activity.activityType} - ${activity.activityNumber}`,
          description: activity.description,
          type: 'activity',
          date: activity.activityDate.toISOString(),
          status: activity.approved === true 
            ? "Aprovado" 
            : activity.approved === false 
              ? "Reprovado" 
              : "Pendente",
          category: activity.activityType,
          url: `/legislative-activities/${activity.id}`,
          highlight: findHighlight(activity.description),
        }))
      );
    }
    
    // Search committees if not filtering by type or type is 'committee'
    if (!type || type === 'all' || type === 'committee') {
      const committeeResults = await db
        .select()
        .from(committees)
        .where(
          or(
            like(sql`LOWER(${committees.name})`, searchTerm),
            like(sql`LOWER(${committees.description})`, searchTerm),
            like(sql`LOWER(${committees.type})`, searchTerm)
          )
        )
        .limit(10);
      
      results.push(
        ...committeeResults.map(committee => ({
          id: committee.id,
          title: committee.name,
          description: committee.description,
          type: 'committee' as const,
          status: committee.active ? "Ativa" : "Inativa",
          category: committee.type,
          url: `/committees/${committee.id}`,
          highlight: findHighlight(committee.description),
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