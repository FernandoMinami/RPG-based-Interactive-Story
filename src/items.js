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

export function equipableItems() {
  // Unequip any item in this slot first
  const current = player.equipment[this.slot];
  if (current && current !== this) {
    // Remove modifiers of currently equipped item
    for (const [attr, mod] of Object.entries(current.modifiers)) {
      if (player.attributes[attr] !== undefined) {
        player.attributes[attr] -= mod;
      }
    }
    current.equipped = false;
  }

  if (!this.equipped) {
    // Equip: apply modifiers
    for (const [attr, mod] of Object.entries(this.modifiers)) {
      if (player.attributes[attr] !== undefined) {
        player.attributes[attr] += mod;
      }
      if (attr === "physicalDefense" || attr === "magicDefense") {
        player.secondary[attr] += mod; // Update secondary stats
      }
    }
    this.equipped = true;
    player.equipment[this.slot] = this;
    return true;
  } else {
    // Unequip: remove modifiers
    for (const [attr, mod] of Object.entries(this.modifiers)) {
      if (player.attributes[attr] !== undefined) {
        player.attributes[attr] -= mod;
      }
      if (attr === "physicalDefense" || attr === "magicDefense") {
        player.secondary[attr] -= mod; // Update secondary stats
      }
    }
    this.equipped = false;
    player.equipment[this.slot] = null;
    return true;
  }
  updateInventoryBar();
  updateStoryUI();
}

/*export function manaPotion() {
  const manaRestored = item.restore;
  if (player.mana < player.maxMana) {
    player.mana = Math.min(player.maxMana, player.mana + manaRestored);
    return true; // Consumed
    updateInventoryBar();
    updateStoryUI();
  }
  return false; // Not consumed (already at max MP)
  updateInventoryBar();
  updateStoryUI();
}

export function healthPotion(player, restore) {
  const restored = restore;
  if (player.life < player.maxLife) {
    player.life = Math.min(player.maxLife, player.life + restored);
    return true; // Consumed
    updateInventoryBar();
    updateStoryUI();
  }
  return false; // Not consumed (already at max life)
  updateInventoryBar();
  updateStoryUI();
}*/