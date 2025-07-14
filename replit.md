# CEDOI Madurai Forum - Meeting Management System

## Overview

This is a mobile-first Progressive Web Application (PWA) designed for the CEDOI Madurai Forum to simplify meeting scheduling, attendance marking, and reporting. The application serves two main user roles: Sonai (meeting organizer) and Chairman (meeting oversight and reporting).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **PWA Features**: Service worker, web app manifest, offline capabilities

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Authentication**: Mock Firebase Auth implementation (email + OTP)
- **API Design**: RESTful endpoints with JSON responses
- **Development**: Vite for development server and HMR

### Build System
- **Bundler**: Vite for frontend, esbuild for backend
- **Development**: Hot module replacement with Vite
- **Production**: Static file serving with Express

## Key Components

### Authentication System
- **Mock Firebase Auth**: Simulated email/OTP authentication
- **User Context**: React context for authentication state
- **Storage**: localStorage for user session persistence
- **User Roles**: 'sonai' (organizer) and 'chairman' (oversight)

### Meeting Management
- **Meeting Creation**: Sonai can schedule meetings with agenda and recurring options
- **Venue**: Default venue set to "Mariat Hotel, Madurai"
- **Attendance Tracking**: Real-time attendance marking during meetings
- **Meeting States**: Active/inactive meetings with date-based filtering

### Data Layer
- **Database Schema**: Users, meetings, and attendance records
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod schemas for type-safe data validation
- **Storage Interface**: Abstracted storage layer with in-memory fallback

### User Interface
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Material Design**: Google Material Design inspired with custom branding
- **Brand Colors**: Navy blue (#04004B) primary, orange (#EB8A2F) accent
- **Navigation**: Bottom navigation bar for mobile-friendly access
- **Components**: Reusable UI components built on Radix UI primitives

## Data Flow

1. **Authentication Flow**:
   - User enters email → OTP sent (mock) → OTP verification → User session created
   - Authentication state managed through React context
   - Session persisted in localStorage

2. **Meeting Creation Flow**:
   - Sonai creates meeting → Validated with Zod → Stored in database
   - Meeting appears in dashboard → Available for attendance marking

3. **Attendance Flow**:
   - Meeting selected → User list displayed → Attendance status toggled
   - Real-time updates to database → Statistics calculated

4. **Reporting Flow**:
   - Chairman accesses reports → Attendance statistics aggregated
   - Export functionality for PDF/CSV reports (planned)

## External Dependencies

### UI and Styling
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Google Fonts**: Inter font family and Material Icons

### Data and State Management
- **React Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **Zod**: Runtime type validation
- **React Hook Form**: Form state management with validation

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production

### Database
- **Neon Database**: Serverless PostgreSQL provider
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with HMR
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **Asset Serving**: Static assets served by Vite in development

### Production
- **Build Process**: 
  - Frontend: Vite build → Static files in dist/public
  - Backend: esbuild → Single JavaScript file in dist/
- **Server**: Express.js serving static files and API routes
- **Database**: PostgreSQL with Drizzle migrations
- **PWA**: Service worker for offline functionality and caching

### Environment Configuration
- **Database**: DATABASE_URL environment variable required
- **Firebase**: Mock configuration with environment variables for future integration
- **Build**: NODE_ENV determines development/production behavior

### Progressive Web App Features
- **Manifest**: Web app manifest for installation
- **Service Worker**: Caching strategy for offline functionality
- **Icons**: PWA icons for various device sizes
- **Mobile Optimization**: Viewport meta tags and mobile-specific styling