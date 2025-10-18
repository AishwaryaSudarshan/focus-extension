// Focus Mode Extension Background Script

let isOnFocusTab = false;
let cachedNotifications = [];

// Helper: check if URL matches focus zone
function isFocusZone(url, zones) {
  if (!Array.isArray(zones)) return false;
  return zones.some(site => url && url.includes(site));
}

// Listen for tab changes
function handleTabChangeWithZones(url) {
  chrome.storage.sync.get(['focusZones'], result => {
    const zones = Array.isArray(result.focusZones) ? result.focusZones : [];
    const wasOnFocusTab = isOnFocusTab;
    isOnFocusTab = isFocusZone(url, zones);

    // Only release notifications if leaving a focus site for a non-focus site
    if (wasOnFocusTab && !isOnFocusTab) {
      releaseCachedNotifications();
    }
    updateBadge();
  });
}

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    handleTabChangeWithZones(tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    handleTabChangeWithZones(tab.url);
  }
});

// Intercept notification creation
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'show_notification') {
    if (isOnFocusTab) {
      // Cache notification if on focus tab
      cachedNotifications.push(message.options);
      updateBadge();
    } else {
      // Show notification immediately if not on focus tab
      chrome.notifications.create('', message.options);
    }
  }
});

// Release cached notifications
function releaseCachedNotifications() {
  if (cachedNotifications.length === 0) return;
  cachedNotifications.forEach((options, idx) => {
    if (options && options.type && options.iconUrl && options.title && options.message) {
      chrome.notifications.create(`focus_cached_${Date.now()}_${idx}`, options);
    }
  });
  cachedNotifications = [];
  updateBadge();
}

// Update badge
function updateBadge() {
  const count = cachedNotifications.length;
  chrome.action.setBadgeText({ text: count ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: count ? '#FF5722' : '#CCCCCC' });
}