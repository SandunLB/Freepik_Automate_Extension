//-------------------------------------------MAIN PROMPT ACTIONS--------------------------------------------------//

//---------------------------TEXT AREA--------------------------------//
document.querySelector('.prompt-textarea').addEventListener('input', (event) => {
    console.log('Text entered in the prompt textarea:', event.target.value);

    // Send a message to the content script to handle the textarea input functionality
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: handleTextareaInput,
            args: [event.target.value]  // Pass the current value as an argument
        });
    });
});
// Function to handle the textarea input
function handleTextareaInput(currentValue) {
    // Step 1: Select the textarea
    const textarea = document.querySelector('textarea');

    // Step 2: Check if the textarea is found
    if (textarea) {
        console.log('Textarea found:', textarea);

        // Step 3: Log the current value
        console.log('Current value:', textarea.value);

        // Step 4: Change the value to the provided one
        textarea.value = currentValue + "";

        // Step 5: Trigger an event to simulate typing
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        console.log('Textarea content updated and input event dispatched');
    } else {
        console.error('Textarea not found');
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





//-------------------------------------------AI MODE SELECTOR--------------------------------------------------//


document.getElementById('buttonSelector').addEventListener('change', (event) => {
    const selectedButtonIndex = event.target.value;
    
    // Send a message to the content script to click the main button first, then the sub-button
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: handleButtonClick,
            args: [parseInt(selectedButtonIndex)]
        });
    });
});

// Function to handle clicking the main button and then the selected sub-button
function handleButtonClick(index) {
    // Step 1: Click the main button to reveal the options
    const mainButton = [...document.querySelectorAll('button')].find(button =>
        button.querySelector('span.text-xs.font-semibold')?.textContent === 'Mode'
    );

    if (mainButton) {
        mainButton.click();
        console.log('Main button clicked');
  
        // Wait for the options to appear before trying to click a sub-button
        setTimeout(() => {
            // Step 2: Click the selected sub-button
            const buttons = document.querySelectorAll('div.scrollbar-thin-y > button');
            if (buttons[index]) {
                buttons[index].click();
                console.log(`Clicked the button at index ${index}`);
            } else {
                console.error(`Button at index ${index} not found`);
            }
        }, 1); 
    } else {
        console.error('Main button not found!');
    }
}


//-------------------------------------------SIZE SELECTOR--------------------------------------------------//

  
  document.getElementById('sizeSelector').addEventListener('change', () => {
    const selectedSizeIndex = document.getElementById('sizeSelector').value;
  
    // Send a message to the content script to click the main size button first, then the sub-button
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: handleSizeClick,
        args: [parseInt(selectedSizeIndex)]
      });
    });
  });
  
  // Function to handle clicking the main size button and then the selected size option
  function handleSizeClick(index) {
    // Step 1: Click the main size button to reveal the options
    const mainSizeButton = [...document.querySelectorAll('button')].find(button =>
      button.querySelector('span.text-xs.font-semibold')?.textContent === 'Size'
    );
  
    if (mainSizeButton) {
      mainSizeButton.click();
      console.log('Main size button clicked');
  
      // Wait for the options to appear before trying to click a size option
      setTimeout(() => {
        // Step 2: Click the selected size option
        const sizeOptions = document.querySelectorAll('div.scrollbar-thin-y > span');
        if (sizeOptions[index]) {
          sizeOptions[index].click();
          console.log(`Clicked the size option at index ${index}`);
        } else {
          console.error(`Size option at index ${index} not found`);
        }
      }, 1); // Adjust timeout as needed to ensure options are visible
    } else {
      console.error('Main size button not found!');
    }
  }




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
      });
  
      // Set a 500ms timer before clicking the download button
      setTimeout(() => {
        console.log('Triggering download button after 500ms');
        downloadButton.click();
      }, 1000);
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
  