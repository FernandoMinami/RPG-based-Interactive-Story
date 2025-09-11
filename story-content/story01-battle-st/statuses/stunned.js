// Stunned Status - Character cannot act

export default {
    id: "stunned",
    name: "Stunned",
    turns: 1, // Usually lasts 1 turn
    immuneTypes: [],
    endsWithBattle: true, // Stunned status ends when battle is over
    
    type: "physical",
    
    // Cannot act at all
    unnableAct: true,
    
    description: "Stunned and unable to act for this turn."
};
