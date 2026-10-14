// Writes the full item, recipe, quest and biome datasets as JSON to data/.
const fs = require('fs'), path = require('path');
const W = require('./load.js'), D = W.Data;
const out = path.join(__dirname, '..', 'data'); fs.mkdirSync(out, { recursive: true });
const items = D.itemOrder.map(id => { const it = Object.assign({}, D.items[id]); return it; });
const recipes = D.recipes.map(r => ({ id: r.id, name: r.name, method: r.method, type: r.type || null, gridSize: r.gridSize || null,
  pattern: r.pattern || null, list: r.list || null, input: r.input, base: r.base, ingredient: r.ingredient, template: r.template, addition: r.addition,
  ingredients: r.ingredients, output: r.output, remainders: r.remainders, mirror: r.mirror, unlockRequirements: r.unlockRequirements,
  category: r.category, tier: r.tier, hints: r.hints, discoveryMessage: r.discoveryMessage, sourceType: r.sourceType, referenceVersion: r.referenceVersion, secret: r.secret, tags: r.tags }));
fs.writeFileSync(path.join(out, 'items.json'), JSON.stringify(items, null, 1));
fs.writeFileSync(path.join(out, 'recipes.json'), JSON.stringify(recipes, null, 1));
fs.writeFileSync(path.join(out, 'quests.json'), JSON.stringify(D.quests, null, 1));
fs.writeFileSync(path.join(out, 'biomes.json'), JSON.stringify(D.biomes, null, 1));
const v = W.Engine.validateData();
console.log('items', items.length, 'recipes', recipes.length, 'quests', D.quests.length, 'validation errors', v.errors.length);
