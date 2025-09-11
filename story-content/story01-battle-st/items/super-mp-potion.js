export const item = {
  id: "super-mp-potion",
  name: "Super MP Potion",
  description: "Restores 30 MP.",
  type: "consumable",
  restore: 30,

  use(player) {
    const mpRestored = this.restore;
    if (player.secondary.mp < player.maxMp) {
      player.secondary.mp = Math.min(player.maxMp, player.secondary.mp + mpRestored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max MP)
  }
};