# Privacy Tab Content for Chrome Web Store

## Single Purpose Description

**Purpose**: ShortsBlock blocks YouTube Shorts URLs automatically and redirects you back to your previous page, helping you stay focused and avoid distractions while browsing YouTube.

---

## Permission Justifications

### 1. Tabs Permission

**Why we need it**: 
ShortsBlock needs to monitor when you navigate to YouTube Shorts URLs and automatically redirect you back to your previous page. This permission allows the extension to:
- Detect when you click a Shorts link
- Restore your previous page automatically
- Track your browsing session to provide accurate blocking

**What we do with it**:
- Monitor URL changes only on YouTube domains
- Store the previous URL temporarily in memory (not saved permanently)
- Redirect tabs away from Shorts URLs
- All processing happens locally in your browser

**What we don't do**:
- We don't collect or transmit any tab data
- We don't track your browsing history
- We don't send any information to external servers

---

### 2. Storage Permission

**Why we need it**:
ShortsBlock stores your session block count locally so you can see how many Shorts have been blocked during your current browsing session. This helps you track your progress and stay motivated.

**What we do with it**:
- Store the number of Shorts blocked in the current session (resets when you close the browser)
- Store a temporary token to update the popup display
- All data is stored locally on your device only

**What we don't do**:
- We don't store your browsing history
- We don't store any personal information
- We don't sync data to any external servers
- We don't track you across sessions

---

### 3. Notifications Permission

**Why we need it**:
ShortsBlock shows you a brief notification when it blocks a YouTube Shorts URL, so you know the extension is working and you've been redirected back to your previous page.

**What we do with it**:
- Display a simple notification when a Shorts URL is blocked
- Show the notification only when blocking occurs
- Use the extension icon in the notification

**What we don't do**:
- We don't send push notifications
- We don't use notifications for advertising
- We don't collect data from notifications

---

### 4. Host Permissions (YouTube)

**Why we need it**:
ShortsBlock needs access to YouTube domains to detect when you're navigating to Shorts URLs and block them automatically. This is the core functionality of the extension.

**What we do with it**:
- Monitor URL changes only on youtube.com domains
- Detect when you navigate to /shorts URLs
- Redirect you away from Shorts URLs
- All processing happens locally in your browser

**What we don't do**:
- We don't modify YouTube's website content
- We don't inject any scripts into YouTube pages
- We don't collect any data from YouTube
- We don't track your YouTube activity
- We don't send any information to external servers

---

## Data Collection Summary

**Data Collected**: None

ShortsBlock does not collect, store, or transmit any personal data. All functionality happens locally in your browser:
- Session block counts are stored locally and reset when you close the browser
- Previous URLs are stored temporarily in memory only (not saved)
- No data is sent to any external servers
- No analytics or tracking is performed

**Privacy Policy**: https://jcousins01.github.io/ShortsBlock/PRIVACY.html

---

## User-Friendly Short Versions (for Chrome Web Store fields)

### Tabs Permission
"Needed to detect YouTube Shorts URLs and redirect you back to your previous page automatically."

### Storage Permission  
"Stores your session block count locally so you can see your progress. Data is stored only on your device and resets when you close the browser."

### Notifications Permission
"Shows a brief notification when a Shorts URL is blocked, so you know the extension is working."

### Host Permissions (YouTube)
"Needed to monitor YouTube URLs and automatically block Shorts links. All processing happens locally in your browser."


