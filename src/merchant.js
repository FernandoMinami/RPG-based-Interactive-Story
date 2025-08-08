// === MERCHANT SYSTEM ===

/**
 * Show a message in the merchant interface
 */
function showMerchantMessage(message, type = 'info') {
  // Remove any existing message
  const existingMessage = document.getElementById('merchant-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create new message element
  const messageDiv = document.createElement('div');
  messageDiv.id = 'merchant-message';
  messageDiv.style.cssText = `
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    font-weight: bold;
    text-align: center;
    ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
      type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : 
      'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'}
  `;
  messageDiv.textContent = message;
  
  // Find the inventory modal content and prepend the message
  const modal = document.getElementById("inventory-modal");
  const content = modal.querySelector(".modal-content > div:last-child");
  content.insertBefore(messageDiv, content.firstChild);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (messageDiv && messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 3000);
}

/**
 * Update the merchant gold display
 */
function updateMerchantGoldDisplay() {
  import('./inventory.js').then(({ getMoney }) => {
    const merchantGoldDisplay = document.getElementById('merchant-gold-display');
    if (merchantGoldDisplay) {
      merchantGoldDisplay.textContent = getMoney();
    }
  });
}

/**
 * Show the merchant interface with loot and item selling options
 */
function showMerchantInterface() {
  import('./loot.js').then(({ getLootById }) => {
    import('./inventory.js').then(({ getLootInventory, getInventory, removeLoot, removeItem, addMoney, getMoney }) => {
      const choicesContainer = document.getElementById("choices-container");
      
      // Create merchant buttons
      const merchantDiv = document.createElement("div");
      merchantDiv.style.marginBottom = "20px";
      merchantDiv.innerHTML = `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Merchant Services</h3>
          <p style="margin: 0; color: #666;">Current Gold: <span id="merchant-gold-display" style="color: gold; font-weight: bold;">${getMoney()}</span></p>
        </div>
      `;
      
      const sellLootBtn = document.createElement("button");
      sellLootBtn.textContent = "Sell Monster Parts";
      sellLootBtn.style.width = "48%";
      sellLootBtn.style.marginRight = "4%";
      sellLootBtn.onclick = () => showLootSellModal();
      
      const sellItemsBtn = document.createElement("button");
      sellItemsBtn.textContent = "Sell Items";
      sellItemsBtn.style.width = "48%";
      sellItemsBtn.onclick = () => showItemSellModal();
      
      merchantDiv.appendChild(sellLootBtn);
      merchantDiv.appendChild(sellItemsBtn);
      
      // Insert merchant interface before regular choices
      choicesContainer.insertBefore(merchantDiv, choicesContainer.firstChild);
    });
  });
}

/**
 * Show modal for selling loot items
 */
function showLootSellModal() {
  import('./loot.js').then(({ getLootById }) => {
    import('./inventory.js').then(({ getLootInventory, removeLoot, addMoney, getMoney }) => {
      const modal = document.getElementById("inventory-modal");
      const title = modal.querySelector(".modal-header h2");
      const content = modal.querySelector(".modal-content > div:last-child");
      
      title.textContent = "Sell Monster Parts";
      
      const lootInventory = getLootInventory();
      const lootIds = Object.keys(lootInventory);
      
      if (lootIds.length === 0) {
        content.innerHTML = "<p>You have no monster parts to sell.</p>";
        modal.style.display = "block";
        return;
      }
      
      let html = "<div style='max-height: 400px; overflow-y: auto;'>";
      
      lootIds.forEach(lootId => {
        const quantity = lootInventory[lootId];
        const lootItem = getLootById(lootId);
        
        if (lootItem) {
          const totalValue = lootItem.value * quantity;
          const singleValue = lootItem.value;
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
              <div>
                <strong>${lootItem.name}</strong> x${quantity}<br>
                <small style="color: #666;">${lootItem.description}</small><br>
                <small style="color: #999;">Value: ${lootItem.value} gold each</small>
              </div>
              <div style="display: flex; gap: 5px; flex-direction: column;">
                <button onclick="sellLootItem('${lootId}', 1, ${singleValue})" 
                        style="background: #17a2b8; color: white; border: none; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
                  Sell 1 (${singleValue} gold)
                </button>
                <button onclick="sellLootItem('${lootId}', ${quantity}, ${totalValue})" 
                        style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                  Sell All (${totalValue} gold)
                </button>
              </div>
            </div>
          `;
        }
      });
      
      html += "</div>";
      html += `<div id="loot-gold-display" style="margin-top: 15px; text-align: center; font-weight: bold;">Current Gold: <span style="color: gold;">${getMoney()}</span></div>`;
      
      content.innerHTML = html;
      modal.style.display = "block";
    });
  });
}

/**
 * Sell a loot item
 */
window.sellLootItem = function(lootId, quantity, totalValue) {
  import('./inventory.js').then(({ removeLoot, addMoney, getMoney }) => {
    import('./loot.js').then(({ getLootById }) => {
      const lootItem = getLootById(lootId);
      removeLoot(lootId, quantity);
      addMoney(totalValue);
      
      // Update the gold display immediately in the modal
      const goldDisplay = document.getElementById('loot-gold-display');
      if (goldDisplay) {
        goldDisplay.innerHTML = `Current Gold: <span style="color: gold;">${getMoney()}</span>`;
      }
      
      // Update the merchant interface gold display
      updateMerchantGoldDisplay();
      
      // Show success message in merchant interface
      showMerchantMessage(`Sold ${quantity}x ${lootItem.name} for ${totalValue} gold!`, 'success');
      
      showLootSellModal(); // Refresh the modal
    });
  });
};

/**
 * Show modal for selling regular items with equipped indicator
 * @param {string} npcName - Optional NPC name to show in title
 */
function showItemSellModal(npcName = null) {
  import('./items.js').then(({ items }) => {
    import('./inventory.js').then(({ getInventory, removeItem, addMoney, getMoney }) => {
      const modal = document.getElementById("inventory-modal");
      const title = modal.querySelector(".modal-header h2");
      const content = modal.querySelector(".modal-content > div:last-child");
      
      title.textContent = npcName ? `Sell to ${npcName}` : "Sell Items";
      
      const inventory = getInventory();
      const itemIds = Object.keys(inventory);
      
      if (itemIds.length === 0) {
        content.innerHTML = "<p>You have no items to sell.</p>";
        modal.style.display = "block";
        return;
      }
      
      let html = `<div id="item-gold-display" style="margin-bottom: 15px; text-align: center; font-weight: bold;">Current Gold: <span style="color: gold;">${getMoney()}</span></div>`;
      
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
      
      // Regular inventory items
      itemIds.forEach(itemId => {
        const quantity = inventory[itemId];
        const item = items[itemId];
        
        if (item && item.sellValue) {
          if (item.type === "equipable" && item.slot) {
            categories[item.slot].push({ id: itemId, item, quantity });
          } else {
            categories.consumables.push({ id: itemId, item, quantity });
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
            
            // Check if this item is currently equipped
            let equipped = false;
            if (item.type === "equipable" && item.slot && window.player.equipment) {
              const equippedItem = window.player.equipment[item.slot];
              equipped = equippedItem && equippedItem.id === id;
            }
            const equippedLabel = equipped ? " <span style=\"color:#28a745; font-weight:bold;\">(Equipped)</span>" : "";
            
            html += `
              <div class="item-row">
                <div>
                  <strong>${item.name}</strong> x${quantity}${equippedLabel}<br>
                  <small style="color: #666;">${item.description}</small><br>
                  <small style="color: #999;">Sell value: ${item.sellValue} gold each</small>
                </div>
                <div style="display: flex; gap: 5px; flex-direction: column;">
                  <button onclick="sellItem('${id}', 1, ${singleValue})" 
                          style="background: #17a2b8; color: white; border: none; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
                    Sell 1 (${singleValue} gold)
                  </button>
                  <button onclick="sellItem('${id}', ${quantity}, ${totalValue})" 
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
                <button onclick="sellEquippedItem('${slot}', ${sellValue})" 
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
      
      content.innerHTML = html;
      modal.style.display = "block";
    });
  });
}

/**
 * Sell a regular item
 */
window.sellItem = function(itemId, quantity, totalValue) {
  import('./inventory.js').then(({ removeItem, addMoney, getMoney }) => {
    import('./items.js').then(({ items }) => {
      import('./character.js').then(({ updateSecondaryStats }) => {
        const item = items[itemId];
        
        // Check if this item is currently equipped and unequip it
        if (item && item.type === "equipable" && item.slot) {
          const equippedItem = window.player.equipment[item.slot];
          if (equippedItem && equippedItem.id === itemId) {
            // Remove modifiers from the equipped item
            if (equippedItem.modifiers) {
              for (const [attr, mod] of Object.entries(equippedItem.modifiers)) {
                if (window.player.attributes[attr] !== undefined) {
                  window.player.attributes[attr] -= mod;
                }
                if (attr === "physicDefense" || attr === "magicDefense") {
                  window.player.secondary[attr] -= mod;
                }
              }
            }
            // Unequip the item
            window.player.equipment[item.slot] = null;
            equippedItem.equipped = false;
          }
        }
        
        // Remove item from inventory
        removeItem(itemId, quantity);
        addMoney(totalValue);
        
        // Update character stats
        updateSecondaryStats(window.player);
        window.updateCharacterUI();
        
        // Update the gold display immediately in the modal
        const goldDisplay = document.getElementById('item-gold-display');
        if (goldDisplay) {
          goldDisplay.innerHTML = `Current Gold: <span style="color: gold;">${getMoney()}</span>`;
        }
        
        // Update the merchant interface gold display
        updateMerchantGoldDisplay();
        
        // Show success message in merchant interface
        showMerchantMessage(`Sold ${quantity}x ${item.name} for ${totalValue} gold!`, 'success');
        
        // Update the modal content without closing it
        window.updateSellItemsModal();
      });
    });
  });
};

/**
 * Sell an equipped item
 */
window.sellEquippedItem = function(slot, sellValue) {
  import('./inventory.js').then(({ addMoney, getMoney }) => {
    import('./character.js').then(({ updateSecondaryStats }) => {
      const equippedItem = window.player.equipment[slot];
      if (!equippedItem) {
        showMerchantMessage(`No item equipped in ${slot} slot!`, 'error');
        return;
      }
      
      // Remove modifiers from the equipped item
      if (equippedItem.modifiers) {
        for (const [attr, mod] of Object.entries(equippedItem.modifiers)) {
          if (window.player.attributes[attr] !== undefined) {
            window.player.attributes[attr] -= mod;
          }
          if (attr === "physicDefense" || attr === "magicDefense") {
            window.player.secondary[attr] -= mod;
          }
        }
      }
      
      // Remove the item from equipment
      window.player.equipment[slot] = null;
      
      // Add money
      addMoney(sellValue);
      
      // Update character stats
      updateSecondaryStats(window.player);
      window.updateCharacterUI();
      
      // Update displays
      const goldDisplay = document.getElementById('item-gold-display');
      if (goldDisplay) {
        goldDisplay.innerHTML = `Current Gold: <span style="color: gold;">${getMoney()}</span>`;
      }
      updateMerchantGoldDisplay();
      
      // Show success message
      showMerchantMessage(`Sold ${equippedItem.name} for ${sellValue} gold!`, 'success');
      
      // Update the modal content without closing it
      window.updateSellItemsModal();
    });
  });
};

/**
 * Update sell items modal content without closing/reopening
 */
window.updateSellItemsModal = function() {
  const modal = document.getElementById("inventory-modal");
  const title = modal.querySelector(".modal-header h2");
  
  // Only update if the modal is open and showing sell items
  if (modal.style.display === "block" && title.textContent === "Sell Items") {
    import('./items.js').then(({ items }) => {
      import('./inventory.js').then(({ getInventory, removeItem, addMoney, getMoney }) => {
        // Update gold display
        const goldDisplay = document.getElementById('item-gold-display');
        if (goldDisplay) {
          goldDisplay.innerHTML = `Current Gold: <span style="color: gold;">${getMoney()}</span>`;
        }
        
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
        
        // Regular inventory items
        itemIds.forEach(itemId => {
          const quantity = inventory[itemId];
          const item = items[itemId];
          
          if (item && item.sellValue) {
            if (item.type === "equipable" && item.slot) {
              categories[item.slot].push({ id: itemId, item, quantity });
            } else {
              categories.consumables.push({ id: itemId, item, quantity });
            }
          }
        });
        
        // Update each category
        const updateSellCategoryContent = (categoryKey, items) => {
          const contentDiv = document.getElementById(`content-sell-${categoryKey}`);
          const arrowElement = document.querySelector(`#arrow-sell-${categoryKey}`);
          
          if (contentDiv && arrowElement && arrowElement.parentElement) {
            const headerSpan = arrowElement.parentElement.querySelector('span');
            
            if (headerSpan) {
              // Update header count
              const itemCount = items.length;
              const categoryName = headerSpan.textContent.split('(')[0].trim();
              headerSpan.textContent = `${categoryName} (${itemCount})`;
            }
            
            // Update content
            let html = '';
            if (items.length > 0) {
              items.forEach(({ id, item, quantity }) => {
                const totalValue = Math.floor(item.sellValue * quantity);
                const singleValue = item.sellValue;
                
                // Check if this item is currently equipped
                let equipped = false;
                if (item.type === "equipable" && item.slot && window.player.equipment) {
                  const equippedItem = window.player.equipment[item.slot];
                  equipped = equippedItem && equippedItem.id === id;
                }
                const equippedLabel = equipped ? " <span style=\"color:#28a745; font-weight:bold;\">(Equipped)</span>" : "";
                
                html += `
                  <div class="item-row">
                    <div>
                      <strong>${item.name}</strong> x${quantity}${equippedLabel}<br>
                      <small style="color: #666;">${item.description}</small><br>
                      <small style="color: #999;">Sell value: ${item.sellValue} gold each</small>
                    </div>
                    <div style="display: flex; gap: 5px; flex-direction: column;">
                      <button onclick="sellItem('${id}', 1, ${singleValue})" 
                              style="background: #17a2b8; color: white; border: none; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
                        Sell 1 (${singleValue} gold)
                      </button>
                      <button onclick="sellItem('${id}', ${quantity}, ${totalValue})" 
                              style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                        Sell All (${totalValue} gold)
                      </button>
                    </div>
                  </div>
                `;
              });
            } else {
              html = `<div class="item-row"><span style="color: #666;">No items in this category</span></div>`;
            }
            contentDiv.innerHTML = html;
          }
        };
        
        // Update all categories
        updateSellCategoryContent('consumables', categories.consumables);
        updateSellCategoryContent('head', categories.head);
        updateSellCategoryContent('body', categories.body);
        updateSellCategoryContent('legs', categories.legs);
        updateSellCategoryContent('foot', categories.foot);
        updateSellCategoryContent('hand', categories.hand);
        updateSellCategoryContent('weapon', categories.weapon);
        
        // Update equipped items section
        const equipmentSlots = ["head", "body", "legs", "foot", "hand", "weapon"];
        const equippedItems = [];
        
        equipmentSlots.forEach(slot => {
          const equippedItem = window.player.equipment[slot];
          if (equippedItem && equippedItem.sellValue) {
            equippedItems.push({ slot, item: equippedItem });
          }
        });
        
        const equippedContent = document.getElementById('content-sell-equipped');
        const equippedArrow = document.querySelector('#arrow-sell-equipped');
        
        if (equippedContent && equippedArrow && equippedArrow.parentElement) {
          const equippedHeader = equippedArrow.parentElement.querySelector('span');
          
          if (equippedHeader) {
            equippedHeader.textContent = `Equipped Items (${equippedItems.length})`;
          }
          
          let html = '';
          if (equippedItems.length > 0) {
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
                    <button onclick="sellEquippedItem('${slot}', ${sellValue})" 
                            style="background: #fd7e14; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                      Sell (${sellValue} gold)
                    </button>
                  </div>
                </div>
              `;
            });
          } else {
            html = `<div class="item-row"><span style="color: #666;">No equipped items to sell</span></div>`;
          }
          equippedContent.innerHTML = html;
        }
      });
    });
  }
};

export {
  showMerchantInterface,
  showLootSellModal,
  showItemSellModal,
  showMerchantMessage,
  updateMerchantGoldDisplay
};

// Make showItemSellModal available globally for NPC interfaces
window.showItemSellModal = showItemSellModal;
