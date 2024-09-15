// Configuration
const config = {
    startButtonSelector: '#startButton',
    createButtonSelector: '#create-button',
    fileInputSelector: '#fileInput',
    automateButtonId: 'automateButton',
    promptDisplayId: 'promptDisplay',
    textAreaSelector: 'textarea[placeholder="Describe your image"]',
    animationTimeout: 20000,
    iterationDelay: 100,
    uiUpdateDelay: 1000
};

const CHUNK_SIZE = 100; // Process 100 prompts at a time

// State
let state = {
    isRunning: false,
    currentPrompt: -1,  // Start at -1 so the first prompt is 0
    totalPrompts: 0,
    startTime: null,
    elapsedTime: 0,
    allPromptsProcessed: false,
    prompts: [], // Array to store all prompts
    currentPrompts: [], // Array to store the current chunk of prompts
    currentChunk: 0,
    currentPromptName: '' // New property to store the current prompt name
};

// DOM Elements
const elements = {
    automateButton: null,
    promptDisplay: null,
    fileInput: null,
    textArea: null,
    createButton: null
};

// Utility Functions
const utils = {
    clickButton: (selector) => {
        const button = document.querySelector(selector);
        if (button) {
            button.click();
        } else {
            throw new Error(`Button ${selector} not found`);
        }
    },
    fileInputExists: () => !!document.querySelector(config.fileInputSelector),
    createDisplayElement: () => {
        const displayElement = document.createElement('div');
        displayElement.id = config.promptDisplayId;
        Object.assign(displayElement.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '5px',
            zIndex: '9999',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px'
        });
        document.body.appendChild(displayElement);
        return displayElement;
    },
    formatTime: (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    },
    showMessage: (message) => {
        alert(message);
    },
    setTextArea: (text) => {
        if (elements.textArea) {
            elements.textArea.value = text;
            const event = new Event('input', { bubbles: true });
            elements.textArea.dispatchEvent(event);
        }
    },
    clearTextArea: () => {
        utils.setTextArea('');
    },
    showCompletionMessage: () => {
        alert("All prompts have been processed!");
    },
    disableButton: (button) => {
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    },
    enableButton: (button) => {
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    }
};

// Core Functions
const core = {
    waitForButtonAnimation: () => {
        return new Promise((resolve) => {
            const createButton = document.querySelector(config.createButtonSelector);
            const buttonText = createButton.querySelector('.button-text');

            const checkButtonState = () => {
                if (buttonText.textContent === 'Create') {
                    clearInterval(pollId);
                    clearTimeout(timeoutId);
                    observer.disconnect();
                    resolve();
                }
            };

            const observer = new MutationObserver(checkButtonState);
            observer.observe(buttonText, { characterData: true, subtree: true });

            const pollId = setInterval(checkButtonState, 100);

            const timeoutId = setTimeout(() => {
                clearInterval(pollId);
                observer.disconnect();
                resolve();
            }, config.animationTimeout);
        });
    },
    readFileAndLoadPrompts: () => {
        return new Promise((resolve, reject) => {
            if (!elements.fileInput || !elements.fileInput.files[0]) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                state.prompts = content.split('\n').filter(line => line.trim() !== '');
                state.totalPrompts = state.prompts.length;
                state.currentPrompt = -1;
                state.currentChunk = 0;
                state.allPromptsProcessed = false;
                core.loadNextChunk();
                ui.updateDisplay();
                ui.updateButtonState();

                // Send message to clear CSV data
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'clearCSVData'});
                });

                resolve(state.totalPrompts);
            };
            reader.onerror = reject;
            reader.readAsText(elements.fileInput.files[0]);
        });
    },
    loadNextChunk: () => {
        const startIndex = state.currentChunk * CHUNK_SIZE;
        const endIndex = Math.min(startIndex + CHUNK_SIZE, state.totalPrompts);
        state.currentPrompts = state.prompts.slice(startIndex, endIndex);
    },
    runAutomation: async () => {
        if (!state.isRunning) return;

        if (!utils.fileInputExists()) {
            console.log("Automation stopped: File input removed");
            automation.stop();
            return;
        }

        state.currentPrompt++;

        if (state.currentPrompt >= state.totalPrompts) {
            automation.complete();
            return;
        }

        // Load next chunk if necessary
        if (state.currentPrompt % CHUNK_SIZE === 0) {
            state.currentChunk = Math.floor(state.currentPrompt / CHUNK_SIZE);
            core.loadNextChunk();
        }

        // Set the current prompt in the text area
        const chunkIndex = state.currentPrompt % CHUNK_SIZE;
        state.currentPromptName = state.currentPrompts[chunkIndex];
        utils.setTextArea(state.currentPromptName);

        // Send the current prompt name to content.js
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateCurrentPrompt',
                promptName: state.currentPromptName
            });
        });

        ui.updateDisplay();

        try {
            utils.clickButton(config.startButtonSelector);
            await new Promise(resolve => setTimeout(resolve, config.uiUpdateDelay));
            utils.clickButton(config.createButtonSelector);
            await core.waitForButtonAnimation();
        } catch (error) {
            console.error("Error during automation:", error);
            automation.stop();
            return;
        }

        setTimeout(core.runAutomation, config.iterationDelay);
    }
};

// UI Functions
const ui = {
    updateDisplay: () => {
        if (elements.promptDisplay) {
            const currentTime = state.isRunning ? Date.now() - state.startTime : 0;
            const totalElapsedTime = state.elapsedTime + currentTime;
            const displayedPrompt = state.currentPrompt + 1;
            elements.promptDisplay.innerHTML = `
                Current Prompt: ${displayedPrompt} | Total Prompts: ${state.totalPrompts}<br>
                Elapsed Time: ${utils.formatTime(totalElapsedTime)}
            `;
        }
    },
    updateButtonState: () => {
        if (elements.automateButton) {
            elements.automateButton.textContent = state.isRunning ? 'Stop' : 'Start';
            elements.automateButton.classList.toggle('stop', state.isRunning);
            elements.automateButton.classList.toggle('start', !state.isRunning);

            if (state.allPromptsProcessed) {
                utils.disableButton(elements.automateButton);
            } else {
                utils.enableButton(elements.automateButton);
            }
        }
        if (elements.createButton) {
            elements.createButton.style.display = state.isRunning ? 'inline-block' : 'none';
        }
    }
};

// Automation Control
const automation = {
    start: async () => {
        if (!state.isRunning && !state.allPromptsProcessed) {
            if (!elements.fileInput || !elements.fileInput.files[0]) {
                utils.showMessage("Please select a text file before starting the automation.");
                return;
            }

            if (state.prompts.length === 0) {
                try {
                    await core.readFileAndLoadPrompts();
                } catch (error) {
                    console.error("Failed to load prompts:", error);
                    return;
                }
            }

            state.isRunning = true;
            state.startTime = Date.now();
            console.log("Automation started");
            ui.updateButtonState();
            core.runAutomation();
        }
    },
    stop: () => {
        if (state.isRunning) {
            state.isRunning = false;
            state.elapsedTime += Date.now() - state.startTime;
            console.log("Automation stopped");
            ui.updateButtonState();
        }
    },
    complete: () => {
        state.isRunning = false;
        state.allPromptsProcessed = true;
        state.elapsedTime += Date.now() - state.startTime;
        console.log("Automation completed: All prompts processed");
        ui.updateButtonState();
        ui.updateDisplay();
        utils.clearTextArea();
        utils.showCompletionMessage();
        setTimeout(() => {
            state.elapsedTime = 0;
            state.currentPrompt = -1;
            state.currentChunk = 0;
            state.currentPrompts = [];
            ui.updateDisplay();
        }, 1000);
    },
    toggle: () => {
        if (state.isRunning) {
            automation.stop();
        } else {
            automation.start();
        }
    }
};

// Initialization
function init() {
    elements.automateButton = document.getElementById(config.automateButtonId);
    elements.promptDisplay = document.getElementById(config.promptDisplayId) || utils.createDisplayElement();
    elements.fileInput = document.querySelector(config.fileInputSelector);
    elements.textArea = document.querySelector(config.textAreaSelector);
    elements.createButton = document.querySelector(config.createButtonSelector);

    if (elements.automateButton) {
        elements.automateButton.addEventListener('click', automation.toggle);
    }

    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', () => {
            state.prompts = [];
            state.currentPrompts = [];
            state.allPromptsProcessed = false;
            state.currentPrompt = -1;
            state.currentChunk = 0;
            ui.updateButtonState();
            ui.updateDisplay();
        });
    }

    ui.updateButtonState();
    ui.updateDisplay();

    setInterval(ui.updateDisplay, 1000);
}

// Run initialization when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}