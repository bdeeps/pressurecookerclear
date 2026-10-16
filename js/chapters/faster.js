// Chapter 4: why it cooks faster (1 scene unit ≈ 4 cm). Two pots of the same dal, one open and one in
// the cooker, cook side by side in a time-lapse.
// Cooking is chemistry (starch swelling, cell walls softening), and its rate follows Arrhenius:
//   k₂ ÷ k₁ = e^((Ea ÷ R)(1/T₁ − 1/T₂)), R = 8.314 J/(mol·K).
// RateClear's dal: a softening hill of 86.5 kJ/mol (lentil firmness, Int. J. Food Sci. Technol. 30,
// 215, 1995) and a 40-minute open pot at sea level as the yardstick. Then 120 °C is 4.1 times faster
// than 100 °C (9.7 min), and the open pot in Leh at 88.2 °C is 2.5 times slower (101 min). The kitchen
// rule "twice as fast for every 10 °C" gives 4× for the same 20 °C. Boiling points come from the steam
// tables at each place's air pressure (BoilClear's heights): the cooker adds its 97 kPa.
// Food in a wet pot cannot get hotter than the water's boiling point, so the boiling point is the
// cooking temperature; that is the whole trick.
// Fuel (a computed estimate, our own assumptions): 1.5 kg of water and dal plus 1.3 kg of aluminium
// (7.4 kJ/K) heated from 30 °C on a 2 kW flame at 60%, then simmered on a 0.5 kW flame for the cooking
// time. Open pot: heat to the local boiling point + simmer for the open-pot time. Cooker: heat to the
// cooker's boiling point + simmer for the cooker time. LPG gives 46 MJ/kg. At sea level this gives
// about a third less gas. Measured figures (PCRA, the Petroleum Conservation Research Association, in
// its fuel-saving booklet as reproduced by Bharat Petroleum; read only via a search summary): 20% for
// rice, 46% for soaked gram dal, 41.5% for meat.
import { THREE, M } from '../kit.js';
import {
  makeCooker, makeBurner, CK, tsat, pAlt, gaugeOf, speedUp, cookMin, DAL, PLACES, placeOf, COL, hex, board, panelBg, title, bars,
  fitNarrow, placeBoards, fmtT, clamp, dots, rng, puffs, tempColor, WEIGHT_G, BORE_MM, C_WATER, BODY_C, STOVE_ETA, LPG_J, link, TAU,
} from '../cooker.js';

const VIEW = { pos: [2.8, 7.6, 19.0], target: [2.6, 5.0, 0] };
const SET = gaugeOf(WEIGHT_G, BORE_MM), CAP = 1.5 * C_WATER + BODY_C, SIMMER = 500;
const fuelMJ = (Tb, min) => ((CAP * (Tb - 30)) / STOVE_ETA + SIMMER * min * 60) / 1e6;
export const PCRA = [{ n: 'rice', p: 20 }, { n: 'soaked gram dal', p: 46 }, { n: 'meat', p: 41.5 }];

export default {
  id: 'faster',
  short: 'Why faster',
  title: 'Twenty degrees hotter, four times faster',
  subtitle: 'Cooking is chemistry, and chemistry speeds up sharply with temperature.',
  view: VIEW,
  learn: `<p>An open pot of dal can be on the highest flame and it still will not get hotter than <b>100 °C</b>. The extra heat just makes more steam. While the food is wet, the boiling point of the water <b>is</b> the cooking temperature.</p>
    <p>Cooking is <b>chemistry</b>: starch soaks up water and swells, and the walls of the lentil's cells soften and come apart. Like most reactions these speed up steeply with temperature. The rule is the <b>Arrhenius equation</b>, worked through in ${link('rateclear', 'RateClear', 'heat')}. For dal softening, the cooker's <b>120 °C</b> makes it about <b>four times faster</b>: 40 minutes in an open pot becomes about 10. The kitchen rule "twice as fast for every 10 °C" gives the same answer.</p>
    <p>In the hills it matters even more. In <b>Leh</b>, at 3,524 m, an open pot boils at only <b>88 °C</b> (${link('boilclear', 'BoilClear', 'pressure')} has the numbers), and the same dal takes well over an hour and a half. A pressure cooker there adds its own pressure to the thin air and reaches about 114 °C. That is why the cooker is essential in Ladakh and on mountain treks.</p>
    <p>It also saves fuel: less time on the flame, and very little steam lost while the lid is sealed. The Petroleum Conservation Research Association measured savings of about <b>20% for rice</b>, <b>46% for soaked gram dal</b> and <b>41.5% for meat</b> compared with ordinary cooking.</p>
    <p class="tip"><b>Try it:</b> press "Cook both" and race the two pots. Then move them to Leh. Slide the food's hill to see that tougher chemistry gains even more from the extra heat.</p>`,
  terms: [
    { t: 'Arrhenius equation', d: 'k = A e^(−Ea ÷ RT): how a reaction\'s speed rises with temperature.' },
    { t: 'Activation energy (Ea)', d: 'The energy hill a reaction must climb. Higher hills speed up more when heated.' },
    { t: 'Boiling point', d: 'The hottest that water, and wet food in it, can get at a given pressure.' },
    { t: 'Q10', d: 'How many times faster something goes for 10 °C more. About 2 for dal.' },
  ],
  defaults: { alt: 14, Ea: DAL.Ea, fast: 120, run: 0 },
  controls: [
    { key: 'go', type: 'buttons', label: 'Race', items: [{ label: 'Cook both', act: (s, inst) => inst.start() }] },
    { key: 'place', type: 'buttons', label: 'Cook in', items: PLACES.map((p) => ({ label: p.n, act: (s, inst) => { s.alt = p.h; inst.start(); } })) },
    { key: 'Ea', type: 'range', label: 'The food\'s chemistry hill, Ea', min: 40, max: 130, step: 0.5, ends: ['40 kJ/mol', '130 kJ/mol'], fmt: (v) => `${v.toFixed(1)} kJ/mol${Math.abs(v - DAL.Ea) < 0.3 ? ' · dal' : ''}`, hint: '86.5 kJ/mol is RateClear\'s figure for lentils softening.' },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 60, label: '×60' }, { v: 120, label: '×120' }, { v: 300, label: '×300' }] },
  ],
  quiz: [
    { q: 'Why can\'t a bigger flame make an open pot of dal cook faster once it is boiling?', options: ['The pot melts', 'Water cannot get hotter than its boiling point; extra heat only makes more steam', 'Dal needs a low flame', 'The flame cools the pot'], answer: 1, why: 'At the boiling point all the extra heat goes into turning water to steam. The temperature, and so the cooking speed, stays put.' },
    { q: 'About how much faster does dal cook at 120 °C than at 100 °C?', options: ['About 20% faster', 'About twice', 'About four times', 'About twenty times'], answer: 2, why: 'With dal\'s hill of 86.5 kJ/mol, Arrhenius gives 4.1 times. The 10 °C doubling rule gives 2 × 2 = 4.' },
    { q: 'In Leh, why does a pressure cooker reach only about 114 °C?', options: ['Its weight is lighter there', 'It holds the same pressure above the thin outside air, so the total inside is lower', 'The gas is weaker', 'Water is different'], answer: 1, why: 'The weight sets the pressure difference. 66 kPa of Leh air plus 97 kPa gives about 163 kPa, where water boils at about 114 °C.' },
  ],
  reel: [
    { ms: 5800, caption: 'Food in water cannot get hotter than the water. In a cooker that is 120 °C, so dal cooks about four times faster.', set: { alt: 14, Ea: DAL.Ea, fast: 300 }, act: (s, inst) => inst.start(), view: { pos: [0.6, 8.8, 13.5], target: [0.6, 7.4, 0] }, spin: 0 },
    { ms: 5200, caption: 'In Leh an open pot boils at only 88 °C. Without a cooker, dal takes well over an hour and a half.', set: { alt: 3524, Ea: DAL.Ea, fast: 300 }, act: (s, inst) => inst.start(), view: { pos: [0.6, 8.8, 13.5], target: [0.6, 7.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const XL = -4.4, XR = 4.4, rnd = rng(5);
    const bL = makeBurner(root, { x: XL, w: 7.2 }), bR = makeBurner(root, { x: XR, w: 7.2 });
    const ck = makeCooker(root, { type: 'outer', x: XR, y0: bR.topY });
    // the open pot: a steel pot cut open towards the viewer, with dal and boiling water
    const pot = new THREE.Group(); pot.position.set(XL, bL.topY, 0); root.add(pot);
    const R = 2.6, Hh = 3.2, C0 = 0.2, CUT = 1.8;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Hh, 64, 1, true, C0 + CUT / 2, TAU - CUT), M.metal(0xc3c9d3, { side: THREE.DoubleSide, roughness: 0.32 })); wall.position.y = Hh / 2; pot.add(wall);
    const pbase = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.1, 64), M.metal(0xaab1bd)); pbase.position.y = 0.05; pot.add(pbase);
    const wm = new THREE.MeshStandardMaterial({ color: 0x4aa3ff, roughness: 0.1, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.06, R - 0.06, Hh * 0.5, 64, 1, false, C0 + CUT / 2, TAU - CUT), wm); water.position.y = Hh * 0.25 + 0.1; pot.add(water);
    const dal = dots(140, 0.11, 0xf2c14e); pot.add(dal);
    const dP = Array.from({ length: 140 }, () => { let a; do { a = rnd() * TAU; } while (Math.abs(((a - C0 + Math.PI * 3) % TAU) - Math.PI) < CUT / 2 + 0.1); const r = (R - 0.3) * Math.sqrt(rnd()); return [r * Math.sin(a), 0.2 + rnd() * 0.5, r * Math.cos(a)]; });
    const steam = puffs(pot, 60, 0.12, 0xeef4fb, rnd, 0.45);
    // "how cooked" bars above each pot
    const mkBar = (x, col) => {
      const g = new THREE.Group(); g.position.set(x, 6.9, 0); root.add(g);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 0.2), new THREE.MeshBasicMaterial({ color: 0x1b2030 })); g.add(frame);
      const fill = new THREE.Mesh(new THREE.BoxGeometry(5, 0.36, 0.24), new THREE.MeshBasicMaterial({ color: hex(col), toneMapped: false })); fill.geometry.translate(2.5, 0, 0); fill.position.x = -2.5; g.add(fill);
      return { g, fill };
    };
    const barL = mkBar(XL, COL.cold), barR = mkBar(XR, COL.hot);
    const lL = stage.label('', [XL, 7.6, 0], root), lR = stage.label('', [XR, 7.6, 0], root, 'hot');
    const tL = stage.label('', [XL - 1.4, bL.topY + 1.0, 2.2], root), tR = stage.label('', [XR - 1.4, bR.topY + 1.0, 2.2], root, 'hot');

    let cur = null;
    const bd = board(root, 5.0, 3.87, 600, 464, (g, w, h) => {
      panelBg(g, w, h);
      if (!cur) return;
      title(g, 'Cooking time', cur.pl || '');
      bars(g, [
        { label: 'open pot, Mumbai', value: cur.tSea, color: COL.cold, text: `${cur.tSea.toFixed(0)} min` },
        { label: `open pot${cur.pl ? ', ' + cur.pl : ''}`, value: cur.tOpen, color: COL.cold, text: `${cur.tOpen.toFixed(0)} min at ${cur.T0.toFixed(0)} °C` },
        { label: 'pressure cooker', value: cur.tCk, color: COL.hot, text: `${cur.tCk.toFixed(0)} min at ${cur.T1.toFixed(0)} °C` },
      ], { y: 50, rowH: 48, labelW: 200, w: 590, max: Math.max(cur.tOpen, cur.tSea) * 1.25 });
      g.fillStyle = COL.text; g.font = 'bold 22px sans-serif'; g.fillText('Gas saved', 20, 224);
      g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('computed here, and measured by PCRA', 140, 224);
      bars(g, [{ label: 'our estimate here', value: cur.save, color: COL.ok, text: `${cur.save.toFixed(0)}%` }].concat(PCRA.map((p) => ({ label: `PCRA: ${p.n}`, value: p.p, color: COL.heat, text: `${p.p}%` }))), { y: 238, rowH: 50, labelW: 200, w: 590, max: 80 });
    }, [10.4, 6.1, -1.4]);
    bd.mesh.rotation.y = -0.45;

    let t = 0, running = false, key = '', tt = 0;
    const start = () => { t = 0; running = true; };
    return {
      start,
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); tt += dt;
        const narrow = fitNarrow(stage, [tL, tR]);
        placeBoards(stage, [bd], { x: 0.6, top: 13.0, scale: 1.25 });
        const Pa = pAlt(s.alt), T0 = tsat(Pa), T1 = tsat(Pa + SET);
        const tOpen = cookMin(T0, s.Ea), tCk = cookMin(T1, s.Ea), tSea = cookMin(tsat(pAlt(14)), s.Ea);
        if (running) { t += dt * s.fast / 60; if (t > tOpen * 1.05) running = false; }
        const kL = clamp(t / tOpen, 0, 1), kR = clamp(t / tCk, 0, 1);
        barL.fill.scale.x = Math.max(0.001, kL); barR.fill.scale.x = Math.max(0.001, kR);
        lL.element.innerHTML = kL >= 1 ? `open pot: <b>done</b> in ${tOpen.toFixed(0)} min` : `open pot: <b>${Math.round(kL * 100)}%</b> cooked`;
        lR.element.innerHTML = kR >= 1 ? `cooker: <b>done</b> in ${tCk.toFixed(0)} min` : `cooker: <b>${Math.round(kR * 100)}%</b> cooked`;
        tL.element.innerHTML = `<b>${T0.toFixed(1)} °C</b>`; tR.element.innerHTML = `<b>${T1.toFixed(1)} °C</b>`;
        wm.color.copy(tempColor(T0)).lerp(new THREE.Color(0x4aa3ff), 0.55);
        dP.forEach((p, i) => dal.place(i, p[0] + 0.04 * Math.sin(tt * 9 + i), p[1] + 0.05 * Math.sin(tt * 7 + i) + kL * 0.3 * ((i % 5) / 5), p[2], 1 + kL * 0.25)); dal.done();
        steam.step(dt, 30, () => { const a = rnd() * TAU, r = R * 0.8 * Math.sqrt(rnd()); return [r * Math.sin(a), Hh * 0.55, r * Math.cos(a)]; }, () => [(rnd() - 0.5) * 0.3, 1.2 + rnd(), (rnd() - 0.5) * 0.3], 1.4);
        const whistle = running && kR < 1 && (tt % 4) < 0.6;
        ck.set({ T: T1, level: 0.42, boil: 0.3, steamFill: 0.9, lift: whistle ? 0.8 : 0, jet: whistle ? 1 : 0 });
        ck.step(dt); bL.set(0.4, dt); bR.set(0.4, dt);
        const k = `${s.alt}|${s.Ea}`;
        if (k !== key) {
          key = k;
          const eO = fuelMJ(T0, tOpen), eC = fuelMJ(T1, tCk);
          cur = { tOpen, tCk, tSea, T0, T1, pl: placeOf(s.alt)?.n || '', save: (1 - eC / eO) * 100, eO, eC };
          bd.redraw();
        }
      },
      readout: (s) => {
        const Pa = pAlt(s.alt), T0 = tsat(Pa), T1 = tsat(Pa + SET), pl = placeOf(s.alt)?.n;
        const r = speedUp(s.Ea, T0, T1), eO = fuelMJ(T0, cookMin(T0, s.Ea)), eC = fuelMJ(T1, cookMin(T1, s.Ea));
        return `<div class="big">Cooker: ${r.toFixed(1)}× faster${pl ? ' in ' + pl : ''}</div>
          <div class="row"><span>Boils at: open pot · cooker</span><b style="color:${COL.hot}">${T0.toFixed(1)} °C · ${T1.toFixed(1)} °C</b></div>
          <div class="row"><span>Cooking time: open · cooker</span><b>${cookMin(T0, s.Ea).toFixed(0)} min · ${cookMin(T1, s.Ea).toFixed(0)} min</b></div>
          <div class="row"><span>LPG used (estimate): open · cooker</span><b>${((eO * 1e6) / LPG_J * 1000).toFixed(0)} g · ${((eC * 1e6) / LPG_J * 1000).toFixed(0)} g</b></div>
          <small>Arrhenius, from a 40-minute open pot at sea level. Gas: our estimate.</small>`;
      },
    };
  },
};
