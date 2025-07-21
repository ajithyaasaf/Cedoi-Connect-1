import { z } from "zod";

// Pure TypeScript interfaces for Firestore - no Drizzle dependency
export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string; // 'sonai', 'chairman', or 'member'
  qrCode: string | null;
  createdAt: Date | null;
}

export interface Meeting {
  id: string;
  date: Date;
  endTime: Date | null;
  venue: string;
  theme: string | null; // Changed from 'agenda' to 'theme'
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

// Zod schemas for form validation (if needed)
export const userValidationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  company: z.string().min(1),
  role: z.enum(['sonai', 'chairman', 'member']),
  qrCode: z.string().nullable().optional(),
});

export const meetingValidationSchema = z.object({
  date: z.date(),
  endTime: z.date().nullable().optional(),
  venue: z.string().min(1),
  theme: z.string().nullable().optional(), // Changed from 'agenda' to 'theme'
  createdBy: z.string(),
  repeatWeekly: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const attendanceValidationSchema = z.object({
  meetingId: z.string(),
  userId: z.string(),
  status: z.enum(['present', 'absent']),
});
