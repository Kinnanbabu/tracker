# 🎯 GoalQuest: iPhone vs. MacBook Pro vs. Goa Trip Planner

A modern, responsive daily planner, habit checklist ("tick thing"), and savings tracker specifically designed to help you decide and fund your dream goal:
- 📱 **iPhone (Latest Pro / Pro Max)**
- 💻 **MacBook Pro (M-Series Powerhouse)**
- 🏖️ **Trip to Goa (Sun, Beaches & Memories)**

Deployable on **Vercel** in under 60 seconds with **Cross-Device Sync** between your laptop and mobile phone!

---

## ✨ Features Included

1. **The 3 Contenders Dashboard**:
   - Compare and track the 3 dream goals side-by-side.
   - Switch active target with one click.
   - Fully customizable target prices (₹ INR or $ USD), deadlines, and notes.

2. **Daily Planner & "Tick Thing" (Checklist & Habit Tracker)**:
   - Interactive checklist with animated checkboxes.
   - Pre-loaded with smart financial & daily productivity habits:
     - 💰 *Saved ₹300+ today (Skipped takeout / outside coffee)*
     - 🚫 *Zero impulse shopping / cart checkouts*
     - 💻 *1 Hour dedicated skill learning or side income work*
     - 🔍 *Researched flight rates / student discounts*
     - 💧 *Drank 2.5L water & kept disciplined mindset*
   - Real-time completion progress bar & streak counter (🔥).
   - Built-in audio chime & celebratory confetti explosion when all daily tasks are completed!

3. **Amount & Progress Tracker**:
   - Total saved vs Target price with visual progress percentage.
   - Fast deposit buttons (`+₹200`, `+₹500`, `+₹1,000`, `+₹5,000`).
   - Deposit history log with timestamps and notes.
   - Daily and weekly savings pace calculator (e.g. *"Save ₹333/day to reach Goa in 60 days"*).

4. **The Decision Battle Matrix**:
   - Side-by-side comparison of Long-term ROI, Depreciation, Lifespan, and Happiness return.
   - Interactive quiz that recommends which one you should unlock first based on your current life situation.

5. **Goa & Tech Blueprints**:
   - Pre-calculated Goa budget breakdown (Flights, Stays, Scooty, Shacks).
   - Copyable Goa packing list.
   - Buying guide & discount strategies for iPhone & MacBook.

6. **Cross-Device Sync (Mobile 📱 + Laptop 💻)**:
   - **QR Code Fast Sync:** Click "Open on Phone", scan with your mobile camera, and your progress opens on your phone instantly!
   - **Sync Room Code:** Enter a 6-character room code on both devices for synced data.
   - **Vercel KV Serverless API:** Ready-to-go `/api/sync` route for cloud database storage.
   - **JSON Backup:** Download and import your data anytime.

---

## 🚀 How to Preview Locally Right Now

You can run this app immediately on your laptop using Python (which is already installed on your PC):

1. Open PowerShell or Command Prompt.
2. Run this command:
   ```powershell
   cd C:\Users\ASUS\.gemini\antigravity\scratch\goal-quest-planner
   python -m http.server 3000
   ```
3. Open your browser and visit:
   ```
   http://localhost:3000
   ```
You will see the app live and fully interactive!

---

## 🌐 How to Deploy to Vercel (Beginner's Step-by-Step Guide)

Hosting this app on Vercel is **100% free forever** and takes about 2 minutes:

### Step 1: Create a Free GitHub Repository
1. Go to [github.com](https://github.com) and log in (or create a free account).
2. Click the **"+"** icon in the top right > **"New repository"**.
3. Name it `my-goal-planner` and click **"Create repository"**.
4. Upload all the files inside `goal-quest-planner/` into the repository:
   - `index.html`
   - `style.css`
   - `app.js`
   - `vercel.json`
   - `api/sync.js`
   - `package.json`

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Sign Up"** or **"Log In"** using your GitHub account.
2. In your Vercel Dashboard, click the blue **"Add New..."** button > select **"Project"**.
3. Find your `my-goal-planner` repository and click **"Import"**.
4. Leave all settings at default and click **"Deploy"**.
5. Within 20 seconds, your site is LIVE with a custom URL like:
   `https://my-goal-planner.vercel.app`

---

## 📱 How to Use on Mobile Like a Native App

1. Open your Vercel URL on your mobile phone browser (Safari on iPhone, Chrome on Android).
2. **On iPhone (Safari):**
   - Tap the **Share** button (the square with an arrow pointing up).
   - Scroll down and tap **"Add to Home Screen"**.
3. **On Android (Chrome):**
   - Tap the **three dots** in the top right.
   - Tap **"Add to Home screen"** or **"Install app"**.
4. Now you have a full-screen, standalone app on your phone's home screen!

---

## 🔄 How Syncing Works Between Laptop and Mobile

When you log progress on your laptop and want to view it on your phone:
1. On your laptop, click the **"Open on Phone"** button in the top navigation bar.
2. A QR Code appears.
3. Open your phone's camera, scan the code, and tap the link.
4. Your phone opens the app with all your tasks, targets, and savings loaded!
5. To keep them syncing continuously, use the **Shared Sync Code** under the *Sync Setup* tab, or enable Vercel KV with 1 click in your Vercel dashboard!
