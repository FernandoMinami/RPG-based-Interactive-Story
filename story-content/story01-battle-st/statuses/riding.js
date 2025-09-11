// Riding Status - Character is riding a mount

export default {
    id: "riding",
    name: "Riding",
    turns: 0, // Permanent until dismounted
    immuneTypes: [],
    
    type: "physical",
    
    // Speed is replaced by mount's speed (handled by special mount logic)
    // This will be handled in the special-effects when mount system is active
    
    // NEW: Marks this status as providing elevation (riding gives height advantage)
    isHigh: true,
    
    description: "Riding a mount. Speed and some abilities may be modified."
};
