// content.js
(function() {
    function setupObserver() {
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    const excludeButton = Array.from(document.querySelectorAll('button')).find(btn => {
                        return btn.textContent.trim() === "Exclude" && 
                               btn.querySelector('svg use')?.getAttribute('xlink:href') === "#icon-exclude";
                    });

                    const negativeTextarea = document.querySelector('textarea[placeholder="Describe things to avoid on the image"]');

                    if (excludeButton) {
                        
                        chrome.runtime.sendMessage({ action: 'showExcludeButton' });
                    } else {
                        
                        chrome.runtime.sendMessage({ action: 'hideExcludeButton' });
                    }

                    if (negativeTextarea) {
                        
                        chrome.runtime.sendMessage({ action: 'showNegativePrompt' });
                    } else {
                        
                        chrome.runtime.sendMessage({ action: 'hideNegativePrompt' });
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

        // Set up observer for AI-prompt toggle button
        const targetButton = document.querySelector('button.relative.h-4.w-8.rounded-full.bg-neutral-300');
        if (targetButton) {
            const aiPromptObserver = new MutationObserver((mutationsList) => {
                mutationsList.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isOn = targetButton.classList.contains('bg-blue-500');
                        const isOff = targetButton.classList.contains('bg-neutral-300');
                        if (isOn) {
                            console.log('AI-prompt is ON');
                            chrome.runtime.sendMessage({ action: 'enableAiPromptToggle' });
                        } else if (isOff) {
                            console.log('AI-prompt is OFF');
                            chrome.runtime.sendMessage({ action: 'disableAiPromptToggle' });
                        }
                    }
                });
            });
            aiPromptObserver.observe(targetButton, { attributes: true });
        } else {
            console.log('AI-prompt toggle button not found');
        }
    }

    setupObserver();

    // Listen for messages from the sidebar
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'clickExcludeButton') {
            const excludeButton = Array.from(document.querySelectorAll('button')).find(btn => {
                return btn.textContent.trim() === "Exclude" && 
                       btn.querySelector('svg use')?.getAttribute('xlink:href') === "#icon-exclude";
            });

            if (excludeButton) {
                console.log('Exclude Button found:', excludeButton);
                console.log('Exclude Button Disabled:', excludeButton.disabled);
                excludeButton.click();
                console.log('Exclude Button clicked');
                
                setTimeout(() => {
                    const negativeTextarea = document.querySelector('textarea[placeholder="Describe things to avoid on the image"]');
                    if (negativeTextarea) {
                        chrome.runtime.sendMessage({ action: 'showNegativePrompt' });
                    } else {
                        chrome.runtime.sendMessage({ action: 'hideNegativePrompt' });
                    }
                }, 100);
            } else {
                console.error('Exclude Button not found');
            }
        } else if (request.action === 'updateNegativePrompt') {
            const negativeTextarea = document.querySelector('textarea[placeholder="Describe things to avoid on the image"]');
            if (negativeTextarea) {
                negativeTextarea.value = request.value;
                negativeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('Negative prompt updated:', request.value);
            } else {
                console.error('Negative prompt textarea not found');
            }
        } else if (request.action === 'toggleAiPrompt') {
            const aiPromptToggleContainer = document.querySelector('div[tooltip="Improve short prompts"]');
            if (aiPromptToggleContainer) {
                const aiPromptToggle = aiPromptToggleContainer.querySelector('button');
                if (aiPromptToggle) {
                    aiPromptToggle.click();
                    console.log('AI-prompt toggled');
                } else {
                    console.error('AI-prompt toggle button not found inside the container');
                }
            } else {
                console.error('AI-prompt toggle container not found');
            }
        }
    });
})();



//-----------------------------------------------------------IMAGE DOWNLOAD SCRIPT----------------------------------------------------------------//



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'downloadImages') {
      downloadImagesWithIncrementalScroll(request.count);
    }
  });
  
  async function downloadImagesWithIncrementalScroll(totalImagesToDownload) {
    let downloadedCount = 0;
    const downloadedUrls = new Set();
  
    while (downloadedCount < totalImagesToDownload) {
      const imgElements = document.querySelectorAll('img[src^="blob:"]');
      let allImagesDownloaded = true;
  
      for (let i = 0; i < imgElements.length && downloadedCount < totalImagesToDownload; i++) {
        const imgElement = imgElements[i];
        if (imgElement && imgElement.src && !downloadedUrls.has(imgElement.src)) {
          try {
            await downloadImage(imgElement.src, downloadedCount);
            downloadedCount++;
            downloadedUrls.add(imgElement.src);
            chrome.runtime.sendMessage({ 
              action: 'updateCurrentCount', 
              count: downloadedCount 
            });
          } catch (error) {
            console.error(`Error downloading image ${downloadedCount + 1}:`, error);
            allImagesDownloaded = false;
          }
        }
      }
  
      if (allImagesDownloaded) {
        await scrollDown();
        // Wait for new images to potentially load after scrolling
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Wait and retry downloading any missed images
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  
    console.log(`Downloaded ${downloadedCount} images out of ${totalImagesToDownload} requested.`);
  }
  
  async function scrollDown() {
    const scrollableElement = findScrollableParent(document.querySelector('img[src^="blob:"]'));
    if (!scrollableElement) {
      console.error('No scrollable container found');
      return;
    }
  
    const previousScrollTop = scrollableElement.scrollTop;
    scrollableElement.scrollTop += scrollableElement.clientHeight / 2;
  
    // Wait for the scroll to complete
    await new Promise(resolve => setTimeout(resolve, 500));
  
    // Check if the scroll was successful
    if (scrollableElement.scrollTop === previousScrollTop) {
      console.log('Reached the bottom of the page or unable to scroll further');
    }
  }
  
  function findScrollableParent(element) {
    if (!element) return document.documentElement;
    
    if (element.scrollHeight > element.clientHeight) {
      return element;
    } else {
      return findScrollableParent(element.parentElement);
    }
  }
  
  function downloadImage(blobUrl, index) {
    return new Promise((resolve, reject) => {
      fetch(blobUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `downloaded-image-${index}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        })
        .catch(reject);
    });
  }