# Quick Development Commands

## For Daily Development Work:

### 1. Test your changes quickly:
```bash
npm start
```
This opens your game in Electron for testing - much faster than building an exe every time.

### 2. Update your story content:
Just edit files in `src/` and `story-content/` folders, then test with `npm start`.

### 3. Create a new release for players:
```bash
# Windows users - just double-click:
build-release.bat

# Or manually:
npm run build-win
```

## Update Workflow:

### Step 1: Develop and Test
1. Edit your story files in `src/` and `story-content/`
2. Test changes: `npm start`
3. Repeat until satisfied

### Step 2: Create Release
1. Run `build-release.bat` (Windows) 
2. This creates a new versioned folder in `../interactive-story-releases/`
3. Share that folder with your players

### Step 3: Version Control
```bash
git add .
git commit -m "Add new story chapter"
git push
```

## File Structure After Setup:
```
D:\Work\Repo\
├── interactive-story-app/          # Your development folder (GitHub repo)
│   ├── src/                        # Game source code
│   ├── story-content/              # Story files
│   ├── package.json                # Build configuration
│   ├── electron-main.js            # Electron setup
│   └── build-release.bat           # Build script
│
└── interactive-story-releases/     # Distribution folder (NOT in GitHub)
    ├── v2025-08-11/                # Today's build
    ├── v2025-08-15/                # Future update
    └── v2025-08-20/                # Another update
```

## Benefits of This Setup:
- ✅ Clean GitHub repo (no large files)
- ✅ Easy to create new releases
- ✅ Keep multiple versions for testing
- ✅ Fast development cycle
- ✅ Easy to share with players
