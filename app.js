// Confidence Coach Language Learning App

// Global variables
let availableVoices = [];
let phrases = [];
let currentProgress = 0;
const totalPhrasesGoal = 12;
let breathingAnimation = null;
let currentFilter = 'all'; // 'all', 'custom', 'frequent'
let currentSort = 'date'; // 'date', 'alpha', 'spoken'

// Initialize speech synthesis with better voice
function setupBetterVoice() {
  // Wait for voices to be loaded
  speechSynthesis.onvoiceschanged = () => {
    availableVoices = speechSynthesis.getVoices();
    console.log(`${availableVoices.length} voices available`);
    
    // Try to find a better French voice
    const preferredVoices = availableVoices.filter(voice => {
      return voice.lang.includes('fr') && (
        voice.name.includes('Google') ||
        voice.name.includes('Microsoft') ||
        voice.name.includes('Premium') ||
        voice.name.includes('Natural')
      );
    });
    
    if (preferredVoices.length > 0) {
      console.log('Found preferred voice:', preferredVoices[0].name);
    }
  };
}

// DOM elements
const saveButton = document.getElementById("saveScriptBtn");
const scriptInput = document.getElementById("scriptInput");
const phrasesContainer = document.getElementById("phrasesContainer");
const charCount = document.getElementById("charCount");
const startPracticeBtn = document.querySelector('.start-practice-btn');
const importBtn = document.querySelector('.btn-outline');
const filterBtn = document.querySelector('.filter-btn');
const sortBtn = document.querySelector('.sort-btn');
const intentionBtn = document.querySelector('.intention-btn');
const breathCircle = document.querySelector('.breath-circle');

// Modal elements (will be created dynamically)
let filterModal, sortModal, editModal;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  setupBetterVoice();
  initializeApp();
  setupEventListeners();
  createModals();
  startBreathingAnimation();
  updateProgressBar();
});

// Create modal dialogs
function createModals() {
  // Create filter modal
  filterModal = document.createElement('div');
  filterModal.className = 'modal';
  filterModal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>Filter Phrases</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-option" data-filter="all">
          <i class="fas fa-layer-group"></i>
          <span>All Phrases</span>
        </div>
        <div class="modal-option" data-filter="custom">
          <i class="fas fa-edit"></i>
          <span>Custom Phrases Only</span>
        </div>
        <div class="modal-option" data-filter="frequent">
          <i class="fas fa-fire"></i>
          <span>Frequently Spoken</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(filterModal);

  // Create sort modal
  sortModal = document.createElement('div');
  sortModal.className = 'modal';
  sortModal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>Sort Phrases</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-option" data-sort="date">
          <i class="fas fa-calendar"></i>
          <span>Most Recent First</span>
        </div>
        <div class="modal-option" data-sort="alpha">
          <i class="fas fa-sort-alpha-down"></i>
          <span>Alphabetical</span>
        </div>
        <div class="modal-option" data-sort="spoken">
          <i class="fas fa-microphone"></i>
          <span>Most Spoken First</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(sortModal);

  // Create edit modal
  editModal = document.createElement('div');
  editModal.className = 'modal';
  editModal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content edit-modal">
      <div class="modal-header">
        <h3>Edit Phrase</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <textarea id="editPhraseText" placeholder="Edit your phrase..."></textarea>
        <div class="edit-actions">
          <button class="btn btn-secondary edit-cancel">Cancel</button>
          <button class="btn btn-primary edit-save">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(editModal);

  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    
    .modal.active {
      display: flex;
    }
    
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
    }
    
    .modal-content {
      position: relative;
      background: var(--bg-modal);
      border-radius: var(--radius-lg);
      padding: 24px;
      width: 90%;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 1001;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    
    .edit-modal .modal-content {
      max-width: 500px;
    }
    
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    
    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 500;
      color: var(--text-main);
    }
    
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--text-secondary);
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-round);
      transition: var(--transition);
    }
    
    .modal-close:hover {
      background: var(--bg-hover);
    }
    
    .modal-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: var(--radius);
      background: var(--bg-alt);
      border: 1px solid var(--border);
      margin-bottom: 12px;
      cursor: pointer;
      transition: var(--transition);
    }
    
    .modal-option:hover {
      background: var(--bg-hover);
      border-color: var(--primary);
      transform: translateX(4px);
    }
    
    .modal-option.selected {
      background: var(--secondary-soft);
      border-color: var(--secondary);
    }
    
    .modal-option i {
      color: var(--primary);
      font-size: 18px;
      width: 24px;
    }
    
    .modal-option span {
      color: var(--text-main);
      font-weight: 400;
    }
    
    #editPhraseText {
      width: 100%;
      min-height: 150px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-alt);
      color: var(--text-main);
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.6;
      resize: vertical;
    }
    
    .edit-actions {
      display: flex;
      gap: 12px;
    }
    
    .edit-actions .btn {
      flex: 1;
    }
    
    /* Phrase action buttons */
    .phrase-actions {
      display: flex;
      gap: 8px;
    }
    
    .action-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--bg-main);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: var(--transition);
    }
    
    .action-btn:hover {
      background: var(--primary-light);
      color: var(--text-main);
    }
    
    .action-btn.split-btn:hover {
      background: var(--accent-light);
      color: #065F46;
    }
    
    .action-btn.merge-btn:hover {
      background: var(--secondary-light);
      color: #075985;
    }
    
    .action-btn.edit-btn:hover {
      background: var(--quaternary-light);
      color: #5B21B6;
    }
    
    .action-btn.delete-btn:hover {
      background: #FEE2E2;
      color: #DC2626;
    }
    
    .custom-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: var(--accent);
      color: #065F46;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);
}

// Initialize app data
function initializeApp() {
  // Update character count on load
  charCount.textContent = scriptInput.value.length;
  
  // Load saved phrases or script on page load
  const savedPhrases = JSON.parse(localStorage.getItem("phrases"));
  const savedScript = localStorage.getItem("script");
  
  if (savedPhrases && savedPhrases.length > 0) {
    phrases = savedPhrases;
    displayEnhancedPhrases(getFilteredAndSortedPhrases());
    updateConfidenceMetrics();
  } else if (savedScript) {
    scriptInput.value = savedScript;
    charCount.textContent = savedScript.length;
    phrases = splitIntoPhrases(savedScript);
    displayEnhancedPhrases(getFilteredAndSortedPhrases());
    updateConfidenceMetrics();
  }
  
  // Initialize progress from localStorage
  const savedProgress = localStorage.getItem("progress");
  if (savedProgress) {
    currentProgress = parseInt(savedProgress);
  }
  
  // Calculate practiced phrases
  const practicedPhrases = phrases.filter(p => p.practiced).length;
  currentProgress = Math.max(currentProgress, practicedPhrases);
  
  // Update daily intention
  updateDailyIntention();
}

// Setup all event listeners
function setupEventListeners() {
  // Character counter for textarea
  scriptInput.addEventListener('input', function() {
    charCount.textContent = scriptInput.value.length;
  });
  
  // Save & split script
  saveButton.addEventListener("click", handleSaveScript);
  
  // Start practice session
  if (startPracticeBtn) {
    startPracticeBtn.addEventListener("click", handleStartPractice);
  }
  
  // Import button
  if (importBtn) {
    importBtn.addEventListener("click", handleImportScript);
  }
  
  // Filter and sort buttons
  if (filterBtn) {
    filterBtn.addEventListener("click", () => showModal('filter'));
  }
  
  if (sortBtn) {
    sortBtn.addEventListener("click", () => showModal('sort'));
  }
  
  // Daily intention button
  if (intentionBtn) {
    intentionBtn.addEventListener('click', updateDailyIntention);
  }
  
  // User profile
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    userProfile.addEventListener('click', function() {
      showToast("Profile settings coming soon", "info");
    });
  }
  
  // Footer links
  document.querySelectorAll('.footer-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const text = this.querySelector('span').textContent;
      showToast(`${text} feature coming soon`, "info");
    });
  });
  
  // Modal event listeners
  setupModalEvents();
}

function setupModalEvents() {
  // Close modals when clicking overlay or close button
  document.querySelectorAll('.modal-overlay, .modal-close').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      hideAllModals();
    });
  });
  
  // Prevent modal content from closing modal
  document.querySelectorAll('.modal-content').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
  
  // Filter modal options
  filterModal.querySelectorAll('.modal-option').forEach(option => {
    option.addEventListener('click', function() {
      const filter = this.dataset.filter;
      currentFilter = filter;
      
      // Update filter button text
      const filterText = filter === 'all' ? 'All Phrases' : 
                        filter === 'custom' ? 'Custom Only' : 
                        'Frequent';
      filterBtn.querySelector('i').className = filter === 'all' ? 'fas fa-filter' :
                                               filter === 'custom' ? 'fas fa-edit' : 
                                               'fas fa-fire';
      
      // Show filter status
      showToast(`Filter: ${filterText}`, "info");
      
      // Update display
      displayEnhancedPhrases(getFilteredAndSortedPhrases());
      hideAllModals();
    });
  });
  
  // Sort modal options
  sortModal.querySelectorAll('.modal-option').forEach(option => {
    option.addEventListener('click', function() {
      const sort = this.dataset.sort;
      currentSort = sort;
      
      // Update sort button icon
      sortBtn.querySelector('i').className = sort === 'date' ? 'fas fa-calendar' :
                                            sort === 'alpha' ? 'fas fa-sort-alpha-down' : 
                                            'fas fa-microphone';
      
      // Show sort status
      const sortText = sort === 'date' ? 'Date' : 
                      sort === 'alpha' ? 'A-Z' : 
                      'Spoken';
      showToast(`Sorted by: ${sortText}`, "info");
      
      // Update display
      displayEnhancedPhrases(getFilteredAndSortedPhrases());
      hideAllModals();
    });
  });
  
  // Edit modal buttons
  editModal.querySelector('.edit-cancel').addEventListener('click', () => {
    hideAllModals();
  });
  
  editModal.querySelector('.edit-save').addEventListener('click', saveEditedPhrase);
}

function showModal(type) {
  hideAllModals();
  
  switch(type) {
    case 'filter':
      // Update selected filter
      filterModal.querySelectorAll('.modal-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.filter === currentFilter) {
          option.classList.add('selected');
        }
      });
      filterModal.classList.add('active');
      break;
      
    case 'sort':
      // Update selected sort
      sortModal.querySelectorAll('.modal-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.sort === currentSort) {
          option.classList.add('selected');
        }
      });
      sortModal.classList.add('active');
      break;
  }
}

function hideAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
}

// Get filtered and sorted phrases
function getFilteredAndSortedPhrases() {
  let filtered = [...phrases];
  
  // Apply filter
  switch(currentFilter) {
    case 'custom':
      filtered = filtered.filter(p => p.isCustom);
      break;
    case 'frequent':
      filtered = filtered.filter(p => p.spokenCount > 2);
      break;
  }
  
  // Apply sort
  switch(currentSort) {
    case 'date':
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'alpha':
      filtered.sort((a, b) => a.text.localeCompare(b.text));
      break;
    case 'spoken':
      filtered.sort((a, b) => b.spokenCount - a.spokenCount);
      break;
  }
  
  return filtered;
}

// --- Core Functions ---

function handleSaveScript() {
  const scriptText = scriptInput.value;
  
  if (scriptText.trim() === "") {
    showToast("Please paste a script first", "info");
    return;
  }
  
  // Save previous script for history
  saveToHistory(scriptText);
  
  // Show loading state
  const originalText = saveButton.innerHTML;
  saveButton.innerHTML = '<div class="loading-spinner"></div>';
  saveButton.disabled = true;
  
  // Animate save button
  saveButton.style.transform = 'scale(0.95)';
  
  // Simulate processing delay
  setTimeout(() => {
    // Split and save phrases
    const rawPhrases = splitIntoPhrases(scriptText);
    
    // Convert to enhanced phrase objects with metadata
    phrases = rawPhrases.map((text, index) => {
      return {
        id: Date.now() + index,
        text: text,
        tag: getPhraseTag(text),
        practiced: false,
        practiceTime: 0,
        spokenCount: 0,
        confidence: Math.floor(Math.random() * 40), // Random initial confidence
        lastPracticed: null,
        isCustom: false,
        createdAt: new Date().toISOString()
      };
    });
    
    // Save to localStorage
    localStorage.setItem("script", scriptText);
    localStorage.setItem("phrases", JSON.stringify(phrases));
    
    // Update UI
    displayEnhancedPhrases(getFilteredAndSortedPhrases());
    updateProgressBar();
    
    // Show success state
    saveButton.innerHTML = '<i class="fas fa-check"></i> Saved';
    saveButton.style.background = 'linear-gradient(135deg, var(--accent), var(--accent-dark))';
    
    // Animate success
    saveButton.style.transform = 'scale(1.05)';
    
    // Reset after 2 seconds
    setTimeout(() => {
      saveButton.innerHTML = originalText;
      saveButton.disabled = false;
      saveButton.style.background = '';
      saveButton.style.transform = '';
      showToast(`Created ${phrases.length} practice phrases`, "success");
      
      // Animate phrase cards entry
      animatePhraseCards();
    }, 2000);
    
  }, 1500);
}

function splitIntoPhrases(text) {
  // Split by sentences, keeping questions and exclamations
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences
    .map(p => p.trim())
    .filter(p => p !== "" && p.length > 3);
}

function speakFrench(text) {
  if (!text || speechSynthesis.speaking) return;
  
  // Pause breathing animation
  pauseBreathingAnimation();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.85; // Slightly slower for coach-like delivery
  utterance.pitch = 1.1; // Slightly higher pitch
  utterance.volume = 1;
  
  // Find the best French voice
  let bestVoice = null;
  
  // First try to find premium voices
  bestVoice = availableVoices.find(
    v => v.lang.includes('fr') && (
      v.name.includes('Google') ||
      v.name.includes('Microsoft') ||
      v.name.includes('Premium') ||
      v.name.includes('Natural') ||
      v.name.includes('Enhanced')
    )
  );
  
  // If no premium voice, take any French voice
  if (!bestVoice) {
    bestVoice = availableVoices.find(
      v => v.lang === "fr-FR" || v.lang.startsWith("fr")
    );
  }
  
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log('Using voice:', bestVoice.name);
  }
  
  // Event listeners for the utterance
  utterance.onstart = () => {
    showToast("Speaking phrase...", "info");
  };
  
  utterance.onend = () => {
    // Resume breathing animation
    resumeBreathingAnimation();
    showToast("Phrase completed", "success");
  };
  
  utterance.onerror = (event) => {
    resumeBreathingAnimation();
    showToast("Speech synthesis error", "error");
  };
  
  speechSynthesis.speak(utterance);
}

// --- Enhanced Display Functions ---

function displayEnhancedPhrases(phrasesArray) {
  phrasesContainer.innerHTML = "";
  
  if (phrasesArray.length === 0) {
    let message = "";
    switch(currentFilter) {
      case 'custom':
        message = "No custom phrases. Edit a phrase to mark it as custom.";
        break;
      case 'frequent':
        message = "No frequently spoken phrases yet. Practice some phrases!";
        break;
      default:
        message = "No phrases yet. Paste and save a script to begin.";
    }
    
    phrasesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-feather"></i>
        </div>
        <div class="empty-text">${message}</div>
      </div>
    `;
    return;
  }
  
  phrasesArray.forEach((phraseObj, index) => {
    const phraseCard = createPhraseCard(phraseObj, index);
    phrasesContainer.appendChild(phraseCard);
  });
  
  updateConfidenceMetrics();
}

function createPhraseCard(phraseObj, index) {
  const phraseCard = document.createElement("div");
  phraseCard.className = "phrase-card";
  phraseCard.dataset.id = phraseObj.id;
  phraseCard.dataset.confidence = phraseObj.confidence;
  phraseCard.style.opacity = "0";
  phraseCard.style.transform = "translateY(20px)";
  
  // Determine confidence color
  let confidenceColor = "var(--accent)";
  if (phraseObj.confidence < 50) confidenceColor = "var(--secondary)";
  else if (phraseObj.confidence < 80) confidenceColor = "var(--primary)";
  
  // Format practice time
  const practiceTimeText = phraseObj.practiceTime > 0 ? 
    `${phraseObj.practiceTime} min` : "Not practiced";
  
  phraseCard.innerHTML = `
    ${phraseObj.isCustom ? '<div class="custom-badge">Custom</div>' : ''}
    <div class="phrase-content">
      <div class="phrase-text">${phraseObj.text}</div>
      <div class="phrase-meta">
        <span class="meta-item"><i class="far fa-clock"></i> ${practiceTimeText}</span>
        <span class="meta-item"><i class="fas fa-wave-square" style="color: ${confidenceColor}"></i> ${phraseObj.confidence}%</span>
        <span class="meta-item"><i class="fas fa-microphone"></i> ${phraseObj.spokenCount}</span>
        <span class="phrase-tag">${phraseObj.tag}</span>
      </div>
    </div>
    <div class="phrase-actions">
      <button class="phrase-btn play-btn" title="Play phrase">
        <i class="fas fa-play"></i>
      </button>
      <div class="action-buttons">
        <button class="action-btn edit-btn" title="Edit phrase">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn split-btn" title="Split phrase">
          <i class="fas fa-cut"></i>
        </button>
        <button class="action-btn merge-btn" title="Merge with next phrase">
          <i class="fas fa-arrow-down"></i>
        </button>
        <button class="action-btn delete-btn" title="Delete phrase">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <button class="phrase-btn check-btn" title="${phraseObj.practiced ? 'Mark as not practiced' : 'Mark as practiced'}">
        <i class="${phraseObj.practiced ? 'fas' : 'far'} fa-check-circle"></i>
      </button>
    </div>
  `;
  
  // Add event listeners
  const playBtn = phraseCard.querySelector('.play-btn');
  const checkBtn = phraseCard.querySelector('.check-btn');
  const editBtn = phraseCard.querySelector('.edit-btn');
  const splitBtn = phraseCard.querySelector('.split-btn');
  const mergeBtn = phraseCard.querySelector('.merge-btn');
  const deleteBtn = phraseCard.querySelector('.delete-btn');
  
  playBtn.addEventListener('click', () => {
    handlePlayPhrase(phraseObj, playBtn);
  });
  
  checkBtn.addEventListener('click', () => {
    handlePracticePhrase(phraseObj, checkBtn, index);
  });
  
  editBtn.addEventListener('click', () => {
    handleEditPhrase(phraseObj);
  });
  
  splitBtn.addEventListener('click', () => {
    handleSplitPhrase(phraseObj);
  });
  
  mergeBtn.addEventListener('click', () => {
    handleMergePhrase(phraseObj, index);
  });
  
  deleteBtn.addEventListener('click', () => {
    handleDeletePhrase(phraseObj);
  });
  
  // Add hover effect for the whole card
  phraseCard.addEventListener('mouseenter', () => {
    phraseCard.style.transform = 'translateY(-4px)';
  });
  
  phraseCard.addEventListener('mouseleave', () => {
    phraseCard.style.transform = 'translateY(0)';
  });
  
  return phraseCard;
}

// --- New Editing Functions ---

let currentEditingPhrase = null;

function handleEditPhrase(phraseObj) {
  currentEditingPhrase = phraseObj;
  const editTextarea = editModal.querySelector('#editPhraseText');
  editTextarea.value = phraseObj.text;
  editModal.classList.add('active');
}

function saveEditedPhrase() {
  if (!currentEditingPhrase) return;
  
  const editTextarea = editModal.querySelector('#editPhraseText');
  const newText = editTextarea.value.trim();
  
  if (!newText) {
    showToast("Phrase cannot be empty", "error");
    return;
  }
  
  // Update phrase
  currentEditingPhrase.text = newText;
  currentEditingPhrase.isCustom = true;
  currentEditingPhrase.tag = getPhraseTag(newText);
  
  // Save and update
  localStorage.setItem("phrases", JSON.stringify(phrases));
  displayEnhancedPhrases(getFilteredAndSortedPhrases());
  
  hideAllModals();
  showToast("Phrase updated successfully", "success");
  currentEditingPhrase = null;
}

function handleSplitPhrase(phraseObj) {
  // Simple split by punctuation
  const sentences = phraseObj.text.split(/[.!?]+/).filter(s => s.trim());
  
  if (sentences.length <= 1) {
    showToast("This phrase cannot be split further", "info");
    return;
  }
  
  if (confirm(`Split this phrase into ${sentences.length} parts?`)) {
    const newPhrases = sentences.map((sentence, index) => ({
      id: Date.now() + index,
      text: sentence.trim() + (phraseObj.text.match(/[.!?]/g)?.[index] || '.'),
      tag: getPhraseTag(sentence),
      practiced: false,
      practiceTime: 0,
      spokenCount: 0,
      confidence: phraseObj.confidence / sentences.length,
      lastPracticed: null,
      isCustom: true,
      createdAt: new Date().toISOString()
    }));
    
    // Remove original and add new phrases
    phrases = phrases.filter(p => p.id !== phraseObj.id);
    phrases.push(...newPhrases);
    
    // Save and update
    localStorage.setItem("phrases", JSON.stringify(phrases));
    displayEnhancedPhrases(getFilteredAndSortedPhrases());
    
    showToast(`Split into ${newPhrases.length} phrases`, "success");
  }
}

function handleMergePhrase(phraseObj, index) {
  if (index >= phrases.length - 1) {
    showToast("No next phrase to merge with", "info");
    return;
  }
  
  const nextPhrase = phrases[index + 1];
  
  if (confirm("Merge these two phrases?")) {
    const mergedText = phraseObj.text.trim() + ' ' + nextPhrase.text.trim();
    
    const mergedPhrase = {
      id: phraseObj.id,
      text: mergedText,
      tag: getPhraseTag(mergedText),
      practiced: phraseObj.practiced || nextPhrase.practiced,
      practiceTime: phraseObj.practiceTime + nextPhrase.practiceTime,
      spokenCount: phraseObj.spokenCount + nextPhrase.spokenCount,
      confidence: Math.max(phraseObj.confidence, nextPhrase.confidence),
      lastPracticed: phraseObj.lastPracticed || nextPhrase.lastPracticed,
      isCustom: true,
      createdAt: phraseObj.createdAt
    };
    
    // Remove both original phrases and add merged one
    phrases = phrases.filter((p, i) => i !== index && i !== index + 1);
    phrases.splice(index, 0, mergedPhrase);
    
    // Save and update
    localStorage.setItem("phrases", JSON.stringify(phrases));
    displayEnhancedPhrases(getFilteredAndSortedPhrases());
    
    showToast("Phrases merged successfully", "success");
  }
}

function handleDeletePhrase(phraseObj) {
  if (confirm("Are you sure you want to delete this phrase?")) {
    phrases = phrases.filter(p => p.id !== phraseObj.id);
    localStorage.setItem("phrases", JSON.stringify(phrases));
    displayEnhancedPhrases(getFilteredAndSortedPhrases());
    showToast("Phrase deleted", "success");
  }
}

// --- Interaction Handlers ---

function handlePlayPhrase(phraseObj, button) {
  const icon = button.querySelector('i');
  
  // Animate play button
  button.style.transform = 'scale(1.2)';
  button.style.boxShadow = '0 8px 25px rgba(122, 197, 211, 0.4)';
  
  // Speak the phrase
  speakFrench(phraseObj.text);
  
  // Track practice time
  const startTime = Date.now();
  
  // Check when speech ends
  const checkSpeechEnd = setInterval(() => {
    if (!speechSynthesis.speaking) {
      clearInterval(checkSpeechEnd);
      
      const endTime = Date.now();
      const practiceSeconds = Math.round((endTime - startTime) / 1000);
      
      // Update phrase stats
      phraseObj.practiceTime += Math.round(practiceSeconds / 60);
      phraseObj.spokenCount += 1;
      phraseObj.lastPracticed = new Date().toISOString();
      
      // Increase confidence
      if (phraseObj.confidence < 100) {
        phraseObj.confidence = Math.min(phraseObj.confidence + 5, 100);
      }
      
      // Save and update
      localStorage.setItem("phrases", JSON.stringify(phrases));
      updatePhraseCard(phraseObj.id);
      updateProgressBar();
      
      // Reset button animation
      setTimeout(() => {
        button.style.transform = '';
        button.style.boxShadow = '';
      }, 300);
    }
  }, 100);
}

function handlePracticePhrase(phraseObj, button, index) {
  const icon = button.querySelector('i');
  
  // Toggle practiced state
  phraseObj.practiced = !phraseObj.practiced;
  
  // Animate button
  button.style.transform = 'scale(1.1)';
  
  if (phraseObj.practiced) {
    // Mark as practiced
    phraseObj.lastPracticed = new Date().toISOString();
    phraseObj.confidence = Math.max(phraseObj.confidence, 40);
    
    // Update icon
    icon.className = 'fas fa-check-circle';
    
    // Show success animation
    button.style.background = 'var(--accent)';
    
    // Update progress
    currentProgress = Math.min(currentProgress + 1, totalPhrasesGoal);
    
    showToast("Phrase practiced! ✨", "success");
    
  } else {
    // Mark as not practiced
    icon.className = 'far fa-check-circle';
    button.style.background = '';
    
    // Update progress
    currentProgress = Math.max(currentProgress - 1, 0);
    
    showToast("Practice reset", "info");
  }
  
  // Save and update
  localStorage.setItem("progress", currentProgress);
  localStorage.setItem("phrases", JSON.stringify(phrases));
  
  updatePhraseCard(phraseObj.id);
  updateProgressBar();
  
  // Reset button animation
  setTimeout(() => {
    button.style.transform = '';
  }, 300);
}

// --- Additional Features ---

function handleStartPractice() {
  if (phrases.length === 0) {
    showToast("Save a script first", "info");
    return;
  }
  
  // Find phrases needing practice
  const needsPractice = phrases.filter(p => p.confidence < 70);
  
  if (needsPractice.length === 0) {
    showToast("All phrases are well practiced! 🎉", "success");
    return;
  }
  
  // Sort by confidence and start with lowest
  const sorted = [...needsPractice].sort((a, b) => a.confidence - b.confidence);
  const targetPhrase = sorted[0];
  
  // Find and highlight the card
  const phraseCard = document.querySelector(`.phrase-card[data-id="${targetPhrase.id}"]`);
  if (phraseCard) {
    // Scroll to phrase
    phraseCard.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Highlight animation
    phraseCard.style.boxShadow = '0 0 0 3px var(--accent), var(--shadow-light)';
    phraseCard.style.transform = 'scale(1.02)';
    
    setTimeout(() => {
      phraseCard.style.boxShadow = '';
      phraseCard.style.transform = '';
    }, 3000);
  }
  
  // Speak the phrase
  setTimeout(() => {
    speakFrench(targetPhrase.text);
  }, 1000);
  
  showToast(`Starting with "${targetPhrase.tag}" phrase`, "info");
}

function handleImportScript() {
  // Create file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.txt,.md,.doc,.docx';
  fileInput.style.display = 'none';
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      scriptInput.value = e.target.result;
      charCount.textContent = e.target.result.length;
      showToast("Script imported successfully", "success");
    };
    reader.readAsText(file);
  };
  
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

// --- Utility Functions ---

function updatePhraseCard(phraseId) {
  const phraseObj = phrases.find(p => p.id == phraseId);
  if (!phraseObj) return;
  
  const phraseCard = document.querySelector(`.phrase-card[data-id="${phraseId}"]`);
  if (!phraseCard) return;
  
  // Update confidence display
  const confidenceElement = phraseCard.querySelector('.fa-wave-square');
  const confidenceText = phraseCard.querySelector('.meta-item:nth-child(2)');
  
  // Update confidence color
  let confidenceColor = "var(--accent)";
  if (phraseObj.confidence < 50) confidenceColor = "var(--secondary)";
  else if (phraseObj.confidence < 80) confidenceColor = "var(--primary)";
  
  if (confidenceElement) confidenceElement.style.color = confidenceColor;
  if (confidenceText) confidenceText.innerHTML = `<i class="fas fa-wave-square" style="color: ${confidenceColor}"></i> ${phraseObj.confidence}%`;
  
  // Update practice time
  const practiceTimeElement = phraseCard.querySelector('.meta-item:nth-child(1)');
  const practiceTime = phraseObj.practiceTime > 0 ? `${phraseObj.practiceTime} min` : "Not practiced";
  if (practiceTimeElement) practiceTimeElement.innerHTML = `<i class="far fa-clock"></i> ${practiceTime}`;
  
  // Update spoken count
  const spokenCountElement = phraseCard.querySelector('.meta-item:nth-child(3)');
  if (spokenCountElement) spokenCountElement.innerHTML = `<i class="fas fa-microphone"></i> ${phraseObj.spokenCount}`;
  
  // Update check button
  const checkBtn = phraseCard.querySelector('.check-btn');
  const checkIcon = checkBtn.querySelector('i');
  checkBtn.title = phraseObj.practiced ? 'Mark as not practiced' : 'Mark as practiced';
  checkIcon.className = phraseObj.practiced ? 'fas fa-check-circle' : 'far fa-check-circle';
  
  if (phraseObj.practiced) {
    checkBtn.style.background = 'var(--accent)';
    checkBtn.style.color = 'white';
  } else {
    checkBtn.style.background = '';
    checkBtn.style.color = '';
  }
  
  // Update custom badge
  const customBadge = phraseCard.querySelector('.custom-badge');
  if (phraseObj.isCustom) {
    if (!customBadge) {
      const badge = document.createElement('div');
      badge.className = 'custom-badge';
      badge.textContent = 'Custom';
      phraseCard.insertBefore(badge, phraseCard.firstChild);
    }
  } else if (customBadge) {
    customBadge.remove();
  }
}

function updateProgressBar() {
  const progressFill = document.querySelector('.progress-fill');
  const progressPercent = document.querySelector('.progress-percent');
  const progressDetail = document.querySelector('.progress-detail span');
  
  if (!progressFill || !progressPercent || !progressDetail) return;
  
  const progressPercentage = Math.round((currentProgress / totalPhrasesGoal) * 100);
  
  // Animate progress bar
  progressFill.style.width = `${progressPercentage}%`;
  progressPercent.textContent = `${progressPercentage}%`;
  progressDetail.textContent = `${currentProgress} of ${totalPhrasesGoal} phrases practiced today`;
  
  // Animate number
  progressPercent.style.transform = 'scale(1.2)';
  setTimeout(() => {
    progressPercent.style.transform = '';
  }, 300);
}

function updateConfidenceMetrics() {
  if (phrases.length === 0) return;
  
  const totalConfidence = phrases.reduce((sum, p) => sum + p.confidence, 0);
  const avgConfidence = Math.round(totalConfidence / phrases.length);
  
  // Update breathing animation speed based on average confidence
  if (breathCircle) {
    const duration = 10 - (avgConfidence / 15); // Slower breathing for higher confidence
    breathCircle.style.animationDuration = `${duration}s`;
  }
}

function getPhraseTag(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('bonjour') || lowerText.includes('bienvenue')) {
    return "Greeting";
  } else if (lowerText.includes('question') || lowerText.includes('poser')) {
    return "Interaction";
  } else if (lowerText.includes('œuvre') || lowerText.includes('peinture')) {
    return "Art";
  } else if (lowerText.includes('salle') || lowerText.includes('commencer')) {
    return "Introduction";
  } else if (lowerText.includes('merci') || lowerText.includes('au revoir')) {
    return "Closing";
  } else if (lowerText.includes('histoire') || lowerText.includes('année')) {
    return "History";
  } else {
    return "General";
  }
}

function updateDailyIntention() {
  const intentions = [
    "Speak with gentle confidence",
    "Breathe before each phrase",
    "Focus on clarity over speed",
    "Embrace pauses naturally",
    "Feel the words as you speak",
    "Project calm assurance",
    "Connect with your audience",
    "Trust your preparation"
  ];
  
  const randomIntention = intentions[Math.floor(Math.random() * intentions.length)];
  document.querySelector('.intention-content p').textContent = randomIntention;
  
  // Animate intention change
  const intentionIcon = document.querySelector('.intention-icon');
  intentionIcon.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    intentionIcon.style.transform = '';
  }, 500);
  
  showToast("New intention set", "success");
}

function saveToHistory(scriptText) {
  const history = JSON.parse(localStorage.getItem("scriptHistory") || "[]");
  history.unshift({
    text: scriptText.substring(0, 100) + (scriptText.length > 100 ? "..." : ""),
    date: new Date().toISOString(),
    fullText: scriptText
  });
  
  // Keep only last 10 scripts
  localStorage.setItem("scriptHistory", JSON.stringify(history.slice(0, 10)));
}

// --- Breathing Animation ---

function startBreathingAnimation() {
  if (!breathCircle) return;
  
  // Start with calm breathing
  breathCircle.style.animation = 'breathe 8s infinite ease-in-out';
}

function pauseBreathingAnimation() {
  if (!breathCircle) return;
  breathCircle.style.animationPlayState = 'paused';
}

function resumeBreathingAnimation() {
  if (!breathCircle) return;
  breathCircle.style.animationPlayState = 'running';
}

// --- Animation Effects ---

function animatePhraseCards() {
  const cards = document.querySelectorAll('.phrase-card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
      card.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
    }, index * 100);
  });
}

// --- Toast Notifications ---

function showToast(message, type = "info") {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${getToastIcon(type)}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  document.body.appendChild(toast);
  
  // Add close event
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'toastSlideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'toastSlideOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }
  }, 4000);
}

function getToastIcon(type) {
  switch(type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    default: return 'fa-info-circle';
  }
}

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    splitIntoPhrases,
    speakFrench,
    displayEnhancedPhrases
  };
}
