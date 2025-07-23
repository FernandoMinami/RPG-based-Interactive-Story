export let inventory = {};
export let lootInventory = {}; // Separate inventory for sellable monster parts
export let playerMoney = 0; // Player's currency

window._debugInventory = inventory;
window._debugLootInventory = lootInventory;
window._debugPlayerMoney = () => playerMoney;
window._debugAddItem = addItem;
window._debugAddLoot = addLoot;

// Inventory management functions

// Adds an item to the inventory, increasing its count
export function addItem(itemId, amount = 1) {
  if (!itemId) return;
  inventory[itemId] = (inventory[itemId] || 0) + amount;
}

// Removes an item from the inventory, decreasing its count
export function removeItem(itemId, amount = 1) {
  if (!itemId || !inventory[itemId]) return;
  inventory[itemId] -= amount;
  if (inventory[itemId] <= 0) delete inventory[itemId];
}

// Checks if an item exists in the inventory
export function hasItem(itemId) {
  return !!inventory[itemId];
}

// gets the whole inventory object
export function getInventory() {
  return { ...inventory };
}

// Resets the inventory, clearing all items
export function resetInventory() {
  inventory = {};
  lootInventory = {};
  playerMoney = 0;
}

// === LOOT INVENTORY FUNCTIONS ===

// Adds a loot item to the loot inventory
export function addLoot(itemId, amount = 1) {
  if (!itemId) return;
  lootInventory[itemId] = (lootInventory[itemId] || 0) + amount;
}

// Removes a loot item from the loot inventory
export function removeLoot(itemId, amount = 1) {
  if (!itemId || !lootInventory[itemId]) return;
  lootInventory[itemId] -= amount;
  if (lootInventory[itemId] <= 0) delete lootInventory[itemId];
}

// Checks if a loot item exists in the loot inventory
export function hasLoot(itemId) {
  return !!lootInventory[itemId];
}

// Gets the whole loot inventory object
export function getLootInventory() {
  return { ...lootInventory };
}

// === MONEY FUNCTIONS ===

// Adds money to the player
export function addMoney(amount) {
  playerMoney += amount;
}

// Removes money from the player (returns false if insufficient funds)
export function removeMoney(amount) {
  if (playerMoney >= amount) {
    playerMoney -= amount;
    return true;
  }
  return false;
}

// Gets the player's current money
export function getMoney() {
  return playerMoney;
}

// Sets the player's money to a specific amount
export function setMoney(amount) {
  playerMoney = Math.max(0, amount); // Ensure money is never negative
}

// Checks if player has enough money
export function hasMoney(amount) {
  return playerMoney >= amount;
}

// === SAVE/LOAD FUNCTIONS ===

// Get current inventory state for saving
export function getInventoryState() {
  return {
    items: { ...inventory },
    loot: { ...lootInventory },
    money: playerMoney
  };
}

// Restore inventory state from save data
export function restoreInventory(inventoryData) {
  // Clear current inventory
  Object.keys(inventory).forEach(key => delete inventory[key]);
  Object.keys(lootInventory).forEach(key => delete lootInventory[key]);
  
  // Restore inventory data
  Object.assign(inventory, inventoryData.items || {});
  Object.assign(lootInventory, inventoryData.loot || {});
  playerMoney = inventoryData.money || 0;
  
  // Update global references
  window.inventory = inventory;
  window.lootInventory = lootInventory;
}