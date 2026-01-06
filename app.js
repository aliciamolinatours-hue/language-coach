// Confidence Coach Language Learning App

// Global variables
let availableVoices = [];
let phrases = [];
let currentProgress = 0;
const totalPhrasesGoal = 12;
let breathingAnimation = null;

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
const startPracticeBtn = document.querySelector('.start-practice-btn');
const importBtn = document.querySelector('.btn-outline');
const filterBtn = document.querySelector('.filter-btn');
const sortBtn = document.querySelector('.sort-btn');
const intentionBtn = document.querySelector('.intention-btn');
const breathCircle = document.querySelector('.breath-circle');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
  startBreathingAnimation();
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
    filterBtn.addEventListener("click", handleFilterPhrases);
  }
  
  if (sortBtn) {
    sortBtn.addEventListener("click", handleSortPhrases);
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
        confidence: Math.floor(Math.random() * 40), // Random initial confidence
        lastPracticed: null,
        favorite: false,
        createdAt: new Date().toISOString()
      };
    });
    
    // Save to localStorage
    localStorage.setItem("script", scriptText);
    localStorage.setItem("phrases", JSON.stringify(phrases));
    
    // Update UI
    displayEnhancedPhrases(phrases);
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
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  // Find French voice
  const frenchVoice = availableVoices.find(
    v => v.lang === "fr-FR" || v.lang.startsWith("fr")
  );
  
  if (frenchVoice) {
    utterance.voice = frenchVoice;
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
    phrasesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-feather"></i>
        </div>
        <div class="empty-text">No phrases yet. Paste and save a script to begin.</div>
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
    <div class="phrase-content">
      <div class="phrase-text">${phraseObj.text}</div>
      <div class="phrase-meta">
        <span class="meta-item"><i class="far fa-clock"></i> ${practiceTimeText}</span>
        <span class="meta-item"><i class="fas fa-wave-square" style="color: ${confidenceColor}"></i> ${phraseObj.confidence}%</span>
        <span class="phrase-tag">${phraseObj.tag}</span>
      </div>
    </div>
    <div class="phrase-actions">
      <button class="phrase-btn play-btn" title="Play phrase">
        <i class="fas fa-play"></i>
      </button>
      <button class="phrase-btn check-btn" title="${phraseObj.practiced ? 'Mark as not practiced' : 'Mark as practiced'}">
        <i class="${phraseObj.practiced ? 'fas' : 'far'} fa-check-circle"></i>
      </button>
    </div>
  `;
  
  // Add event listeners
  const playBtn = phraseCard.querySelector('.play-btn');
  const checkBtn = phraseCard.querySelector('.check-btn');
  
  playBtn.addEventListener('click', () => {
    handlePlayPhrase(phraseObj, playBtn);
  });
  
  checkBtn.addEventListener('click', () => {
    handlePracticePhrase(phraseObj, checkBtn, index);
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
      phraseObj.lastPracticed = new Date().toISOString();
      
      // Increase confidence
      if (phraseObj.confidence < 100) {
        phraseObj.confidence = Math.min(phraseObj.confidence + 10, 100);
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

function handleFilterPhrases() {
  filterBtn.classList.toggle('active');
  
  if (filterBtn.classList.contains('active')) {
    // Filter to show only unpracticed phrases
    const unpracticed = phrases.filter(p => !p.practiced);
    displayEnhancedPhrases(unpracticed);
    showToast(`Showing ${unpracticed.length} unpracticed phrases`, "info");
    filterBtn.style.background = 'var(--primary)';
    filterBtn.style.color = 'white';
  } else {
    // Show all phrases
    displayEnhancedPhrases(phrases);
    showToast("Showing all phrases", "info");
    filterBtn.style.background = '';
    filterBtn.style.color = '';
  }
}

function handleSortPhrases() {
  sortBtn.classList.toggle('active');
  
  let sortedPhrases = [...phrases];
  
  if (sortBtn.classList.contains('active')) {
    // Sort by confidence (lowest first)
    sortedPhrases.sort((a, b) => a.confidence - b.confidence);
    sortBtn.innerHTML = '<i class="fas fa-sort-amount-up"></i>';
    showToast("Sorted by confidence (low to high)", "info");
  } else {
    // Sort by creation date (newest first)
    sortedPhrases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sortBtn.innerHTML = '<i class="fas fa-sort-amount-down"></i>';
    showToast("Sorted by recent", "info");
  }
  
  displayEnhancedPhrases(sortedPhrases);
  sortBtn.style.transform = 'rotate(180deg)';
  setTimeout(() => {
    sortBtn.style.transform = '';
  }, 300);
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
