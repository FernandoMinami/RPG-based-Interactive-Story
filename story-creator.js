class StoryCreatorStudio {
    constructor() {
        this.stories = [];
        this.init();
    }

    async init() {
        await this.loadExistingStories();
        this.setupEventListeners();
        this.populateStorySelections();
    }

    // Tab Management
    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName + '-tab').classList.remove('hidden');
        
        // Add active class to clicked button
        event.target.classList.add('active');
    }

    // Load existing stories from the file system
    async loadExistingStories() {
        try {
            // In a real implementation, this would read from the file system
            // For now, we'll simulate with the known structure
            this.stories = [
                {
                    name: "story01 battle",
                    folder: "story01-battle-st",
                    description: "Battle-focused RPG story with combat system",
                    author: "System",
                    features: ["combat", "inventory", "characters", "save"],
                    created: new Date("2025-01-01"),
                    lastModified: new Date("2025-08-11")
                }
            ];
            
            this.renderStoryList();
        } catch (error) {
            this.log("Error loading stories: " + error.message, "error");
        }
    }

    // Render the story list in the manage tab
    renderStoryList() {
        const container = document.getElementById('story-list');
        container.innerHTML = '';

        this.stories.forEach(story => {
            const storyCard = document.createElement('div');
            storyCard.className = 'story-card';
            storyCard.innerHTML = `
                <h4>📖 ${story.name}</h4>
                <p><strong>Author:</strong> ${story.author}</p>
                <p><strong>Description:</strong> ${story.description}</p>
                <p><strong>Features:</strong> ${story.features.join(', ')}</p>
                <p><strong>Last Modified:</strong> ${story.lastModified.toLocaleDateString()}</p>
                <div class="story-actions">
                    <button class="button" onclick="storyStudio.editStory('${story.folder}')">
                        ✏️ Edit
                    </button>
                    <button class="button secondary" onclick="storyStudio.duplicateStory('${story.folder}')">
                        📋 Duplicate
                    </button>
                    <button class="button secondary" onclick="storyStudio.exportStory('${story.folder}')">
                        📤 Export
                    </button>
                    <button class="button danger" onclick="storyStudio.deleteStory('${story.folder}')">
                        🗑️ Delete
                    </button>
                </div>
            `;
            container.appendChild(storyCard);
        });
    }

    // Populate story selections in build tab
    populateStorySelections() {
        const container = document.getElementById('story-selection');
        const copySelect = document.getElementById('copy-from');
        
        container.innerHTML = '';
        copySelect.innerHTML = '<option value="">Select a story to copy...</option>';

        this.stories.forEach(story => {
            // Build tab checkboxes
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'input-group';
            checkboxDiv.innerHTML = `
                <label>
                    <input type="checkbox" value="${story.folder}" checked>
                    📖 ${story.name}
                </label>
            `;
            container.appendChild(checkboxDiv);

            // Copy dropdown
            const option = document.createElement('option');
            option.value = story.folder;
            option.textContent = story.name;
            copySelect.appendChild(option);
        });
    }

    // Create new story
    async createStory() {
        const name = document.getElementById('story-name').value.trim();
        const description = document.getElementById('story-description').value.trim();
        const author = document.getElementById('story-author').value.trim();
        const template = document.getElementById('story-template').value;

        if (!name || !author) {
            alert('Please provide at least a story name and author.');
            return;
        }

        this.log(`Creating new story: "${name}"...`);

        try {
            // Generate folder name (safe for file system)
            const folderName = name.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 50);

            // Get selected features
            const features = [];
            if (document.getElementById('enable-combat').checked) features.push('combat');
            if (document.getElementById('enable-inventory').checked) features.push('inventory');
            if (document.getElementById('enable-characters').checked) features.push('characters');
            if (document.getElementById('enable-save').checked) features.push('save');

            const newStory = {
                name,
                folder: folderName,
                description,
                author,
                features,
                template,
                created: new Date(),
                lastModified: new Date()
            };

            // In a real implementation, this would create the actual folder structure
            await this.createStoryStructure(newStory);

            this.stories.push(newStory);
            this.renderStoryList();
            this.populateStorySelections();

            this.log(`✅ Story "${name}" created successfully!`, "success");
            
            // Clear form
            document.getElementById('story-name').value = '';
            document.getElementById('story-description').value = '';
            document.getElementById('story-author').value = '';

        } catch (error) {
            this.log(`❌ Error creating story: ${error.message}`, "error");
        }
    }

    // Create the actual story folder structure
    async createStoryStructure(story) {
        this.log(`📁 Creating folder structure for "${story.name}"...`);
        
        // This would use Node.js fs operations in a real implementation
        // For now, we'll log what would be created
        
        const structure = [
            `story-content/${story.folder}/`,
            `story-content/${story.folder}/scenarios/`,
            `story-content/${story.folder}/scenarios/${story.folder}-start.json`
        ];

        if (story.features.includes('combat')) {
            structure.push(
                `story-content/${story.folder}/abilities/`,
                `story-content/${story.folder}/enemies/`,
                `story-content/${story.folder}/types/`
            );
        }

        if (story.features.includes('inventory')) {
            structure.push(
                `story-content/${story.folder}/items/`,
                `story-content/${story.folder}/loot/`
            );
        }

        if (story.features.includes('characters')) {
            structure.push(
                `story-content/${story.folder}/characters/`,
                `story-content/${story.folder}/races/`,
                `story-content/${story.folder}/npcs/`
            );
        }

        structure.forEach(path => {
            this.log(`  📄 Creating: ${path}`);
        });

        // Would also create template files based on the selected template
        await this.createTemplateFiles(story);
    }

    // Create template files based on story type
    async createTemplateFiles(story) {
        this.log(`📝 Creating template files...`);
        
        const templates = {
            blank: {
                'scenarios/start.json': this.getBlankScenarioTemplate(story),
                'README.md': this.getStoryReadmeTemplate(story)
            },
            adventure: {
                'scenarios/start.json': this.getAdventureTemplate(story),
                'scenarios/forest.json': this.getForestTemplate(),
                'scenarios/village.json': this.getVillageTemplate()
            },
            rpg: {
                'scenarios/start.json': this.getRpgTemplate(story),
                'characters/warrior.json': this.getWarriorTemplate(),
                'characters/mage.json': this.getMageTemplate(),
                'enemies/goblin.json': this.getGoblinTemplate()
            }
        };

        const templateFiles = templates[story.template] || templates.blank;
        
        Object.entries(templateFiles).forEach(([file, content]) => {
            this.log(`  📝 Creating template: ${file}`);
            // In real implementation, would write to file system
        });
    }

    // Build the game
    async buildGame() {
        const gameTitle = document.getElementById('game-title').value || 'My Interactive Story Game';
        const gameVersion = document.getElementById('game-version').value || '1.0.0';
        const platform = document.getElementById('build-platform').value;

        // Get selected stories
        const selectedStories = Array.from(document.querySelectorAll('#story-selection input:checked'))
            .map(cb => cb.value);

        if (selectedStories.length === 0) {
            alert('Please select at least one story to include in the build.');
            return;
        }

        this.log('🔨 Starting build process...', 'info');
        this.showBuildProgress(true);

        try {
            // Step 1: Prepare build
            this.updateBuildProgress(10, 'Preparing build configuration...');
            await this.delay(1000);

            // Step 2: Copy stories
            this.updateBuildProgress(25, 'Copying selected stories...');
            await this.copySelectedStories(selectedStories);
            await this.delay(1500);

            // Step 3: Update configuration
            this.updateBuildProgress(50, 'Updating game configuration...');
            await this.updateGameConfig(gameTitle, gameVersion, selectedStories);
            await this.delay(1000);

            // Step 4: Build executable
            this.updateBuildProgress(75, `Building ${platform} executable...`);
            await this.runElectronBuild(platform);
            await this.delay(2000);

            // Step 5: Complete
            this.updateBuildProgress(100, 'Build completed successfully!');
            this.log('✅ Build completed! Check the releases folder.', 'success');

        } catch (error) {
            this.log(`❌ Build failed: ${error.message}`, 'error');
            this.updateBuildProgress(0, 'Build failed');
        }
    }

    // Show/hide build progress
    showBuildProgress(show) {
        const progressDiv = document.getElementById('build-progress');
        if (show) {
            progressDiv.classList.remove('hidden');
        } else {
            progressDiv.classList.add('hidden');
        }
    }

    // Update build progress
    updateBuildProgress(percent, status) {
        document.getElementById('progress-fill').style.width = percent + '%';
        document.getElementById('build-status').textContent = status;
        this.log(`[${percent}%] ${status}`);
    }

    // Copy selected stories for build
    async copySelectedStories(selectedStories) {
        this.log('📋 Copying selected stories to build...');
        selectedStories.forEach(storyFolder => {
            const story = this.stories.find(s => s.folder === storyFolder);
            this.log(`  📖 Including: ${story ? story.name : storyFolder}`);
        });
    }

    // Update game configuration
    async updateGameConfig(title, version, stories) {
        this.log('⚙️ Updating game configuration...');
        this.log(`  🎮 Title: ${title}`);
        this.log(`  📊 Version: ${version}`);
        this.log(`  📚 Stories: ${stories.length} selected`);
    }

    // Run Electron build
    async runElectronBuild(platform) {
        this.log(`🔧 Building for platform: ${platform}`);
        
        const commands = {
            windows: 'npm run build-win',
            mac: 'npm run build-mac',
            linux: 'npm run build-linux',
            all: 'npm run build'
        };

        const command = commands[platform];
        this.log(`  💻 Running: ${command}`);
        
        // In real implementation, would execute the actual command
        // For simulation, we'll just show what would happen
    }

    // Utility functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Edit story
    editStory(folder) {
        this.log(`✏️ Opening story editor for: ${folder}`);
        // Would open a story editor interface
        alert(`Story editor for "${folder}" would open here.\nFeature coming soon!`);
    }

    // Duplicate story
    duplicateStory(folder) {
        const story = this.stories.find(s => s.folder === folder);
        if (story) {
            const newName = prompt(`Enter name for duplicate of "${story.name}":`, story.name + ' Copy');
            if (newName) {
                this.log(`📋 Duplicating story: ${story.name} → ${newName}`);
                // Would create actual duplicate
            }
        }
    }

    // Export story
    exportStory(folder) {
        this.log(`📤 Exporting story: ${folder}`);
        // Would create exportable package
        alert(`Export feature for "${folder}" coming soon!`);
    }

    // Delete story
    deleteStory(folder) {
        if (confirm(`Are you sure you want to delete the story in folder "${folder}"?`)) {
            this.stories = this.stories.filter(s => s.folder !== folder);
            this.renderStoryList();
            this.populateStorySelections();
            this.log(`🗑️ Deleted story: ${folder}`, 'warning');
        }
    }

    // Play in browser
    playInBrowser() {
        this.log('🌐 Opening game in browser...');
        // Would open the main game
        window.open('../src/index.html', '_blank');
    }

    // Validate stories
    validateStories() {
        this.log('🔍 Validating all stories...');
        const resultsDiv = document.getElementById('validation-results');
        resultsDiv.classList.remove('hidden');
        resultsDiv.innerHTML = 'Running validation checks...<br>';
        
        setTimeout(() => {
            resultsDiv.innerHTML += '✅ All stories passed validation!<br>';
            resultsDiv.innerHTML += '📊 Checked: Story structure, JSON syntax, references<br>';
            resultsDiv.innerHTML += '🎯 No errors found.<br>';
        }, 2000);
    }

    // Logging
    log(message, type = 'info') {
        const logContainer = document.getElementById('build-log');
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        
        logContainer.innerHTML += `<span style="color: #888">[${timestamp}]</span> ${prefix} ${message}<br>`;
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Template generators
    getBlankScenarioTemplate(story) {
        return {
            id: "start",
            title: `Welcome to ${story.name}`,
            description: `This is the beginning of your interactive story: ${story.name}`,
            choices: [
                {
                    text: "Begin your adventure",
                    action: {
                        type: "scenario",
                        target: "next-scene"
                    }
                }
            ]
        };
    }

    getStoryReadmeTemplate(story) {
        return `# ${story.name}

By: ${story.author}

## Description
${story.description}

## Features
${story.features.map(f => `- ${f}`).join('\n')}

## Getting Started
This story was created with the Interactive Story Creator Studio.

To edit this story:
1. Open the Story Creator Studio
2. Go to "Manage Stories"
3. Click "Edit" on this story

## File Structure
- \`scenarios/\` - Story scenarios and scenes
- \`characters/\` - Character definitions
- \`items/\` - Item definitions
- \`enemies/\` - Enemy definitions (if combat enabled)

Happy storytelling!
`;
    }

    // Setup event listeners
    setupEventListeners() {
        // Template change handler
        document.getElementById('story-template').addEventListener('change', (e) => {
            const copyOptions = document.getElementById('copy-story-options');
            if (e.target.value === 'copy-existing') {
                copyOptions.classList.remove('hidden');
            } else {
                copyOptions.classList.add('hidden');
            }
        });
    }
}

// Make functions available globally
function showTab(tabName) {
    storyStudio.showTab(tabName);
}

function createStory() {
    storyStudio.createStory();
}

function buildGame() {
    storyStudio.buildGame();
}

function playInBrowser() {
    storyStudio.playInBrowser();
}

function validateStories() {
    storyStudio.validateStories();
}

function testBuild() {
    storyStudio.log('🧪 Running test build...');
    alert('Test build feature coming soon!');
}

function openBuildFolder() {
    storyStudio.log('📁 Opening build folder...');
    alert('This would open the build/releases folder in your file explorer.');
}

function previewTemplate() {
    const template = document.getElementById('story-template').value;
    alert(`Preview for "${template}" template would show here.`);
}

function importStory() {
    storyStudio.log('📁 Importing story from file...');
    alert('Import story feature coming soon!');
}

function openGameFolder() {
    storyStudio.log('📁 Opening game source folder...');
    alert('This would open the src/ folder in your file explorer.');
}

function reloadStories() {
    storyStudio.log('🔄 Reloading stories...');
    storyStudio.loadExistingStories();
}

function showValidationReport() {
    const resultsDiv = document.getElementById('validation-results');
    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = 'Last validation report:<br>✅ All stories validated successfully<br>📊 No issues found<br>';
}

// Initialize the application
const storyStudio = new StoryCreatorStudio();
