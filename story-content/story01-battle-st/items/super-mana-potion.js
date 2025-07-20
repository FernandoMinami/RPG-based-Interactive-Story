export const item = {
  id: "super-mana-potion",
  name: "Super Mana Potion",
  description: "Restores 30 MP.",
  type: "consumable",
  restore: 30,

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