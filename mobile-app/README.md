# GreenDye Academy Mobile App

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

## Future Development: React Native App

For enhanced mobile experience with full native features, a React Native version is planned.

### Planned Features
- Native navigation
- Offline video playback
- Advanced notifications
- Camera integration for ID verification
- Biometric authentication
- Native file access
- Deep linking

### Development Roadmap

1. **Phase 1: Core Features** (Current - PWA)
   - Basic functionality
   - Course browsing
   - Video playback
   - User authentication

2. **Phase 2: Enhanced PWA**
   - Offline course downloads
   - Advanced caching
   - Better performance

3. **Phase 3: React Native App**
   - Native iOS app
   - Native Android app
   - Enhanced features
   - App Store/Play Store submission

## Technical Stack for Future Native App

```
Technology Stack:
- React Native
- Expo (optional)
- React Navigation
- Redux/Context API
- AsyncStorage
- React Native Video
- Push Notifications
- Native Device Features
```

## Contributing

If you're interested in contributing to the mobile app development, please check our [Contributing Guide](../CONTRIBUTING.md).

## Support

For mobile app support:
- Email: mobile-support@greendye-academy.com
- Issues: [GitHub Issues](https://github.com/mohamedaseleim/GreenDye/issues)

## Screenshots

### PWA Installation
![PWA Install](screenshots/pwa-install.png)

### Mobile Interface
![Mobile UI](screenshots/mobile-ui.png)

### Course Player
![Course Player](screenshots/course-player.png)

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
