#!/usr/bin/env node

const StoryCreatorBackend = require('./story-creator-backend');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class StoryCreatorCLI {
    constructor() {
        this.backend = new StoryCreatorBackend();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('\n🎮 Interactive Story Creator Studio - CLI\n');
        console.log('Choose an option:');
        console.log('1. Create new story');
        console.log('2. List existing stories');
        console.log('3. Build game with all stories');
        console.log('4. Build game with selected stories');
        console.log('5. Exit\n');

        const choice = await this.question('Enter your choice (1-5): ');

        switch (choice) {
            case '1':
                await this.createNewStory();
                break;
            case '2':
                await this.listStories();
                break;
            case '3':
                await this.buildAllStories();
                break;
            case '4':
                await this.buildSelectedStories();
                break;
            case '5':
                console.log('Goodbye! 👋');
                this.rl.close();
                return;
            default:
                console.log('Invalid choice. Please try again.');
                await this.start();
        }

        // Ask if user wants to continue
        const continueChoice = await this.question('\nDo you want to perform another action? (y/n): ');
        if (continueChoice.toLowerCase() === 'y') {
            await this.start();
        } else {
            console.log('Goodbye! 👋');
            this.rl.close();
        }
    }

    async createNewStory() {
        console.log('\n📝 Creating New Story\n');

        const name = await this.question('Story name: ');
        const description = await this.question('Description: ');
        const author = await this.question('Author: ');

        console.log('\nSelect features (y/n for each):');
        const features = [];
        
        if ((await this.question('Enable combat system? (y/n): ')).toLowerCase() === 'y') {
            features.push('combat');
        }
        if ((await this.question('Enable inventory & items? (y/n): ')).toLowerCase() === 'y') {
            features.push('inventory');
        }
        if ((await this.question('Enable character creation? (y/n): ')).toLowerCase() === 'y') {
            features.push('characters');
        }
        if ((await this.question('Enable save/load system? (y/n): ')).toLowerCase() === 'y') {
            features.push('save');
        }

        console.log('\nSelect template:');
        console.log('1. Blank (start from scratch)');
        console.log('2. Adventure');
        console.log('3. RPG');
        const templateChoice = await this.question('Template (1-3): ');
        
        const templates = { '1': 'blank', '2': 'adventure', '3': 'rpg' };
        const template = templates[templateChoice] || 'blank';

        const folder = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const storyData = {
            name,
            folder,
            description,
            author,
            features,
            template
        };

        try {
            await this.backend.createStory(storyData);
            console.log(`\n✅ Story "${name}" created successfully!`);
            console.log(`📁 Location: story-content/${folder}/`);
        } catch (error) {
            console.log(`\n❌ Error creating story: ${error.message}`);
        }
    }

    async listStories() {
        console.log('\n📚 Existing Stories\n');

        try {
            const storiesFile = path.join(__dirname, 'story-content', '_stories.json');
            const stories = JSON.parse(await fs.readFile(storiesFile, 'utf8'));

            if (stories.length === 0) {
                console.log('No stories found. Create your first story!');
                return;
            }

            stories.forEach((story, index) => {
                console.log(`${index + 1}. ${story.name}`);
                console.log(`   📁 Folder: ${story.folder}`);
                console.log(`   📄 Start file: ${story.file}\n`);
            });

        } catch (error) {
            console.log('❌ Error reading stories: ' + error.message);
        }
    }

    async buildAllStories() {
        console.log('\n🔨 Building Game with All Stories\n');

        const gameTitle = await this.question('Game title (default: "My Interactive Story Game"): ') 
            || 'My Interactive Story Game';
        const gameVersion = await this.question('Version (default: "1.0.0"): ') || '1.0.0';

        console.log('\nSelect platform:');
        console.log('1. Windows (.exe)');
        console.log('2. macOS (.dmg)');
        console.log('3. Linux (.AppImage)');
        console.log('4. All platforms');
        const platformChoice = await this.question('Platform (1-4): ');

        const platforms = { '1': 'windows', '2': 'mac', '3': 'linux', '4': 'all' };
        const platform = platforms[platformChoice] || 'windows';

        try {
            // Get all stories
            const storiesFile = path.join(__dirname, 'story-content', '_stories.json');
            const stories = JSON.parse(await fs.readFile(storiesFile, 'utf8'));
            const selectedStories = stories.map(s => s.folder.replace('./', ''));

            const buildConfig = {
                gameTitle,
                gameVersion,
                platform,
                selectedStories
            };

            console.log('\n🚀 Starting build process...');
            await this.backend.buildGameWithStories(buildConfig);

        } catch (error) {
            console.log(`\n❌ Build failed: ${error.message}`);
        }
    }

    async buildSelectedStories() {
        console.log('\n🔨 Building Game with Selected Stories\n');

        // First show available stories
        await this.listStories();

        const gameTitle = await this.question('Game title: ');
        const gameVersion = await this.question('Version (default: "1.0.0"): ') || '1.0.0';

        // Let user select stories
        console.log('\nEnter story numbers to include (comma-separated, e.g., 1,3,5):');
        const selection = await this.question('Selected stories: ');
        
        try {
            const storiesFile = path.join(__dirname, 'story-content', '_stories.json');
            const stories = JSON.parse(await fs.readFile(storiesFile, 'utf8'));
            
            const selectedIndices = selection.split(',').map(s => parseInt(s.trim()) - 1);
            const selectedStories = selectedIndices
                .filter(i => i >= 0 && i < stories.length)
                .map(i => stories[i].folder.replace('./', ''));

            if (selectedStories.length === 0) {
                console.log('❌ No valid stories selected.');
                return;
            }

            console.log('\nSelect platform:');
            console.log('1. Windows (.exe)');
            console.log('2. macOS (.dmg)');
            console.log('3. Linux (.AppImage)');
            console.log('4. All platforms');
            const platformChoice = await this.question('Platform (1-4): ');

            const platforms = { '1': 'windows', '2': 'mac', '3': 'linux', '4': 'all' };
            const platform = platforms[platformChoice] || 'windows';

            const buildConfig = {
                gameTitle,
                gameVersion,
                platform,
                selectedStories
            };

            console.log(`\n🚀 Building "${gameTitle}" with ${selectedStories.length} stories...`);
            await this.backend.buildGameWithStories(buildConfig);

        } catch (error) {
            console.log(`\n❌ Build failed: ${error.message}`);
        }
    }

    question(prompt) {
        return new Promise(resolve => {
            this.rl.question(prompt, resolve);
        });
    }
}

// Start the CLI if run directly
if (require.main === module) {
    const cli = new StoryCreatorCLI();
    cli.start().catch(console.error);
}

module.exports = StoryCreatorCLI;
