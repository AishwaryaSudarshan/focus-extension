// Focus Mode Extension Background Script
// Handles notification simulation, tab detection, badge, and summary delivery

let heldNotifications = [];
let inFocusZone = false;
let currentFocusSite = null;
// List of focus sites (can be customized or loaded from storage)
const FOCUS_SITES = [
  'docs.google.com',
  'notion.so',
  'github.com',
];

let isOnFocusTab = false;
let cachedNotifications = [];

// Helper to check if a URL is a focus site
function isFocusSite(url) {
  return FOCUS_SITES.some(site => url.includes(site));
}

// Listen for tab changes
// Unified tab change logic using focusZones from storage
function handleTabChangeWithZones(url) {
  chrome.storage.sync.get(['focusZones'], result => {
    const zones = result.focusZones || [];
    const wasOnFocusTab = isOnFocusTab;
    isOnFocusTab = isFocusZone(url, zones);
    if (wasOnFocusTab && !isOnFocusTab) {
      // User left focus tab, release notifications
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
// Unified message listener with defensive checks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'show_notification') {
    // Defensive: ensure message.options is a valid object
    const options = message.options && typeof message.options === 'object' ? message.options : null;
    if (isOnFocusTab) {
      if (options && options.type && options.iconUrl && options.title && options.message) {
        cachedNotifications.push(options);
        updateBadge();
        sendResponse({cached: true});
      } else {
        sendResponse({error: 'Invalid notification options'});
      }
    } else {
      if (options && options.type && options.iconUrl && options.title && options.message) {
        try {
          chrome.notifications.create('', options);
          sendResponse({shown: true});
        } catch (e) {
          console.error('Notification creation failed:', e, options);
          sendResponse({error: 'Notification creation failed', details: e.toString()});
        }
      } else {
        console.error('Invalid notification options:', options);
        sendResponse({error: 'Invalid notification options', details: options});
      }
    }
  } else if (message.type === 'get_cached_count') {
    sendResponse({ count: cachedNotifications.length });
  }
});

function releaseCachedNotifications() {
  if (cachedNotifications.length === 0) return;
  // Show each cached notification in a separate popup, skip invalid ones
  cachedNotifications.forEach((options, idx) => {
    if (options && options.type && options.iconUrl && options.title && options.message) {
      try {
        chrome.notifications.create(`focus_cached_${Date.now()}_${idx}`, options);
      } catch (e) {
        console.error('Notification creation failed:', e, options);
      }
    } else {
      console.error('Invalid notification options:', options);
    }
  });
  cachedNotifications = [];
  updateBadge();
}

// Helper: update badge
function updateBadge() {
  // Show cached notification count as badge
  const count = cachedNotifications.length;
  chrome.action.setBadgeText({ text: count ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: count ? '#FF5722' : '#CCCCCC' });
}

// Helper: check if URL matches focus zone
function isFocusZone(url, zones) {
  return zones.some(site => url.includes(site));
}

// Listen for tab changes
// ...existing code...

// On extension startup, clear badge
chrome.runtime.onStartup.addListener(() => {
  heldNotifications = [];
  cachedNotifications = [];
  updateBadge();
});

chrome.runtime.onInstalled.addListener(() => {
  heldNotifications = [];
  cachedNotifications = [];
  updateBadge();
});
