// Constants
const DOM_ELEMENTS = {
    fileInput: () => document.getElementById('fileInput'),
    fileLabel: () => document.querySelector('.file-label'),
    fileName: () => document.getElementById('fileName'),
    createButton: () => document.getElementById('create-button'),
    particlesContainer: () => DOM_ELEMENTS.createButton().querySelector('.particles'),
    buttonText: () => DOM_ELEMENTS.createButton().querySelector('.button-text'),
    progressBar: () => DOM_ELEMENTS.createButton().querySelector('.progress-bar'),
    totalImagesSpan: () => document.getElementById('total-images'),
    currentCountSpan: () => document.getElementById('current-count'),
    collapsible: () => document.querySelector('.collapsible'),
    content: () => document.querySelector('.content')
  };
  
  // File Input Handling
  const FileInputHandler = {
    init() {
      DOM_ELEMENTS.fileInput().addEventListener('change', this.handleFileChange.bind(this));
      DOM_ELEMENTS.fileLabel().addEventListener('click', this.handleFileLabelClick.bind(this));
    },
  
    handleFileChange(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.updateFileInfo(files[0].name);
      } else {
        this.resetFileInput();
      }
    },
  
    handleFileLabelClick() {
      setTimeout(() => {
        if (DOM_ELEMENTS.fileInput().files.length === 0) {
          this.resetFileInput();
        }
      }, 100);
    },
  
    updateFileInfo(fileName) {
      DOM_ELEMENTS.fileLabel().textContent = 'Change TXT Files';
      DOM_ELEMENTS.fileName().textContent = fileName;
    },
  
    resetFileInput() {
      DOM_ELEMENTS.fileLabel().textContent = 'Select TXT Files';
      DOM_ELEMENTS.fileName().textContent = '';
      DOM_ELEMENTS.fileInput().value = '';
    }
  };
  
  // Button Animation
  const ButtonAnimator = {
    init() {
      DOM_ELEMENTS.createButton().addEventListener('mouseenter', this.createParticles);
      DOM_ELEMENTS.createButton().addEventListener('click', this.handleButtonClick);
    },
  
    createParticles() {
      const particlesContainer = DOM_ELEMENTS.particlesContainer();
      particlesContainer.innerHTML = '';
  
      for (let i = 0; i < 120; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.animationDelay = `${Math.random() * 500}ms`;
  
        particlesContainer.appendChild(particle);
      }
    },
  
    handleButtonClick() {
      const createButton = DOM_ELEMENTS.createButton();
      const buttonText = DOM_ELEMENTS.buttonText();
      const progressBar = DOM_ELEMENTS.progressBar();
  
      createButton.classList.add('progress');
      buttonText.textContent = '0%';
      progressBar.style.width = '0%';
    }
  };
  
  // Progress Updater
  const ProgressUpdater = {
    updateProgress() {
      const totalImages = parseInt(DOM_ELEMENTS.totalImagesSpan().innerText);
      const currentCount = parseInt(DOM_ELEMENTS.currentCountSpan().innerText);
      
      if (totalImages === 0) return; // Avoid division by zero
      
      const progress = (currentCount / totalImages) * 100;
      const roundedProgress = Math.round(progress);
      
      DOM_ELEMENTS.progressBar().style.width = `${roundedProgress}%`;
      DOM_ELEMENTS.buttonText().textContent = `${roundedProgress}%`;
  
      if (currentCount > 0) {
        DOM_ELEMENTS.createButton().classList.add('progress');
      }
  
      if (currentCount === totalImages) {
        this.finishProgress();
      }
    },
  
    finishProgress() {
      setTimeout(() => {
        DOM_ELEMENTS.createButton().classList.remove('progress');
        DOM_ELEMENTS.buttonText().textContent = 'Create';
        DOM_ELEMENTS.progressBar().style.width = '0%';
        ButtonAnimator.createParticles(); // Celebration effect
      }, 500);
    }
  };
  
  // Collapsible Section
  const CollapsibleHandler = {
    init() {
      DOM_ELEMENTS.collapsible().addEventListener('click', this.toggleCollapsible);
    },
  
    toggleCollapsible() {
      this.classList.toggle('active');
      const content = DOM_ELEMENTS.content();
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
    }
  };
  
  // Main initialization
  document.addEventListener('DOMContentLoaded', () => {
    FileInputHandler.init();
    ButtonAnimator.init();
    CollapsibleHandler.init();
  
    // Listen for updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateCurrentCount') {
        ProgressUpdater.updateProgress();
      }
    });
  });