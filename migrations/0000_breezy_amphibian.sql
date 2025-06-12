CREATE TABLE "activity_timeline" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"event_type" varchar NOT NULL,
	"description" text NOT NULL,
	"created_by" varchar NOT NULL,
	"event_date" timestamp DEFAULT now(),
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"vote" boolean NOT NULL,
	"voted_at" timestamp DEFAULT now(),
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "committee_members" (
	"committee_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar DEFAULT 'member',
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "committee_members_committee_id_user_id_pk" PRIMARY KEY("committee_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "committees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"description" text NOT NULL,
	"type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"vote" varchar NOT NULL,
	"voted_at" timestamp DEFAULT now(),
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_number" integer NOT NULL,
	"document_type" varchar NOT NULL,
	"document_date" timestamp NOT NULL,
	"author_type" varchar NOT NULL,
	"description" text NOT NULL,
	"file_path" varchar,
	"file_name" varchar,
	"file_type" varchar,
	"status" varchar NOT NULL,
	"activity_id" integer,
	"event_id" integer,
	"parent_document_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"registered_at" timestamp DEFAULT now(),
	"registered_by" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_number" integer NOT NULL,
	"event_date" timestamp NOT NULL,
	"event_time" varchar NOT NULL,
	"location" varchar NOT NULL,
	"map_url" varchar,
	"category" varchar NOT NULL,
	"legislature_id" integer NOT NULL,
	"description" text NOT NULL,
	"status" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legislative_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_number" integer NOT NULL,
	"activity_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"event_id" integer NOT NULL,
	"activity_type" varchar NOT NULL,
	"file_path" varchar,
	"file_name" varchar,
	"file_type" varchar,
	"needs_approval" boolean DEFAULT false,
	"approved" boolean,
	"approved_by" varchar,
	"approved_at" timestamp,
	"approval_comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legislative_activities_authors" (
	"activity_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	CONSTRAINT "legislative_activities_authors_activity_id_user_id_pk" PRIMARY KEY("activity_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "legislatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "legislatures_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"category_id" integer NOT NULL,
	"published_at" timestamp,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"image_url" varchar,
	"meta_title" varchar(255),
	"meta_description" text,
	"tags" text[],
	"gallery" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "news_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "news_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#6B7280',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "news_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "news_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "news_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"author_email" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"profile_image_url" varchar,
	"cpf" varchar,
	"birth_date" timestamp,
	"zip_code" varchar,
	"address" varchar,
	"neighborhood" varchar,
	"number" varchar,
	"city" varchar,
	"state" varchar,
	"role" varchar DEFAULT 'councilor' NOT NULL,
	"legislature_id" integer,
	"marital_status" varchar,
	"occupation" varchar,
	"education" varchar,
	"partido" varchar,
	"password" varchar,
	"email_verified" boolean DEFAULT false,
	"verification_token" varchar,
	"email_verification_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");