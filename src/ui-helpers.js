/**
 * UI Helpers - Centralized UI update functions
 * Handles content updates for both old and new layouts
 */

/**
 * Helper function to update content in both old and new layouts
 * @param {string} elementBaseName - Base name for the element (without layout suffix)
 * @param {string} content - HTML content to set
 */
export function updateElementContent(elementBaseName, content) {
    // Update old layout element (if exists)
    const oldElement = document.getElementById(elementBaseName);
    if (oldElement) {
        oldElement.innerHTML = content;
    }
    
    // Update new main layout element (if exists)
    const mainElement = document.getElementById(`${elementBaseName}-main`);
    if (mainElement) {
        mainElement.innerHTML = content;
    }
    
    // Update story layout element (if exists)  
    const storyElement = document.getElementById(`${elementBaseName}-story`);
    if (storyElement) {
        storyElement.innerHTML = content;
    }
}

/**
 * Helper function to update story title in both layouts
 * @param {string} title - The story title to display
 */
export function updateStoryTitle(title) {
    updateElementContent("story-title", title);
}

/**
 * Helper function to update choices container in both layouts
 * @param {string} choicesHtml - HTML content for choices
 */
export function updateChoicesContainer(choicesHtml) {
    updateElementContent("choices", choicesHtml);
}

/**
 * Hide all UI containers (used during navigation)
 */
export function hideAllContainers() {
    const containers = [
        "inventory-modal",
        "story-container", 
        "gameover-container",
        "character-selection",
        "game-mode-selection",
        "story-selection"
    ];
    
    containers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = "none";
        }
    });
    
    const storyContainer = document.querySelector(".story-container");
    if (storyContainer) {
        storyContainer.style.display = "none";
    }
}

/**
 * Show specific container and hide others
 * @param {string} containerId - ID of container to show
 */
export function showContainer(containerId) {
    hideAllContainers();
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = "";
    }
}

/**
 * Update text content for an element in both layouts
 * @param {string} elementBaseName - Base name for the element
 * @param {string} text - Text content to set
 */
export function updateElementText(elementBaseName, text) {
    // Update old layout element (if exists)
    const oldElement = document.getElementById(elementBaseName);
    if (oldElement) {
        oldElement.textContent = text;
    }
    
    // Update new layout element (if exists)  
    const newElement = document.getElementById(`${elementBaseName}-story`);
    if (newElement) {
        newElement.textContent = text;
    }
}

/**
 * Show/hide element in both layouts
 * @param {string} elementBaseName - Base name for the element
 * @param {boolean} show - Whether to show or hide
 */
export function toggleElementVisibility(elementBaseName, show) {
    const display = show ? "" : "none";
    
    // Update old layout element (if exists)
    const oldElement = document.getElementById(elementBaseName);
    if (oldElement) {
        oldElement.style.display = display;
    }
    
    // Update new layout element (if exists)
    const newElement = document.getElementById(`${elementBaseName}-story`);
    if (newElement) {
        newElement.style.display = display;
    }
}

/**
 * Create notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info)
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showNotification(message, type = 'info', duration = 4000) {
    const colors = {
        success: '#28a745',
        error: '#dc3545', 
        info: '#17a2b8',
        warning: '#ffc107'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: ${colors[type] || colors.info}; 
        color: white; 
        padding: 15px; 
        border-radius: 5px; 
        z-index: 10000; 
        font-family: Arial, sans-serif;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}
