// Chapter 3: the whistle, a pressure cycle (1 scene unit ≈ 4 cm). The model is Cooker in cooker.js:
// the same physics as BoilClear's cooker, plus the aluminium body's heat capacity.
// Heat in: an LPG burner of 0.5 to 2.5 kW (the range GasLawClear uses), 60% of it into the cooker.
// Steam out: when the weight lifts, choked flow through the 3 mm bore, about 2.1 g/s, carrying
// 2,200 J/g. The weight reseats 15 kPa lower. Between those two pressures the water's boiling point
// moves by about 2.5 °C, so each cycle stores and then spends C × 2.5 °C ≈ 18 kJ.
// Whistle period = closed time + open time = C ΔT ÷ (flame heat − losses) + C ΔT ÷ (steam heat out −
// flame heat + losses). For 1.5 kg of water and dal on a 2 kW flame: about 19 s closed + 5 s open.
// Halve the flame and the closed time more than doubles; double the water and it doubles too. That is
// why "three whistles" means a different time on a different stove or with a different amount.
// The real interval also depends on how much the weight sticks and wobbles, which we cannot know; the
// times are computed estimates, the pattern is the point.
import { THREE } from '../kit.js';
import {
  makeCooker, makeBurner, CK, Cooker, whistleCycle, firstWhistle, tsat, pAlt, gaugeOf, COL, board, panelBg, title, axes, line, dashH,
  fitNarrow, placeBoards, fmtT, clamp, hissSound, WEIGHT_G, BORE_MM, latent, link,
} from '../cooker.js';

const VIEW = { pos: [4.2, 7.0, 16.6], target: [4.4, 4.6, 0] };

export default {
  id: 'whistle',
  short: 'The whistle',
  title: 'Why the cooker whistles, again and again',
  subtitle: 'Heat in, steam out, the weight lifts and drops back: a pressure cycle you can count.',
  view: VIEW,
  learn: `<p>Light the flame and the water warms. The first steam pushes the air out past the weight. Once the cooker is full of steam, every extra degree means more pressure, because the pressure inside is just the <b>vapour pressure</b> of the hot water.</p>
    <p>At about 120 °C the pressure reaches the weight's value and the weight <b>lifts</b>. Steam rushes out of the 3 mm hole at the speed of sound, about 2 grams a second, and makes the hiss and the <b>whistle</b>. Every gram that leaves takes 2,200 joules of heat with it, faster than the flame puts heat in. So the water cools a little, the pressure falls, and the weight <b>drops back</b>. Then the flame starts filling it up again.</p>
    <p>That is why counting whistles works as a <b>kitchen timer</b>: each whistle is one turn of the cycle. But the time per turn depends on the flame and on how much is inside. A big flame refills the cooker faster, so it whistles more often. More water and dal take longer to warm. "Three whistles" on a high flame with a little dal is a lot less cooking time than three whistles on a low flame with a full cooker. Every whistle also throws away steam and heat, which is why many cooks turn the flame down after the first one.</p>
    <p>The weight's job is to keep the pressure near one value. It is not a safety device: if it ever stays shut, the safety valve takes over (chapter 5). How much heat the flame gives is in ${link('heatclear', 'HeatClear')}.</p>
    <p class="tip"><b>Try it:</b> start on a high flame and watch the pressure saw up and down. Then turn the flame down and see the whistles spread out. Change the amount of water and start again.</p>`,
  terms: [
    { t: 'Vapour pressure', d: 'The pressure of the steam above hot water. It rises steeply with temperature.' },
    { t: 'Whistle', d: 'The sound of steam rushing out under the lifted weight.' },
    { t: 'Cycle', d: 'Something that repeats: here, pressure up, weight lifts, pressure down, weight drops.' },
    { t: 'Latent heat', d: 'The heat each gram of water takes with it when it turns to steam: about 2,200 J at 120 °C.' },
  ],
  defaults: { flame: 2, litres: 1.5, fast: 10, lowAfter: false },
  controls: [
    { key: 'flame', type: 'range', label: 'Flame', min: 0, max: 2.5, step: 0.05, ends: ['off', '2.5 kW'], fmt: (v) => (v < 0.05 ? 'off' : v.toFixed(2) + ' kW') },
    { key: 'litres', type: 'range', label: 'Water and dal inside', min: 0.5, max: 3, step: 0.1, ends: ['0.5 kg', '3 kg'], fmt: (v) => v.toFixed(1) + ' kg', hint: 'Changing this starts the cooker again from cold.' },
    { key: 'lowAfter', type: 'toggle', label: 'Turn the flame to 0.7 kW after the first whistle' },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 1, label: 'Real time' }, { v: 10, label: '×10' }, { v: 30, label: '×30' }] },
    { key: 'go', type: 'buttons', label: 'Start again', items: [{ label: 'Fresh and cold', act: (s, inst) => inst.reset() }] },
  ],
  onChange(s, key) { if (key === 'litres') s._reset = true; },
  quiz: [
    { q: 'Why does the pressure fall after the weight lifts?', options: ['The flame goes out', 'Escaping steam carries heat away faster than the flame adds it, so the water cools a little', 'The gasket opens', 'The weight gets lighter'], answer: 1, why: 'Each gram of steam takes about 2,200 J. At about 2 g a second that is over 4 kW, more than the flame gives, so the temperature and pressure drop until the weight reseats.' },
    { q: 'You turn the flame down. What happens to the whistles?', options: ['They come more often', 'They come less often', 'They stop for good', 'Nothing changes'], answer: 1, why: 'The flame has less spare heat to push the pressure back up, so each cycle takes longer.' },
    { q: 'Why is "three whistles" not an exact cooking time?', options: ['Whistles are random', 'The time between whistles depends on the flame and on how much is in the cooker', 'Each whistle lasts exactly one minute', 'It is exact'], answer: 1, why: 'Bigger flames and smaller loads refill the cycle faster. The count is a habit that works for one cook on one stove.' },
  ],
  reel: [
    { ms: 5800, caption: 'When the pressure lifts the weight, steam rushes out and the cooker whistles.', set: { flame: 2, litres: 1.5, fast: 10, lowAfter: false }, act: (s, inst) => { inst.reset(); inst.preRun(s, 585); }, view: { pos: [1.8, 7.0, 7.4], target: [1.6, 5.6, 0] }, spin: 0.2 },
    { ms: 5600, caption: 'The escaping steam carries heat away, the pressure drops, the weight falls back, and it starts again.', set: { flame: 2, litres: 1.5, fast: 10, lowAfter: false }, act: (s, inst) => { inst.preRun(s, 120); }, view: { pos: [1.2, 8.4, 9.0], target: [1.0, 7.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const burner = makeBurner(root, { x: 0 });
    const ck = makeCooker(root, { type: 'outer', y0: burner.topY });
    const { H } = CK;
    const snd = hissSound();
    const sim = new Cooker({ kg: 1.5, flame: 2000 });
    const lP = stage.label('', [2.4, burner.topY + H + 1.7, 0], root, 'hot'), lT = stage.label('', [-1.2, burner.topY + 1.2, 1.8], root, 'hot');
    let S = null;
    const flameW = (s) => (s.lowAfter && sim.whistles > 0 ? Math.min(0.7, s.flame) : s.flame) * 1000;
    const cfg = (s) => { sim.o.kg = s.litres; sim.o.flame = flameW(s); };
    const reset = () => { if (S) sim.o.kg = S.litres; sim.reset(); };
    const preRun = (s, secs) => { S = s; for (let t = 0; t < secs; t += 0.25) { cfg(s); sim.step(0.25); sim.record(2); } };

    const bA = board(root, 6.2, 3.1, 720, 360, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Pressure inside', 'gauge, kPa');
      const t1 = Math.max(240, sim.t), t0 = Math.max(0, t1 - 900), set = gaugeOf(WEIGHT_G, BORE_MM);
      const step = t1 - t0 > 600 ? 300 : t1 - t0 > 240 ? 120 : 60, xt = []; for (let v = Math.ceil(t0 / step) * step; v <= t1; v += step) xt.push(v);
      const { X, Y } = axes(g, w, h, { x0: 70, y1: 58, y0: h - 44, xMin: t0, xMax: t1, yMin: 0, yMax: 120, xTicks: xt, yTicks: [0, 40, 80, 120], xFmt: (v) => (v / 60).toFixed(0) + ' min', yFmt: String });
      dashH(g, X(t0), X(t1), Y(set), 'weight lifts', 'rgba(255,181,71,.85)');
      g.fillStyle = COL.steam; sim.marks.filter((t) => t >= t0).forEach((t) => g.fillRect(X(t) - 1.5, h - 56, 3, 12));
      line(g, sim.rows.filter((r) => r[0] >= t0).map((r) => [r[0], r[1]]), X, Y, COL.hot, 4);
    }, [10.4, 6.0, -0.6]);
    bA.mesh.rotation.y = -0.3;
    const bB = board(root, 6.2, 2.38, 720, 276, (g, w, h) => {
      panelBg(g, w, h);
      const c = whistleCycle({ kg: sim.o.kg, flame: sim.o.flame });
      title(g, 'One whistle cycle', 'computed');
      const tot = c.period, x0 = 20, x1 = w - 20, wd = x1 - x0;
      if (!isFinite(tot)) { g.fillStyle = COL.text; g.font = '22px sans-serif'; g.fillText('Flame too low: the cooker never reaches the weight.', 20, 120); return; }
      const xa = x0 + (wd * c.closed) / tot;
      g.fillStyle = COL.heat; g.fillRect(x0, 64, xa - x0, 44); g.fillStyle = COL.steam; g.fillRect(xa, 64, x1 - xa, 44);
      g.fillStyle = '#0a0c12'; g.font = 'bold 19px sans-serif';
      if (xa - x0 > 210) g.fillText(`weight down: ${c.closed.toFixed(0)} s`, x0 + 10, 93);
      g.fillStyle = COL.text; g.font = '19px sans-serif';
      g.fillText(`flame refills ${(c.Q / 1000).toFixed(0)} kJ (water ${c.Tlo.toFixed(1)} → ${c.Thi.toFixed(1)} °C)`, 20, 146);
      g.fillText(`weight up ${c.open.toFixed(1)} s: ${(c.mdot * 1000).toFixed(1)} g/s of steam, ${(c.steam * 1000).toFixed(0)} g a whistle`, 20, 180);
      g.font = 'bold 22px sans-serif'; g.fillStyle = COL.hot; g.fillText(`a whistle every ${fmtT(tot)}`, 20, 224);
      g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('C ΔT ÷ spare heat in  +  C ΔT ÷ steam heat out', 20, 256);
    }, [10.4, 3.1, -0.6]);
    bB.mesh.rotation.y = -0.3;

    let rowsN = -1, keyB = '', tt = 0;
    return {
      reset, preRun,
      dispose() { snd.dispose(); },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s; tt += dt;
        if (s._reset) { s._reset = false; reset(); }
        fitNarrow(stage, [lT]);
        placeBoards(stage, [bA, bB], { x: 0.4, top: 12.6, gap: 2.9 });
        const span = dt * s.fast, n = Math.max(1, Math.ceil(span / 0.05));
        for (let i = 0; i < n; i++) { cfg(s); sim.step(span / n); sim.record(2); }
        const g = sim.gauge, boilIn = sim.T > 99;
        ck.set({ T: sim.T, level: clamp(sim.m / 3.6, 0.05, 1) * 0.8, boil: boilIn ? (sim.open ? 0.9 : 0.25) : sim.T > 80 ? 0.08 : 0, steamFill: clamp(0.15 + g / 110, 0, 1), lift: sim.open ? 0.8 : 0, jet: sim.open ? 1 : 0 });
        ck.step(dt); burner.set(sim.o.flame / 2500, dt);
        snd.set(sim.open ? 0.25 : 0);
        lP.element.innerHTML = g > 3 ? `inside: <b>+${g.toFixed(0)} kPa</b>${sim.open ? ' · <b>whistle!</b>' : ''}` : 'no pressure yet';
        lT.element.innerHTML = `water <b>${sim.T.toFixed(1)} °C</b>`;
        if (sim.rows.length !== rowsN) { rowsN = sim.rows.length; bA.redraw(); }
        const kb = `${sim.o.kg.toFixed(1)}|${sim.o.flame.toFixed(0)}`;
        if (kb !== keyB) { keyB = kb; bB.redraw(); }
      },
      readout: (s) => {
        const m = sim.marks, last = m.length > 1 ? m[m.length - 1] - m[m.length - 2] : null, c = whistleCycle({ kg: sim.o.kg, flame: sim.o.flame });
        const fw = firstWhistle({ kg: s.litres, flame: s.flame * 1000 });
        return `<div class="big">${sim.whistles} whistle${sim.whistles === 1 ? '' : 's'}</div>
          <div class="row"><span>Pressure · water</span><b style="color:${COL.hot}">+${sim.gauge.toFixed(0)} kPa · ${sim.T.toFixed(1)} °C</b></div>
          <div class="row"><span>First whistle, from cold</span><b>${fmtT(fw)} after lighting</b></div>
          <div class="row"><span>Between whistles: computed · seen</span><b>${fmtT(c.period)} · ${last ? fmtT(last) : '…'}</b></div>
          <div class="row"><span>Steam thrown away so far</span><b>${(sim.lost * 1000).toFixed(0)} g</b></div>
          <small>${fmtT(sim.t)} on the clock. Times are model estimates for a 5 L cooker; real weights wobble and stick.</small>`;
      },
    };
  },
};
