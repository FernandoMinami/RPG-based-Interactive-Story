export const item = {
  id: "mp-potion",
  name: "MP Potion",
  description: "Restores 15 MP.",
  type: "consumable",
  restore: 15,

  use(player) {
    const mpRestored = this.restore;
    if (player.secondary.mp < player.maxMp) {
      player.secondary.mp = Math.min(player.maxMp, player.secondary.mp + mpRestored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max MP)
  }
};