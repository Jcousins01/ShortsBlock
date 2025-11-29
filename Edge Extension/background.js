const SHORTS_REGEX = /https?:\/\/(?:www\.)?youtube\.com\/shorts/i;
const FALLBACK_URL = "https://www.youtube.com/";
const NOTIFICATION_ID = "shortsblock-block";
const previousUrlByTab = new Map();
let sessionBlockCount = 0;
let lastBlockToken = null;

chrome.runtime.onInstalled.addListener(initializeState);
chrome.runtime.onStartup.addListener(initializeState);
initializeState().catch((error) => console.error("ShortsBlock failed to initialize:", error));

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleUrlChange(tabId, changeInfo.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  previousUrlByTab.delete(tabId);
});

async function initializeState() {
  await Promise.all([seedKnownTabs(), resetSessionState()]);
}

async function seedKnownTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      if (tab.id !== undefined && tab.url) {
        previousUrlByTab.set(tab.id, tab.url);
      }
    });
  } catch (error) {
    console.error("ShortsBlock failed to seed tabs:", error);
  }
}

async function resetSessionState() {
  sessionBlockCount = 0;
  lastBlockToken = null;
  try {
    await chrome.storage.local.set({
      sessionBlockCount,
      lastBlockToken: null,
      lastAcknowledgedBlockToken: null,
    });
  } catch (error) {
    console.error("ShortsBlock failed to reset session state:", error);
  }
}

async function handleUrlChange(tabId, url) {
  if (!url) {
    return;
  }

  if (SHORTS_REGEX.test(url)) {
    await blockShortsUrl(tabId, url);
  } else {
    previousUrlByTab.set(tabId, url);
  }
}

async function blockShortsUrl(tabId, blockedUrl) {
  let restoreUrl = previousUrlByTab.get(tabId) || FALLBACK_URL;
  
  // Prevent infinite loop: if previous URL is also a Shorts URL, use fallback
  if (SHORTS_REGEX.test(restoreUrl)) {
    restoreUrl = FALLBACK_URL;
  }

  try {
    await chrome.tabs.update(tabId, { url: restoreUrl });
  } catch (error) {
    console.error("ShortsBlock could not revert tab:", error);
  }

  sessionBlockCount += 1;
  lastBlockToken = Date.now();
  await chrome.storage.local.set({
    sessionBlockCount,
    lastBlockToken,
  });

  // Send message to popup if open
  chrome.runtime
    .sendMessage({
      type: "SHORTS_BLOCKED",
      sessionBlockCount,
      blockToken: lastBlockToken,
    })
    .catch(() => {}); // Popup might not be open, ignore error
  
  await showBadgeOrNotify(blockedUrl, restoreUrl);
}

async function showBadgeOrNotify(blockedUrl, restoreUrl) {
  // Chrome doesn't support auto-opening popups, so we use badge and notification
  try {
    await chrome.action.setBadgeText({ text: "!" });
    await chrome.action.setBadgeBackgroundColor({ color: "#667eea" });
  } catch (error) {
    console.warn("ShortsBlock could not set badge:", error);
  }

  await notifyBlock(blockedUrl, restoreUrl);
}

async function notifyBlock(blockedUrl, restoreUrl) {
  try {
    await chrome.notifications.create(NOTIFICATION_ID, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon-48.png"),
      title: "ShortsBlock",
      message: "We stopped a Shorts link and put you back where you were.",
    });
  } catch (error) {
    console.error("ShortsBlock failed to show notification:", error);
  }
}
