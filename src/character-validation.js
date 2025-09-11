/**
 * Character Validation System
 * 
 * This module provides comprehensive validation for character objects
 * to ensure they have the required structure before performing calculations.
 */

/**
 * Validate that a character has the required primary attributes
 * @param {Object} character - Character object to validate
 * @param {Function} addLog - Optional logging function
 * @returns {boolean} Whether the character has valid primary attributes
 */
export function validatePrimaryAttributes(character, addLog = console.warn) {
    if (!character) {
        addLog('Character validation failed: character is null or undefined');
        return false;
    }

    if (!character.primary) {
        addLog(`Character validation failed: ${character.name || 'Unknown character'} missing primary attributes object`);
        return false;
    }

    const requiredPrimaryAttributes = [
        'strength', 'dexterity', 'constitution', 
        'intelligence', 'wisdom', 'charisma'
    ];

    const missingAttributes = [];
    const invalidAttributes = [];

    for (const attr of requiredPrimaryAttributes) {
        if (!(attr in character.primary)) {
            missingAttributes.push(attr);
        } else if (typeof character.primary[attr] !== 'number') {
            invalidAttributes.push(attr);
        }
    }

    if (missingAttributes.length > 0) {
        addLog(`Character validation failed: ${character.name || 'Unknown character'} missing primary attributes: ${missingAttributes.join(', ')}`);
        return false;
    }

    if (invalidAttributes.length > 0) {
        addLog(`Character validation failed: ${character.name || 'Unknown character'} has non-numeric primary attributes: ${invalidAttributes.join(', ')}`);
        return false;
    }

    return true;
}

/**
 * Validate that a character has the required secondary attributes structure
 * @param {Object} character - Character object to validate
 * @param {Function} addLog - Optional logging function
 * @returns {boolean} Whether the character has valid secondary attributes
 */
export function validateSecondaryAttributes(character, addLog = console.warn) {
    if (!character) {
        addLog('Character validation failed: character is null or undefined');
        return false;
    }

    if (!character.secondary) {
        addLog(`Character validation failed: ${character.name || 'Unknown character'} missing secondary attributes object`);
        return false;
    }

    const requiredSecondaryAttributes = [
        'maxLife', 'life', 'lifeRegen',
        'maxMp', 'mp', 'mpRegen',
        'maxStamina', 'stamina',
        'physicalDamage', 'magicDamage',
        'physicalDefense', 'magicDefense',
        'speed', 'accuracy'
    ];

    const missingAttributes = [];
    const invalidAttributes = [];

    for (const attr of requiredSecondaryAttributes) {
        if (!(attr in character.secondary)) {
            missingAttributes.push(attr);
        } else if (typeof character.secondary[attr] !== 'number') {
            invalidAttributes.push(attr);
        }
    }

    if (missingAttributes.length > 0) {
        addLog(`Character validation warning: ${character.name || 'Unknown character'} missing secondary attributes: ${missingAttributes.join(', ')} (will be initialized)`);
        // Initialize missing secondary attributes
        for (const attr of missingAttributes) {
            character.secondary[attr] = 0;
        }
    }

    if (invalidAttributes.length > 0) {
        addLog(`Character validation failed: ${character.name || 'Unknown character'} has non-numeric secondary attributes: ${invalidAttributes.join(', ')}`);
        return false;
    }

    return true;
}

/**
 * Validate character structure for equipment operations
 * @param {Object} character - Character object to validate
 * @param {Function} addLog - Optional logging function
 * @returns {boolean} Whether the character has valid equipment structure
 */
export function validateEquipmentStructure(character, addLog = console.warn) {
    if (!character) {
        addLog('Character validation failed: character is null or undefined');
        return false;
    }

    if (!character.equipment) {
        addLog(`Character validation warning: ${character.name || 'Unknown character'} missing equipment object (will be initialized)`);
        character.equipment = {
            body: null, legs: null, head: null, 
            foot: null, hand: null, weapon: null, mount: null
        };
    }

    return true;
}

/**
 * Comprehensive character validation for all operations
 * @param {Object} character - Character object to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.requirePrimary - Whether primary attributes are required
 * @param {boolean} options.requireSecondary - Whether secondary attributes are required
 * @param {boolean} options.requireEquipment - Whether equipment structure is required
 * @param {Function} addLog - Optional logging function
 * @returns {boolean} Whether the character passed all validations
 */
export function validateCharacter(character, options = {}, addLog = console.warn) {
    const {
        requirePrimary = true,
        requireSecondary = true,
        requireEquipment = false
    } = options;

    if (!character) {
        addLog('Character validation failed: character is null or undefined');
        return false;
    }

    if (!character.name) {
        addLog('Character validation warning: character missing name property');
        character.name = 'Unknown Character';
    }

    let isValid = true;

    if (requirePrimary) {
        isValid = validatePrimaryAttributes(character, addLog) && isValid;
    }

    if (requireSecondary) {
        isValid = validateSecondaryAttributes(character, addLog) && isValid;
    }

    if (requireEquipment) {
        isValid = validateEquipmentStructure(character, addLog) && isValid;
    }

    return isValid;
}

/**
 * Initialize missing character structure with default values
 * @param {Object} character - Character object to initialize
 * @param {Function} addLog - Optional logging function
 * @returns {Object} The character with initialized structure
 */
export function initializeCharacterStructure(character, addLog = console.warn) {
    if (!character) {
        addLog('Cannot initialize null or undefined character');
        return null;
    }

    // Initialize primary attributes if missing
    if (!character.primary) {
        addLog(`Initializing missing primary attributes for ${character.name || 'Unknown character'}`);
        character.primary = {
            strength: 5, dexterity: 5, constitution: 5,
            intelligence: 5, wisdom: 5, charisma: 5
        };
    }

    // Initialize secondary attributes if missing
    if (!character.secondary) {
        addLog(`Initializing missing secondary attributes for ${character.name || 'Unknown character'}`);
        character.secondary = {
            maxLife: 0, life: 0, lifeRegen: 0,
            maxMp: 0, mp: 0, mpRegen: 0,
            maxStamina: 0, stamina: 0,
            physicalDamage: 0, magicDamage: 0,
            physicalDefense: 0, magicDefense: 0,
            speed: 0, accuracy: 0
        };
    }

    // Initialize equipment structure if missing
    if (!character.equipment) {
        addLog(`Initializing missing equipment structure for ${character.name || 'Unknown character'}`);
        character.equipment = {
            body: null, legs: null, head: null,
            foot: null, hand: null, weapon: null, mount: null
        };
    }

    // Initialize status effects if missing
    if (!character.statusEffects) {
        character.statusEffects = [];
    }

    // Initialize linked characters if missing
    if (!character.linkedCharacters) {
        character.linkedCharacters = {
            linkedTo: [], trappedBy: [],
            mounting: null, mountedBy: null
        };
    }

    return character;
}

/**
 * Validate that character attributes are within reasonable bounds
 * @param {Object} character - Character object to validate
 * @param {Function} addLog - Optional logging function
 * @returns {boolean} Whether all attributes are within bounds
 */
export function validateAttributeBounds(character, addLog = console.warn) {
    if (!validatePrimaryAttributes(character, addLog)) {
        return false;
    }

    const warnings = [];
    const errors = [];

    // Check primary attributes bounds (typically 1-100, but allow flexibility)
    for (const [attr, value] of Object.entries(character.primary)) {
        if (value < 0) {
            errors.push(`${attr}: ${value} (cannot be negative)`);
        } else if (value > 1000) {
            warnings.push(`${attr}: ${value} (unusually high, possible error)`);
        }
    }

    // Check secondary attributes bounds
    if (character.secondary) {
        for (const [attr, value] of Object.entries(character.secondary)) {
            if (value < 0) {
                errors.push(`secondary.${attr}: ${value} (cannot be negative)`);
            }
        }
    }

    if (errors.length > 0) {
        addLog(`Character attribute bounds validation failed for ${character.name || 'Unknown character'}: ${errors.join(', ')}`);
        return false;
    }

    if (warnings.length > 0) {
        addLog(`Character attribute bounds warnings for ${character.name || 'Unknown character'}: ${warnings.join(', ')}`);
    }

    return true;
}

/**
 * Repair character structure by fixing common issues
 * @param {Object} character - Character object to repair
 * @param {Function} addLog - Optional logging function
 * @returns {Object} The repaired character
 */
export function repairCharacterStructure(character, addLog = console.warn) {
    if (!character) {
        addLog('Cannot repair null or undefined character');
        return null;
    }

    // Initialize missing structure
    character = initializeCharacterStructure(character, addLog);

    // Fix negative primary attributes
    for (const [attr, value] of Object.entries(character.primary)) {
        if (value < 0) {
            addLog(`Repairing negative primary attribute ${attr}: ${value} -> 1`);
            character.primary[attr] = 1;
        }
    }

    // Fix negative secondary attributes (except for defensive stats that can be negative)
    for (const [attr, value] of Object.entries(character.secondary)) {
        if (value < 0 && !['physicalDefense', 'magicDefense'].includes(attr)) {
            addLog(`Repairing negative secondary attribute ${attr}: ${value} -> 0`);
            character.secondary[attr] = 0;
        }
    }

    // Ensure current life doesn't exceed max life
    if (character.secondary.life > character.secondary.maxLife && character.secondary.maxLife > 0) {
        addLog(`Repairing life overflow: ${character.secondary.life} -> ${character.secondary.maxLife}`);
        character.secondary.life = character.secondary.maxLife;
    }

    // Ensure current mp doesn't exceed max mp
    if (character.secondary.mp > character.secondary.maxMp && character.secondary.maxMp > 0) {
        addLog(`Repairing mp overflow: ${character.secondary.mp} -> ${character.secondary.maxMp}`);
        character.secondary.mp = character.secondary.maxMp;
    }

    return character;
}
