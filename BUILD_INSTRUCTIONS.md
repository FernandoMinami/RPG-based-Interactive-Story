# Electron Build Instructions

## How to create a standalone executable for your Interactive Story Game

### Prerequisites
- Node.js installed on your system
- npm (comes with Node.js)

### Setup Steps

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Test the app in development mode:**
   ```
   npm start
   ```

3. **Build the executable:**
   
   For Windows:
   ```
   npm run build-win
   ```
   
   For macOS:
   ```
   npm run build-mac
   ```
   
   For Linux:
   ```
   npm run build-linux
   ```

4. **Find your executable:**
   After building, you'll find the executable in the `dist` folder:
   - Windows: `dist/Interactive Story Game Setup.exe` (installer) or `dist/win-unpacked/Interactive Story Game.exe`
   - macOS: `dist/Interactive Story Game.dmg`
   - Linux: `dist/Interactive Story Game.AppImage`

### What gets created:
- **Windows**: An `.exe` file that players can double-click to run
- **macOS**: A `.dmg` file containing a `.app` that players can drag to Applications
- **Linux**: An `.AppImage` file that players can make executable and run

### Distribution:
- Share the executable file with your players
- They can run it without installing Node.js, a web server, or any other dependencies
- The entire game is packaged into a single, portable application

### File Size:
- The executable will be approximately 150-200MB because it includes the Electron runtime
- This is normal for Electron apps and ensures compatibility across different systems

### Customization:
- Edit `package.json` to change app name, version, or build settings
- Edit `electron-main.js` to modify window size, add/remove menu bar, etc.
- Replace `favicon.ico` with your own icon for a custom app icon
