// Mount Ability - Enhanced version that works on allies and enemies with different effects
export const ability = {
    id: "mount",
    name: "Mount",
    type: "special",
    minDamage: 0, // Damage varies by size difference
    maxDamage: 0,
    accuracy: 95, // High accuracy for the attempt
    range: "close",
    speed: -2, // Slightly slower due to positioning requirements
    description: "Attempt to mount another creature. On allies: forms partnerships or takes weight damage. On enemies: forces mounting for dominance - mounted enemies cannot attack and must struggle to dismount each turn. Large size differences cause crushing damage instead.",
    
    // Mount ability can target both allies and enemies
    targetType: "any",
    
    // Special mount mechanics handled in combat-calculations.js
    specialMechanics: {
        usesAdvancedTargeting: true,
        requiresSpecialHandling: true,
        sizeBased: true,
        allyEnemyDifferent: true
    },
    
    // Different effects based on target relationship and size
    effects: {
        ally: {
            mount: "Forms mount partnership",
            mount_with_damage: "Mount succeeds but ally takes weight damage",
            crush: "Crushes small ally (pins them)"
        },
        enemy: {
            mount: "Forces enemy to become mount (chance-based)",
            evade: "Enemy dodges the mount attempt",
            crush: "Crushes small enemy (damages and pins)",
            fail: "Mount attempt fails due to size/weight"
        }
    },
    
    // Size difference determines effect
    sizeMechanics: {
        crusherSize: "2+ sizes larger",
        mountableSize: "0-1 sizes larger", 
        tooSmall: "smaller than target"
    },
    
    // Weight mechanics
    weightLimit: 0.6, // User must be less than 60% of target's weight for clean mount
    
    // Chance for enemy mounts (now strength-based)
    enemyMountChance: {
        base: 60,
        strengthModifier: 3, // +/- 3% per strength difference (force-based)
        minChance: 20,
        maxChance: 85
    },
    
    // Taming system for player mounting enemies
    tamingSystem: {
        enabled: true,
        baseStruggleThreshold: 3, // Base struggles needed for taming
        sizeModifier: 1, // +1 struggle per size difference (enemy larger)
        strengthModifier: 3, // +1 struggle per 3 strength difference (enemy stronger)
        maxStruggles: 8, // Maximum struggles needed
        dismountChance: {
            base: 40, // Base chance for enemy to dismount player
            strengthModifier: 5, // +/- 5% per strength difference
            sizeModifier: -10, // -10% if rider is larger
            weightModifier: -20, // Penalty for heavy rider
            minChance: 5,
            maxChance: 75
        }
    }
};
