export const item = {
  id: "super-mana-potion",
  name: "Super Mana Potion",
  description: "Restores 30 MP.",
  type: "consumable",
  restore: 30,

  use(player) {
    const manaRestored = this.restore;
    if (player.mana < player.maxMana) {
      player.mana = Math.min(player.maxMana, player.mana + manaRestored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max MP)
  }
};