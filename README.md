# CatchUp

CatchUp is a social map-app designed for seamless connection with friends, wherever you are.

## Developer

**`Jiawei He(Anson)`**

- Authentication system (Login Screen)
- User profile management (ProfileSetup + Profile Screen)
- Firebase integration (Firestore -> Storage)
- State management implementation

**`Dingyang Jin`**
- Firebase configuration for auth & database
- Navigation (Map Screen)
- Bottom tab
- userContext
## Current Features Implementation

### Screenshots



<div style="display: flex; gap: 10px; margin-bottom: 20px;">
    <img src="/assets/docs/signup.jpg" width="200" alt="Login Screen"/>
    <img src="/assets/docs/profileSetup1.jpg" width="200" alt="Profile Setup 1"/>
    <img src="/assets/docs/profileSetup2.jpg" width="200" alt="Profile Setup 2"/>
    <img src="/assets/docs/profile.jpg" width="200" alt="Profile Screen"/>
</div>

### Authentication & Profile Management

- ✅ Complete user authentication system
  - Email/Password login
  - New user registration
  - Password recovery functionality
  - CRUD operations
- ✅ User profile setup flow
  - Username customization
  - Profile photo upload with Firebase Storage
  - Gender selection with custom UI
- ✅ Global user state management using Context API

### Database Design

- ✅ Firebase Collections Structure
    
User collection
```javascript
  users: {
    uid: string,
    email: string,
    username: string,
    avatarUrl: string,  // Firebase Storage path
    gender: 'male' | 'female',
    createdAt: timestamp,
    lastActive: timestamp,
    friends: [],
    settings: {
      locationSharing: boolean,
      notifications: boolean
    }
  }
```
In developing: Friends collection
```javascript
  friends: {
  friendshipId: string,  // Unique ID for each friendship
  user1: string,
  user2: string,
    // potentially adding more users
  status: 'pending' | 'accepted' | 'blocked',  // Friendship status
  createdAt: timestamp,
  lastInteracted: timestamp,
  sharedLocations: boolean,   // if location sharing is enabled between friends
    }
```

In developing: Activity collection
```javascript
    activities: {
  activityId: string,
  userId: string,               // UID of the user performing the activity
  type: 'locationShare' | 'viewFriendLocation' | 'sendImage', // Type of activity
  targetUserId: string,         // UID of the target friend
  location: {
    lat: number,
    lng: number
  },
  timestamp: timestamp,         // When the activity occurred
  details: {                    // Additional details for specific activity types
    imageUrl: string,           // Firebase Storage path for shared images
    description: string         // Optional description or comment
      }
    }
```

    
## Technical Highlights

### Authentication Flow

- Implemented secure email/password authentication using Firebase Auth
- Added password recovery system
- Created seamless navigation flow between auth states

### Profile Management

- Designed and implemented profile setup workflow
- Integrated Firebase Storage for profile image management
- Created custom gender selection component

### State Management

- Implemented UserContext for global user state management
- Created efficient user data caching system
- Managed complex authentication states

## Branch Strategy

- `main`: N/A
- `LoginScreen`: Authentication feature development
- `ProfileScreen`: User profile management
- `profileSetup`: Profile creation workflow

## Next Steps

- [ ] Implement friend request system
- [ ] Add real-time location sharing
- [ ] Create friend list management
- [ ] Add notification system
- [ ] Implement location privacy controls

## Getting Started

1. Install dependencies:

```bash
npm install
```

1. Configure Firebase:
  
- Create your Firebase configuration to `.env`

1. Start the development server:

```bash
npm start
```
