# Image System for Battle UI

## Folder Structure
```
story-content/story01-battle-st/img/
├── enemies/     - Enemy character images
├── bosses/      - Boss character images  
├── npcs/        - NPC images
├── players/     - Player character images
└── scenarios/   - Environment/background images
```

## Image Requirements
- **Format**: JPG, PNG, WebP, or any web-compatible format
- **Size**: Recommended 150x150 pixels (square aspect ratio)
- **Quality**: Medium to high quality for clear display
- **File size**: Keep under 500KB for fast loading

## Implementation

### For Enemies
Add `imagePath` property to enemy files:
```javascript
export const enemy = {
  name: "Fire Dragon",
  id: "fire-dragon",
  imagePath: "../story-content/story01-battle-st/img/enemies/fire-dragon.jpg",
  // ... other properties
};
```

### For Players
Add `imagePath` property to character files:
```javascript
export let player = {
  name: "Hero",
  id: "hero",
  imagePath: "../story-content/story01-battle-st/img/players/hero.jpg",
  // ... other properties
};
```

## Battle UI Layout

When images are present:
- **With Image**: Flexbox layout with 60px square image on left, stats on right
- **Without Image**: Falls back to simple text-based layout
- **Auto-hide**: If image fails to load, it automatically hides and layout adjusts

## Error Handling
- Images include `onerror="this.style.display='none'"` to gracefully handle missing files
- If no `imagePath` is specified, the UI shows text-only layout
- Battle continues normally regardless of image availability

## Adding Your Own Images
1. Place image files in the appropriate subfolder
2. Update the character/enemy file with the correct `imagePath`
3. Test by starting a battle - images should appear next to character stats
