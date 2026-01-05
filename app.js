const saveButton = document.getElementById("saveScriptBtn");
const scriptInput = document.getElementById("scriptInput");

saveButton.addEventListener("click", () => {
  const scriptText = scriptInput.value;

  if (scriptText.trim() === "") {
    alert("Please paste a script first.");
    return;
  }

  alert("Script saved! (for now just in memory)");
});
