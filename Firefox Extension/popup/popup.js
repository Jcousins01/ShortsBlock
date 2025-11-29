(function () {
  const clearBadgeBtn = document.getElementById("clear-badge");
  const sessionCountEl = document.getElementById("session-count");
  if (!clearBadgeBtn || !sessionCountEl) {
    return;
  }

  let autoCloseTimer = null;
  let latestBlockToken = null;

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

    await browser.storage.local.set({ lastAcknowledgedBlockToken: token });
  };

  const getLatestToken = async () => {
    const { lastBlockToken = null } = await browser.storage.local.get("lastBlockToken");
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
    } = await browser.storage.local.get(["sessionBlockCount", "lastBlockToken", "lastAcknowledgedBlockToken"]);
    latestBlockToken = lastBlockToken;
    renderSessionCount(sessionBlockCount);

    if (lastBlockToken && lastBlockToken !== lastAcknowledgedBlockToken) {
      startAutoClose();
    }
  }

  const dismissPopup = async () => {
    await acknowledgeBlock();
    try {
      if (browser.browserAction && typeof browser.browserAction.setBadgeText === "function") {
        await browser.browserAction.setBadgeText({ text: "" });
      }
    } catch (error) {
      // Ignore - badge not supported on all platforms (e.g., Firefox Android)
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
      browser.tabs.create({ url: donationUrl });
    });
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type === "SHORTS_BLOCKED") {
      if (message.blockToken) {
        latestBlockToken = message.blockToken;
      }
      if (typeof message.sessionBlockCount === "number") {
        renderSessionCount(message.sessionBlockCount);
      }
      startAutoClose();
    }
  });

  init();
})();
