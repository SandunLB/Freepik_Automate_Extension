//-------------------------------------------MAIN PROMPT ACTIONS--------------------------------------------------//

//---------------------------TEXT FILE INPUT + TEXT AREA--------------------------------//
let lines = [];
let currentLine = -1;

const fileInput = document.getElementById('fileInput');
const startButton = document.getElementById('startButton');
const extensionTextarea = document.querySelector('.prompt-textarea');

fileInput.addEventListener('click', () => {
    // Reset the file input value when clicked
    fileInput.value = '';
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (file) {
        // Reset everything
        lines = [];
        currentLine = -1;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            lines = e.target.result.split('\n').filter(line => line.trim() !== '');
            console.log(`File loaded with ${lines.length} lines.`);
        };
        reader.readAsText(file);
    }
}

extensionTextarea.addEventListener('input', (event) => {
    console.log('Text entered in the prompt textarea:', event.target.value);
    updateMainPageTextarea(event.target.value);
});

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

startButton.addEventListener('click', replaceText);

function replaceText() {
    if (lines.length > 0) {
        currentLine++;
        if (currentLine < lines.length) {
            const newText = lines[currentLine].trim();
            
            if (extensionTextarea) {
                extensionTextarea.value = newText;
                extensionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Update the main webpage's textarea
                updateMainPageTextarea(newText);
                
                console.log(`Displayed line ${currentLine + 1} of ${lines.length}`);
            }
        } else {
            console.log('End of file reached. Select a file again to start over.');
            // Reset to allow starting over
            currentLine = -1;
            lines = [];
            fileInput.value = ''; // Clear the file input
            extensionTextarea.value = ''; // Clear the textarea
            updateMainPageTextarea(''); // Clear the main webpage's textarea
        }
    } else {
        console.log('No file loaded or all lines displayed. Please select a file.');
    }
}



//---------------------------AI PROPMT TOGGLE--------------------------------//
document.addEventListener('DOMContentLoaded', () => {
    const aiPromptToggle = document.getElementById('aiPromptToggle');
    
    aiPromptToggle.addEventListener('change', (event) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleAiPrompt' });
        });
    });

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'enableAiPromptToggle') {
            aiPromptToggle.disabled = false;
            aiPromptToggle.checked = true;
        } else if (request.action === 'disableAiPromptToggle') {
            aiPromptToggle.disabled = false;
            aiPromptToggle.checked = false;
        }
    });
});



//---------------------------EXCLUDE BUTTON TOGGLE + NEGATIVE PROMPT--------------------------------//

document.addEventListener('DOMContentLoaded', () => {
    const excludeButton = document.querySelector('.exclude-button');
    const negativeSection = document.querySelector('.negative-form-section');
    const negativeTextarea = document.querySelector('.negative-prompt-textarea');

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'showExcludeButton') {
            excludeButton.style.display = 'inline-block';
            console.log('Exclude button displayed in sidebar');
        } else if (request.action === 'hideExcludeButton') {
            excludeButton.style.display = 'none';
            console.log('Exclude button hidden in sidebar');
        } else if (request.action === 'showNegativePrompt') {
            negativeSection.style.display = 'block';
            console.log('Negative prompt section shown in sidebar');
        } else if (request.action === 'hideNegativePrompt') {
            negativeSection.style.display = 'none';
            console.log('Negative prompt section hidden in sidebar');
        }
    });

    excludeButton.addEventListener('click', () => {
        console.log('Exclude button clicked in sidebar');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'clickExcludeButton' });
        });
    });

    negativeTextarea.addEventListener('input', (event) => {
        console.log('Text entered in the negative prompt textarea:', event.target.value);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'updateNegativePrompt', 
                value: event.target.value 
            });
        });
    });
});



//---------------------------IMAGE REF BUTTON TOGGLE--------------------------------//
document.querySelector('.image-ref-button').addEventListener('click', (event) => {
    console.log('Image reference button clicked');

    // Send a message to the content script to handle the image reference button functionality
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: handleAddImageReferenceClick,
        });
    });
});
// Function to handle clicking the "Add image reference" button
function handleAddImageReferenceClick() {
    // Step 1: Select the "Add image reference" button using its tooltip
    const addImageButton = document.querySelector('button[tooltip="Add image reference"]');

    // Step 2: Check if the button is found
    if (addImageButton) {
        console.log('Add Image Reference Button found:', addImageButton);

        // Step 3: Log the current state (disabled or not)
        console.log('Add Image Reference Button Disabled:', addImageButton.disabled);

        // Step 4: Simulate a click on the "Add image reference" button
        addImageButton.click();
        console.log('Add Image Reference Button clicked');
    } else {
        console.error('Add Image Reference Button not found');
    }
}





//------------------------------------------AI MODE SELECTOR------------------------------------------------//

// popup.js
document.addEventListener('DOMContentLoaded', initializePopup);

function initializePopup() {
    const modeSelector = document.getElementById('mode-selector');
    let isAIContainerOpen = false;

    modeSelector.addEventListener('mousedown', handleModeSelectorClick);
    modeSelector.addEventListener('change', handleModeSelection);
    modeSelector.addEventListener('change', closeAIModeContainer);

    function handleModeSelectorClick(event) {
        if (event.button === 0) { // Left mouse button
            openAIModeContainer()
                .then(() => extractModesFromPage())
                .then(updateModeSelector);
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
                .catch(console.error);
        }
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
            const container = document.querySelector('div[class*="flex max-h-[calc(100vh-250px)]"]');
            if (!container) return [];

            const buttons = container.querySelectorAll('button');
            return Array.from(buttons).map((btn, index) => ({
                index,
                title: (btn.querySelector('div[class*="font-semibold"]') || btn.querySelector('span[class*="font-semibold"]'))?.textContent.trim() || '',
                description: btn.querySelector('span[class*="text-neutral-700"]')?.textContent.trim() || '',
                isSelected: btn.classList.contains('bg-neutral-50') || btn.classList.contains('dark:bg-neutral-800/50')
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
            const container = document.querySelector('div[class*="flex max-h-[calc(100vh-250px)]"]');
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

//-------------------------------------------SIZE SELECTOR--------------------------------------------------//

  
// Function to extract sizes from the page
function extractsizesFromPage() {
    const sizeElements = document.querySelectorAll('.flex.cursor-pointer.items-center.gap-2.rounded.py-2.pl-1.pr-2\\.5.text-xs.text-neutral-900');
    return Array.from(sizeElements).map(el => el.textContent.trim());
}

// Function to update the size selector with real options
function updatesizeSelector(sizes) {
    const select = document.getElementById('size-selector');
    
    // Remove all options
    select.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select a size';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    // Add new options based on extracted sizes
    sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        select.appendChild(option);
    });
}

// Function to handle size selection
function handlesizeSelection(event) {
    const selectedsize = event.target.value;
    
    if (selectedsize) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickElementWithText,
                args: [selectedsize]
            });
        });
    }
}

// Function to click the element with the selected text
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

// Function to toggle the size button
function togglesizeButton(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (action) => {
                const sizeButton = [...document.querySelectorAll('button')].find(button =>
                    button.querySelector('span.text-xs.font-semibold')?.textContent.trim().toLowerCase() === 'size'
                );
                if (sizeButton) {
                    const isActive = sizeButton.classList.contains('active');
                    if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                        sizeButton.click();
                    }
                }
                return action === 'open'; 
            },
            args: [action]
        }, (results) => {
            if (action === 'open' && results && results[0] && results[0].result) {
                // If the button was successfully opened, now extract the sizes
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractsizesFromPage
                }, (sizeResults) => {
                    if (sizeResults && sizeResults[0] && sizeResults[0].result) {
                        updatesizeSelector(sizeResults[0].result);
                    }
                });
            }
        });
    });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const sizeSelector = document.getElementById('size-selector');
    
    // Add event listeners
    sizeSelector.addEventListener('change', handlesizeSelection);
    sizeSelector.addEventListener('focus', () => togglesizeButton('open'));
    sizeSelector.addEventListener('blur', () => {
        setTimeout(() => togglesizeButton('close'), 200);
    });

    // Initial setup
    updatesizeSelector([]);
});




//-------------------------------------------STYLE SELECTOR--------------------------------------------------//

// Function to extract styles from the page
function extractStylesFromPage() {
    const styleElements = document.querySelectorAll('span.flex.h-7.cursor-pointer.items-center.text-center.text-2xs.capitalize.leading-none.sm\\:text-xs');
    return Array.from(styleElements).map(el => el.textContent.trim());
}

// Function to update the style selector with real options
function updateStyleSelector(styles) {
    const select = document.getElementById('style-selector');
    
    // Remove all options
    select.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select a style';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    // Add new options based on extracted styles
    styles.forEach(style => {
        const option = document.createElement('option');
        option.value = style;
        option.textContent = style;
        select.appendChild(option);
    });
}

// Function to handle style selection
function handleStyleSelection(event) {
    const selectedStyle = event.target.value;
    
    if (selectedStyle) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickElementWithText,
                args: [selectedStyle]
            });
        });
    }
}

// Function to click the element with the selected text
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

// Function to toggle the style button
function toggleStyleButton(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (action) => {
                const styleButton = [...document.querySelectorAll('button')].find(button =>
                    button.querySelector('span.text-xs.font-semibold.capitalize')?.textContent.trim().toLowerCase() === 'style'
                );
                if (styleButton) {
                    const isActive = styleButton.classList.contains('active');
                    if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                        styleButton.click();
                    }
                }
                return action === 'open'; 
            },
            args: [action]
        }, (results) => {
            if (action === 'open' && results && results[0] && results[0].result) {
                // If the button was successfully opened, now extract the styles
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractStylesFromPage
                }, (styleResults) => {
                    if (styleResults && styleResults[0] && styleResults[0].result) {
                        updateStyleSelector(styleResults[0].result);
                    }
                });
            }
        });
    });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const styleSelector = document.getElementById('style-selector');
    
    // Add event listeners
    styleSelector.addEventListener('change', handleStyleSelection);
    styleSelector.addEventListener('focus', () => toggleStyleButton('open'));
    styleSelector.addEventListener('blur', () => {
        setTimeout(() => toggleStyleButton('close'), 200);
    });

    // Initial setup
    updateStyleSelector([]);
});


//-------------------------------------------COLOR SELECTOR--------------------------------------------------//


// Function to extract colors from the page
function extractcolorsFromPage() {
    const colorElements = document.querySelectorAll('span.flex.h-7.cursor-pointer.items-center.text-center.text-2xs.capitalize.leading-none.sm\\:text-xs');
    return Array.from(colorElements).map(el => el.textContent.trim());
}

// Function to update the color selector with real options
function updatecolorSelector(colors) {
    const select = document.getElementById('color-selector');
    
    // Remove all options
    select.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select a color';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    // Add new options based on extracted colors
    colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = color;
        select.appendChild(option);
    });
}

// Function to handle color selection
function handlecolorSelection(event) {
    const selectedcolor = event.target.value;
    
    if (selectedcolor) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickElementWithText,
                args: [selectedcolor]
            });
        });
    }
}

// Function to click the element with the selected text
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

// Function to toggle the color button
function togglecolorButton(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (action) => {
                const colorButton = [...document.querySelectorAll('button')].find(button =>
                    button.querySelector('span.text-xs.font-semibold.capitalize')?.textContent.trim().toLowerCase() === 'color'
                );
                if (colorButton) {
                    const isActive = colorButton.classList.contains('active');
                    if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                        colorButton.click();
                    }
                }
                return action === 'open'; 
            },
            args: [action]
        }, (results) => {
            if (action === 'open' && results && results[0] && results[0].result) {
                // If the button was successfully opened, now extract the colors
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractcolorsFromPage
                }, (colorResults) => {
                    if (colorResults && colorResults[0] && colorResults[0].result) {
                        updatecolorSelector(colorResults[0].result);
                    }
                });
            }
        });
    });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const colorSelector = document.getElementById('color-selector');
    
    // Add event listeners
    colorSelector.addEventListener('change', handlecolorSelection);
    colorSelector.addEventListener('focus', () => togglecolorButton('open'));
    colorSelector.addEventListener('blur', () => {
        setTimeout(() => togglecolorButton('close'), 200);
    });

    // Initial setup
    updatecolorSelector([]);
});


//-------------------------------------------CAMERA SELECTOR--------------------------------------------------//


// Function to extract cameras from the page
function extractcamerasFromPage() {
    const cameraElements = document.querySelectorAll('span.flex.h-7.cursor-pointer.items-center.text-center.text-2xs.capitalize.leading-none.sm\\:text-xs');
    return Array.from(cameraElements).map(el => el.textContent.trim());
}

// Function to update the camera selector with real options
function updatecameraSelector(cameras) {
    const select = document.getElementById('camera-selector');
    
    // Remove all options
    select.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select a camera';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    // Add new options based on extracted cameras
    cameras.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera;
        option.textContent = camera;
        select.appendChild(option);
    });
}

// Function to handle camera selection
function handlecameraSelection(event) {
    const selectedcamera = event.target.value;
    
    if (selectedcamera) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickElementWithText,
                args: [selectedcamera]
            });
        });
    }
}

// Function to click the element with the selected text
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

// Function to toggle the camera button
function togglecameraButton(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (action) => {
                const cameraButton = [...document.querySelectorAll('button')].find(button =>
                    button.querySelector('span.text-xs.font-semibold.capitalize')?.textContent.trim().toLowerCase() === 'camera'
                );
                if (cameraButton) {
                    const isActive = cameraButton.classList.contains('active');
                    if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                        cameraButton.click();
                    }
                }
                return action === 'open'; 
            },
            args: [action]
        }, (results) => {
            if (action === 'open' && results && results[0] && results[0].result) {
                // If the button was successfully opened, now extract the cameras
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractcamerasFromPage
                }, (cameraResults) => {
                    if (cameraResults && cameraResults[0] && cameraResults[0].result) {
                        updatecameraSelector(cameraResults[0].result);
                    }
                });
            }
        });
    });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const cameraSelector = document.getElementById('camera-selector');
    
    // Add event listeners
    cameraSelector.addEventListener('change', handlecameraSelection);
    cameraSelector.addEventListener('focus', () => togglecameraButton('open'));
    cameraSelector.addEventListener('blur', () => {
        setTimeout(() => togglecameraButton('close'), 200);
    });

    // Initial setup
    updatecameraSelector([]);
});


//-------------------------------------------LIGHTING SELECTOR--------------------------------------------------//

// Function to extract lightings from the page
function extractlightingsFromPage() {
    const lightingElements = document.querySelectorAll('span.flex.h-7.cursor-pointer.items-center.text-center.text-2xs.capitalize.leading-none.sm\\:text-xs');
    return Array.from(lightingElements).map(el => el.textContent.trim());
}

// Function to update the lighting selector with real options
function updatelightingSelector(lightings) {
    const select = document.getElementById('lighting-selector');
    
    // Remove all options
    select.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select a lighting';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    // Add new options based on extracted lightings
    lightings.forEach(lighting => {
        const option = document.createElement('option');
        option.value = lighting;
        option.textContent = lighting;
        select.appendChild(option);
    });
}

// Function to handle lighting selection
function handlelightingSelection(event) {
    const selectedlighting = event.target.value;
    
    if (selectedlighting) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickElementWithText,
                args: [selectedlighting]
            });
        });
    }
}

// Function to click the element with the selected text
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

// Function to toggle the lighting button
function togglelightingButton(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (action) => {
                const lightingButton = [...document.querySelectorAll('button')].find(button =>
                    button.querySelector('span.text-xs.font-semibold.capitalize')?.textContent.trim().toLowerCase() === 'lighting'
                );
                if (lightingButton) {
                    const isActive = lightingButton.classList.contains('active');
                    if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                        lightingButton.click();
                    }
                }
                return action === 'open'; 
            },
            args: [action]
        }, (results) => {
            if (action === 'open' && results && results[0] && results[0].result) {
                // If the button was successfully opened, now extract the lightings
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractlightingsFromPage
                }, (lightingResults) => {
                    if (lightingResults && lightingResults[0] && lightingResults[0].result) {
                        updatelightingSelector(lightingResults[0].result);
                    }
                });
            }
        });
    });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const lightingSelector = document.getElementById('lighting-selector');
    
    // Add event listeners
    lightingSelector.addEventListener('change', handlelightingSelection);
    lightingSelector.addEventListener('focus', () => togglelightingButton('open'));
    lightingSelector.addEventListener('blur', () => {
        setTimeout(() => togglelightingButton('close'), 200);
    });

    // Initial setup
    updatelightingSelector([]);
});


//-------------------------------------------STRUCTURE SELECTOR--------------------------------------------------//

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


// CREATE BUTTON + DOWNLOAD BUTTON INDIVIDUAL FUNCTIONALITY

/*//-------------------------------------------CREATE BUTTON--------------------------------------------------//

document.addEventListener('DOMContentLoaded', () => {
    const createButton = document.getElementById('create-button');
    
    createButton.addEventListener('click', () => {
        console.log('Create button clicked');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickCreateButton
            });
        });
    });
});

function clickCreateButton() {
    const createButton = document.querySelector('button[data-cy="create"]');
    if (createButton) {
        createButton.click();
        console.log('Create Button clicked on the webpage');
    } else {
        console.error('Create Button not found on the webpage');
    }
}



//-------------------------------------------DOWNLOAD BUTTON--------------------------------------------------//

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
  }); */


//-------------------------------------------CREATE+DOWNLOAD BUTTON--------------------------------------------------//

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






  // Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const createButton = document.getElementById('create-button2');
    
    createButton.addEventListener('click', () => {
        console.log('Create button clicked');
  
        // Query the active tab in the current window
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickTargetButton
            });
        });
    });
  });
  
  // Function that will be executed on the target webpage
  function clickTargetButton() {
    // Use the specific selector you provided
    const targetButton = document.querySelector('button.my-4.rounded.bg-blue-500.px-6.py-2.text-center.text-sm.font-medium.text-white.hover\\:bg-blue-600');
    
    if (targetButton) {
        targetButton.click();
        console.log('Target button clicked on the webpage');
    } else {
        console.error('Target button not found on the webpage');
    }
  }
  