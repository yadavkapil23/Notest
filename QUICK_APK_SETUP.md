# 📱 Quick APK Setup - 5 Minutes

## 🚀 Fastest Way to Create APK

### Prerequisites (One-time setup)

1. **Install Android Studio:**
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Install with default settings
   - Open Android Studio once to complete setup

2. **Install Java JDK:**
   - Android Studio includes it, or download separately

### Step 1: Install Capacitor (2 minutes)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 2: Initialize (1 minute)

```bash
npx cap init
```

**Enter:**
- App name: `My Notes`
- App ID: `com.yourname.mynotes` (use your name/company)
- Web directory: `.` (just press Enter)

### Step 3: Add Android (1 minute)

```bash
npx cap add android
```

### Step 4: Sync Files (30 seconds)

```bash
npx cap sync
```

### Step 5: Open in Android Studio (1 minute)

```bash
npx cap open android
```

### Step 6: Build APK (2 minutes)

In Android Studio:
1. Wait for Gradle sync (automatic)
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build
4. Click **locate** when done
5. Your APK: `android/app/build/outputs/apk/debug/app-debug.apk`

**Done!** 🎉

---

## 📦 Or Use the Setup Script

I've added a script to `package.json`. Just run:

```bash
npm run setup:android
```

Then:
```bash
npm run sync:android
npm run open:android
```

---

## 🔄 Update App Later

After making changes to your web app:

```bash
npm run sync:android
npm run open:android
# Then build again in Android Studio
```

---

## ⚠️ Troubleshooting

### "Command not found: npx"
- Make sure Node.js is installed
- Try: `npm install -g npm@latest`

### "SDK location not found"
- Open Android Studio
- **File** → **Project Structure** → **SDK Location**
- Set the path

### Build fails
- Check internet connection
- In Android Studio: **File** → **Invalidate Caches / Restart**

---

## 📱 Install APK on Phone

1. Transfer `app-debug.apk` to your phone
2. Enable "Install from unknown sources" in Android settings
3. Tap the APK file to install

---

**That's it!** Your web app is now an Android APK! 🚀

