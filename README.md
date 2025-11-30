# 📚 StudyVault - Student Notes Management Platform

A beautiful, modern web application for students to organize their study notes, upload resources (images, PDFs, code snippets), and manage their learning journey efficiently.

## ✨ Features

- 🔐 **User Authentication** - Secure login and registration with Firebase Auth
- 📝 **Rich Note Taking** - Create text notes, blog posts, and more
- 💻 **Code Snippets** - Store and organize code with syntax highlighting
- 📷 **Image Upload** - Upload and organize study images
- 📄 **PDF Management** - Upload and view PDF documents
- 🎯 **Priority System** - Mark important notes for quick access
- 📚 **Subject Organization** - Organize notes by subjects
- 🎨 **Beautiful UI** - Modern, dark-themed interface with smooth animations
- 📱 **Responsive Design** - Works perfectly on all devices
- ⚡ **Real-time Sync** - All data synced with Firebase Cloud

## 🛠️ Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Hosting**: Firebase Hosting (or Netlify/Vercel)
- **Database**: Cloud Firestore
- **File Storage**: Firebase Storage

## 📋 Prerequisites

Before you begin, ensure you have:

- A Google account
- Node.js installed (v14 or higher) - Download from [nodejs.org](https://nodejs.org/)
- A code editor (VS Code recommended)
- Basic knowledge of HTML/CSS/JavaScript

## 🚀 Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `studyvault` (or your preferred name)
4. Disable Google Analytics (optional) or keep it enabled
5. Click **"Create project"**

### Step 2: Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click **"Email/Password"** under Sign-in providers
4. Enable **"Email/Password"**
5. Click **"Save"**

#### Enable Firestore Database:
1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose a location closest to your users
5. Click **"Enable"**

#### Enable Storage:
1. Click **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Click **"Next"** (keep default rules)
4. Choose the same location as Firestore
5. Click **"Done"**

### Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **Web icon** `</>`
5. Register your app with nickname: `StudyVault`
6. **Don't select** "Also set up Firebase Hosting" (we'll do this later)
7. Click **"Register app"**
8. Copy the `firebaseConfig` object

### Step 4: Configure Your Application

1. Open `firebase-config.js` in your code editor
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file

### Step 5: Deploy Security Rules

#### Deploy Firestore Rules:
1. In Firebase Console, go to **"Firestore Database"**
2. Click **"Rules"** tab
3. Copy the content from `firestore.rules` file
4. Paste it in the rules editor
5. Click **"Publish"**

#### Deploy Storage Rules:
1. In Firebase Console, go to **"Storage"**
2. Click **"Rules"** tab
3. Copy the content from `storage.rules` file
4. Paste it in the rules editor
5. Click **"Publish"**

### Step 6: Test Locally

1. Open the project folder in your terminal/command prompt
2. You can use any local server. Here are some options:

   **Option A - Python (if installed):**
   ```bash
   python -m http.server 8000
   ```

   **Option B - Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```

   **Option C - VS Code Live Server:**
   - Install "Live Server" extension in VS Code
   - Right-click on `index.html`
   - Select "Open with Live Server"

3. Open your browser and go to `http://localhost:8000`

### Step 7: Deploy to Firebase Hosting

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   
   - Select: **Firestore, Hosting, Storage**
   - Use existing project: Select your project
   - Firestore rules file: Press Enter (use firestore.rules)
   - Firestore indexes file: Press Enter (use firestore.indexes.json)
   - Public directory: Type `.` and press Enter
   - Configure as single-page app: **Yes**
   - Set up automatic builds: **No**
   - Storage rules file: Press Enter (use storage.rules)

4. Deploy your app:
   ```bash
   firebase deploy
   ```

5. Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

## 🎯 Alternative Hosting Options

### Deploy to Netlify:

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy
   ```
   - Choose "Create & configure a new site"
   - Publish directory: `.`
   - For production: `netlify deploy --prod`

### Deploy to Vercel:

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

## 📖 How to Use

### Creating Your First Note:

1. **Sign Up**: Create an account with your email and password
2. **Login**: Sign in with your credentials
3. **Add Note**: Click the "Add Note" button
4. **Fill Details**:
   - Enter a title for your note
   - Select or type a subject name
   - Choose content type (Text, Code, Image, or PDF)
   - Enter/upload your content
   - Mark as priority if important
5. **Save**: Click "Save Note"

### Organizing Notes:

- **By Subject**: Click on any subject card to view all notes in that subject
- **Priority Items**: All notes marked as priority appear at the top
- **View/Edit**: Click any note card to view details
- **Delete**: Open a note and click the delete button

### Keyboard Shortcuts:

- `Ctrl/Cmd + K` - Quick add new note
- `Esc` - Close modals

## 🔧 Configuration

### File Size Limits:
- Maximum file size: **10 MB** (configurable in `storage.rules`)
- Supported image formats: JPG, PNG, GIF, WebP, SVG
- Document format: PDF only

### Customization:

**Change Color Scheme** (in `index.html`):
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { ... } // Modify these values
      }
    }
  }
}
```

**Modify File Upload Limits** (in `storage.rules`):
```
request.resource.size < 10 * 1024 * 1024 // Change 10 to your desired MB
```

## 📱 Features Roadmap

- [ ] Search functionality
- [ ] Export notes to PDF
- [ ] Dark/Light theme toggle
- [ ] Tags and filters
- [ ] Note sharing
- [ ] Markdown support for text notes
- [ ] Voice notes
- [ ] Collaborative notes

## 🐛 Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add your domain (e.g., localhost, your-app.web.app)

### "Permission denied" errors
- Make sure you've deployed the Firestore and Storage rules
- Check that you're logged in when trying to access notes

### Files not uploading
- Check file size (must be under 10MB)
- Verify file type (only images and PDFs allowed)
- Check browser console for specific errors

### App not loading
- Verify Firebase config in `firebase-config.js`
- Check browser console for errors
- Ensure you have internet connection

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Feel free to fork this project and customize it for your needs!

## 📧 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Look at browser console errors
3. Check Firebase Console for quota/billing issues

## 🎓 Made for Students, by Students

StudyVault is designed to help students organize their learning materials efficiently. Happy studying! 📚✨
