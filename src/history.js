export let historyLog = [];

// Make historyLog available globally for items
window.historyLog = historyLog;

// updates the history panel with the current history log and adds the ability to toggle battle logs in the history panel
function updateHistoryPanel() {
  const panel = document.getElementById("history-panel");
  const storyPanel = document.getElementById("history-panel-story");
  
  // Create the history content
  const historyContent = createHistoryContent();
  
  // Update original panel
  if (panel) {
    panel.innerHTML = historyContent;
  }
  
  // Update story layout panel if it exists and is visible
  if (storyPanel) {
    storyPanel.innerHTML = historyContent;
  }
}

function createHistoryContent() {
  let content = "";
  historyLog.forEach((entry, idx) => {
    // Battle log group
    if (entry.battle) {
      content += `<div style="margin: 8px 0;">
        <strong>Encountered ${entry.enemy} - ${entry.summary}</strong> 
        <button onclick="window.toggleBattleLog(${idx})">${entry.show ? "Hide Battle Log" : "Show Battle Log"}</button>`;
      
      if (entry.show) {
        content += `<div style="font-size: 75%;">`;
        
        // Check if log is grouped by turns (array of arrays) or flat (array of strings)
        if (entry.log.length > 0 && Array.isArray(entry.log[0])) {
          // Turn-based grouping
          entry.log.forEach(turnMessages => {
            content += `<div>`;
            turnMessages.forEach(message => {
              content += `<p style="margin: 2px 0;">${message}</p>`;
            });
            content += `</div>`;
          });
        } else {
          // Fallback for old flat structure
          entry.log.forEach(line => {
            content += `<div>${line}</div>`;
          });
        }
        content += `</div>`;
      }
      content += `</div>`;
    } else if (entry.action) {
      content += `<div><span style="color:#888;">${entry.action}</span></div>`;
    } else {
      const title = entry.title ? `<strong>${entry.title}</strong><br>` : "";
      const effect = entry.effect ? entry.effect : "";
      const text = entry.text ? `<span>${entry.text}</span>` : "";
      content += `<div>${title}${effect}${text}</div>`;
    }
  });
  
  return content;
}

// Global function to toggle battle logs
window.toggleBattleLog = function(idx) {
  if (historyLog[idx]) {
    historyLog[idx].show = !historyLog[idx].show;
    updateHistoryPanel();
  }
};

// Add a new action to the history log
window.addBattleToHistory = function (enemyName, logArr, summary) {
  historyLog.push({
    battle: true,
    enemy: enemyName,
    summary: summary,
    log: logArr, // full grouped logs
    show: false
  });
  updateHistoryPanel();
};

// Restore history log from save data
export function restoreHistoryLog(savedHistory) {
  historyLog.length = 0;
  historyLog.push(...savedHistory);
  window.historyLog = historyLog;
}

export { updateHistoryPanel };