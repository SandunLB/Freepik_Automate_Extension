//-----------------------TEXT PROMPT+TEXT FILE INPUT+EXCLUDE BTN+NEGATIVE PROMPT+AI MODE TOGGLE+REF IMAGE-----------------------//
// Constants
const FILE_INPUT_ID = 'fileInput';
const START_BUTTON_ID = 'startButton';
const PROMPT_TEXTAREA_CLASS = '.prompt-textarea';
const AI_PROMPT_TOGGLE_ID = 'aiPromptToggle';
const EXCLUDE_BUTTON_CLASS = '.exclude-button';
const NEGATIVE_SECTION_CLASS = '.negative-form-section';
const NEGATIVE_TEXTAREA_CLASS = '.negative-prompt-textarea';
const IMAGE_REF_BUTTON_CLASS = '.image-ref-button';

// Global variables
let lines = [];
let currentLine = -1;

// DOM Elements
const fileInput = document.getElementById(FILE_INPUT_ID);
const startButton = document.getElementById(START_BUTTON_ID);
const extensionTextarea = document.querySelector(PROMPT_TEXTAREA_CLASS);
const aiPromptToggle = document.getElementById(AI_PROMPT_TOGGLE_ID);
const excludeButton = document.querySelector(EXCLUDE_BUTTON_CLASS);
const negativeSection = document.querySelector(NEGATIVE_SECTION_CLASS);
const negativeTextarea = document.querySelector(NEGATIVE_TEXTAREA_CLASS);
const imageRefButton = document.querySelector(IMAGE_REF_BUTTON_CLASS);

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        resetFileState();
        const reader = new FileReader();
        reader.onload = (e) => {
            lines = e.target.result.split('\n').filter(line => line.trim() !== '');
            console.log(`File loaded with ${lines.length} lines.`);
        };
        reader.readAsText(file);
    }
}

function resetFileState() {
    lines = [];
    currentLine = -1;
}

// Text area handling functions
function updateMainPageTextarea(text) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: handleTextareaInput,
            args: [text]
        });
    });
}

function handleTextareaInput(currentValue) {
    const textarea = document.querySelector('textarea');
    if (textarea) {
        console.log('Textarea found:', textarea);
        console.log('Current value:', textarea.value);
        textarea.value = currentValue;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Textarea content updated and input event dispatched');
    } else {
        console.error('Textarea not found');
    }
}

function replaceText() {
    if (lines.length > 0) {
        currentLine++;
        if (currentLine < lines.length) {
            const newText = lines[currentLine].trim();
            if (extensionTextarea) {
                extensionTextarea.value = newText;
                extensionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                updateMainPageTextarea(newText);
                console.log(`Displayed line ${currentLine + 1} of ${lines.length}`);
            }
        } else {
            handleEndOfFile();
        }
    } else {
        console.log('No file loaded or all lines displayed. Please select a file.');
    }
}

function handleEndOfFile() {
    console.log('End of file reached. Select a file again to start over.');
    resetFileState();
    fileInput.value = '';
    extensionTextarea.value = '';
    updateMainPageTextarea('');
}

// AI Prompt Toggle functions
function handleAiPromptToggle(event) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleAiPrompt' });
    });
}

// Exclude Button and Negative Prompt functions
function handleExcludeButtonClick() {
    console.log('Exclude button clicked in sidebar');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'clickExcludeButton' });
    });
}

function handleNegativePromptInput(event) {
    console.log('Text entered in the negative prompt textarea:', event.target.value);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'updateNegativePrompt', 
            value: event.target.value 
        });
    });
}

// Image Reference Button function
function handleAddImageReferenceClick() {
    const addImageButton = document.querySelector('button[tooltip="Add image as reference"]');
    if (addImageButton) {
        console.log('Add Image Reference Button found:', addImageButton);
        console.log('Add Image Reference Button Disabled:', addImageButton.disabled);
        addImageButton.click();
        console.log('Add Image Reference Button clicked');
    } else {
        console.error('Add Image Reference Button not found');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fileInput.addEventListener('click', () => fileInput.value = '');
    fileInput.addEventListener('change', handleFileSelect);
    extensionTextarea.addEventListener('input', (event) => updateMainPageTextarea(event.target.value));
    startButton.addEventListener('click', replaceText);
    aiPromptToggle.addEventListener('change', handleAiPromptToggle);
    excludeButton.addEventListener('click', handleExcludeButtonClick);
    negativeTextarea.addEventListener('input', handleNegativePromptInput);
    imageRefButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: handleAddImageReferenceClick,
            });
        });
    });
});

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'enableAiPromptToggle':
            aiPromptToggle.disabled = false;
            aiPromptToggle.checked = true;
            break;
        case 'disableAiPromptToggle':
            aiPromptToggle.disabled = false;
            aiPromptToggle.checked = false;
            break;
        case 'showExcludeButton':
            excludeButton.style.display = 'inline-block';
            console.log('Exclude button displayed in sidebar');
            break;
        case 'hideExcludeButton':
            excludeButton.style.display = 'none';
            console.log('Exclude button hidden in sidebar');
            break;
        case 'showNegativePrompt':
            negativeSection.style.display = 'block';
            console.log('Negative prompt section shown in sidebar');
            break;
        case 'hideNegativePrompt':
            negativeSection.style.display = 'none';
            console.log('Negative prompt section hidden in sidebar');
            break;
    }
});


//-----------------------STYLE+COLOR+CAMERA+LIGHTING+STRUCTURE-----------------------//
// Function to be injected into the target webpage to click buttons
function clickButtonOnPage(buttonText) {
    const buttons = document.querySelectorAll('button span.text-xs.font-semibold.capitalize');
    const targetButton = Array.from(buttons).find(button => 
        button.textContent.trim().toLowerCase() === buttonText.toLowerCase()
    );
    
    if (targetButton) {
        targetButton.closest('button').click();
        console.log(`Clicked ${buttonText} button`);
    } else {
        console.log(`${buttonText} button not found`);
    }
}

// Function to be injected into the target webpage to fetch button values and highlight active tab
function fetchButtonValuesAndHighlightTab() {
    const buttons = document.querySelectorAll('button');
    const buttonData = Array.from(buttons).map(button => {
        const nameSpan = button.querySelector('span.text-xs.font-semibold.capitalize');
        const valueSpan = button.querySelector('div.whitespace-nowrap.text-xs.capitalize.text-neutral-400.lg\\:text-neutral-100');
        const imageSpan = button.querySelector('span.hidden.h-7.w-7.items-center.justify-center.lg\\:flex img');
        
        if (nameSpan) {
            const name = nameSpan.textContent.trim();
            let value = valueSpan ? valueSpan.textContent.trim() : '';
            let imageUrl = '';

            if (name.toLowerCase() === 'structure' && imageSpan) {
                imageUrl = imageSpan.src;
                value = 'Image'; // Placeholder text for the image
            }

            return { name, value, imageUrl };
        }
        return null;
    }).filter(Boolean);

    // Remove existing highlights and texts from all tabs
    document.querySelectorAll('.tab-highlight, .tab-text').forEach(el => el.remove());

    // Add style for animation if it doesn't exist
    if (!document.getElementById('tab-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'tab-highlight-style';
        style.textContent = `
            @keyframes gradientBG {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);
    }

    // Highlight active tab
    const activeTab = document.querySelector('aside[data-v-a64a0a04][tab]');
    if (activeTab) {
        const tabName = activeTab.getAttribute('tab');
        const displayName = tabName === 'framing' ? 'camera' : tabName;
        
        // Create and add new highlight
        const highlight = document.createElement('div');
        highlight.className = 'tab-highlight';
        highlight.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(-45deg, rgba(173, 10, 238, 0.4), rgba(97, 13, 227, 0.4), rgba(147, 7, 240, 0.4), rgba(35, 213, 171, 0.4));
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            z-index: -1;
            opacity: 0.9;
            filter: blur(10px);
        `;
        activeTab.appendChild(highlight);

        // Create and add text
        const text = document.createElement('div');
        text.className = 'tab-text';
        text.textContent = `Select ${displayName}`;
        text.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 25px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1;
        `;
        activeTab.appendChild(text);
    }

    return buttonData;
}

// Function to update button values in the popup
function updateButtonValues() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: fetchButtonValuesAndHighlightTab
        }, (results) => {
            if (results && results[0] && results[0].result) {
                const buttonData = results[0].result;
                buttonData.forEach(data => {
                    const button = document.getElementById(`${data.name.toLowerCase()}Btn`);
                    if (button) {
                        if (data.name.toLowerCase() === 'structure' && data.imageUrl) {
                            button.innerHTML = `${data.name}: <img src="${data.imageUrl}" alt="Structure">`;
                        } else {
                            button.textContent = `${data.name}: ${data.value || 'N/A'}`;
                        }
                    }
                });
            }
        });
    });
}

// Function to set up MutationObserver in the target webpage
function setupMutationObserver() {
    const targetNode = document.querySelector('div.scrollbar-hidden.relative.order-first.flex.gap-px');
    if (!targetNode) return;

    const config = { attributes: true, childList: true, subtree: true };
    const callback = function(mutationsList, observer) {
        chrome.runtime.sendMessage({action: "updatePopup"});
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
}

// Set up event listeners and initialize
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonName = this.textContent.split(':')[0].trim();
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    function: clickButtonOnPage,
                    args: [buttonName]
                });
            });
        });
    });
    
    // Initial update
    updateButtonValues();

    // Set up MutationObserver in the target webpage
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: setupMutationObserver
        });
    });

    // Fallback update every 15 seconds
    setInterval(updateButtonValues, 15000);
});

// Set up message listener for MutationObserver updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updatePopup") {
        updateButtonValues();
    }
});
//-----------------------CSV DOWNLOAD BUTTON-----------------------//
document.addEventListener('DOMContentLoaded', function() {
    const downloadCSVButton = document.getElementById('downloadCSV');

    downloadCSVButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'downloadCSV'});
        });
    });
});


//-----------------------CREATE BUTTON + DOWNLOAD BUTTON INDIVIDUAL FUNCTIONALITY-----------------------//
// Create Button Logic
const clickCreateButton = () => {
    const createButton = document.querySelector('button[data-cy="create"]');
    if (createButton) {
      const rect = createButton.getBoundingClientRect();
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true
      });
      const mouseClickEvent = new MouseEvent('click', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true
      });
      document.dispatchEvent(mouseMoveEvent);
      createButton.dispatchEvent(mouseClickEvent);
      console.log('Create Button clicked on the webpage');
    } else {
      console.error('Create Button not found on the webpage');
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    const createButton = document.getElementById('create-button');
    const downloadButton = document.getElementById('download-button');
  
    createButton.addEventListener('click', () => {
      console.log('Create button clicked');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: clickCreateButton
        });
  
        // Set a 1000ms timer before clicking the download button
        setTimeout(() => {
          console.log('Triggering download button after 1000ms');
          downloadButton.click();
        }, 1200);
      });
    });
  });
  
  
  // Download Button Logic
  document.addEventListener('DOMContentLoaded', function() {
    const imageCountDropdown = document.getElementById('image-count');
    const totalImagesSpan = document.getElementById('total-images');
    const currentCountSpan = document.getElementById('current-count');
    const downloadButton = document.getElementById('download-button');
    let selectedImageCount = 1; // Default value
  
    // Handle dropdown change event
    imageCountDropdown.addEventListener('change', function() {
      selectedImageCount = parseInt(this.value);
      totalImagesSpan.innerText = selectedImageCount;
      currentCountSpan.innerText = '0'; // Reset current count
    });
  
    // Handle download button click event
    downloadButton.addEventListener('click', function() {
      console.log('Download button clicked');
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'downloadImages',
          count: selectedImageCount
        });
      });
    });
  
    // Listen for updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateCurrentCount') {
        currentCountSpan.innerText = request.count;
      }
    });
  });
