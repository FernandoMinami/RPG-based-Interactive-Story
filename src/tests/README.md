# Interactive Story Tests

This directory contains comprehensive test suites for the Interactive Story application.

## Main Test Runner

**`tests-runner.html`** - The main test interface that includes all test suites:

### Available Test Suites:

1. **⚔️ Battle System Tests** (`battle-tests.js`)
   - Combat mechanics and damage calculations
   - Accuracy and speed-based hit chance
   - Environmental integration
   - Battle flow and win/loss conditions

2. **🔥 Type Effectiveness Tests** (`type-effectiveness-tests.js`, `story-type-tests.js`)
   - Story-specific elemental type interactions
   - Damage multipliers and immunities
   - Type system validation

3. **📖 Story Node Tests** (`story-node-tests.js`)
   - Interactive choices and navigation
   - Dice roll mechanics
   - Environmental effects integration
   - Item and reward systems
   - Battle integration

4. **🌍 Environmental Effects Tests** (`environmental-effects-tests.js`)
   - Weather and terrain systems
   - Type interactions with environments
   - Intensity levels and scaling
   - Combat modifier validation
   - **Regression tests for cave accuracy, underwater speed penalties, and type immunity**

5. **🧪 Status Effects Tests** (`status-effects-tests.js`)
   - Status application and removal
   - Flying mechanics (speed boost, immunity, fall damage)
   - Pinned mechanics (movement restriction, speed penalties)
   - Type-based status interactions
   - Poison, burn, stun, and other status effects

## 🚀 How to Run Tests

### Option 1: Browser Test Runner (Recommended)
1. Open `src/tests/tests-runner.html` in your browser
2. Select a story to test (e.g., "story01-battle-st")
3. Choose a test suite to run
4. Watch the visual test results with detailed breakdown

**Note:** Individual test runner HTML files have been consolidated into the main `tests-runner.html` for better organization. All previous regression tests for environmental effects have been integrated into the main environmental test suite.

### Option 2: Command Line
```bash
cd src/tests
node run-tests.js
```

### Option 3: Direct Import
```javascript
import { BattleSystemTests } from './src/tests/battle-tests.js';

const testSuite = new BattleSystemTests();
const results = await testSuite.runTests();
```

## 📁 Test Files

- **`test-framework.js`** - Simple testing framework with assertions
- **`test-data.js`** - Mock characters, abilities, and environments
- **`battle-tests.js`** - Complete battle system test suite
- **`battle-test-runner.html`** - Visual browser test runner
- **`run-tests.js`** - Command-line test runner

## 🧪 Test Data

The test suite uses realistic mock data:

- **Fire Hero** (Level 5) - Fire type with fireball abilities
- **Earth Goblin** (Level 3) - Earth type with rock throw
- **Water Elemental** (Level 4) - Water type for effectiveness testing
- **Multiple environments** - Volcanic, underwater, storm, cave
- **Varied abilities** - Physical attacks, elemental spells, healing

## ✅ Expected Results

All tests should pass if the battle system is working correctly:

- **Damage calculations** should respect type effectiveness
- **Accuracy** should be influenced by speed and size
- **Environmental effects** should apply proper immunities and penalties
- **Critical hits** should increase damage appropriately
- **Battle flow** should handle all edge cases

## 🐛 Debugging Failed Tests

If tests fail, check:

1. **Import paths** - Make sure all battle system modules are properly imported
2. **Mock data** - Verify test characters have all required properties
3. **Type effectiveness** - Check that the type system data is loaded
4. **Environmental data** - Ensure environmental definitions are available
5. **Console output** - Look for specific assertion errors

## 🔧 Adding New Tests

To add new test cases:

1. Add test data to `test-data.js` if needed
2. Add new test method to the `BattleSystemTests` class
3. Register the test in `addAllTests()` method
4. Use `TestRunner.assert()` helpers for validation

Example:
```javascript
testNewFeature() {
    const result = calculateNewFeature(testData);
    TestRunner.assertEqual(result.value, expectedValue);
    TestRunner.assert(result.isValid, "Feature should be valid");
    return true;
}
```

## 📊 Test Coverage

Current test coverage includes:
- ✅ All damage calculation paths
- ✅ All type effectiveness combinations  
- ✅ All environmental effect types
- ✅ Critical hit and accuracy edge cases
- ✅ Battle initialization and cleanup
- ✅ Error handling and boundary conditions

The test suite provides confidence that the battle system works correctly across all scenarios!
