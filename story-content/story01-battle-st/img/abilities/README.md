# Ability Images

This folder contains images for abilities and attacks used in battles.

## File naming convention:
- Use the ability ID followed by "-attack" 
- Supported formats: .jpg, .jpeg, .png, .gif, .webp, .svg
- Recommended size: 400x300 pixels or similar aspect ratio

## Examples:
- stomp-attack.svg
- body-slam-attack.svg
- fireball-attack.png
- heal-spell.jpg

## Usage in ability files:
```javascript
export default {
    id: "stomp",
    name: "Stomp",
    img: "stomp-attack.svg",
    // ... other ability properties
};
```

You can also use web URLs for images:
```javascript
export default {
    id: "ability-id",
    name: "Ability Name", 
    img: "https://example.com/image.jpg",
    // ... other ability properties
};
```
