# Templates for Story Content Creation

This directory contains templates to help you create new content for your interactive story game. These templates ensure consistency and make development faster.

## 📋 Available Templates

### 1. Type Template (`type-template.js`)
Use this template to create new elemental types (fire, water, poison, etc.)

**What it includes:**
- Basic type information (name, description, icon, lore)
- Combat properties (resistances, weaknesses, immunities)
- Environmental effects for all environment types
- Ability type bonuses
- Status effect interactions

### 2. Environment Template (`environment-template.js`)
Use this template to create new environmental effects (desert, forest, volcano, etc.)

**What it includes:**
- Basic environment information
- Global effects that affect all characters
- Type-specific interactions
- Combat modifiers
- Visual and audio effects
- Scenario integration effects

## 🚀 How to Use Templates

### Creating a New Type:
1. Copy `type-template.js` and rename it to `your-type.json`
2. Remove the JavaScript export wrapper
3. Fill in all the properties for your type
4. Add your type to `_types.json` manifest
5. Test and balance

### Creating a New Environment:
1. Copy `environment-template.js` and rename it to `your-environment.json`
2. Remove the JavaScript export wrapper
3. Fill in all the properties for your environment
4. Add your environment to `_environmentalEffects.json` manifest
5. Test and balance

## 💡 Design Guidelines

### Type Design:
- **Thematic Consistency**: Make sure resistances and weaknesses make logical sense
- **Balance**: No type should be overpowered or completely useless
- **Interesting Interactions**: Create meaningful choices in type selection
- **Environmental Synergy**: Consider how your type interacts with existing environments

### Environment Design:
- **Atmospheric**: Create immersive environments that enhance the story
- **Strategic Impact**: Environments should create meaningful tactical decisions
- **Type Diversity**: Ensure no single type dominates in your environment
- **Balanced Risk/Reward**: Challenging environments should offer appropriate rewards

## 🎯 Balance Guidelines

### Damage Multipliers:
- **Resistant**: 0.5-0.8 (takes less damage/environmental effects)
- **Normal**: 1.0 (no special interaction)
- **Vulnerable**: 1.2-2.0 (takes more damage/environmental effects)

### Ability Type Bonuses:
- **Same Type**: 1.2 (20% bonus is standard)
- **Related Type**: 1.1 (10% bonus for synergistic types)
- **Opposing Type**: 0.9 (10% penalty for conflicting types)

### Environmental Effects:
- **Per-turn Damage**: 2-5 HP (scaled for multiple turns)
- **Per-turn Healing**: 3-8 HP (should be meaningful but not overpowered)
- **Combat Modifiers**: 0.8-1.2 range (subtle but noticeable)

## 🧪 Testing Your Content

1. **Create a test scenario** using your new type/environment
2. **Play through multiple battles** to ensure balance
3. **Test type interactions** with existing content
4. **Verify environmental effects** work as expected
5. **Check for any bugs** or unintended interactions

## 📁 File Organization

```
types/
  ├── _types.json              (manifest file)
  ├── type-template.js         (template for new types)
  ├── fire.json               (example type)
  └── your-new-type.json      (your creation)

environmentalEffects/
  ├── _environmentalEffects.json  (manifest file)
  ├── environment-template.js     (template for new environments)
  ├── volcanic.json              (example environment)
  └── your-new-environment.json  (your creation)
```

## 🎨 Creative Ideas

### Type Ideas:
- **Poison**: DoT specialist, immune to poison, weak to pure elements
- **Crystal**: High defense, shatters under pressure, refracts light attacks
- **Void**: Nullifies abilities, consumes energy, vulnerable to creation magic
- **Nature**: Growth and healing, seasonal power cycles, weak to fire and ice

### Environment Ideas:
- **Floating Islands**: Air types empowered, fall damage risks
- **Crystal Caves**: Light refraction effects, crystal type bonuses
- **Corrupted Wasteland**: Constant poison damage, dark types thrive
- **Time Rift**: Random speed effects, temporal magic enhanced

Remember: The best content enhances the story and creates interesting player choices!
