/**
 * Helper functions for handling the new elementalAlignments and races array structure
 * This module provides safe access to elemental alignments (formerly "types", now "elementalAlignments")
 */

import { calculateTypeEffectiveness, calculateAbilityTypeBonus } from './elements.js';

/**
 * Get the primary elemental alignment (first one in the array)
 * @param {Object} character - Character object with misc.elementalAlignments
 * @returns {string|null} Primary elemental alignment or null
 */
export function getPrimaryElementalAlignment(character) {
    return character?.misc?.elementalAlignments?.[0] || null;
}

/**
 * Get the primary race (first one in the array)
 * @param {Object} character - Character object with misc.races
 * @returns {string|null} Primary race or null
 */
export function getPrimaryRace(character) {
    return character?.misc?.races?.[0] || null;
}

/**
 * Get all elemental alignments for a character
 * @param {Object} character - Character object with misc.elementalAlignments
 * @returns {Array} Array of elemental alignments
 */
export function getAllElementalAlignments(character) {
    return character?.misc?.elementalAlignments || [];
}

/**
 * Get all races for a character
 * @param {Object} character - Character object with misc.races
 * @returns {Array} Array of races
 */
export function getAllRaces(character) {
    return character?.misc?.races || [];
}

/**
 * Check if character has a specific race
 * @param {Object} character - Character object with misc.races
 * @param {string} raceToCheck - Race to check for
 * @returns {boolean} True if character has this race
 */
export function hasRace(character, raceToCheck) {
    const races = getAllRaces(character);
    return races.includes(raceToCheck);
}

/**
 * Check if any of the character's races match a list of races
 * @param {Object} character - Character object with misc.races
 * @param {Array} raceList - Array of races to check against
 * @returns {boolean} True if any race matches
 */
export function hasAnyRace(character, raceList) {
    const characterRaces = getAllRaces(character);
    return raceList.some(race => characterRaces.includes(race));
}

/**
 * Get character's weight
 * @param {Object} character - Character object with misc.weight
 * @param {number} defaultWeight - Default weight if not found (default: 70kg)
 * @returns {number} Character's weight in kg
 */
export function getWeight(character, defaultWeight = 70) {
    return character?.misc?.weight || defaultWeight;
}

/**
 * Get character's height
 * @param {Object} character - Character object with misc.height
 * @param {number} defaultHeight - Default height if not found (default: 175cm)
 * @returns {number} Character's height in cm
 */
export function getHeight(character, defaultHeight = 175) {
    return character?.misc?.height || defaultHeight;
}

/**
 * Get a formatted string of all races for display
 * @param {Object} character - Character object with misc.races
 * @returns {string} Formatted string like "Human/Elf" or "Human"
 */
export function formatRaces(character) {
    const races = getAllRaces(character);
    if (races.length === 0) return "Unknown";
    
    return races
        .map(race => race.charAt(0).toUpperCase() + race.slice(1))
        .join("/");
}

/**
 * Calculate the best type effectiveness when attacker has one type vs defender with multiple types
 * @param {string} attackerType - The attacker's elemental type
 * @param {Object} defender - Defender character with misc.elementalAlignments array
 * @returns {Object} Object with multiplier and best matching defender type
 */
export function calculateBestTypeEffectiveness(attackerType, defender) {
    const defenderTypes = getAllElementalAlignments(defender);
    
    if (!attackerType || defenderTypes.length === 0) {
        return { multiplier: 1.0, matchedType: null };
    }
    
    let bestMultiplier = 1.0;
    let bestMatchedType = defenderTypes[0]; // Default to first type
    
    // Check all defender types and find the most effective one
    for (const defenderType of defenderTypes) {
        const multiplier = calculateTypeEffectiveness(attackerType, defenderType);
        // Prioritize higher multipliers (super effective > normal > not very effective > immune)
        if (multiplier > bestMultiplier) {
            bestMultiplier = multiplier;
            bestMatchedType = defenderType;
        }
    }
    
    return { multiplier: bestMultiplier, matchedType: bestMatchedType };
}

/**
 * Calculate the best ability type bonus when character has multiple types
 * @param {Object} attacker - Attacker character with misc.elementalAlignments array
 * @param {string} abilityType - The ability's elemental type
 * @returns {Object} Object with bonus multiplier and matching type
 */
export function calculateBestAbilityTypeBonus(attacker, abilityType) {
    const attackerTypes = getAllElementalAlignments(attacker);
    
    if (!abilityType || attackerTypes.length === 0) {
        return { bonus: 1.0, matchedType: null };
    }
    
    let bestBonus = 1.0;
    let bestMatchedType = null;
    
    // Check all attacker types and find the best bonus
    for (const attackerType of attackerTypes) {
        const bonus = calculateAbilityTypeBonus(attackerType, abilityType);
        if (bonus > bestBonus) {
            bestBonus = bonus;
            bestMatchedType = attackerType;
        }
    }
    
    return { bonus: bestBonus, matchedType: bestMatchedType };
}

/**
 * Check if any of the character's elemental alignments match a list of types
 * @param {Object} character - Character object with misc.elementalAlignments
 * @param {Array} typeList - Array of types to check against
 * @returns {boolean} True if any alignment matches
 */
export function hasAnyElementalAlignment(character, typeList) {
    const characterTypes = getAllElementalAlignments(character);
    return typeList.some(type => characterTypes.includes(type));
}

/**
 * Get a formatted string of all elemental alignments for display
 * @param {Object} character - Character object with misc.elementalAlignments
 * @returns {string} Formatted string like "Fire/Water" or "Neutral"
 */
export function formatElementalAlignments(character) {
    const alignments = getAllElementalAlignments(character);
    if (alignments.length === 0) return "None";
    
    return alignments
        .map(type => type.charAt(0).toUpperCase() + type.slice(1))
        .join("/");
}
