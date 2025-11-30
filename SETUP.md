# 🚀 Quick Setup Guide

Follow these steps to get your StudyVault app running in **under 10 minutes**!

## ⚡ Fast Track Setup

### 1. Create Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "StudyVault" → Click Continue
4. Disable Google Analytics → Click Create project
5. Wait for it to be ready → Click Continue

### 2. Enable Services (3 minutes)

**Authentication:**
- Click "Authentication" → "Get started"
- Click "Email/Password" → Toggle Enable → Save

**Firestore:**
- Click "Firestore Database" → "Create database"
- Select "Start in production mode" → Next
- Choose your location → Enable

**Storage:**
- Click "Storage" → "Get started"
- Click "Next" → Choose same location → Done

### 3. Get Your Config (1 minute)

1. Click the gear icon ⚙️ → "Project settings"
2. Scroll down → Click Web icon `</>`
3. Register app name: "StudyVault" → Register app
4. **Copy the firebaseConfig object**

### 4. Update Your Code (1 minute)

1. Open `firebase-config.js`
2. Replace this:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",  // ← Replace these
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
3. With your actual config from step 3
4. Save the file

### 5. Deploy Security Rules (2 minutes)

**Firestore Rules:**
1. Firebase Console → "Firestore Database" → "Rules" tab
2. Copy content from `firestore.rules` file
3. Paste in editor → Click "Publish"

**Storage Rules:**
1. Firebase Console → "Storage" → "Rules" tab
2. Copy content from `storage.rules` file
3. Paste in editor → Click "Publish"

### 6. Test Locally (1 minute)

Open terminal in project folder:

```bash
# Using Python (if installed)
python -m http.server 8000

# OR using Node.js
npx http-server -p 8000

# OR use VS Code Live Server extension
```

Open browser: `http://localhost:8000`

## 🌐 Deploy Online (Optional)

### Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Firestore, Hosting, Storage)
firebase init

# Deploy
firebase deploy
```

Your app: `https://YOUR_PROJECT_ID.web.app`

### Netlify (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Config updated in `firebase-config.js`
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] App running locally
- [ ] Can register new account
- [ ] Can create notes
- [ ] Can upload images/PDFs

## 🎯 First Steps After Setup

1. **Register** your account
2. **Create** your first note
3. **Add** a subject (e.g., "Mathematics")
4. **Upload** an image or PDF
5. **Mark** something as priority
6. **Explore** the interface!

## 🆘 Quick Fixes

### Can't see Firebase config?
- Make sure you clicked the Web icon `</>` in Project Settings
- Look under "Your apps" section

### "Permission denied" errors?
- Did you deploy the security rules? (Step 5)
- Are you logged in to the app?

### App shows blank page?
- Check browser console (F12) for errors
- Verify Firebase config is correct
- Make sure you have internet connection

### File upload not working?
- File must be under 10MB
- Only images (JPG, PNG, etc.) and PDFs allowed
- Check Storage rules are deployed

## 📞 Need Help?

1. Check browser console (F12 → Console tab)
2. Check Firebase Console for errors
3. Re-read the setup steps
4. Check the full README.md for details

---

**You're all set! 🎉** Start organizing your study notes like a pro!
