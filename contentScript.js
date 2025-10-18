window.addEventListener('notify-extension', function(e) {
  chrome.runtime.sendMessage({
    type: 'show_notification',
    options: e.detail
  });
});