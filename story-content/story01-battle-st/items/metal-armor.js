import { equipableItems } from "../../../src/items.js";

export const item = {
  id: "metal-armor",
  name: "Metal Armor",
  description: "Equip to gain +3 defense, 2 strength, -3 dexterity.",
  type: "equipable",
  slot: "body",
  equipped: false,
  modifiers: {
    physicDefense: 3,
    magicDefense: 1,
    strength: 2,
    dexterity: -3
  },

  use(player) {
    return equipableItems(player, this);
  }
};