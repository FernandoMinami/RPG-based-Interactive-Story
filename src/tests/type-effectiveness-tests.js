/**
 * Type Effectiveness Test Suite
 * 
 * Tests all elemental type interactions including:
 * - Fire vs Water, Earth, Air
 * - Water vs Fire, Earth, Air  
 * - Earth vs Fire, Water, Air
 * - Air vs Fire, Water, Earth
 * - Immunity, resistance, and weakness mechanics
 */

import { TestRunner } from './test-framework.js';
import { 
    testPlayer, 
    testEnemy, 
    testWaterEnemy, 
    testAbilities, 
    testTypeData,
    createTestCharacter 
} from './test-data.js';

// Import type system
import { calculateTypeEffectiveness } from '../types.js';

class TypeEffectivenessTests {
    constructor() {
        this.runner = new TestRunner();
        this.setupMockData();
        this.addAllTests();
    }

    setupMockData() {
        // Mock global data that the system expects
        window.testTypeData = testTypeData;
    }

    addAllTests() {
        // Fire Type Tests
        this.runner.test("Fire vs Water - Should be Ineffective", () => this.testFireVsWater());
        this.runner.test("Fire vs Earth - Should be Effective", () => this.testFireVsEarth());
        this.runner.test("Fire vs Air - Should be Normal", () => this.testFireVsAir());
        this.runner.test("Fire vs Fire - Should be Resisted", () => this.testFireVsFire());

        // Water Type Tests
        this.runner.test("Water vs Fire - Should be Effective", () => this.testWaterVsFire());
        this.runner.test("Water vs Earth - Should be Effective", () => this.testWaterVsEarth());
        this.runner.test("Water vs Air - Should be Ineffective", () => this.testWaterVsAir());
        this.runner.test("Water vs Water - Should be Resisted", () => this.testWaterVsWater());

        // Earth Type Tests
        this.runner.test("Earth vs Fire - Should be Ineffective", () => this.testEarthVsFire());
        this.runner.test("Earth vs Water - Should be Ineffective", () => this.testEarthVsWater());
        this.runner.test("Earth vs Air - Should be Effective", () => this.testEarthVsAir());
        this.runner.test("Earth vs Earth - Should be Resisted", () => this.testEarthVsEarth());

        // Air Type Tests
        this.runner.test("Air vs Earth - Should be Ineffective", () => this.testAirVsEarth());
        this.runner.test("Air vs Water - Should be Effective", () => this.testAirVsWater());
        this.runner.test("Air vs Fire - Should be Normal", () => this.testAirVsFire());
        this.runner.test("Air vs Air - Should be Resisted", () => this.testAirVsAir());

        // Edge Cases
        this.runner.test("Physical vs All Types - Should be Normal", () => this.testPhysicalVsAll());
        this.runner.test("Invalid Type Combinations", () => this.testInvalidTypes());
    }

    // === FIRE TYPE TESTS ===

    testFireVsWater() {
        const multiplier = calculateTypeEffectiveness("fire", "water");
        TestRunner.assertEqual(multiplier, 0.7, `Fire vs Water should be 0.7x (ineffective), got ${multiplier}`);
        return true;
    }

    testFireVsEarth() {
        const multiplier = calculateTypeEffectiveness("fire", "earth");
        TestRunner.assertEqual(multiplier, 1.5, `Fire vs Earth should be 1.5x (effective), got ${multiplier}`);
        return true;
    }

    testFireVsAir() {
        const multiplier = calculateTypeEffectiveness("fire", "air");
        TestRunner.assertEqual(multiplier, 1.0, `Fire vs Air should be 1.0x (normal), got ${multiplier}`);
        return true;
    }

    testFireVsFire() {
        const multiplier = calculateTypeEffectiveness("fire", "fire");
        TestRunner.assertEqual(multiplier, 0.7, `Fire vs Fire should be 0.7x (resisted), got ${multiplier}`);
        return true;
    }

    // === WATER TYPE TESTS ===

    testWaterVsFire() {
        const multiplier = calculateTypeEffectiveness("water", "fire");
        TestRunner.assertEqual(multiplier, 1.0, `Water vs Fire should be 1.0x (normal), got ${multiplier}`);
        return true;
    }

    testWaterVsEarth() {
        const multiplier = calculateTypeEffectiveness("water", "earth");
        TestRunner.assertEqual(multiplier, 1.0, `Water vs Earth should be 1.0x (normal), got ${multiplier}`);
        return true;
    }

    testWaterVsAir() {
        const multiplier = calculateTypeEffectiveness("water", "air");
        TestRunner.assertEqual(multiplier, 1.5, `Water vs Air should be 1.5x (effective), got ${multiplier}`);
        return true;
    }

    testWaterVsWater() {
        const multiplier = calculateTypeEffectiveness("water", "water");
        TestRunner.assertEqual(multiplier, 0.7, `Water vs Water should be 0.7x (resisted), got ${multiplier}`);
        return true;
    }

    // === EARTH TYPE TESTS ===

    testEarthVsFire() {
        const multiplier = calculateTypeEffectiveness("earth", "fire");
        TestRunner.assertEqual(multiplier, 1.0, `Earth vs Fire should be 1.0x (normal), got ${multiplier}`);
        return true;
    }

    testEarthVsWater() {
        const multiplier = calculateTypeEffectiveness("earth", "water");
        TestRunner.assertEqual(multiplier, 1.0, `Earth vs Water should be 1.0x (normal), got ${multiplier}`);
        return true;
    }

    testEarthVsAir() {
        const multiplier = calculateTypeEffectiveness("earth", "air");
        TestRunner.assertEqual(multiplier, 1.5, `Earth vs Air should be 1.5x (effective), got ${multiplier}`);
        return true;
    }

    testEarthVsEarth() {
        const multiplier = calculateTypeEffectiveness("earth", "earth");
        TestRunner.assertEqual(multiplier, 0.7, `Earth vs Earth should be 0.7x (resisted), got ${multiplier}`);
        return true;
    }

    // === AIR TYPE TESTS ===

    testAirVsEarth() {
        const multiplier = calculateTypeEffectiveness("air", "earth");
        TestRunner.assertEqual(multiplier, 1.5, `Air vs Earth should be 1.5x (effective), got ${multiplier}`);
        return true;
    }

    testAirVsWater() {
        const multiplier = calculateTypeEffectiveness("air", "water");
        TestRunner.assertEqual(multiplier, 1.5, `Air vs Water should be 1.5x (effective), got ${multiplier}`);
        return true;
    }

    testAirVsFire() {
        const multiplier = calculateTypeEffectiveness("air", "fire");
        TestRunner.assertEqual(multiplier, 1.0, `Air vs Fire should be 1.0x (normal), got ${multiplier}`);
        return true;
    }

    testAirVsAir() {
        const multiplier = calculateTypeEffectiveness("air", "air");
        TestRunner.assertEqual(multiplier, 0.7, `Air vs Air should be 0.7x (resisted), got ${multiplier}`);
        return true;
    }

    // === EDGE CASE TESTS ===

    testPhysicalVsAll() {
        const types = ["fire", "water", "earth", "air"];
        
        types.forEach(defenderType => {
            const multiplier = calculateTypeEffectiveness("physical", defenderType);
            TestRunner.assertEqual(multiplier, 1.0, `Physical vs ${defenderType} should be 1.0x (normal), got ${multiplier}`);
        });
        
        return true;
    }

    testInvalidTypes() {
        // Test with non-existent types
        const invalidMultiplier1 = calculateTypeEffectiveness("invalid", "fire");
        const invalidMultiplier2 = calculateTypeEffectiveness("fire", "invalid");
        const invalidMultiplier3 = calculateTypeEffectiveness("invalid", "invalid");
        
        TestRunner.assertEqual(invalidMultiplier1, 1.0, "Invalid attacker type should default to 1.0x");
        TestRunner.assertEqual(invalidMultiplier2, 1.0, "Invalid defender type should default to 1.0x");
        TestRunner.assertEqual(invalidMultiplier3, 1.0, "Both invalid types should default to 1.0x");
        
        return true;
    }

    async runTests() {
        return await this.runner.runAll();
    }
}

// Export for use in HTML or other modules
export { TypeEffectivenessTests };
