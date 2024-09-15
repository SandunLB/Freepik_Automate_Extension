// content.js

// Constants
const SELECTORS = {
  EXCLUDE_BUTTON: 'button',
  NEGATIVE_TEXTAREA: 'textarea[placeholder="Describe things to avoid on the image"]',
  AI_PROMPT_TOGGLE: 'button.relative.h-4.w-8.rounded-full.bg-neutral-300',
  AI_PROMPT_CONTAINER: 'div[tooltip="Improve short prompts"]',
  BLOB_IMAGES: 'img[src^="blob:"]'
};

const MESSAGES = {
  SHOW_EXCLUDE_BUTTON: { action: 'showExcludeButton' },
  HIDE_EXCLUDE_BUTTON: { action: 'hideExcludeButton' },
  SHOW_NEGATIVE_PROMPT: { action: 'showNegativePrompt' },
  HIDE_NEGATIVE_PROMPT: { action: 'hideNegativePrompt' },
  ENABLE_AI_PROMPT: { action: 'enableAiPromptToggle' },
  DISABLE_AI_PROMPT: { action: 'disableAiPromptToggle' }
};

// Global variable to store the current prompt name
let currentPromptName = '';

// Main function
(function() {
  setupObservers();
  setupMessageListeners();
})();

// Observer setup
function setupObservers() {
  setupMainObserver();
  setupAiPromptObserver();
}

function setupMainObserver() {
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { 
    childList: true, 
    subtree: true, 
    attributes: true, 
    attributeFilter: ['style'] 
  });
}

function setupAiPromptObserver() {
  const targetButton = document.querySelector(SELECTORS.AI_PROMPT_TOGGLE);
  if (targetButton) {
    const aiPromptObserver = new MutationObserver(handleAiPromptMutations);
    aiPromptObserver.observe(targetButton, { attributes: true });
  } else {
    console.log('AI-prompt toggle button not found');
  }
}

// Mutation handlers
function handleMutations(mutationsList) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList' || mutation.type === 'attributes') {
      updateButtonVisibility();
      updateNegativePromptVisibility();
    }
  }
}

function handleAiPromptMutations(mutationsList) {
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const targetButton = mutation.target;
      const isOn = targetButton.classList.contains('bg-blue-500');
      const isOff = targetButton.classList.contains('bg-neutral-300');
      if (isOn) {
        console.log('AI-prompt is ON');
        chrome.runtime.sendMessage(MESSAGES.ENABLE_AI_PROMPT);
      } else if (isOff) {
        console.log('AI-prompt is OFF');
        chrome.runtime.sendMessage(MESSAGES.DISABLE_AI_PROMPT);
      }
    }
  });
}

// UI update functions
function updateButtonVisibility() {
  const excludeButton = findExcludeButton();
  chrome.runtime.sendMessage(excludeButton ? MESSAGES.SHOW_EXCLUDE_BUTTON : MESSAGES.HIDE_EXCLUDE_BUTTON);
}

function updateNegativePromptVisibility() {
  const negativeTextarea = document.querySelector(SELECTORS.NEGATIVE_TEXTAREA);
  chrome.runtime.sendMessage(negativeTextarea ? MESSAGES.SHOW_NEGATIVE_PROMPT : MESSAGES.HIDE_NEGATIVE_PROMPT);
}

// Helper functions
function findExcludeButton() {
  return Array.from(document.querySelectorAll(SELECTORS.EXCLUDE_BUTTON)).find(btn => {
    return btn.textContent.trim() === "Exclude" && 
           btn.querySelector('svg use')?.getAttribute('xlink:href') === "#icon-exclude";
  });
}

// Message listeners
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'clickExcludeButton':
        handleClickExcludeButton();
        break;
      case 'updateNegativePrompt':
        handleUpdateNegativePrompt(request.value);
        break;
      case 'toggleAiPrompt':
        handleToggleAiPrompt();
        break;
      case 'downloadImages':
        downloadImagesWithIncrementalScroll(request.count);
        break;
      case 'updateCurrentPrompt':
        handleUpdateCurrentPrompt(request.promptName);
        break;
    }
  });
}

// Message handlers
function handleClickExcludeButton() {
  const excludeButton = findExcludeButton();
  if (excludeButton) {
    console.log('Exclude Button found:', excludeButton);
    console.log('Exclude Button Disabled:', excludeButton.disabled);
    excludeButton.click();
    console.log('Exclude Button clicked');
    
    setTimeout(() => {
      updateNegativePromptVisibility();
    }, 100);
  } else {
    console.error('Exclude Button not found');
  }
}

function handleUpdateNegativePrompt(value) {
  const negativeTextarea = document.querySelector(SELECTORS.NEGATIVE_TEXTAREA);
  if (negativeTextarea) {
    negativeTextarea.value = value;
    negativeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('Negative prompt updated:', value);
  } else {
    console.error('Negative prompt textarea not found');
  }
}

function handleToggleAiPrompt() {
  const aiPromptToggleContainer = document.querySelector(SELECTORS.AI_PROMPT_CONTAINER);
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

function handleUpdateCurrentPrompt(promptName) {
  currentPromptName = promptName;
  console.log('Current prompt updated:', currentPromptName);
}

// Image download functionality
async function downloadImagesWithIncrementalScroll(totalImagesToDownload) {
  let downloadedCount = 0;
  const downloadedUrls = new Set();

  while (downloadedCount < totalImagesToDownload) {
    const imgElements = document.querySelectorAll(SELECTORS.BLOB_IMAGES);
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
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Downloaded ${downloadedCount} images out of ${totalImagesToDownload} requested.`);
}

async function scrollDown() {
  const scrollableElement = findScrollableParent(document.querySelector(SELECTORS.BLOB_IMAGES));
  if (!scrollableElement) {
    console.error('No scrollable container found');
    return;
  }

  const previousScrollTop = scrollableElement.scrollTop;
  scrollableElement.scrollTop += scrollableElement.clientHeight / 2;

  await new Promise(resolve => setTimeout(resolve, 500));

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
        
        // Get the first 5 words of the current prompt
        const firstFiveWords = currentPromptName.split(' ').slice(0, 5).join('_');
        
        // Create a sanitized version of the first five words
        const sanitizedWords = firstFiveWords.replace(/[^a-z0-9_]/gi, '').toLowerCase();
        
        // Combine the sanitized words with the index for the filename
        a.download = `${sanitizedWords}-${index}.png`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      })
      .catch(reject);
  });
}