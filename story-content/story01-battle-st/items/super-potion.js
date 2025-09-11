export const item = {
  id: "super-potion",
  name: "Super Potion",
  description: "Heals 50 HP.",
  type: "consumable",
  restore: 50,

  use(player) {
    const restored = this.restore;
    if (player.secondary.life < player.maxLife) {
      player.secondary.life = Math.min(player.maxLife, player.secondary.life + restored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max life)
  }
};