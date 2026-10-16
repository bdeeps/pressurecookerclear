// Chapter 1: take a cooker apart. A generic 5 L aluminium stovetop cooker (1 scene unit ≈ 4 cm),
// shown in its two Indian forms: the outer-lid type, whose lid sits on top and turns to lock under the
// rim, and the inner-lid type, whose oval lid goes in through the oval mouth and is pressed up against
// the rim from inside. Parts and their jobs follow IS 2347 (Domestic Pressure Cooker, BIS): a pressure
// regulating device (the weight on the vent pipe), a safety relief device (in Indian cookers usually a
// fusible metal plug), a rubber or silicone gasket (IS 7466), and for some cookers a gasket release
// system, which the standard counts only as an extra layer on top of a separate safety relief device.
import { THREE } from '../kit.js';
import { makeCooker, makeBurner, CK, fitNarrow, gaugeOf, WEIGHT_G, BORE_MM, ATM, tsat, COL, link } from '../cooker.js';

const VIEW = { pos: [8.0, 7.0, 11.0], target: [1.3, 3.8, 0] };
const PARTS = {
  body: ['Body', 'The pot itself, pressed from aluminium or steel, with a thick base to spread the flame\'s heat. It must hold about 3,700 N (the weight of 380 kg) pushing on the lid from inside.'],
  lid: ['Lid', 'Seals the top. In an outer-lid cooker it sits on the rim and turns until its skirt locks under it. In an inner-lid cooker it goes in through the oval mouth and the steam presses it against the rim.'],
  gasket: ['Gasket', 'A rubber or silicone ring between lid and body. It is what makes the seal steam-tight. A hard, cracked or stretched gasket leaks, and the cooker never comes up to pressure.'],
  vent: ['Vent pipe', 'A thin steel tube through the lid, the only way steam is meant to leave. Its bore is only about 3 mm, so a grain of rice or a blob of dal froth can block it.'],
  wt: ['Weight (the "whistle")', 'A loose metal cap that sits on the vent pipe. Steam must lift it to escape, so its weight sets the pressure: about 1 kgf/cm² above the air outside. When it lifts you hear the whistle.'],
  plug: ['Safety valve (fusible plug)', 'A plug of a special metal that softens and blows out if the pressure or temperature climbs far above normal, for example if the vent is blocked. It is a last line of defence and is replaced after it goes.'],
  slot: ['Gasket release slot', 'On many cookers, if pressure still keeps rising, the gasket is pushed out through this small window in the lid and the steam escapes sideways.'],
  bh: ['Handles and lid lock', 'The lid handle lines up over the body handle when the lid is locked. While there is pressure inside, the lid cannot be turned or taken out.'],
};

export default {
  id: 'anatomy',
  short: 'Inside a cooker',
  title: 'Inside a pressure cooker',
  subtitle: 'A strong pot, a lid that seals, a weight on a tiny pipe, and safety parts that should never have to work.',
  view: VIEW,
  learn: `<p>A pressure cooker is a pot that can be <b>sealed</b>. Close it, heat it, and the steam has nowhere to go, so the pressure inside rises. Higher pressure means the water must get <b>hotter before it can boil</b>: about 120 °C instead of 100 °C. Hotter water cooks food much faster.</p>
    <p>The parts are few. The <b>body</b> is a strong pot with a thick base. The <b>lid</b> seals against it through a rubber <b>gasket</b>. On top of the lid stands a thin <b>vent pipe</b>, and on that sits a loose <b>weight</b>: the "whistle" every Indian kitchen knows. Steam has to lift the weight to escape, so the weight sets the pressure.</p>
    <p>Then come the safety parts. A <b>safety valve</b>, in most Indian cookers a <b>fusible plug</b> of special metal, blows out if the pressure climbs far too high. Many cookers add a <b>gasket release</b> slot. And the <b>lid lock</b> stops the lid being opened while there is pressure inside. These parts are made to work on their own, and they must <b>never be blocked, weighted down, swapped or changed</b>.</p>
    <p>India makes two kinds. In the <b>outer-lid</b> cooker the lid sits on top and turns to lock under the rim. In the <b>inner-lid</b> cooker an oval lid goes in through an oval mouth, and the steam pressure itself presses it up against the rim, so it cannot come out while there is pressure. Why water boils hotter under pressure is the story of ${link('boilclear', 'BoilClear', 'pressure')}.</p>
    <p class="tip"><b>Try it:</b> take the cooker apart, then tap a part to read what it does. Switch between the outer-lid and inner-lid types.</p>`,
  terms: [
    { t: 'Gasket', d: 'The rubber or silicone sealing ring between the lid and the body.' },
    { t: 'Vent pipe', d: 'The thin tube through the lid that steam leaves by. The weight sits on it.' },
    { t: 'Weight (whistle)', d: 'The loose cap on the vent pipe. Its weight decides how much pressure builds before steam escapes.' },
    { t: 'Fusible plug', d: 'A safety plug of metal that softens and blows out if the cooker gets far too hot or too high in pressure.' },
    { t: 'Gauge pressure', d: 'Pressure above the air outside. A cooker runs at about 1 kgf/cm² (about 100 kPa) gauge.' },
  ],
  defaults: { explode: 0, type: 'outer', cut: true, part: '' },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'exploded'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'type', type: 'seg', label: 'Kind of cooker', options: [{ v: 'outer', label: 'Outer lid' }, { v: 'inner', label: 'Inner lid' }] },
    { key: 'cut', type: 'toggle', label: 'Cut away the front', hint: 'See the water, the dal and the steam space inside.' },
    { key: 'pick', type: 'buttons', label: 'Show me', items: Object.entries(PARTS).map(([k, v]) => ({ label: v[0].replace(/ \(.*\)/, ''), act: (s) => { s.part = k; } })) },
  ],
  quiz: [
    { q: 'Which part decides how high the pressure gets in normal cooking?', options: ['The gasket', 'The weight on the vent pipe', 'The handle', 'The thick base'], answer: 1, why: 'Steam can only escape by lifting the weight, so the weight sets the pressure. The gasket only seals.' },
    { q: 'What is the fusible plug for?', options: ['To let steam out every few minutes', 'To blow out if the pressure climbs far above normal, as a last line of defence', 'To hold the lid shut', 'To make the whistle sound'], answer: 1, why: 'It is a safety part that should never have to work. If the vent is blocked and pressure keeps rising, its special metal gives way first.' },
    { q: 'Why can an inner-lid cooker not be opened while it has pressure inside?', options: ['A spring holds it', 'The steam presses the oval lid up against the inside of the rim', 'The gasket is glued', 'The weight locks it'], answer: 1, why: 'The lid is inside the mouth, so the pressure pushes it outwards against the rim. To take it out you have to push it in, which you cannot do against hundreds of kilograms of force.' },
  ],
  reel: [
    { ms: 5600, caption: 'A pressure cooker is a pot that seals: a lid, a rubber gasket, and a small weight on a thin pipe.', set: { type: 'outer', cut: false, part: '' }, anim: { explode: [0, 1] }, view: { pos: [5.6, 8.0, 7.6], target: [1.4, 5.0, 0] }, spin: 0.5 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const burner = makeBurner(root, { x: 0 });
    let ck = null, type = '', labels = [];
    const L = (txt, obj, pos, cls = '') => { const l = stage.label(txt, pos, obj, cls); labels.push(l); return l; };
    function build(t) {
      if (ck) { root.remove(ck.g); ck.g.traverse((o) => { if (o.isCSS2DObject) o.element.remove(); o.geometry?.dispose?.(); }); }
      labels = [];
      ck = makeCooker(root, { type: t, y0: burner.topY });
      type = t;
      const { R, H } = CK;
      ck.lbl = {
        wt: L('Weight (whistle)', ck.wt, [0.2, 0.9, 0], 'hot'),
        vent: L('Vent pipe', ck.lid, [0.75, t === 'inner' ? 0.8 : 1.0, 0.3]),
        lid: L(t === 'inner' ? 'Inner lid' : 'Outer lid', ck.lid, [-2.5, 0.35, 1.3]),
        gasket: L('Gasket', ck.gasket, [-R - 0.3, 0, 0]),
        plug: L('Safety valve', ck.plug, [-0.4, 0.55, 0.3], 'hot'),
        slot: L('Gasket release', ck.lid, [Math.sin(0.35) * (R + 0.3), t === 'inner' ? -0.2 : -0.55, Math.cos(0.35) * (R + 0.3)]),
        bh: L('Handles and lid lock', ck.bh, [R + 2.4, H - 0.05, 0.4]),
        body: L('Body', ck.body, [-R - 0.5, 1.4, 0.8]),
      };
      stage.pickables = [ck.wt, ck.lid, ck.gasket, ck.plug, ck.bh, ck.body, ck.helper];
    }
    build('outer');
    const pickMap = (o) => { let p = o; while (p) { if (p === ck.wt) return 'wt'; if (p === ck.plug) return 'plug'; if (p === ck.gasket) return 'gasket'; if (p === ck.bh || p === ck.helper) return 'bh'; if (p === ck.body) return 'body'; if (p === ck.lid) return o === ck.vent ? 'vent' : o === ck.slot ? 'slot' : 'lid'; p = p.parent; } return ''; };
    let S = null, tt = 0;
    return {
      pick(o) { if (S) { S.part = pickMap(o); } },
      update(dt, s) {
        dt = Math.max(0, dt); S = s; tt += dt;
        if (s.type !== type) build(s.type);
        const narrow = fitNarrow(stage, [ck.lbl.body, ck.lbl.slot, ck.lbl.vent]);
        ck.set({ explode: s.explode, cut: s.cut, T: 30, level: 0.42, boil: 0, steamFill: 0, food: true });
        ck.step(dt); burner.set(0, dt);
        const ex = s.explode > 0.3;
        ck.lbl.gasket.visible = ex; ck.lbl.slot.visible = !narrow && s.explode < 0.3; ck.lbl.plug.visible = true;
        Object.entries(ck.lbl).forEach(([k, l]) => l.element.classList.toggle('hot', k === s.part || (k === 'wt' && !s.part)));
      },
      readout: (s) => {
        const set = gaugeOf(WEIGHT_G, BORE_MM);
        if (s.part && PARTS[s.part]) return `<div class="big">${PARTS[s.part][0]}</div><small>${PARTS[s.part][1]}</small>`;
        return `<div class="big">A 5-litre cooker</div>
          <div class="row"><span>Pressure the weight holds</span><b style="color:${COL.hot}">${(set / 98.0665).toFixed(2)} kgf/cm² · ${set.toFixed(0)} kPa</b></div>
          <div class="row"><span>So water boils at</span><b style="color:${COL.hot}">${tsat(ATM + set).toFixed(0)} °C, not 100 °C</b></div>
          <div class="row"><span>Kind</span><b>${s.type === 'inner' ? 'inner lid: pressure seals it' : 'outer lid: turns to lock'}</b></div>
          <small>Tap a part, or pick one under "Show me".</small>`;
      },
    };
  },
};
