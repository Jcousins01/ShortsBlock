const SHORTS_REGEX = /https?:\/\/(?:www\.)?youtube\.com\/shorts/i;
const FALLBACK_URL = "https://www.youtube.com/";
const NOTIFICATION_ID = "shortsban-block";
const previousUrlByTab = new Map();
let sessionBlockCount = 0;
let lastBlockToken = null;

browser.runtime.onInstalled.addListener(initializeState);
browser.runtime.onStartup.addListener(initializeState);
initializeState().catch((error) => console.error("ShortsBan failed to initialize:", error));

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    handleUrlChange(tabId, changeInfo.url);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  previousUrlByTab.delete(tabId);
});

async function initializeState() {
  await Promise.all([seedKnownTabs(), resetSessionState()]);
}

async function seedKnownTabs() {
  try {
    const tabs = await browser.tabs.query({});
    tabs.forEach((tab) => {
      if (tab.id !== undefined && tab.url) {
        previousUrlByTab.set(tab.id, tab.url);
      }
    });
  } catch (error) {
    console.error("ShortsBan failed to seed tabs:", error);
  }
}

async function resetSessionState() {
  sessionBlockCount = 0;
  lastBlockToken = null;
  try {
    await browser.storage.local.set({
      sessionBlockCount,
      lastBlockToken: null,
      lastAcknowledgedBlockToken: null,
    });
  } catch (error) {
    console.error("ShortsBan failed to reset session state:", error);
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
    await browser.tabs.update(tabId, { url: restoreUrl });
  } catch (error) {
    console.error("ShortsBan could not revert tab:", error);
  }

  sessionBlockCount += 1;
  lastBlockToken = Date.now();
  await browser.storage.local.set({
    sessionBlockCount,
    lastBlockToken,
  });

  browser.runtime
    .sendMessage({
      type: "SHORTS_BLOCKED",
      sessionBlockCount,
      blockToken: lastBlockToken,
    })
    .catch(() => {});
  await showPopupOrNotify(blockedUrl, restoreUrl);
}

async function showPopupOrNotify(blockedUrl, restoreUrl) {
  if (typeof browser.browserAction.openPopup === "function") {
    try {
      await browser.browserAction.openPopup();
      return;
    } catch (error) {
      console.warn("ShortsBan could not auto-open popup:", error);
    }
  }

  await notifyBlock(blockedUrl, restoreUrl);
}

async function notifyBlock(blockedUrl, restoreUrl) {
  try {
    await browser.notifications.create(NOTIFICATION_ID, {
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/Youtube_shorts_icon.svg"),
      title: "ShortsBan",
      message: "We stopped a Shorts link and put you back where you were.",
    });
  } catch (error) {
    console.error("ShortsBan failed to show notification:", error);
  }
}
