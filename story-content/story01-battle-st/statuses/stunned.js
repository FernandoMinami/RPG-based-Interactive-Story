// Stunned status effect
// Character cannot act for the specified number of turns
export default {
    name: "Stunned",
    description: "Unable to act",
    
    apply(target) {
        // No immediate effect on application
    },
    
    tick(target, turns) {
        // No ongoing effect, just prevents action
        return turns - 1;
    },
    
    remove(target) {
        // No effect on removal
    },
    
    summary(target) {
        return "stunned";
    },
    
    // Stunned characters cannot act
    preventsAction: true
};