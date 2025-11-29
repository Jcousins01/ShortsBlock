(function () {
  const clearBadgeBtn = document.getElementById("clear-badge");
  const sessionCountEl = document.getElementById("session-count");
  if (!clearBadgeBtn || !sessionCountEl) {
    return;
  }

  let autoCloseTimer = null;
  let latestBlockToken = null;

  // Safari uses chrome.* API namespace for compatibility
  const browserAPI = typeof chrome !== "undefined" ? chrome : browser;

  const startAutoClose = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    autoCloseTimer = setTimeout(dismissPopup, 3000);
  };

  const acknowledgeBlock = async () => {
    const token = latestBlockToken ?? (await getLatestToken());
    if (!token) {
      return;
    }

    await browserAPI.storage.local.set({ lastAcknowledgedBlockToken: token });
  };

  const getLatestToken = async () => {
    const { lastBlockToken = null } = await browserAPI.storage.local.get("lastBlockToken");
    latestBlockToken = lastBlockToken;
    return latestBlockToken;
  };

  function renderSessionCount(count) {
    if (!sessionCountEl) {
      return;
    }
    if (count > 0) {
      sessionCountEl.textContent = `${count} short${count === 1 ? "" : "s"} blocked this session. Great job!`;
    } else {
      sessionCountEl.textContent = "No Shorts blocked this session yet.";
    }
  }

  async function init() {
    const {
      sessionBlockCount = 0,
      lastBlockToken = null,
      lastAcknowledgedBlockToken = null,
    } = await browserAPI.storage.local.get(["sessionBlockCount", "lastBlockToken", "lastAcknowledgedBlockToken"]);
    latestBlockToken = lastBlockToken;
    renderSessionCount(sessionBlockCount);

    if (lastBlockToken && lastBlockToken !== lastAcknowledgedBlockToken) {
      startAutoClose();
    }
  }

  const dismissPopup = async () => {
    await acknowledgeBlock();
    if (browserAPI.action) {
      browserAPI.action.setBadgeText({ text: "" });
    }
    window.close();
  };

  clearBadgeBtn.addEventListener("click", () => {
    dismissPopup();
  });

  // Support link handler
  const donationLink = document.getElementById("donation-link");
  if (donationLink) {
    donationLink.addEventListener("click", (e) => {
      e.preventDefault();
      const donationUrl = "https://donate.stripe.com/28o2ateSlccqakMfYZ";
      browserAPI.tabs.create({ url: donationUrl });
    });
  }

  browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "SHORTS_BLOCKED") {
      if (message.blockToken) {
        latestBlockToken = message.blockToken;
      }
      if (typeof message.sessionBlockCount === "number") {
        renderSessionCount(message.sessionBlockCount);
      }
      startAutoClose();
    }
    return true; // Keep message channel open for async responses
  });

  init();
})();

