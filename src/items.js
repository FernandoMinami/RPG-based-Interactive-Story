import { updateManaBar, updateCharacterUI } from './ui.js';
import { historyLog } from './history.js';
import { updateSecondaryStats } from './character.js';


export let items = {};

// Debug access to items
window._debugItems = items;

export async function loadItems(storyFolder) {
  // Clear the existing items object
  Object.keys(items).forEach(k => delete items[k]);

  //console.log(`Loading items for story: ${storyFolder}`);

  const manifestUrl = `../story-content/${storyFolder}/items/_items.json?v=${Date.now()}`;
  const itemList = await fetch(manifestUrl).then(r => r.json());
  
  //console.log('📜 Raw manifest data:', itemList);
  //console.log('📊 Manifest keys:', Object.keys(itemList));
  
  const totalItems = Object.keys(itemList).length;
  let loadedCount = 0;
  let failedCount = 0;

  for (const [id, itemInfo] of Object.entries(itemList)) {
    let itemId = id.toLowerCase();
    if (itemInfo.file) {
      try {
        const itemModule = await import(`../story-content/${storyFolder}/${itemInfo.file}?v=${Date.now()}`);
        itemId = (itemModule.item.id || id).toLowerCase();
        items[itemId] = itemModule.item;
        //console.log(`✅ Loaded item: ${itemId}`);
        loadedCount++;
      } catch (error) {
        //console.error(`❌ Failed to load item ${id} from ${itemInfo.file}:`, error);
        failedCount++;
      }
    } else {
      items[itemId] = itemInfo;
      //console.log(`✅ Loaded item (inline): ${itemId}`);
      loadedCount++;
    }
  }
  
  //console.log(`📦 Item loading complete: ${loadedCount}/${totalItems} successful, ${failedCount} failed`);
  //console.log('📋 Available items:', Object.keys(items));
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
      if (attr === "physicDefense" || attr === "magicDefense") {
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
      if (attr === "physicDefense" || attr === "magicDefense") {
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