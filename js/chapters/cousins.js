// Chapter 6: history and cousins (1 scene unit ≈ 4 cm for the cooker and multicooker; Papin's
// digester and the autoclave are drawn smaller than life to share the stage).
// Papin's steam digester (shown to the Royal Society in 1679, described in print in 1681): a strong
// metal pot with its lid screwed down in a frame, and a weighted lever pressing on a small valve. A
// lever multiplies the weight: the valve stays shut until P × A × a = W × L, where a is the valve's
// distance from the pivot and L the weight's. The dimensions here are illustrative (Papin's own are not
// in our sources): a 0.5 kg weight, a 12 mm valve 4 cm from the pivot, the weight slid 4 to 20 cm out.
// Autoclave (Chamberland, 1879): 121 °C at about 100 kPa (15 psi) gauge for 15 to 60 minutes, or
// 134 °C for about 3 minutes (Wikipedia, Autoclave). The steam tables give 121.0 °C at 103.4 kPa
// gauge and need 203 kPa gauge for 134 °C. US home canning: 10 to 15 psi gauge for 240 to 250 °F
// (USDA, via the National Center for Home Food Preservation), to kill botulinum spores.
// Electric multicooker: a heater plate under a removable pot, a sensor, and a spring- or weight-loaded
// valve with a float pin that locks the lid. Older models of one popular brand worked at about 12 psi
// (83 kPa) gauge, its later "Max" model at 15 psi (a museum catalogue entry, read only in a search
// summary), so we use 83 kPa: about 117 °C.
import { THREE, M, box, beam } from '../kit.js';
import {
  makeCooker, makeBurner, CK, tsat, gaugeOf, ATM, PSI, G, COL, hex, fitNarrow, inReel, clamp, dots, rng, puffs, TAU, WEIGHT_G, BORE_MM, link, approach,
} from '../cooker.js';

const VIEWS = {
  papin: { pos: [-6.5, 6.4, 11.0], target: [-6.5, 3.4, 0] },
  cooker: { pos: [1.2, 6.6, 11.8], target: [1.2, 3.4, 0] },
  autoclave: { pos: [8.8, 6.0, 11.0], target: [8.8, 3.0, 0] },
  electric: { pos: [15.6, 6.0, 10.6], target: [15.6, 3.0, 0] },
  all: { pos: [4.9, 10.0, 27.5], target: [4.9, 3.6, 0] },
};
const PAP = { W: 0.5, a: 0.04, d: 0.012 };
const papinKPa = (L) => (PAP.W * G * L) / (PAP.a * Math.PI * (PAP.d / 2) ** 2) / 1000;
const AUTO = 103.4, ELEC = 83;

export default {
  id: 'cousins',
  short: 'History',
  title: 'From a bone digester to the cooker on every stove',
  subtitle: 'The same idea, sealed steam, in a 17th-century lab, a hospital autoclave and an electric multicooker.',
  view: VIEWS.all,
  learn: `<p>In <b>1679</b> the French scientist <b>Denis Papin</b>, working in London, showed the Royal Society his <b>steam digester</b>: a heavy pot with a lid screwed down tight, which could soften bones. He gave it something new: a valve held shut by a <b>weight on a lever</b>. Slide the weight out and the valve holds more pressure. It is the ancestor of every safety valve, including the one on steam engines.</p>
    <p>Two hundred years later, in <b>1879</b>, <b>Charles Chamberland</b> of Pasteur's laboratory used the same idea to kill germs: the <b>autoclave</b>. Hospitals and labs still sterilise tools at <b>121 °C</b> with steam at about 1 bar gauge, the same pressure as your cooker, because boiling at 100 °C cannot kill the toughest bacterial spores.</p>
    <p>Home cookers spread in the 20th century: the Spanish "olla exprés" (patented 1918), American saucepan cookers shown in New York in 1938 and 1939, France's cocotte from 1953. In India, <b>TTK Prestige</b> began making cookers in 1959, and <b>Hawkins</b> (then Pressure Cookers and Appliances Ltd) was founded the same year, both with British partners. The weight valve and its whistle became an Indian sound, and counting whistles a national habit.</p>
    <p>Today's cousin is the <b>electric multicooker</b> (the first electric pressure cookers came in 1991): a heater, a sensor and a computer keep the pressure steady instead of a whistle. For the other way of cooking with electricity, the pan as its own heater, see ${link('inductionclear', 'InductionClear')}.</p>
    <p class="tip"><b>Try it:</b> visit each machine. On Papin's digester, slide the weight along the lever and watch the pressure it holds.</p>`,
  terms: [
    { t: 'Steam digester', d: 'Papin\'s 1679 pressure vessel for softening bones: the first pressure cooker.' },
    { t: 'Lever safety valve', d: 'A valve held shut by a weight on a lever. Moving the weight out raises the pressure it holds.' },
    { t: 'Autoclave', d: 'A steam pressure chamber that sterilises at about 121 °C. From Greek and Latin: "self-locking".' },
    { t: 'Multicooker', d: 'An electric pressure cooker controlled by a sensor and a timer.' },
  ],
  defaults: { focus: 'all', lever: 0.5 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'all', label: 'All' }, { v: 'papin', label: 'Papin, 1679' }, { v: 'cooker', label: 'Whistle cooker' }, { v: 'autoclave', label: 'Autoclave' }, { v: 'electric', label: 'Electric' }] },
    { key: 'lever', type: 'range', label: 'Papin: weight along the lever', min: 0, max: 1, step: 0.01, ends: ['4 cm', '20 cm'], fmt: (v) => `${(4 + 16 * v).toFixed(0)} cm · ${papinKPa(0.04 + 0.16 * v).toFixed(0)} kPa` },
  ],
  onChange(s, key) { if (key === 'lever') s.focus = 'papin'; },
  quiz: [
    { q: 'What did Papin add to his digester that every pressure vessel still has?', options: ['A whistle', 'A safety valve held shut by a weight', 'An electric heater', 'A glass lid'], answer: 1, why: 'His weighted lever valve let steam out before the pressure got dangerous: the first safety valve on record.' },
    { q: 'Why do hospitals sterilise at 121 °C rather than in boiling water?', options: ['It is quicker to reach', 'Some bacterial spores survive 100 °C, but not steam at 121 °C', 'Boiling water rusts tools', 'It uses less water'], answer: 1, why: 'Spores are very hard to kill at 100 °C. Steam at about 1 bar gauge reaches 121 °C and kills them in about 15 minutes.' },
    { q: 'On Papin\'s lever, moving the weight twice as far from the pivot…', options: ['halves the pressure held', 'does nothing', 'doubles the pressure held', 'quadruples it'], answer: 2, why: 'The lever\'s turning effect is weight × distance, so twice the distance presses the valve twice as hard.' },
  ],
  reel: [
    { ms: 5600, caption: 'Denis Papin\'s steam digester of 1679 had a weighted safety valve. Hospitals still sterilise this way at 121 °C.', set: { focus: 'papin', lever: 0.3 }, anim: { lever: [0.3, 0.9] }, view: { pos: [-4.6, 5.8, 7.6], target: [-6.0, 3.6, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(77), iron = M.metal(0x5d6067, { roughness: 0.55 }), brass = M.metal(0xc9a45a, { roughness: 0.4 });
    // ---------- Papin's digester (generic reconstruction, not to a specific drawing)
    const pap = new THREE.Group(); pap.position.set(-6.5, 0, 0); root.add(pap);
    const hearth = box(4.6, 0.6, 3.6, M.matte(0x6b4a3a)); hearth.position.y = 0.3; pap.add(hearth);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.0), M.glow(0xff7a3a)); glow.position.y = 0.62; pap.add(glow);
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.0, 40), iron); vessel.position.y = 2.2; vessel.castShadow = true; pap.add(vessel);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.25, 40), iron); plate.position.y = 3.82; pap.add(plate);
    [-1.6, 1.6].forEach((x) => pap.add(beam([x, 0.6, 0], [x, 5.0, 0], 0.12, iron)));
    const cross = box(3.6, 0.3, 0.45, iron); cross.position.y = 5.0; pap.add(cross);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 16), brass); screw.position.y = 4.4; pap.add(screw);
    const tbar = box(1.4, 0.12, 0.12, brass); tbar.position.y = 5.3; pap.add(tbar);
    // the valve and lever: pivot on a post at x = −1.1, valve at x = −0.7, lever out to +x
    const post = beam([-1.1, 3.95, 0.7], [-1.1, 4.55, 0.7], 0.06, iron); pap.add(post);
    const vstem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 12), brass); vstem.position.set(-0.7, 4.1, 0.7); pap.add(vstem);
    const lever = new THREE.Group(); lever.position.set(-1.1, 4.55, 0.7); pap.add(lever);
    const arm = box(2.3, 0.16, 0.16, M.metal(0x9a7b45, { roughness: 0.45 })); arm.position.x = 1.15; lever.add(arm);
    const pw = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 20), brass); lever.add(pw);
    const papSteam = puffs(pap, 30, 0.08, 0xeef4fb, rnd, 0.5);
    // ---------- a whistle cooker, for scale
    const burner = makeBurner(root, { x: 1.2, w: 6.8 });
    const ck = makeCooker(root, { type: 'outer', x: 1.2, y0: burner.topY });
    // ---------- an autoclave: a horizontal steel chamber with a round door and a gauge
    const au = new THREE.Group(); au.position.set(8.8, 0, 0); root.add(au);
    const stand = box(5.0, 1.0, 2.8, M.matte(0x3a3f4a)); stand.position.y = 0.5; au.add(stand);
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4.4, 40), M.metal(0xc9ced6, { roughness: 0.3 })); ch.rotation.x = Math.PI / 2; ch.position.y = 2.6; au.add(ch);
    const door = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 40), M.metal(0xb0b6c0)); door.rotation.x = Math.PI / 2; door.position.set(0, 2.6, 2.3); au.add(door);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 32), M.plastic(0x2a2e36)); wheel.position.set(0, 2.6, 2.55); au.add(wheel);
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.15, 32), M.plastic(0xf2f4f7)); gauge.rotation.x = Math.PI / 2; gauge.position.set(1.2, 4.6, 0.2); au.add(gauge);
    au.add(beam([1.2, 4.1, 0.2], [1.0, 3.9, 0.2], 0.06, M.metal(0xaeb4be)));
    const needle = box(0.04, 0.38, 0.02, M.glow(hex(COL.hot))); needle.geometry.translate(0, 0.17, 0); needle.position.set(1.2, 4.6, 0.3); au.add(needle);
    // ---------- electric multicooker: a generic boxy-round housing, inner pot, float pin and valve
    const el = new THREE.Group(); el.position.set(15.6, 0, 0); root.add(el);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.1, 3.6, 48), M.plastic(0x2c3038, { roughness: 0.4 })); shell.position.y = 1.8; el.add(shell);
    const panel = box(1.6, 0.9, 0.1, M.plastic(0x11141a)); panel.position.set(0, 1.6, 2.2); panel.rotation.x = -0.05; el.add(panel);
    const disp = box(1.0, 0.36, 0.05, M.glow(0x5ce1a9)); disp.position.set(0, 1.75, 2.27); el.add(disp);
    const elid = new THREE.Mesh(new THREE.SphereGeometry(2.35, 48, 12, 0, TAU, 0, 0.55), M.plastic(0x3a3f4a, { roughness: 0.35 })); elid.scale.y = 0.45; elid.position.y = 3.6 - 2.35 * 0.45 * Math.cos(0.55); el.add(elid);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 16), M.plastic(0x15171b)); valve.position.set(0.6, 4.25, -0.4); el.add(valve);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12), M.metal(0xd6dbe2)); pin.position.set(-0.7, 4.15, 0.3); el.add(pin);
    const ehandle = box(1.2, 0.25, 0.4, M.plastic(0x15171b)); ehandle.position.set(0, 4.2, 1.4); el.add(ehandle);

    const L = (html, pos, parent, cls) => stage.label(html, pos, parent, cls);
    const lPap = L('', [0, 6.2, 0], pap, 'hot'), lCk = L('', [1.2, 7.4, 0], root, 'hot'), lAu = L('', [0, 5.6, 0], au, 'hot'), lEl = L('', [0, 6.2, 0], el, 'hot');
    const subs = [L('weighted lever valve', [1.4, 5.1, 1.0], pap), L('screw clamp', [0, 5.7, 0], pap), L('pressure gauge', [1.9, 5.3, 0.2], au), L('float pin and valve', [0, 4.9, -0.2], el)];
    let focus = '', tt = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt); tt += dt;
        const narrow = fitNarrow(stage, []);
        subs.forEach((l, i) => { l.visible = !narrow && focus === ['papin', 'papin', 'autoclave', 'electric'][i]; });
        if (s.focus !== focus) { focus = s.focus; const v = VIEWS[focus] || VIEWS.all; if (!inReel()) stage.setView(v.pos, v.target, 1.0); }
        const Lm = 0.04 + 0.16 * s.lever, held = papinKPa(Lm);
        pw.position.set(Lm * 10, -0.33, 0);
        lever.rotation.z = Math.sin(tt * 30) * 0.004;
        papSteam.step(dt, 6, () => [-0.7, 4.35, 0.7], () => [(rnd() - 0.5) * 0.5, 1 + rnd(), (rnd() - 0.5) * 0.3], 1.2);
        const ckSet = gaugeOf(WEIGHT_G, BORE_MM), w = (tt % 6) < 1.2;
        ck.set({ T: 120, level: 0.42, boil: 0.3, steamFill: 0.9, lift: w ? 0.8 : 0, jet: w ? 1 : 0, cut: true });
        ck.step(dt); burner.set(0.5, dt);
        needle.rotation.z = -((AUTO / 300) * 4.2 - 2.1) + Math.sin(tt * 3) * 0.02;
        disp.material.color.setHex(Math.floor(tt) % 2 ? 0x5ce1a9 : 0x3fb98a);
        lPap.element.innerHTML = `Papin, 1679: <b>${held.toFixed(0)} kPa</b> · ${tsat(ATM + held).toFixed(0)} °C`;
        lCk.element.innerHTML = `whistle cooker: <b>${ckSet.toFixed(0)} kPa</b> · ${tsat(ATM + ckSet).toFixed(0)} °C`;
        lAu.element.innerHTML = `autoclave: <b>${AUTO.toFixed(0)} kPa</b> · ${tsat(ATM + AUTO).toFixed(0)} °C`;
        lEl.element.innerHTML = `multicooker: <b>about ${ELEC} kPa</b> · ${tsat(ATM + ELEC).toFixed(0)} °C`;
        [[lPap, 'papin'], [lCk, 'cooker'], [lAu, 'autoclave'], [lEl, 'electric']].forEach(([l, f]) => { l.visible = !narrow || focus === f; });
      },
      readout: (s) => {
        const Lm = 0.04 + 0.16 * s.lever, held = papinKPa(Lm);
        if (s.focus === 'papin') return `<div class="big">Papin's lever valve</div>
          <div class="row"><span>Weight × its distance</span><b>${(PAP.W * G).toFixed(1)} N × ${(Lm * 100).toFixed(0)} cm</b></div>
          <div class="row"><span>= steam force × valve distance</span><b>P × ${(Math.PI * (PAP.d * 500) ** 2 / 100).toFixed(2)} cm² × 4 cm</b></div>
          <div class="row"><span>Pressure held</span><b style="color:${COL.hot}">${held.toFixed(0)} kPa · water up to ${tsat(ATM + held).toFixed(0)} °C</b></div>
          <small>Dimensions are illustrative. The lever lets a small weight hold back a big push, and sliding it sets the pressure.</small>`;
        if (s.focus === 'autoclave') return `<div class="big">Autoclave: 121 °C</div>
          <div class="row"><span>Steam at</span><b style="color:${COL.hot}">${AUTO} kPa gauge (15 psi)</b></div>
          <div class="row"><span>Boils at</span><b>${tsat(ATM + AUTO).toFixed(1)} °C</b></div>
          <div class="row"><span>Typical cycle</span><b>121 °C for 15 min, or 134 °C for 3 min</b></div>
          <small>Steam at 134 °C needs about ${(203).toFixed(0)} kPa gauge. Boiling at 100 °C does not kill the toughest spores.</small>`;
        if (s.focus === 'electric') return `<div class="big">Electric multicooker</div>
          <div class="row"><span>Pressure, typical</span><b style="color:${COL.hot}">about ${ELEC} kPa (12 psi)</b></div>
          <div class="row"><span>Boils at</span><b>${tsat(ATM + ELEC).toFixed(0)} °C</b></div>
          <div class="row"><span>Controlled by</span><b>a sensor that switches the heater</b></div>
          <small>A float pin rises with the pressure and locks the lid. A valve is the backup, as on a stovetop cooker.</small>`;
        const c = gaugeOf(WEIGHT_G, BORE_MM);
        return `<div class="big">Same trick, 350 years</div>
          <div class="row"><span>Papin's digester (illustrative)</span><b>${held.toFixed(0)} kPa</b></div>
          <div class="row"><span>Indian whistle cooker</span><b>${c.toFixed(0)} kPa · ${tsat(ATM + c).toFixed(0)} °C</b></div>
          <div class="row"><span>Hospital autoclave</span><b>${AUTO} kPa · ${tsat(ATM + AUTO).toFixed(0)} °C</b></div>
          <div class="row"><span>Electric multicooker</span><b>about ${ELEC} kPa · ${tsat(ATM + ELEC).toFixed(0)} °C</b></div>`;
      },
    };
  },
};
