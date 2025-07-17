// Flying
// Increases user (enemy or player) speed
// user (enemy or player) is immune to close attacks/abilities (unless attacker is also flying)
// user (enemy or player) can use ranged attacks/abilities
// when user (enemy or player) uses close attacks flying is removed
// when opponent (enemy or player) hits with a ranged attack, user (enemy or player) falls and receives fall damage


export default {
    name: 'fly',
    permanent: true,
    apply(entity) {
        entity.status['fly'] = { permanent: true };
    },
    update(entity, addLog) {
        // no auto-removal - removed manually when using close attacks or hit by ranged attacks
    },
    summary(entity) {
        return 'flying (immune to close attacks)';
    }
}
