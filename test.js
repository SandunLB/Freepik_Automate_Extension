// Function to extract models from the page
function extractModelsFromPage() {
    const modelElements = document.querySelectorAll('button.flex.cursor-pointer.gap-2.rounded.px-2\\.5.py-2.text-xs.text-neutral-900');
    return Array.from(modelElements).map(el => {
        const nameEl = el.querySelector('.font-semibold');
        const descriptionEl = el.querySelector('.text-neutral-700');
        return {
            name: nameEl ? nameEl.textContent.trim() : '',
            description: descriptionEl ? descriptionEl.textContent.trim() : ''
        };
    }).filter(model => model.name);
}

// Function to update the model selector with real options
function updateModelSelector(models) {
    const select = document.getElementById('mode-selector');
    
    // Remove all options except the placeholder
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Add new options based on extracted models
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = model.name;
        option.title = model.description;
        select.appendChild(option);
    });
}

// Function to handle model selection
function handleModelSelection(event) {
    const selectedModel = event.target.value;
    
    if (selectedModel) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: clickElementWithText,
                args: [selectedModel]
            });
        });
    }
}

// Function to click the element with the selected text
function clickElementWithText(searchText) {
    const buttons = document.querySelectorAll('button.flex.cursor-pointer.gap-2.rounded.px-2\\.5.py-2.text-xs.text-neutral-900');
    const targetElement = Array.from(buttons).find(button => 
        button.textContent.includes(searchText)
    );
    if (targetElement) {
        targetElement.click();
        console.log(`Clicked the element with text: "${searchText}".`);
    } else {
        console.log(`Element with text "${searchText}" not found.`);
    }
}

// Function to toggle the model button
function toggleModelButton(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (action) => {
                const modelButton = document.querySelector('button.relative.flex.h-8.w-auto.shrink-0.items-center.justify-center.gap-2.rounded-sm.bg-neutral-50.px-3.text-neutral-900');
                if (modelButton) {
                    const isActive = modelButton.classList.contains('active');
                    if ((action === 'open' && !isActive) || (action === 'close' && isActive)) {
                        modelButton.click();
                    }
                }
                return action === 'open'; 
            },
            args: [action]
        }, (results) => {
            if (action === 'open' && results && results[0] && results[0].result) {
                // If the button was successfully opened, now extract the models
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractModelsFromPage
                }, (modelResults) => {
                    if (modelResults && modelResults[0] && modelResults[0].result) {
                        updateModelSelector(modelResults[0].result);
                    }
                });
            }
        });
    });
}

// Initialize the sidebar
document.addEventListener('DOMContentLoaded', () => {
    const modelSelector = document.getElementById('mode-selector');
    
    // Add event listeners
    modelSelector.addEventListener('change', handleModelSelection);
    modelSelector.addEventListener('focus', () => toggleModelButton('open'));
    modelSelector.addEventListener('blur', () => {
        setTimeout(() => toggleModelButton('close'), 200);
    });

    // Initial setup
    updateModelSelector([]);
});