/**
 * Simple Test Framework for Battle System Testing
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Add a test case
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function that returns true/false or throws
     */
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log("Running tests...");
        
        for (const test of this.tests) {
            try {
                console.log(`Testing: ${test.name}`);
                const result = await test.testFunction();
                if (result === true || result === undefined) {
                    console.log(`✓ ${test.name} passed`);
                    this.results.passed++;
                } else {
                    console.log(`✗ ${test.name} failed`);
                    this.results.failed++;
                }
            } catch (error) {
                console.log(`✗ ${test.name} failed with error: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        }

        console.log(`\nTest Results: ${this.results.passed}/${this.results.total} passed, ${this.results.failed} failed`);
        
        return this.results;
    }

    /**
     * Assert helper functions
     */
    static assert(condition, message = "Assertion failed") {
        if (!condition) {
            throw new Error(message);
        }
    }

    static assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
        if (actual !== expected) {
            throw new Error(message);
        }
    }

    static assertRange(value, min, max, message = `Value ${value} not in range [${min}, ${max}]`) {
        if (value < min || value > max) {
            throw new Error(message);
        }
    }

    static assertType(value, type, message = `Expected type ${type}, got ${typeof value}`) {
        if (typeof value !== type) {
            throw new Error(message);
        }
    }

    static assertProperty(obj, property, message = `Object missing property: ${property}`) {
        if (!obj.hasOwnProperty(property)) {
            throw new Error(message);
        }
    }
}

export { TestRunner };
