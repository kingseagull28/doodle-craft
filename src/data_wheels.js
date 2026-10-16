/* Workshop of Wonders - Spicy Wheels expansion: toy cars and toy race track pieces.
   All 15 items are original content and live in the 'spicy_wheels' book collection. */
(function (W) {
  'use strict';
  const D = W.Data, b = D.build, item = b.item, shaped = b.shaped;
  const O = { orig: true };
  const CAT = 'spicy_wheels';
  // An item's tier is the highest tier among its ingredients, so it unlocks with them.
  const tierOf = function (ids) { return Math.max.apply(null, ids.map(function (id) { return D.items[id].tier; })); };
  const car = function (id, name, tpl, colors, desc, ingredients) {
    item(id, name, CAT, tierOf(ingredients), Object.assign({ t: tpl }, colors), desc, [CAT, 'toy', 'original'], O);
  };
  const SILVER = '#d0d8e0', ORANGE = { a: '#f39a2e', c: '#ffc070', b: '#b8641a' };

  // Each collection groups one book category. The book shows its icon, blurb, progress and badge.
  D.collections = D.collections || {};
  D.collections[CAT] = {
    name: 'Spicy Wheels',
    description: 'Tiny cars, giant adventures! Craft wild rides, build crazy tracks, and discover the rarest wheels around!',
    icon: { t: 'spicy_car', a: '#d8302a', x: '#f39a2e' },
    masterTitle: '🏆 SPICY WHEELS MASTER! 🏆',
    masterText: 'You\'ve collected every car, conquered every track, and become the ultimate Spicy Wheels champion!',
    badge: 'Spicy Wheels Master'
  };

  // ---------- toy car parts and vehicles ----------
  car('toy_wheel', 'Toy Wheel', 'toy_wheel', {}, 'A tiny rubber wheel for toy cars.', ['black_dye', 'iron_nugget']);
  shaped('toy_wheel', 4, ['.K.', 'KNK', '.K.'], { K: 'black_dye', N: 'iron_nugget' }, { orig: true, msg: 'Toy Wheels! Every car needs some.' });

  car('basic_toy_car', 'Basic Toy Car', 'toy_car', { a: '#3a7ad8', x: SILVER }, 'A little blue toy car. Vroom!', ['blue_dye', 'iron_ingot', 'toy_wheel']);
  shaped('basic_toy_car', 1, ['.B.', 'III', 'W.W'], { B: 'blue_dye', I: 'iron_ingot', W: 'toy_wheel' }, { orig: true, msg: 'Your first toy car! Vroom vroom!' });

  car('sports_car', 'Sports Car', 'sports_car', { a: '#d8302a', x: SILVER }, 'A fast red toy car with a spoiler.', ['red_dye', 'iron_ingot', 'basic_toy_car', 'redstone']);
  shaped('sports_car', 1, ['.R.', 'ICI', '.D.'], { R: 'red_dye', I: 'iron_ingot', C: 'basic_toy_car', D: 'redstone' }, O);

  car('monster_truck', 'Monster Truck', 'monster_truck', { a: '#3fae4a', x: SILVER }, 'A toy truck with giant bouncy tires.', ['toy_wheel', 'basic_toy_car', 'iron_ingot']);
  shaped('monster_truck', 1, ['W.W', 'WCW', 'III'], { W: 'toy_wheel', C: 'basic_toy_car', I: 'iron_ingot' }, O);

  car('school_bus', 'School Bus', 'school_bus', { a: '#f7c843', x: '#26201c' }, 'A little yellow bus. All aboard!', ['yellow_dye', 'iron_ingot', 'basic_toy_car', 'toy_wheel']);
  shaped('school_bus', 1, ['YYY', 'ICI', 'W.W'], { Y: 'yellow_dye', I: 'iron_ingot', C: 'basic_toy_car', W: 'toy_wheel' }, O);

  // ---------- toy race track ----------
  car('orange_track', 'Orange Track', 'track', ORANGE, 'A piece of bright orange toy track.', ['orange_dye', 'smooth_stone']);
  shaped('orange_track', 4, ['OSO', 'OSO'], { O: 'orange_dye', S: 'smooth_stone' }, { orig: true, msg: 'Orange Track! Build a race course.' });

  car('curved_track', 'Curved Track', 'curved_track', ORANGE, 'Toy track that turns a corner.', ['orange_track']);
  shaped('curved_track', 2, ['TT', '.T'], { T: 'orange_track' }, O);

  car('loop_the_loop', 'Loop-the-Loop', 'track_loop', ORANGE, 'A big loop. Cars zoom upside down!', ['orange_track', 'curved_track']);
  shaped('loop_the_loop', 1, ['TTT', 'C.C', 'TTT'], { T: 'orange_track', C: 'curved_track' }, O);

  car('car_launcher', 'Car Launcher', 'launcher', ORANGE, 'Press the button. Zoom! Off goes the car.', ['piston', 'orange_track', 'redstone', 'iron_ingot']);
  shaped('car_launcher', 1, ['.P.', 'TDT', '.I.'], { P: 'piston', T: 'orange_track', D: 'redstone', I: 'iron_ingot' }, O);

  car('toy_car_garage', 'Toy Car Garage', 'garage', { a: '#3a7ad8', x: '#f39a2e' }, 'A cozy home for your toy cars.', ['oak_planks', 'chest', 'orange_track']);
  shaped('toy_car_garage', 1, ['PPP', 'PCP', 'T.T'], { P: 'oak_planks', C: 'chest', T: 'orange_track' }, O);

  // ---------- rare and silly collectibles ----------
  car('golden_toy_car', 'Golden Toy Car', 'shiny_car', { a: '#f7c843', c: '#fff0a0', b: '#c8901a', x: '#fff8d0' }, 'A shiny gold toy car. So rare!', ['gold_ingot', 'basic_toy_car']);
  shaped('golden_toy_car', 1, ['GGG', 'GCG', '.G.'], { G: 'gold_ingot', C: 'basic_toy_car' }, { orig: true, msg: 'A Golden Toy Car! It shines like the sun.' });

  car('rocket_car', 'Rocket Car', 'rocket_car', { a: '#d8302a', x: '#f39a2e' }, 'A toy car with three rockets. Whoosh!', ['firework_rocket', 'sports_car', 'redstone']);
  shaped('rocket_car', 1, ['.F.', 'FSF', '.D.'], { F: 'firework_rocket', S: 'sports_car', D: 'redstone' }, O);

  car('rainbow_car', 'Rainbow Car', 'rainbow_car', { x: SILVER }, 'A toy car painted every color.', ['red_dye', 'basic_toy_car']);
  shaped('rainbow_car', 1, ['ROY', 'GCB', 'PWK'], { R: 'red_dye', O: 'orange_dye', Y: 'yellow_dye', G: 'green_dye', C: 'basic_toy_car', B: 'blue_dye', P: 'purple_dye', W: 'white_dye', K: 'black_dye' }, O);

  car('hot_dog_car', 'Hot Dog Car', 'hot_dog_car', { a: '#e0a860', c: '#f4cc90', b: '#a86a30', x: '#c8503a' }, 'A silly car that looks like a hot dog.', ['bread', 'cooked_beef', 'toy_wheel', 'basic_toy_car']);
  shaped('hot_dog_car', 1, ['.B.', 'BMB', 'WCW'], { B: 'bread', M: 'cooked_beef', W: 'toy_wheel', C: 'basic_toy_car' }, { orig: true, msg: 'A Hot Dog Car! It looks yummy. Do not eat it!' });

  car('diamond_toy_car', 'Diamond Toy Car', 'shiny_car', { a: '#5fe0e8', c: '#c8fbff', b: '#2a9aa8', x: '#e8ffff' }, 'A sparkly diamond car. The rarest of all!', ['diamond', 'golden_toy_car']);
  shaped('diamond_toy_car', 1, ['DDD', 'DGD', '.D.'], { D: 'diamond', G: 'golden_toy_car' }, { orig: true, msg: 'The Diamond Toy Car! The rarest car of all!' });
})(typeof window !== 'undefined' ? (window.WOW = window.WOW || {}) : (globalThis.WOW = globalThis.WOW || {}));
