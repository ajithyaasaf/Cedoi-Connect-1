# Firebase Setup Guide

Your CEDOI Forum application is now fully configured to use Firebase Firestore as the database. Here's how to set it up:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `cedoi-forum` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create the project

## 2. Enable Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users (e.g., asia-south1 for India)

## 3. Enable Authentication

1. Go to "Authentication" in Firebase Console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Optionally, enable "Email link (passwordless sign-in)"

## 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web" (</> icon)
4. Register your app with name: `CEDOI Forum`
5. Copy the Firebase configuration object

## 5. Set Environment Variables

Create a `.env` file in your project root and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 6. Configure Firestore Security Rules

In Firebase Console, go to Firestore Database > Rules and use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write meetings
    match /meetings/{meetingId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write attendance records
    match /attendance_records/{recordId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. Seed Initial Data (Optional)

After setting up Firebase, you can run the seeding script to add test data:

```bash
node scripts/seed-firestore.js
```

## 8. Create Test Users in Firebase Auth

1. Go to Authentication > Users in Firebase Console
2. Add users manually:
   - `sonai@cedoi.com` (Admin/Organizer)
   - `chairman@cedoi.com` (Chairman)
   - `member@cedoi.com` (Regular member)

## Development Mode

If you don't have Firebase credentials yet, the application will automatically fall back to mock data, so you can continue development without interruption.

## Production Deployment

For production:
1. Change Firestore rules to be more restrictive
2. Set up proper user roles and permissions
3. Enable Firebase App Check for security
4. Set up backup and monitoring

## Troubleshooting

- **"Permission denied" errors**: Check your Firestore security rules
- **Connection errors**: Verify your environment variables
- **Auth errors**: Ensure Email/Password is enabled in Firebase Auth

Your application now uses:
- ✅ Firebase Authentication for user login
- ✅ Firestore for data storage (users, meetings, attendance)
- ✅ Real-time data updates
- ✅ Fallback to mock data during development