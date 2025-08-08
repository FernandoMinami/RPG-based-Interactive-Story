/**
 * Story-Specific Type Effectiveness Test Suite
 * 
 * Dynamically loads and tests type systems from specific stories
 */

import { TestRunner } from './test-framework.js';

class StoryTypeEffectivenessTests {
    constructor(storyFolder) {
        this.runner = new TestRunner();
        this.storyFolder = storyFolder;
        this.storyTypes = {};
        this.typeList = [];
    }

    async initialize() {
        await this.loadStoryTypes();
        this.generateDynamicTests();
    }

    async loadStoryTypes() {
        try {
            // Load types manifest
            const manifestUrl = `../../story-content/${this.storyFolder}/types/_types.json?v=${Date.now()}`;
            const typeManifest = await fetch(manifestUrl).then(res => res.json());
            
            console.log(`📚 Loading ${typeManifest.length} types from ${this.storyFolder}...`);
            
            // Load each type file
            for (const typeInfo of typeManifest) {
                const typeUrl = `../../story-content/${this.storyFolder}/types/${typeInfo.file}?v=${Date.now()}`;
                const typeData = await fetch(typeUrl).then(res => res.json());
                this.storyTypes[typeData.id] = typeData;
                this.typeList.push(typeData.id);
            }
            
            console.log(`✅ Loaded types: ${this.typeList.join(', ')}`);
            
            // Mock the types system for testing
            window.testTypeData = this.storyTypes;
            
        } catch (error) {
            console.error(`❌ Error loading types from ${this.storyFolder}:`, error);
            throw new Error(`Failed to load type system from story: ${this.storyFolder}`);
        }
    }

    generateDynamicTests() {
        console.log(`🔄 Generating dynamic tests for ${this.typeList.length} types...`);
        
        // Generate all vs all type matchup tests
        this.typeList.forEach(attackerType => {
            this.typeList.forEach(defenderType => {
                const testName = `${this.capitalize(attackerType)} vs ${this.capitalize(defenderType)}`;
                this.runner.test(testName, () => this.testTypeMatchup(attackerType, defenderType));
            });
        });
        
        // Generate immunity tests
        this.typeList.forEach(typeId => {
            const typeData = this.storyTypes[typeId];
            if (typeData.combatProperties && typeData.combatProperties.immunities && typeData.combatProperties.immunities.length > 0) {
                this.runner.test(`${this.capitalize(typeId)} Immunity Tests`, () => this.testImmunities(typeId));
            }
        });
        
        // Generate resistance tests
        this.typeList.forEach(typeId => {
            const typeData = this.storyTypes[typeId];
            if (typeData.combatProperties && typeData.combatProperties.resistances && typeData.combatProperties.resistances.length > 0) {
                this.runner.test(`${this.capitalize(typeId)} Resistance Tests`, () => this.testResistances(typeId));
            }
        });
        
        // Generate weakness tests
        this.typeList.forEach(typeId => {
            const typeData = this.storyTypes[typeId];
            if (typeData.combatProperties && typeData.combatProperties.weaknesses && typeData.combatProperties.weaknesses.length > 0) {
                this.runner.test(`${this.capitalize(typeId)} Weakness Tests`, () => this.testWeaknesses(typeId));
            }
        });
        
        console.log(`✅ Generated ${this.runner.tests.length} dynamic tests`);
    }

    testTypeMatchup(attackerType, defenderType) {
        const multiplier = this.calculateTypeEffectiveness(attackerType, defenderType);
        
        // Basic validation - multiplier should be a valid number
        TestRunner.assertType(multiplier, 'number', `Type effectiveness should return a number`);
        TestRunner.assert(multiplier >= 0, `Type effectiveness should not be negative, got ${multiplier}`);
        TestRunner.assert(multiplier <= 3.0, `Type effectiveness should not exceed 3.0x, got ${multiplier}`);
        
        // Validate against type data
        const defenderTypeData = this.storyTypes[defenderType];
        if (defenderTypeData && defenderTypeData.combatProperties) {
            const combat = defenderTypeData.combatProperties;
            
            if (combat.immunities && combat.immunities.includes(attackerType)) {
                TestRunner.assertEqual(multiplier, 0.0, `${defenderType} should be immune to ${attackerType}`);
            } else if (combat.resistances && combat.resistances.includes(attackerType)) {
                TestRunner.assert(multiplier < 1.0, `${defenderType} should resist ${attackerType} (multiplier < 1.0)`);
            } else if (combat.weaknesses && combat.weaknesses.includes(attackerType)) {
                TestRunner.assert(multiplier > 1.0, `${defenderType} should be weak to ${attackerType} (multiplier > 1.0)`);
            }
        }
        
        return true;
    }

    testImmunities(typeId) {
        const typeData = this.storyTypes[typeId];
        const immunities = typeData.combatProperties.immunities;
        
        immunities.forEach(attackerType => {
            const multiplier = this.calculateTypeEffectiveness(attackerType, typeId);
            TestRunner.assertEqual(multiplier, 0.0, `${typeId} should be immune to ${attackerType}`);
        });
        
        return true;
    }

    testResistances(typeId) {
        const typeData = this.storyTypes[typeId];
        const resistances = typeData.combatProperties.resistances;
        
        resistances.forEach(attackerType => {
            const multiplier = this.calculateTypeEffectiveness(attackerType, typeId);
            TestRunner.assert(multiplier < 1.0, `${typeId} should resist ${attackerType} (got ${multiplier}x)`);
        });
        
        return true;
    }

    testWeaknesses(typeId) {
        const typeData = this.storyTypes[typeId];
        const weaknesses = typeData.combatProperties.weaknesses;
        
        weaknesses.forEach(attackerType => {
            const multiplier = this.calculateTypeEffectiveness(attackerType, typeId);
            TestRunner.assert(multiplier > 1.0, `${typeId} should be weak to ${attackerType} (got ${multiplier}x)`);
        });
        
        return true;
    }

    // Local implementation of type effectiveness calculation
    calculateTypeEffectiveness(attackerType, defenderType) {
        const defenderTypeData = this.storyTypes[defenderType];
        
        if (!defenderTypeData || !defenderTypeData.combatProperties) {
            return 1.0; // Normal damage if no combat properties
        }
        
        const combat = defenderTypeData.combatProperties;
        
        // Check immunity (no damage)
        if (combat.immunities && combat.immunities.includes(attackerType)) {
            return 0.0;
        }
        
        // Check resistance (reduced damage)
        if (combat.resistances && combat.resistances.includes(attackerType)) {
            return 0.7; // 30% reduction
        }
        
        // Check weakness (increased damage)
        if (combat.weaknesses && combat.weaknesses.includes(attackerType)) {
            return 1.5; // 50% increase
        }
        
        return 1.0; // Normal damage
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    async runTests() {
        return await this.runner.runAll();
    }
}

export { StoryTypeEffectivenessTests };
