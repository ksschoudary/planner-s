# Planner S 📅

A personal PWA calendar & planner with glassmorphism UI. Works offline, installs on any device.

## Features
- 📅 **Calendar** — monthly view with events on each date cell, day preview panel
- ☰ **Agenda** — chronological all-events list
- 📝 **Notes** — card grid for quick notes
- 🔔 **Reminders** — all events with reminders, urgency indicators
- 💸 **Bills** — bill tracker with monthly totals + CSV export
- 🔁 **Recurring events** — Daily, Weekly, Monthly, Quarterly, Yearly
- 🔔 **Reminder popup** on app open (1–7 days before)
- 🎫 **Ticker** showing today & tomorrow events
- 🔍 **Category filters** — Events, Bills, Notes, Meetings, Bdays, Tasks, Holidays
- 📲 **Installable PWA** — works offline via service worker
- ⬇ **CSV Export** of all data

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `planner-s`)
2. Upload all files keeping the folder structure:
   ```
   index.html
   manifest.json
   sw.js
   css/style.css
   js/app.js
   js/db.js
   js/calendar.js
   js/agenda.js
   js/notes.js
   js/reminders.js
   js/bills.js
   icons/icon-192.png
   icons/icon-512.png
   ```
3. Go to repo **Settings → Pages → Source: Deploy from branch → main / root**
4. Your app will be live at `https://<your-username>.github.io/planner-s/`
5. Open on mobile → browser will prompt **"Add to Home Screen"** → full PWA experience!

## Data Storage
All data is stored in **localStorage** on your device — completely private, no server needed.

## Tech Stack
- Vanilla HTML/CSS/JS (no frameworks, no build step)
- PWA: Web App Manifest + Service Worker
- Fonts: Syne + DM Sans (Google Fonts)
- Storage: localStorage
