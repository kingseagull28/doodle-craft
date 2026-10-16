// Builds docs/index.html: one self-contained file (no network needed). GitHub Pages serves the docs/ folder.
// Also writes docs/dev.html which loads the separate source files for debugging (works locally only).
const fs = require('fs'), path = require('path');
const src = p => path.join(__dirname, '..', 'src', p);
const ORDER = ['icons.js', 'data_core.js', 'data_more.js', 'data_world.js', 'data_wheels.js', 'data_golf.js', 'engine.js', 'audio.js', 'ui.js'];
const tpl = fs.readFileSync(src('index.html'), 'utf8');
const css = fs.readFileSync(src('style.css'), 'utf8');
const js = ORDER.map(f => '/* ---- ' + f + ' ---- */\n' + fs.readFileSync(src(f), 'utf8').replace(/<\/script/gi, '<\\/script')).join('\n');
const out = tpl.replace('<!--STYLE-->', () => '<style>\n' + css + '\n</style>').replace('<!--SCRIPTS-->', () => '<script>\n' + js + '\n</script>');
const dist = path.join(__dirname, '..', 'docs');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), out);
const dev = tpl.replace('<!--STYLE-->', '<link rel="stylesheet" href="../src/style.css">').replace('<!--SCRIPTS-->', ORDER.map(f => '<script src="../src/' + f + '"></script>').join('\n'));
fs.writeFileSync(path.join(dist, 'dev.html'), dev);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('Built docs/index.html (' + Math.round(out.length / 1024) + ' KB)');
