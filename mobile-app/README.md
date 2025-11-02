# GreenDye Academy Mobile App

## Overview

GreenDye Academy now includes both a Progressive Web App (PWA) and a native React Native mobile application for enhanced mobile learning experience.

## Progressive Web App (PWA)

The GreenDye Academy platform is built as a Progressive Web App (PWA), which means it can be installed and used like a native mobile application on both iOS and Android devices.

## Features

### PWA Features
- ✅ Installable on mobile devices
- ✅ Offline support with service workers
- ✅ Push notifications
- ✅ Home screen icon
- ✅ Full-screen experience
- ✅ Fast loading with caching
- ✅ Responsive design for all screen sizes

### Installation Instructions

#### Android Devices

1. Open the GreenDye Academy website in Chrome browser
2. Tap the menu icon (three dots) in the top right
3. Select "Add to Home screen" or "Install app"
4. Confirm the installation
5. The app icon will appear on your home screen

#### iOS Devices (iPhone/iPad)

1. Open the GreenDye Academy website in Safari browser
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name the app and tap "Add"
5. The app icon will appear on your home screen

### PWA vs Native App

| Feature | PWA | Native App |
|---------|-----|------------|
| Installation | Via browser | Via App Store/Play Store |
| Updates | Automatic | Manual via stores |
| Size | Small (~5MB) | Large (50-100MB+) |
| Offline Support | ✅ Yes | ✅ Yes |
| Push Notifications | ✅ Yes | ✅ Yes |
| Device Features | Limited | Full access |
| Development Cost | Lower | Higher |
| Maintenance | Single codebase | Multiple codebases |

## React Native Mobile App (NEW!)

The native React Native mobile app is now implemented with core features.

### Current Features
- ✅ User authentication (Login/Register)
- ✅ Home screen with personalized recommendations
- ✅ Course browsing and search
- ✅ My Learning dashboard with progress tracking
- ✅ Profile with gamification stats
- ✅ AI-powered course recommendations
- ✅ Leaderboard and achievements
- ✅ Native navigation
- ✅ Offline token storage

### Installation

1. **Prerequisites**
   ```bash
   # Install Node.js 16+ and npm
   # Install React Native CLI
   npm install -g react-native-cli
   
   # For iOS (macOS only)
   sudo gem install cocoapods
   
   # For Android
   # Install Android Studio and set up Android SDK
   ```

2. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   
   # For iOS
   cd ios && pod install && cd ..
   ```

3. **Configure API Endpoint**
   Edit `src/services/api.js` and update the `API_BASE_URL` to point to your backend server.

4. **Run the App**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   ```

### Technical Stack

```
Technology Stack:
- React Native 0.72
- React Navigation 6
- Axios for API calls
- AsyncStorage for local storage
- React Native Vector Icons
- React Native Video (planned)
```

### Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # App screens
│   │   ├── auth/         # Login, Register
│   │   ├── HomeScreen.js
│   │   ├── CoursesScreen.js
│   │   ├── MyLearningScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/       # Navigation setup
│   ├── services/         # API integration
│   ├── components/       # Reusable components
│   └── utils/            # Helper functions
├── android/              # Android native code
├── ios/                  # iOS native code
└── package.json
```

### Future Enhancements
- 🔄 Offline video playback
- 🔄 Push notifications
- 🔄 Camera integration for ID verification
- 🔄 Biometric authentication
- 🔄 Deep linking
- 🔄 App Store/Play Store submission

## Contributing

If you're interested in contributing to the mobile app development, please check our [Contributing Guide](../CONTRIBUTING.md).

## Support

For mobile app support:
- Email: mobile-support@greendye-academy.com
- Issues: [GitHub Issues](https://github.com/mohamedaseleim/GreenDye/issues)

## Screenshots

Screenshots demonstrating the PWA installation process, mobile interface, and course player will be added soon. The mobile app provides a seamless experience for:
- Installing the PWA on your device
- Browsing courses with a mobile-optimized interface
- Playing course content with an adaptive video player

## Testing

Test the PWA on various devices:
- Android Chrome
- iOS Safari
- Desktop browsers
- Tablet devices

Use Chrome DevTools Lighthouse to audit PWA features.

## Performance

The PWA is optimized for:
- Fast initial load
- Smooth animations
- Efficient data usage
- Battery optimization
- Memory management

## Offline Support

The app caches:
- Static assets (HTML, CSS, JS)
- Course thumbnails
- User profile data
- Previously viewed content

Note: Video content requires online connection unless explicitly downloaded (planned feature).
