// status.js

import { getStatusEffectInteraction } from './types.js';
import { 
    applySpecialEffects, 
    removeSpecialEffects, 
    applyBaseAttributeDebuff, 
    removeBaseAttributeDebuff,
    applySecondaryAttributeDebuff,
    removeSecondaryAttributeDebuff,
    DamageImmunitySystem,
    checkDamageImmunity,
    applyDamageWithImmunity,
    getDamageResistance,
    applyEnvironmentalDamage,
    calculateEnemyBasedStruggle,
    calculateStatusBasedStruggle,
    calculateStruggleWithStats,
    forcefulBreakFreeEffect,
    checkTrapRelease,
    isCharacterFlying,
    handleDivingAttack,
    handleFlyingRangedHit,
    checkFlyingImmunity,
    removeFlyingStatus
} from './special-effects.js';

export const StatusRegistry = {};

// Centralized buff tracking system
export const BuffRegistry = {
    activeBuffs: new Map(), // Map of target -> Map of buffTag -> buffData

    /**
     * Apply a buff to a target
     */
    applyBuff(caster, target, abilityConfig, addLog = () => { }) {
        const { name, statusTag, statusDesc, effects, turns, durationType } = abilityConfig;

        // Ensure target has statusEffects array for UI display
        if (!target.statusEffects) {
            target.statusEffects = [];
        }

        // Ensure target has a buff map
        if (!this.activeBuffs.has(target)) {
            this.activeBuffs.set(target, new Map());
        }

        const targetBuffs = this.activeBuffs.get(target);

        // Check if buff is already active
        if (targetBuffs.has(statusTag)) {
            // Refresh the existing buff
            const existingBuff = targetBuffs.get(statusTag);
            existingBuff.turnsLeft = turns;
            existingBuff.durationType = durationType || "turns";

            // Update the statusEffects array
            const statusIndex = target.statusEffects.findIndex(effect => effect.statusTag === statusTag);
            if (statusIndex >= 0) {
                target.statusEffects[statusIndex].duration = turns;
                target.statusEffects[statusIndex].durationType = durationType || "turns";
            }

            addLog(`${target.name || 'Target'}'s ${statusDesc || name} effect refreshed!`);
            return true;
        }

        // Apply the special effects
        const appliedEffects = applySpecialEffects(target, effects, addLog);

        // Handle trapped flag for trapping statuses
        if (abilityConfig.isTrapped) {
            target.isTrapped = true;
        }

        // Store the buff data
        const buffData = {
            effect: appliedEffects,
            turnsLeft: turns,
            abilityName: name,
            statusDesc: statusDesc || name,
            caster: caster,
            durationType: durationType || "turns",
            isTrapped: abilityConfig.isTrapped || false
        };

        targetBuffs.set(statusTag, buffData);
        // Note: Removed legacy activeBoosts system - only using BuffRegistry now

        // Add to statusEffects array for UI display
        target.statusEffects.push({
            statusTag: statusTag,
            type: effects?.baseAttributeDebuffs ? 'debuff' : 'buff',
            description: statusDesc || name,
            duration: turns,
            durationType: durationType || "turns",
            source: name,
            attributeName: effects?.baseAttributeBoosts?.[0]?.attribute || effects?.baseAttributeDebuffs?.[0]?.attribute,
            amount: effects?.baseAttributeBoosts?.[0]?.amount || effects?.baseAttributeDebuffs?.[0]?.amount
        });

        addLog(`${target.name || 'Target'} is ${statusDesc || name}!`);
        return true;
    },

    /**
     * Remove a buff from a target
     */
    removeBuff(target, buffTag, addLog = () => { }) {
        // Ensure addLog is a function
        if (typeof addLog !== 'function') {
            addLog = () => { };
        }

        const targetBuffs = this.activeBuffs.get(target);
        if (!targetBuffs || !targetBuffs.has(buffTag)) {
            return false;
        }

        const buffData = targetBuffs.get(buffTag);

        // Remove the special effects
        if (buffData.effect) {
            removeSpecialEffects(buffData.effect, addLog);
        }

        // Handle trapped flag removal
        if (buffData.isTrapped) {
            // Update trapped flag after removing this status
            TrappedSystem.updateTrappedFlag(target);
        }

        // Remove from tracking
        targetBuffs.delete(buffTag);
        // Note: Removed legacy activeBoosts cleanup - only using BuffRegistry now

        // Remove from statusEffects array
        if (target.statusEffects) {
            target.statusEffects = target.statusEffects.filter(effect => effect.statusTag !== buffTag);
        }

        // Clean up empty maps
        if (targetBuffs.size === 0) {
            this.activeBuffs.delete(target);
        }

        addLog(`${target.name || 'Target'}'s ${buffData.statusDesc} effect has worn off.`);
        return true;
    },

    /**
     * Tick all buffs for a target (called each turn)
     */
    tickBuffs(target, addLog = () => { }) {
        // Ensure addLog is a function
        if (typeof addLog !== 'function') {
            addLog = () => { };
        }

        const targetBuffs = this.activeBuffs.get(target);
        if (!targetBuffs) {
            return;
        }

        const expiredBuffs = [];

        // Process each buff
        for (const [buffTag, buffData] of targetBuffs) {
            // Check duration type - only tick down "turns" type buffs
            const durationType = buffData.durationType || "turns";

            if (durationType === "turns") {
                buffData.turnsLeft--;

                // Update statusEffects array as well
                if (target.statusEffects) {
                    const statusIndex = target.statusEffects.findIndex(effect => effect.statusTag === buffTag);
                    if (statusIndex >= 0) {
                        target.statusEffects[statusIndex].duration = buffData.turnsLeft;
                    }
                }

                if (buffData.turnsLeft <= 0) {
                    expiredBuffs.push(buffTag);
                } else {
                }
            } else if (durationType === "permanent") {
                // Permanent buffs don't tick down
            } else if (durationType === "conditional") {
                // Conditional buffs need specific conditions to be removed
            }
        }

        // Remove expired buffs
        expiredBuffs.forEach(buffTag => this.removeBuff(target, buffTag, addLog));
    },

    /**
     * Clear all buffs from a target
     */
    clearAllBuffs(target, addLog = () => { }) {
        const targetBuffs = this.activeBuffs.get(target);
        if (!targetBuffs) {
            return;
        }

        const buffTags = Array.from(targetBuffs.keys());
        buffTags.forEach(buffTag => this.removeBuff(target, buffTag, addLog));
    },

    /**
     * Get summary of all active buffs for a target
     */
    getBuffSummary(target) {
        const targetBuffs = this.activeBuffs.get(target);
        if (!targetBuffs || targetBuffs.size === 0) {
            return [];
        }

        return Array.from(targetBuffs.values()).map(buffData => {
            const durationType = buffData.durationType || "turns";
            let duration = '';

            if (durationType === "turns" && buffData.turnsLeft > 0) {
                duration = ` (${buffData.turnsLeft})`;
            } else if (durationType === "permanent") {
                duration = ' (∞)';
            } else if (durationType === "conditional") {
                duration = ' (!)';
            }

            return `${buffData.statusDesc}${duration}`;
        });
    },

    /**
     * Check if a specific buff is active
     */
    isBuffActive(target, buffTag) {
        const targetBuffs = this.activeBuffs.get(target);
        return targetBuffs ? targetBuffs.has(buffTag) : false;
    }
};

// Centralized Damage over Time (DoT) tracking system
export const DoTRegistry = {
    activeDots: new Map(), // Map of target -> Map of dotTag -> dotData

    /**
     * Apply a DoT effect using a status definition
     */
    applyDoTFromDefinition(caster, target, statusDef, addLog = () => {}) {
        // Check immunity first
        if (this.checkDoTImmunity(target, statusDef)) {
            addLog(`${target.name || 'Target'} is immune to ${statusDef.statusDesc}!`);
            return false;
        }

        // Handle stacking rules
        if (!statusDef.stackable && this.isDotActive(target, statusDef.statusTag)) {
            if (statusDef.refreshable) {
                // Refresh existing effect
                return this.applyDoT(caster, target, statusDef, addLog);
            } else {
                addLog(`${target.name || 'Target'} already has ${statusDef.statusDesc}!`);
                return false;
            }
        }

        // Handle stacking for stackable effects
        if (statusDef.stackable) {
            const stackCount = this.getDoTStackCount(target, statusDef.statusTag);
            if (stackCount >= (statusDef.maxStacks || 5)) {
                addLog(`${target.name || 'Target'} cannot have more ${statusDef.statusDesc} effects!`);
                return false;
            }
            
            // Create unique tag for stack
            const stackTag = `${statusDef.statusTag}_${stackCount + 1}`;
            const stackedDef = { ...statusDef, statusTag: stackTag };
            return this.applyDoT(caster, target, stackedDef, addLog);
        }

        // Apply the DoT effect
        return this.applyDoT(caster, target, statusDef, addLog);
    },

    /**
     * Check if target is immune to a DoT effect
     */
    checkDoTImmunity(target, statusDef) {
        if (!target.type || !statusDef.immuneTypes) return false;
        return statusDef.immuneTypes.includes(target.type);
    },

    /**
     * Get the number of stacks of a specific DoT
     */
    getDoTStackCount(target, baseStatusTag) {
        const targetDots = this.activeDots.get(target);
        if (!targetDots) return 0;

        let stackCount = 0;
        for (const [statusTag] of targetDots.entries()) {
            if (statusTag.startsWith(baseStatusTag)) {
                stackCount++;
            }
        }
        return stackCount;
    },

    /**
     * Apply a DoT effect to a target
     */
    applyDoT(caster, target, dotConfig, addLog = () => {}) {
        const { name, statusTag, statusDesc, damage, damageType, turns, durationType } = dotConfig;

        // Check if target is immune to this DoT type
        if (DamageImmunitySystem.isImmuneToDamage(target, damageType || 'neutral', 'status_application', addLog)) {
            addLog(`${target.name || 'Target'} is immune to ${statusDesc || name} effects!`);
            return false; // DoT not applied due to immunity
        }

        // Ensure target has statusEffects array for UI display
        if (!target.statusEffects) {
            target.statusEffects = [];
        }

        // Ensure target has a DoT map
        if (!this.activeDots.has(target)) {
            this.activeDots.set(target, new Map());
        }

        const targetDots = this.activeDots.get(target);

        // Check if DoT is already active
        if (targetDots.has(statusTag)) {
            // Refresh the existing DoT
            const existingDoT = targetDots.get(statusTag);
            existingDoT.turnsLeft = turns;
            existingDoT.damage = damage; // Update damage in case it's different
            existingDoT.durationType = durationType || "turns";

            // Update the statusEffects array
            const statusIndex = target.statusEffects.findIndex(effect => effect.statusTag === statusTag);
            if (statusIndex >= 0) {
                target.statusEffects[statusIndex].duration = turns;
                target.statusEffects[statusIndex].durationType = durationType || "turns";
            }

            addLog(`${target.name || 'Target'}'s ${statusDesc || name} effect refreshed!`);
            return true;
        }

        // Create new DoT effect
        const dotData = {
            name: name,
            statusTag: statusTag,
            statusDesc: statusDesc,
            damage: damage,
            damageType: damageType || 'neutral',
            turnsLeft: turns,
            durationType: durationType || "turns",
            caster: caster,
            statusDef: dotConfig.statusDef || null // Store the full status definition for resistance checks
        };

        // Add to DoT registry
        targetDots.set(statusTag, dotData);

        // Add to statusEffects array for UI display
        target.statusEffects.push({
            name: name,
            statusTag: statusTag,
            description: statusDesc,
            duration: turns,
            durationType: durationType || "turns",
            type: 'dot'
        });

        addLog(`${target.name || 'Target'} is now affected by ${statusDesc || name}!`);

        return true;
    },

    /**
     * Tick all DoT effects for a target (call this each turn)
     */
    tickDots(target, addLog = () => {}) {
        const targetDots = this.activeDots.get(target);
        if (!targetDots || targetDots.size === 0) {
            return;
        }

        const dotsToRemove = [];

        for (const [statusTag, dotData] of targetDots.entries()) {
            // Apply damage
            const damageDealt = this.applyDotDamage(target, dotData, addLog);

            // Decrease duration
            dotData.turnsLeft--;

            // Update UI display
            const statusIndex = target.statusEffects.findIndex(effect => effect.statusTag === statusTag);
            if (statusIndex >= 0) {
                target.statusEffects[statusIndex].duration = dotData.turnsLeft;
            }

            // Mark for removal if expired
            if (dotData.turnsLeft <= 0) {
                dotsToRemove.push(statusTag);
            }
        }

        // Remove expired DoTs
        dotsToRemove.forEach(statusTag => {
            this.removeDoT(target, statusTag, addLog);
        });
    },

    /**
     * Apply damage from a DoT effect, considering type effectiveness and resistances
     */
    applyDotDamage(target, dotData, addLog = () => {}) {
        let damage = dotData.damage;

        // Check for damage immunity first
        if (DamageImmunitySystem.isImmuneToDamage(target, dotData.damageType, 'status_dot', addLog)) {
            return 0; // No damage dealt due to immunity
        }

        // Apply status-specific resistance/vulnerability modifiers
        if (target.type && dotData.statusDef) {
            if (dotData.statusDef.resistantTypes && dotData.statusDef.resistantTypes.includes(target.type)) {
                damage = Math.round(damage * 0.5); // 50% damage
                addLog(`${target.name || 'Target'} resists the ${dotData.statusDesc}!`);
            } else if (dotData.statusDef.vulnerableTypes && dotData.statusDef.vulnerableTypes.includes(target.type)) {
                damage = Math.round(damage * 1.5); // 150% damage
                addLog(`${target.name || 'Target'} is vulnerable to ${dotData.statusDesc}!`);
            }
        }

        // Apply damage reduction from resistances (not immunity)
        damage = DamageImmunitySystem.calculateDamageReduction(target, dotData.damageType, damage, 'status_dot', addLog);

        // Apply general type effectiveness if target has a type
        if (target.type && dotData.damageType !== 'neutral') {
            try {
                // Import type effectiveness calculation
                import('./types.js').then(({ calculateTypeEffectiveness }) => {
                    const effectiveness = calculateTypeEffectiveness(dotData.damageType, target.type);
                    if (effectiveness !== 1.0) {
                        damage = Math.round(damage * effectiveness);
                        const effectText = effectiveness > 1 ? 'Super effective!' : effectiveness < 1 ? 'Not very effective...' : '';
                        if (effectText) addLog(effectText);
                    }
                }).catch(() => {
                    // If type system not available, use base damage
                });
            } catch (error) {
                // Fallback to base damage if type system unavailable
            }
        }

        // Ensure minimum damage
        damage = Math.max(1, damage);

        // Apply damage
        target.life = Math.max(0, target.life - damage);

        // Log the damage with visual enhancements
        const icon = dotData.statusDef?.icon || '';
        const damageTypeText = dotData.damageType !== 'neutral' ? ` (${dotData.damageType})` : '';
        addLog(`${icon} ${target.name || 'Target'} takes ${damage}${damageTypeText} damage from ${dotData.statusDesc || dotData.name}!`);

        return damage;
    },

    /**
     * Remove a DoT effect from a target
     */
    removeDoT(target, statusTag, addLog = () => {}) {
        const targetDots = this.activeDots.get(target);
        if (!targetDots || !targetDots.has(statusTag)) {
            return false;
        }

        const dotData = targetDots.get(statusTag);
        targetDots.delete(statusTag);

        // Remove from statusEffects array
        if (target.statusEffects) {
            const statusIndex = target.statusEffects.findIndex(effect => effect.statusTag === statusTag);
            if (statusIndex >= 0) {
                target.statusEffects.splice(statusIndex, 1);
            }
        }

        // Clean up empty map
        if (targetDots.size === 0) {
            this.activeDots.delete(target);
        }

        addLog(`${target.name || 'Target'} is no longer affected by ${dotData.statusDesc || dotData.name}!`);
        return true;
    },

    /**
     * Get a summary of all active DoT effects for a target
     */
    getDotSummary(target) {
        const targetDots = this.activeDots.get(target);
        if (!targetDots || targetDots.size === 0) {
            return [];
        }

        return Array.from(targetDots.values()).map(dotData => {
            const duration = dotData.durationType === "permanent" ? "" : ` (${dotData.turnsLeft} turns)`;
            return `${dotData.statusDesc}${duration}`;
        });
    },

    /**
     * Check if a specific DoT is active
     */
    isDotActive(target, statusTag) {
        const targetDots = this.activeDots.get(target);
        return targetDots ? targetDots.has(statusTag) : false;
    }
};

/**
 * Simplified function to apply ability-based effects (buffs and debuffs)
 * This is what abilities will use instead of complex logic
 */
export function applyEffects(caster, target, abilityConfig, addLog = () => { }) {
    const result = BuffRegistry.applyBuff(caster, target, abilityConfig, addLog);
    return result;
}

/**
 * Simplified function to apply DoT effects from status definitions
 * This is what abilities will use for damage over time effects
 */
export function applyDoTEffect(caster, target, dotConfig, addLog = () => {}) {
    const result = DoTRegistry.applyDoT(caster, target, dotConfig, addLog);
    return result;
}

/**
 * Apply DoT effect using a status definition from StatusRegistry
 */
export function applyStatusDoT(caster, target, statusId, addLog = () => {}) {
    const statusDef = StatusRegistry[statusId];
    if (!statusDef || statusDef.type !== 'dot') {
        addLog(`Status ${statusId} not found or not a DoT effect!`);
        return false;
    }

    // Use the enhanced function that handles immunity, stacking, etc.
    return DoTRegistry.applyDoTFromDefinition(caster, target, { ...statusDef, statusDef }, addLog);
}

/**
 * Tick all active buffs for a target
 */
export function tickActiveBuffs(target, addLog = () => { }) {
    BuffRegistry.tickBuffs(target, addLog);
}

/**
 * Tick all active DoT effects for a target
 */
export function tickActiveDots(target, addLog = () => {}) {
    DoTRegistry.tickDots(target, addLog);
}

/**
 * Check if a specific buff is active
 */
export function isBuffActive(target, buffTag) {
    return BuffRegistry.isBuffActive(target, buffTag);
}

/**
 * Check if a specific DoT effect is active on a target
 */
export function isDotActive(target, dotTag) {
    return DoTRegistry.isDotActive(target, dotTag);
}

/**
 * Dynamically loads all statuses from a manifest.
 */
export async function loadStatuses(statusManifest, statusBasePath = "../story-content/story01-battle-st/statuses/") {
    if (!Array.isArray(statusManifest)) {
        throw new TypeError('statusManifest must be an array');
    }

    for (let status of statusManifest) {
        try {
            const statusModule = await import(`${statusBasePath}${status.file}`);
            StatusRegistry[status.id] = statusModule.default;
        } catch (e) {
            console.error(`Failed to load status: ${status.file}`, e);
        }
    }
}

/**
 * Apply a status effect to a character with type interaction support
 */
export function applyStatus(target, statusId, duration = 3, addLog = () => { }) {
    if (!target.status) {
        target.status = {};
    }

    const statusDef = StatusRegistry[statusId];
    if (!statusDef) {
        console.error(`Status effect '${statusId}' not found in registry`);
        return false;
    }

    // Handle type interactions
    if (target.type && statusDef.elementalType) {
        const interaction = getStatusEffectInteraction(statusDef.elementalType, target.type);
        if (interaction === 'immune') {
            addLog(`${target.name} is immune to ${statusId}!`);
            return false;
        } else if (interaction === 'resist') {
            duration = Math.max(1, Math.floor(duration / 2));
            addLog(`${target.name} resists ${statusId} (reduced duration)!`);
        } else if (interaction === 'vulnerable') {
            duration = Math.floor(duration * 1.5);
            addLog(`${target.name} is vulnerable to ${statusId} (increased duration)!`);
        }
    }

    // Apply the status
    target.status[statusId] = duration;

    if (statusDef.apply) {
        statusDef.apply(target, addLog);
    }

    addLog(`${target.name} is affected by ${statusId}!`);
    return true;
}

/**
 * Check if a status effect is active on a character
 */
export function isStatusActive(target, statusId) {
    return target.status && target.status[statusId] && target.status[statusId] > 0;
}

/**
 * Update all status effects for a character (called each turn)
 */
export function updateStatuses(target, addLog = () => { }) {
    // Handle the new buff system first
    BuffRegistry.tickBuffs(target, addLog);
    
    // Handle DoT effects
    DoTRegistry.tickDots(target, addLog);

    // Then handle legacy status effects if they exist
    if (target.status) {
        for (const [statusId, statusValue] of Object.entries(target.status)) {
            const statusDef = StatusRegistry[statusId];
            if (!statusDef) continue;

            // Update status effect
            if (statusDef.update) {
                statusDef.update(target, addLog);
            }

            // Handle turn counting for non-permanent effects
            if (typeof statusValue === 'number') {
                target.status[statusId] = Math.max(0, statusValue - 1);

                if (target.status[statusId] === 0) {
                    delete target.status[statusId];
                    if (statusDef.remove) {
                        statusDef.remove(target, addLog);
                    }
                }
            }
        }
    }
}

/**
 * Get a summary string of all active status effects
 */
export function statusSummary(target) {
    const legacyStatuses = [];
    const buffStatuses = BuffRegistry.getBuffSummary(target);
    const dotStatuses = DoTRegistry.getDotSummary(target);

    // Get legacy status effects
    if (target.status) {
        const activeStatuses = Object.keys(target.status)
            .filter(statusId => isStatusActive(target, statusId))
            .map(statusId => {
                const statusDef = StatusRegistry[statusId];
                return statusDef && statusDef.summary ? statusDef.summary(target) : statusId;
            });
        legacyStatuses.push(...activeStatuses);
    }

    // Combine all systems
    const allStatuses = [...legacyStatuses, ...buffStatuses, ...dotStatuses];
    return allStatuses.length > 0 ? allStatuses.join(', ') : 'No status effects';
}

// ============================================================================
// TRAPPED STATUS SYSTEM
// ============================================================================

/**
 * Centralized system for handling trapped/restrained statuses
 * This includes pinned, frozen, webbed, paralyzed, etc.
 */
export const TrappedSystem = {
    /**
     * Check if a character is currently trapped by any status effect
     */
    isTrapped(character) {
        if (!character.statusEffects) return false;

        // Check modern status effects
        for (const status of character.statusEffects) {
            if (status.isTrapped || status.statusTag === 'pinned') {
                return true;
            }
        }

        // Check legacy status effects
        if (character.status) {
            for (const [statusId, data] of Object.entries(character.status)) {
                if (isStatusActive(character, statusId)) {
                    const statusDef = StatusRegistry[statusId];
                    if (statusDef && (statusDef.isTrapped || statusDef.canStruggle)) {
                        return true;
                    }
                }
            }
        }

        return false;
    },

    /**
     * Get the primary trapping status affecting the character
     */
    getPrimaryTrappingStatus(character) {
        if (!character.statusEffects) return null;

        // Check modern status effects first
        for (const status of character.statusEffects) {
            if (status.isTrapped || status.statusTag === 'pinned') {
                return {
                    type: 'modern',
                    status: status,
                    statusId: status.statusTag
                };
            }
        }

        // Check legacy status effects
        if (character.status) {
            for (const [statusId, data] of Object.entries(character.status)) {
                if (isStatusActive(character, statusId)) {
                    const statusDef = StatusRegistry[statusId];
                    if (statusDef && (statusDef.isTrapped || statusDef.canStruggle)) {
                        return {
                            type: 'legacy',
                            status: statusDef,
                            statusId: statusId,
                            data: data
                        };
                    }
                }
            }
        }

        return null;
    },

    /**
     * Attempt to break free from a trapping status
     */
    attemptBreakFree(character, opponent = null, addLog = () => {}) {
        const trappingInfo = this.getPrimaryTrappingStatus(character);
        if (!trappingInfo) {
            addLog(`${character.name} is not trapped!`);
            return false;
        }

        const { status, statusId } = trappingInfo;

        // Use the enhanced struggle calculation that considers usesEnemyStats
        const success = this.calculateStruggleWithStats(character, opponent, status, addLog);
        if (success) {
            this.removeTrappingStatus(character, statusId, addLog);
            character.isTrapped = false;
        }
        return success;
    },

    /**
     * Calculate struggle success against enemy stats (pinned-style)
     */
    calculateEnemyBasedStruggle(character, opponent, status, addLog = () => {}) {
        return calculateEnemyBasedStruggle(character, opponent, status, addLog);
    },

    /**
     * Calculate struggle success against status difficulty (freeze/sleep-style)
     */
    calculateStatusBasedStruggle(character, status, addLog = () => {}) {
        return calculateStatusBasedStruggle(character, status, addLog);
    },

    /**
     * Remove a trapping status from the character
     */
    removeTrappingStatus(character, statusId, addLog = () => {}) {
        // Try modern status effects first
        if (character.statusEffects) {
            const index = character.statusEffects.findIndex(s => s.statusTag === statusId);
            if (index >= 0) {
                const status = character.statusEffects[index];
                character.statusEffects.splice(index, 1);
                
                // Call remove function if it exists
                const statusDef = StatusRegistry[statusId];
                if (statusDef && statusDef.remove) {
                    statusDef.remove(character, addLog);
                }
                return true;
            }
        }

        // Try legacy status effects
        if (character.status && character.status[statusId]) {
            const statusDef = StatusRegistry[statusId];
            if (statusDef && statusDef.remove) {
                statusDef.remove(character, addLog);
            }
            delete character.status[statusId];
            return true;
        }

        return false;
    },

    /**
     * Apply trapped flag to character when a trapping status is applied
     */
    applyTrappedFlag(character, statusId) {
        const statusDef = StatusRegistry[statusId];
        if (statusDef && (statusDef.isTrapped || statusDef.canStruggle)) {
            character.isTrapped = true;
        }
    },

    /**
     * Remove trapped flag if no trapping statuses remain
     */
    updateTrappedFlag(character) {
        character.isTrapped = this.isTrapped(character);
    },

    /**
     * Handle forceful break free when pinned character successfully hits an attack
     * This automatically removes pinned status and may apply effects to opponent
     */
    forcefulBreakFree(attacker, target, addLog = () => {}, applyStatusFunction = null) {
        const trappingInfo = this.getPrimaryTrappingStatus(attacker);
        if (!trappingInfo || trappingInfo.statusId !== 'pinned') {
            return false; // Only works for pinned status
        }

        addLog(`${attacker.name} breaks free from the pin with a powerful attack!`);
        
        // Remove pinned status
        this.removeTrappingStatus(attacker, 'pinned', addLog);
        attacker.isTrapped = false;

        // Use the imported function for the effect
        forcefulBreakFreeEffect(attacker, target, addLog, applyStatusFunction);

        return true;
    },

    /**
     * Check if pinned status should end when opponent attacks without maintaining pin
     */
    checkPinRelease(ability, target, addLog = () => {}) {
        const trappingInfo = this.getPrimaryTrappingStatus(target);
        if (!trappingInfo || trappingInfo.statusId !== 'pinned') {
            return false; // Only applies to pinned status
        }

        // Use the imported function for the check
        const shouldRelease = checkTrapRelease(ability, target, addLog);
        if (shouldRelease) {
            this.removeTrappingStatus(target, 'pinned', addLog);
            target.isTrapped = false;
            return true;
        }

        return false;
    },

    /**
     * Enhanced struggle calculation that considers usesEnemyStats property
     */
    calculateStruggleWithStats(character, opponent, statusDef, addLog = () => {}) {
        return calculateStruggleWithStats(character, opponent, statusDef, addLog);
    }
};

// ============================================================================
// CONVENIENCE FUNCTIONS FOR TRAPPED SYSTEM
// ============================================================================

/**
 * Check if character is trapped (for UI button changes)
 */
export function isCharacterTrapped(character) {
    return TrappedSystem.isTrapped(character);
}

/**
 * Attempt to break free from any trapping status
 */
export function attemptBreakFree(character, opponent = null, addLog = () => {}) {
    return TrappedSystem.attemptBreakFree(character, opponent, addLog);
}

/**
 * Apply trapped flag when applying a status
 */
export function applyTrappedFlag(character, statusId) {
    TrappedSystem.applyTrappedFlag(character, statusId);
}

/**
 * Update trapped flag after status changes
 */
export function updateTrappedFlag(character) {
    TrappedSystem.updateTrappedFlag(character);
}

/**
 * Handle forceful break free when pinned character hits an attack
 * Use this in battle system when pinned character successfully attacks
 */
export function forcefulBreakFree(attacker, target, addLog = () => {}, applyStatusFunction = null) {
    return TrappedSystem.forcefulBreakFree(attacker, target, addLog, applyStatusFunction);
}

/**
 * Check if pinned status should be released when opponent attacks
 * Use this in battle system when opponent attacks pinned character
 */
export function checkPinRelease(ability, target, addLog = () => {}) {
    return TrappedSystem.checkPinRelease(ability, target, addLog);
}

/**
 * Check if a character is stunned (prevents action)
 */
export function isCharacterStunned(character) {
    // Check modern buff system
    if (BuffRegistry.isBuffActive(character, 'stunned')) {
        return true;
    }
    
    // Check legacy status system for backward compatibility
    if (isStatusActive(character, 'stunned')) {
        return true;
    }
    
    return false;
}

/**
 * Check if a character can act (not stunned or affected by action-preventing statuses)
 */
export function canCharacterAct(character) {
    // Check if stunned
    if (isCharacterStunned(character)) {
        return false;
    }
    
    // Check other action-preventing statuses
    if (isStatusActive(character, 'frozen')) {
        return false;
    }
    
    // Check modern buff system for any status with preventsAction
    if (character.statusEffects) {
        for (const status of character.statusEffects) {
            const statusDef = StatusRegistry[status.statusTag];
            if (statusDef && statusDef.preventsAction) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Apply stunned status using the simplified data definition
 */
export function applyStunnedStatus(caster, target, addLog = () => {}) {
    
    const statusDef = StatusRegistry['stunned'];
    if (!statusDef) {
        console.error('❌ Stunned status definition not found in StatusRegistry!');
        addLog('Stunned status definition not found!');
        return false;
    }


    // Handle both old and new status formats
    let stunnedConfig;
    
    if (statusDef.version === '2.0' || statusDef.statusTag) {
        // New format - use as is
        stunnedConfig = {
            name: statusDef.name,
            statusTag: statusDef.statusTag,
            statusDesc: statusDef.statusDesc,
            effects: statusDef.effects,
            turns: statusDef.turns,
            durationType: statusDef.durationType,
            preventsAction: statusDef.preventsAction
        };
    } else {
        // Old format - convert to new format
        stunnedConfig = {
            name: statusDef.name || 'Stunned',
            statusTag: 'stunned',
            statusDesc: 'Stunned',
            effects: {
                baseAttributeBoosts: [],
                baseAttributeDebuffs: [],
                secondaryAttributeBoosts: [],
                secondaryAttributeDebuffs: [],
                percentageAttributeBoosts: []
            },
            turns: 1,
            durationType: 'turns',
            preventsAction: true
        };
    }

    return applyEffects(caster, target, stunnedConfig, addLog);
}

/**
 * Apply pinned status using the simplified data definition
 */
export function applyPinnedStatus(caster, target, addLog = () => {}) {
    const statusDef = StatusRegistry['pinned'];
    if (!statusDef) {
        console.error('❌ Pinned status definition not found in StatusRegistry!');
        addLog('Pinned status definition not found!');
        return false;
    }

    const pinnedConfig = {
        name: statusDef.name,
        statusTag: statusDef.statusTag,
        statusDesc: statusDef.statusDesc,
        effects: statusDef.effects,
        turns: statusDef.turns,
        durationType: statusDef.durationType,
        isTrapped: statusDef.isTrapped
    };

    return applyEffects(caster, target, pinnedConfig, addLog);
}

// ============================================================================
// RE-EXPORTS FROM SPECIAL-EFFECTS.JS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Re-export the immunity and damage functions for backward compatibility
export { 
    DamageImmunitySystem,
    checkDamageImmunity,
    applyDamageWithImmunity,
    getDamageResistance,
    applyEnvironmentalDamage
} from './special-effects.js';

// ============================================================================
// FLYING STATUS CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Check if character is currently flying
 */
export function isFlying(character) {
    return isCharacterFlying(character);
}

/**
 * Handle diving attack when flying character uses close/physical attack
 * Use this in battle system when calculating attack damage
 */
export function processDivingAttack(attacker, target, ability, baseDamage, addLog = () => {}) {
    const result = handleDivingAttack(attacker, target, ability, baseDamage, addLog);
    
    // If it was a diving attack, remove flying status
    if (result.shouldRemoveFlying) {
        removeFlyingStatus(attacker, addLog);
    }
    
    return result;
}

/**
 * Handle flying character being hit by ranged attack
 * Use this in battle system when applying damage to flying targets
 */
export function processFlyingRangedHit(target, ability, addLog = () => {}) {
    const result = handleFlyingRangedHit(target, ability, addLog);
    
    // If character should fall, remove flying status
    if (result.shouldRemoveFlying) {
        removeFlyingStatus(target, addLog);
    }
    
    return result;
}

/**
 * Check if flying character should be immune to an attack
 * Use this in battle system before applying damage
 */
export function checkFlyingAttackImmunity(target, ability, addLog = () => {}) {
    return checkFlyingImmunity(target, ability, addLog);
}

/**
 * Apply flying status using the simplified data definition
 */
export function applyFlyingStatus(caster, target, addLog = () => {}) {
    const statusDef = StatusRegistry['flying'];
    if (!statusDef) {
        addLog('Flying status not found in registry!');
        return false;
    }

    const flyingConfig = {
        name: statusDef.name,
        statusTag: statusDef.statusTag,
        statusDesc: statusDef.statusDesc,
        effects: statusDef.effects,
        turns: statusDef.turns,
        durationType: statusDef.durationType
    };

    return applyEffects(caster, target, flyingConfig, addLog);
}
