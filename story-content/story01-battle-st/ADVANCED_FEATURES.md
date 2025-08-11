# Advanced Story Features Documentation

This document explains the new conditional systems and random encounters added to the interactive story engine.

## Table of Contents

1. [Random Encounter Nodes](#random-encounter-nodes)
2. [Conditional Choices](#conditional-choices)
3. [Quest System](#quest-system)
4. [Physical Characteristic Requirements](#physical-characteristic-requirements)
5. [Examples](#examples)

## Random Encounter Nodes

Random encounter nodes are special nodes that have a chance to appear when entering a story node. They provide dynamic, unpredictable content that can vary each time a player visits the same location.

### Basic Structure

```json
{
  "title": "Main Location",
  "text": "You enter the town square...",
  "randomEncounters": [
    {
      "chance": 15,
      "title": "Traveling Merchant",
      "text": "A merchant approaches you!",
      "items": {
        "gold": 10
      },
      "choices": [
        {
          "text": "Thank the merchant",
          "next": "continue"
        }
      ]
    }
  ]
}
```

### Random Encounter Properties

- **chance**: Percentage chance (0-100) for the encounter to trigger
- **title**: Title shown when encounter triggers
- **text**: Description of the encounter
- **items**: Items granted by the encounter
- **life/mana/exp**: Stat changes from the encounter
- **choices**: Available choices during the encounter
- **requirements**: Requirements for encounter to be available (same format as choice requirements)

### Requirements for Random Encounters

Random encounters can have requirements just like choices:

```json
{
  "chance": 10,
  "title": "Master Thief Challenge",
  "text": "A master thief challenges you to a contest of skill!",
  "requirements": {
    "attributes": {
      "dexterity": 18
    },
    "quests": {
      "completedQuests": ["thieves-guild-initiation"]
    }
  }
}
```

## Conditional Choices

The new conditional system allows choices to appear or be rejected based on various player characteristics.

### Choice Requirements Structure

```json
{
  "text": "Your choice text",
  "requirements": {
    "attributes": {
      "intelligence": 15,
      "charisma": 12
    },
    "physical": {
      "height": {
        "min": 150,
        "max": 200
      },
      "weight": {
        "max": 100
      }
    },
    "raceType": {
      "acceptedRaces": ["human", "elf"],
      "rejectedRaces": ["orc"],
      "acceptedTypes": ["good", "neutral"],
      "rejectedTypes": ["evil"]
    },
    "quests": {
      "completedQuests": ["quest-1"],
      "activeQuests": ["quest-2"],
      "forbiddenCompletedQuests": ["evil-quest"]
    },
    "inventory": {
      "items": ["castle-key", "magic-sword"],
      "loot": ["dragon-scale"],
      "equippedItems": {
        "weapon": "magic-sword",
        "body": "armor"
      }
    },
    "abilities": {
      "id": ["flameBurst", "heal"],
      "elementalType": ["fire"],
      "range": ["range"],
      "damageType": ["fire", "magic"]
    }
  },
  "next": "target-node"
}
```

### Requirement Types

#### Attribute Requirements
Require minimum attribute values:
```json
"attributes": {
  "strength": 16,
  "intelligence": 18,
  "charisma": 15
}
```

#### Physical Requirements
Based on character's physical characteristics:
```json
"physical": {
  "height": {
    "min": 120,  // Minimum height in cm
    "max": 180   // Maximum height in cm
  },
  "weight": {
    "min": 50,   // Minimum weight in kg
    "max": 120   // Maximum weight in kg
  }
}
```

#### Race/Type Requirements
Control access based on race or character type:
```json
"raceType": {
  "acceptedRaces": ["human", "elf", "dwarf"],     // Only these races
  "rejectedRaces": ["orc", "goblin"],             // Exclude these races
  "acceptedTypes": ["good", "neutral"],           // Only these types
  "rejectedTypes": ["evil"]                       // Exclude these types
}
```

#### Quest Requirements
Require quest progress:
```json
"quests": {
  "completedQuests": ["save-princess"],           // Must have completed
  "activeQuests": ["find-artifact"],              // Must be currently active
  "forbiddenCompletedQuests": ["destroy-town"]   // Must NOT have completed
}
```

#### Inventory Requirements
Require specific items, loot, or equipment:
```json
"inventory": {
  "items": ["castle-key", "rope"],               // Must have these items
  "loot": ["wolf-pelt"],                         // Must have these loot items
  "equippedItems": {                             // Must have equipped
    "weapon": "flame-sword",
    "body": "fire-resistant-armor"
  }
}
```

#### Ability Requirements
Require specific abilities or ability types:
```json
"abilities": {
  "id": ["flameBurst", "heal"],                  // Must know these specific abilities
  "elementalType": ["fire", "water"],            // Must have abilities of these elemental types
  "range": ["range", "close"],                   // Must have abilities with these ranges
  "damageType": ["fire", "physical"]             // Must have abilities with these damage types
}
```

## Quest System

The new quest system tracks player progress through story objectives.

### Quest Management Functions

In story nodes and choices, you can:

```json
{
  "text": "Accept the quest",
  "questStart": "dragon-slaying",
  "next": "town-square"
}
```

```json
{
  "text": "Report completion",
  "questComplete": "dragon-slaying",
  "exp": 100,
  "items": {
    "gold": 500
  },
  "next": "quest-reward"
}
```

### Quest Properties Added to Character

The system automatically adds these properties to the player character:

- `activeQuests`: Array of currently active quest IDs
- `completedQuests`: Array of completed quest IDs
- `professions`: Array of character professions (for future expansion)

## Physical Characteristic Requirements

Some NPCs or situations may react differently based on the character's physical appearance.

### Examples

**Horse Trader (Weight-based)**:
```json
{
  "text": "Buy a horse",
  "requirements": {
    "physical": {
      "weight": {
        "max": 120
      }
    }
  },
  "next": "horse-purchased"
}
```

**Tight Passage (Height-based)**:
```json
{
  "text": "Crawl through the passage",
  "requirements": {
    "physical": {
      "height": {
        "max": 160
      }
    }
  },
  "next": "secret-room"
}
```

## Rejection Messages

When a choice would be rejected due to physical or social requirements, the system shows specific messages:

- **Too tall/short**: "You are too tall (185cm, maximum 180cm allowed)"
- **Too heavy/light**: "You are too heavy (150kg, maximum 120kg allowed)"
- **Race rejection**: "Your race (orc) is not welcome here"
- **Type rejection**: "Your type (evil) is not allowed here"

## Examples

### Complete Example: Advanced Town Square

```json
{
  "town-square": {
    "title": "Town Square",
    "text": "A bustling town center with many opportunities.",
    "randomEncounters": [
      {
        "chance": 20,
        "title": "Street Performer",
        "text": "A bard performs an amazing song!",
        "mana": 10,
        "choices": [
          {
            "text": "Applaud and tip",
            "items": { "gold": -5 },
            "exp": 5,
            "next": "continue"
          }
        ]
      }
    ],
    "choices": [
      {
        "text": "Enter the exclusive club (Charisma 18+)",
        "requirements": {
          "attributes": {
            "charisma": 18
          }
        },
        "next": "exclusive-club"
      },
      {
        "text": "Ride the horse (Must own horse)",
        "requirements": {
          "inventory": {
            "items": ["horse"]
          }
        },
        "next": "horseback-travel"
      },
      {
        "text": "Talk to the mayor (Human/Elf only)",
        "requirements": {
          "raceType": {
            "acceptedRaces": ["human", "elf"]
          }
        },
        "next": "mayor-meeting"
      },
      {
        "text": "Use fire magic to clear vines",
        "requirements": {
          "abilities": {
            "elementalType": "fire"
          }
        },
        "next": "secret-path"
      }
    ]
  }
}
```

### Race-Based Path Example

```json
{
  "guard-encounter": {
    "title": "City Guards",
    "text": "Guards stop you at the checkpoint.",
    "choices": [
      {
        "text": "Show identification (Accepted Races)",
        "requirements": {
          "raceType": {
            "acceptedRaces": ["human", "elf", "dwarf"]
          }
        },
        "next": "allowed-entry"
      },
      {
        "text": "Try to bribe (Rejected Races)",
        "requirements": {
          "raceType": {
            "rejectedRaces": ["human", "elf", "dwarf"]
          }
        },
        "dice": {
          "attribute": "charisma",
          "outcomes": [
            {
              "min": 1,
              "max": 15,
              "text": "The guards are offended by your attempt!",
              "next": "bribe-failed"
            },
            {
              "min": 16,
              "max": 20,
              "text": "The guards reluctantly accept your gold.",
              "items": { "gold": -50 },
              "next": "allowed-entry"
            }
          ]
        }
      }
    ]
  }
}
```

This system provides rich, dynamic storytelling possibilities where character choices and story paths truly depend on the player's character build, decisions, and physical characteristics.
