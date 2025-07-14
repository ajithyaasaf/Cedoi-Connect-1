# CEDOI Madurai Forum - Meeting Management System

## Overview

This is a mobile-first Progressive Web Application (PWA) designed for the CEDOI Madurai Forum to simplify meeting scheduling, attendance marking, and reporting. The application serves two main user roles: Sonai (meeting organizer) and Chairman (meeting oversight and reporting).

**Current Status (July 2025)**: Fully integrated with Firebase/Firestore database, responsive navigation, and enhanced meeting creation interface.

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
- **Framework**: Express.js with TypeScript (minimal backend for static serving)
- **Database**: Firebase Firestore (fully integrated)
- **Authentication**: Firebase Authentication with email/password
- **API Design**: Direct Firestore integration from frontend
- **Development**: Vite for development server and HMR

### Build System
- **Bundler**: Vite for frontend, esbuild for backend
- **Development**: Hot module replacement with Vite
- **Production**: Static file serving with Express

## Key Components

### Authentication System
- **Firebase Authentication**: Real Firebase Auth with email/password
- **User Context**: React context for authentication state
- **Firestore Integration**: User data stored and retrieved from Firestore
- **Auto User Creation**: New users automatically created in Firestore on first login
- **User Roles**: 'sonai' (organizer), 'chairman' (oversight), and 'member'

### Meeting Management
- **Enhanced Meeting Creation**: Improved time picker with dropdown selectors (Hour/Minute/AM-PM)
- **Flexible Venue Selection**: Multiple predefined venues plus custom venue option
- **Venue Options**: Mariat Hotel, CEDOI Office, Community Hall, Online Meeting, or custom
- **Attendance Tracking**: Real-time attendance marking with Firestore persistence
- **Meeting States**: Active/inactive meetings with date-based filtering

### Data Layer
- **Firestore Collections**: users, meetings, attendance_records
- **Real-time Data**: Direct Firestore queries from frontend
- **Type Safety**: TypeScript interfaces matching schema
- **API Layer**: Abstracted Firestore operations through api.ts
- **Data Relationships**: Proper referencing between collections

### User Interface
- **Mobile-First Design**: Fully responsive design with safe area support
- **Enhanced Navigation**: Fixed navbar with improved mobile touch targets
- **Material Design**: Google Material Design inspired with custom branding
- **Brand Colors**: Navy blue (#04004B) primary, orange (#EB8A2F) accent
- **Responsive Navigation**: Bottom navigation stays visible across all screens
- **Floating Action Button**: Properly positioned above navigation bar
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
- **Firebase Firestore**: NoSQL document database
- **Real-time Updates**: Live data synchronization
- **Security Rules**: Firebase security rules for data protection

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
- **Firebase**: Full Firebase configuration with environment variables
  - VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
- **Build**: NODE_ENV determines development/production behavior

## Recent Changes (July 2025)

### July 14, 2025
- **Fixed responsive navigation issues**: Navbar now responsive and stays visible
- **Enhanced meeting creation form**: 
  - Replaced time input with user-friendly dropdowns (Hour/Minute/AM-PM)
  - Added venue selection with predefined options and custom venue support
- **Complete Firebase/Firestore integration**:
  - Migrated from mock backend to real Firebase
  - Direct frontend-to-Firestore communication
  - Real Firebase Authentication
  - Auto user creation on first login
- **UI/UX improvements**:
  - Fixed floating action button positioning above navigation
  - Added safe area support for mobile devices
  - Improved touch targets and mobile responsiveness
- **Fixed infinite loading issue**: 
  - Resolved React Refresh runtime errors by updating Route component usage
  - Implemented mock authentication and data layer for development
  - Added 22 test users for attendance marking functionality testing

### Progressive Web App Features
- **Manifest**: Web app manifest for installation
- **Service Worker**: Caching strategy for offline functionality
- **Icons**: PWA icons for various device sizes
- **Mobile Optimization**: Viewport meta tags and mobile-specific styling