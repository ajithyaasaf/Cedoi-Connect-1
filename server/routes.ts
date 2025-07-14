import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMeetingSchema, insertAttendanceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // For demo purposes, we'll use simple password validation
      // In production, use proper password hashing (bcrypt, etc.)
      const validPasswords = {
        "sonai@cedoi.com": "sonai123",
        "chairman@cedoi.com": "chairman123",
        "priya@cedoi.com": "priya123",
        "rajesh@cedoi.com": "rajesh123"
      };

      if (validPasswords[email as keyof typeof validPasswords] !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Meeting routes
  app.get("/api/meetings", async (req, res) => {
    try {
      const meetings = await storage.getAllMeetings();
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get("/api/meetings/today", async (req, res) => {
    try {
      const meeting = await storage.getTodaysMeeting();
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's meeting" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const meetingData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(meetingData);
      res.json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meeting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.get("/api/meetings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const meeting = await storage.getMeeting(id);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meeting" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/:meetingId", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const attendance = await storage.getAttendanceForMeeting(meetingId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.put("/api/attendance/:meetingId/:userId", async (req, res) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const userId = parseInt(req.params.userId);
      const { status } = req.body;

      if (!status || !['present', 'absent'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'present' or 'absent'" });
      }

      const attendance = await storage.updateAttendance(meetingId, userId, status);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getAttendanceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getAttendanceStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
