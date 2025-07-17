import { equipableItems } from "../../../src/items.js";

export const item = {
  id: "leather-helmet",
  name: "Leather Helmet",
  description: "A sturdy helmet that boosts your defense.",
  type: "equipable",
  slot: "head",
  equipped: false,
  modifiers: {
    physicalDefense: 20,
    dexterity: 5
  },

  use(player) {
    return equipableItems(player, this);
  }
};