import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  integer,
  boolean,
  json,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tipo de resultado de busca
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

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  name: varchar("name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  cpf: varchar("cpf").unique(),
  birthDate: timestamp("birth_date"),
  zipCode: varchar("zip_code"),
  address: varchar("address"),
  neighborhood: varchar("neighborhood"),
  number: varchar("number"),
  city: varchar("city"),
  state: varchar("state"),
  role: varchar("role").default("councilor").notNull(), // "admin" or "councilor"
  legislatureId: integer("legislature_id"),
  maritalStatus: varchar("marital_status"),
  occupation: varchar("occupation"),
  education: varchar("education"),
  password: varchar("password"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token"),
  emailVerificationSentAt: timestamp("email_verification_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  legislature: one(legislatures, {
    fields: [users.legislatureId],
    references: [legislatures.id],
  }),
  authoredActivities: many(legislativeActivitiesAuthors),
}));

// Legislature table
export const legislatures = pgTable("legislatures", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const legislaturesRelations = relations(legislatures, ({ many }) => ({
  users: many(users),
  events: many(events),
}));

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  eventNumber: integer("event_number").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventTime: varchar("event_time").notNull(),
  location: varchar("location").notNull(),
  mapUrl: varchar("map_url"),
  category: varchar("category").notNull(), // "Sessão Ordinária" or "Sessão Extraordinária"
  legislatureId: integer("legislature_id").notNull(),
  description: text("description").notNull(),
  status: varchar("status").notNull(), // "Aberto", "Andamento", "Concluido", "Cancelado"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  legislature: one(legislatures, {
    fields: [events.legislatureId],
    references: [legislatures.id],
  }),
  activities: many(legislativeActivities),
  documents: many(documents, { relationName: "event_documents" }),
}));

// Legislative Activities table
export const legislativeActivities = pgTable("legislative_activities", {
  id: serial("id").primaryKey(),
  activityNumber: integer("activity_number").notNull(),
  activityDate: timestamp("activity_date").notNull(),
  description: text("description").notNull(),
  eventId: integer("event_id").notNull(),
  activityType: varchar("activity_type").notNull(), // "Pauta", "Indicação", "Requerimento", "Resolução", "Mensagem", "Moção", "Projeto de Lei"
  filePath: varchar("file_path"),
  fileName: varchar("file_name"),
  fileType: varchar("file_type"),
  needsApproval: boolean("needs_approval").default(false),
  approved: boolean("approved"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  approvalComment: text("approval_comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const legislativeActivitiesRelations = relations(legislativeActivities, ({ one, many }) => ({
  event: one(events, {
    fields: [legislativeActivities.eventId],
    references: [events.id],
  }),
  authors: many(legislativeActivitiesAuthors),
  documents: many(documents, {
    relationName: "activity_documents",
  }),
  votes: many(activityVotes),
}));

// Legislative Activities Authors (many-to-many)
export const legislativeActivitiesAuthors = pgTable(
  "legislative_activities_authors",
  {
    activityId: integer("activity_id").notNull(),
    userId: varchar("user_id").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.activityId, table.userId] }),
  }),
);

export const legislativeActivitiesAuthorsRelations = relations(
  legislativeActivitiesAuthors,
  ({ one }) => ({
    activity: one(legislativeActivities, {
      fields: [legislativeActivitiesAuthors.activityId],
      references: [legislativeActivities.id],
    }),
    user: one(users, {
      fields: [legislativeActivitiesAuthors.userId],
      references: [users.id],
    }),
  }),
);

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentNumber: integer("document_number").notNull(),
  documentType: varchar("document_type").notNull(), // "Pauta", "Decreto", "Decreto Legislativo", "Lei Complementar", "Oficio"
  documentDate: timestamp("document_date").notNull(),
  authorType: varchar("author_type").notNull(), // "Legislativo", "Executivo"
  description: text("description").notNull(),
  filePath: varchar("file_path"),
  fileName: varchar("file_name"),
  fileType: varchar("file_type"),
  status: varchar("status").notNull(), // "Vigente", "Revogada", "Alterada", "Suspenso"
  activityId: integer("activity_id"), // Related legislative activity (optional)
  eventId: integer("event_id"), // Related event (optional)
  parentDocumentId: integer("parent_document_id"), // For document versioning
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  activity: one(legislativeActivities, {
    fields: [documents.activityId],
    references: [legislativeActivities.id],
    relationName: "activity_documents",
  }),
  event: one(events, {
    fields: [documents.eventId],
    references: [events.id],
    relationName: "event_documents",
  }),
  parentDocument: one(documents, {
    fields: [documents.parentDocumentId],
    references: [documents.id],
  }),
  childDocuments: many(documents, {
    relationName: "document_versions",
  }),
  votes: many(documentVotes),
}));

// Document Votes table - For councilors to vote on documents
export const documentVotes = pgTable("document_votes", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: varchar("user_id").notNull(),
  vote: varchar("vote").notNull(), // "Aprovado" or "Reprovado"
  votedAt: timestamp("voted_at").defaultNow(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentVotesRelations = relations(documentVotes, ({ one }) => ({
  document: one(documents, {
    fields: [documentVotes.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentVotes.userId],
    references: [users.id],
  }),
}));

// Event Attendance table - To track councilor attendance at events
export const eventAttendance = pgTable("event_attendance", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull(), // "Presente" or "Ausente"
  registeredAt: timestamp("registered_at").defaultNow(),
  registeredBy: varchar("registered_by").notNull(), // Admin user who registered attendance
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventAttendanceRelations = relations(eventAttendance, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendance.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventAttendance.userId],
    references: [users.id],
  }),
  registrar: one(users, {
    fields: [eventAttendance.registeredBy],
    references: [users.id],
  }),
}));

// Activity Timeline table - To track activity changes and status updates
export const activityTimeline = pgTable("activity_timeline", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  eventType: varchar("event_type").notNull(), // "Criação", "Atualização", "Votação", "Aprovação", "Reprovação"
  description: text("description").notNull(),
  createdBy: varchar("created_by").notNull(),
  eventDate: timestamp("event_date").defaultNow(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityTimelineRelations = relations(activityTimeline, ({ one }) => ({
  activity: one(legislativeActivities, {
    fields: [activityTimeline.activityId],
    references: [legislativeActivities.id],
  }),
  user: one(users, {
    fields: [activityTimeline.createdBy],
    references: [users.id],
  }),
}));

// Activity Votes table - Para rastrear votos de vereadores em atividades legislativas
export const activityVotes = pgTable("activity_votes", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  userId: varchar("user_id").notNull(),
  vote: varchar("vote").notNull(), // "Aprovado" ou "Reprovado"
  votedAt: timestamp("voted_at").defaultNow(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityVotesRelations = relations(activityVotes, ({ one }) => ({
  activity: one(legislativeActivities, {
    fields: [activityVotes.activityId],
    references: [legislativeActivities.id],
  }),
  user: one(users, {
    fields: [activityVotes.userId],
    references: [users.id],
  }),
}));

// Dashboard Stats View (for quick dashboard data retrieval)
export type DashboardStats = {
  legislatureCount: number;
  activeEventCount: number;
  pendingActivityCount: number;
  documentCount: number;
};

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  cpf: true,
  birthDate: true,
  zipCode: true,
  address: true,
  neighborhood: true,
  number: true,
  city: true,
  state: true,
  role: true,
  legislatureId: true,
  maritalStatus: true,
  occupation: true,
  education: true,
  password: true,
});

export const insertLegislatureSchema = createInsertSchema(legislatures).pick({
  number: true,
  startDate: true, 
  endDate: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  eventNumber: true,
  eventDate: true,
  eventTime: true,
  location: true,
  mapUrl: true,
  category: true,
  legislatureId: true,
  description: true,
  status: true,
});

export const insertLegislativeActivitySchema = createInsertSchema(legislativeActivities).pick({
  activityNumber: true,
  activityDate: true,
  description: true,
  eventId: true,
  activityType: true,
  needsApproval: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  documentNumber: true,
  documentType: true,
  documentDate: true,
  authorType: true,
  description: true,
  status: true,
  activityId: true,
  parentDocumentId: true,
});

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertLegislature = z.infer<typeof insertLegislatureSchema>;
export type Legislature = typeof legislatures.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertLegislativeActivity = z.infer<typeof insertLegislativeActivitySchema>;
export type LegislativeActivity = typeof legislativeActivities.$inferSelect & {
  authors?: User[];
};

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const insertDocumentVoteSchema = createInsertSchema(documentVotes).pick({
  documentId: true,
  userId: true,
  vote: true,
  comment: true,
});
export type InsertDocumentVote = z.infer<typeof insertDocumentVoteSchema>;
export type DocumentVote = typeof documentVotes.$inferSelect;

export const insertEventAttendanceSchema = createInsertSchema(eventAttendance).pick({
  eventId: true,
  userId: true,
  status: true,
  registeredBy: true,
  notes: true,
});
export type InsertEventAttendance = z.infer<typeof insertEventAttendanceSchema>;
export type EventAttendance = typeof eventAttendance.$inferSelect;

export const insertActivityTimelineSchema = createInsertSchema(activityTimeline).pick({
  activityId: true,
  eventType: true,
  description: true,
  createdBy: true,
  metadata: true,
});
export type InsertActivityTimeline = z.infer<typeof insertActivityTimelineSchema>;
export type ActivityTimeline = typeof activityTimeline.$inferSelect;

export const insertActivityVoteSchema = createInsertSchema(activityVotes).pick({
  activityId: true,
  userId: true,
  vote: true,
  comment: true,
});
export type InsertActivityVote = z.infer<typeof insertActivityVoteSchema>;
export type ActivityVote = typeof activityVotes.$inferSelect;
