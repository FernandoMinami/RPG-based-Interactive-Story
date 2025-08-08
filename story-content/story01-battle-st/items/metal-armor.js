export default {
  id: "metal-armor",
  name: "Metal Armor",
  displayName: "Metal Armor",
  type: "armor",
  category: "body",
  price: 75,
  description: "Equip to gain +3 defense, 2 strength, -3 dexterity.",
  onUse: null,
  effectType: "permanent",
  stats: {
    physicDefense: 3,
    magicDefense: 1,
    strength: 2,
    dexterity: -3
  },
  weight: 8,
  stackable: false,
  consumable: false
};