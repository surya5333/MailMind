import { emails, trustedSenders, type Email, type InsertEmail, type TrustedSender, type InsertTrustedSender } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
