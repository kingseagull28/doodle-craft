/* Workshop of Wonders - procedural sound effects and music (Web Audio, no files).
   Nothing is created until the player turns sound or music on (a user gesture). */
(function (W) {
  'use strict';
  const A = W.Audio = {};
  let ctx = null, master = null, sfxGain = null, musicGain = null, musicTimer = null, step = 0;
  let sfxOn = false, musicOn = false;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.12; musicGain.connect(master);
      return true;
    } catch (e) { ctx = null; return false; }
  }
  function tone(freq, start, dur, type, vol, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(start); o.stop(start + dur + 0.02);
  }
  const SFX = {
    pick: function (t) { tone(660, t, 0.06, 'square', 0.08); },
    place: function (t) { tone(420, t, 0.07, 'square', 0.1); tone(560, t + 0.03, 0.05, 'triangle', 0.08); },
    remove: function (t) { tone(380, t, 0.06, 'triangle', 0.1); },
    craft: function (t) { tone(523, t, 0.1, 'square', 0.12); tone(784, t + 0.08, 0.16, 'square', 0.12); },
    discover: function (t) { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.08, 0.22, 'square', 0.1); }); },
    fail: function (t) { tone(220, t, 0.14, 'triangle', 0.12); tone(196, t + 0.1, 0.16, 'triangle', 0.1); },
    unlock: function (t) { [392, 523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.1, 0.25, i % 2 ? 'triangle' : 'square', 0.1); }); },
    supply: function (t) { tone(880, t, 0.05, 'triangle', 0.08); tone(1175, t + 0.04, 0.06, 'triangle', 0.06); },
    smelt: function (t) { for (let i = 0; i < 4; i++) tone(150 + Math.random() * 80, t + i * 0.04, 0.08, 'sawtooth', 0.03); tone(660, t + 0.18, 0.12, 'triangle', 0.1); },
    quest: function (t) { [659, 784, 988].forEach(function (f, i) { tone(f, t + i * 0.09, 0.18, 'triangle', 0.14); }); }
  };
  A.play = function (name) {
    if (!sfxOn || !SFX[name] || !ensure()) return;
    try { SFX[name](ctx.currentTime + 0.01); } catch (e) { /* audio must never break the game */ }
  };
  // gentle pentatonic music box
  const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
  const BASS = [130.81, 98.0, 110.0, 87.31];
  function musicTick() {
    if (!musicOn || !ctx) return;
    const t = ctx.currentTime + 0.05;
    const bar = Math.floor(step / 8) % 4;
    if (step % 8 === 0) tone(BASS[bar], t, 1.6, 'triangle', 0.18, musicGain);
    if (step % 2 === 0 || Math.random() < 0.3) {
      const idx = (step * 3 + bar * 2 + (Math.random() < 0.4 ? 1 : 0)) % SCALE.length;
      tone(SCALE[idx], t, 0.5, 'sine', 0.16, musicGain);
    }
    step++;
  }
  A.setSfx = function (on) { sfxOn = !!on; if (on) ensure(); };
  A.setMusic = function (on) {
    musicOn = !!on;
    if (musicOn) {
      if (!ensure()) { musicOn = false; return false; }
      if (!musicTimer) musicTimer = setInterval(musicTick, 330);
    } else if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    return musicOn;
  };
  A.available = function () { return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext); };
})(typeof window !== 'undefined' ? (window.WOW = window.WOW || {}) : (globalThis.WOW = globalThis.WOW || {}));
