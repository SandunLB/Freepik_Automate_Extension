// File Input Field

document.getElementById('fileInput').addEventListener('change', function() {
    const fileLabel = document.querySelector('.file-label');
    const fileNameElement = document.getElementById('fileName');
    
    if (this.files.length > 0) {
        const fileName = this.files[0].name;
        fileLabel.textContent = 'Change TXT Files';
        fileNameElement.textContent = fileName;
    } else {
        resetFileInput();
    }
});


document.querySelector('.file-label').addEventListener('click', function() {
    setTimeout(() => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput.files.length === 0) {
            resetFileInput();
        }
    }, 100); 
});

function resetFileInput() {
    const fileLabel = document.querySelector('.file-label');
    const fileNameElement = document.getElementById('fileName');
    const fileInput = document.getElementById('fileInput');
    
    fileLabel.textContent = 'Select TXT Files';
    fileNameElement.textContent = '';
    fileInput.value = ''; 
}



document.addEventListener('DOMContentLoaded', () => {
    const createButton = document.getElementById('create-button');
    const particlesContainer = createButton.querySelector('.particles');
    const buttonText = createButton.querySelector('.button-text');
    const progressBar = createButton.querySelector('.progress-bar');
    const totalImagesSpan = document.getElementById('total-images');
    const currentCountSpan = document.getElementById('current-count');

    function createParticles() {
        // Clear existing particles
        particlesContainer.innerHTML = '';

        // Create new particles
        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Randomize particle position and animation
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.animationDelay = `${Math.random() * 300}ms`;

            particlesContainer.appendChild(particle);
        }
    }

    function updateProgress() {
        const totalImages = parseInt(totalImagesSpan.innerText);
        const currentCount = parseInt(currentCountSpan.innerText);
        
        if (totalImages === 0) return; // Avoid division by zero
        
        const progress = (currentCount / totalImages) * 100;
        const roundedProgress = Math.round(progress);
        
        progressBar.style.width = `${roundedProgress}%`;
        buttonText.textContent = `${roundedProgress}%`;

        if (currentCount > 0) {
            createButton.classList.add('progress');
        }

        if (currentCount === totalImages) {
            setTimeout(() => {
                createButton.classList.remove('progress');
                buttonText.textContent = 'Create';
                progressBar.style.width = '0%';
                createParticles(); // Celebration effect
            }, 500);
        }
    }

    createButton.addEventListener('mouseenter', createParticles);

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateCurrentCount') {
            updateProgress();
        }
    });

    // Modify the existing click event listener
    createButton.addEventListener('click', () => {
        createButton.classList.add('progress');
        buttonText.textContent = '0%';
        progressBar.style.width = '0%';
    });
});