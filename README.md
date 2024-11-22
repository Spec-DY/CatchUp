# CatchUp

CatchUp is a social map-app designed for seamless connection with friends, wherever you are.

## Developer

**`Jiawei He(Anson)`**

- Authentication system (Login Screen)
- User profile management (ProfileSetup + Profile Screen)
- Firebase integration (Firestore -> Storage)
- State management implementation

**`Dingyang Jin`**
- Mapbox Migration
- Friends screen (add friend system)
- Map Screen (add friend layer and post layer)

## Current Features Implementation
### Screenshots



<div style="display: flex; gap: 10px; margin-bottom: 20px;">
    <img src="/assets/docs/friendslocation.jpg" width="200" alt="Login Screen"/>
    <img src="/assets/docs/searchfriend.jpg" width="200" alt="Profile Setup 1"/>
    <img src="/assets/docs/postdetail.jpg" width="200" alt="Profile Setup 2"/>
</div>

### Friend System & Map Display

#### `Friends.js`
##### ✅ Manage friends and friend requests
 - Display list of friends with profile pictures
 - Display pending friend requests
 - Accept or reject friend requests
 - Remove friends from the list
##### ✅ Search for users by email
 - Input field for email search
 - Search button to trigger search
 - Display search results with user profile pictures
 - Handle errors and display appropriate messages
##### ✅ Real-time updates
 - Subscribe to friends collection for real-time updates
 - Subscribe to pending requests collection for real-time updates
##### ✅ User interactions
 - Send friend requests
 - Accept or reject friend requests
 - Remove friends from the list
#### `Map.js`
##### ✅ Display user location on a map
 - Initialize Mapbox with access token
 - Display user location with high accuracy
 - Fetch and display city name and weather information
##### ✅ Display friends' locations on the map
 - Subscribe to friends collection for real-time updates
 - Display friends' locations with profile pictures
 - Show callouts with friend information on marker click
##### ✅ Display posts on the map
 - Subscribe to posts collection for real-time updates
 - Display posts with thumbnails on the map
 - Show callouts with post details on marker click
##### ✅ User interactions
 - Toggle between friends and posts view
 - Add new posts with camera integration
 - Handle location permissions and errors

### Database Design

Firebase Collections Structure
    
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
Friends collection (it act as a friend request handler)
```javascript
  acceptedAt: timestamp
  createdAt: timestamp,
  receiver: string,
  sender: string,
  status: 'pending' | 'accepted' | 'removed'
  updatedAt: timestamp,
  users:
    0:uid,
    1:uid
```

Post collection (store post info and image url)
```javascript
    caption: string,
createdAt: timestamp,
  imageUrl: string URL,
  location: [
    lat,lng: geopoint
],
  userId: uid
```

    
## Technical Highlights

### Map Layer Toggle

- Implemented a toggle button for seamless switching between map layers
- Layer 1: Displays user posts with geotagged markers
- Layer 2: Highlights friends' current locations
- Enhanced user experience by reducing map clutter and providing clear views of each layer

### Friend Management System

- Designed and implemented a robust friend management feature
- Enabled searching for users by email with real-time suggestions
- Integrated functionality to send, accept, or reject friend requests
- Added the ability to remove friends from the list with immediate updates

### State Management

- Utilized React Context for efficient global state management of user and friend data
- Cached map and user data locally for faster loading and improved app performance
- Effectively handled asynchronous updates for friend requests and map interactions

## Branch Strategy

- `main`: N/A
- `Mapbox`: Fully functional map and friend system
- `dev`: Our last build based on Google Maps

## Next Steps

- [x] Implement friend request system
- [x] Add real-time location sharing
- [x] Create friend list management
- [ ] Add notification system
- [ ] Implement location privacy controls
- [ ] User friendly UI improvement

## Note
### After Switching to Unmanaged Expo
- **Expo Go** can no longer be used. You must use an emulator or connect your device via USB.
- Alternatively, you can manually install the APK after prebuild:  
  `android\app\build\outputs\apk\debug\app-debug.apk`.

---

### Step 1: Add the Mapbox API Key to `app.json` Plugins
Update the `app.json` file by replacing `Mapbox Secret API key` with the actual key started with `sk.`:
```json
{
  "plugins": [
    [
      "@rnmapbox/maps",
      {
        "RNMapboxMapsImpl": "mapbox",
        "RNMapboxMapsDownloadToken": "Mapbox Secret API key"
      }
    ]
  ]
}
```
### Step 2: Update the .env File

Add the required keys for Mapbox (start with `pk.`) and OpenWeather in the .env file, in addition to the Firebase API keys:
```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN="Mapbox Public API key"
EXPO_PUBLIC_OPEN_WEATHER_API=your_open_weather_key
```
**Notice** Mapbox has Public API key which start with pk and Secret API key which start with sk, they are different.

### Step 3: Run Prebuild

Clean and prepare the build with the following command:
```bash
npx expo prebuild --clean
```

### Step 4: Run the App on Your Device

- Enable USB debugging on your phone (for Android, enable ADB).
- Connect your phone to the computer.
- Run the app on Android or iOS:
```bash
npx expo run:android
```
**OR**
```bash
npx expo run:ios
```
