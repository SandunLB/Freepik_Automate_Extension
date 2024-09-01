chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.reload(tab.id, () => {
      chrome.sidePanel.open({ tabId: tab.id });
  });
});

// Reload Page Everytime Extention loads, for further developments

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (tabs[0]) {
//           chrome.scripting.executeScript({
//               target: { tabId: tabs[0].id },
//               function: () => {
//                   if (!sessionStorage.getItem('pageReloaded')) {
//                       sessionStorage.setItem('pageReloaded', 'true');
//                       window.location.reload();
//                   }
//               }
//           });
//       }
//   });
// });


