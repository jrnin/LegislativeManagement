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
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tipo de resultado de busca
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
  partido: varchar("partido"),
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
  videoUrl: varchar("video_url"), // YouTube video link
  category: varchar("category").notNull(), // "Sessão Ordinária", "Sessão Extraordinária", or "Reunião Comissão"
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
  committees: many(eventCommittees),
}));

// Legislative Activities table
export const legislativeActivities = pgTable("legislative_activities", {
  id: serial("id").primaryKey(),
  activityNumber: integer("activity_number").notNull(),
  activityDate: timestamp("activity_date").notNull(),
  description: text("description").notNull(),
  eventId: integer("event_id").notNull(),
  activityType: varchar("activity_type").notNull(), // "Pauta", "Indicação", "Requerimento", "Resolução", "Mensagem", "Moção", "Projeto de Lei"
  situacao: varchar("situacao").notNull().default("Aguardando Análise"), // "Arquivado", "Aguardando Análise", "Análise de Parecer", "Aguardando Deliberação", "Aguardando Despacho do Presidente", "Aguardando Envio ao Executivo", "Devolvida ao Autor", "Pronta para Pauta", "Tramitando em Conjunto", "Tramitação Finalizada", "Vetado"
  regimeTramitacao: varchar("regime_tramitacao").notNull().default("Ordinária"), // "Ordinária", "Urgente"
  filePath: varchar("file_path"),
  fileName: varchar("file_name"),
  fileType: varchar("file_type"),
  approvalType: varchar("approval_type"), // "councilors", "committees", null (no approval needed)
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
  committeeApprovals: many(committeeActivityApprovals),
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

// News Articles table
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  categoryId: integer("category_id").notNull(),
  publishedAt: timestamp("published_at"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
  featured: boolean("featured").default(false),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  imageUrl: varchar("image_url"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  tags: text("tags").array(), // Array of tag strings
  gallery: text("gallery").array(), // Array of image URLs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News Categories table
export const newsCategories = pgTable("news_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6B7280"), // Hex color code
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News Comments table
export const newsComments = pgTable("news_comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  parentId: integer("parent_id"), // For nested comments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  vote: boolean("vote").notNull(), // true para aprovação, false para reprovação
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

// Committee Activity Approvals table - For committee members to approve activities in committee meetings
export const committeeActivityApprovals = pgTable("committee_activity_approvals", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  committeeId: integer("committee_id").notNull(),
  userId: varchar("user_id").notNull(), // Committee member who voted
  vote: varchar("vote").notNull(), // "Aprovado" or "Reprovado"
  votedAt: timestamp("voted_at").defaultNow(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const committeeActivityApprovalsRelations = relations(committeeActivityApprovals, ({ one }) => ({
  activity: one(legislativeActivities, {
    fields: [committeeActivityApprovals.activityId],
    references: [legislativeActivities.id],
  }),
  committee: one(committees, {
    fields: [committeeActivityApprovals.committeeId],
    references: [committees.id],
  }),
  user: one(users, {
    fields: [committeeActivityApprovals.userId],
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
  videoUrl: true,
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
  situacao: true,
  regimeTramitacao: true,
  approvalType: true,
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

// News Articles Relations
export const newsArticlesRelations = relations(newsArticles, ({ one, many }) => ({
  author: one(users, {
    fields: [newsArticles.authorId],
    references: [users.id],
  }),
  category: one(newsCategories, {
    fields: [newsArticles.categoryId],
    references: [newsCategories.id],
  }),
  comments: many(newsComments),
}));

// News Categories Relations
export const newsCategoriesRelations = relations(newsCategories, ({ many }) => ({
  articles: many(newsArticles),
}));

// News Comments Relations
export const newsCommentsRelations = relations(newsComments, ({ one, many }) => ({
  article: one(newsArticles, {
    fields: [newsComments.articleId],
    references: [newsArticles.id],
  }),
  parent: one(newsComments, {
    fields: [newsComments.parentId],
    references: [newsComments.id],
  }),
  replies: many(newsComments),
}));

// News schemas
export const insertNewsArticleSchema = createInsertSchema(newsArticles).pick({
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  authorId: true,
  categoryId: true,
  status: true,
  featured: true,
  imageUrl: true,
  metaTitle: true,
  metaDescription: true,
  tags: true,
  gallery: true,
});

export const insertNewsCategorySchema = createInsertSchema(newsCategories).pick({
  name: true,
  slug: true,
  description: true,
  color: true,
});

export const insertNewsCommentSchema = createInsertSchema(newsComments).pick({
  articleId: true,
  authorName: true,
  authorEmail: true,
  content: true,
  parentId: true,
});

// News type definitions
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect & {
  author?: User;
  category?: NewsCategory;
  comments?: NewsComment[];
};

export type InsertNewsCategory = z.infer<typeof insertNewsCategorySchema>;
export type NewsCategory = typeof newsCategories.$inferSelect & {
  articles?: NewsArticle[];
};

export type InsertNewsComment = z.infer<typeof insertNewsCommentSchema>;
export type NewsComment = typeof newsComments.$inferSelect & {
  article?: NewsArticle;
  parent?: NewsComment;
  replies?: NewsComment[];
};
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

// Committees (Comissões)
export const committees = pgTable("committees", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  description: text("description").notNull(),
  type: varchar("type").notNull(), // "Extraordinária", "Temporária", "Permanente"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Committee Member Roles enum
export const committeeRoles = [
  "Presidente",
  "Vice-Presidente", 
  "Relator",
  "1º Suplente",
  "2º Suplente",
  "3º Suplente",
  "Membro"
] as const;

export type CommitteeRole = typeof committeeRoles[number];

// Committee Members (Membros das Comissões) - many-to-many
export const committeeMembers = pgTable(
  "committee_members",
  {
    committeeId: integer("committee_id").notNull(),
    userId: varchar("user_id").notNull(),
    role: varchar("role").default("Membro").notNull(), // "Presidente", "Vice-Presidente", "Relator", "1º Suplente", "2º Suplente", "3º Suplente", "Membro"
    addedAt: timestamp("added_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.committeeId, table.userId] }),
  }),
);

// Relations for committees  
export const committeesRelations = relations(committees, ({ many }) => ({
  members: many(committeeMembers),
  events: many(eventCommittees),
}));

// Relations for committee members
export const committeeMembersRelations = relations(committeeMembers, ({ one }) => ({
  committee: one(committees, {
    fields: [committeeMembers.committeeId],
    references: [committees.id],
  }),
  user: one(users, {
    fields: [committeeMembers.userId],
    references: [users.id],
  }),
}));

// Event Committees (Eventos e Comissões) - many-to-many
export const eventCommittees = pgTable(
  "event_committees",
  {
    eventId: integer("event_id").notNull(),
    committeeId: integer("committee_id").notNull(),
    addedAt: timestamp("added_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.committeeId] }),
  }),
);

// Relations for event committees
export const eventCommitteesRelations = relations(eventCommittees, ({ one }) => ({
  event: one(events, {
    fields: [eventCommittees.eventId],
    references: [events.id],
  }),
  committee: one(committees, {
    fields: [eventCommittees.committeeId],
    references: [committees.id],
  }),
}));

// Add relation to user for committees
export const usersCommitteesRelation = relations(users, ({ many }) => ({
  committees: many(committeeMembers),
}));

// Insert schema for committees
export const insertCommitteeSchema = createInsertSchema(committees).pick({
  name: true,
  startDate: true,
  endDate: true,
  description: true,
  type: true,
});

export type InsertCommittee = z.infer<typeof insertCommitteeSchema>;
export type Committee = typeof committees.$inferSelect;

// Insert schema for committee members with role validation
export const insertCommitteeMemberSchema = createInsertSchema(committeeMembers).pick({
  committeeId: true,
  userId: true,
  role: true,
}).extend({
  role: z.enum(committeeRoles).default("Membro"),
});

export type InsertCommitteeMember = z.infer<typeof insertCommitteeMemberSchema>;
export type CommitteeMember = typeof committeeMembers.$inferSelect;

// Insert schema for event committees
export const insertEventCommitteeSchema = createInsertSchema(eventCommittees).pick({
  eventId: true,
  committeeId: true,
});

export type InsertEventCommittee = z.infer<typeof insertEventCommitteeSchema>;
export type EventCommittee = typeof eventCommittees.$inferSelect;

// Mesa Diretora (Board) - Tabela principal
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  legislatureId: integer("legislature_id").references(() => legislatures.id).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Definir os cargos disponíveis para Mesa Diretora
export const boardRoles = [
  "Presidente",
  "Vice-Presidente", 
  "1º Secretário(a)",
  "2º Secretário(a)"
] as const;

// Membros da Mesa Diretora - Tabela de relacionamento
export const boardMembers = pgTable("board_members", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relações da Mesa Diretora
export const boardsRelations = relations(boards, ({ one, many }) => ({
  legislature: one(legislatures, {
    fields: [boards.legislatureId],
    references: [legislatures.id],
  }),
  members: many(boardMembers),
}));

export const boardMembersRelations = relations(boardMembers, ({ one }) => ({
  board: one(boards, {
    fields: [boardMembers.boardId],
    references: [boards.id],
  }),
  user: one(users, {
    fields: [boardMembers.userId],
    references: [users.id],
  }),
}));

// Esquemas de inserção para Mesa Diretora
export const insertBoardSchema = createInsertSchema(boards).pick({
  name: true,
  startDate: true,
  endDate: true,
  legislatureId: true,
  description: true,
});

export const insertBoardMemberSchema = createInsertSchema(boardMembers).pick({
  boardId: true,
  userId: true,
  role: true,
}).extend({
  role: z.enum(boardRoles),
});

// Tipos para Mesa Diretora
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boards.$inferSelect & {
  legislature?: Legislature;
  members?: (BoardMember & { user?: User })[];
};

export type InsertBoardMember = z.infer<typeof insertBoardMemberSchema>;
export type BoardMember = typeof boardMembers.$inferSelect & {
  board?: Board;
  user?: User;
};
