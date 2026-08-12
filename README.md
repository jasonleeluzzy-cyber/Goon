# GOONIVERSITY

Premium social messaging campus owned and created by Luzzi.

Unique username identity. Real private chats. Groups. Stickers. GIFs. Media. Voice. Gooni AI. Chill Out nebula.

## Android release

Application ID: `com.luzzi.gooniversity`  
Version: `1.0.0` (versionCode 1)

Installable APK (internal testing):

```
npx eas-cli build -p android --profile apk
```

Play Store AAB:

```
npx eas-cli build -p android --profile aab
```

Required permissions are declared in `app.json` (microphone, camera, media, notifications, network).

Backend secrets (GIF provider, AI uplink, database) live in `/api/gooni.js` and are never bundled into the Android client.
