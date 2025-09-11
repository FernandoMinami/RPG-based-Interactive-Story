export const item = {
  id: "potion",
  name: "Potion",
  description: "Heals 20 HP.",
  type: "consumable",
  restore: 20, // Amount of health restored
  sellValue: 3, // Gold value when sold to merchant

  use(player) {
    const restored = this.restore;
    if (player.secondary.life < player.maxLife) {
      player.secondary.life = Math.min(player.maxLife, player.secondary.life + restored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max life)
  }
};