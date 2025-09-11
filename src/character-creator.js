// Character Creator system for handling player customization

import { getPrimaryRace, getWeight, getHeight } from './element-helpers.js';

import { loadRaces, getAvailableRacesForCharacter, getAvailableTypesForRace, getTypeDescriptions, canRaceUseType } from './race.js';
import { loadElements } from './elements.js';
import { loadAbilities } from './abilities.js';
import { updateSecondaryStats } from './characters.js';
import { showNotification } from './ui-helpers.js';

/** Show character selection for a specific story
 * @param {Object} story - The selected story object
 * @param {Function} onCharacterSelected - Callback when character is selected and customized
 */
export async function showCharacterSelection(story) {
    // Load required data
    await loadRaces(story.folder.replace('./', ''));
    await loadElements(story.folder.replace('./', ''));

    // Load abilities for this story
    const abilityManifestUrl = `../story-content/${story.folder.replace('./', '')}/abilities.json?v=${Date.now()}`;
    const abilityManifest = await fetch(abilityManifestUrl).then(res => res.json());
    await loadAbilities(abilityManifest, `../story-content/${story.folder.replace('./', '')}/abilities/`);

    const charDiv = document.getElementById("character-selection");
    charDiv.innerHTML = "<h2>Choose Your Character</h2>";

    const manifestUrl = `../story-content/${story.folder.replace('./', '')}/characters.json?v=${Date.now()}`;
    const characters = await fetch(manifestUrl).then(r => r.json());

    characters.forEach(char => {
        const btn = document.createElement("button");
        btn.textContent = char.name;
        btn.style.cssText = `
      margin: 10px;
      padding: 15px 25px;
      font-size: 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    `;

        btn.onmouseover = () => btn.style.background = "#0056b3";
        btn.onmouseout = () => btn.style.background = "#007bff";

        btn.onclick = async () => {
            // Load character module
            
            const charPath = `../story-content/${story.folder.replace('./', '')}/${char.file.replace('./', '')}?v=${Date.now()}`;

            
            const selectedCharacterModule = await import(charPath);
            const basePlayer = selectedCharacterModule.player;

            // Show character customization
            await showCharacterCustomization(char, basePlayer, selectedCharacterModule, story);
        };

        charDiv.appendChild(btn);
    });

    charDiv.style.display = "";
}

/** Show comprehensive character customization interface
 * @param {Object} baseChar - Base character data
 * @param {Object} player - Player object to customize
 * @param {Object} characterModule - Character module
 * @param {Object} story - Story object
 */
export async function showCharacterCustomization(baseChar, player, characterModule, story) {
    // Store references for later use
    window.selectedCharacterModule = characterModule;
    window.player = player;
    window.applyAttributes = characterModule.applyAttributes;

    const charDiv = document.getElementById("character-selection");

    // Get available abilities for selection
    const availableAbilities = await getAvailableAbilities(story);

    charDiv.innerHTML = createCustomizationHTML(baseChar, player, availableAbilities);

    // Initialize form functionality
    initializeCustomizationForm(player, story);
}

/** Get race and type-based abilities by reading from race and type files
 * @param {string} race - Primary race ID
 * @param {string} secondaryRace - Secondary race ID (for hybrids)
 * @param {string} type - Primary type ID
 * @param {string} secondaryType - Secondary type ID (for hybrids)
 * @param {string} storyFolder - Story folder path
 * @returns {Array} Array of ability IDs
 */
async function getRaceTypeAbilities(race, secondaryRace, type, secondaryType, storyFolder) {
  let abilities = [];

  try {
    // Get abilities from primary race
    if (race) {
      const raceData = await fetch(`../story-content/${storyFolder}/races/${race}.json?v=${Date.now()}`).then(r => r.json());
      if (raceData.specialAbilities) {
        abilities.push(...raceData.specialAbilities);
      }
    }

    // Get abilities from secondary race (for hybrids)
    if (secondaryRace) {
      const secondaryRaceData = await fetch(`../story-content/${storyFolder}/races/${secondaryRace}.json?v=${Date.now()}`).then(r => r.json());
      if (secondaryRaceData.specialAbilities) {
        abilities.push(...secondaryRaceData.specialAbilities);
      }
    }

    // Get abilities from primary type
    if (type) {
      const typeData = await fetch(`../story-content/${storyFolder}/elements/${type}.json?v=${Date.now()}`).then(r => r.json());
      if (typeData.specialAbilities) {
        abilities.push(...typeData.specialAbilities);
      }
    }

    // Get abilities from secondary type (for hybrids)
    if (secondaryType) {
      const secondaryTypeData = await fetch(`../story-content/${storyFolder}/elements/${secondaryType}.json?v=${Date.now()}`).then(r => r.json());
      if (secondaryTypeData.specialAbilities) {
        abilities.push(...secondaryTypeData.specialAbilities);
      }
    }

  } catch (error) {
    console.warn('Error loading race/type abilities:', error);
  }

  // Remove duplicates
  return [...new Set(abilities)];
}

/** Get available abilities for character selection
 * @param {Object} story - Story object
 * @returns {Array} Array of available abilities
 */
async function getAvailableAbilities(story) {
    try {
        const abilityManifestUrl = `../story-content/${story.folder.replace('./', '')}/abilities.json?v=${Date.now()}`;
        const abilityManifest = await fetch(abilityManifestUrl).then(res => res.json());

        // Get ability details
        const abilities = [];
        for (const abilityInfo of abilityManifest) {
            try {
                // Use the file property from the manifest instead of treating it as a string
                const abilityModule = await import(`../story-content/${story.folder.replace('./', '')}/abilities/${abilityInfo.file}?v=${Date.now()}`);

                // Handle both export patterns: export default and export const ability
                let abilityData = abilityModule.ability || abilityModule.default;

                if (abilityData) {
                    // Only exclude abilities that explicitly set learnable to false
                    // If learnable is undefined, assume it's learnable (default behavior)
                    if (abilityData.learnable !== false) {
                        abilities.push({
                            id: abilityInfo.id,
                            ...abilityData
                        });
                    }
                } else {
                    console.warn(`Ability ${abilityInfo.id} has no valid export structure`);
                }
            } catch (error) {
                console.warn(`Failed to load ability ${abilityInfo.id}:`, error);
            }
        }

        return abilities;
    } catch (error) {
        console.error('Failed to load abilities:', error);
        return [];
    }
}

/** Create the HTML for character customization interface
 * @param {Object} baseChar - Base character data
 * @param {Object} player - Player object
 * @param {Array} availableAbilities - Available abilities
 * @returns {string} HTML string
 */
function createCustomizationHTML(baseChar, player, availableAbilities) {
    const races = getAvailableRacesForCharacter(player);
    let raceOptionsHtml = '';

  Object.values(races).forEach(race => {
    const selected = getPrimaryRace(player) === race.id ? 'selected' : '';
    const typeCount = race.availableTypes.length;
    raceOptionsHtml += `<option value="${race.id}" ${selected}>${race.name} - ${race.description} (${typeCount} types)</option>`;
  });    // Get professions (enhanced with hybrid-friendly options)
    const professions = [
        { id: 'warrior', name: 'Warrior', description: 'Skilled in combat and physical prowess' },
        { id: 'mage', name: 'Mage', description: 'Master of magical arts and arcane knowledge' },
        { id: 'rogue', name: 'Rogue', description: 'Agile and stealthy, skilled in stealth and dexterity' },
        { id: 'healer', name: 'Healer', description: 'Devoted to healing and supporting others' },
        { id: 'scholar', name: 'Scholar', description: 'Seeker of knowledge and wisdom' },
        { id: 'merchant', name: 'Merchant', description: 'Skilled in trade and negotiation' },
        { id: 'explorer', name: 'Explorer', description: 'Adventurous spirit, skilled in survival' },
        { id: 'hybrid-adept', name: 'Hybrid Adept 🌟', description: 'Specialist in blending multiple disciplines and adapting to any situation' }
    ];

    let professionOptionsHtml = '';
    professions.forEach(profession => {
        const selected = player.profession === profession.id ? 'selected' : '';
        professionOptionsHtml += `<option value="${profession.id}" ${selected}>${profession.name} - ${profession.description}</option>`;
    });

    // Create ability selection checkboxes
    let abilitySelectionHtml = '';
    if (availableAbilities.length > 0) {
        // Group abilities by type for better organization
        const abilityGroups = {};
        availableAbilities.forEach(ability => {
            const type = ability.type || 'other';
            if (!abilityGroups[type]) abilityGroups[type] = [];
            abilityGroups[type].push(ability);
        });

        abilitySelectionHtml = `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Starting Abilities (Choose up to 3):</label>
        <div style="margin-bottom: 10px;">
          <small style="color: #666; font-style: italic;">
            Found ${availableAbilities.length} available abilities. Choose abilities that complement your character build.
          </small>
        </div>
        <div id="ability-selection" style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; border-radius: 4px;">
    `;

        // Display abilities grouped by type
        Object.keys(abilityGroups).sort().forEach(type => {
            abilitySelectionHtml += `<div style="margin-bottom: 15px;">`;
            abilitySelectionHtml += `<div style="font-weight: bold; color: #444; margin-bottom: 5px; text-transform: capitalize;">${type} Abilities:</div>`;

            abilityGroups[type].forEach(ability => {
                const isSelected = player.abilityIds && player.abilityIds.includes(ability.id);
                abilitySelectionHtml += `
          <div style="margin-bottom: 8px; margin-left: 10px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <div style="display: flex; flex: 1; align-items: center; flex-direction: column;">
                <strong>${ability.name}</strong>
                <div style="font-size: 0.9em; color: #666; margin-left: 0;">${ability.description || 'No description available'}</div>
                <div style="font-size: 0.8em; color: #888; display: flex; gap: 15px;">
                  ${ability.mpCost ? `<span>MP Cost: ${ability.mpCost}</span>` : ''}
                  ${ability.minDamage && ability.maxDamage ? `<span>Damage: ${ability.minDamage}-${ability.maxDamage}</span>` : ''}
                  ${ability.range ? `<span>Range: ${ability.range}</span>` : ''}
                </div>
              </div>
                <input style="width: 10%;" type="checkbox" value="${ability.id}" ${isSelected ? 'checked' : ''} 
                style="margin-right: 8px;" class="ability-checkbox">

            </label>
          </div>
        `;
            });
            abilitySelectionHtml += `</div>`;
        });

        abilitySelectionHtml += `
        </div>
        <div style="margin-top: 10px;">
          <small style="color: #666; font-style: italic;">
            <strong>Tip:</strong> Mix different ability types for a well-rounded character: offense, defense, and utility abilities work well together.
          </small>
        </div>
      </div>
    `;
    } else {
        abilitySelectionHtml = `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #dc3545; border-radius: 4px; background: #f8d7da; color: #721c24;">
        <strong>No abilities available</strong> - There might be an issue loading the ability data.
      </div>
    `;
    }

    return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Customize Your Character</h2>
      <div style="padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #f8f9fa;">Base Character: ${baseChar.name}</h3>
        
        <!-- Basic Information -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <label for="char-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Character Name:</label>
            <input type="text" id="char-name" value="${player.name}" 
                   style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;" 
                   maxlength="25" placeholder="Enter your character name">
          </div>
          
          <div>
            <label for="char-profession" style="display: block; margin-bottom: 5px; font-weight: bold;">Profession:</label>
            <select id="char-profession" style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;">
              <option value="">No Profession</option>
              ${professionOptionsHtml}
            </select>
          </div>
        </div>

        <!-- Physical Characteristics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <label for="char-height" style="display: block; margin-bottom: 5px; font-weight: bold;">Height (cm):</label>
            <input type="number" id="char-height" value="${getHeight(player, 170)}" min="120" max="250"
                   style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          
          <div>
            <label for="char-weight" style="display: block; margin-bottom: 5px; font-weight: bold;">Weight (kg):</label>
            <input type="number" id="char-weight" value="${getWeight(player, 70)}" min="30" max="200"
                   style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
        </div>

        <!-- Character Image -->
        <div style="margin-bottom: 20px;">
          <label for="char-image" style="display: block; margin-bottom: 5px; font-weight: bold;">Character Image URL:</label>
          <input type="url" id="char-image" value="${player.imagePath || ''}" 
                 style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;" 
                 placeholder="https://example.com/your-character-image.jpg">
          <small style="color: #666; font-style: italic;">Optional: Paste a URL to an image that represents your character</small>
          <div id="image-preview" style="margin-top: 10px; text-align: center;">
            ${player.imagePath ? `<img src="${player.imagePath}" style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid #ccc;" onerror="this.style.display='none'">` : ''}
          </div>
        </div>

        <!-- Race and Type -->
        <div style="margin-bottom: 20px;">
          <!-- Race Selection -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Race:</label>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <select id="char-race" style="flex: 1; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;">
                ${raceOptionsHtml}
              </select>
              <label style="display: flex; align-items: center; cursor: pointer; white-space: nowrap;">
                <input type="checkbox" id="hybrid-race-checkbox" style="margin-right: 5px;">
                <span>🌟 Hybrid Race</span>
              </label>
            </div>
            <div id="secondary-race-container" style="display: none; margin-top: 10px;">
              <label for="char-race-secondary" style="display: block; margin-bottom: 5px; font-weight: bold; color: #007bff;">Secondary Race:</label>
              <select id="char-race-secondary" style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;">
                ${raceOptionsHtml}
              </select>
            </div>
            <small style="color: #666; font-style: italic;">Race affects story choices and grants special abilities</small>
          </div>
          
          <!-- Type Selection -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Combat Type:</label>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <select id="char-type" style="flex: 1; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;">
              </select>
              <label style="display: flex; align-items: center; cursor: pointer; white-space: nowrap;">
                <input type="checkbox" id="hybrid-type-checkbox" style="margin-right: 5px;">
                <span>🌟 Hybrid Type</span>
              </label>
            </div>
            <div id="secondary-type-container" style="display: none; margin-top: 10px;">
              <label for="char-type-secondary" style="display: block; margin-bottom: 5px; font-weight: bold; color: #007bff;">Secondary Type:</label>
              <select id="char-type-secondary" style="width: 100%; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;">
              </select>
            </div>
            <small style="color: #666; font-style: italic;">Type affects combat effectiveness and grants elemental abilities</small>
          </div>
          
          <!-- Race/Type Abilities Display -->
          <div id="race-type-abilities" style="margin-top: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; display: none;">
            <strong style="color: #495057;">Racial & Type Abilities:</strong>
            <div id="race-type-abilities-list" style="margin-top: 8px; font-size: 0.9em; color: #666;"></div>
          </div>
        </div>

        ${abilitySelectionHtml}

        <!-- Action Buttons -->
        <div style="text-align: center; margin-top: 30px;">
          <button id="confirm-character" style="background: #28a745; color: white; border: none; padding: 15px 30px; 
                  font-size: 16px; border-radius: 6px; cursor: pointer; margin-right: 15px; font-weight: bold;">
            ✨ Start Adventure
          </button>
          <button id="back-to-selection" style="background: #6c757d; color: white; border: none; padding: 15px 30px; 
                  font-size: 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            ← Back to Characters
          </button>
        </div>
      </div>
    </div>
  `;
}

/** Initialize customization form functionality
 * @param {Object} player - Player object
 * @param {Object} story - Story object
 */
function initializeCustomizationForm(player, story) {
    // Initialize type options based on current race
    updateTypeOptions(getPrimaryRace(player));
    updateSecondaryTypeOptions(getPrimaryRace(player));

    // Initialize race/type abilities display
    updateRaceTypeAbilities();

    // Race change event listener
    document.getElementById("char-race").onchange = function () {
        updateTypeOptions(this.value);
        updateRaceTypeAbilities();
    };

    // Secondary race change event listener
    document.getElementById("char-race-secondary").onchange = function () {
        updateRaceTypeAbilities();
    };

    // Type change event listeners
    document.getElementById("char-type").onchange = function () {
        updateRaceTypeAbilities();
    };

    document.getElementById("char-type-secondary").onchange = function () {
        updateRaceTypeAbilities();
    };

    // Hybrid race checkbox
    document.getElementById("hybrid-race-checkbox").onchange = function () {
        const secondaryContainer = document.getElementById("secondary-race-container");
        if (this.checked) {
            secondaryContainer.style.display = "block";
            updateSecondaryRaceOptions();
        } else {
            secondaryContainer.style.display = "none";
            document.getElementById("char-race-secondary").value = "";
        }
        updateRaceTypeAbilities();
    };

    // Hybrid type checkbox
    document.getElementById("hybrid-type-checkbox").onchange = function () {
        const secondaryContainer = document.getElementById("secondary-type-container");
        if (this.checked) {
            secondaryContainer.style.display = "block";
            updateSecondaryTypeOptions();
        } else {
            secondaryContainer.style.display = "none";
            document.getElementById("char-type-secondary").value = "";
        }
        updateRaceTypeAbilities();
    };

    // Image URL change event listener
    document.getElementById("char-image").oninput = function () {
        updateImagePreview(this.value);
    };

    // Ability selection limit enforcement
    const abilityCheckboxes = document.querySelectorAll('.ability-checkbox');
    abilityCheckboxes.forEach(checkbox => {
        checkbox.onchange = function () {
            enforceAbilityLimit();
        };
    });

    // Confirm character button
    document.getElementById("confirm-character").onclick = async () => {
        if (await validateAndApplyCustomization(player, story)) {
            // Ensure global player is updated
            window.player = player;
            
            // Trigger character creation completion
            if (window.onCharacterCreated) {
                window.onCharacterCreated(player, story);
            }
        }
    };

    // Back to selection button
    document.getElementById("back-to-selection").onclick = () => {
        showCharacterSelection(story);
    };
}

/**
 * Update type options based on selected race
 * @param {string} selectedRace - Selected race ID
 */
function updateTypeOptions(selectedRace) {
    const typeSelect = document.getElementById("char-type");
    const availableTypes = getAvailableTypesForRace(selectedRace);
    const typeDescriptions = getTypeDescriptions();

  typeSelect.innerHTML = "";
  availableTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = typeDescriptions[type];
    option.selected = window.player.type === type;
    typeSelect.appendChild(option);
  });    // If current type is not available for the race, reset to neutral
    if (!canRaceUseType(selectedRace, window.player.type)) {
        window.player.type = "neutral";
        typeSelect.value = "neutral";
    }
}

/** Update image preview
 * @param {string} imageUrl - Image URL
 */
function updateImagePreview(imageUrl) {
    const preview = document.getElementById("image-preview");
    if (imageUrl.trim()) {
        preview.innerHTML = `<img src="${imageUrl}" style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid #ccc;" onerror="this.style.display='none'; this.nextSibling.style.display='block';"><div style="display: none; color: #dc3545; font-size: 0.9em;">Invalid image URL</div>`;
    } else {
        preview.innerHTML = "";
    }
}

/** Update secondary race options (excluding the primary race)
 */
function updateSecondaryRaceOptions() {
    const primaryRace = document.getElementById("char-race").value;
    const secondaryRaceSelect = document.getElementById("char-race-secondary");
    const races = getAvailableRacesForCharacter(window.player);
    
    secondaryRaceSelect.innerHTML = '<option value="">Choose secondary race...</option>';
    
    Object.values(races).forEach(race => {
        if (race.id !== primaryRace) { // Exclude the primary race
            const option = document.createElement("option");
            option.value = race.id;
            option.textContent = `${race.name} - ${race.description}`;
            secondaryRaceSelect.appendChild(option);
        }
    });
}

/** Update secondary type options based on available types
 */
function updateSecondaryTypeOptions() {
    const primaryType = document.getElementById("char-type").value;
    const secondaryTypeSelect = document.getElementById("char-type-secondary");
    const primaryRace = document.getElementById("char-race").value;
    const availableTypes = getAvailableTypesForRace(primaryRace);
    const typeDescriptions = getTypeDescriptions();
    
    secondaryTypeSelect.innerHTML = '<option value="">Choose secondary type...</option>';
    
    availableTypes.forEach(type => {
        if (type !== primaryType) { // Exclude the primary type
            const option = document.createElement("option");
            option.value = type;
            option.textContent = typeDescriptions[type];
            secondaryTypeSelect.appendChild(option);
        }
    });
}

/** Update race and type abilities display
 */
async function updateRaceTypeAbilities() {
    const primaryRace = document.getElementById("char-race").value;
    const secondaryRace = document.getElementById("char-race-secondary").value;
    const primaryType = document.getElementById("char-type").value;
    const secondaryType = document.getElementById("char-type-secondary").value;
    
    // Get story folder from global scope
    const storyFolder = window.selectedStory?.folder?.replace('./', '');
    
    const raceTypeAbilities = await getRaceTypeAbilities(primaryRace, secondaryRace, primaryType, secondaryType, storyFolder);
    const abilityContainer = document.getElementById("race-type-abilities");
    const abilityList = document.getElementById("race-type-abilities-list");
    
    if (raceTypeAbilities.length > 0) {
        abilityContainer.style.display = "block";
        
        let abilityText = "You will start with these abilities: ";
        const abilityNames = raceTypeAbilities.map(abilityId => {
            // Convert ability ID to a more readable name
            return abilityId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        });
        
        abilityText += abilityNames.join(", ");
        abilityList.textContent = abilityText;
    } else {
        abilityContainer.style.display = "none";
    }
}

/** Enforce ability selection limit (max 3)
 */
function enforceAbilityLimit() {
    const checkboxes = document.querySelectorAll('.ability-checkbox');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

    if (selectedCount >= 3) {
        checkboxes.forEach(cb => {
            if (!cb.checked) {
                cb.disabled = true;
                cb.parentElement.style.opacity = "0.5";
            }
        });
    } else {
        checkboxes.forEach(cb => {
            cb.disabled = false;
            cb.parentElement.style.opacity = "1";
        });
    }
}

/** Validate and apply character customization
 * @param {Object} player - Player object
 * @param {Object} story - Story object
 * @returns {boolean} Whether customization was successful
 */
async function validateAndApplyCustomization(player, story) {
    // Get form values
    const newName = document.getElementById("char-name").value.trim();
    const newRace = document.getElementById("char-race").value;
    const newType = document.getElementById("char-type").value;
    const newProfession = document.getElementById("char-profession").value;
    const newHeight = parseInt(document.getElementById("char-height").value);
    const newWeight = parseInt(document.getElementById("char-weight").value);
    const newImageUrl = document.getElementById("char-image").value.trim();
    
    // Get hybrid selections
    const isHybridRace = document.getElementById("hybrid-race-checkbox").checked;
    const secondaryRace = isHybridRace ? document.getElementById("char-race-secondary").value : null;
    const isHybridType = document.getElementById("hybrid-type-checkbox").checked;
    const secondaryType = isHybridType ? document.getElementById("char-type-secondary").value : null;

    // Validation
    if (!newName) {
        showNotification("Please enter a character name!", "error");
        return false;
    }

    if (newName.length > 25) {
        showNotification("Character name must be 25 characters or less!", "error");
        return false;
    }

    // Validate hybrid selections
    if (isHybridRace && !secondaryRace) {
        showNotification("Please select a secondary race for your hybrid character!", "error");
        return false;
    }

    if (isHybridType && !secondaryType) {
        showNotification("Please select a secondary type for your hybrid character!", "error");
        return false;
    }

    // Get selected abilities
    const selectedAbilities = Array.from(document.querySelectorAll('.ability-checkbox:checked'))
        .map(cb => cb.value);

    // Get race and type abilities
    const storyFolder = story.folder.replace('./', '');
    const raceTypeAbilities = await getRaceTypeAbilities(newRace, secondaryRace, newType, secondaryType, storyFolder);

    // Apply customizations
    player.name = newName;
    // Update race in misc attributes
    if (!player.misc) player.misc = {};
    if (!player.misc.races) player.misc.races = [];
    player.misc.races[0] = newRace;
    player.type = newType;
    player.profession = newProfession || null;
    if (!player.misc) player.misc = {};
    player.misc.height = newHeight;
    player.misc.weight = newWeight;
    player.imagePath = newImageUrl || null;
    
    // Store hybrid information
    if (isHybridRace) {
        player.secondaryRace = secondaryRace;
        player.isHybridRace = true;
    }
    
    if (isHybridType) {
        player.secondaryType = secondaryType;
        player.isHybridType = true;
    }

    // Combine selected abilities with race/type abilities
    const allAbilities = [...new Set([...selectedAbilities, ...raceTypeAbilities])];
    player.abilityIds = allAbilities;

    // Initialize profession-based bonuses if needed
    if (newProfession) {
        applyProfessionBonuses(player, newProfession);
    }

    // Show success message with ability count
    const abilityCount = allAbilities.length;
    const raceTypeCount = raceTypeAbilities.length;
    let message = `Character "${newName}" created successfully!`;
    if (raceTypeCount > 0) {
        message += ` You gained ${raceTypeCount} racial/type abilities and selected ${selectedAbilities.length} additional abilities.`;
    }
    showNotification(message, "success");
    return true;
}

/** Apply profession-based bonuses to character
 * @param {Object} player - Player object
 * @param {string} profession - Profession ID
 */
function applyProfessionBonuses(player, profession) {
    const professionBonuses = {
        warrior: { strength: 2, constitution: 1 },
        mage: { intelligence: 2, wisdom: 1 },
        rogue: { dexterity: 2, charisma: 1 },
        healer: { wisdom: 2, intelligence: 1 },
        scholar: { intelligence: 1, wisdom: 2 },
        merchant: { charisma: 2, intelligence: 1 },
        explorer: { constitution: 1, dexterity: 1, wisdom: 1 },
        'hybrid-adept': { dexterity: 1, intelligence: 1, wisdom: 1, charisma: 1 }
    };

    const bonuses = professionBonuses[profession];
    if (bonuses) {
        Object.keys(bonuses).forEach(attr => {
            if (player.primary[attr] !== undefined) {
                player.primary[attr] += bonuses[attr];
            }
        });
    }
}

/** Set callback for character creation completion
 * @param {Function} callback - Callback function to call when character is created
 */
export function setCharacterCreatedCallback(callback) {
    window.onCharacterCreated = callback;
}
