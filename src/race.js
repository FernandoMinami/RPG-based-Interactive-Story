/**
 * Race management system for the Interactive Story Game
 */

import { getAllTypes } from './types.js';

let races = {};

/**
 * Load race data from manifest
 * @param {string} storyFolder - The story folder path
 */
export async function loadRaces(storyFolder) {
  try {
    const manifestUrl = `../story-content/${storyFolder}/races/_races.json?v=${Date.now()}`;
    const raceManifest = await fetch(manifestUrl).then(res => res.json());
    
    // Load each race file
    for (const raceInfo of raceManifest) {
      const raceUrl = `../story-content/${storyFolder}/races/${raceInfo.file}?v=${Date.now()}`;
      const raceData = await fetch(raceUrl).then(res => res.json());
      races[raceData.id] = raceData;
    }
    
  } catch (error) {
    console.error("Error loading races:", error);
    // No fallback - races will remain empty and functions will handle gracefully
    races = {};
  }
}

/**
 * Get race by ID
 * @param {string} raceId - The race identifier
 * @returns {Object|null} Race data or null if not found
 */
export function getRaceById(raceId) {
  return races[raceId] || null;
}

/**
 * Get all available races
 * @returns {Object} All loaded races
 */
export function getAllRaces() {
  // If no races are loaded, return no-race fallback
  if (Object.keys(races).length === 0) {
    console.warn("No races loaded, using no-race fallback");
    return {
      "no-race": {
        id: "no-race",
        name: "No Race",
        description: "Default fallback - no special bonuses or restrictions",
        availableTypes: ["neutral"]
      }
    };
  }
  return races;
}

/**
 * Get available races for a specific character
 * @param {Object} character - The character object with availableRaces property
 * @returns {Object} Object containing only the races this character can use
 */
export function getAvailableRacesForCharacter(character) {
  const allRaces = getAllRaces();
  const availableRaces = {};
  
  // If character has specific race restrictions, use those
  if (character && character.availableRaces && Array.isArray(character.availableRaces)) {
    character.availableRaces.forEach(raceId => {
      if (allRaces[raceId]) {
        availableRaces[raceId] = allRaces[raceId];
      }
    });
    
    // If no valid races found, fall back to all races
    if (Object.keys(availableRaces).length === 0) {
      console.warn("No valid races found for character, falling back to all races");
      return allRaces;
    }
    
    return availableRaces;
  }
  
  // If no restrictions, return all races
  return allRaces;
}

/**
 * Get available types for a race
 * @param {string} raceId - The race identifier
 * @returns {Array} Array of available type IDs
 */
export function getAvailableTypesForRace(raceId) {
  const race = getRaceById(raceId);
  return race ? race.availableTypes : ["neutral"];
}

/**
 * Get type descriptions from the types system
 * @returns {Object} Object mapping type IDs to descriptions
 */
export function getTypeDescriptions() {
  const types = getAllTypes();
  const descriptions = {};
  
  for (const typeId in types) {
    const typeData = types[typeId];
    descriptions[typeId] = `${typeData.name} - ${typeData.description}`;
  }
  
  // Simple fallback if no types loaded
  if (Object.keys(descriptions).length === 0) {
    return {
      neutral: "Neutral - No special combat bonuses or weaknesses"
    };
  }
  
  return descriptions;
}

/**
 * Check if a race can use a specific type
 * @param {string} raceId - The race identifier
 * @param {string} typeId - The type identifier
 * @returns {boolean} True if the race can use this type
 */
export function canRaceUseType(raceId, typeId) {
  const availableTypes = getAvailableTypesForRace(raceId);
  return availableTypes.includes(typeId);
}

// Export races object for direct access if needed
export { races };
