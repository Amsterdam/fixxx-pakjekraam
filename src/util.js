const dayOfWeekName = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

const formatDayOfWeek = date => dayOfWeekName[new Date(date).getDay()];

module.exports = {
    formatDayOfWeek,
};
