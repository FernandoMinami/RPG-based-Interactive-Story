export let historyLog = [];

// updates the history panel with the current history log and adds the ability to toggle battle logs in the history panel
function updateHistoryPanel() {
  const panel = document.getElementById("history-panel");
  panel.innerHTML = "";
  historyLog.forEach((entry, idx) => {
    // Battle log group
    if (entry.battle) {
      const div = document.createElement("div");
      div.style.margin = "8px 0";
      div.innerHTML = `<strong>Encountered ${entry.enemy} - ${entry.summary}</strong> `;
      const btn = document.createElement("button");
      btn.textContent = entry.show ? "Hide Battle Log" : "Show Battle Log";
      btn.onclick = () => {
        entry.show = !entry.show;
        updateHistoryPanel();
      };
      div.appendChild(btn);
      if (entry.show) {
        const logDiv = document.createElement("div");
        logDiv.style.fontSize = "75%";
        entry.log.forEach(line => {
          const l = document.createElement("div");
          l.textContent = line;
          logDiv.appendChild(l);
        });
        div.appendChild(logDiv);
      }
      panel.appendChild(div);
    } else if (entry.action) {
      const act = document.createElement("div");
      act.innerHTML = `<span style="color:#888;">${entry.action}</span>`;
      panel.appendChild(act);
    } else {
      const title = entry.title ? `<strong>${entry.title}</strong><br>` : "";
      const effect = entry.effect ? entry.effect : "";
      const text = entry.text ? `<span>${entry.text}</span>` : "";
      const div = document.createElement("div");
      div.innerHTML = title + effect + text;
      panel.appendChild(div);
    }
  });
}

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



export { updateHistoryPanel };