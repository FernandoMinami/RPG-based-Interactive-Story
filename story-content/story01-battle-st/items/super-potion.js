export const item = {
  id: "super-potion",
  name: "Super Potion",
  description: "Heals 50 HP.",
  type: "consumable",
  restore: 50,

  use(player) {
    const restored = this.restore;
    if (player.life < player.maxLife) {
      player.life = Math.min(player.maxLife, player.life + restored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max life)
  }
};