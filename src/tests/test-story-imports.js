// Test Story Node Tests imports
console.log("🔍 Testing Story Node Tests Imports");

try {
    // Test individual imports
    import('../utils.js').then(utils => {
        console.log("✅ utils.js imports:", Object.keys(utils));
        console.log("✅ executeDiceRoll available:", typeof utils.executeDiceRoll === 'function');
        console.log("✅ processChoice available:", typeof utils.processChoice === 'function');
    }).catch(err => {
        console.error("❌ utils.js import failed:", err.message);
    });

    import('../story.js').then(story => {
        console.log("✅ story.js imports:", Object.keys(story));
        console.log("✅ setPlayer available:", typeof story.setPlayer === 'function');
        console.log("✅ showNode available:", typeof story.showNode === 'function');
    }).catch(err => {
        console.error("❌ story.js import failed:", err.message);
    });

    import('../conditional-system.js').then(conditional => {
        console.log("✅ conditional-system.js imports:", Object.keys(conditional));
        console.log("✅ isChoiceVisible available:", typeof conditional.isChoiceVisible === 'function');
    }).catch(err => {
        console.error("❌ conditional-system.js import failed:", err.message);
    });

    setTimeout(() => {
        console.log("\n🎯 Import Test Complete - Check above for any errors");
    }, 1000);

} catch (error) {
    console.error("❌ Import test failed:", error);
}
