   // Poison
      // damages per turn
     // update status ()

     export default {
    name: 'poison',
    permanent: false,
    apply(entity, turns = 1) {
        entity.status['poison'] = { turns };
    },
    update(entity, addLog) {
        if (entity.status['poison']) {
            entity.life -= 1;
            addLog(`${entity.name} takes 1 poison damage!`);
            entity.status['poison'].turns--;
            if (entity.status['poison'].turns <= 0) {
                delete entity.status['poison'];
                addLog(`${entity.name} is no longer poisoned!`);
            }
        }
    },
    summary(entity) {
        return `poison (${entity.status['poison'].turns})`;
    }
}
