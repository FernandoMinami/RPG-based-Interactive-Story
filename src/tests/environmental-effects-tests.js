/**
 * Environmental Effects Tests - Comprehensive testing for story-specific environmental systems
 * Tests environmental effects, type interactions, intensity levels, messages, and modifiers
 */

export class EnvironmentalEffectsTests {
    constructor(storyFolder = null) {
        this.storyFolder = storyFolder;
        this.testResults = [];
        this.environments = {};
        this.environmentManifest = [];
        this.testCategories = [
            'Environment Loading',
            'Basic Environment Properties',
            'Intensity Level Systems',
            'Type Interactions', 
            'Environmental Effects',
            'Combat Modifiers',
            'Status Effects',
            'Environmental Messages',
            'Damage Calculations',
            'Environment Validation'
        ];
    }

    async initialize() {
        try {
            if (this.storyFolder) {
                await this.loadStoryEnvironments();
            }
        } catch (error) {
            throw new Error(`Failed to initialize Environmental Effects Tests: ${error.message}`);
        }
    }

    async loadStoryEnvironments() {
        try {
            // Load environmental effects manifest
            const manifestUrl = `../../story-content/${this.storyFolder}/environmentalEffects/_environmentalEffects.json?v=${Date.now()}`;
            const manifestResponse = await fetch(manifestUrl);
            
            if (!manifestResponse.ok) {
                throw new Error(`Failed to load environmental effects manifest: ${manifestResponse.status}`);
            }
            
            this.environmentManifest = await manifestResponse.json();
            
            // Load each environment file
            for (const envInfo of this.environmentManifest) {
                try {
                    const envUrl = `../../story-content/${this.storyFolder}/environmentalEffects/${envInfo.file}?v=${Date.now()}`;
                    const envResponse = await fetch(envUrl);
                    
                    if (envResponse.ok) {
                        const envData = await envResponse.json();
                        this.environments[envData.id || envData.type] = envData;
                    }
                } catch (error) {
                    // Silent fail for missing environment files
                }
            }
            
        } catch (error) {
            throw new Error(`Failed to load story environments: ${error.message}`);
        }
    }

    async runTests() {
        const startTime = performance.now();
        this.testResults = [];

        // Run all test categories

        // Run all test categories
        await this.testEnvironmentLoading();
        await this.testBasicEnvironmentProperties();
        await this.testIntensityLevelSystems();
        await this.testTypeInteractions();
        await this.testEnvironmentalEffects();
        await this.testCombatModifiers();
        await this.testStatusEffects();
        await this.testEnvironmentalMessages();
        await this.testDamageCalculations();
        await this.testEnvironmentValidation();

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Calculate results
        const passed = this.testResults.filter(test => test.passed).length;
        const failed = this.testResults.filter(test => !test.passed).length;
        const total = this.testResults.length;

        if (failed > 0) {
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => console.log(`   • ${test.name}: ${test.error}`));
        }

        return {
            passed,
            failed,
            total,
            duration,
            successRate: Math.round((passed / total) * 100),
            results: this.testResults
        };
    }

    addTest(name, testFn, category = 'General') {
        try {
            const result = testFn();
            this.testResults.push({
                name,
                category,
                passed: true,
                result,
                error: null
            });
        } catch (error) {
            this.testResults.push({
                name,
                category,
                passed: false,
                result: null,
                error: error.message
            });
        }
    }

    async testEnvironmentLoading() {

        this.addTest('Environment manifest loads correctly', () => {
            if (this.environmentManifest.length === 0) {
                throw new Error('No environments found in manifest');
            }
            
            for (const env of this.environmentManifest) {
                if (!env.id) throw new Error(`Environment missing id: ${JSON.stringify(env)}`);
                if (!env.name) throw new Error(`Environment ${env.id} missing name`);
                if (!env.file) throw new Error(`Environment ${env.id} missing file`);
            }
            
            return this.environmentManifest.length;
        }, 'Environment Loading');

        this.addTest('Environment files load successfully', () => {
            const expectedCount = this.environmentManifest.length;
            const loadedCount = Object.keys(this.environments).length;
            
            if (loadedCount === 0) {
                throw new Error('No environment files loaded successfully');
            }
            
            // Allow some files to fail loading (might not exist yet)
            if (loadedCount < expectedCount * 0.5) {
                throw new Error(`Too few environments loaded: ${loadedCount}/${expectedCount}`);
            }
            
            return { expected: expectedCount, loaded: loadedCount };
        }, 'Environment Loading');

        this.addTest('Loaded environments have valid structure', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (!env.name) throw new Error(`Environment ${envId} missing name`);
                if (!env.description) throw new Error(`Environment ${envId} missing description`);
                
                // Check for either old format (id) or new format (type)
                if (!env.id && !env.type) {
                    throw new Error(`Environment ${envId} missing id or type field`);
                }
            }
            
            return Object.keys(this.environments).length;
        }, 'Environment Loading');
    }

    async testBasicEnvironmentProperties() {

        this.addTest('Environments have required basic properties', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (!env.name) throw new Error(`Environment ${envId} missing name`);
                if (!env.description) throw new Error(`Environment ${envId} missing description`);
                
                // Check for icon (optional but recommended)
                if (!env.icon) {
                    console.warn(`Environment ${envId} missing icon`);
                }
            }
            
            return true;
        }, 'Basic Environment Properties');

        this.addTest('Environment temperature settings are valid', () => {
            const validTemperatures = ['extreme_cold', 'cold', 'cool', 'moderate', 'warm', 'hot', 'extreme_hot'];
            
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.temperature && !validTemperatures.includes(env.temperature)) {
                    throw new Error(`Environment ${envId} has invalid temperature: ${env.temperature}`);
                }
            }
            
            return true;
        }, 'Basic Environment Properties');

        this.addTest('Default intensity levels are reasonable', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.defaultIntensity !== undefined) {
                    if (env.defaultIntensity < 1 || env.defaultIntensity > 10) {
                        throw new Error(`Environment ${envId} has invalid default intensity: ${env.defaultIntensity}`);
                    }
                }
            }
            
            return true;
        }, 'Basic Environment Properties');
    }

    async testIntensityLevelSystems() {

        this.addTest('Intensity levels are properly structured', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.intensityLevels) {
                    const levels = Object.keys(env.intensityLevels);
                    
                    if (levels.length === 0) {
                        throw new Error(`Environment ${envId} has empty intensity levels`);
                    }
                    
                    for (const level of levels) {
                        const levelData = env.intensityLevels[level];
                        if (!levelData.name) {
                            throw new Error(`Environment ${envId} level ${level} missing name`);
                        }
                        if (!levelData.description) {
                            throw new Error(`Environment ${envId} level ${level} missing description`);
                        }
                    }
                }
            }
            
            return true;
        }, 'Intensity Level Systems');

        this.addTest('Intensity levels have escalating effects', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.intensityLevels) {
                    const levels = Object.keys(env.intensityLevels).map(Number).sort((a, b) => a - b);
                    
                    let previousDamage = 0;
                    for (const level of levels) {
                        const levelData = env.intensityLevels[level];
                        if (levelData.effects && levelData.effects.damage !== undefined) {
                            if (levelData.effects.damage < previousDamage) {
                                console.warn(`Environment ${envId} level ${level} has lower damage than previous level`);
                            }
                            previousDamage = levelData.effects.damage;
                        }
                    }
                }
            }
            
            return true;
        }, 'Intensity Level Systems');

        this.addTest('Intensity messages are informative', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.intensityLevels) {
                    for (const [level, levelData] of Object.entries(env.intensityLevels)) {
                        if (levelData.effects && levelData.effects.message) {
                            if (levelData.effects.message.length < 10) {
                                throw new Error(`Environment ${envId} level ${level} has too short message`);
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Intensity Level Systems');
    }

    async testTypeInteractions() {

        this.addTest('Type interactions have valid multipliers', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.typeInteractions) {
                    for (const [type, interaction] of Object.entries(env.typeInteractions)) {
                        if (interaction.environmentalDamageMultiplier !== undefined) {
                            const multiplier = interaction.environmentalDamageMultiplier;
                            if (multiplier < 0 || multiplier > 5) {
                                throw new Error(`Environment ${envId} type ${type} has invalid damage multiplier: ${multiplier}`);
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Type Interactions');

        this.addTest('Type interactions have descriptions', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.typeInteractions) {
                    for (const [type, interaction] of Object.entries(env.typeInteractions)) {
                        if (!interaction.description) {
                            throw new Error(`Environment ${envId} type ${type} missing description`);
                        }
                        if (interaction.description.length < 10) {
                            throw new Error(`Environment ${envId} type ${type} has too short description`);
                        }
                    }
                }
            }
            
            return true;
        }, 'Type Interactions');

        this.addTest('Immunity types are properly configured', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.immuneType) {
                    if (typeof env.immuneType !== 'string') {
                        throw new Error(`Environment ${envId} immune type must be a string`);
                    }
                    
                    // Check if immune type has zero damage multiplier in type interactions
                    if (env.typeInteractions && env.typeInteractions[env.immuneType]) {
                        const immuneInteraction = env.typeInteractions[env.immuneType];
                        if (immuneInteraction.environmentalDamageMultiplier !== 0) {
                            console.warn(`Environment ${envId} immune type ${env.immuneType} should have 0 damage multiplier`);
                        }
                    }
                }
            }
            
            return true;
        }, 'Type Interactions');
    }

    async testEnvironmentalEffects() {

        this.addTest('Environmental effects have valid damage values', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.effects) {
                    if (env.effects.baseDamage !== undefined) {
                        if (env.effects.baseDamage < 0 || env.effects.baseDamage > 100) {
                            throw new Error(`Environment ${envId} has invalid base damage: ${env.effects.baseDamage}`);
                        }
                    }
                    
                    // Check intensity level damages
                    if (env.intensityLevels) {
                        for (const [level, levelData] of Object.entries(env.intensityLevels)) {
                            if (levelData.effects && levelData.effects.damage !== undefined) {
                                if (levelData.effects.damage < 0 || levelData.effects.damage > 50) {
                                    throw new Error(`Environment ${envId} level ${level} has invalid damage: ${levelData.effects.damage}`);
                                }
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Environmental Effects');

        this.addTest('Penalty effects are within reasonable ranges', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.intensityLevels) {
                    for (const [level, levelData] of Object.entries(env.intensityLevels)) {
                        if (levelData.effects) {
                            const effects = levelData.effects;
                            
                            // Check accuracy penalties
                            if (effects.accuracyPenalty !== undefined) {
                                if (effects.accuracyPenalty < 0 || effects.accuracyPenalty > 1) {
                                    throw new Error(`Environment ${envId} level ${level} accuracy penalty out of range: ${effects.accuracyPenalty}`);
                                }
                            }
                            
                            // Check damage penalties
                            if (effects.damagePenalty !== undefined) {
                                if (effects.damagePenalty < 0 || effects.damagePenalty > 1) {
                                    throw new Error(`Environment ${envId} level ${level} damage penalty out of range: ${effects.damagePenalty}`);
                                }
                            }
                            
                            // Check tripping chances
                            if (effects.trippingChance !== undefined) {
                                if (effects.trippingChance < 0 || effects.trippingChance > 100) {
                                    throw new Error(`Environment ${envId} level ${level} tripping chance out of range: ${effects.trippingChance}`);
                                }
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Environmental Effects');

        this.addTest('Damage types are valid', () => {
            const validDamageTypes = ['fire', 'ice', 'lightning', 'poison', 'physical', 'water', 'earth', 'air', 'dark', 'light'];
            
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.effects && env.effects.damageType) {
                    if (!validDamageTypes.includes(env.effects.damageType)) {
                        throw new Error(`Environment ${envId} has invalid damage type: ${env.effects.damageType}`);
                    }
                }
            }
            
            return true;
        }, 'Environmental Effects');
    }

    async testCombatModifiers() {

        this.addTest('Combat modifiers have valid ranges', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.combatModifiers) {
                    for (const [ability, modifiers] of Object.entries(env.combatModifiers)) {
                        if (modifiers.damageBonus !== undefined) {
                            if (modifiers.damageBonus < 0.1 || modifiers.damageBonus > 3.0) {
                                throw new Error(`Environment ${envId} ${ability} damage bonus out of range: ${modifiers.damageBonus}`);
                            }
                        }
                        
                        if (modifiers.damageReduction !== undefined) {
                            if (modifiers.damageReduction < 0.1 || modifiers.damageReduction > 1.0) {
                                throw new Error(`Environment ${envId} ${ability} damage reduction out of range: ${modifiers.damageReduction}`);
                            }
                        }
                        
                        if (modifiers.accuracyBonus !== undefined) {
                            if (modifiers.accuracyBonus < -0.5 || modifiers.accuracyBonus > 0.5) {
                                throw new Error(`Environment ${envId} ${ability} accuracy bonus out of range: ${modifiers.accuracyBonus}`);
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Combat Modifiers');

        this.addTest('Combat modifier abilities are logically named', () => {
            const expectedAbilityPatterns = ['fire', 'ice', 'water', 'earth', 'air', 'lightning', 'abilities'];
            
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.combatModifiers) {
                    for (const ability of Object.keys(env.combatModifiers)) {
                        const hasValidPattern = expectedAbilityPatterns.some(pattern => 
                            ability.toLowerCase().includes(pattern)
                        );
                        
                        if (!hasValidPattern) {
                            console.warn(`Environment ${envId} has unusual combat modifier: ${ability}`);
                        }
                    }
                }
            }
            
            return true;
        }, 'Combat Modifiers');

        // Regression tests for specific environmental effects
        await this.testCaveAccuracyRegression();
        await this.testUnderwaterSpeedRegression();
        await this.testTypeImmunityRegression();
    }

    async testCaveAccuracyRegression() {

        if (!this.storyFolder) {
            return;
        }

        this.addTest('Cave accuracy penalty for fire type at intensity 7', async () => {
            try {
                const { getEnvironmentalEffectsForBattle, loadStoryEnvironments } = await import('../environmental.js');
                const storyEnvironments = await loadStoryEnvironments(this.storyFolder);
                
                const fireCharacter = { type: 'fire', name: 'Fire Test Character' };
                const caveEffects = getEnvironmentalEffectsForBattle(fireCharacter, 'cave', 7, 1, storyEnvironments);
                
                
                if (caveEffects.accuracyPenalty <= 0) {
                    throw new Error(`Expected accuracy penalty > 0, got ${caveEffects.accuracyPenalty}`);
                }
                
                // Expected: Intensity level penalty + Type penalty should create significant penalty
                if (caveEffects.accuracyPenalty < 0.3) {
                    console.warn(`Low accuracy penalty for fire in cave: ${caveEffects.accuracyPenalty} (expected >= 0.3)`);
                }
                
                return true;
            } catch (error) {
                throw new Error(`Cave accuracy regression test failed: ${error.message}`);
            }
        }, 'Combat Modifiers');

        this.addTest('Earth type immunity in caves', async () => {
            try {
                const { getEnvironmentalEffectsForBattle, loadStoryEnvironments } = await import('../environmental.js');
                const storyEnvironments = await loadStoryEnvironments(this.storyFolder);
                
                const earthCharacter = { type: 'earth', name: 'Earth Test Character' };
                const caveEffects = getEnvironmentalEffectsForBattle(earthCharacter, 'cave', 7, 1, storyEnvironments);
                
                
                if (!caveEffects.hasImmunity) {
                    throw new Error('Earth type should be immune to cave effects');
                }
                
                if (caveEffects.accuracyPenalty > 0) {
                    throw new Error(`Earth type should not have accuracy penalty in caves, got ${caveEffects.accuracyPenalty}`);
                }
                
                return true;
            } catch (error) {
                throw new Error(`Earth cave immunity test failed: ${error.message}`);
            }
        }, 'Combat Modifiers');
    }

    async testUnderwaterSpeedRegression() {

        if (!this.storyFolder) {
            return;
        }

        this.addTest('Underwater speed penalty for earth type', async () => {
            try {
                const { getEnvironmentalEffectsForBattle, loadStoryEnvironments } = await import('../environmental.js');
                const storyEnvironments = await loadStoryEnvironments(this.storyFolder);
                
                const earthCharacter = { type: 'earth', name: 'Earth Test Character' };
                const underwaterEffects = getEnvironmentalEffectsForBattle(earthCharacter, 'underwater', 5, 1, storyEnvironments);
                
                
                if (underwaterEffects.speedPenalty <= 0) {
                    throw new Error(`Expected speed penalty > 0 for earth underwater, got ${underwaterEffects.speedPenalty}`);
                }
                
                // Expected: Should have around 30% speed penalty (0.3)
                if (underwaterEffects.speedPenalty < 0.2) {
                    console.warn(`Low speed penalty for earth underwater: ${underwaterEffects.speedPenalty} (expected >= 0.2)`);
                }
                
                return true;
            } catch (error) {
                throw new Error(`Underwater speed regression test failed: ${error.message}`);
            }
        }, 'Combat Modifiers');

        this.addTest('Fire type penalties underwater', async () => {
            try {
                const { getEnvironmentalEffectsForBattle, loadStoryEnvironments } = await import('../environmental.js');
                const storyEnvironments = await loadStoryEnvironments(this.storyFolder);
                
                const fireCharacter = { type: 'fire', name: 'Fire Test Character' };
                const underwaterEffects = getEnvironmentalEffectsForBattle(fireCharacter, 'underwater', 5, 1, storyEnvironments);
                
                
                // Fire should have significant penalties underwater
                if (underwaterEffects.speedPenalty <= 0) {
                    throw new Error(`Expected speed penalty > 0 for fire underwater, got ${underwaterEffects.speedPenalty}`);
                }
                
                return true;
            } catch (error) {
                throw new Error(`Fire underwater penalties test failed: ${error.message}`);
            }
        }, 'Combat Modifiers');
    }

    async testTypeImmunityRegression() {

        if (!this.storyFolder) {
            return;
        }

        this.addTest('Water type immunity underwater', async () => {
            try {
                const { getEnvironmentalEffectsForBattle, loadStoryEnvironments } = await import('../environmental.js');
                const storyEnvironments = await loadStoryEnvironments(this.storyFolder);
                
                const waterCharacter = { type: 'water', name: 'Water Test Character' };
                const underwaterEffects = getEnvironmentalEffectsForBattle(waterCharacter, 'underwater', 5, 1, storyEnvironments);
                
                
                if (!underwaterEffects.hasImmunity) {
                    throw new Error('Water type should be immune to underwater effects');
                }
                
                if (underwaterEffects.speedPenalty > 0) {
                    throw new Error(`Water type should not have speed penalty underwater, got ${underwaterEffects.speedPenalty}`);
                }
                
                if (underwaterEffects.accuracyPenalty > 0) {
                    throw new Error(`Water type should not have accuracy penalty underwater, got ${underwaterEffects.accuracyPenalty}`);
                }
                
                return true;
            } catch (error) {
                throw new Error(`Water underwater immunity test failed: ${error.message}`);
            }
        }, 'Combat Modifiers');

        this.addTest('Direct processEnvironmentalCombatModifiers function', async () => {
            try {
                const { processEnvironmentalCombatModifiers, loadStoryEnvironments } = await import('../environmental.js');
                const storyEnvironments = await loadStoryEnvironments(this.storyFolder);
                
                const fireCharacter = { type: 'fire', name: 'Fire Test' };
                const caveEnv = storyEnvironments.cave;
                
                if (!caveEnv) {
                    throw new Error('Cave environment not found in story environments');
                }
                
                const directModifiers = processEnvironmentalCombatModifiers(fireCharacter, caveEnv, 7);
                
                if (directModifiers.accuracyModifier >= 0 && !directModifiers.isImmune) {
                    throw new Error(`Expected negative accuracy modifier for fire in cave, got ${directModifiers.accuracyModifier}`);
                }
                
                return true;
            } catch (error) {
                throw new Error(`Direct function test failed: ${error.message}`);
            }
        }, 'Combat Modifiers');
    }

    async testStatusEffects() {

        this.addTest('Status effects have valid chances', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.statusEffects) {
                    for (const [statusId, statusData] of Object.entries(env.statusEffects)) {
                        if (statusData.chance !== undefined) {
                            if (statusData.chance < 0 || statusData.chance > 1) {
                                throw new Error(`Environment ${envId} status ${statusId} has invalid chance: ${statusData.chance}`);
                            }
                        }
                    }
                }
                
                // Check intensity level status chances
                if (env.intensityLevels) {
                    for (const [level, levelData] of Object.entries(env.intensityLevels)) {
                        if (levelData.effects && levelData.effects.statusChance !== undefined) {
                            if (levelData.effects.statusChance < 0 || levelData.effects.statusChance > 100) {
                                throw new Error(`Environment ${envId} level ${level} status chance out of range: ${levelData.effects.statusChance}`);
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Status Effects');

        this.addTest('Status effects have valid types', () => {
            const validStatusTypes = ['stunned', 'poisoned', 'burned', 'frozen', 'confused', 'weakened', 'slowed'];
            
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.intensityLevels) {
                    for (const [level, levelData] of Object.entries(env.intensityLevels)) {
                        if (levelData.effects && levelData.effects.statusType) {
                            if (!validStatusTypes.includes(levelData.effects.statusType)) {
                                throw new Error(`Environment ${envId} level ${level} has invalid status type: ${levelData.effects.statusType}`);
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Status Effects');
    }

    async testEnvironmentalMessages() {

        this.addTest('Environmental effects have descriptive messages', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.effects && env.effects.description) {
                    if (env.effects.description.length < 10) {
                        throw new Error(`Environment ${envId} base effects description too short`);
                    }
                }
                
                if (env.intensityLevels) {
                    for (const [level, levelData] of Object.entries(env.intensityLevels)) {
                        if (levelData.effects && levelData.effects.message) {
                            if (levelData.effects.message.length < 5) {
                                throw new Error(`Environment ${envId} level ${level} message too short`);
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Environmental Messages');

        this.addTest('Type interaction messages are informative', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.typeInteractions) {
                    for (const [type, interaction] of Object.entries(env.typeInteractions)) {
                        if (interaction.description && interaction.description.length < 15) {
                            throw new Error(`Environment ${envId} type ${type} description too short`);
                        }
                    }
                }
            }
            
            return true;
        }, 'Environmental Messages');

        this.addTest('Messages contain relevant environmental context', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                const envName = env.name.toLowerCase();
                
                if (env.effects && env.effects.description) {
                    const description = env.effects.description.toLowerCase();
                    
                    // Check if description contains relevant keywords
                    if (envName.includes('volcanic') && !description.includes('heat') && !description.includes('fire') && !description.includes('lava')) {
                        console.warn(`Environment ${envId} description might not be contextually relevant`);
                    }
                    
                    if (envName.includes('cave') && !description.includes('dark') && !description.includes('rock') && !description.includes('underground')) {
                        console.warn(`Environment ${envId} description might not be contextually relevant`);
                    }
                }
            }
            
            return true;
        }, 'Environmental Messages');
    }

    async testDamageCalculations() {

        this.addTest('Environmental damage calculations work correctly', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.effects && env.effects.baseDamage) {
                    const baseDamage = env.effects.baseDamage;
                    
                    // Test with type interactions
                    if (env.typeInteractions) {
                        for (const [type, interaction] of Object.entries(env.typeInteractions)) {
                            const multiplier = interaction.environmentalDamageMultiplier || 1.0;
                            const finalDamage = Math.floor(baseDamage * multiplier);
                            
                            if (finalDamage < 0) {
                                throw new Error(`Environment ${envId} type ${type} produces negative damage: ${finalDamage}`);
                            }
                            
                            if (finalDamage > 200) {
                                throw new Error(`Environment ${envId} type ${type} produces excessive damage: ${finalDamage}`);
                            }
                        }
                    }
                }
            }
            
            return true;
        }, 'Damage Calculations');

        this.addTest('Intensity level damage scaling is reasonable', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                if (env.intensityLevels) {
                    const levels = Object.keys(env.intensityLevels).map(Number).sort((a, b) => a - b);
                    const damages = [];
                    
                    for (const level of levels) {
                        const levelData = env.intensityLevels[level];
                        if (levelData.effects && levelData.effects.damage !== undefined) {
                            damages.push(levelData.effects.damage);
                        }
                    }
                    
                    // Check that damage generally increases with intensity
                    if (damages.length > 1) {
                        const maxDamage = Math.max(...damages);
                        const minDamage = Math.min(...damages);
                        
                        if (maxDamage - minDamage < 1 && maxDamage > 0) {
                            console.warn(`Environment ${envId} has minimal damage scaling across intensity levels`);
                        }
                    }
                }
            }
            
            return true;
        }, 'Damage Calculations');
    }

    async testEnvironmentValidation() {

        this.addTest('All environments have unique IDs', () => {
            const ids = new Set();
            
            for (const [envId, env] of Object.entries(this.environments)) {
                const id = env.id || env.type || envId;
                
                if (ids.has(id)) {
                    throw new Error(`Duplicate environment ID found: ${id}`);
                }
                ids.add(id);
            }
            
            return ids.size;
        }, 'Environment Validation');

        this.addTest('Environment data consistency check', () => {
            for (const [envId, env] of Object.entries(this.environments)) {
                // Check consistency between manifest and file data
                const manifestEntry = this.environmentManifest.find(m => m.id === envId || m.id === env.id || m.id === env.type);
                
                if (!manifestEntry) {
                    console.warn(`Environment ${envId} not found in manifest`);
                    continue;
                }
                
                if (manifestEntry.name !== env.name) {
                    console.warn(`Environment ${envId} name mismatch: manifest="${manifestEntry.name}" vs file="${env.name}"`);
                }
            }
            
            return true;
        }, 'Environment Validation');

        this.addTest('Environment completeness check', () => {
            let completeEnvironments = 0;
            
            for (const [envId, env] of Object.entries(this.environments)) {
                let completeness = 0;
                
                if (env.name) completeness++;
                if (env.description) completeness++;
                if (env.effects || env.intensityLevels) completeness++;
                if (env.typeInteractions) completeness++;
                
                if (completeness >= 3) {
                    completeEnvironments++;
                }
            }
            
            const totalEnvironments = Object.keys(this.environments).length;
            const completenessRate = Math.round((completeEnvironments / totalEnvironments) * 100);
            
            if (completenessRate < 70) {
                throw new Error(`Low environment completeness rate: ${completenessRate}%`);
            }
            
            return { complete: completeEnvironments, total: totalEnvironments, rate: completenessRate };
        }, 'Environment Validation');
    }

    // Helper methods for environmental effect calculations
    calculateEnvironmentalDamage(envId, characterType, intensity = 5) {
        const env = this.environments[envId];
        if (!env) return 0;
        
        let baseDamage = 0;
        
        // Get base damage from effects or intensity levels
        if (env.effects && env.effects.baseDamage) {
            baseDamage = env.effects.baseDamage;
        } else if (env.intensityLevels && env.intensityLevels[intensity]) {
            baseDamage = env.intensityLevels[intensity].effects?.damage || 0;
        }
        
        // Apply type interaction multiplier
        if (env.typeInteractions && env.typeInteractions[characterType]) {
            const multiplier = env.typeInteractions[characterType].environmentalDamageMultiplier || 1.0;
            baseDamage = Math.floor(baseDamage * multiplier);
        }
        
        return Math.max(0, baseDamage);
    }

    getEnvironmentalMessage(envId, characterType, intensity = 5) {
        const env = this.environments[envId];
        if (!env) return "No environmental effects.";
        
        // Check for type-specific message
        if (env.typeInteractions && env.typeInteractions[characterType]) {
            return env.typeInteractions[characterType].description;
        }
        
        // Check for intensity-specific message
        if (env.intensityLevels && env.intensityLevels[intensity]) {
            return env.intensityLevels[intensity].effects?.message || env.intensityLevels[intensity].description;
        }
        
        // Fallback to base description
        return env.effects?.description || env.description;
    }

    isTypeImmune(envId, characterType) {
        const env = this.environments[envId];
        if (!env) return false;
        
        // Check direct immunity
        if (env.immuneType === characterType) return true;
        
        // Check type interaction for zero damage
        if (env.typeInteractions && env.typeInteractions[characterType]) {
            return env.typeInteractions[characterType].environmentalDamageMultiplier === 0;
        }
        
        return false;
    }
}
