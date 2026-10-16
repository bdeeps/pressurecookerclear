// Chapter 2: the weight and the pressure (cooker: 1 scene unit ≈ 4 cm; the magnified vent: 1 unit ≈ 3.3 mm).
// The weight sits on the vent pipe's bore. Steam inside pushes up on the bore's area A with a force
// (P_in − P_out) × A; the weight pushes down with m g. The weight lifts when they are equal, so the
// gauge pressure the cooker holds is P = m g ÷ A. With BoilClear's 3 mm bore (A = 7.07 mm²) and a
// 70 g weight: 0.0700 × 9.81 ÷ 7.07e-6 = 97.1 kPa, which is 0.99 kgf/cm² or 14.1 psi, close to the
// nominal 1.0 kgf/cm² of IS 2347 and the 15 psi of US cookers and canners. The bore and weight of real
// cookers vary by maker; ours are illustrative but consistent with BoilClear and the standard.
// The pressure inside is absolute: outside air + gauge. So the cooker adds its 97 kPa to whatever the
// air gives: 101 kPa in Mumbai, about 66 kPa in Leh (ISA). Boiling points from the steam tables
// (IAPWS-IF97, as BoilClear): 120.0 °C in Mumbai, 115.9 °C in Shimla, 113.8 °C in Leh.
// The push on the whole lid: gauge × lid area (11 cm radius, 0.038 m²) = about 3,700 N.
import { THREE, M } from '../kit.js';
import {
  makeCooker, makeBurner, CK, ATM, G, KGF_CM2, PSI, tsat, pAlt, gaugeOf, boreArea, PLACES, placeOf, COL, hex, board, panelBg, title, bars,
  fitNarrow, placeBoards, flowArrow, dots, rng, link, clamp, WEIGHT_G, BORE_MM, approach,
} from '../cooker.js';

const VIEW = { pos: [2.4, 6.6, 17.0], target: [2.0, 4.6, 0] };
const LID_A = Math.PI * 0.11 ** 2;
const MM = 0.3;                        // magnified vent: scene units per millimetre

export default {
  id: 'weight',
  short: 'The weight',
  title: 'A 70-gram weight holds back the steam',
  subtitle: 'Pressure is force on an area. A tiny hole lets a small weight hold back a big pressure.',
  view: VIEW,
  learn: `<p>Steam inside the cooker pushes on every surface, including the tiny hole at the top of the <b>vent pipe</b>. The weight sits over that hole. Steam can only get out if it pushes up harder than the weight pushes down.</p>
    <p><b>Pressure is force divided by area</b>, P = F ÷ A. The weight's force is its mass times gravity, m × g. So the weight lifts when the pressure reaches <b>P = m g ÷ A</b>. A 70 g weight presses down with 0.69 N. The hole is only 3 mm across, an area of 7 mm². Divide, and you get about <b>97,000 pascals</b>: roughly <b>1 kgf/cm²</b>, the pressure Indian cookers are built for. That is about the same as the whole atmosphere again, so the inside is at about <b>2 atmospheres</b>.</p>
    <p>At that pressure water does not boil until about <b>120 °C</b> (the boiling-point curve is worked out in ${link('boilclear', 'BoilClear', 'pressure')}; pressure itself is in ${link('pressureclear', 'PressureClear')}). A heavier weight or a smaller hole means more pressure and a hotter cooker. Which is exactly why you must <b>only ever use the weight that came with your cooker</b>: never a heavier one, never extra weight on top, never anything else in its place.</p>
    <p>The same steam pushes on the whole lid too. Over a lid 22 cm across, 97 kPa is a force of about <b>3,700 newtons</b>, like 380 kg standing on it. The lid, the body and the lock are built for that, with a big margin.</p>
    <p class="tip"><b>Try it:</b> raise the steam pressure slowly and watch the two arrows. When the orange push beats the purple weight, the weight lifts. Then try a lighter weight, a wider hole, and the same cooker in Leh.</p>`,
  terms: [
    { t: 'Pressure', d: 'Force spread over an area: P = F ÷ A. Measured in pascals (newtons per square metre).' },
    { t: 'kgf/cm²', d: 'An older unit Indian cooker standards use: the weight of 1 kg on 1 cm². About 98 kPa.' },
    { t: 'Gauge pressure', d: 'Pressure above the air outside. What the weight sets.' },
    { t: 'Absolute pressure', d: 'Gauge pressure plus the air outside. It decides the boiling point.' },
  ],
  defaults: { grams: WEIGHT_G, bore: BORE_MM, alt: 14, push: 60 },
  controls: [
    { key: 'push', type: 'range', label: 'Steam pressure inside (gauge)', min: 0, max: 130, step: 1, ends: ['0', '130 kPa'], fmt: (v) => `${v.toFixed(0)} kPa` },
    { key: 'grams', type: 'range', label: 'Mass of the weight (in the model)', min: 40, max: 110, step: 1, ends: ['40 g', '110 g'], fmt: (v) => `${v} g`, hint: 'A thought experiment. A real cooker must only ever use its own weight.' },
    { key: 'bore', type: 'range', label: 'Bore of the vent pipe', min: 2.5, max: 4, step: 0.1, ends: ['2.5 mm', '4 mm'], fmt: (v) => `${v.toFixed(1)} mm` },
    { key: 'place', type: 'buttons', label: 'Take the cooker to', items: PLACES.map((p) => ({ label: p.n, act: (s) => { s.alt = p.h; } })) },
  ],
  quiz: [
    { q: 'The weight is 70 g and the hole is 7 mm². Roughly what pressure lifts it?', options: ['About 1 kPa', 'About 10 kPa', 'About 100 kPa', 'About 1,000 kPa'], answer: 2, why: 'P = m g ÷ A = 0.069 kg × 9.81 ÷ 0.000007 m² ≈ 97,000 Pa, close to 100 kPa or 1 kgf/cm².' },
    { q: 'If the vent hole were made twice as wide, what would the same weight hold?', options: ['Twice the pressure', 'The same pressure', 'Half the pressure', 'A quarter of the pressure'], answer: 3, why: 'Twice the width is four times the area. The same force over four times the area is a quarter of the pressure.' },
    { q: 'Why does a cooker in Leh reach only about 114 °C instead of 120 °C?', options: ['The weight is lighter', 'The weight adds its pressure to Leh\'s thinner air, so the total inside is lower', 'The flame is weaker', 'The water is colder'], answer: 1, why: 'The weight sets the pressure above the outside air. In Leh the air gives about 66 kPa instead of 101, so the total is about 163 kPa instead of 198, and the boiling point is lower.' },
  ],
  reel: [
    { ms: 5600, caption: 'The weight sits on a hole 3 mm across. Steam must push 97,000 pascals to lift it.', set: { grams: WEIGHT_G, bore: BORE_MM, alt: 14 }, anim: { push: [20, 104] }, view: { pos: [-2.6, 6.2, 9.0], target: [-2.6, 5.2, 0] }, spin: 0 },
    { ms: 5000, caption: 'That is about 2 atmospheres inside, so water stays liquid until about 120 °C.', set: { grams: WEIGHT_G, bore: BORE_MM, alt: 14, push: 100 }, view: { pos: [0.4, 8.0, 10.0], target: [0.0, 6.6, 0] }, spin: 0.3 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const burner = makeBurner(root, { x: 2.2 });
    const ck = makeCooker(root, { type: 'outer', x: 2.2, y0: burner.topY });
    const { R, H } = CK;
    // ----- the magnified vent pipe and weight, cut in half, on the left
    const zoom = new THREE.Group(); zoom.position.set(-4.4, 0.3, 0); zoom.scale.setScalar(0.68); root.add(zoom);
    const half = (prof, mat) => { const m = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * MM, y * MM)), 48, Math.PI / 2, Math.PI), mat); m.castShadow = true; return m; };
    const steel = M.metal(0xd9dde4, { side: THREE.DoubleSide, roughness: 0.3 });
    const wMat = M.metal(0xb8bec8, { side: THREE.DoubleSide, roughness: 0.32 });
    let tubeMesh = null, wMesh = null, bore = 0, bArrows = [];
    const wGroup = new THREE.Group(); zoom.add(wGroup);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 1, 48, 1), new THREE.MeshBasicMaterial({ color: hex(COL.hot), transparent: true, opacity: 0.55, side: THREE.DoubleSide, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; zoom.add(ring);
    function shape(b) {
      bore = b;
      if (tubeMesh) { zoom.remove(tubeMesh); tubeMesh.geometry.dispose(); }
      if (wMesh) { wGroup.remove(wMesh); wMesh.geometry.dispose(); }
      const r = b / 2;
      tubeMesh = half([[r, 0], [4, 0], [4, 14], [r + 0.6, 15], [r, 15], [r, 0]], steel); zoom.add(tubeMesh);
      // the weight: a cap with a cone-shaped seat that rests on the bore's mouth
      wMesh = half([[0.001, 15 + r * 0.6], [r * 1.5, 15], [5, 15.3], [5, 6], [11, 6], [11.6, 12], [9, 20], [4, 23], [0.001, 23.5], [0.001, 15 + r * 0.6]], wMat); wGroup.add(wMesh);
      ring.geometry.dispose(); ring.geometry = new THREE.RingGeometry(0.001, r * MM, 32, 1); ring.position.y = 15 * MM - 0.01;
    }
    shape(BORE_MM);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(2.4 * MM, 3.2 * MM, 6 * MM, 24, 1, false, Math.PI / 2, Math.PI), M.plastic(0x17191e)); knob.position.y = 26.5 * MM; wGroup.add(knob);
    const lidPlate = new THREE.Mesh(new THREE.BoxGeometry(5, 0.25, 1.6), M.metal(0xd6dbe2, { roughness: 0.3 })); lidPlate.position.set(0, -0.12, -0.8); zoom.add(lidPlate);
    const NB = 80, rnd = rng(17), mol = dots(NB, 0.07, hex(COL.steam)); zoom.add(mol);
    const mp = Array.from({ length: NB }, () => ({ x: (rnd() - 0.5), y: rnd(), z: rnd() * 0.5, v: 0.5 + rnd(), side: rnd() < 0.5 ? -1 : 1, out: rnd() }));
    const aDown = flowArrow(hex(COL.force), 0.09, 0.4), aUp = flowArrow(hex(COL.hot), 0.09, 0.4); zoom.add(aDown, aUp);
    const lW = stage.label('', [0, 0, 0], zoom, 'force'), lP = stage.label('', [0, 0, 0], zoom, 'hot'), lZ = stage.label('Vent pipe and weight, magnified 12×', [0, -0.6, 0.6], zoom);
    lW.element.style.setProperty('--c', COL.force);
    const lCk = stage.label('', [2.2 + 0.4, burner.topY + H + 2.4, 0], root, 'hot');
    // a link line from the real vent to the magnified one
    const lk = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.4 + 1.2, 0.3 + 6.1, 0), new THREE.Vector3(2.2 - 0.4, burner.topY + H + 0.9, 0)]), new THREE.LineDashedMaterial({ color: 0x9fb4c8, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.6 }));
    lk.computeLineDistances(); root.add(lk);

    // ----- board: forces and boiling points
    let cur = null;
    const bd = board(root, 5.4, 3.4, 640, 404, (g, w, h) => {
      panelBg(g, w, h);
      if (!cur) return;
      title(g, 'Forces on the weight', 'newtons');
      const max = Math.max(cur.mg, cur.pa) * 1.2;
      bars(g, [{ label: 'weight pushes down', value: cur.mg, color: COL.force, text: `${cur.mg.toFixed(2)} N` }, { label: 'steam pushes up', value: cur.pa, color: COL.hot, text: `${cur.pa.toFixed(2)} N` }], { y: 56, rowH: 50, labelW: 230, max, w: 620 });
      g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText('Water boils at', 20, 206);
      bars(g, [
        { label: `open pot${cur.pl ? ', ' + cur.pl : ''}`, value: cur.T0 - 60, color: COL.cold, text: `${cur.T0.toFixed(1)} °C` },
        { label: 'cooker, weight lifted', value: cur.T1 - 60, color: COL.hot, text: `${cur.T1.toFixed(1)} °C` },
        { label: 'cooker, right now', value: cur.Tn - 60, color: COL.heat, text: `${cur.Tn.toFixed(1)} °C` },
      ], { y: 218, rowH: 50, labelW: 230, max: 75, w: 620 });
    }, [9.6, 4.6, -0.6]);
    bd.mesh.rotation.y = -0.3;

    let lift = 0, tt = 0, key = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt); tt += dt;
        const narrow = fitNarrow(stage, [lZ]);
        const tall = placeBoards(stage, [bd], { x: -1.0, top: 11.4 });
        if (Math.abs(s.bore - bore) > 0.01) shape(s.bore);
        const set = gaugeOf(s.grams, s.bore), A = boreArea(s.bore), mg = (s.grams / 1000) * G, pa = s.push * 1000 * A;
        const open = s.push >= set;
        lift = approach(lift, open ? clamp((s.push - set) / 8 + 0.35, 0.35, 1) : 0, 10, dt);
        wGroup.position.y = lift * 1.4 * MM * 2 + (open ? Math.sin(tt * 45) * 0.02 : 0);
        // steam molecules in the bore; once lifted they stream out under the weight's skirt
        const r = (s.bore / 2) * MM, dens = clamp((s.push + 101) / 230, 0.2, 1), y0 = 0.1, yTop = 15 * MM;
        mp.forEach((m, i) => {
          let x, y, z;
          if (open && m.out < 0.6) {
            const k = (tt * m.v * 0.8 + m.out) % 1;
            if (k < 0.3) { x = m.x * r; y = yTop + k * 0.4; } else if (k < 0.6) { x = m.side * (r + (k - 0.3) * 4 * MM * 4); y = yTop + 0.12; } else { x = m.side * (5.2 * MM + 0.05); y = yTop + 0.12 - (k - 0.6) * 9 * MM * 2.5; }
            z = m.z * 0.3 - 0.15;
          } else {
            x = m.x * r * 1.6; y = y0 + ((m.y + tt * m.v * 0.4) % 1) * (yTop - y0); z = -0.1 + m.z * 0.2;
          }
          mol.place(i, x, y, z, i < NB * dens ? 1 : 0.0001);
        });
        mol.done();
        const sc = 1.3 / Math.max(mg, 0.3);
        aDown.aim([0, 30 * MM + wGroup.position.y + mg * sc, 0.5], [0, -1, 0], mg * sc);
        aUp.aim([0, 15 * MM - pa * sc - 0.15, 0.5], [0, 1, 0], pa * sc);
        lW.position.set(4.6, 24 * MM + wGroup.position.y, 0.5); lW.element.innerHTML = `weight: <b>${mg.toFixed(2)} N</b>`;
        lP.position.set(3.4, 15 * MM - 1.2, 0.5); lP.element.innerHTML = `steam: <b>${pa.toFixed(2)} N</b>`;
        lk.visible = !tall;
        // the real cooker
        const Pa = pAlt(s.alt), Tn = tsat(Pa + Math.min(s.push, set));
        ck.set({ T: Tn, level: 0.42, boil: open ? 0.6 : 0.15, steamFill: clamp((s.push + 20) / 140, 0.1, 1), lift: open ? lift : 0, jet: open ? 1 : 0 });
        ck.step(dt); burner.set(0.6, dt);
        lCk.element.innerHTML = open ? `<b>whistle!</b> ${Tn.toFixed(0)} °C inside` : `${Tn.toFixed(0)} °C inside`;
        lCk.visible = !narrow;
        const pl = placeOf(s.alt)?.n || '';
        const k = `${s.grams}|${s.bore.toFixed(1)}|${s.alt}|${s.push.toFixed(0)}`;
        if (k !== key) { key = k; cur = { mg, pa, T0: tsat(Pa), T1: tsat(Pa + set), Tn, pl }; bd.redraw(); }
      },
      readout: (s) => {
        const set = gaugeOf(s.grams, s.bore), A = boreArea(s.bore) * 1e6, Pa = pAlt(s.alt), pl = placeOf(s.alt)?.n;
        const open = s.push >= set;
        return `<div class="big" style="color:${open ? COL.hot : COL.text}">${open ? 'Lifted: steam escapes' : `Held down: ${Math.round(set - s.push)} kPa to go`}</div>
          <div class="row"><span>Lifts at P = m g ÷ A</span><b style="color:${COL.hot}">${((s.grams / 1000) * G).toFixed(2)} N ÷ ${A.toFixed(1)} mm² = ${set.toFixed(0)} kPa</b></div>
          <div class="row"><span>That is</span><b>${(set / KGF_CM2).toFixed(2)} kgf/cm² · ${(set / PSI).toFixed(1)} psi</b></div>
          <div class="row"><span>Inside, absolute${pl ? ' (' + pl + ')' : ''}</span><b>${(Pa + set).toFixed(0)} kPa · ${((Pa + set) / ATM).toFixed(2)} atm</b></div>
          <div class="row"><span>Water boils at</span><b style="color:${COL.hot}">${tsat(Pa + set).toFixed(1)} °C</b></div>
          <div class="row"><span>Push on the whole lid</span><b>${Math.round(set * 1000 * LID_A).toLocaleString('en-IN')} N, like ${Math.round((set * 1000 * LID_A) / G)} kg</b></div>`;
      },
    };
  },
};
