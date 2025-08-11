const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class StoryCreatorBackend {
    constructor() {
        this.storyContentPath = path.join(__dirname, 'story-content');
        this.templatesPath = path.join(__dirname, 'story-templates');
    }

    // Create a new story with full folder structure
    async createStory(storyData) {
        const { name, folder, description, author, features, template } = storyData;
        const storyPath = path.join(this.storyContentPath, folder);

        try {
            // Create main story folder
            await fs.mkdir(storyPath, { recursive: true });

            // Create basic folder structure
            const baseFolders = ['scenarios'];
            
            // Add feature-specific folders
            if (features.includes('combat')) {
                baseFolders.push('abilities', 'enemies', 'types', 'statuses');
            }
            if (features.includes('inventory')) {
                baseFolders.push('items', 'loot');
            }
            if (features.includes('characters')) {
                baseFolders.push('characters', 'races', 'npcs');
            }
            
            // Create all folders
            for (const folderName of baseFolders) {
                await fs.mkdir(path.join(storyPath, folderName), { recursive: true });
            }

            // Create template files
            await this.createTemplateFiles(storyPath, storyData);

            // Update stories index
            await this.updateStoriesIndex(storyData);

            console.log(`✅ Story "${name}" created successfully at ${storyPath}`);
            return { success: true, path: storyPath };

        } catch (error) {
            console.error(`❌ Error creating story: ${error.message}`);
            throw error;
        }
    }

    // Create template files based on story type and features
    async createTemplateFiles(storyPath, storyData) {
        const { name, folder, description, author, features, template } = storyData;

        // Create README.md
        const readmeContent = this.generateReadmeTemplate(storyData);
        await fs.writeFile(path.join(storyPath, 'README.md'), readmeContent);

        // Create main scenario file
        const startScenario = this.generateStartScenario(storyData);
        await fs.writeFile(
            path.join(storyPath, 'scenarios', `${folder}-start.json`),
            JSON.stringify(startScenario, null, 2)
        );

        // Create feature-specific template files
        if (features.includes('combat')) {
            await this.createCombatTemplates(storyPath);
        }
        if (features.includes('characters')) {
            await this.createCharacterTemplates(storyPath);
        }
        if (features.includes('inventory')) {
            await this.createInventoryTemplates(storyPath);
        }

        // Create story-type specific content
        await this.createStoryTypeTemplates(storyPath, template, storyData);
    }

    // Generate README template
    generateReadmeTemplate(storyData) {
        return `# ${storyData.name}

**Author:** ${storyData.author}

## Description
${storyData.description}

## Features Enabled
${storyData.features.map(f => `- ${f.charAt(0).toUpperCase() + f.slice(1)}`).join('\n')}

## Story Structure

### Scenarios
- \`scenarios/${storyData.folder}-start.json\` - Starting scenario

${storyData.features.includes('characters') ? `### Characters
- \`characters/\` - Character definitions and templates` : ''}

${storyData.features.includes('combat') ? `### Combat System
- \`enemies/\` - Enemy definitions
- \`abilities/\` - Special abilities and spells
- \`types/\` - Element types and effectiveness
- \`statuses/\` - Status effects` : ''}

${storyData.features.includes('inventory') ? `### Items & Inventory
- \`items/\` - Item definitions
- \`loot/\` - Loot tables and rewards` : ''}

## Development Notes

This story was created with the Interactive Story Creator Studio.

### Getting Started
1. Edit scenarios in the \`scenarios/\` folder
2. Add new characters, items, enemies as needed
3. Test your story using the Story Creator Studio
4. Build your game when ready to share

### Tips
- Keep scenario IDs unique within your story
- Use descriptive file names
- Test story paths thoroughly
- Consider adding images in an \`img/\` folder

---
*Created on ${new Date().toLocaleDateString()} with Interactive Story Creator Studio*
`;
    }

    // Generate starting scenario
    generateStartScenario(storyData) {
        const templates = {
            blank: {
                id: "start",
                title: `Welcome to ${storyData.name}`,
                description: `You are about to begin "${storyData.name}" - ${storyData.description}`,
                choices: [
                    {
                        text: "Begin your adventure",
                        action: {
                            type: "scenario",
                            target: "chapter1"
                        }
                    }
                ]
            },
            adventure: {
                id: "start",
                title: `The Adventure Begins`,
                description: `Welcome, brave adventurer, to ${storyData.name}! ${storyData.description}\n\nYou stand at the edge of a mysterious forest, with three paths before you. Your adventure begins now.`,
                choices: [
                    {
                        text: "Take the left path through the dark woods",
                        action: {
                            type: "scenario",
                            target: "dark-woods"
                        }
                    },
                    {
                        text: "Take the middle path to the village",
                        action: {
                            type: "scenario",
                            target: "village"
                        }
                    },
                    {
                        text: "Take the right path up the mountain",
                        action: {
                            type: "scenario",
                            target: "mountain-path"
                        }
                    }
                ]
            },
            rpg: {
                id: "start",
                title: "Character Creation",
                description: `Welcome to ${storyData.name}! ${storyData.description}\n\nBefore your adventure begins, you must choose your character.`,
                characterCreation: true,
                choices: [
                    {
                        text: "Choose your character and begin",
                        action: {
                            type: "scenario",
                            target: "prologue"
                        }
                    }
                ]
            }
        };

        return templates[storyData.template] || templates.blank;
    }

    // Create combat-related template files
    async createCombatTemplates(storyPath) {
        // Create basic enemy template
        const basicEnemy = {
            id: "example-enemy",
            name: "Example Enemy",
            description: "A basic enemy template",
            stats: {
                health: 100,
                attack: 15,
                defense: 10,
                speed: 12
            },
            type: "normal",
            abilities: ["basic-attack"],
            loot: {
                gold: { min: 10, max: 25 },
                items: [
                    { id: "healing-potion", chance: 0.3 }
                ]
            }
        };

        await fs.writeFile(
            path.join(storyPath, 'enemies', 'example-enemy.json'),
            JSON.stringify(basicEnemy, null, 2)
        );

        // Create basic ability template
        const basicAbility = {
            id: "example-ability",
            name: "Example Ability",
            description: "A basic ability template",
            type: "attack",
            manaCost: 10,
            effects: [
                {
                    type: "damage",
                    amount: 25,
                    target: "enemy"
                }
            ]
        };

        await fs.writeFile(
            path.join(storyPath, 'abilities', 'example-ability.json'),
            JSON.stringify(basicAbility, null, 2)
        );
    }

    // Create character template files
    async createCharacterTemplates(storyPath) {
        const exampleCharacter = {
            id: "example-character",
            name: "Example Character",
            description: "A basic character template",
            stats: {
                health: 100,
                mana: 50,
                attack: 20,
                defense: 15,
                speed: 18
            },
            startingAbilities: ["basic-attack"],
            startingItems: ["healing-potion"]
        };

        await fs.writeFile(
            path.join(storyPath, 'characters', 'example-character.json'),
            JSON.stringify(exampleCharacter, null, 2)
        );
    }

    // Create inventory template files
    async createInventoryTemplates(storyPath) {
        const exampleItem = {
            id: "example-item",
            name: "Example Item",
            description: "A basic item template",
            type: "consumable",
            value: 10,
            effects: [
                {
                    type: "heal",
                    amount: 25
                }
            ]
        };

        await fs.writeFile(
            path.join(storyPath, 'items', 'example-item.json'),
            JSON.stringify(exampleItem, null, 2)
        );
    }

    // Create story-type specific templates
    async createStoryTypeTemplates(storyPath, template, storyData) {
        if (template === 'adventure') {
            // Create additional scenarios for adventure template
            const villageScenario = {
                id: "village",
                title: "The Peaceful Village",
                description: "You arrive at a small, peaceful village. The villagers seem friendly, but you notice something strange in their eyes...",
                choices: [
                    {
                        text: "Talk to the village elder",
                        action: { type: "scenario", target: "elder-meeting" }
                    },
                    {
                        text: "Investigate the strange behavior",
                        action: { type: "scenario", target: "investigation" }
                    },
                    {
                        text: "Leave the village immediately",
                        action: { type: "scenario", target: "forest-escape" }
                    }
                ]
            };

            await fs.writeFile(
                path.join(storyPath, 'scenarios', 'village.json'),
                JSON.stringify(villageScenario, null, 2)
            );
        }
    }

    // Update the main stories index
    async updateStoriesIndex(storyData) {
        const storiesFile = path.join(this.storyContentPath, '_stories.json');
        
        try {
            let stories = [];
            try {
                const content = await fs.readFile(storiesFile, 'utf8');
                stories = JSON.parse(content);
            } catch (error) {
                // File doesn't exist or is invalid, start with empty array
            }

            // Add new story
            stories.push({
                name: storyData.name,
                file: `./${storyData.folder}/scenarios/${storyData.folder}-start.json`,
                folder: `./${storyData.folder}`
            });

            await fs.writeFile(storiesFile, JSON.stringify(stories, null, 2));
            console.log('📝 Updated stories index');

        } catch (error) {
            console.error(`❌ Error updating stories index: ${error.message}`);
        }
    }

    // Build the game with selected stories
    async buildGameWithStories(buildConfig) {
        const { gameTitle, gameVersion, platform, selectedStories } = buildConfig;

        try {
            console.log(`🔨 Building "${gameTitle}" v${gameVersion} for ${platform}`);

            // Create a temporary build configuration
            await this.createBuildConfig(buildConfig);

            // Update package.json with new title and version
            await this.updatePackageJson(gameTitle, gameVersion);

            // Copy only selected stories to a temporary location
            await this.prepareStoriesForBuild(selectedStories);

            // Run the actual build
            const buildCommand = this.getBuildCommand(platform);
            console.log(`💻 Running: ${buildCommand}`);
            
            execSync(buildCommand, { stdio: 'inherit' });

            // Copy to releases folder with custom name
            await this.copyToReleases(gameTitle, gameVersion);

            console.log('✅ Build completed successfully!');
            return { success: true };

        } catch (error) {
            console.error(`❌ Build failed: ${error.message}`);
            throw error;
        }
    }

    // Helper methods for build process
    getBuildCommand(platform) {
        const commands = {
            windows: 'npm run build-win',
            mac: 'npm run build-mac',
            linux: 'npm run build-linux',
            all: 'npm run build'
        };
        return commands[platform] || commands.windows;
    }

    async updatePackageJson(title, version) {
        const packagePath = path.join(__dirname, 'package.json');
        const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
        
        packageData.name = title.toLowerCase().replace(/\s+/g, '-');
        packageData.version = version;
        packageData.build.productName = title;
        
        await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
    }

    async prepareStoriesForBuild(selectedStories) {
        // Update _stories.json to include only selected stories
        const storiesFile = path.join(this.storyContentPath, '_stories.json');
        const allStories = JSON.parse(await fs.readFile(storiesFile, 'utf8'));
        
        const filteredStories = allStories.filter(story => 
            selectedStories.includes(story.folder.replace('./', ''))
        );

        await fs.writeFile(storiesFile, JSON.stringify(filteredStories, null, 2));
        console.log(`📚 Prepared ${filteredStories.length} stories for build`);
    }

    async copyToReleases(title, version) {
        const releaseFolder = path.join(__dirname, '..', 'interactive-story-releases', 
            `${title.replace(/\s+/g, '-')}-v${version}`);
        
        await fs.mkdir(releaseFolder, { recursive: true });
        
        // Copy build output to releases folder
        const distPath = path.join(__dirname, 'dist', 'win-unpacked');
        if (await this.pathExists(distPath)) {
            await this.copyFolder(distPath, releaseFolder);
            console.log(`📁 Copied build to: ${releaseFolder}`);
        }
    }

    // Utility methods
    async pathExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    async copyFolder(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const items = await fs.readdir(src);
        
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = await fs.stat(srcPath);
            
            if (stat.isDirectory()) {
                await this.copyFolder(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }
}

// Export for use in other scripts
module.exports = StoryCreatorBackend;

// If run directly, provide CLI interface
if (require.main === module) {
    const backend = new StoryCreatorBackend();
    
    // Example usage
    const exampleStory = {
        name: "My Test Story",
        folder: "my-test-story",
        description: "A test story created with the backend",
        author: "Test Author",
        features: ["combat", "inventory", "characters"],
        template: "rpg"
    };

    backend.createStory(exampleStory)
        .then(() => console.log('Story created successfully!'))
        .catch(console.error);
}
