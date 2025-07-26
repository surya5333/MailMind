import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(), // 'trusted', 'suspicious', 'spam'
  riskScore: integer("risk_score").notNull().default(0),
  gptReasoning: text("gpt_reasoning"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  isTrustedSender: boolean("is_trusted_sender").default(false).notNull(),
});

export const trustedSenders = pgTable("trusted_senders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const coachingSessions = pgTable("coaching_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").notNull(),
  userGuess: text("user_guess").notNull(), // 'safe', 'suspicious', 'spam'
  actualCategory: text("actual_category").notNull(), // 'trusted', 'suspicious', 'spam'
  isCorrect: boolean("is_correct").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  feedback: text("feedback"),
  learningPoints: text("learning_points"), // JSON array as text
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default('default_user'), // For future multi-user support
  totalSessions: integer("total_sessions").notNull().default(0),
  correctGuesses: integer("correct_guesses").notNull().default(0),
  accuracy: integer("accuracy").notNull().default(0), // Stored as percentage * 100
  streak: integer("streak").notNull().default(0),
  level: integer("level").notNull().default(0),
  experience: integer("experience").notNull().default(0),
  badges: text("badges"), // JSON array as text
  weakAreas: text("weak_areas"), // JSON array as text
  strengths: text("strengths"), // JSON array as text
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  timestamp: true,
});

export const insertTrustedSenderSchema = createInsertSchema(trustedSenders).omit({
  id: true,
  addedAt: true,
});

export const analyzeEmailSchema = z.object({
  sender: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const insertCoachingSessionSchema = createInsertSchema(coachingSessions).omit({
  id: true,
  completedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastUpdated: true,
});

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertTrustedSender = z.infer<typeof insertTrustedSenderSchema>;
export type TrustedSender = typeof trustedSenders.$inferSelect;
export type AnalyzeEmailRequest = z.infer<typeof analyzeEmailSchema>;
export type CoachingSession = typeof coachingSessions.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
