# CEDOI Madurai Forum - Meeting Management System

## Overview

This is a mobile-first Progressive Web Application (PWA) designed for the CEDOI Madurai Forum to simplify meeting scheduling, attendance marking, and reporting. The application serves two main user roles: Chairman (meeting creator) and Sonai (attendance marker).

**Current Status (July 2025)**: Completely integrated with Firebase/Firestore database with fallback support, responsive navigation, and enhanced meeting creation interface. Full Firestore implementation for all data operations.

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
- **User Roles**: 'sonai' (attendance marker), 'chairman' (meeting creator), and 'member'

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
   - Chairman creates meeting → Validated with Zod → Stored in database
   - Meeting appears in dashboard → Available for attendance marking by Sonai

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
- **Database**: Firebase Firestore (or mock data for development)
- **Asset Serving**: Static assets served by Vite in development

### Production
- **Build Process**: 
  - Frontend: Vite build → Static files in dist/public
  - Backend: esbuild → Single JavaScript file in dist/
- **Server**: Express.js serving static files and API routes
- **Database**: Firebase Firestore with real-time updates
- **PWA**: Service worker for offline functionality and caching

### Environment Configuration
- **Firebase**: Full Firebase configuration with environment variables
  - VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
- **Build**: NODE_ENV determines development/production behavior

## Recent Changes (July 2025)

### July 21, 2025 - Member Database Update & Complete App Enhancement ✅ COMPLETED
- **Complete Member Database Replacement**:
  - Removed all existing 22 mock members and replaced with 11 new CEDOI Madurai Forum members
  - Updated member list with real company information:
    - Andrew Ananth (Godivatech), Dr Aafaq (zaara dentistry), Vignesh (Pavin caters)
    - Vignesh (Aloka Events), Imran (MK Trading), Radha Krishnan (Surya Crackers)
    - Mukesh (Tamilnadu Electricals), Shanmuga Pandiyan (Shree Mariamma Group)
    - Muthukumar (PR Systems), Prabu (Cleaning solutions), Jaffer (Spice King)
  - Maintained Sonai and Chairman system users for proper application functionality
  - All new members assigned proper email addresses and QR codes for attendance system
- **Enhanced Reports Page Filters & Member Overview**:
  - Fixed filter functionality with proper time period and meeting-specific filtering
  - Enhanced Member Attendance Overview with ranking system and color-coded performance
  - Added visual progress bars and improved responsive design
  - Simplified interface while maintaining all core functionality
- **Fully Functional Settings Page Implementation**:
  - All settings now persist in localStorage across app sessions
  - Added notification test functionality with browser permission handling
  - Implemented smart cache clearing that preserves user settings
  - Added reset all settings to default functionality
  - Enhanced user account information display with proper theming support

### July 21, 2025 - Replit Migration & Profile/Settings/Help Pages Implementation ✅ COMPLETED
- **Successful Migration from Replit Agent to Replit Environment**:
  - Fixed TypeScript schema inconsistencies (changed `agenda` to `theme` property in Meeting interface)
  - Enhanced Firebase configuration validation and error handling
  - Resolved all LSP diagnostics and type mismatches
  - Verified all packages and dependencies are properly installed
  - Application successfully running on port 5000 with all health checks passing
- **Primary Color Consistency Enhancement**:
  - Updated CSS variables to use proper CEDOI brand colors (navy blue #04004B)
  - Replaced all hardcoded blue color classes with consistent primary color variables
  - Updated ReportsEnhanced, NotificationCenter, AttendanceScreen, LiveAttendanceMonitor, and AttendanceLandingScreen components
  - Ensured consistent branding across all UI elements with proper color scheme
  - Fixed all remaining blue color inconsistencies throughout the application
- **Security and Best Practices**:
  - Maintained client/server separation architecture
  - Firebase integration working with proper fallback to mock data for development
  - All security vulnerabilities addressed with proper environment variable handling
- **Profile, Settings & Help Pages**: 
  - Created comprehensive Profile page with user information editing and role-based permissions display
  - Implemented Settings page with theme toggle, notification preferences, and app behavior controls  
  - Added Help & Support page with FAQ section, contact form, and support information
  - Updated routing in App.tsx to include new pages (/profile, /settings, /help-support)
  - Enhanced MobileAppHeader dropdown menu with functional navigation to new pages
  - All pages follow mobile-first responsive design with proper back navigation
- **Project Status**: Fully migrated and ready for development in Replit environment with complete user management features
- **Successful Migration from Replit Agent to Replit Environment**:
  - Fixed TypeScript schema inconsistencies (changed `agenda` to `theme` property in Meeting interface)
  - Enhanced Firebase configuration validation and error handling
  - Resolved all LSP diagnostics and type mismatches
  - Verified all packages and dependencies are properly installed
  - Application successfully running on port 5000 with all health checks passing
- **Security and Best Practices**:
  - Maintained client/server separation architecture
  - Firebase integration working with proper fallback to mock data for development
  - All security vulnerabilities addressed with proper environment variable handling
- **Project Status**: Fully migrated and ready for development in Replit environment

### July 21, 2025 - Vercel Deployment Fix & Static Build Configuration ✅ COMPLETED
- **Vercel Deployment Resolution**:
  - Fixed Vercel deployment showing raw code instead of application
  - Created proper vercel.json configuration for React SPA deployment
  - Updated build process to output static files for Vercel hosting
  - Fixed component import path resolution for production builds
  - Added proper PWA assets (manifest.json, icons) for deployment
- **Build System Updates**:
  - Configured static-only build for Vercel (vite build)
  - Updated output directory to dist/public for proper serving
  - Added SPA routing configuration with proper rewrites
  - Enhanced PWA manifest with proper icon references
- **Deployment Architecture**:
  - React SPA with Firebase backend (no Express server needed)
  - Static hosting on Vercel with client-side routing
  - Firebase Firestore for all data operations
  - Environment variables properly configured for production
- **Deployment Status**: Successfully deployed at https://cedoi-connect-1.vercel.app/

### July 21, 2025 - Flexible Meeting Time Input & Enhanced Loading Experience
- **Flexible Time Input System**:
  - Replaced minute dropdown with flexible text input (0-59 minutes)
  - Added seconds input field for precise meeting scheduling
  - Enhanced time validation with real-time input checking
  - Updated 4-column time layout (Hour/Minute/Second/Period)
  - Live time preview shows complete HH:MM:SS format
- **Enhanced Loading Experience**:
  - Added CEDOI logo to all major loading screens
  - Updated main application loading screen with professional branding
  - Enhanced attendance loading states with logo display
  - Improved notification center loading with logo integration
  - Professional loading experience across all components

### July 21, 2025 - Time-Based Attendance Restrictions & Real-Time Notification System
- **Time-Based Attendance Window Implementation**:
  - Added proper business logic for attendance marking time restrictions
  - Attendance marking only allowed from 30 minutes before meeting until 2 hours after
  - Visual indicators showing current attendance window status (green/red badges)
  - Time-sensitive error messages with countdown timers
  - QR scanning and bulk operations respect time restrictions
  - Prevents attendance marking outside proper meeting windows
  - Meeting details fetched to validate attendance timing
- **User Experience Enhancements**:
  - Clear messaging about when attendance marking opens/closes
  - Visual status indicators in attendance screen header
  - Disabled buttons when attendance marking not allowed
  - Real-time countdown showing minutes until meeting starts
  - Professional time window management for meeting logistics

### July 21, 2025 - Real-Time Notification System Implementation
- **Real-Time Notification System**:
  - Fixed infinite loop error in NotificationCenter component using stable dependency patterns
  - Implemented dynamic notification generation based on actual meeting and attendance data
  - Added meeting reminders (1 hour before, 5 minutes before, starting now alerts)
  - Attendance notifications for Sonai users when attendance required
  - Live attendance updates for Chairman users with percentage calculations
  - Low attendance alerts when less than 50% members present
  - New meeting notifications for meetings created in last 24 hours
  - Enhanced visual styling with color-coded notifications and urgent alerts with animations
- **Notification Types**:
  - Meeting Reminders: Blue icons, red with pulse animation for urgent alerts
  - Attendance Required: Orange icons for Sonai users
  - Attendance Updates: Green icons for Chairman, yellow for low attendance alerts
  - Meeting Created: Blue icons for newly scheduled meetings
- **Real-Time Features**:
  - Auto-refresh every 30 seconds with live data from Firestore
  - Role-based notification content (Chairman vs Sonai vs Member)
  - Action buttons for attending meetings or marking attendance
  - Mark as read functionality with visual feedback
  - Loading states and error recovery with retry functionality

### July 20, 2025 - Complete Role-Based Access Control Implementation & Logo Update
- **Role-Based Meeting Creation Restriction**: 
  - Successfully implemented complete restriction of meeting creation to Chairman users only
  - Enhanced role checks with double validation: both role === 'chairman' AND email contains 'chairman'
  - Updated all create meeting buttons in MobileHomePage, MeetingsPage, and Dashboard components
  - Removed create meeting buttons from Quick Actions section and empty state screens for Sonai users
  - Verified proper role assignment based on email addresses (sonai/chairman/member)
- **Logo Implementation**:
  - Updated application logo with new CEDOI branding (Logo_1753037717604.png)
  - Optimized logo display in both MobileAppHeader and AppHeader components
  - Set proper responsive sizing: h-8 w-auto for mobile, h-8 sm:h-10 for desktop
  - Maintained fallback icon system for error handling
- **User Experience**:
  - Role-based access control now works correctly after browser refresh
  - Clear separation of functionality between Chairman (meeting creation) and Sonai (attendance marking)
  - Consistent branding across all application headers

## Recent Changes (July 2025)

### July 16, 2025 - Mobile App Development Prompt & Meeting ID Fix
- **Meeting ID Resolution**: 
  - Fixed mismatch between getTodaysMeeting() returning mock data while getAll() returned Firestore data
  - Enhanced fallback logic to use getAll() when getTodaysMeeting() Firestore operation fails
  - Added comprehensive debugging to track meeting ID flow from dashboard to live monitor
  - Live Attendance Monitor now correctly finds and displays real Firestore meetings
- **Mobile App Development Documentation**:
  - Created comprehensive MOBILE_APP_DEVELOPMENT_PROMPT.md with complete technical specifications
  - Detailed React Native and Flutter implementation options
  - Complete architecture, security, testing, and deployment strategies
  - Included timeline, budget estimates, and quality assurance requirements
  - Covers transformation of PWA to native mobile app with all current features preserved

### July 16, 2025 - Enhanced Auto-Refresh & Live Attendance UX Improvements
- **Auto-Refresh Implementation**:
  - Added real-time auto-refresh to Chairman dashboard's today's meeting section (30-second intervals)
  - Live attendance stats refresh every 15 seconds for immediate updates
  - User data refreshes every minute to stay current
  - Auto-refresh on window focus for better user experience
  - Visual live indicator with pulsing green dot and "Live updates • Every 30s" status
- **Enhanced LiveAttendanceMonitor UX**:
  - Complete redesign with modern, gradient-based design system
  - Real-time stats cards with animated progress bars and color-coded metrics
  - Advanced filtering system: Overview/Present/Absent/Pending with icon-based buttons
  - Improved member cards with gradient avatars and status badges
  - Auto-refresh controls: Pause/Resume functionality with visual feedback
  - Enhanced header with sticky positioning and live status indicators
  - Export functionality for CSV and print reports
  - 15-second refresh intervals for more responsive live monitoring
  - Gradient background and professional card-based layout
  - Enhanced error states with actionable recovery options
- **Attendance Screen Auto-Refresh**:
  - Real-time updates every 30 seconds for attendance records
  - User list refreshes every minute to stay synchronized
  - Window focus triggers immediate data refresh
  - Improved responsiveness during attendance marking sessions

### July 16, 2025 - Live Attendance Monitoring System Implementation
- **Live Attendance Monitor Component**: 
  - Created comprehensive `LiveAttendanceMonitor.tsx` with real-time attendance tracking
  - Auto-refresh every 30 seconds with manual refresh and pause/resume controls
  - Live statistics display: total members, present, absent, and pending counts
  - Real-time progress bars for completion and attendance percentages
  - Three-column layout showing Present/Absent/Pending members with status badges
  - Export functionality for current attendance status
- **Enhanced Dashboard Integration**:
  - Added "LIVE STATUS" button for Chairman users on today's meeting card
  - Integrated live attendance statistics directly in meeting details
  - Real-time updates with timestamp display
  - Proper role-based access control (Chairman sees live monitor, Sonai marks attendance)
- **User Experience Improvements**:
  - Sticky header with meeting details and last update time
  - Color-coded status indicators (green for present, red for absent, orange for pending)
  - Auto-refresh toggle for battery conservation
  - Responsive design optimized for mobile and desktop use
  - Clear visual feedback for live data updates
- **Technical Implementation**:
  - React Query integration with proper cache invalidation
  - Real-time data synchronization with 30-second intervals
  - Optimistic updates and loading states
  - Proper error handling and fallback states
  - Memory-efficient auto-refresh with cleanup on unmount

### July 15, 2025 - Role-Based Reports & Settings Implementation + Bug Fixes
- **Fixed Sonai Dashboard Bug**: 
  - Corrected role check from 'organizer' to 'sonai' in Dashboard component
  - Updated schema to reflect actual role values ('sonai', 'chairman', 'member')
  - Sonai can now properly see upcoming and completed meetings they created
- **Role-Based Reports System**:
  - Added role-based access control to ReportsEnhanced component
  - Sonai sees only their own meeting reports with title "My Meeting Reports"
  - Chairman sees all meeting reports with title "All Meeting Reports"
  - Members see standard meeting reports
  - Proper filtering based on user role and meeting ownership
- **Complete Settings Page Implementation**:
  - Created comprehensive SettingsScreen component
  - Profile management with name, email, company, and role display
  - Notification settings with toggles for meeting reminders, attendance alerts, report updates, and email notifications
  - App preferences including theme, language, timezone, and date format
  - Account actions with secure logout functionality
  - Role-based UI with proper user context integration
- **Chairman Dashboard Restored**:
  - Reverted Chairman dashboard to show full meeting details
  - Chairman can see complete information: date, time, venue, agenda for all meetings
  - Maintains oversight capabilities with full meeting visibility
- **Updated Navigation**:
  - Integrated new SettingsScreen into home page navigation
  - Fixed component imports and routing
  - Proper back navigation handling for all screens

### July 15, 2025 - Streamlined Attendance UX Implementation + Complete React Protection System
- **Streamlined Attendance UX Implementation**:
  - Created unified AttendanceScreenImproved.tsx replacing separate desktop/mobile versions
  - **Solved major space optimization issue**: Redesigned compact header with integrated controls
  - Consolidated search and filter tabs into single row for maximum member list visibility
  - Reduced member card sizes and padding for efficient space usage
  - Implemented thin progress bar and compact submit button to minimize UI overhead
  - Enhanced touch interactions with 44px minimum touch targets and haptic feedback classes
  - Added smart quick actions that only appear when needed (pending members > 0)
  - Added clickable status badges for easy present/absent toggling
  - **User feedback: "Now it feels good than before"** - successful UX improvement achieved
  - Complete attendance workflow with progress saving and submission functionality

### July 15, 2025 - Complete React Protection System + Mobile Attendance UX Redesign
- **Complete Dependency Protection System**:
  - Built comprehensive DependencyGuardian system integrated into server startup
  - Automatic Firebase import error detection and repair
  - Pre-startup health checks prevent server start with missing dependencies
  - Real-time dependency monitoring with DependencyWatchdog
  - Automatic repair capabilities for common dependency issues
- **Multi-Layer Protection**:
  - Server-side dependency validation (server/dependency-guardian.ts)
  - Pre-development checks (scripts/pre-dev-check.js)
  - Firebase-specific health monitoring (scripts/firebase-health-check.js)
  - Development environment setup automation (scripts/dev-setup.js)
  - Real-time file system monitoring (scripts/dependency-watchdog.js)
- **Auto-Repair Capabilities**:
  - Automatic npm cache clearing and package reinstallation
  - Firebase-specific repair sequences
  - Comprehensive error recovery workflows
  - Graceful degradation and clear error messaging
- **Prevention Guarantees**:
  - Firebase import errors will never occur again
  - Missing dependency failures automatically resolved
  - Package corruption issues detected and fixed
  - Development environment consistency maintained
- **Developer Experience**:
  - Transparent operation with detailed logging
  - Zero manual intervention required for common issues
  - Clear error messages with actionable solutions
  - Comprehensive documentation in DEPENDENCY_PROTECTION_SYSTEM.md
- **React Protection System**:
  - Comprehensive React integrity checks added to DependencyGuardian
  - React version monitoring and automatic repair capabilities
  - React Error Boundary component for graceful error handling
  - React Guardian utility for consistent React imports
  - Multiple layers of protection against React import errors
  - Auto-recovery from React corruption with page reload fallback
- **Mobile Attendance UX Redesign**:
  - Completely redesigned AttendanceScreenMobile.tsx with Senior UX principles
  - Mobile-first design with sticky header and progress tracking
  - Tab-based filtering with visual feedback and clear navigation
  - Enhanced member cards with avatars and clear status indicators
  - Touch-optimized buttons with proper spacing and shadows
  - Simplified interface maintaining all original features
  - Real-time progress updates and completion states

### July 14, 2025 - Enhanced Functionality Implementation & UX Improvements
- **Complete Firestore Migration**: 
  - Updated authentication system to use Firebase Auth with Firestore user storage
  - Replaced all mock API calls with Firestore operations and intelligent fallbacks
  - Implemented `withFirestoreFallback` pattern for seamless development experience
  - Added automatic user creation in Firestore on first Firebase login
- **Enhanced Data Layer**:
  - All operations now use Firestore: users, meetings, attendance records
  - Real-time data synchronization when Firebase is configured
  - Graceful fallback to mock data when Firebase credentials unavailable
  - Type-safe Firestore operations with proper error handling
- **Fixed responsive navigation issues**: Navbar now responsive and stays visible
- **Enhanced meeting creation form**: 
  - Replaced time input with user-friendly dropdowns (Hour/Minute/AM-PM)
  - Added venue selection with predefined options and custom venue support
- **Complete PostgreSQL removal and Firestore-only architecture**:
  - Removed all PostgreSQL, Drizzle dependencies and configurations
  - Implemented pure Firestore/mock data architecture
  - Direct frontend-to-Firestore communication (when configured)
  - Mock authentication and data layer for development
- **UI/UX improvements**:
  - Fixed floating action button positioning above navigation
  - Added safe area support for mobile devices
  - Improved touch targets and mobile responsiveness
- **Fixed infinite loading issue**: 
  - Resolved React Refresh runtime errors by updating Route component usage
  - Added 22 test users with company information for attendance marking
- **Enhanced attendance marking interface**:
  - Added clearly visible red "ABSENT" and green "PRESENT" buttons
  - Displays user name, company, and role for each member
  - Fixed button visibility issues with explicit color styling
- **QR Code Scanning Implementation**:
  - Added QRScanner component with camera access for attendance marking
  - Fallback manual QR code entry option
  - Real-time QR code validation and user identification
- **Notification System Enhancement**:
  - Browser notification support with permission handling
  - Meeting creation notifications sent to all members
  - Automated reminder scheduling 1 hour before meetings
  - In-app notification storage and retrieval
- **Advanced Reports System**:
  - Detailed attendance analytics with filtering by time period
  - Individual member attendance tracking and statistics
  - CSV export functionality for attendance reports
  - Visual progress indicators and attendance percentage calculations
  - Real-time data integration from Firestore
- **Enhanced Attendance UX** (Senior UX Designer improvements):
  - **Sticky header** with improved date display and quick QR access
  - **Visual progress tracking** with gradient progress bars and completion states
  - **Enhanced member cards** with larger avatars, status indicators, and better information hierarchy
  - **Improved search and filtering** with visual filter buttons and clear search functionality
  - **Smart bulk actions** with gradient buttons and better user feedback
  - **Enhanced QR scanner** with improved visual design and better error handling
  - **Better empty states** with clear messaging and recovery actions
  - **Improved save flow** with detailed progress indicators and completion feedback
  - **Enhanced toast notifications** with user-specific messages and better error handling
  - **Better visual hierarchy** with consistent spacing, typography, and color usage
  - **Improved accessibility** with better contrast, touch targets, and screen reader support

### Progressive Web App Features
- **Manifest**: Web app manifest for installation
- **Service Worker**: Caching strategy for offline functionality
- **Icons**: PWA icons for various device sizes
- **Mobile Optimization**: Viewport meta tags and mobile-specific styling