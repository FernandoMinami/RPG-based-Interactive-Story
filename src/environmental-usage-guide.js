/**
 * ENVIRONMENTAL SYSTEM USAGE GUIDE
 * 
 * This guide shows how to use the new unified environmental system
 * to add environmental effects to your story scenarios and battles.
 */

// 1. SIMPLE USAGE FOR STORY SCENARIOS

import { getEnvironmentalDamageForStory, isValidEnvironment } from './environmental.js';

// In your story node, add environmental damage:
function handleStoryEnvironment(character, environmentType, intensity) {
    // Check if environment is valid
    if (!isValidEnvironment(environmentType)) {
        console.warn(`Unknown environment type: ${environmentType}`);
        return;
    }
    
    // Get environmental damage for story
    const envDamage = getEnvironmentalDamageForStory(character, environmentType, intensity);
    
    if (envDamage.environmentalDamage > 0) {
        character.life = Math.max(0, character.life - envDamage.environmentalDamage);
    } else {
    }
}

// 2. BATTLE SYSTEM USAGE

import { getEnvironmentalEffectsForBattle } from './environmental.js';

// In your battle turn function:
function applyEnvironmentalEffectsToBattle(characters, environmentType, intensity, currentTurn) {
    characters.forEach(character => {
        const envEffects = getEnvironmentalEffectsForBattle(character, environmentType, intensity, currentTurn);
        
        // Apply all environmental effects
        if (envEffects.environmentalDamage > 0) {
            character.life = Math.max(0, character.life - envEffects.environmentalDamage);
        }
        
        if (envEffects.specialDamage > 0) {
            character.life = Math.max(0, character.life - envEffects.specialDamage);
        }
        
        // Use penalties for accuracy/speed calculations
        const speedPenalty = envEffects.speedPenalty;
        const accuracyPenalty = envEffects.accuracyPenalty;
    });
}

// 3. ADDING NEW ENVIRONMENTS

// To add a new environment, edit environmental-definitions.js:

/*
    desert: {
        name: "Desert",
        immuneType: "fire", // Characters immune to this environment
        effects: {
            damage: {
                intensityRanges: [
                    { min: 1, max: 4, value: 2 },
                    { min: 5, max: 7, value: 4 },
                    { min: 8, max: 10, value: 6 }
                ],
                description: "scorching heat"
            },
            statusEffect: {
                intensityRanges: [
                    { min: 1, max: 4, chance: 0, type: null },
                    { min: 5, max: 10, chance: 15, type: "dehydrated" }
                ]
            },
            accuracyPenalty: {
                intensityRanges: [
                    { min: 1, max: 4, value: 0.1 },
                    { min: 5, max: 7, value: 0.2 },
                    { min: 8, max: 10, value: 0.3 }
                ]
            }
        },
        protectionItems: [
            { name: "Sun Hat", protection: "partial" },
            { name: "Desert Robes", protection: "full" }
        ]
    }
*/

// 4. STORY NODE EXAMPLE

// In your story JSON, add environmental properties:
/*
{
    "id": "desert_crossing",
    "text": "You cross the scorching desert...",
    "environmentType": "desert",
    "intensity": 6,
    "choices": [
        {
            "text": "Continue forward",
            "next": "desert_oasis",
            "environmentalDamage": true  // This will apply environmental damage
        }
    ]
}
*/

// 5. CHECKING FOR PROTECTION ITEMS

import { checkEnvironmentalProtection } from './environmental.js';

function checkPlayerProtection(player, environmentType) {
    const protection = checkEnvironmentalProtection(player, environmentType);
    
    if (protection.isProtected) {
        return true;
    }
    return false;
}

// 6. GETTING ENVIRONMENT INFO

import { getAvailableEnvironments, getEnvironmentDisplayName } from './environmental.js';

// List all available environments
const environments = getAvailableEnvironments();

// Get display name for UI
const displayName = getEnvironmentDisplayName("volcanic");
