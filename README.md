# Interactive Story Application

## Overview
This project is an interactive story application that allows users to experience a narrative by making choices that affect the outcome of the story. The main interface is built using HTML, CSS, and JavaScript, with story content dynamically loaded from a JSON file.

## Project Structure
```
interactive-story-app
├── src
│   ├── index.html        # Main HTML page for the interactive story
│   ├── story.js          # JavaScript code for fetching and displaying story content
│   └── styles.css        # CSS styles for the application
├── story-content
│   └── story.json        # JSON file containing the story content and choices
└── README.md             # Documentation for the project
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, etc.)
- A local server (optional, for testing purposes)

### Installation
1. Clone the repository to your local machine:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd interactive-story-app
   ```

### Running the Application
1. Open `src/index.html` in your web browser to view the interactive story.
2. If you are using a local server, start it and navigate to the appropriate URL.

### How It Works
- The `index.html` file serves as the main interface for the application, displaying the story and choices.
- The `story.js` file fetches the story content from `story-content/story.json` and updates the HTML elements accordingly.
- The `styles.css` file provides the necessary styles to enhance the user experience.

## Contributing
Feel free to submit issues or pull requests if you have suggestions for improvements or new features.

## License
This project is licensed under the MIT License.