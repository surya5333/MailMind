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

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertTrustedSender = z.infer<typeof insertTrustedSenderSchema>;
export type TrustedSender = typeof trustedSenders.$inferSelect;
export type AnalyzeEmailRequest = z.infer<typeof analyzeEmailSchema>;
