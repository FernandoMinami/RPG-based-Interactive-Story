const baseSecondary = {
  defense: 0,
  natDefense: 0, // initial natural defense
  speed: 0,
  physicalDamage: 0,
  magicDamage: 0
};

export let enemy = {
  name: "Enemy01",
  id: "enemy01",
  weight: 60, // Weight in kg (used to do calculations like pin or fall damage)
  life: 70,
  maxLife: 70,
  secondary: { ...baseSecondary },
  status: {},
  exp: 300, // EXP reward
  gold: 8, // Gold reward
  drops: [
    { item: "potion", chance: 0.5 }, // 50% chance to drop a potion
    { item: "mana-potion", chance: 0.1 } // 10% chance to drop a mana potion
  ],
  attacks: [
    {
      name: "Stomp",
      minDamage: 3,
      maxDamage: 8,
      type: "physical",
      range: "close", // Close combat attack
      requiresStatus: "stun",
      effect: { target: "enemy", type: "pin", chance: 1 },
      accuracy: 90, // 90% base chance to hit
      favorite: false,
      description: "Enemy01 rose his paw up ready to stomp down!",
      onHit: "Enemy01's paw hits you!",
      onMiss: "You dodged!"
    },
    {
      name: "Tail Whip",
      minDamage: 2,
      maxDamage: 5,
      type: "physical",
      range: "close", // Close combat attack
      accuracy: 90, // 90% base chance to hit
      effect: null,
      favorite: false,
      description: "",
      onHit: "",
      onMiss: ""
    },
    {
      name: "Fly",
      minDamage: 0,
      maxDamage: 0,
      accuracy: 100,
      type: "status", // This is a status move
      range: "self", // Self-targeting status effect
      removesPin: true, // <--- This marks the move as one that removes pin from the opponent
      effect: { target: "self", type: "fly", chance: 1 }, //<--- find a way to apply status to self when desired
      favorite: true,
      description: "Enemy01 leaps up, soaring to the sky.",
      onHit: "Enemy01 flies high into the sky!",
      onMiss: ""
    },
    {
      name: "Wind Slash",
      minDamage: 4,
      maxDamage: 7,
      type: "magic",
      range: "ranged", // Ranged attack - can hit flying targets and knock them down
      accuracy: 85,
      favorite: false,
      description: "Enemy01 sends a cutting wind blade at you!",
      onHit: "The wind slash cuts through the air!",
      onMiss: "The wind slash misses!"
    }
  ]
};