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
    const addImageButton = document.querySelector('button[tooltip="Add image reference"]');
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


//-----------------------AI MODE SELECTOR-----------------------//
document.addEventListener('DOMContentLoaded', initializePopup);

function initializePopup() {
    const modeSelector = document.getElementById('mode-selector');
    let isAIContainerOpen = false;

    modeSelector.addEventListener('mousedown', handleModeSelectorClick);
    modeSelector.addEventListener('change', handleModeSelection);
    modeSelector.addEventListener('change', closeAIModeContainer);

    function handleModeSelectorClick(event) {
        if (event.button === 0) { // Left mouse button
            openAIModeContainerWithRetry()
                .then(() => extractModesFromPage())
                .then(updateModeSelector)
                .catch(error => console.error('Error in handleModeSelectorClick:', error));
        }
    }

    function handleModeSelection(event) {
        const selectedIndex = event.target.value;
        if (selectedIndex !== '') {
            selectMode(parseInt(selectedIndex))
                .then(success => {
                    if (success) {
                        console.log('Mode selection successful');
                        closeAIModeContainer();
                    } else {
                        console.log('Mode selection failed');
                    }
                })
                .catch(error => console.error('Error in handleModeSelection:', error));
        }
    }

    async function openAIModeContainerWithRetry(maxRetries = 3, delay = 500) {
        for (let i = 0; i < maxRetries; i++) {
            const success = await openAIModeContainer();
            if (success) {
                return true;
            }
            console.log(`Attempt ${i + 1} failed. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        console.error(`Failed to open AI Mode Container after ${maxRetries} attempts`);
        return false;
    }

    function openAIModeContainer() {
        return toggleAIModeContainer(true);
    }

    function closeAIModeContainer() {
        return toggleAIModeContainer(false);
    }

    function toggleAIModeContainer(shouldOpen) {
        return new Promise((resolve) => {
            if (shouldOpen === isAIContainerOpen) {
                resolve(true);
                return;
            }

            executeScriptInActiveTab(() => {
                const button = document.querySelector('button.relative.flex.h-8.w-auto.items-center.justify-center.text-neutral-900 span.font-semibold');
                if (button) {
                    button.click();
                    return true;
                }
                console.log('Button not found');
                return false;
            }).then(result => {
                if (result) {
                    isAIContainerOpen = shouldOpen;
                    setTimeout(() => resolve(true), 500);
                } else {
                    resolve(false);
                }
            });
        });
    }

    function extractModesFromPage() {
        return executeScriptInActiveTab(() => {
            const container = document.querySelector('div[class*="flex max-h-[calc(100vh-310px)]"]');
            if (!container) return [];
    
            const buttons = container.querySelectorAll('button');
            return Array.from(buttons).map((btn, index) => ({
                index,
                title: (btn.querySelector('div[class*="font-semibold"]') || 
                        btn.querySelector('span[class*="font-semibold"]'))?.textContent.trim() || '',
                description: btn.querySelector('span[class*="text-neutral-700"]')?.textContent.trim() || '',
                isSelected: btn.classList.contains('bg-neutral-50') || 
                            btn.classList.contains('dark:bg-neutral-800/50')
            }));
        });
    }

    function updateModeSelector(modes) {
        modeSelector.innerHTML = '<option value="" disabled selected>Select a mode</option>';
        modes.forEach(mode => {
            const option = document.createElement('option');
            option.value = mode.index;
            option.textContent = mode.title;
            option.title = mode.description;
            option.selected = mode.isSelected;
            modeSelector.appendChild(option);
        });
    }

    function selectMode(index) {
        return executeScriptInActiveTab((idx) => {
            const container = document.querySelector('div[class*="flex max-h-[calc(100vh-310px)]"]');
            if (!container) return false;

            const buttons = container.querySelectorAll('button');
            if (buttons[idx]) {
                buttons[idx].click();
                console.log(`Clicked mode at index: ${idx}`);
                return true;
            }
            console.log(`Failed to click mode at index: ${idx}`);
            return false;
        }, index);
    }

    function executeScriptInActiveTab(scriptFunction, ...args) {
        return new Promise((resolve) => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    function: scriptFunction,
                    args: args
                }, function(results) {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        resolve(null);
                    } else if (results && results[0]) {
                        resolve(results[0].result);
                    } else {
                        resolve(null);
                    }
                });
            });
        });
    }
}
//-----------------------SIZE SELECTOR-----------------------//
document.addEventListener('DOMContentLoaded', initializeSizeSelector);

function initializeSizeSelector() {
    const sizeSelector = document.getElementById('size-selector');
    let isSizeContainerOpen = false;

    sizeSelector.addEventListener('mousedown', handleSizeSelectorClick);
    sizeSelector.addEventListener('change', handleSizeSelection);
    sizeSelector.addEventListener('change', closeSizeContainer);

    updateSizeSelector([]);

    function handleSizeSelectorClick(event) {
        if (event.button === 0) { // Left mouse button
            openSizeContainer()
                .then(() => extractSizesFromPage())
                .then(updateSizeSelector);
        }
    }

    function handleSizeSelection(event) {
        const selectedSize = event.target.value;
        if (selectedSize !== '') {
            clickElementWithText(selectedSize)
                .then(success => {
                    if (success) {
                        console.log('Size selection successful');
                        closeSizeContainer();
                    } else {
                        console.log('Size selection failed');
                    }
                })
                .catch(console.error);
        }
    }

    function openSizeContainer() {
        return toggleSizeContainer(true);
    }

    function closeSizeContainer() {
        return toggleSizeContainer(false);
    }

    function toggleSizeContainer(shouldOpen) {
        return new Promise((resolve) => {
            if (shouldOpen === isSizeContainerOpen) {
                resolve(true);
                return;
            }

            executeScriptInActiveTab(() => {
                const sizeButton = [...document.querySelectorAll('button')].find(button =>
                    button.querySelector('span.text-xs.font-semibold')?.textContent.trim().toLowerCase() === 'size'
                );
                if (sizeButton) {
                    sizeButton.click();
                    return true;
                }
                console.log('Size button not found');
                return false;
            }).then(result => {
                if (result) {
                    isSizeContainerOpen = shouldOpen;
                    setTimeout(() => resolve(true), 500);
                } else {
                    resolve(false);
                }
            });
        });
    }

    function extractSizesFromPage() {
        return executeScriptInActiveTab(() => {
            const sizeElements = document.querySelectorAll('.flex.cursor-pointer.items-center.gap-2.rounded.py-2.pl-1.pr-2\\.5.text-xs.text-neutral-900');
            return Array.from(sizeElements).map(el => el.textContent.trim());
        });
    }

    function updateSizeSelector(sizes) {
        sizeSelector.innerHTML = '<option value="" disabled selected>Select a size</option>';
        sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            sizeSelector.appendChild(option);
        });
    }

    function clickElementWithText(searchText) {
        return executeScriptInActiveTab((text) => {
            const spans = document.querySelectorAll('span');
            const targetElement = Array.from(spans).find(span => span.textContent.trim() === text);
            if (targetElement) {
                targetElement.click();
                console.log(`Clicked the element with text: "${text}".`);
                return true;
            } else {
                console.log(`Element with text "${text}" not found.`);
                return false;
            }
        }, searchText);
    }
}

function executeScriptInActiveTab(scriptFunction, ...args) {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: scriptFunction,
                args: args
            }, function(results) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    resolve(null);
                } else if (results && results[0]) {
                    resolve(results[0].result);
                } else {
                    resolve(null);
                }
            });
        });
    });
}


//-----------------------STYLE+COLOR+CAMERA+LIGHTING-----------------------//
// Selector configuration
const selectors = [
    { id: 'style-selector', buttonText: 'style' },
    { id: 'color-selector', buttonText: 'color' },
    { id: 'camera-selector', buttonText: 'camera' },
    { id: 'lighting-selector', buttonText: 'lighting' }
];

// Generic functions
function extractOptionsFromPage() {
    const elements = document.querySelectorAll('span.flex.h-7.cursor-pointer.items-center.text-center.text-2xs.capitalize.leading-none.sm\\:text-xs');
    return Array.from(elements).map(el => el.textContent.trim());
}

function updateSelector(selectorId, options) {
    const select = document.getElementById(selectorId);
    select.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = `Select a ${selectorId.split('-')[0]}`;
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

function handleSelection(event) {
    const selectedOption = event.target.value;
    if (selectedOption) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickElementWithText,
                args: [selectedOption]
            });
        });
    }
}

function clickElementWithText(searchText) {
    const spans = document.querySelectorAll('span');
    const targetElement = Array.from(spans).find(span => span.textContent.trim() === searchText);
    if (targetElement) {
        targetElement.click();
        console.log(`Clicked the element with text: "${searchText}".`);
    } else {
        console.log(`Element with text "${searchText}" not found.`);
    }
}

function toggleButton(buttonText, action) {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (buttonText, action) => {
                    const button = [...document.querySelectorAll('button')].find(button =>
                        button.querySelector('span.text-xs.font-semibold.capitalize')?.textContent.trim().toLowerCase() === buttonText
                    );
                    if (button) {
                        const isActive = button.classList.contains('active');
                        if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                            button.click();
                        }
                    }
                    return action === 'open';
                },
                args: [buttonText, action]
            }, (results) => {
                resolve(results && results[0] && results[0].result);
            });
        });
    });
}

// Initialize selectors
function initializeSelector(selectorConfig) {
    const { id, buttonText } = selectorConfig;
    const selector = document.getElementById(id);

    selector.addEventListener('change', handleSelection);
    selector.addEventListener('focus', async () => {
        const opened = await toggleButton(buttonText, 'open');
        if (opened) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractOptionsFromPage
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        updateSelector(id, results[0].result);
                    }
                });
            });
        }
    });
    selector.addEventListener('blur', () => {
        setTimeout(() => toggleButton(buttonText, 'close'), 200);
    });

    updateSelector(id, []);
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    selectors.forEach(initializeSelector);
});


//-----------------------STRUCUTURE-----------------------//

// Function to extract image sources and indexes from the page
function extractStructuresFromPage() {
    const images = document.querySelectorAll('.w-12.lg\\:w-full img');
    return Array.from(images).map((img, index) => ({
        index: index,
        src: img.src
    }));
}

// Function to update the structure selector with image options
function updateStructureSelector(structures) {
    const container = document.getElementById('structure-container');
    
    // Clear existing content
    container.innerHTML = '';

    // Add new image elements based on extracted images
    structures.forEach(structure => {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'structure-image-wrapper';

        const img = document.createElement('img');
        img.src = structure.src;
        img.alt = `Image ${structure.index + 1}`;
        img.dataset.index = structure.index;
        img.className = 'structure-image';

        img.addEventListener('click', () => handleStructureSelection(structure.index));

        imgWrapper.appendChild(img);
        container.appendChild(imgWrapper);
    });
}

// Function to handle structure selection
function handleStructureSelection(index) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: clickElementWithIndex,
            args: [parseInt(index)]
        });
    });
}

// Function to click the image element by index
function clickElementWithIndex(index) {
    const images = document.querySelectorAll('.w-12.lg\\:w-full img');
    if (images[index]) {
        images[index].click();
        console.log(`Clicked the image at index: ${index}.`);
    } else {
        console.log(`Image at index ${index} not found.`);
    }
}

// Function to toggle the structure button
function toggleStructureButton(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (action) => {
                const structureButton = [...document.querySelectorAll('button')].find(button =>
                    button.querySelector('span.text-xs.font-semibold.capitalize')?.textContent.trim().toLowerCase() === 'structure'
                );
                if (structureButton) {
                    const isActive = structureButton.classList.contains('active');
                    if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                        structureButton.click();
                    }
                }
                return action === 'open'; 
            },
            args: [action]
        }, (results) => {
            if (action === 'open' && results && results[0] && results[0].result) {
                // If the button was successfully opened, now extract the images
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractStructuresFromPage
                }, (structureResults) => {
                    if (structureResults && structureResults[0] && structureResults[0].result) {
                        updateStructureSelector(structureResults[0].result);
                    }
                });
            }
        });
    });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-structure-button');
    
    // Trigger structure toggle on button click
    toggleButton.addEventListener('click', () => toggleStructureButton('open'));

    // Initial setup
    updateStructureSelector([]);
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
