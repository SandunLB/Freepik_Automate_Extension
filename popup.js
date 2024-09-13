// popup.js
document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({action: "checkFreepikUrl"}, function(response) {
      if (response.isFreepikUrl) {
        // We're on Freepik, close the popup
        window.close();
      } else {
        // We're not on Freepik, show the popup content
        document.body.style.display = 'block';
        const button = document.getElementById('goToFreepik');
        button.addEventListener('click', function() {
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              chrome.tabs.update(tabs[0].id, {url: 'https://www.freepik.com/pikaso/ai-image-generator/'});
            } else {
              chrome.tabs.create({url: 'https://www.freepik.com/pikaso/ai-image-generator/'});
            }
            window.close();
          });
        });
      }
    });
  });