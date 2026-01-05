let availableVoices = [];

speechSynthesis.onvoiceschanged = () => {
  availableVoices = speechSynthesis.getVoices();
};


const saveButton = document.getElementById("saveScriptBtn");
const scriptInput = document.getElementById("scriptInput");
const phrasesContainer = document.getElementById("phrasesContainer");

// Load saved phrases or script on page load
const savedPhrases = JSON.parse(localStorage.getItem("phrases"));
const savedScript = localStorage.getItem("script");

if (savedPhrases && savedPhrases.length > 0) {
  displayEditablePhrases(savedPhrases);
} else if (savedScript) {
  scriptInput.value = savedScript;
  const phrases = splitIntoPhrases(savedScript);
  displayEditablePhrases(phrases);
}

// Save & split script
saveButton.addEventListener("click", () => {
  const scriptText = scriptInput.value;

  if (scriptText.trim() === "") {
    alert("Please paste a script first.");
    return;
  }

  const phrases = splitIntoPhrases(scriptText);
  localStorage.setItem("script", scriptText);
  localStorage.setItem("phrases", JSON.stringify(phrases));
  displayEditablePhrases(phrases);
});

// --- Helper functions ---

function splitIntoPhrases(text) {
  return text
    .split("\n")
    .map(p => p.trim())
    .filter(p => p !== "");
}

function displayEditablePhrases(phrases) {
  phrasesContainer.innerHTML = "";

  phrases.forEach((phrase, index) => {
    const phraseWrapper = document.createElement("div");
    phraseWrapper.className = "phrase";

    const playButton = document.createElement("button");
    playButton.textContent = "▶️";
    playButton.title = "Play phrase";

    playButton.addEventListener("click", () => {
      speakFrench(phrases[index]);
    });

    const textarea = document.createElement("textarea");
    textarea.value = phrase;
    textarea.rows = 2;

    textarea.addEventListener("change", () => {
      phrases[index] = textarea.value;
      localStorage.setItem("phrases", JSON.stringify(phrases));
    });

    phraseWrapper.appendChild(playButton);
    phraseWrapper.appendChild(textarea);
    phrasesContainer.appendChild(phraseWrapper);
  });
}

function speakFrench(text) {
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.9;

  const frenchVoice = availableVoices.find(
    v => v.lang === "fr-FR" || v.lang.startsWith("fr")
  );

  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }

  speechSynthesis.cancel(); // stop any previous speech
  speechSynthesis.speak(utterance);
}

