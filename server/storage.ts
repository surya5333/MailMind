import { type Email, type InsertEmail, type TrustedSender, type InsertTrustedSender } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private emails: Map<string, Email>;
  private trustedSenders: Map<string, TrustedSender>;

  constructor() {
    this.emails = new Map();
    this.trustedSenders = new Map();
    this.initializeDefaultTrustedSenders();
  }

  private initializeDefaultTrustedSenders() {
    // Add some default trusted senders
    const defaultSenders = [
      { email: "mentor@university.edu", name: "Dr. Smith" },
      { email: "sarah.johnson@company.com", name: "Sarah Johnson" },
      { email: "billing@services.com", name: "Billing Department" },
    ];

    defaultSenders.forEach(sender => {
      const id = randomUUID();
      const trustedSender: TrustedSender = {
        ...sender,
        id,
        addedAt: new Date(),
      };
      this.trustedSenders.set(id, trustedSender);
    });
  }

  async getEmails(): Promise<Email[]> {
    return Array.from(this.emails.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getEmailById(id: string): Promise<Email | undefined> {
    return this.emails.get(id);
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = randomUUID();
    const email: Email = {
      ...insertEmail,
      id,
      timestamp: new Date(),
      riskScore: insertEmail.riskScore || 0,
      gptReasoning: insertEmail.gptReasoning || null,
      isBlocked: insertEmail.isBlocked || false,
    };
    this.emails.set(id, email);
    return email;
  }

  async updateEmail(id: string, emailUpdate: Partial<Email>): Promise<Email | undefined> {
    const existingEmail = this.emails.get(id);
    if (!existingEmail) return undefined;

    const updatedEmail = { ...existingEmail, ...emailUpdate };
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }

  async deleteEmail(id: string): Promise<boolean> {
    return this.emails.delete(id);
  }

  async getTrustedSenders(): Promise<TrustedSender[]> {
    return Array.from(this.trustedSenders.values()).sort((a, b) => 
      a.email.localeCompare(b.email)
    );
  }

  async getTrustedSenderByEmail(email: string): Promise<TrustedSender | undefined> {
    return Array.from(this.trustedSenders.values()).find(
      sender => sender.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createTrustedSender(insertSender: InsertTrustedSender): Promise<TrustedSender> {
    const id = randomUUID();
    const sender: TrustedSender = {
      ...insertSender,
      id,
      addedAt: new Date(),
      name: insertSender.name || null,
    };
    this.trustedSenders.set(id, sender);
    return sender;
  }

  async deleteTrustedSender(id: string): Promise<boolean> {
    return this.trustedSenders.delete(id);
  }

  async getEmailStats(): Promise<{
    total: number;
    trusted: number;
    suspicious: number;
    spam: number;
    avgRiskScore: number;
  }> {
    const emails = Array.from(this.emails.values());
    const total = emails.length;
    
    if (total === 0) {
      return { total: 0, trusted: 0, suspicious: 0, spam: 0, avgRiskScore: 0 };
    }

    const trusted = emails.filter(e => e.category === 'trusted').length;
    const suspicious = emails.filter(e => e.category === 'suspicious').length;
    const spam = emails.filter(e => e.category === 'spam').length;
    
    const totalRiskScore = emails.reduce((sum, email) => sum + email.riskScore, 0);
    const avgRiskScore = Math.round(totalRiskScore / total);

    return { total, trusted, suspicious, spam, avgRiskScore };
  }
}

export const storage = new MemStorage();
