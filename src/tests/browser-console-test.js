// Browser Console Test for Range Immunity
// Run this in the browser console after loading the game



// Test the core functions
if (typeof window.hasIsHighStatus !== 'function') {

} else {

}

if (typeof window.checkDynamicRangeImmunity !== 'function') {

} else {

}

// Test with actual game data
function testRangeImmunity() {

    
    // Find flying character
    const player = window.playerCharacters?.[0];
    if (!player) {

        return;
    }
    


    
    // Find ground enemy
    const enemy = window.enemies?.[0];
    if (!enemy) {

        return;
    }
    


    
    // Create test ability
    const closeAttack = {
        name: "Test Stomp",
        range: "close",
        type: "physical"
    };
    

    
    // Test 1: Check if player has flying status
    const playerIsFlying = window.hasIsHighStatus(player);

    
    // Test 2: Check if enemy has flying status
    const enemyIsFlying = window.hasIsHighStatus(enemy);

    
    // Test 3: Check immunity (enemy attacks flying player)
    const immunity1 = window.checkDynamicRangeImmunity(player, closeAttack, enemy);
    console.log(`Immunity test 1 (enemy attacks flying player): ${immunity1}`);
    
    // Test 4: Check immunity (flying player attacks enemy)
    const immunity2 = window.checkDynamicRangeImmunity(enemy, closeAttack, player);
    console.log(`Immunity test 2 (flying player attacks enemy): ${immunity2}`);
    
    return {
        playerIsFlying,
        enemyIsFlying,
        enemyAttacksPlayer: immunity1,
        playerAttacksEnemy: immunity2
    };
}

// Export to window for easy access
window.testRangeImmunity = testRangeImmunity;
