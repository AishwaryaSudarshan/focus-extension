// Handles adding/removing focus sites and updating the UI
const siteInput = document.getElementById('siteInput');
const addSiteBtn = document.getElementById('addSiteBtn');
const siteList = document.getElementById('siteList');

// Add a counter element to display cached notifications
function updateCounter(count) {
  let counter = document.getElementById('cachedCounter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'cachedCounter';
    counter.style.margin = '10px 0';
    counter.style.fontWeight = 'bold';
    document.body.prepend(counter);
  }
  counter.textContent = `Cached notifications: ${count}`;
}

// Request cached notification count from background
function fetchCachedCount() {
  chrome.runtime.sendMessage({ type: 'get_cached_count' }, response => {
    updateCounter(response.count || 0);
  });
}

// Update counter on popup open
// document.addEventListener('DOMContentLoaded', fetchCachedCount);

// Optionally, update after sending a test notification
// document.addEventListener('DOMContentLoaded', () => {
//   const testBtn = document.getElementById('testNotify');
//   if (testBtn) {
//     testBtn.addEventListener('click', () => {
//       chrome.runtime.sendMessage({
//         type: 'show_notification',
//         options: {
//           type: 'basic',
//           iconUrl: 'extension/icon16.png',
//           title: 'Test Notification',
//           message: 'This is a simulated test notification.'
//         }
//       }, response => {
//         fetchCachedCount();
//         if (response.cached) {
//           alert('Notification cached due to focus mode.');
//         } else if (response.shown) {
//           alert('Notification shown immediately.');
//         }
//       });
//     });
//   }
// });

function renderSites(sites) {
  siteList.innerHTML = '';
  sites.forEach((site, idx) => {
    const li = document.createElement('li');
    li.textContent = site;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => {
      sites.splice(idx, 1);
      chrome.storage.sync.set({ focusZones: sites }, () => renderSites(sites));
    };
    li.appendChild(removeBtn);
    siteList.appendChild(li);
  });
}

chrome.storage.sync.get(['focusZones'], (result) => {
  renderSites(result.focusZones || []);
});

addSiteBtn.onclick = () => {
  const site = siteInput.value.trim();
  if (!site) return;
  chrome.storage.sync.get(['focusZones'], (result) => {
    const sites = result.focusZones || [];
    if (!sites.includes(site)) {
      sites.push(site);
      chrome.storage.sync.set({ focusZones: sites }, () => {
        siteInput.value = '';
        renderSites(sites);
      });
    }
  });
};

document.getElementById('testNotify').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'show_notification',
    options: {
      type: 'basic',
      iconUrl: 'extension/icon16.png',
      title: 'Test Notification',
      message: 'This is a simulated test notification.'
    }
  }, response => {
    // if (response.shown) {
    //   alert('Notification shown immediately.');
    // }
  });
});