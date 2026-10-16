// Chapter 5: the safety parts and using a cooker safely (1 scene unit ≈ 4 cm).
// This chapter explains how each safety layer works. It gives no advice on changing any of them:
// the weight, valve, plug and gasket must only ever be the maker's own parts, used as supplied.
// Layers, as IS 2347 (BIS) describes them in search summaries of the 2017 and 2023 editions:
//  1. the pressure regulating device (the weight on the vent pipe), about 1.0 kgf/cm² gauge;
//  2. a safety relief device: in Indian cookers usually a fusible plug, which must melt or eject
//     before 3 kgf/cm² gauge (about 294 kPa, where saturated steam is at 143 °C). Our model lets it go
//     at 2.5 kgf/cm² (245 kPa, 138 °C), an illustrative value inside that limit;
//  3. on many cookers a gasket release system, which the standard treats only as an extra layer:
//     a cooker that has one must still carry another safety relief device. Not simulated here.
//  4. the lid: the standard's test asks that it cannot be removed until the pressure is below
//     0.18 kgf/cm² (about 18 kPa).
// Scenarios use the Cooker model (cooker.js). A worn gasket leaks through an assumed 1.5 mm² gap.
// A blocked vent: dal froth or rice starch rises and clogs the 3 mm bore (illustrative timing), so
// the weight can never lift and the pressure climbs until the plug goes.
// Official guidance used in the text: Hong Kong Consumer Council (2005, 2008): check the steam vent is
// clear before use; do not overfill, and use less for food that expands such as rice and beans;
// reduce the pressure before opening; for congee, soup or food that expands, turn off the heat and
// let it cool down naturally rather than releasing steam, or the vent may block; replace the gasket
// when it is out of shape; do not let it run without water. BIS: the ISI mark is compulsory under the
// Domestic Pressure Cooker (Quality Control) Order 2020 (DPIIT, S.O. 294(E), 21 January 2020), in
// force from 1 February 2021 after an amendment of 23 June 2020 moved the date from 1 August 2020.
import { THREE } from '../kit.js';
import {
  makeCooker, makeBurner, CK, Cooker, tsat, pAlt, gaugeOf, PLUG_AT, PLUG_LIMIT, LID_LOCK, KGF_CM2, COL, board, panelBg, title, axes, line, dashH,
  fitNarrow, placeBoards, fmtT, clamp, hissSound, WEIGHT_G, BORE_MM, ATM, approach,
} from '../cooker.js';

const VIEW = { pos: [4.2, 7.0, 16.6], target: [4.4, 4.6, 0] };
const LID_A = Math.PI * 0.11 ** 2;

export default {
  id: 'safety',
  short: 'Safety',
  title: 'Layers of safety, and the habits that keep them unused',
  subtitle: 'A weight, a plug that melts, a gasket that gives way, and a lid that will not open under pressure.',
  view: VIEW,
  learn: `<p>A cooker holds back a force like 380 kg on its lid, so it has several layers of safety. The <b>weight</b> keeps the pressure at about 1 kgf/cm². If the vent is ever <b>blocked</b>, the weight cannot lift and the pressure keeps climbing. Then the <b>safety valve</b>, a <b>fusible plug</b> of special metal, softens and blows out. India's standard, <b>IS 2347</b>, says it must go before the pressure reaches <b>3 kgf/cm²</b>. Many cookers also have a <b>gasket release</b>: the ring is pushed out through a slot in the lid. These parts are a last line of defence. They must <b>never be blocked, covered, weighted down, replaced with anything else or changed</b>. Use only the maker's own parts, and replace a plug that has gone with a genuine one.</p>
    <p>The <b>lid</b> cannot come off while there is pressure: the standard tests that it stays shut until the pressure has fallen below about 0.18 kgf/cm². <b>Never force it.</b> The water inside is above 100 °C, and if the lid came off it would flash into steam.</p>
    <p>Good habits, from official advice: buy a cooker with the <b>ISI mark</b> (it has been compulsory in India since 1 February 2021). <b>Check the vent pipe is clear</b> before every use. <b>Do not overfill</b>, and use less for foods that swell or froth, like rice, dal and beans: their foam can rise and <b>block the vent</b>. Never let it run dry. Replace the <b>gasket</b> when it is out of shape, hard or cracked. After cooking, turn off the flame and <b>let the pressure fall by itself</b> before opening, especially with dal, rice or soup, which can spit out and block the vent if steam is let out early. Open the lid away from your face.</p>
    <p class="tip"><b>Try it:</b> run the cooker normally, then switch off the flame and try the lid. Then see what a worn gasket does, and what happens when froth blocks the vent and the safety valve has to work.</p>`,
  terms: [
    { t: 'Safety relief device', d: 'A part that lets steam out if the pressure gets far too high, such as the fusible plug.' },
    { t: 'Fusible plug', d: 'A plug of metal that melts or is pushed out at a pressure and temperature well above normal cooking.' },
    { t: 'Gasket release system', d: 'An extra layer on some cookers: the gasket is pushed out through a slot in the lid.' },
    { t: 'Natural release', d: 'Turning off the heat and waiting for the pressure to fall by itself before opening.' },
    { t: 'ISI mark', d: 'The BIS certification mark. For pressure cookers sold in India it is compulsory.' },
  ],
  defaults: { case: 'normal', flame: true, fast: 10, open: false },
  controls: [
    { key: 'case', type: 'seg', label: 'What happens if', options: [{ v: 'normal', label: 'All is well' }, { v: 'worn', label: 'Worn gasket' }, { v: 'blocked', label: 'Froth blocks the vent' }], hint: 'Each starts the cooker again from cold.' },
    { key: 'flame', type: 'toggle', label: 'Flame on' },
    { key: 'try', type: 'buttons', label: 'The lid', items: [{ label: 'Try to open it', act: (s, inst) => inst.tryOpen() }, { label: 'Close it and start again', act: (s, inst) => inst.reset() }] },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 1, label: 'Real time' }, { v: 10, label: '×10' }, { v: 30, label: '×30' }] },
  ],
  onChange(s, key) { if (key === 'case') s._reset = true; },
  quiz: [
    { q: 'Froth has blocked the vent and the weight cannot lift. What stops the cooker bursting?', options: ['The handle', 'The safety valve (fusible plug) blows out well before the body would fail', 'The flame goes out by itself', 'Nothing'], answer: 1, why: 'The plug must go before 3 kgf/cm². The body is tested to far more. That is why the plug must never be covered or changed.' },
    { q: 'You have just switched off the flame and you are in a hurry. What should you do?', options: ['Force the lid open', 'Wait for the pressure to fall by itself before opening', 'Put more weight on the whistle', 'Hit the weight'], answer: 1, why: 'The lid is built not to open under pressure, and water above 100 °C would flash to steam. Let it cool naturally, especially with dal or rice.' },
    { q: 'The cooker steams around the rim and never whistles. What is the likely cause?', options: ['The weight is too heavy', 'A worn gasket that no longer seals', 'Too much water', 'Living too high up'], answer: 1, why: 'Steam escapes round the hard or cracked ring, so the pressure never reaches the weight. Replace the gasket with the maker\'s own.' },
  ],
  reel: [
    { ms: 5800, caption: 'If froth blocks the vent, the pressure keeps rising until the safety valve blows out. It must never be covered or changed.', set: { case: 'blocked', flame: true, fast: 10 }, act: (s, inst) => { inst.reset(); inst.preRun(s, 725); }, view: { pos: [0.0, 8.2, 9.0], target: [0.6, 7.0, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const burner = makeBurner(root, { x: 0 });
    const ck = makeCooker(root, { type: 'outer', y0: burner.topY });
    const { H } = CK;
    const snd = hissSound();
    const sim = new Cooker({ kg: 1.5, flame: 2000 });
    const lP = stage.label('', [2.4, burner.topY + H + 1.7, 0], root, 'hot'), lL = stage.label('', [-1.6, burner.topY + H + 1.0, 1.8], root);
    let S = null, opening = 0, openOK = false, trying = 0, foam = 0, msg = '';
    const reset = () => { sim.o.gasket = S?.case === 'worn' ? 'worn' : 'good'; sim.o.blocked = false; sim.reset(); opening = 0; openOK = false; trying = 0; foam = 0; msg = ''; if (S) S.flame = true; };
    const stepSim = (s, dt) => {
      sim.o.flame = s.flame && !openOK ? 2000 : 0;
      sim.o.gasket = s.case === 'worn' ? 'worn' : 'good';
      // froth rises once the dal boils, and clogs the bore after a minute or so (illustrative)
      if (s.case === 'blocked' && sim.T > 99) foam = Math.min(1, foam + dt / 90);
      sim.o.blocked = s.case === 'blocked' && foam >= 1;
      sim.step(dt); sim.record(2, 1200);
    };
    const preRun = (s, secs) => { S = s; for (let t = 0; t < secs; t += 0.25) stepSim(s, 0.25); };
    const tryOpen = () => {
      if (!S) return;
      if (sim.gauge > LID_LOCK) { trying = 1; msg = `Locked: ${sim.gauge.toFixed(0)} kPa inside pushes on the lid with ${Math.round((sim.gauge * 1000 * LID_A) / 9.81)} kg. Wait for it to fall by itself.`; }
      else { openOK = true; S.flame = false; msg = 'The pressure has fallen, so the lid turns and lifts. Tip it away from you.'; }
    };

    const bA = board(root, 6.2, 3.58, 720, 416, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Pressure inside', 'gauge, kPa');
      const t1 = Math.max(300, sim.t), t0 = Math.max(0, t1 - 1200), set = gaugeOf(WEIGHT_G, BORE_MM);
      const st = t1 - t0 > 600 ? 300 : 120, xt = []; for (let v = Math.ceil(t0 / st) * st; v <= t1; v += st) xt.push(v);
      const { X, Y } = axes(g, w, h, { x0: 70, y1: 58, y0: h - 44, xMin: t0, xMax: t1, yMin: 0, yMax: 320, xTicks: xt, yTicks: [0, 100, 200, 300], xFmt: (v) => (v / 60).toFixed(0) + ' min', yFmt: String });
      dashH(g, X(t0), X(t1), Y(PLUG_LIMIT), 'IS 2347: plug must go below this', 'rgba(255,90,110,.9)');
      dashH(g, X(t0), X(t1), Y(PLUG_AT), 'our plug goes', 'rgba(255,90,110,.55)');
      dashH(g, X(t0), X(t1), Y(set), 'weight lifts', 'rgba(255,181,71,.85)');
      dashH(g, X(t0), X(t1), Y(LID_LOCK), 'lid can open below', 'rgba(92,225,169,.8)');
      line(g, sim.rows.filter((r) => r[0] >= t0).map((r) => [r[0], r[1]]), X, Y, COL.hot, 4);
    }, [10.4, 4.6, -0.6]);
    bA.mesh.rotation.y = -0.3;

    let rowsN = -1, tt = 0;
    return {
      reset, preRun, tryOpen,
      dispose() { snd.dispose(); },
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s; tt += dt;
        if (s._reset) { s._reset = false; reset(); }
        fitNarrow(stage, [lL]);
        placeBoards(stage, [bA], { x: 0.4, top: 12.6 });
        const span = dt * s.fast, n = Math.max(1, Math.ceil(span / 0.05));
        for (let i = 0; i < n; i++) stepSim(s, span / n);
        const g = sim.gauge;
        if (openOK) opening = approach(opening, 1, 2, dt);
        trying = Math.max(0, trying - dt * 1.5);
        ck.set({
          T: sim.T, level: clamp(sim.m / 3.6, 0.05, 1) * 0.8, boil: sim.T > 99 ? 0.4 : 0, steamFill: clamp(0.15 + g / 150, 0, 1), foam: s.case === 'blocked' ? foam : 0,
          lift: sim.open ? 0.8 : 0, jet: sim.open ? 1 : 0, leak: sim.o.gasket === 'worn' && g > 2 ? 1 : 0, blow: sim.plugGone && g > 5 ? 1 : 0, plugOut: sim.plugGone ? 1 : 0,
          lidTurn: -opening * 0.5 + Math.sin(tt * 40) * 0.02 * trying, lidUp: Math.max(0, opening - 0.4) * 3,
        });
        ck.step(dt); burner.set(sim.o.flame / 2500, dt);
        snd.set(sim.open || (sim.plugGone && g > 5) ? 0.3 : sim.leakFlow > 0 ? 0.08 : 0);
        lP.element.innerHTML = sim.plugGone && g > 5 ? '<b>safety valve gone:</b> steam escapes' : g > 3 ? `inside: <b>+${g.toFixed(0)} kPa</b> · ${sim.T.toFixed(0)} °C` : 'no pressure inside';
        lP.element.style.setProperty('--c', sim.plugGone ? COL.warn : COL.hot);
        lL.element.innerHTML = g > LID_LOCK ? 'lid locked by pressure' : 'lid can open';
        if (sim.rows.length !== rowsN) { rowsN = sim.rows.length; bA.redraw(); }
      },
      readout: (s) => {
        const g = sim.gauge, set = gaugeOf(WEIGHT_G, BORE_MM);
        const head = sim.plugGone ? ['Safety valve worked', COL.warn] : s.case === 'blocked' && sim.o.blocked ? ['Vent blocked: pressure climbing', COL.warn] : s.case === 'worn' && sim.t > 400 && !sim.whistles ? ['Leaking at the rim: it never whistles', COL.heat] : g > LID_LOCK ? ['Under pressure: do not open', COL.hot] : ['No pressure: safe to open', COL.ok];
        return `<div class="big" style="color:${head[1]}">${head[0]}</div>
          <div class="row"><span>Inside now</span><b style="color:${COL.hot}">+${g.toFixed(0)} kPa (${(g / KGF_CM2).toFixed(2)} kgf/cm²) · ${sim.T.toFixed(1)} °C</b></div>
          <div class="row"><span>Highest so far</span><b>+${sim.peak.toFixed(0)} kPa · steam at ${tsat(ATM + sim.peak).toFixed(0)} °C</b></div>
          <div class="row"><span>Weight lifts · plug must go by</span><b>${set.toFixed(0)} kPa · ${PLUG_LIMIT.toFixed(0)} kPa</b></div>
          <div class="row"><span>Whistles · steam lost</span><b>${sim.whistles} · ${(sim.lost * 1000).toFixed(0)} g</b></div>
          ${msg ? `<small>${msg}</small>` : `<small>${fmtT(sim.t)} on the clock.${s.case === 'blocked' ? ' Froth rises once the dal boils; here it clogs the vent after about a minute and a half.' : ''}</small>`}`;
      },
    };
  },
};
