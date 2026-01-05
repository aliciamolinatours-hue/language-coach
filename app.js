const saveButton = document.getElementById("saveScriptBtn");
const scriptInput = document.getElementById("scriptInput");

// Load saved script when page opens
const savedScript = localStorage.getItem("script");
if (savedScript) {
  scriptInput.value = savedScript;
}

// Save script when button is clicked
saveButton.addEventListener("click", () => {
  const scriptText = scriptInput.value;

  if (scriptText.trim() === "") {
    alert("Please paste a script first.");
    return;
  }

  localStorage.setItem("script", scriptText);
  alert("Script saved locally!");
});
