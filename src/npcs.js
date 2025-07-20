/**
 * NPC system for managing NPCs including merchants, quest givers, etc.
 */

let npcManifest = [];
let loadedNpcs = {};

// Helper functions for accordion state management
/**
 * Save the current state of all accordion sections
 * @returns {Object} Object with accordion IDs as keys and open/closed state as values
 */
function saveAccordionStates() {
  const states = {};
  const accordionContents = document.querySelectorAll('.accordion-content');
  accordionContents.forEach(content => {
    const categoryKey = content.id.replace('content-', '');
    states[categoryKey] = content.classList.contains('active');
  });
  return states;
}

/**
 * Restore accordion states from saved state object
 * @param {Object} states - Object with accordion IDs as keys and open/closed state as values
 */
function restoreAccordionStates(states) {
  Object.entries(states).forEach(([categoryKey, isOpen]) => {
    const content = document.getElementById('content-' + categoryKey);
    const arrow = document.getElementById('arrow-' + categoryKey);
    if (content && arrow) {
      const header = arrow.parentElement;
      if (isOpen) {
        content.classList.add('active');
        arrow.classList.add('active');
        header.classList.add('active');
      } else {
        content.classList.remove('active');
        arrow.classList.remove('active');
        header.classList.remove('active');
      }
    }
  });
}

/**
 * Load NPC manifest for a story
 * @param {string} storyFolder - The story folder path
 */
export async function loadNpcs(storyFolder) {
  try {
    const manifestUrl = `../story-content/${storyFolder}/npcs/_npcs.json?v=${Date.now()}`;
    npcManifest = await fetch(manifestUrl).then(r => r.json());
    //console.log("Loaded NPC manifest:", npcManifest);
  } catch (error) {
    console.warn("No NPC manifest found for story:", storyFolder);
    npcManifest = [];
  }
}

/**
 * Get an NPC by ID, loading it if necessary
 * @param {string} npcId - The NPC ID
 * @param {string} storyFolder - The story folder path
 * @returns {Object} The NPC object
 */
export async function getNpcById(npcId, storyFolder) {
  if (loadedNpcs[npcId]) {
    return loadedNpcs[npcId];
  }
  
  const npcInfo = npcManifest.find(npc => npc.id === npcId);
  if (!npcInfo) {
    console.error("NPC not found in manifest:", npcId);
    return null;
  }
  
  try {
    const npcModule = await import(`../story-content/${storyFolder}/npcs/${npcInfo.file}?v=${Date.now()}`);
    loadedNpcs[npcId] = npcModule.npc;
    return npcModule.npc;
  } catch (error) {
    console.error("Failed to load NPC:", npcId, error);
    return null;
  }
}

/**
 * Show NPC interaction interface
 * @param {string} npcId - The NPC ID
 * @param {string} storyFolder - The story folder path
 * @param {Object} player - The player object
 */
export async function showNpcInterface(npcId, storyFolder, player) {
  const npc = await getNpcById(npcId, storyFolder);
  if (!npc) {
    console.error("Could not load NPC:", npcId);
    return;
  }
  
  if (npc.type === "merchant") {
    showMerchantNpcInterface(npc, player);
  } else {
    // Future: handle quest NPCs, info NPCs, etc.
    console.log("NPC type not yet implemented:", npc.type);
  }
}

/**
 * Show merchant NPC interface with buying options
 * @param {Object} npc - The merchant NPC object
 * @param {Object} player - The player object
 */
function showMerchantNpcInterface(npc, player) {
  const modal = document.getElementById("inventory-modal");
  const title = modal.querySelector("h2");
  const content = modal.querySelector(".modal-content > div");
  
  title.textContent = `Buy from ${npc.name}`;
  
  import('./inventory.js').then(({ addItem, getMoney, removeMoney }) => {
    import('./items.js').then(({ items }) => {
      let html = `
        <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
          <div style="font-style: italic; color: #666;">"${npc.dialogue.greeting}"</div>
        </div>
        
        <div style="margin-bottom: 15px; text-align: center; font-weight: bold; color: gold;">
          Your Gold: ${getMoney()}
        </div>
      `;
      
      // Group items by category
      const categories = {
        consumables: [],
        equipment: [],
        scrolls: []
      };
      
      Object.entries(npc.inventory).forEach(([itemId, itemData]) => {
        const item = items[itemId];
        if (!item) return;
        
        if (item.type === "equipable") {
          categories.equipment.push({ id: itemId, item, ...itemData });
        } else if (itemId.includes("scroll")) {
          categories.scrolls.push({ id: itemId, item, ...itemData });
        } else {
          categories.consumables.push({ id: itemId, item, ...itemData });
        }
      });
      
      // Helper function to create accordion section for buying
      const createBuyAccordionSection = (title, items, categoryKey) => {
        const hasItems = items.length > 0;
        const itemCount = hasItems ? items.length : 0;
        
        html += `
          <div class="accordion-header" onclick="toggleAccordion('buy-${categoryKey}')">
            <span>${title} ${hasItems ? `(${itemCount})` : '(0)'}</span>
            <span class="accordion-arrow" id="arrow-buy-${categoryKey}">▶</span>
          </div>
          <div class="accordion-content" id="content-buy-${categoryKey}">
        `;
        
        if (hasItems) {
          items.forEach(({ id, item, price, stock }) => {
            const canAfford = getMoney() >= price;
            const inStock = stock === -1 || stock > 0;
            const canBuy = canAfford && inStock;
            
            let stockText = stock === -1 ? "∞" : stock.toString();
            if (stock === 0) stockText = "Out of Stock";
            
            html += `
              <div class="item-row">
                <div>
                  <strong>${item.name}</strong><br>
                  <small style="color: #666;">${item.description || ''}</small><br>
                  <small style="color: #888;">Stock: ${stockText}</small><br>
                  <small style="color: gold; font-weight: bold;">${price} gold</small>
                </div>
                <button 
                  onclick="buyFromNpc('${npc.id}', '${id}', ${price})" 
                  ${!canBuy ? 'disabled' : ''}
                  style="background: ${canBuy ? '#28a745' : '#6c757d'}; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: ${canBuy ? 'pointer' : 'not-allowed'};">
                  Buy
                </button>
              </div>
            `;
          });
        } else {
          html += `<div class="item-row"><span style="color: #666;">No items available in this category</span></div>`;
        }
        
        html += "</div>";
      };
      
      // Create accordion sections
      createBuyAccordionSection("Consumables", categories.consumables, "consumables");
      createBuyAccordionSection("Equipment", categories.equipment, "equipment");
      createBuyAccordionSection("Scrolls & Magic Items", categories.scrolls, "scrolls");
      
      // Add close and sell buttons
      html += `
        <div style="text-align: center; margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <button onclick="closeMerchantNpc()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 3px;">
            Leave ${npc.name}
          </button>
          <button onclick="showItemSellModal('${npc.name}')" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 3px;">
            Sell to ${npc.name}
          </button>
        </div>
      `;
      
      content.innerHTML = html;
      modal.style.display = "block";
    });
  });
}

/**
 * Handle buying an item from an NPC merchant
 * @param {string} npcId - The NPC ID
 * @param {string} itemId - The item ID to buy
 * @param {number} price - The item price
 */
window.buyFromNpc = function(npcId, itemId, price) {
  import('./inventory.js').then(({ addItem, getMoney, removeMoney }) => {
    const currentMoney = getMoney();
    
    if (currentMoney < price) {
      const npc = loadedNpcs[npcId];
      alert(npc ? npc.dialogue.noMoney : "You don't have enough gold!");
      return;
    }
    
    const npc = loadedNpcs[npcId];
    if (npc && npc.inventory[itemId]) {
      const itemData = npc.inventory[itemId];
      
      // Check stock
      if (itemData.stock === 0) {
        alert(npc.dialogue.soldOut || "This item is out of stock!");
        return;
      }
      
      // Process purchase
      removeMoney(price);
      addItem(itemId, 1);
      
      // Update stock
      if (itemData.stock > 0) {
        itemData.stock--;
      }
      
      // Show purchase message
      alert(npc.dialogue.purchase || "Purchase successful!");
      
      // Refresh the merchant interface
      showMerchantNpcInterface(npc, window.player);
      
      // Update character UI
      import('./ui.js').then(({ updateCharacterUI }) => {
        updateCharacterUI();
      });
    }
  });
};

/**
 * Close the merchant NPC interface
 */
window.closeMerchantNpc = function() {
  const modal = document.getElementById("inventory-modal");
  modal.style.display = "none";
};

/**
 * Show the main shop interface with buy/sell navigation
 * @param {string} npcId - The NPC ID
 * @param {string} storyFolder - The story folder containing the NPC
 * @param {Object} player - The player object
 */
window.showNpcShopInterface = function(npcId, storyFolder, player) {
  loadNpcs(storyFolder).then(() => {
    return getNpcById(npcId, storyFolder);
  }).then((npc) => {
    if (!npc) {
      console.error(`NPC with id "${npcId}" not found`);
      return;
    }

    const modal = document.getElementById("inventory-modal");
    const title = modal.querySelector("h2");
    const content = modal.querySelector(".modal-content > div");
    
    title.textContent = `Shop at ${npc.name}`;
    
    import('./inventory.js').then(({ getMoney }) => {
      let html = `
        <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
          <div style="font-style: italic; color: #666; margin-bottom: 10px;">"${npc.dialogue.greeting}"</div>
          <div style="text-align: center; font-weight: bold; color: gold;">Your Gold: <span id="shop-gold-display">${getMoney()}</span></div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px; justify-content: center;">
          <button id="shop-buy-btn" onclick="showShopBuyTab('${npc.id}', '${storyFolder}')" 
                  style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 3px; flex: 1;">
            Buy Items
          </button>
          <button id="shop-sell-btn" onclick="showShopSellTab('${npc.id}', '${npc.name}')" 
                  style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 3px; flex: 1;">
            Sell Items
          </button>
        </div>
        
        <div id="shop-content">
          <!-- Content will be loaded here -->
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="closeShopInterface()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 3px;">
            Leave ${npc.name}
          </button>
        </div>
      `;
      
      content.innerHTML = html;
      modal.style.display = "block";
      
      // Show buy tab by default
      showShopBuyTab(npc.id, storyFolder);
    });
  });
};

/**
 * Show the buy tab content
 */
window.showShopBuyTab = function(npcId, storyFolder) {
  // Update button states
  const buyBtn = document.getElementById('shop-buy-btn');
  const sellBtn = document.getElementById('shop-sell-btn');
  if (buyBtn && sellBtn) {
    buyBtn.style.background = '#28a745';
    buyBtn.style.opacity = '1';
    sellBtn.style.background = '#6c757d';
    sellBtn.style.opacity = '0.7';
  }
  
  loadNpcs(storyFolder).then(() => {
    return getNpcById(npcId, storyFolder);
  }).then((npc) => {
    if (!npc) return;
    
    import('./inventory.js').then(({ getMoney, getInventory }) => {
      import('./items.js').then(({ items }) => {
        const shopContent = document.getElementById('shop-content');
        if (!shopContent) return;
        
        let html = '';
        
        // Group items by category
        const categories = {
          consumables: [],
          equipment: [],
          scrolls: []
        };
        
        Object.entries(npc.inventory).forEach(([itemId, itemData]) => {
          const item = items[itemId];
          if (!item) return;
          
          if (item.type === "equipable") {
            categories.equipment.push({ id: itemId, item, ...itemData });
          } else if (itemId.includes("scroll")) {
            categories.scrolls.push({ id: itemId, item, ...itemData });
          } else {
            categories.consumables.push({ id: itemId, item, ...itemData });
          }
        });
        
        // Helper function to create accordion section for buying
        const createBuyAccordionSection = (title, items, categoryKey) => {
          const hasItems = items.length > 0;
          const itemCount = hasItems ? items.length : 0;
          
          html += `
            <div class="accordion-header" onclick="toggleAccordion('buy-${categoryKey}')">
              <span>${title} ${hasItems ? `(${itemCount})` : '(0)'}</span>
              <span class="accordion-arrow" id="arrow-buy-${categoryKey}">▶</span>
            </div>
            <div class="accordion-content" id="content-buy-${categoryKey}">
          `;
          
          if (hasItems) {
            items.forEach(({ id, item, price, stock }) => {
              const canAfford = getMoney() >= price;
              const inStock = stock === -1 || stock > 0;
              
              // Check if it's equipment and if player already has it
              let alreadyOwned = false;
              if (item.type === "equipable") {
                const inventory = getInventory();
                const equippedItem = window.player.equipment && window.player.equipment[item.slot];
                alreadyOwned = inventory[id] > 0 || (equippedItem && equippedItem.id === id);
              }
              
              const canBuy = canAfford && inStock && !alreadyOwned;
              
              let stockText = stock === -1 ? "∞" : stock.toString();
              if (stock === 0) stockText = "Out of Stock";
              
              html += `
                <div class="item-row">
                  <div>
                    <strong>${item.name}</strong>
                    ${alreadyOwned ? '<br><small style="color: #ffc107; font-weight: bold;">⚠ Already Owned</small>' : ''}<br>
                    <small style="color: #666;">${item.description || ''}</small><br>
                    <small style="color: #888;">Stock: ${stockText}</small><br>
                    <small style="color: gold; font-weight: bold;">${price} gold</small>
                  </div>
                  <button 
                    onclick="buyFromNpcInShop('${npcId}', '${id}', ${price}, '${storyFolder}')" 
                    ${!canBuy ? 'disabled' : ''}
                    style="background: ${canBuy ? '#28a745' : '#6c757d'}; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: ${canBuy ? 'pointer' : 'not-allowed'};">
                    ${alreadyOwned ? 'Owned' : 'Buy'}
                  </button>
                </div>
              `;
            });
          } else {
            html += `<div class="item-row"><span style="color: #666;">No items available in this category</span></div>`;
          }
          
          html += "</div>";
        };
        
        // Create accordion sections
        createBuyAccordionSection("Consumables", categories.consumables, "consumables");
        createBuyAccordionSection("Equipment", categories.equipment, "equipment");
        createBuyAccordionSection("Scrolls & Magic Items", categories.scrolls, "scrolls");
        
        shopContent.innerHTML = html;
      });
    });
  });
};

/**
 * Show the sell tab content
 */
window.showShopSellTab = function(npcId, npcName) {
  // Update button states
  const buyBtn = document.getElementById('shop-buy-btn');
  const sellBtn = document.getElementById('shop-sell-btn');
  if (buyBtn && sellBtn) {
    sellBtn.style.background = '#dc3545';
    sellBtn.style.opacity = '1';
    buyBtn.style.background = '#6c757d';
    buyBtn.style.opacity = '0.7';
  }
  
  import('./loot.js').then(({ getLootById }) => {
    import('./items.js').then(({ items }) => {
      import('./inventory.js').then(({ getLootInventory, getInventory, getMoney }) => {
        const shopContent = document.getElementById('shop-content');
        if (!shopContent) return;
        
        let html = '';
        
        // First, handle monster parts/loot
        const lootInventory = getLootInventory();
        const lootIds = Object.keys(lootInventory);
        const hasLoot = lootIds.length > 0;
        
        html += `
          <div class="accordion-header" onclick="toggleAccordion('sell-loot')">
            <span>Monster Parts ${hasLoot ? `(${lootIds.length})` : '(0)'}</span>
            <span class="accordion-arrow" id="arrow-sell-loot">▶</span>
          </div>
          <div class="accordion-content" id="content-sell-loot">
        `;
        
        if (hasLoot) {
          lootIds.forEach(lootId => {
            const quantity = lootInventory[lootId];
            const lootItem = getLootById(lootId);
            
            if (lootItem) {
              const totalValue = lootItem.value * quantity;
              const singleValue = lootItem.value;
              html += `
                <div class="item-row">
                  <div>
                    <strong>${lootItem.name}</strong> x${quantity}<br>
                    <small style="color: #666;">${lootItem.description}</small><br>
                    <small style="color: #999;">Value: ${lootItem.value} gold each</small>
                  </div>
                  <div style="display: flex; gap: 5px; flex-direction: column;">
                    <button onclick="sellLootItemInShop('${lootId}', 1, ${singleValue}, '${npcId}')" 
                            style="background: #17a2b8; color: white; border: none; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
                      Sell 1 (${singleValue} gold)
                    </button>
                    <button onclick="sellLootItemInShop('${lootId}', ${quantity}, ${totalValue}, '${npcId}')" 
                            style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                      Sell All (${totalValue} gold)
                    </button>
                  </div>
                </div>
              `;
            }
          });
        } else {
          html += `<div class="item-row"><span style="color: #666;">No monster parts to sell</span></div>`;
        }
        
        html += "</div>";
        
        // Now handle regular items
        const inventory = getInventory();
        const itemIds = Object.keys(inventory);
        
        // Organize items by category
        const categories = {
          consumables: [],
          head: [],
          body: [],
          legs: [],
          foot: [],
          hand: [],
          weapon: []
        };
        
        // Regular inventory items (exclude equipped ones)
        itemIds.forEach(itemId => {
          const quantity = inventory[itemId];
          const item = items[itemId];
          
          if (item && item.sellValue) {
            // Check if this item is currently equipped
            let equipped = false;
            if (item.type === "equipable" && item.slot && window.player.equipment) {
              const equippedItem = window.player.equipment[item.slot];
              equipped = equippedItem && equippedItem.id === itemId;
            }
            
            // Only add to categories if NOT equipped
            if (!equipped) {
              if (item.type === "equipable" && item.slot) {
                categories[item.slot].push({ id: itemId, item, quantity });
              } else {
                categories.consumables.push({ id: itemId, item, quantity });
              }
            }
          }
        });
        
        // Helper function to create accordion section for selling
        const createSellAccordionSection = (title, items, categoryKey) => {
          const hasItems = items.length > 0;
          const itemCount = hasItems ? items.length : 0;
          
          html += `
            <div class="accordion-header" onclick="toggleAccordion('sell-${categoryKey}')">
              <span>${title} ${hasItems ? `(${itemCount})` : '(0)'}</span>
              <span class="accordion-arrow" id="arrow-sell-${categoryKey}">▶</span>
            </div>
            <div class="accordion-content" id="content-sell-${categoryKey}">
          `;
          
          if (hasItems) {
            items.forEach(({ id, item, quantity }) => {
              const totalValue = Math.floor(item.sellValue * quantity);
              const singleValue = item.sellValue;
              
              html += `
                <div class="item-row">
                  <div>
                    <strong>${item.name}</strong> x${quantity}<br>
                    <small style="color: #666;">${item.description}</small><br>
                    <small style="color: #999;">Sell value: ${item.sellValue} gold each</small>
                  </div>
                  <div style="display: flex; gap: 5px; flex-direction: column;">
                    <button onclick="sellItemInShop('${id}', 1, ${singleValue}, '${npcId}')" 
                            style="background: #17a2b8; color: white; border: none; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
                      Sell 1 (${singleValue} gold)
                    </button>
                    <button onclick="sellItemInShop('${id}', ${quantity}, ${totalValue}, '${npcId}')" 
                            style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                      Sell All (${totalValue} gold)
                    </button>
                  </div>
                </div>
              `;
            });
          } else {
            html += `<div class="item-row"><span style="color: #666;">No items in this category</span></div>`;
          }
          
          html += "</div>";
        };
        
        // Create accordion sections for selling
        createSellAccordionSection("Consumables", categories.consumables, "consumables");
        createSellAccordionSection("Head Equipment", categories.head, "head");
        createSellAccordionSection("Body Equipment", categories.body, "body");
        createSellAccordionSection("Legs Equipment", categories.legs, "legs");
        createSellAccordionSection("Foot Equipment", categories.foot, "foot");
        createSellAccordionSection("Hand Equipment", categories.hand, "hand");
        createSellAccordionSection("Weapon Equipment", categories.weapon, "weapon");
        
        // Equipped items section
        const equipmentSlots = ["head", "body", "legs", "foot", "hand", "weapon"];
        const equippedItems = [];
        
        equipmentSlots.forEach(slot => {
          const equippedItem = window.player.equipment[slot];
          if (equippedItem && equippedItem.sellValue) {
            equippedItems.push({ slot, item: equippedItem });
          }
        });
        
        const hasEquippedItems = equippedItems.length > 0;
        html += `
          <div class="accordion-header" onclick="toggleAccordion('sell-equipped')">
            <span>Equipped Items ${hasEquippedItems ? `(${equippedItems.length})` : '(0)'}</span>
            <span class="accordion-arrow" id="arrow-sell-equipped">▶</span>
          </div>
          <div class="accordion-content" id="content-sell-equipped">
        `;
        
        if (hasEquippedItems) {
          equippedItems.forEach(({ slot, item }) => {
            const sellValue = Math.floor(item.sellValue);
            html += `
              <div class="item-row">
                <div>
                  <strong>${item.name}</strong> <span style="color: #6c757d;">(${slot})</span><br>
                  <small style="color: #666;">${item.description || 'Equipped item'}</small><br>
                  <small style="color: #999;">Sell value: ${item.sellValue} gold</small>
                </div>
                <div>
                  <button onclick="sellEquippedItemInShop('${slot}', ${sellValue}, '${npcId}')" 
                          style="background: #fd7e14; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                    Sell (${sellValue} gold)
                  </button>
                </div>
              </div>
            `;
          });
        } else {
          html += `<div class="item-row"><span style="color: #666;">No equipped items to sell</span></div>`;
        }
        
        html += "</div>";
        
        shopContent.innerHTML = html;
      });
    });
  });
};

/**
 * Close the shop interface
 */
window.closeShopInterface = function() {
  const modal = document.getElementById("inventory-modal");
  modal.style.display = "none";
};

/**
 * Buy from NPC within the shop interface
 */
window.buyFromNpcInShop = function(npcId, itemId, price, storyFolder) {
  import('./inventory.js').then(({ addItem, removeMoney, getMoney, getInventory }) => {
    import('./items.js').then(({ items }) => {
      if (getMoney() < price) {
        alert("Not enough gold!");
        return;
      }
      
      const item = items[itemId];
      if (item) {
        // Check if it's equipment and if player already has it
        if (item.type === "equipable") {
          const inventory = getInventory();
          const equippedItem = window.player.equipment && window.player.equipment[item.slot];
          
          // Check if already in inventory or equipped
          if (inventory[itemId] > 0 || (equippedItem && equippedItem.id === itemId)) {
            alert(`You already have a ${item.name}! You can only carry one of each equipment type.`);
            return;
          }
        }
        
        removeMoney(price);
        addItem(itemId, 1);
        
        // Update gold display
        const goldDisplay = document.getElementById('shop-gold-display');
        if (goldDisplay) {
          goldDisplay.textContent = getMoney();
        }
        
        // Save accordion states before refresh
        const accordionStates = saveAccordionStates();
        
        // Refresh the buy tab to update stock and affordability
        showShopBuyTab(npcId, storyFolder);
        
        // Restore accordion states after refresh
        setTimeout(() => restoreAccordionStates(accordionStates), 50);
        
        // Show purchase message (optional)
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 10px; border-radius: 5px; z-index: 10000;';
        notification.textContent = `Purchased ${item.name} for ${price} gold!`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    });
  });
};

/**
 * Sell regular item in shop (only for unequipped items)
 */
window.sellItemInShop = function(itemId, quantity, totalValue, npcId) {
  import('./inventory.js').then(({ removeItem, addMoney, getMoney }) => {
    import('./items.js').then(({ items }) => {
      const item = items[itemId];
      
      removeItem(itemId, quantity);
      addMoney(totalValue);
      
      // Update gold display
      const goldDisplay = document.getElementById('shop-gold-display');
      if (goldDisplay) {
        goldDisplay.textContent = getMoney();
      }
      
      // Save accordion states before refresh
      const accordionStates = saveAccordionStates();
      
      // Refresh the sell tab
      showShopSellTab(npcId, ""); // We don't need npcName for refresh
      
      // Restore accordion states after refresh
      setTimeout(() => restoreAccordionStates(accordionStates), 50);
      
      // Show sale message
      const notification = document.createElement('div');
      notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 10px; border-radius: 5px; z-index: 10000;';
      notification.textContent = `Sold ${quantity}x ${item.name} for ${totalValue} gold!`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    });
  });
};

/**
 * Sell loot item in shop
 */
window.sellLootItemInShop = function(lootId, quantity, totalValue, npcId) {
  import('./inventory.js').then(({ removeLoot, addMoney, getMoney }) => {
    import('./loot.js').then(({ getLootById }) => {
      const lootItem = getLootById(lootId);
      removeLoot(lootId, quantity);
      addMoney(totalValue);
      
      // Update gold display
      const goldDisplay = document.getElementById('shop-gold-display');
      if (goldDisplay) {
        goldDisplay.textContent = getMoney();
      }
      
      // Save accordion states before refresh
      const accordionStates = saveAccordionStates();
      
      // Refresh the sell tab
      showShopSellTab(npcId, ""); // We don't need npcName for refresh
      
      // Restore accordion states after refresh
      setTimeout(() => restoreAccordionStates(accordionStates), 50);
      
      // Show sale message
      const notification = document.createElement('div');
      notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 10px; border-radius: 5px; z-index: 10000;';
      notification.textContent = `Sold ${quantity}x ${lootItem.name} for ${totalValue} gold!`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    });
  });
};

/**
 * Sell equipped item in shop
 */
window.sellEquippedItemInShop = function(slot, sellValue, npcId) {
  import('./inventory.js').then(({ addMoney, getMoney, removeItem }) => {
    import('./character.js').then(({ updateSecondaryStats }) => {
      const equippedItem = window.player.equipment[slot];
      if (equippedItem) {
        // Remove the equipped item from equipment slot
        window.player.equipment[slot] = null;
        
        // Also remove it from inventory if it exists there
        if (equippedItem.id) {
          removeItem(equippedItem.id, 1);
        }
        
        // Ensure player.secondary exists before calling updateSecondaryStats
        if (!window.player.secondary) {
          window.player.secondary = {};
        }
        updateSecondaryStats(window.player);
        
        // Add money
        addMoney(sellValue);
        
        // Update gold display
        const goldDisplay = document.getElementById('shop-gold-display');
        if (goldDisplay) {
          goldDisplay.textContent = getMoney();
        }
        
        // Save accordion states before refresh
        const accordionStates = saveAccordionStates();
        
        // Refresh the sell tab
        showShopSellTab(npcId, ""); // We don't need npcName for refresh
        
        // Restore accordion states after refresh
        setTimeout(() => restoreAccordionStates(accordionStates), 50);
        
        // Show sale message
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #fd7e14; color: white; padding: 10px; border-radius: 5px; z-index: 10000;';
        notification.textContent = `Sold ${equippedItem.name} for ${sellValue} gold!`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    });
  });
};
