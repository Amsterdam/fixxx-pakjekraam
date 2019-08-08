/*
 * The built-in Sequelize `upsert()` doesn't work well with
 * combined unique key constraints that allow NULL values.
 */
const upsert = (model, where, data) =>
    model
    .findOrCreate({
        where,
        defaults: data
    })
    .spread((inst, created) => (created ? inst : inst.update(data)));

module.exports = {
    upsert
};
