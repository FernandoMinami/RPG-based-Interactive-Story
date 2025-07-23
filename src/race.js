/**
 * Race management system for the Interactive Story Game
 */

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
    
    console.log("Races loaded:", Object.keys(races));
  } catch (error) {
    console.error("Error loading races:", error);
    // Fallback to hardcoded races if loading fails
    races = getDefaultRaces();
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
  return races;
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
 * Get type descriptions
 * @returns {Object} Object mapping type IDs to descriptions
 */
export function getTypeDescriptions() {
  return {
    neutral: "Neutral - No special combat bonuses or weaknesses",
    fire: "Fire - Strong against ice, weak against water",
    water: "Water - Strong against fire, weak against earth", 
    earth: "Earth - Strong against water, weak against air",
    air: "Air - Strong against earth, weak against fire",
    light: "Light - Strong against dark, weak against shadow",
    dark: "Dark - Strong against light, weak against holy"
  };
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

/**
 * Get default races as fallback
 * @returns {Object} Default race data
 */
function getDefaultRaces() {
  return {
    human: {
      id: "human",
      name: "Human",
      description: "Balanced and adaptable",
      availableTypes: ["neutral", "fire", "water", "earth", "air", "light"]
    },
    elf: {
      id: "elf", 
      name: "Elf",
      description: "Wise and magical",
      availableTypes: ["neutral", "air", "light", "earth"]
    },
    dwarf: {
      id: "dwarf",
      name: "Dwarf",
      description: "Strong and resilient", 
      availableTypes: ["neutral", "fire", "earth"]
    },
    halfling: {
      id: "halfling",
      name: "Halfling",
      description: "Quick and lucky",
      availableTypes: ["neutral", "earth", "air"]
    },
    orc: {
      id: "orc",
      name: "Orc", 
      description: "Fierce and powerful",
      availableTypes: ["neutral", "fire", "dark"]
    }
  };
}

// Export races object for direct access if needed
export { races };
