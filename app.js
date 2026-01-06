// Confidence Coach App with Professional UX

// Global variables
let availableVoices = [];
let phrases = [];
let currentProgress = 0;
const totalPhrasesGoal = 12;

// Initialize speech synthesis voices
speechSynthesis.onvoiceschanged = () => {
  availableVoices = speechSynthesis.getVoices();
  console.log(`${availableVoices.length} voices available`);
};

// DOM elements
const saveButton = document.getElementById("saveScriptBtn");
const scriptInput = document.getElementById("scriptInput");
const phrasesContainer = document.getElementById("phrasesContainer");
const charCount = document.getElementById("charCount");
const startPracticeBtn = document.querySelector('.btn-secondary:nth-of-type(2)');
const loadPreviousBtn = document.querySelector('.btn-secondary:nth-of-type(1)');
const filterBtn = document.querySelector('.section-actions .btn-secondary:nth-of-type(1)');
const sortBtn = document.querySelector('.section-actions .btn-secondary:nth-of-type(2)');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
  updateProgressBar();
});

// Initialize app data
function initializeApp() {
  // Update character count on load
  charCount.textContent = scriptInput.value.length;
  
  // Load saved phrases or script on page load
  const savedPhrases = JSON.parse(localStorage.getItem("phrases"));
  const savedScript = localStorage.getItem("script");
  
  if (savedPhrases && savedPhrases.length > 0) {
    phrases = savedPhrases;
    displayEnhancedPhrases(phrases);
    updateConfidenceMetrics();
  } else if (savedScript) {
    scriptInput.value = savedScript;
    charCount.textContent = savedScript.length;
    phrases = splitIntoPhrases(savedScript);
    displayEnhancedPhrases(phrases);
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
  
  // Load previous script
  if (loadPreviousBtn) {
    loadPreviousBtn.addEventListener("click", handleLoadPrevious);
  }
  
  // Filter and sort buttons
  if (filterBtn) {
    filterBtn.addEventListener("click", handleFilterPhrases);
  }
  
  if (sortBtn) {
    sortBtn.addEventListener("click", handleSortPhrases);
  }
  
  // User profile dropdown
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    userProfile.addEventListener('click', function() {
      this.classList.toggle('active');
      // In a real app, you would show a dropdown menu here
    });
  }
}

// --- Core Functions (Your original functionality) ---

function handleSaveScript() {
  const scriptText = scriptInput.value;
  
  if (scriptText.trim() === "") {
    showToast("Please paste a script first.", "warning");
    return;
  }
  
  // Show loading state
  const originalText = saveButton.innerHTML;
  saveButton.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i> Processing...';
  saveButton.disabled = true;
  
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
        practiceTime: 0, // in minutes
        confidence: 0,
        lastPracticed: null,
        audioURL: null
      };
    });
    
    // Save to localStorage
    localStorage.setItem("script", scriptText);
    localStorage.setItem("phrases", JSON.stringify(phrases));
    
    // Update UI
    displayEnhancedPhrases(phrases);
    updateProgressBar();
    
    // Show success state
    saveButton.innerHTML = '<i class="fas fa-check btn-icon"></i> Script Saved!';
    saveButton.style.background = 'var(--accent)';
    
    // Reset after 2 seconds
    setTimeout(() => {
      saveButton.innerHTML = originalText;
      saveButton.disabled = false;
      saveButton.style.background = '';
      showToast(`Successfully created ${phrases.length} practice phrases`, "success");
    }, 2000);
    
  }, 1000);
}

function splitIntoPhrases(text) {
  return text
    .split(/\n|\.(?=\s|$)/)
    .map(p => p.trim())
    .filter(p => p !== "" && p.length > 3);
}

function speakFrench(text) {
  if (!text || speechSynthesis.speaking) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  // Find French voice
  const frenchVoice = availableVoices.find(
    v => v.lang === "fr-FR" || v.lang.startsWith("fr")
  );
  
  if (frenchVoice) {
    utterance.voice = frenchVoice;
    console.log(`Using voice: ${frenchVoice.name}`);
  } else {
    console.log("French voice not found, using default");
  }
  
  // Event listeners for the utterance
  utterance.onstart = () => {
    console.log("Speech started");
  };
  
  utterance.onend = () => {
    console.log("Speech ended");
  };
  
  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event);
    showToast("Error playing audio", "error");
  };
  
  speechSynthesis.speak(utterance);
}

// --- Enhanced Display Functions ---

function displayEnhancedPhrases(phrasesArray) {
  phrasesContainer.innerHTML = "";
  
  if (phrasesArray.length === 0) {
    phrasesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-comment-dots"></i>
        </div>
        <div class="empty-text">No phrases yet. Paste and save a script to get started.</div>
      </div>
    `;
    return;
  }
  
  phrasesArray.forEach((phraseObj, index) => {
    const phraseCard = createPhraseCard(phraseObj, index);
    phrasesContainer.appendChild(phraseCard);
  });
  
  // Update metrics
  updateConfidenceMetrics();
}

function createPhraseCard(phraseObj, index) {
  const phraseCard = document.createElement("div");
  phraseCard.className = "phrase-card";
  phraseCard.dataset.id = phraseObj.id;
  phraseCard.dataset.confidence = phraseObj.confidence;
  
  // Determine confidence color
  let confidenceColor = "#5dcec3"; // Default accent color
  if (phraseObj.confidence < 50) confidenceColor = "#f56565";
  else if (phraseObj.confidence < 80) confidenceColor = "#ed8936";
  
  // Format practice time
  const practiceTimeText = phraseObj.practiceTime > 0 ? 
    `${phraseObj.practiceTime} min` : "Not practiced";
  
  // Last practiced date
  const lastPracticedText = phraseObj.lastPracticed ? 
    formatDate(new Date(phraseObj.lastPracticed)) : "Never";
  
  phraseCard.innerHTML = `
    <div class="phrase-content">
      <div class="phrase-text">${phraseObj.text}</div>
      <div class="phrase-meta">
        <span><i class="far fa-clock"></i> ${practiceTimeText}</span>
        <span><i class="fas fa-chart-line" style="color: ${confidenceColor}"></i> Confidence: ${phraseObj.confidence}%</span>
        <span class="phrase-tag">${phraseObj.tag}</span>
      </div>
    </div>
    <div class="phrase-actions">
      <button class="phrase-btn play-btn" title="Play phrase">
        <i class="fas fa-play"></i>
      </button>
      <button class="phrase-btn practice-btn" title="Mark as practiced">
        <i class="fas fa-check-circle"></i>
      </button>
      <button class="phrase-btn edit-btn" title="Edit phrase">
        <i class="fas fa-edit"></i>
      </button>
      <button class="phrase-btn menu-btn" title="More options">
        <i class="fas fa-ellipsis-h"></i>
      </button>
    </div>
  `;
  
  // Add event listeners to buttons
  const playBtn = phraseCard.querySelector('.play-btn');
  const practiceBtn = phraseCard.querySelector('.practice-btn');
  const editBtn = phraseCard.querySelector('.edit-btn');
  const menuBtn = phraseCard.querySelector('.menu-btn');
  
  playBtn.addEventListener('click', () => {
    handlePlayPhrase(phraseObj, playBtn);
  });
  
  practiceBtn.addEventListener('click', () => {
    handlePracticePhrase(phraseObj, practiceBtn, index);
  });
  
  editBtn.addEventListener('click', () => {
    handleEditPhrase(phraseObj, index);
  });
  
  menuBtn.addEventListener('click', (e) => {
    showPhraseMenu(e, phraseObj, index);
  });
  
  return phraseCard;
}

// --- Enhanced Interaction Handlers ---

function handlePlayPhrase(phraseObj, button) {
  const icon = button.querySelector('i');
  
  // Visual feedback
  button.style.background = 'var(--primary)';
  button.style.color = 'white';
  icon.className = 'fas fa-volume-up';
  
  // Speak the phrase
  speakFrench(phraseObj.text);
  
  // Track practice time
  const startTime = Date.now();
  
  // Reset button after speech ends
  const checkSpeechEnd = setInterval(() => {
    if (!speechSynthesis.speaking) {
      clearInterval(checkSpeechEnd);
      
      const endTime = Date.now();
      const practiceSeconds = Math.round((endTime - startTime) / 1000);
      
      // Add practice time
      phraseObj.practiceTime += Math.round(practiceSeconds / 60);
      phraseObj.lastPracticed = new Date().toISOString();
      
      // Update confidence (practice increases confidence)
      if (phraseObj.confidence < 100) {
        phraseObj.confidence = Math.min(phraseObj.confidence + 5, 100);
      }
      
      // Save updated phrases
      localStorage.setItem("phrases", JSON.stringify(phrases));
      
      // Update UI
      updatePhraseCard(phraseObj.id);
      updateProgressBar();
      
      // Reset button
      setTimeout(() => {
        button.style.background = '';
        button.style.color = '';
        icon.className = 'fas fa-play';
      }, 500);
    }
  }, 100);
}

function handlePracticePhrase(phraseObj, button, index) {
  const icon = button.querySelector('i');
  
  // Toggle practiced state
  phraseObj.practiced = !phraseObj.practiced;
  
  if (phraseObj.practiced) {
    // Mark as practiced
    phraseObj.lastPracticed = new Date().toISOString();
    phraseObj.confidence = Math.max(phraseObj.confidence, 30); // Minimum confidence when practiced
    
    // Visual feedback
    button.style.background = 'var(--accent)';
    button.style.color = 'white';
    icon.className = 'fas fa-check';
    
    showToast("Phrase marked as practiced!", "success");
    
    // Update progress
    currentProgress = Math.min(currentProgress + 1, totalPhrasesGoal);
    localStorage.setItem("progress", currentProgress);
    
  } else {
    // Mark as not practiced
    button.style.background = '';
    button.style.color = '';
    icon.className = 'fas fa-check-circle';
    
    // Update progress
    currentProgress = Math.max(currentProgress - 1, 0);
    localStorage.setItem("progress", currentProgress);
  }
  
  // Save updated phrases
  localStorage.setItem("phrases", JSON.stringify(phrases));
  
  // Update UI
  updatePhraseCard(phraseObj.id);
  updateProgressBar();
}

function handleEditPhrase(phraseObj, index) {
  // Create modal or inline edit
  const phraseCard = document.querySelector(`.phrase-card[data-id="${phraseObj.id}"]`);
  const phraseTextElement = phraseCard.querySelector('.phrase-text');
  const originalText = phraseTextElement.textContent;
  
  // Replace with textarea for editing
  const textarea = document.createElement('textarea');
  textarea.className = 'phrase-edit-input';
  textarea.value = originalText;
  textarea.rows = 2;
  
  phraseTextElement.replaceWith(textarea);
  textarea.focus();
  
  // Save on blur or Enter key
  textarea.addEventListener('blur', saveEdit);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit(textarea, originalText);
    }
  });
  
  function saveEdit() {
    const newText = textarea.value.trim();
    if (newText && newText !== originalText) {
      phraseObj.text = newText;
      phraseObj.tag = getPhraseTag(newText);
      
      // Save to localStorage
      localStorage.setItem("phrases", JSON.stringify(phrases));
      
      // Update UI
      updatePhraseCard(phraseObj.id);
      showToast("Phrase updated", "success");
    } else {
      cancelEdit(textarea, originalText);
    }
  }
  
  function cancelEdit(textareaElement, original) {
    // Restore original text
    const textElement = document.createElement('div');
    textElement.className = 'phrase-text';
    textElement.textContent = original;
    textareaElement.replaceWith(textElement);
  }
}

function showPhraseMenu(event, phraseObj, index) {
  // In a real app, you would show a context menu here
  // For now, we'll show a simple alert with options
  const options = [
    "Delete phrase",
    "Duplicate phrase",
    "Reset practice data",
    "Add to favorites"
  ];
  
  // Create a simple dropdown
  const menu = document.createElement('div');
  menu.className = 'phrase-menu';
  menu.style.position = 'absolute';
  menu.style.background = 'var(--bg-main)';
  menu.style.border = '1px solid var(--border)';
  menu.style.borderRadius = 'var(--radius-sm)';
  menu.style.boxShadow = 'var(--shadow)';
  menu.style.zIndex = '1000';
  menu.style.padding = '8px 0';
  
  options.forEach(option => {
    const item = document.createElement('div');
    item.className = 'phrase-menu-item';
    item.textContent = option;
    item.style.padding = '8px 16px';
    item.style.cursor = 'pointer';
    item.style.transition = 'var(--transition)';
    
    item.addEventListener('mouseenter', () => {
      item.style.background = 'var(--bg-hover)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.background = '';
    });
    
    item.addEventListener('click', () => {
      handleMenuAction(option, phraseObj, index);
      document.body.removeChild(menu);
    });
    
    menu.appendChild(item);
  });
  
  // Position menu near the button
  const rect = event.target.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY}px`;
  menu.style.right = `${window.innerWidth - rect.right}px`;
  
  // Add to body and add click-outside listener
  document.body.appendChild(menu);
  
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== event.target) {
      document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 10);
}

function handleMenuAction(action, phraseObj, index) {
  switch(action) {
    case "Delete phrase":
      if (confirm("Are you sure you want to delete this phrase?")) {
        phrases.splice(index, 1);
        localStorage.setItem("phrases", JSON.stringify(phrases));
        displayEnhancedPhrases(phrases);
        updateProgressBar();
        showToast("Phrase deleted", "info");
      }
      break;
      
    case "Duplicate phrase":
      const duplicate = {...phraseObj, id: Date.now()};
      phrases.splice(index + 1, 0, duplicate);
      localStorage.setItem("phrases", JSON.stringify(phrases));
      displayEnhancedPhrases(phrases);
      showToast("Phrase duplicated", "success");
      break;
      
    case "Reset practice data":
      phraseObj.practiced = false;
      phraseObj.practiceTime = 0;
      phraseObj.confidence = 0;
      phraseObj.lastPracticed = null;
      localStorage.setItem("phrases", JSON.stringify(phrases));
      updatePhraseCard(phraseObj.id);
      updateProgressBar();
      showToast("Practice data reset", "info");
      break;
      
    case "Add to favorites":
      phraseObj.favorite = !phraseObj.favorite;
      localStorage.setItem("phrases", JSON.stringify(phrases));
      updatePhraseCard(phraseObj.id);
      showToast(phraseObj.favorite ? "Added to favorites" : "Removed from favorites", "success");
      break;
  }
}

// --- Additional Enhanced Features ---

function handleStartPractice() {
  if (phrases.length === 0) {
    showToast("No phrases to practice. Save a script first.", "warning");
    return;
  }
  
  // Filter phrases with low confidence
  const lowConfidencePhrases = phrases.filter(p => p.confidence < 70);
  
  if (lowConfidencePhrases.length === 0) {
    showToast("All phrases have good confidence scores! Great job!", "success");
    return;
  }
  
  // Start with the lowest confidence phrase
  const sortedByConfidence = [...phrases].sort((a, b) => a.confidence - b.confidence);
  const targetPhrase = sortedByConfidence[0];
  
  // Find and highlight the phrase card
  const phraseCard = document.querySelector(`.phrase-card[data-id="${targetPhrase.id}"]`);
  if (phraseCard) {
    phraseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    phraseCard.style.boxShadow = '0 0 0 3px var(--accent)';
    
    setTimeout(() => {
      phraseCard.style.boxShadow = '';
    }, 3000);
  }
  
  // Speak the phrase
  speakFrench(targetPhrase.text);
  
  showToast(`Starting practice with lowest confidence phrase (${targetPhrase.confidence}%)`, "info");
}

function handleLoadPrevious() {
  const previousScripts = JSON.parse(localStorage.getItem("previousScripts") || "[]");
  
  if (previousScripts.length === 0) {
    showToast("No previous scripts found", "info");
    return;
  }
  
  // Show a simple selector (in a real app, you'd use a modal)
  const scriptList = previousScripts.map((script, i) => 
    `${i + 1}. ${script.substring(0, 50)}...`
  ).join('\n');
  
  const selection = prompt(`Previous scripts:\n\n${scriptList}\n\nEnter number to load:`);
  const index = parseInt(selection) - 1;
  
  if (index >= 0 && index < previousScripts.length) {
    scriptInput.value = previousScripts[index];
    charCount.textContent = previousScripts[index].length;
    showToast("Script loaded", "success");
  }
}

function handleFilterPhrases() {
  // Toggle filter state
  filterBtn.classList.toggle('active');
  
  if (filterBtn.classList.contains('active')) {
    // Show only unpracticed phrases
    const unpracticed = phrases.filter(p => !p.practiced);
    displayEnhancedPhrases(unpracticed);
    showToast(`Showing ${unpracticed.length} unpracticed phrases`, "info");
  } else {
    // Show all phrases
    displayEnhancedPhrases(phrases);
    showToast("Showing all phrases", "info");
  }
}

function handleSortPhrases() {
  // Toggle sort state
  sortBtn.classList.toggle('active');
  
  let sortedPhrases = [...phrases];
  
  if (sortBtn.classList.contains('active')) {
    // Sort by confidence (lowest first)
    sortedPhrases.sort((a, b) => a.confidence - b.confidence);
    displayEnhancedPhrases(sortedPhrases);
    showToast("Sorted by confidence (low to high)", "info");
  } else {
    // Sort by tag or original order
    sortedPhrases.sort((a, b) => a.tag.localeCompare(b.tag));
    displayEnhancedPhrases(sortedPhrases);
    showToast("Sorted by category", "info");
  }
}

// --- Utility Functions ---

function getPhraseTag(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('bonjour') || lowerText.includes('bienvenue')) {
    return "Greeting";
  } else if (lowerText.includes('question') || lowerText.includes('poser')) {
    return "Interaction";
  } else if (lowerText.includes('œuvre') || lowerText.includes('peinture') || lowerText.includes('salle')) {
    return "Description";
  } else if (lowerText.includes('commencer') || lowerText.includes('visite')) {
    return "Introduction";
  } else if (lowerText.includes('merci') || lowerText.includes('au revoir')) {
    return "Closing";
  } else {
    return "General";
  }
}

function updatePhraseCard(phraseId) {
  const phraseObj = phrases.find(p => p.id == phraseId);
  if (!phraseObj) return;
  
  const phraseCard = document.querySelector(`.phrase-card[data-id="${phraseId}"]`);
  if (!phraseCard) return;
  
  // Update confidence display
  const confidenceIcon = phraseCard.querySelector('.fa-chart-line');
  const confidenceText = phraseCard.querySelector('.phrase-meta span:nth-child(2)');
  
  // Update confidence color
  let confidenceColor = "#5dcec3";
  if (phraseObj.confidence < 50) confidenceColor = "#f56565";
  else if (phraseObj.confidence < 80) confidenceColor = "#ed8936";
  
  if (confidenceIcon) confidenceIcon.style.color = confidenceColor;
  if (confidenceText) confidenceText.innerHTML = `<i class="fas fa-chart-line" style="color: ${confidenceColor}"></i> Confidence: ${phraseObj.confidence}%`;
  
  // Update practice time
  const practiceTimeText = phraseCard.querySelector('.phrase-meta span:nth-child(1)');
  const practiceTime = phraseObj.practiceTime > 0 ? `${phraseObj.practiceTime} min` : "Not practiced";
  if (practiceTimeText) practiceTimeText.innerHTML = `<i class="far fa-clock"></i> ${practiceTime}`;
  
  // Update tag if needed
  const tagElement = phraseCard.querySelector('.phrase-tag');
  if (tagElement) tagElement.textContent = phraseObj.tag;
}

function updateProgressBar() {
  const progressFill = document.querySelector('.progress-fill');
  const progressPercent = document.querySelector('.progress-percent');
  const progressDetail = document.querySelector('.progress-detail');
  
  if (!progressFill || !progressPercent || !progressDetail) return;
  
  // Calculate practiced phrases
  const practicedPhrases = phrases.filter(p => p.practiced).length;
  currentProgress = practicedPhrases;
  localStorage.setItem("progress", currentProgress);
  
  const progressPercentage = Math.round((currentProgress / totalPhrasesGoal) * 100);
  
  // Update progress bar
  progressFill.style.width = `${progressPercentage}%`;
  progressPercent.textContent = `${progressPercentage}%`;
  progressDetail.innerHTML = `<i class="fas fa-check-circle progress-icon"></i> ${currentProgress} of ${totalPhrasesGoal} phrases practiced today`;
}

function updateConfidenceMetrics() {
  if (phrases.length === 0) return;
  
  // Calculate average confidence
  const totalConfidence = phrases.reduce((sum, p) => sum + p.confidence, 0);
  const avgConfidence = Math.round(totalConfidence / phrases.length);
  
  // You could update a confidence display element here
  console.log(`Average confidence: ${avgConfidence}%`);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showToast(message, type = "info") {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${getToastIcon(type)}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  // Style the toast
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = getToastColor(type);
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = 'var(--radius)';
  toast.style.boxShadow = 'var(--shadow)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.justifyContent = 'space-between';
  toast.style.gap = '10px';
  toast.style.zIndex = '10000';
  toast.style.maxWidth = '350px';
  toast.style.animation = 'toastSlideIn 0.3s ease';
  
  // Close button
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'white';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '1.2rem';
  closeBtn.style.padding = '0';
  
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });
  
  // Add to document
  document.body.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'toastSlideOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }
  }, 4000);
  
  // Add CSS animations
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes toastSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

function getToastIcon(type) {
  switch(type) {
    case 'success': return 'fa-check-circle';
    case 'warning': return 'fa-exclamation-triangle';
    case 'error': return 'fa-times-circle';
    default: return 'fa-info-circle';
  }
}

function getToastColor(type) {
  switch(type) {
    case 'success': return '#38a169';
    case 'warning': return '#d69e2e';
    case 'error': return '#e53e3e';
    default: return '#4a6cf7';
  }
}

// Export for debugging (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    splitIntoPhrases,
    speakFrench,
    displayEnhancedPhrases
  };
}
