import { z } from "zod";

// Pure TypeScript interfaces for Firestore - no Drizzle dependency
export interface User {
  id: string;
  email: string;
  name: string;
  role: string; // 'sonai', 'chairman', or 'member'
  qrCode: string | null;
  createdAt: Date | null;
}

export interface Meeting {
  id: string;
  date: Date;
  venue: string;
  agenda: string | null;
  createdBy: string;
  repeatWeekly: boolean;
  isActive: boolean;
  createdAt: Date | null;
}

export interface AttendanceRecord {
  id: string;
  meetingId: string;
  userId: string;
  status: string; // 'present' or 'absent'
  timestamp: Date | null;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['sonai', 'chairman', 'member']),
  qrCode: z.string().nullable().optional(),
});

export const insertMeetingSchema = z.object({
  date: z.date(),
  venue: z.string().min(1),
  agenda: z.string().nullable().optional(),
  createdBy: z.string(),
  repeatWeekly: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const insertAttendanceSchema = z.object({
  meetingId: z.string(),
  userId: z.string(),
  status: z.enum(['present', 'absent']),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
