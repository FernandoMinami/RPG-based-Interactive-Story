// status manager of the game battle.

    // Status reset (when the battle ends)
        //resets all the stats


    // Status update
        // Check if there is status
        // If yes Status count down (Each battle turn reduces status duration by 1)


import * as burn from './burn.js';
import * as stun from './stun.js';
import * as pin from './pin.js';
import * as freeze from './freeze.js';

const statusHandlers = {
  burn,
  stun,
  pin,
  freeze
};

export function applyStatus(target, type, turns = 1) {
  target.status = target.status || {};
  target.status[type] = turns;
}

export function updateStatuses(target, addLog) {
  if (!target.status) return;

  for (const [type, turns] of Object.entries(target.status)) {
    const handler = statusHandlers[type];
    if (handler && handler.resolve) {
      handler.resolve(target, addLog);
    }

    // Decrement turn and remove if done
    target.status[type] = Math.max(0, turns - 1);
    if (target.status[type] === 0) {
      delete target.status[type];
      if (handler && handler.remove) {
        handler.remove(target, addLog);
      }
    }
  }
}

export function statusSummary(target) {
  if (!target.status) return '';
  return Object.keys(target.status)
    .map(s => `<span style="color:${statusHandlers[s].color}">(${statusHandlers[s].label})</span>`)
    .join(' ');
}
