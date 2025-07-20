export const item = {
  id: "mana-potion",
  name: "Mana Potion",
  description: "Restores 15 MP.",
  type: "consumable",
  restore: 15,

  use(player) {
    const manaRestored = this.restore;
    if (player.mp < player.maxMp) {
      player.mp = Math.min(player.maxMp, player.mp + manaRestored);
      player.mana = player.mp; // Keep in sync
      return true; // Consumed
    }
    return false; // Not consumed (already at max MP)
  }
};