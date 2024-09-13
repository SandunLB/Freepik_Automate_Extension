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

// State
let state = {
    isRunning: false,
    currentPrompt: 0,
    totalPrompts: 0,
    startTime: null,
    elapsedTime: 0
};

// DOM Elements
const elements = {
    automateButton: null,
    promptDisplay: null,
    fileInput: null,
    textArea: null
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
    clearTextArea: () => {
        if (elements.textArea) {
            elements.textArea.value = '';
            const event = new Event('input', { bubbles: true });
            elements.textArea.dispatchEvent(event);
        }
    },
    showCompletionMessage: () => {
        alert("All prompts have been processed!");
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

            const pollId = setInterval(checkButtonState, config.pollInterval);

            const timeoutId = setTimeout(() => {
                clearInterval(pollId);
                observer.disconnect();
                resolve();
            }, config.animationTimeout);
        });
    },
    readFileAndCountPrompts: () => {
        return new Promise((resolve, reject) => {
            if (!elements.fileInput || !elements.fileInput.files[0]) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const lines = content.split('\n').filter(line => line.trim() !== '');
                state.totalPrompts = lines.length;
                ui.updateDisplay();
                resolve(state.totalPrompts);
            };
            reader.onerror = reject;
            reader.readAsText(elements.fileInput.files[0]);
        });
    },
    runAutomation: async () => {
        if (!state.isRunning) return;

        if (!utils.fileInputExists()) {
            console.log("Automation stopped: File input removed");
            automation.stop();
            return;
        }

        if (state.currentPrompt >= state.totalPrompts) {
            automation.complete();
            return;
        }

        state.currentPrompt++;
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
            elements.promptDisplay.innerHTML = `
                Current Prompt: ${state.currentPrompt} | Total Prompts: ${state.totalPrompts}<br>
                Elapsed Time: ${utils.formatTime(totalElapsedTime)}
            `;
        }
    },
    updateButtonState: () => {
        if (elements.automateButton) {
            elements.automateButton.textContent = state.isRunning ? 'Stop' : 'Start';
            elements.automateButton.classList.toggle('stop', state.isRunning);
            elements.automateButton.classList.toggle('start', !state.isRunning);
        }
    }
};

// Automation Control
const automation = {
    start: async () => {
        if (!state.isRunning) {
            if (!elements.fileInput || !elements.fileInput.files[0]) {
                utils.showMessage("Please select a text file before starting the automation.");
                return;
            }

            state.isRunning = true;
            state.currentPrompt = 0;
            state.startTime = Date.now();
            state.elapsedTime = 0;
            try {
                await core.readFileAndCountPrompts();
                console.log("Automation started");
                ui.updateButtonState();
                core.runAutomation();
            } catch (error) {
                console.error("Failed to start automation:", error);
                automation.stop();
            }
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
        state.elapsedTime += Date.now() - state.startTime;
        console.log("Automation completed: All prompts processed");
        ui.updateButtonState();
        ui.updateDisplay();
        utils.clearTextArea();
        utils.showCompletionMessage();
        // Reset elapsed time after completion
        setTimeout(() => {
            state.elapsedTime = 0;
            state.currentPrompt = 0;
            ui.updateDisplay();
        }, 1000); // Wait 1 second before resetting to ensure the final time is displayed
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

    if (elements.automateButton) {
        elements.automateButton.addEventListener('click', automation.toggle);
    }

    ui.updateButtonState();
    ui.updateDisplay();

    // Start updating the display every second
    setInterval(ui.updateDisplay, 1000);
}

// Run initialization when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}