export let inventory = {};

window._debugInventory = inventory;
window._debugAddItem = addItem;

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
}