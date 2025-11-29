const SHORTS_REGEX = /https?:\/\/(?:www\.)?youtube\.com\/shorts/i;
const FALLBACK_URL = "https://www.youtube.com/";
const NOTIFICATION_ID = "shortsblock-block";
const previousUrlByTab = new Map();
let sessionBlockCount = 0;
let lastBlockToken = null;

// Safari uses chrome.* API namespace for compatibility
const browserAPI = typeof chrome !== "undefined" ? chrome : browser;

browserAPI.runtime.onInstalled.addListener(initializeState);
browserAPI.runtime.onStartup.addListener(initializeState);
initializeState().catch((error) => console.error("ShortsBlock failed to initialize:", error));

browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleUrlChange(tabId, changeInfo.url);
  }
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
  previousUrlByTab.delete(tabId);
});

async function initializeState() {
  await Promise.all([seedKnownTabs(), resetSessionState()]);
}

async function seedKnownTabs() {
  try {
    const tabs = await browserAPI.tabs.query({});
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
    await browserAPI.storage.local.set({
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
    await browserAPI.tabs.update(tabId, { url: restoreUrl });
  } catch (error) {
    console.error("ShortsBlock could not revert tab:", error);
  }

  sessionBlockCount += 1;
  lastBlockToken = Date.now();
  await browserAPI.storage.local.set({
    sessionBlockCount,
    lastBlockToken,
  });

  // Send message to popup if open
  browserAPI.runtime
    .sendMessage({
      type: "SHORTS_BLOCKED",
      sessionBlockCount,
      blockToken: lastBlockToken,
    })
    .catch(() => {}); // Popup might not be open, ignore error
  
  await showBadgeOrNotify(blockedUrl, restoreUrl);
}

async function showBadgeOrNotify(blockedUrl, restoreUrl) {
  try {
    if (browserAPI.action) {
      await browserAPI.action.setBadgeText({ text: "!" });
      await browserAPI.action.setBadgeBackgroundColor({ color: "#d70022" });
    }
  } catch (error) {
    console.warn("ShortsBlock could not set badge:", error);
  }

  await notifyBlock(blockedUrl, restoreUrl);
}

async function notifyBlock(blockedUrl, restoreUrl) {
  try {
    if (browserAPI.notifications) {
      await browserAPI.notifications.create(NOTIFICATION_ID, {
        type: "basic",
        iconUrl: browserAPI.runtime.getURL("icons/icon-48.png"),
        title: "ShortsBlock",
        message: "We stopped a Shorts link and put you back where you were.",
      });
    }
  } catch (error) {
    console.error("ShortsBlock failed to show notification:", error);
  }
}
