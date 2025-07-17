import { updateManaBar, updateCharacterUI } from './ui.js';
import { historyLog } from './history.js';
import { updateSecondaryStats } from './character.js';


export let items = {};

export async function loadItems(storyFolder) {
  // Clear the existing items object
  Object.keys(items).forEach(k => delete items[k]);



  const manifestUrl = `../story-content/${storyFolder}/items/_items.json`;
  const itemList = await fetch(manifestUrl).then(r => r.json());

  for (const [id, itemInfo] of Object.entries(itemList)) {
    let itemId = id.toLowerCase();
    if (itemInfo.file) {
      const itemModule = await import(`../story-content/${storyFolder}/${itemInfo.file}?v=${Date.now()}`);
      itemId = (itemModule.item.id || id).toLowerCase();
      items[itemId] = itemModule.item;
    } else {
      items[itemId] = itemInfo;
    }
  }
}

export function equipableItems(player, item) {
  // Unequip any item in this slot first
  const current = player.equipment[item.slot];
  if (current && current !== item) {
    // Remove base attribute modifiers of currently equipped item
    for (const [attr, mod] of Object.entries(current.modifiers)) {
      if (player.attributes[attr] !== undefined) {
        player.attributes[attr] -= mod;
      }
    }
    current.equipped = false;
  }

  if (!item.equipped) {
    // Equip: apply base attribute modifiers only
    for (const [attr, mod] of Object.entries(item.modifiers)) {
      if (player.attributes[attr] !== undefined) {
        player.attributes[attr] += mod;
      }
    }
    item.equipped = true;
    player.equipment[item.slot] = item;
  } else {
    // Unequip: remove base attribute modifiers only
    for (const [attr, mod] of Object.entries(item.modifiers)) {
      if (player.attributes[attr] !== undefined) {
        player.attributes[attr] -= mod;
      }
    }
    item.equipped = false;
    player.equipment[item.slot] = null;
  }
  
  // Recalculate secondary stats after equipment change
  // This will calculate physicalDefense and magicDefense from equipped items
  updateSecondaryStats(player);
  updateCharacterUI();
  return true;
}