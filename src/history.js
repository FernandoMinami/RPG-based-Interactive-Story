export let historyLog = [];

// Make historyLog available globally for items
window.historyLog = historyLog;

// Helper function to construct image source path
function getImageSrc(imgPath) {
  if (!imgPath) return '';
  
  // If it's already a web URL, return as is
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:')) {
    return imgPath;
  }
  
  // Construct path relative to scenarios img folder
  const selectedStory = window.selectedStory;
  if (selectedStory) {
    return `../story-content/${selectedStory.folder.replace('./', '')}/img/scenarios/${imgPath}`;
  }
  
  return imgPath; // Fallback
}

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
        
        // Check if this is new format with action objects
        if (entry.isNewFormat && entry.log.length > 0 && entry.log[0].roundNumber !== undefined) {
          // New format: display round objects with action data and image support
          entry.log.forEach((round, roundIndex) => {
            if (round.actions && round.actions.length > 0) {
              content += `<div style="margin: 5px 0; padding: 3px; border-left: 2px solid #ccc;">`;
              content += `<div style="font-weight: bold; font-size: 0.9em; color: #666;">Round ${round.roundNumber || roundIndex + 1}:</div>`;
              
              round.actions.forEach(action => {
                content += `<div style="margin: 3px 0 3px 15px; padding: 2px; background-color: rgba(0,0,0,0.05);">`;
                content += `<div style="font-weight: bold; color: #444; margin-bottom: 2px;">${action.actor} used ${action.actionName} on ${action.target}`;
                
                // Add ability image button if ability has an image
                if (action.ability && action.ability.img) {
                  const imageSrc = window.getAbilityImageSrc ? window.getAbilityImageSrc(action.ability.img) : action.ability.img;
                  content += ` <button class="history-image-btn" onclick="showAbilityImageModal('${imageSrc}', '${action.ability.name || action.actionName}')">Show Attack Image</button>`;
                }
                
                content += `</div>`;
                
                // Show action messages
                if (action.messages && action.messages.length > 0) {
                  action.messages.forEach(msg => {
                    content += `<div style="margin: 1px 0 1px 10px; font-size: 0.9em;">${msg}</div>`;
                  });
                }
                content += `</div>`;
              });
              
              content += `</div>`;
            }
          });
        } else if (entry.log.length > 0 && Array.isArray(entry.log[0])) {
          // Old format: Round-based grouping - each array is a round or turn
          entry.log.forEach((roundMessages, roundIndex) => {
            if (roundMessages.length > 0) {
              content += `<div style="margin: 5px 0; padding: 3px; border-left: 2px solid #ccc;">`;
              content += `<div style="font-weight: bold; font-size: 0.9em; color: #666;">Round ${roundIndex + 1}:</div>`;
              
              // Group messages by action (look for actor patterns)
              let currentAction = null;
              let actionMessages = [];
              
              roundMessages.forEach(message => {
                // Check if this message starts a new action (contains "used" pattern)
                const actionMatch = message.match(/^(.+?) used (.+?) on (.+?)$/);
                if (actionMatch) {
                  // If we have a previous action, display it
                  if (currentAction) {
                    content += `<div style="margin: 3px 0 3px 15px; padding: 2px; background-color: rgba(0,0,0,0.05);">`;
                    content += `<div style="font-weight: bold; color: #444; margin-bottom: 2px;">${currentAction}</div>`;
                    actionMessages.forEach(msg => {
                      content += `<div style="margin: 1px 0 1px 10px; font-size: 0.9em;">${msg}</div>`;
                    });
                    content += `</div>`;
                  }
                  
                  // Start new action
                  currentAction = message;
                  actionMessages = [];
                } else {
                  // This is a follow-up message for the current action
                  if (currentAction) {
                    actionMessages.push(message);
                  } else {
                    // Standalone message (not part of an action)
                    content += `<p style="margin: 2px 0 2px 15px; font-style: italic; color: #888;">${message}</p>`;
                  }
                }
              });
              
              // Don't forget to display the last action if there is one
              if (currentAction) {
                content += `<div style="margin: 3px 0 3px 15px; padding: 2px; background-color: rgba(0,0,0,0.05);">`;
                content += `<div style="font-weight: bold; color: #444; margin-bottom: 2px;">${currentAction}</div>`;
                actionMessages.forEach(msg => {
                  content += `<div style="margin: 1px 0 1px 10px; font-size: 0.9em;">${msg}</div>`;
                });
                content += `</div>`;
              }
              
              content += `</div>`;
            }
          });
        } else {
          // Fallback for old flat structure or direct strings
          entry.log.forEach(line => {
            const displayText = typeof line === 'string' ? line : 
                              (line.summary || line.message || String(line));
            content += `<div>${displayText}</div>`;
          });
        }
        content += `</div>`;
      }
      content += `</div>`;
    } else if (entry.action) {
      content += `<div><span style="color:#888;">${entry.action}</span></div>`;
    } else {
      const title = entry.title ? `<strong>${entry.title}</strong>` : "";
      const imageButton = entry.img ? `<button class="history-image-btn" onclick="showNodeImageModal('${getImageSrc(entry.img)}', '${entry.title || 'Scene Image'}')">Show Node Image</button>` : "";
      const titleWithButton = title + imageButton;
      const effect = entry.effect ? entry.effect : "";
      const text = entry.text ? `<span>${entry.text}</span>` : "";
      content += `<div>${titleWithButton}${titleWithButton ? '<br>' : ''}${effect}${text}</div>`;
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
  // Check if logArr is the new format (array of round objects) or old format (flat array)
  let processedLog;
  
  if (logArr.length > 0 && logArr[0].roundNumber !== undefined) {
    // New format: preserve the round objects with action data for image support
    processedLog = logArr;
  } else {
    // Old format: try to handle both object arrays and string arrays
    processedLog = logArr.map(turn => {
      if (typeof turn === 'object' && turn.messages) {
        // Object with messages array
        return [turn.summary, ...turn.messages];
      } else if (typeof turn === 'object' && turn.summary) {
        // Object with just summary
        return [turn.summary];
      } else if (typeof turn === 'string') {
        // Direct string
        return [turn];
      } else {
        // Fallback for unknown format
        return [String(turn)];
      }
    });
  }

  historyLog.push({
    battle: true,
    enemy: enemyName,
    log: processedLog,
    summary,
    show: false,
    isNewFormat: logArr.length > 0 && logArr[0].roundNumber !== undefined // Flag to identify new format
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
