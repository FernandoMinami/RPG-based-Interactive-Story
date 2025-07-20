export const item = {
  id: "potion",
  name: "Potion",
  description: "Heals 20 HP.",
  type: "consumable",
  restore: 20, // Amount of health restored
  sellValue: 3, // Gold value when sold to merchant

  use(player) {
    const restored = this.restore;
    if (player.life < player.maxLife) {
      player.life = Math.min(player.maxLife, player.life + restored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max life)
  }
};