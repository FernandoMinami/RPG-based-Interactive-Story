// Burn
// damages per turn
// update status ()



export default {
    name: 'burn',
    permanent: false,
    apply(entity, turns = 1) {
        entity.status['burn'] = { turns };
    },
    update(entity, addLog) {
        if (entity.status['burn']) {
            entity.life -= 2;
            addLog(`${entity.name} takes 2 burn damage!`);
            entity.status['burn'].turns--;
            if (entity.status['burn'].turns <= 0) {
                delete entity.status['burn'];
                addLog(`${entity.name} is no longer burned!`);
            }
        }
    },
    summary(entity) {
        if (entity.status['burn']) {
            return `burn (${entity.status['burn'].turns})`;
        }
        return null;
    }
}
