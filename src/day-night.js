/**
 * Day and Night Cycle System
 * 
 * Manages time progression throughout the game with different time periods.
 * Time starts at 08:00 AM (dayTime = 0) and progresses in minutes.
 * 
 * Time Periods:
 * - Morning: 0-240 (08:00-12:00)
 * - Afternoon: 240-540 (12:00-17:00) 
 * - Evening: 540-900 (17:00-23:00)
 * - Night: 900-1440 (23:00-08:00)
 */

// Time state
let dayTime = 0; // Starts at 08:00 AM
let currentDay = 1;

// Time period constants
const TIME_PERIODS = {
    MORNING: { start: 0, end: 240, name: 'Morning' },
    AFTERNOON: { start: 240, end: 540, name: 'Afternoon' },
    EVENING: { start: 540, end: 900, name: 'Evening' },
    NIGHT: { start: 900, end: 1440, name: 'Night' }
};

// Time progression constants
const TIME_PROGRESSION = {
    NODE_CHOICE: 30,        // Default time added per node choice
    BATTLE_ROUND: 2,        // Time added per battle round
    QUICK_REST: 180,        // Time added for quick rest (3 hours)
    FULL_DAY: 1440          // Total minutes in a day
};

/**
 * Initialize the day-night system
 */
export function initializeDayNight() {
    // Wait a bit to ensure DOM is ready
    setTimeout(() => {
        // Create time display in UI
        createTimeDisplay();
        
        // Create rest buttons
        createRestButtons();
        
        // Update initial display
        updateTimeDisplay();
        
        console.log('Day-Night system initialized');
    }, 100);
}

/**
 * Reinitialize day-night system (for scenario transitions)
 */
export function reinitializeDayNight() {
    // Remove existing elements first
    const existingTimeDisplay = document.getElementById('time-display-container');
    if (existingTimeDisplay) {
        existingTimeDisplay.remove();
    }
    
    const existingRestButtons = document.getElementById('rest-buttons-container');
    if (existingRestButtons) {
        existingRestButtons.remove();
    }
    
    // Reinitialize
    initializeDayNight();
}

/**
 * Get current day time
 */
export function getDayTime() {
    return dayTime;
}

/**
 * Get current day number
 */
export function getCurrentDay() {
    return currentDay;
}

/**
 * Set day time (for loading saves)
 */
export function setDayTime(time) {
    dayTime = Math.max(0, Math.min(time, TIME_PROGRESSION.FULL_DAY - 1));
    updateTimeDisplay();
}

/**
 * Set current day (for loading saves)
 */
export function setCurrentDay(day) {
    currentDay = Math.max(1, day);
    updateTimeDisplay();
}

/**
 * Get current time period
 */
export function getCurrentTimePeriod() {
    for (const [key, period] of Object.entries(TIME_PERIODS)) {
        if (dayTime >= period.start && dayTime < period.end) {
            return {
                key: key,
                name: period.name,
                start: period.start,
                end: period.end
            };
        }
    }
    return TIME_PERIODS.NIGHT; // Default fallback
}

/**
 * Check if current time is within a specific period
 */
export function isTimePeriod(periodKey) {
    const currentPeriod = getCurrentTimePeriod();
    return currentPeriod.key === periodKey.toUpperCase();
}

/**
 * Advance time by specified amount
 */
export function advanceTime(minutes) {
    console.log(`🕒 Advancing time by ${minutes} minutes (current: ${dayTime})`);
    dayTime += minutes;
    
    // Check if we've passed midnight
    if (dayTime >= TIME_PROGRESSION.FULL_DAY) {
        dayTime = dayTime % TIME_PROGRESSION.FULL_DAY;
        currentDay++;
        console.log(`New day! Day ${currentDay} begins.`);
    }
    
    console.log(`🕒 New time: ${formatTime()} (${getCurrentTimePeriod().name})`);
    updateTimeDisplay();
}

/**
 * Advance time for a node choice
 */
export function advanceTimeForChoice(customTime = null) {
    const timeToAdd = customTime !== null ? customTime : TIME_PROGRESSION.NODE_CHOICE;
    console.log(`🎯 Choice made - advancing time by ${timeToAdd} minutes`);
    advanceTime(timeToAdd);
}

/**
 * Advance time for a battle round
 */
export function advanceTimeForBattleRound() {
    advanceTime(TIME_PROGRESSION.BATTLE_ROUND);
}

/**
 * Sleep - reset to morning (08:00 AM)
 */
export function sleep() {
    dayTime = 0;
    currentDay++;
    updateTimeDisplay();
    
    // Trigger sleep benefits (can be extended later)
    console.log(`Slept well! Day ${currentDay} begins at 08:00 AM.`);
    
    // Notify other systems about sleep
    triggerSleepEffects();
}

/**
 * Quick rest - advance time by 3 hours
 */
export function quickRest() {
    advanceTime(TIME_PROGRESSION.QUICK_REST);
    
    // Trigger rest benefits (can be extended later)
    console.log('Quick rest completed. Feeling refreshed!');
    
    // Notify other systems about rest
    triggerRestEffects();
}

/**
 * Convert dayTime to readable time format
 */
export function formatTime(time = dayTime) {
    const totalMinutes = time;
    const baseHour = 8; // Starting at 08:00
    
    const totalHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let hour = (baseHour + totalHours) % 24;
    
    // Format with leading zeros
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = minutes.toString().padStart(2, '0');
    
    return `${hourStr}:${minuteStr}`;
}

/**
 * Get time period display info
 */
export function getTimePeriodDisplay() {
    const period = getCurrentTimePeriod();
    const timeStr = formatTime();
    
    return {
        time: timeStr,
        period: period.name,
        day: currentDay,
        fullDisplay: `Day ${currentDay} - ${timeStr} (${period.name})`
    };
}

/**
 * Create time display element in UI
 */
function createTimeDisplay() {
    const characterStatus = document.getElementById('current-character-status');
    if (!characterStatus) {
        console.warn('Character status element not found for time display');
        return;
    }
    
    // Create time display container
    const timeContainer = document.createElement('div');
    timeContainer.id = 'time-display-container';
    timeContainer.className = 'time-display';
    
    // Create time display
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'current-time-display';
    timeDisplay.innerHTML = `
        <div class="time-info">
            <strong>🕒 Time:</strong> <span id="time-clock">--:--</span>
        </div>
        <div class="period-info">
            <strong>🌅 Period:</strong> <span id="time-period">---</span>
        </div>
        <div class="day-info">
            <strong>📅 Day:</strong> <span id="day-number">1</span>
        </div>
    `;
    
    timeContainer.appendChild(timeDisplay);
    characterStatus.appendChild(timeContainer);
}

/**
 * Create rest buttons in UI
 */
function createRestButtons() {
    const characterStatus = document.getElementById('current-character-status');
    if (!characterStatus) {
        console.warn('Character status element not found for rest buttons');
        return;
    }
    
    // Create rest buttons container
    const restContainer = document.createElement('div');
    restContainer.id = 'rest-buttons-container';
    restContainer.className = 'rest-buttons';
    
    // Sleep button
    const sleepButton = document.createElement('button');
    sleepButton.id = 'sleep-button';
    sleepButton.className = 'rest-btn sleep-btn';
    sleepButton.innerHTML = '🛌 Sleep (Full Rest)';
    sleepButton.title = 'Sleep until morning (08:00 AM)';
    sleepButton.addEventListener('click', handleSleep);
    
    // Quick rest button
    const quickRestButton = document.createElement('button');
    quickRestButton.id = 'quick-rest-button';
    quickRestButton.className = 'rest-btn quick-rest-btn';
    quickRestButton.innerHTML = '☕ Quick Rest (3h)';
    quickRestButton.title = 'Rest for 3 hours';
    quickRestButton.addEventListener('click', handleQuickRest);
    
    restContainer.appendChild(sleepButton);
    restContainer.appendChild(quickRestButton);
    characterStatus.appendChild(restContainer);
}

/**
 * Update time display in UI
 */
function updateTimeDisplay() {
    const timeDisplay = getTimePeriodDisplay();
    
    // Update clock
    const clockElement = document.getElementById('time-clock');
    if (clockElement) {
        clockElement.textContent = timeDisplay.time;
    }
    
    // Update period
    const periodElement = document.getElementById('time-period');
    if (periodElement) {
        periodElement.textContent = timeDisplay.period;
        // Add period-specific styling
        periodElement.className = `period-${timeDisplay.period.toLowerCase()}`;
    }
    
    // Update day
    const dayElement = document.getElementById('day-number');
    if (dayElement) {
        dayElement.textContent = timeDisplay.day;
    }
    
    // If elements don't exist, schedule a reinitialization
    if (!clockElement || !periodElement || !dayElement) {
        console.warn('Day-night display elements not found, scheduling reinitialization...');
        setTimeout(() => {
            const characterStatus = document.getElementById('current-character-status');
            if (characterStatus && !document.getElementById('time-clock')) {
                console.log('Reinitializing day-night system...');
                reinitializeDayNight();
            }
        }, 500);
    }
}

/**
 * Handle sleep button click
 */
function handleSleep() {
    if (confirm('Sleep until morning? This will advance to the next day at 08:00 AM.')) {
        sleep();
        
        // Show feedback
        showTimeMessage('You slept well and feel refreshed!');
    }
}

/**
 * Handle quick rest button click
 */
function handleQuickRest() {
    if (confirm('Take a quick rest? This will advance time by 3 hours.')) {
        quickRest();
        
        // Show feedback
        showTimeMessage('You feel somewhat refreshed after your quick rest.');
    }
}

/**
 * Show time-related message to player
 */
function showTimeMessage(message) {
    // Create or update message display
    let messageElement = document.getElementById('time-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'time-message';
        messageElement.className = 'time-message';
        
        const timeContainer = document.getElementById('time-display-container');
        if (timeContainer) {
            timeContainer.appendChild(messageElement);
        }
    }
    
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    
    // Hide message after 3 seconds
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

/**
 * Trigger sleep effects (placeholder for future extensions)
 */
function triggerSleepEffects() {
    // This can be extended to:
    // - Restore stamina fully
    // - Heal some HP
    // - Reset daily abilities
    // - Trigger random events
    
    // Dispatch custom event for other systems to listen to
    window.dispatchEvent(new CustomEvent('playerSlept', {
        detail: { day: currentDay, time: dayTime }
    }));
}

/**
 * Trigger rest effects (placeholder for future extensions)
 */
function triggerRestEffects() {
    // This can be extended to:
    // - Restore some stamina
    // - Heal minor HP
    // - Trigger minor random events
    
    // Dispatch custom event for other systems to listen to
    window.dispatchEvent(new CustomEvent('playerRested', {
        detail: { day: currentDay, time: dayTime }
    }));
}

/**
 * Save day-night state for game saves
 */
export function saveDayNightState() {
    return {
        dayTime: dayTime,
        currentDay: currentDay
    };
}

/**
 * Load day-night state from game saves
 */
export function loadDayNightState(state) {
    if (state && typeof state === 'object') {
        dayTime = state.dayTime || 0;
        currentDay = state.currentDay || 1;
        updateTimeDisplay();
    }
}

/**
 * Check if a choice is available at current time
 */
export function isChoiceAvailableAtCurrentTime(choice) {
    // Check if choice has time restrictions
    if (!choice.timeRestriction) {
        return true; // No time restriction
    }
    
    const currentPeriod = getCurrentTimePeriod();
    const restriction = choice.timeRestriction;
    
    // Support multiple formats:
    // - Single period: "morning"
    // - Multiple periods: ["morning", "afternoon"]
    // - Time range: { start: 240, end: 540 }
    
    if (typeof restriction === 'string') {
        return currentPeriod.key.toLowerCase() === restriction.toLowerCase();
    }
    
    if (Array.isArray(restriction)) {
        return restriction.some(period => 
            currentPeriod.key.toLowerCase() === period.toLowerCase()
        );
    }
    
    if (typeof restriction === 'object' && restriction.start !== undefined && restriction.end !== undefined) {
        return dayTime >= restriction.start && dayTime < restriction.end;
    }
    
    return true; // Default to available if restriction format is unrecognized
}

/**
 * Get available time periods for choice restrictions
 */
export function getTimePeriods() {
    return TIME_PERIODS;
}

/**
 * Export constants for external use
 */
export const TIME_CONSTANTS = {
    PERIODS: TIME_PERIODS,
    PROGRESSION: TIME_PROGRESSION
};

// Make functions available globally for compatibility
window.DayNight = {
    getDayTime,
    getCurrentDay,
    setDayTime,
    setCurrentDay,
    getCurrentTimePeriod,
    isTimePeriod,
    advanceTime,
    advanceTimeForChoice,
    advanceTimeForBattleRound,
    sleep,
    quickRest,
    formatTime,
    getTimePeriodDisplay,
    isChoiceAvailableAtCurrentTime,
    saveDayNightState,
    loadDayNightState,
    reinitializeDayNight,
    TIME_CONSTANTS
};

console.log('Day-Night system loaded');
