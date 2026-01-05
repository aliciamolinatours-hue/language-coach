const saveButton = document.getElementById("saveScriptBtn");
const scriptInput = document.getElementById("scriptInput");
const phrasesContainer = document.getElementById("phrasesContainer");

// Load saved script on page load
const savedScript = localStorage.getItem("script");
if (savedScript) {
  scriptInput.value = savedScript;
  displayPhrases(savedScript);
}

// Save & split script
saveButton.addEventListener("click", () => {
  const scriptText = scriptInput.value;

  if (scriptText.trim() === "") {
    alert("Please paste a script first.");
    return;
  }

  localStorage.setItem("script", scriptText);
  displayPhrases(scriptText);
});

// Function to split and display phrases
function displayPhrases(text) {
  phrasesContainer.innerHTML = ""; // clear previous phrases

  const phrases = text
    .split("\n")
    .map(p => p.trim())
    .filter(p => p !== "");

  phrases.forEach((phrase, index) => {
    const phraseDiv = document.createElement("div");
    phraseDiv.className = "phrase";
    phraseDiv.textContent = `${index + 1}. ${phrase}`;
    phrasesContainer.appendChild(phraseDiv);
  });
}
