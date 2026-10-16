// Loads the game data + engine into Node for tests and validation.
const path = require('path');
['icons.js', 'data_core.js', 'data_more.js', 'data_world.js', 'data_wheels.js', 'data_golf.js', 'engine.js'].forEach(f => require(path.join(__dirname, '..', 'src', f)));
module.exports = globalThis.WOW;
