/**
 * Command-line Battle System Test Runner
 * 
 * Run this with: node src/tests/run-tests.js
 */

import { BattleSystemTests } from './battle-tests.js';


async function runAllTests() {
    try {
        const testSuite = new BattleSystemTests();
        const results = await testSuite.runTests();
        
        // Exit with error code if tests failed
        if (results.failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('\n❌ Test runner error:', error);
        process.exit(1);
    }
}

runAllTests();
