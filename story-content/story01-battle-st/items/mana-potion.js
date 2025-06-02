export const item = {
  id: "mana-potion",
  name: "Mana Potion",
  description: "Restores 15 MP.",
  type: "consumable",
  restore: 15,

  use(player) {
    const manaRestored = this.restore;
    if (player.mana < player.maxMana) {
      player.mana = Math.min(player.maxMana, player.mana + manaRestored);
      return true; // Consumed
    }
    return false; // Not consumed (already at max MP)
  }
};