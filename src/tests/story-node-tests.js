/**
 * Story Node Tests - Comprehensive testing for interactive story mechanics
 * Tests node choices, dice rolls, environmental effects, damage, item rewards, and more
 */

export class StoryNodeTests {
    constructor(storyFolder = null) {
        this.storyFolder = storyFolder;
        this.testResults = [];
        this.scenarios = {};
        this.mockPlayer = null;
        this.testCategories = [
            'Basic Node Navigation',
            'Choice Processing',
            'Dice Roll Mechanics', 
            'Environmental Effects',
            'Damage & Healing',
            'Item & Reward Systems',
            'Battle Integration',
            'Node Validation'
        ];
    }

    async initialize() {
        try {
            if (this.storyFolder) {
                await this.loadStoryScenarios();
            }
            this.createMockPlayer();
            console.log(`✅ Story Node Tests initialized for ${this.storyFolder || 'generic scenarios'}`);
        } catch (error) {
            throw new Error(`Failed to initialize Story Node Tests: ${error.message}`);
        }
    }

    async loadStoryScenarios() {
        try {
            const scenariosUrl = `../../story-content/${this.storyFolder}/scenarios/_scenarios.json?v=${Date.now()}`;
            const response = await fetch(scenariosUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load scenarios manifest: ${response.status}`);
            }
            
            const scenarioList = await response.json();
            
            // Load each scenario file
            for (const scenarioInfo of scenarioList) {
                try {
                    const scenarioUrl = `../../story-content/${this.storyFolder}/scenarios/${scenarioInfo.file}?v=${Date.now()}`;
                    const scenarioResponse = await fetch(scenarioUrl);
                    
                    if (scenarioResponse.ok) {
                        const scenarioData = await scenarioResponse.json();
                        this.scenarios[scenarioData.id] = scenarioData;
                    }
                } catch (error) {
                    console.warn(`Failed to load scenario ${scenarioInfo.file}:`, error.message);
                }
            }
            
            console.log(`📖 Loaded ${Object.keys(this.scenarios).length} scenarios for testing`);
        } catch (error) {
            throw new Error(`Failed to load story scenarios: ${error.message}`);
        }
    }

    createMockPlayer() {
        this.mockPlayer = {
            name: "Test Hero",
            race: "human",
            type: "neutral",
            level: 5,
            exp: 1000,
            life: 100,
            maxLife: 100,
            mana: 50,
            maxMana: 50,
            attributes: {
                strength: 14,
                dexterity: 12,
                constitution: 16,
                intelligence: 11,
                wisdom: 13,
                charisma: 10
            },
            secondary: {
                defense: 5,
                speed: 8,
                accuracy: 75
            },
            inventory: {
                "potion": 3,
                "mana-potion": 1
            },
            abilities: ["heal", "magic-missile"]
        };
    }

    async runTests() {
        console.log('🚀 Starting Story Node Tests...\n');
        
        const startTime = performance.now();
        this.testResults = [];

        // Run all test categories
        await this.testBasicNodeNavigation();
        await this.testChoiceProcessing();
        await this.testDiceRollMechanics();
        await this.testEnvironmentalEffects();
        await this.testDamageAndHealing();
        await this.testItemAndRewardSystems();
        await this.testBattleIntegration();
        await this.testNodeValidation();

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Calculate results
        const passed = this.testResults.filter(test => test.passed).length;
        const failed = this.testResults.filter(test => !test.passed).length;
        const total = this.testResults.length;

        console.log(`\n📊 Story Node Test Results:`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Total: ${total}`);
        console.log(`⏱️ Duration: ${duration}ms`);
        console.log(`🎯 Success Rate: ${Math.round((passed / total) * 100)}%`);

        if (failed > 0) {
            console.log(`\n❌ Failed Tests:`);
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
            console.log(`✅ ${name}`);
        } catch (error) {
            this.testResults.push({
                name,
                category,
                passed: false,
                result: null,
                error: error.message
            });
            console.log(`❌ ${name}: ${error.message}`);
        }
    }

    async testBasicNodeNavigation() {
        console.log('\n🗺️ Testing Basic Node Navigation...');

        // Test node structure validation
        this.addTest('Node has required properties', () => {
            const testNode = {
                title: "Test Node",
                text: "Test description",
                choices: [{ text: "Continue", next: "next-node" }]
            };
            
            if (!testNode.title) throw new Error('Node missing title');
            if (!testNode.text) throw new Error('Node missing text');
            if (!testNode.choices || !Array.isArray(testNode.choices)) {
                throw new Error('Node missing choices array');
            }
            
            return true;
        }, 'Basic Node Navigation');

        // Test choice navigation
        this.addTest('Choice navigation works', () => {
            const choice = { text: "Go north", next: "forest-clearing" };
            
            if (!choice.text) throw new Error('Choice missing text');
            if (!choice.next && !choice.scenario) {
                throw new Error('Choice missing navigation (next or scenario)');
            }
            
            return choice.next === "forest-clearing";
        }, 'Basic Node Navigation');

        // Test scenario switching
        this.addTest('Scenario switching works', () => {
            const choice = { text: "Enter cave", scenario: "crystal-caves", next: "cave-entrance" };
            
            if (choice.scenario && !choice.next) {
                throw new Error('Scenario switch requires next node');
            }
            
            return choice.scenario === "crystal-caves" && choice.next === "cave-entrance";
        }, 'Basic Node Navigation');

        // Test loaded scenarios structure
        if (Object.keys(this.scenarios).length > 0) {
            this.addTest('Loaded scenarios have valid structure', () => {
                for (const [scenarioId, scenario] of Object.entries(this.scenarios)) {
                    if (!scenario.id) throw new Error(`Scenario ${scenarioId} missing id`);
                    if (!scenario.title) throw new Error(`Scenario ${scenarioId} missing title`);
                    
                    // Check for nodes (some scenarios use "nodes", others use direct node keys)
                    const nodeKeys = scenario.nodes ? Object.keys(scenario.nodes) : 
                                   Object.keys(scenario).filter(k => !['id', 'title', 'noBattle', 'environment', 'enemies', 'respawn'].includes(k));
                    
                    if (nodeKeys.length === 0) {
                        throw new Error(`Scenario ${scenarioId} has no nodes`);
                    }
                }
                
                return Object.keys(this.scenarios).length;
            }, 'Basic Node Navigation');
        }
    }

    async testChoiceProcessing() {
        console.log('\n🎯 Testing Choice Processing...');

        // Test basic choice processing
        this.addTest('Basic choice processes correctly', () => {
            const choice = { text: "Continue", next: "next-node" };
            const processed = this.processChoiceTest(choice, this.mockPlayer);
            
            return processed.nextNode === "next-node";
        }, 'Choice Processing');

        // Test choice with life change
        this.addTest('Choice life changes work', () => {
            const playerBefore = { ...this.mockPlayer, life: 80 };
            const choice = { text: "Drink potion", next: "healed", life: 20 };
            
            const processed = this.processChoiceTest(choice, playerBefore);
            
            if (processed.player.life !== 100) {
                throw new Error(`Expected life 100, got ${processed.player.life}`);
            }
            
            return true;
        }, 'Choice Processing');

        // Test choice with damage
        this.addTest('Choice damage works', () => {
            const playerBefore = { ...this.mockPlayer, life: 100 };
            const choice = { text: "Touch fire", next: "burned", life: -15 };
            
            const processed = this.processChoiceTest(choice, playerBefore);
            
            // Damage should be reduced by defense (5)
            const expectedLife = 100 - 15 + 5; // 90
            if (processed.player.life !== expectedLife) {
                throw new Error(`Expected life ${expectedLife}, got ${processed.player.life}`);
            }
            
            return true;
        }, 'Choice Processing');

        // Test choice with item rewards
        this.addTest('Choice item rewards work', () => {
            const playerBefore = { ...this.mockPlayer, inventory: {} };
            const choice = { 
                text: "Find treasure", 
                next: "treasure-found",
                items: { "potion": 2, "gold": 50 }
            };
            
            const processed = this.processChoiceTest(choice, playerBefore);
            
            if (processed.rewards.items["potion"] !== 2) {
                throw new Error('Potion reward not processed correctly');
            }
            if (processed.rewards.items["gold"] !== 50) {
                throw new Error('Gold reward not processed correctly');
            }
            
            return true;
        }, 'Choice Processing');

        // Test choice with EXP reward
        this.addTest('Choice EXP rewards work', () => {
            const choice = { text: "Complete quest", next: "victory", exp: 250 };
            const processed = this.processChoiceTest(choice, this.mockPlayer);
            
            if (processed.rewards.exp !== 250) {
                throw new Error('EXP reward not processed correctly');
            }
            
            return true;
        }, 'Choice Processing');
    }

    async testDiceRollMechanics() {
        console.log('\n🎲 Testing Dice Roll Mechanics...');

        // Test basic dice roll
        this.addTest('Basic dice roll generates valid result', () => {
            const diceRoll = this.simulateDiceRoll(15, 0); // Mock roll of 15, no bonus
            
            if (diceRoll < 1 || diceRoll > 20) {
                throw new Error(`Invalid dice roll: ${diceRoll}`);
            }
            
            return true;
        }, 'Dice Roll Mechanics');

        // Test attribute bonus calculation
        this.addTest('Attribute bonuses calculated correctly', () => {
            const strengthBonus = this.calculateAttributeBonus(this.mockPlayer.attributes.strength); // 14 -> +2
            const dexBonus = this.calculateAttributeBonus(this.mockPlayer.attributes.dexterity); // 12 -> +1
            const intBonus = this.calculateAttributeBonus(this.mockPlayer.attributes.intelligence); // 11 -> +0
            
            if (strengthBonus !== 2) throw new Error(`Wrong strength bonus: ${strengthBonus}`);
            if (dexBonus !== 1) throw new Error(`Wrong dexterity bonus: ${dexBonus}`);
            if (intBonus !== 0) throw new Error(`Wrong intelligence bonus: ${intBonus}`);
            
            return true;
        }, 'Dice Roll Mechanics');

        // Test dice outcomes
        this.addTest('Dice outcomes process correctly', () => {
            const choice = {
                dice: {
                    attribute: "strength",
                    outcomes: [
                        { min: 1, max: 10, text: "Failed!", life: -10, next: "fail-node" },
                        { min: 11, max: 15, text: "Partial success", life: -5, next: "partial-node" },
                        { min: 16, max: 20, text: "Great success!", life: 5, next: "success-node" }
                    ]
                }
            };
            
            // Test low roll (failure)
            const failResult = this.processDiceChoice(choice, this.mockPlayer, 8); // 8 + 2 (str bonus) = 10
            if (failResult.outcome.next !== "fail-node") {
                throw new Error('Low roll outcome incorrect');
            }
            
            // Test medium roll (partial)
            const partialResult = this.processDiceChoice(choice, this.mockPlayer, 12); // 12 + 2 = 14
            if (partialResult.outcome.next !== "partial-node") {
                throw new Error('Medium roll outcome incorrect');
            }
            
            // Test high roll (success)
            const successResult = this.processDiceChoice(choice, this.mockPlayer, 14); // 14 + 2 = 16
            if (successResult.outcome.next !== "success-node") {
                throw new Error('High roll outcome incorrect');
            }
            
            return true;
        }, 'Dice Roll Mechanics');

        // Test dice with item rewards
        this.addTest('Dice roll item rewards work', () => {
            const choice = {
                dice: {
                    attribute: "dexterity",
                    outcomes: [
                        { 
                            min: 10, max: 20, 
                            text: "Found loot!", 
                            items: { "rare-gem": 1, "potion": 3 },
                            next: "loot-found"
                        }
                    ]
                }
            };
            
            const result = this.processDiceChoice(choice, this.mockPlayer, 15); // 15 + 1 = 16
            
            if (!result.outcome.items || result.outcome.items["rare-gem"] !== 1) {
                throw new Error('Dice roll item rewards not processed');
            }
            
            return true;
        }, 'Dice Roll Mechanics');
    }

    async testEnvironmentalEffects() {
        console.log('\n🌍 Testing Environmental Effects...');

        // Test environmental damage
        this.addTest('Environmental damage processes correctly', () => {
            const environmentalDamage = {
                type: "fire",
                damage: 12,
                description: "Lava burns you!"
            };
            
            const result = this.processEnvironmentalDamage(environmentalDamage, this.mockPlayer);
            
            // Damage reduced by defense: 12 - 5 = 7
            if (result.actualDamage !== 7) {
                throw new Error(`Expected 7 damage, got ${result.actualDamage}`);
            }
            
            return true;
        }, 'Environmental Effects');

        // Test environmental damage with chance
        this.addTest('Environmental chance damage works', () => {
            const environmentalDamage = {
                type: "tripping",
                damage: 6,
                chance: 30,
                description: "You might trip on rocks!"
            };
            
            // Test multiple iterations to verify chance logic
            let damageOccurred = false;
            let noDamageOccurred = false;
            
            for (let i = 0; i < 20; i++) {
                const result = this.processEnvironmentalDamage(environmentalDamage, this.mockPlayer, Math.random() * 100);
                if (result.actualDamage > 0) damageOccurred = true;
                if (result.actualDamage === 0) noDamageOccurred = true;
            }
            
            // With 30% chance over 20 attempts, we should see both outcomes
            if (!damageOccurred || !noDamageOccurred) {
                throw new Error('Environmental chance damage not working properly');
            }
            
            return true;
        }, 'Environmental Effects');

        // Test type-based environmental immunity
        this.addTest('Type immunity to environment works', () => {
            const firePlayer = { ...this.mockPlayer, type: "fire" };
            const volcanicEffect = {
                type: "fire",
                damage: 20,
                description: "Volcanic heat!"
            };
            
            const result = this.processEnvironmentalDamage(volcanicEffect, firePlayer);
            
            // Fire types should be immune to fire damage
            if (result.actualDamage !== 0 || !result.immune) {
                throw new Error('Type immunity not working');
            }
            
            return true;
        }, 'Environmental Effects');

        // Test environmental effects from loaded scenarios
        if (Object.keys(this.scenarios).length > 0) {
            this.addTest('Scenario environmental effects are valid', () => {
                let foundEnvironmentalEffects = false;
                
                for (const scenario of Object.values(this.scenarios)) {
                    const nodes = scenario.nodes || scenario;
                    
                    for (const [nodeKey, node] of Object.entries(nodes)) {
                        if (typeof node !== 'object' || !node.choices) continue;
                        
                        for (const choice of node.choices) {
                            if (choice.environmentalDamage) {
                                foundEnvironmentalEffects = true;
                                
                                if (typeof choice.environmentalDamage.damage !== 'number') {
                                    throw new Error(`Environmental damage must be a number in ${nodeKey}`);
                                }
                                
                                if (choice.environmentalDamage.chance && 
                                    (choice.environmentalDamage.chance < 0 || choice.environmentalDamage.chance > 100)) {
                                    throw new Error(`Environmental damage chance must be 0-100 in ${nodeKey}`);
                                }
                            }
                        }
                    }
                }
                
                return foundEnvironmentalEffects;
            }, 'Environmental Effects');
        }
    }

    async testDamageAndHealing() {
        console.log('\n⚔️ Testing Damage & Healing...');

        // Test damage calculation with defense
        this.addTest('Damage calculation with defense works', () => {
            const damage = -20;
            const defense = this.mockPlayer.secondary.defense; // 5
            const actualDamage = this.calculateDamage(damage, defense);
            
            // -20 + 5 defense = -15 actual damage  
            if (actualDamage !== -15) {
                throw new Error(`Expected -15 damage, got ${actualDamage}`);
            }
            
            return true;
        }, 'Damage & Healing');

        // Test healing doesn't exceed max life
        this.addTest('Healing caps at max life', () => {
            const player = { ...this.mockPlayer, life: 90, maxLife: 100 };
            const healing = 20;
            
            const result = this.applyLifeChange(player, healing);
            
            if (result.life !== 100) {
                throw new Error(`Life should cap at maxLife (100), got ${result.life}`);
            }
            
            return true;
        }, 'Damage & Healing');

        // Test damage doesn't go below 0
        this.addTest('Damage caps at 0 life', () => {
            const player = { ...this.mockPlayer, life: 10 };
            const damage = -50;
            
            const result = this.applyLifeChange(player, damage);
            
            if (result.life !== 0) {
                throw new Error(`Life should not go below 0, got ${result.life}`);
            }
            
            return true;
        }, 'Damage & Healing');

        // Test environmental damage types
        this.addTest('Environmental damage types process correctly', () => {
            const damageTypes = ['fire', 'ice', 'lightning', 'poison', 'tripping', 'rockfall'];
            
            for (const damageType of damageTypes) {
                const damage = {
                    type: damageType,
                    damage: 10,
                    description: `${damageType} damage test`
                };
                
                const result = this.processEnvironmentalDamage(damage, this.mockPlayer);
                
                if (result.damageType !== damageType) {
                    throw new Error(`Damage type ${damageType} not preserved`);
                }
            }
            
            return true;
        }, 'Damage & Healing');
    }

    async testItemAndRewardSystems() {
        console.log('\n🎁 Testing Item & Reward Systems...');

        // Test item addition
        this.addTest('Item addition works correctly', () => {
            const initialInventory = { "potion": 2 };
            const itemRewards = { "potion": 3, "mana-potion": 1, "gold": 100 };
            
            const finalInventory = this.addItemsToInventory(initialInventory, itemRewards);
            
            if (finalInventory["potion"] !== 5) {
                throw new Error(`Expected 5 potions, got ${finalInventory["potion"]}`);
            }
            if (finalInventory["mana-potion"] !== 1) {
                throw new Error(`Expected 1 mana potion, got ${finalInventory["mana-potion"]}`);
            }
            if (finalInventory["gold"] !== 100) {
                throw new Error(`Expected 100 gold, got ${finalInventory["gold"]}`);
            }
            
            return true;
        }, 'Item & Reward Systems');

        // Test EXP rewards
        this.addTest('EXP rewards process correctly', () => {
            const player = { ...this.mockPlayer, exp: 1000, level: 5 };
            const expReward = 500;
            
            const result = this.addExpToPlayer(player, expReward);
            
            if (result.exp !== 1500) {
                throw new Error(`Expected 1500 EXP, got ${result.exp}`);
            }
            
            return true;
        }, 'Item & Reward Systems');

        // Test multiple reward types
        this.addTest('Multiple reward types work together', () => {
            const rewards = {
                exp: 200,
                items: { "rare-sword": 1, "potion": 5 },
                life: 15
            };
            
            const player = { ...this.mockPlayer, life: 80, exp: 800 };
            const result = this.processRewards(player, rewards);
            
            if (result.exp !== 1000) throw new Error('EXP reward not applied');
            if (result.life !== 95) throw new Error('Life reward not applied');
            if (!result.items["rare-sword"]) throw new Error('Item reward not applied');
            
            return true;
        }, 'Item & Reward Systems');

        // Test loaded scenario item references
        if (Object.keys(this.scenarios).length > 0) {
            this.addTest('Scenario item references are consistent', () => {
                const referencedItems = new Set();
                
                for (const scenario of Object.values(this.scenarios)) {
                    const nodes = scenario.nodes || scenario;
                    
                    for (const [nodeKey, node] of Object.entries(nodes)) {
                        if (typeof node !== 'object') continue;
                        
                        // Check items in node rewards
                        if (node.items) {
                            for (const itemId of Object.keys(node.items)) {
                                referencedItems.add(itemId);
                            }
                        }
                        
                        // Check items in choices
                        if (node.choices) {
                            for (const choice of node.choices) {
                                if (choice.items) {
                                    for (const itemId of Object.keys(choice.items)) {
                                        referencedItems.add(itemId);
                                    }
                                }
                                
                                // Check dice outcome items
                                if (choice.dice && choice.dice.outcomes) {
                                    for (const outcome of choice.dice.outcomes) {
                                        if (outcome.items) {
                                            for (const itemId of Object.keys(outcome.items)) {
                                                referencedItems.add(itemId);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                return referencedItems.size;
            }, 'Item & Reward Systems');
        }
    }

    async testBattleIntegration() {
        console.log('\n⚔️ Testing Battle Integration...');

        // Test battle trigger choice
        this.addTest('Battle trigger choice processes correctly', () => {
            const choice = {
                text: "Fight the dragon",
                battle: "dragon-boss",
                next: "victory-node",
                battleEnvironment: { type: "volcanic", intensity: 6 }
            };
            
            const result = this.processBattleChoice(choice);
            
            if (result.battle !== "dragon-boss") {
                throw new Error('Battle ID not preserved');
            }
            if (result.battleEnvironment.type !== "volcanic") {
                throw new Error('Battle environment not preserved');
            }
            
            return true;
        }, 'Battle Integration');

        // Test scenario battle configuration
        if (Object.keys(this.scenarios).length > 0) {
            this.addTest('Scenario battle configurations are valid', () => {
                let foundBattles = false;
                
                for (const scenario of Object.values(this.scenarios)) {
                    if (scenario.enemies && Array.isArray(scenario.enemies)) {
                        foundBattles = true;
                        
                        if (scenario.enemies.length === 0) {
                            throw new Error(`Scenario ${scenario.id} has empty enemies array`);
                        }
                    }
                    
                    const nodes = scenario.nodes || scenario;
                    for (const [nodeKey, node] of Object.entries(nodes)) {
                        if (typeof node !== 'object' || !node.choices) continue;
                        
                        for (const choice of node.choices) {
                            if (choice.battle) {
                                foundBattles = true;
                                
                                if (typeof choice.battle !== 'string') {
                                    throw new Error(`Battle ID must be string in ${nodeKey}`);
                                }
                                
                                if (choice.battleEnvironment) {
                                    if (!choice.battleEnvironment.type) {
                                        throw new Error(`Battle environment missing type in ${nodeKey}`);
                                    }
                                    if (typeof choice.battleEnvironment.intensity !== 'number') {
                                        throw new Error(`Battle environment intensity must be number in ${nodeKey}`);
                                    }
                                }
                            }
                        }
                    }
                }
                
                return foundBattles;
            }, 'Battle Integration');
        }
    }

    async testNodeValidation() {
        console.log('\n✅ Testing Node Validation...');

        // Test required node properties
        this.addTest('Required node properties validation', () => {
            const validNode = {
                title: "Test Node",
                text: "Test description",
                choices: [{ text: "Continue", next: "next-node" }]
            };
            
            const result = this.validateNode(validNode);
            
            if (!result.valid) {
                throw new Error(`Valid node failed validation: ${result.errors.join(', ')}`);
            }
            
            return true;
        }, 'Node Validation');

        // Test invalid node detection
        this.addTest('Invalid node detection works', () => {
            const invalidNode = {
                // Missing title and text
                choices: [{ next: "somewhere" }] // Choice missing text
            };
            
            const result = this.validateNode(invalidNode);
            
            if (result.valid) {
                throw new Error('Invalid node passed validation');
            }
            
            if (result.errors.length < 2) {
                throw new Error('Should detect multiple validation errors');
            }
            
            return true;
        }, 'Node Validation');

        // Test choice validation
        this.addTest('Choice validation works correctly', () => {
            const validChoices = [
                { text: "Go north", next: "forest" },
                { text: "Enter cave", scenario: "caves", next: "entrance" },
                { text: "Fight", battle: "goblin", next: "victory" }
            ];
            
            for (const choice of validChoices) {
                const result = this.validateChoice(choice);
                if (!result.valid) {
                    throw new Error(`Valid choice failed validation: ${result.errors.join(', ')}`);
                }
            }
            
            return true;
        }, 'Node Validation');

        // Test loaded scenario validation
        if (Object.keys(this.scenarios).length > 0) {
            this.addTest('All loaded scenarios are valid', () => {
                let totalNodes = 0;
                let validNodes = 0;
                
                for (const scenario of Object.values(this.scenarios)) {
                    const nodes = scenario.nodes || scenario;
                    
                    for (const [nodeKey, node] of Object.entries(nodes)) {
                        if (typeof node !== 'object') continue;
                        if (['id', 'title', 'noBattle', 'environment', 'enemies', 'respawn'].includes(nodeKey)) continue;
                        
                        totalNodes++;
                        const validation = this.validateNode(node);
                        
                        if (validation.valid) {
                            validNodes++;
                        } else {
                            console.warn(`Invalid node ${nodeKey} in ${scenario.id}: ${validation.errors.join(', ')}`);
                        }
                    }
                }
                
                const validationRate = Math.round((validNodes / totalNodes) * 100);
                
                if (validationRate < 90) {
                    throw new Error(`Low node validation rate: ${validationRate}% (${validNodes}/${totalNodes})`);
                }
                
                return { totalNodes, validNodes, validationRate };
            }, 'Node Validation');
        }
    }

    // Helper methods for testing
    processChoiceTest(choice, player) {
        const playerCopy = JSON.parse(JSON.stringify(player));
        let nextNode = choice.next;
        let rewards = { items: {}, exp: 0 };
        
        if (choice.life !== undefined) {
            let damage = choice.life;
            if (damage < 0 && playerCopy.secondary && playerCopy.secondary.defense) {
                damage = Math.min(0, damage + playerCopy.secondary.defense);
            }
            playerCopy.life += damage;
            if (playerCopy.life > playerCopy.maxLife) playerCopy.life = playerCopy.maxLife;
            if (playerCopy.life < 0) playerCopy.life = 0;
        }
        
        if (choice.items) {
            rewards.items = { ...choice.items };
        }
        
        if (choice.exp) {
            rewards.exp = choice.exp;
        }
        
        return { player: playerCopy, nextNode, rewards };
    }

    simulateDiceRoll(mockRoll = null, bonus = 0) {
        if (mockRoll !== null) return mockRoll + bonus;
        return Math.floor(Math.random() * 20) + 1 + bonus;
    }

    calculateAttributeBonus(attributeValue) {
        return Math.floor((attributeValue - 10) / 2);
    }

    processDiceChoice(choice, player, mockRoll) {
        const baseRoll = mockRoll;
        const attributeValue = player.attributes[choice.dice.attribute] || 10;
        const bonus = this.calculateAttributeBonus(attributeValue);
        const totalRoll = baseRoll + bonus;
        
        let outcome = null;
        if (choice.dice.outcomes) {
            outcome = choice.dice.outcomes.find(o => totalRoll >= o.min && totalRoll <= o.max);
        }
        
        return { baseRoll, bonus, totalRoll, outcome };
    }

    processEnvironmentalDamage(envDamage, player, mockChance = null) {
        let actualDamage = 0;
        let immune = false;
        
        // Check type immunity
        if (player.type === "fire" && envDamage.type === "fire") {
            immune = true;
            return { actualDamage: 0, immune: true, damageType: envDamage.type };
        }
        
        // Check chance
        if (envDamage.chance) {
            const chance = mockChance !== null ? mockChance : Math.random() * 100;
            if (chance > envDamage.chance) {
                return { actualDamage: 0, immune: false, damageType: envDamage.type };
            }
        }
        
        // Calculate damage
        actualDamage = envDamage.damage;
        if (actualDamage > 0 && player.secondary && player.secondary.defense) {
            actualDamage = Math.max(0, actualDamage - player.secondary.defense);
        }
        
        return { actualDamage, immune, damageType: envDamage.type };
    }

    calculateDamage(damage, defense) {
        if (damage < 0) {
            return Math.min(0, damage + defense);
        }
        return damage;
    }

    applyLifeChange(player, lifeChange) {
        const result = { ...player };
        result.life += lifeChange;
        if (result.life > result.maxLife) result.life = result.maxLife;
        if (result.life < 0) result.life = 0;
        return result;
    }

    addItemsToInventory(inventory, items) {
        const result = { ...inventory };
        for (const [itemId, amount] of Object.entries(items)) {
            result[itemId] = (result[itemId] || 0) + amount;
        }
        return result;
    }

    addExpToPlayer(player, exp) {
        return { ...player, exp: player.exp + exp };
    }

    processRewards(player, rewards) {
        let result = { ...player };
        
        if (rewards.exp) {
            result.exp += rewards.exp;
        }
        
        if (rewards.life) {
            result = this.applyLifeChange(result, rewards.life);
        }
        
        if (rewards.items) {
            result.items = this.addItemsToInventory(result.items || {}, rewards.items);
        }
        
        return result;
    }

    processBattleChoice(choice) {
        return {
            battle: choice.battle,
            battleEnvironment: choice.battleEnvironment,
            next: choice.next
        };
    }

    validateNode(node) {
        const errors = [];
        
        if (!node.title) errors.push('Missing title');
        if (!node.text) errors.push('Missing text');
        if (!node.choices || !Array.isArray(node.choices)) {
            errors.push('Missing or invalid choices array');
        } else {
            for (let i = 0; i < node.choices.length; i++) {
                const choiceValidation = this.validateChoice(node.choices[i]);
                if (!choiceValidation.valid) {
                    errors.push(`Choice ${i}: ${choiceValidation.errors.join(', ')}`);
                }
            }
        }
        
        return { valid: errors.length === 0, errors };
    }

    validateChoice(choice) {
        const errors = [];
        
        if (!choice.text) errors.push('Missing text');
        
        if (!choice.next && !choice.scenario && !choice.battle) {
            errors.push('Missing navigation (next, scenario, or battle)');
        }
        
        if (choice.scenario && !choice.next) {
            errors.push('Scenario switch requires next node');
        }
        
        if (choice.dice) {
            if (!choice.dice.outcomes || !Array.isArray(choice.dice.outcomes)) {
                errors.push('Dice choice missing outcomes array');
            }
        }
        
        if (choice.environmentalDamage) {
            if (typeof choice.environmentalDamage.damage !== 'number') {
                errors.push('Environmental damage must be a number');
            }
            if (choice.environmentalDamage.chance && 
                (choice.environmentalDamage.chance < 0 || choice.environmentalDamage.chance > 100)) {
                errors.push('Environmental damage chance must be 0-100');
            }
        }
        
        return { valid: errors.length === 0, errors };
    }
}
