-- Add lead_status enum
CREATE TYPE "lead_status" AS ENUM('novo', 'contactado', 'comprou', 'abandonou', 'upsell');

-- Extend leads table with new columns
ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "email" varchar(255),
  ADD COLUMN IF NOT EXISTS "province" varchar(100),
  ADD COLUMN IF NOT EXISTS "quiz_profile" varchar(50),
  ADD COLUMN IF NOT EXISTS "status" "lead_status" DEFAULT 'novo' NOT NULL,
  ADD COLUMN IF NOT EXISTS "notes" varchar(500);

-- Quiz submissions table
CREATE TABLE IF NOT EXISTS "quiz_submissions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "lead_id" integer,
  "phone" varchar(20) NOT NULL,
  "answers" jsonb NOT NULL,
  "scores" jsonb NOT NULL,
  "profile" varchar(50) NOT NULL,
  "profile_title" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Funnel content CMS table
CREATE TABLE IF NOT EXISTS "funnel_content" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "page_type" varchar(50) NOT NULL,
  "section_key" varchar(100) NOT NULL,
  "content" text,
  "metadata" jsonb,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE("page_type", "section_key")
);

-- Member area content table
CREATE TABLE IF NOT EXISTS "member_content" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "module" varchar(100) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" varchar(500),
  "type" varchar(20) NOT NULL,
  "file_url" varchar(500),
  "video_url" varchar(500),
  "ordem" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
