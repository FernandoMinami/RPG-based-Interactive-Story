# Scenario Images

This folder contains images for story scenarios/nodes.

## File naming convention:
- Use descriptive names that match the node IDs or descriptions
- Supported formats: .jpg, .jpeg, .png, .gif, .webp
- Recommended size: 600x400 pixels or similar aspect ratio

## Examples:
- town-entrance.jpg
- town-center.jpg  
- library-interior.png
- forest-path.jpg

## Usage in scenario files:
```json
{
  "node-id": {
    "title": "Scene Title",
    "img": "image-filename.jpg",
    "text": "Scene description..."
  }
}
```

You can also use web URLs for images:
```json
{
  "node-id": {
    "title": "Scene Title", 
    "img": "https://example.com/image.jpg",
    "text": "Scene description..."
  }
}
```
