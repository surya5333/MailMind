import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeEmailSchema, insertTrustedSenderSchema } from "@shared/schema";
import { analyzeEmailWithGPT } from "./services/openai";
import { classifyEmailWithML } from "./services/mlClassifier";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Email analysis endpoint
  app.post("/api/emails/analyze", async (req, res) => {
    try {
      const { sender, subject, body } = analyzeEmailSchema.parse(req.body);
      
      // Check if sender is trusted
      const trustedSender = await storage.getTrustedSenderByEmail(sender);
      const isTrusted = !!trustedSender;

      // Get ML classification
      const mlResult = classifyEmailWithML(sender, subject, body);
      
      // Get GPT analysis
      const gptResult = await analyzeEmailWithGPT(sender, subject, body, isTrusted);

      // Combine results - GPT takes precedence for final category
      const finalCategory = isTrusted ? 'trusted' : gptResult.category;
      const finalRiskScore = isTrusted ? Math.min(gptResult.phishingRiskScore, 15) : 
                            Math.max(mlResult.riskScore, gptResult.phishingRiskScore);

      // Save email to storage
      const email = await storage.createEmail({
        sender,
        subject,
        body,
        category: finalCategory,
        riskScore: finalRiskScore,
        gptReasoning: gptResult.reasoning,
        isBlocked: finalCategory === 'spam'
      });

      res.json({
        email,
        analysis: {
          mlResult,
          gptResult,
          isTrustedSender: isTrusted
        }
      });
    } catch (error) {
      console.error("Email analysis error:", error);
      res.status(400).json({ 
        message: error instanceof z.ZodError ? "Invalid email data" : "Analysis failed"
      });
    }
  });

  // Get all emails
  app.get("/api/emails", async (req, res) => {
    try {
      const emails = await storage.getEmails();
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  // Get email by ID
  app.get("/api/emails/:id", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email" });
    }
  });

  // Delete email
  app.delete("/api/emails/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmail(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json({ message: "Email deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  // Get trusted senders
  app.get("/api/trusted-senders", async (req, res) => {
    try {
      const senders = await storage.getTrustedSenders();
      res.json(senders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trusted senders" });
    }
  });

  // Add trusted sender
  app.post("/api/trusted-senders", async (req, res) => {
    try {
      const senderData = insertTrustedSenderSchema.parse(req.body);
      
      // Check if sender already exists
      const existing = await storage.getTrustedSenderByEmail(senderData.email);
      if (existing) {
        return res.status(400).json({ message: "Sender already trusted" });
      }

      const sender = await storage.createTrustedSender(senderData);
      res.status(201).json(sender);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof z.ZodError ? "Invalid sender data" : "Failed to add trusted sender"
      });
    }
  });

  // Remove trusted sender
  app.delete("/api/trusted-senders/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrustedSender(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Trusted sender not found" });
      }
      res.json({ message: "Trusted sender removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove trusted sender" });
    }
  });

  // Get email statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getEmailStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
