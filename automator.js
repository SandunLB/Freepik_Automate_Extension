// Function to click a button
function clickButton(buttonSelector) {
    const button = document.querySelector(buttonSelector);
    if (button) {
        button.click();
    } else {
        console.error(`Button ${buttonSelector} not found`);
    }
}

// Function to check if file input exists
function fileInputExists() {
    return !!document.querySelector('#fileInput');
}

// Function to wait for button animation to complete
function waitForButtonAnimation() {
    return new Promise((resolve) => {
        const createButton = document.getElementById('create-button');
        const buttonText = createButton.querySelector('.button-text');

        // Set up a MutationObserver to watch for changes in the button text
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' && buttonText.textContent === 'Create') {
                    observer.disconnect();
                    resolve();
                }
            });
        });

        // Start observing the button text
        observer.observe(buttonText, { characterData: true, subtree: true });

        // Fallback: resolve after 30 seconds in case the animation doesn't complete
        setTimeout(() => {
            observer.disconnect();
            resolve();
        }, 6000);
    });
}

// Main automation function
async function runAutomation() {
    if (!fileInputExists()) {
        console.log("Automation stopped: File input removed");
        document.getElementById('automatePromptToggle').checked = false;
        return;
    }

    // Click "Start Replacing Text" button
    clickButton('#startButton');

    // Wait for a short time to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click "Create" button
    clickButton('#create-button');

    // Wait for the button animation to complete
    await waitForButtonAnimation();

    // Extra 500ms wait after animation completes
    await new Promise(resolve => setTimeout(resolve, 500));

    // Schedule next iteration
    setTimeout(runAutomation, 100);
}

// Event listener for the toggle switch
document.getElementById('automatePromptToggle').addEventListener('change', function() {
    if (this.checked) {
        console.log("Automation started");
        runAutomation();
    } else {
        console.log("Automation stopped manually");
    }
});