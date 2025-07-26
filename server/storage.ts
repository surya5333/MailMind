import { 
  emails, 
  trustedSenders, 
  coachingSessions, 
  userProgress,
  type Email, 
  type InsertEmail, 
  type TrustedSender, 
  type InsertTrustedSender,
  type CoachingSession,
  type UserProgress,
  type InsertCoachingSession,
  type InsertUserProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, avg } from "drizzle-orm";

export interface IStorage {
  // Email operations
  getEmails(): Promise<Email[]>;
  getEmailById(id: string): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: string, email: Partial<Email>): Promise<Email | undefined>;
  deleteEmail(id: string): Promise<boolean>;

  // Trusted sender operations
  getTrustedSenders(): Promise<TrustedSender[]>;
  getTrustedSenderByEmail(email: string): Promise<TrustedSender | undefined>;
  createTrustedSender(sender: InsertTrustedSender): Promise<TrustedSender>;
  deleteTrustedSender(id: string): Promise<boolean>;

  // Stats
  getEmailStats(): Promise<{
    total: number;
    trusted: number;
    suspicious: number;
    spam: number;
    avgRiskScore: number;
  }>;

  // Coaching operations
  createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession>;
  getUserProgress(userId?: string): Promise<UserProgress | undefined>;
  updateUserProgress(userId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  getRandomEmailForTraining(): Promise<Email | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getEmails(): Promise<Email[]> {
    return await db.select().from(emails).orderBy(desc(emails.timestamp));
  }

  async getEmailById(id: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email || undefined;
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db
      .insert(emails)
      .values(insertEmail)
      .returning();
    return email;
  }

  async updateEmail(id: string, emailUpdate: Partial<Email>): Promise<Email | undefined> {
    const [email] = await db
      .update(emails)
      .set(emailUpdate)
      .where(eq(emails.id, id))
      .returning();
    return email || undefined;
  }

  async deleteEmail(id: string): Promise<boolean> {
    const result = await db.delete(emails).where(eq(emails.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTrustedSenders(): Promise<TrustedSender[]> {
    return await db.select().from(trustedSenders).orderBy(trustedSenders.email);
  }

  async getTrustedSenderByEmail(email: string): Promise<TrustedSender | undefined> {
    const [sender] = await db
      .select()
      .from(trustedSenders)
      .where(eq(trustedSenders.email, email));
    return sender || undefined;
  }

  async createTrustedSender(insertSender: InsertTrustedSender): Promise<TrustedSender> {
    const [sender] = await db
      .insert(trustedSenders)
      .values(insertSender)
      .returning();
    return sender;
  }

  async deleteTrustedSender(id: string): Promise<boolean> {
    const result = await db.delete(trustedSenders).where(eq(trustedSenders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getEmailStats(): Promise<{
    total: number;
    trusted: number;
    suspicious: number;
    spam: number;
    avgRiskScore: number;
  }> {
    const emailList = await db.select().from(emails);
    const total = emailList.length;
    
    if (total === 0) {
      return { total: 0, trusted: 0, suspicious: 0, spam: 0, avgRiskScore: 0 };
    }

    const trusted = emailList.filter(e => e.category === 'trusted').length;
    const suspicious = emailList.filter(e => e.category === 'suspicious').length;
    const spam = emailList.filter(e => e.category === 'spam').length;
    
    const totalRiskScore = emailList.reduce((sum, email) => sum + email.riskScore, 0);
    const avgRiskScore = Math.round(totalRiskScore / total);

    return { total, trusted, suspicious, spam, avgRiskScore };
  }

  async createCoachingSession(insertSession: InsertCoachingSession): Promise<CoachingSession> {
    const [session] = await db
      .insert(coachingSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getUserProgress(userId: string = 'default_user'): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    return progress || undefined;
  }

  async updateUserProgress(userId: string, progressUpdate: Partial<InsertUserProgress>): Promise<UserProgress> {
    // Try to update existing record first
    const [existingProgress] = await db
      .update(userProgress)
      .set(progressUpdate)
      .where(eq(userProgress.userId, userId))
      .returning();

    if (existingProgress) {
      return existingProgress;
    }

    // If no existing record, create new one
    const [newProgress] = await db
      .insert(userProgress)
      .values({
        userId,
        ...progressUpdate,
      } as InsertUserProgress)
      .returning();
    
    return newProgress;
  }

  async getRandomEmailForTraining(): Promise<Email | undefined> {
    // Get a random email for training purposes
    const allEmails = await db.select().from(emails);
    if (allEmails.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * allEmails.length);
    return allEmails[randomIndex];
  }
}

export const storage = new DatabaseStorage();
