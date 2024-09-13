// background.js

function isFreepikUrl(url) {
  return url.startsWith("https://www.freepik.com/") || url.startsWith("http://www.freepik.com/");
}

chrome.action.onClicked.addListener((tab) => {
  if (isFreepikUrl(tab.url)) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(error => {
      console.error("Error opening side panel:", error);
    });
  } else {
    chrome.action.setPopup({ tabId: tab.id, popup: "popup.html" });
    chrome.action.openPopup();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (isFreepikUrl(tab.url)) {
      chrome.action.setPopup({ tabId: tab.id, popup: "" });
    } else {
      chrome.action.setPopup({ tabId: tab.id, popup: "popup.html" });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkFreepikUrl") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        sendResponse({isFreepikUrl: isFreepikUrl(tabs[0].url)});
      } else {
        sendResponse({isFreepikUrl: false});
      }
    });
    return true;  // Indicates we will send a response asynchronously
  }
});