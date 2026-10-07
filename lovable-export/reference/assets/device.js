/* Hey Alex — Device UI behaviours. Delegated, so stamped/cloned markup just works. */
(function () {
  'use strict';

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---- Click sound (off by default) ------------------------------------- */
  var sound = { enabled: store.get('device.click') === 'on', ctx: null, buf: null };

  function clickBuffer(ctx) {
    var len = Math.floor(ctx.sampleRate * 0.012);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var t = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 6);
    }
    return buf;
  }

  function playClick(pitch) {
    if (!sound.enabled) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sound.ctx) { sound.ctx = new AC(); sound.buf = clickBuffer(sound.ctx); }
    var ctx = sound.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    var src = ctx.createBufferSource();
    src.buffer = sound.buf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = pitch || 3200;
    bp.Q.value = 1.4;
    var g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
  }

  window.Device = {
    setSound: function (on) { sound.enabled = !!on; store.set('device.click', on ? 'on' : 'off'); },
    soundEnabled: function () { return sound.enabled; },
    click: playClick
  };

  var PRESSABLE = '.key, .toggle, .rocker';

  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest(PRESSABLE);
    if (!el || el.disabled) return;
    playClick(el.classList.contains('rocker') ? 1800 : el.classList.contains('toggle') ? 2600 : 3200);
  });

  /* ---- Keyboard press state: Space/Enter shows the key travelling ------- */
  document.addEventListener('keydown', function (e) {
    if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
    var el = e.target.closest && e.target.closest('.key');
    if (!el || el.disabled) return;
    el.classList.add('is-pressed');
    playClick(3200);
  });
  function release(e) {
    var el = e.target.closest && e.target.closest('.key');
    if (el) el.classList.remove('is-pressed');
  }
  document.addEventListener('keyup', release);
  document.addEventListener('focusout', release);

  /* ---- Switches (toggle + rocker) and latching keys --------------------- */
  document.addEventListener('click', function (e) {
    var sw = e.target.closest('[role="switch"]');
    if (sw && !sw.disabled) {
      var on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on));
      syncLed(sw, on);
      sw.dispatchEvent(new CustomEvent('device:change', { bubbles: true, detail: { on: on } }));
      return;
    }

    var key = e.target.closest('.key[aria-pressed]');
    if (key && !key.disabled) {
      var group = key.closest('[data-latch="one"]');
      if (group) {
        group.querySelectorAll('.key[aria-pressed]').forEach(function (k) {
          k.setAttribute('aria-pressed', String(k === key));
          syncLed(k, k === key);
        });
      } else {
        var next = key.getAttribute('aria-pressed') !== 'true';
        key.setAttribute('aria-pressed', String(next));
        syncLed(key, next);
      }
      key.dispatchEvent(new CustomEvent('device:change', { bubbles: true, detail: { on: key.getAttribute('aria-pressed') === 'true' } }));
    }
  });

  /* An LED tied to a control: inside it, or referenced by data-led="<selector>" within the same scope */
  function syncLed(control, on) {
    var led = control.querySelector('.led');
    var sel = control.getAttribute('data-led');
    if (sel) {
      var scope = control.closest('[data-scope]') || document;
      led = scope.querySelector(sel);
    }
    if (led) led.classList.toggle('is-on', on);
  }
})();
