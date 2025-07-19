import { equipableItems } from "../../../src/items.js";

export const item = {
  id: "metal-helmet",
  name: "Metal Helmet",
  description: "A sturdy helmet that boosts your defense.",
  type: "equipable",
  slot: "head",
  equipped: false,
  modifiers: {
    physicDefense: 2
  },
  use(player) {
    equipableItems(player, this);
  }
};