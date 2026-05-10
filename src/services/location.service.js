const { LOCATION_INFO } = require('../config/location');

function buildSpaceBlock(space) {
  const schedule = space.schedule.join('\n');
  const entrance = space.entrance.join('\n');

  return [
    space.title,
    LOCATION_INFO.labels.schedule,
    schedule,
    '',
    LOCATION_INFO.labels.entrance,
    entrance,
  ].join('\n');
}

function buildLocationMessage() {
  const spaces = LOCATION_INFO.spaces.map(buildSpaceBlock).join('\n\n');

  return [
    `${LOCATION_INFO.title}\n${LOCATION_INFO.address}`,
    spaces,
    `${LOCATION_INFO.holidayNotice}\n${LOCATION_INFO.phone}`,
    LOCATION_INFO.parking,
  ].join('\n\n');
}

module.exports = {
  buildLocationMessage,
};
