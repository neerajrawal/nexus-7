# NEXUS-7 — Vercel edition (Firebase + Gemini 3.8 Flash)

What's in this version:
- **Sign-in required** — Google Sign-In or email/password, via Firebase Authentication.
- **Chats synced across devices** — stored in Firestore instead of the browser.
- **Image & document attachments** — attach a photo, PDF, or text file; it's sent straight to Gemini 3.8 Flash as part of the request.
- **Friendlier look** — same dark theme, plain-language UI.

Two things you need before this works: a **Firebase project** (for sign-in + storage) and a **Gemini API key** (for the AI replies).

## 1. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (reuse an existing one if you like).
2. **Authentication** → Get started → enable the **Google** provider and the **Email/Password** provider.
3. **Firestore Database** → Create database → start in production mode (any region is fine).
4. In Firestore, open the **Rules** tab and paste in the contents of `firestore.rules` from this folder, then **Publish**. This keeps each person's chats private to them.
5. **Project settings** (gear icon) → scroll to **Your apps** → **Add app** → the `</>` (Web) icon → register the app (no need for Firebase Hosting).
6. Copy the `firebaseConfig` object it shows you — you'll need all six values.
7. Open `index.html` in this folder, find this block near the top of the `<script type="module">` section, and paste your values in:
   ```js
   const firebaseConfig = {
     apiKey: "YOUR_FIREBASE_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
   };
   ```
   (These values are meant to be public — they identify your project, they're not secret keys.)
8. Once deployed (step 3 below), go back to **Authentication → Settings → Authorized domains** in Firebase and add your Vercel domain (e.g. `nexus-7-phi.vercel.app`), or sign-in will fail with an "unauthorized domain" error.

## 2. Get a Gemini API key

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in, and create a key.

You have two options for how it's used:

- **Each person uses their own key** (default): everyone who signs in pastes their own key into **Settings** in the app. Nothing is stored on the server.
- **One shared key for everyone**: set an environment variable named `GEMINI_API_KEY` in your Vercel project (Project → Settings → Environment Variables) with your key as the value. The server will use it automatically and signed-in users won't need to enter their own.

## 3. Deploy / redeploy to Vercel

Since you already have `nexus-7-phi.vercel.app`, the simplest path is to replace that project's files with this folder's contents and redeploy:

**If you're using the Vercel CLI:**
```
cd nexus7-vercel
vercel --prod
```
(Run `vercel link` first if this folder isn't already linked to your existing project.)

**If you're using Git + the Vercel dashboard:** commit these files to the repo connected to your project and push — Vercel redeploys automatically.

No build step, no `npm install` needed — it's a static `index.html` plus one serverless function (`api/chat.js`).

## Notes & limits

- Attachments are capped at **4 MB per file, 3 files per message** (Vercel's request body limit is a few MB). Images and PDFs are sent directly to Gemini; other text-like files (`.txt`, `.md`, `.csv`, `.json`) are read as plain text and included in the prompt.
- Attachments are **not** saved to Firestore (only their file names are, for display) — only text messages persist across devices. Each attachment is used for that one request.
- If someone signs in without entering a Gemini key and no shared `GEMINI_API_KEY` is set, the app will prompt them to add one in Settings.
