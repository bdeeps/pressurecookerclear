// Shared parts for PressureCookerClear: steam-table physics, the cooker's pressure cycle, cooking
// rates, chart boards, steam puffs and a generic Indian stovetop pressure cooker on a gas burner.
// Scenes are built in "scene units": 1 unit ≈ 4 cm, +x to the right, +y up.
//
// Numbers shared with sibling boxes, so that they agree:
//  · Steam tables and air pressure with height: copied from BoilClear (boil.js), IAPWS-IF97 region 4
//    and the International Standard Atmosphere. Places and heights are BoilClear's.
//  · The weight valve: BoilClear's 3 mm vent bore and 70 g weight, which hold 97 kPa (about
//    1 kgf/cm²) above the outside air. IS 2347 defines a domestic cooker as one that holds a nominal
//    cooking pressure of up to 1.0 kgf/cm² gauge (about 100 kPa), and asks for a vent pipe bore of at
//    least 2.5 mm (as quoted from the standard in search summaries; we did not read the PDF). Real
//    weights and bores vary by maker, so these two are illustrative.
//  · Cooking speed: RateClear's Arrhenius treatment with its lentil hill of 86.5 kJ/mol (firmness of
//    cooked lentils, Int. J. Food Sci. Technol. 30, 215, 1995) and its 40-minute yardstick for
//    unsoaked dal in an open pot at sea level.
import { THREE, M, box, beam, arrow, clamp, smooth, approach } from './kit.js';
import { audio } from './ui.js';

// ---------------------------------------------------------------- constants
export const K0 = 273.15;              // 0 °C in kelvin
export const ATM = 101.325;            // kPa, one standard atmosphere
export const G = 9.81;                 // m/s²
export const KGF_CM2 = 98.0665;        // kPa in 1 kgf/cm², the unit Indian cooker standards use
export const PSI = 6.89476;            // kPa per psi
export const C_WATER = 4186;           // J/(kg·K)
export const R_GAS = 8.314462618;      // J/(mol·K)
export const R_V = R_GAS / 0.018015;   // 461.5 J/(kg·K), water vapour
export const LPG_J = 46e6;             // J/kg, heat from burning LPG (as in BoilClear)
export const STOVE_ETA = 0.6;          // share of the flame's heat that reaches the pot (BoilClear)
export const TAU = Math.PI * 2;

// Saturation line of water, IAPWS-IF97 region 4 (same code as BoilClear).
const N = [0, 0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7,
  0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];
export function psat(T) {
  const K = T + K0, th = K + N[9] / (K - N[10]);
  const A = th * th + N[1] * th + N[2], B = N[3] * th * th + N[4] * th + N[5], C = N[6] * th * th + N[7] * th + N[8];
  return 1000 * Math.pow((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C)), 4);
}
export function tsat(P) {
  const b = Math.pow(Math.max(P, 0.05) / 1000, 0.25);
  const E = b * b + N[3] * b + N[6], F = N[1] * b * b + N[4] * b + N[7], Gg = N[2] * b * b + N[5] * b + N[8];
  const D = (2 * Gg) / (-F - Math.sqrt(F * F - 4 * E * Gg));
  return (N[10] + D - Math.sqrt((N[10] + D) ** 2 - 4 * (N[9] + N[10] * D))) / 2 - K0;
}
// Latent heat (J/kg) at T °C, a steam-table fit (BoilClear): 2,257 kJ/kg at 100 °C, 2,202 at 120 °C.
export const latent = (T) => 1000 * (2500.9 - 2.2 * T - 0.0024 * T * T);
// Air pressure (kPa) at height h metres, International Standard Atmosphere.
export const pAlt = (h) => ATM * Math.pow(1 - 2.25577e-5 * h, 5.25588);

export const PLACES = [
  { n: 'Mumbai', h: 14 }, { n: 'Bengaluru', h: 920 }, { n: 'Shimla', h: 2276 }, { n: 'Leh', h: 3524 },
];
export const placeOf = (h) => PLACES.find((p) => Math.abs(p.h - h) < 40);

// ---------------------------------------------------------------- the weight valve
export const WEIGHT_G = 70, BORE_MM = 3;
export const boreArea = (mm) => Math.PI * (mm / 2000) ** 2;                      // m²
// Gauge pressure (kPa) the weight holds back: the steam lifts it when P × A = m g.
export const gaugeOf = (grams, mm = BORE_MM) => ((grams / 1000) * G) / boreArea(mm) / 1000;
// Weight needed for a gauge pressure (kPa) on a bore (mm).
export const gramsFor = (kPa, mm = BORE_MM) => (kPa * 1000 * boreArea(mm) / G) * 1000;

// ---------------------------------------------------------------- the safety parts
// IS 2347 (2017 and 2023 editions, as quoted in search summaries of the standard): the fusible
// safety plug must melt or eject before the gauge pressure exceeds 3 kgf/cm² (about 294 kPa), and
// the lid must not come off until the pressure has fallen below 0.18 kgf/cm² (about 18 kPa). The
// standard only sets the upper limit for the plug; our model lets it go at 2.5 kgf/cm², an
// illustrative value inside that limit. A cooker with a gasket release system must also carry
// another safety relief device.
export const PLUG_LIMIT = 3 * KGF_CM2, PLUG_AT = 2.5 * KGF_CM2, LID_LOCK = 0.18 * KGF_CM2;

// ---------------------------------------------------------------- the cooker model
// A 5 L cooker on an LPG burner. Water (with dal) of mass m, plus the aluminium body and lid: about
// 1.3 kg at 900 J/(kg·K), an illustrative figure for a 5 L cooker. Heat in: flame × 0.6. Heat out:
// 2.4 W/K from the hot metal (BoilClear: 12 W/m²K over 0.2 m²). The first steam pushes the air out,
// so the pressure inside follows water's vapour-pressure curve (BoilClear's assumption).
// When the gauge pressure reaches the weight's value the weight lifts. Steam then leaves the bore at
// the speed of sound: ṁ = 0.667 A P ÷ √(R_v T) (choked flow of steam, discharge coefficient 1), about
// 2 g/s. That carries off heat faster than the flame brings it, so the pressure falls, and the weight
// reseats 15 kPa lower (BoilClear's figure: a real weight wobbles and sticks a little). Repeat: the
// whistles. A worn gasket leaks around the rim through an assumed 1.5 mm² gap; a blocked vent lets
// nothing out until the safety plug goes, opening a 6 mm hole (illustrative).
export const BODY_C = 1.3 * 900, HA = 2.4, AMB = 30, HYST = 15, LEAK_A = 1.5e-6, PLUG_A = Math.PI * 0.003 ** 2;
export const chokedFlow = (A, P, T) => (0.667 * A * P * 1000) / Math.sqrt(R_V * (T + K0));   // kg/s

export class Cooker {
  constructor(o = {}) { this.o = { kg: 1.5, flame: 2000, alt: 14, grams: WEIGHT_G, bore: BORE_MM, gasket: 'good', blocked: false, ...o }; this.reset(); }
  reset() {
    Object.assign(this, { T: AMB, m: this.o.kg, t: 0, open: false, whistles: 0, marks: [], rows: [], lost: 0, flow: 0, leakFlow: 0, plugGone: false, plugT: null, dry: false, Pin: pAlt(this.o.alt), fuel: 0, peak: 0 });
  }
  get Pa() { return pAlt(this.o.alt); }
  get set() { return gaugeOf(this.o.grams, this.o.bore); }
  get gauge() { return Math.max(0, this.Pin - this.Pa); }
  step(dt) {
    const o = this.o, Pa = this.Pa, set = this.set;
    this.Pin = Math.max(Pa, psat(this.T));
    const g = this.Pin - Pa;
    if (!o.blocked) {
      if (!this.open && g >= set) { this.open = true; this.whistles++; this.marks.push(this.t); }
      else if (this.open && g <= Math.max(0.5, set - HYST)) this.open = false;
    } else this.open = false;
    if (!this.plugGone && g >= PLUG_AT) { this.plugGone = true; this.plugT = this.t; }
    const T = this.T;
    this.flow = this.open ? chokedFlow(boreArea(o.bore), this.Pin, T) : 0;
    this.leakFlow = (o.gasket === 'worn' ? chokedFlow(LEAK_A, this.Pin, T) * clamp(g / 30, 0, 1) : 0) + (this.plugGone ? chokedFlow(PLUG_A, this.Pin, T) * clamp(g / 10, 0, 1) : 0);
    const out = this.flow + this.leakFlow;
    this.dry = this.m < 0.03;
    const heat = this.dry ? 0 : o.flame * STOVE_ETA, loss = HA * (T - AMB);
    this.fuel += o.flame * dt;
    this.T += ((heat - loss - out * latent(T)) * dt) / (Math.max(0, this.m) * C_WATER + BODY_C);
    this.m = Math.max(0, this.m - out * dt); this.lost += out * dt; this.t += dt;
    this.peak = Math.max(this.peak, g);
  }
  run(dt, steps) { for (let i = 0; i < steps; i++) this.step(dt); }
  record(every = 3, max = 900) { if (!this.rows.length || this.t - this.rows[this.rows.length - 1][0] >= every) { this.rows.push([this.t, this.gauge, this.T]); if (this.rows.length > max) this.rows.splice(0, 2); } }
}

// The whistle cycle worked out on paper, for the readouts. Between whistles the cooker has to warm by
// ΔT = T_boil(lift) − T_boil(reseat), storing C ΔT joules; the flame's spare power fills that, and the
// open vent's steam empties it.
export function whistleCycle({ kg = 1.5, flame = 2000, alt = 14, grams = WEIGHT_G, bore = BORE_MM } = {}) {
  const Pa = pAlt(alt), set = gaugeOf(grams, bore), hi = Pa + set, lo = Pa + Math.max(0.5, set - HYST);
  const Thi = tsat(hi), Tlo = tsat(lo), dT = Thi - Tlo, C = kg * C_WATER + BODY_C;
  const net = flame * STOVE_ETA - HA * (Thi - AMB);
  const mdot = chokedFlow(boreArea(bore), (hi + lo) / 2, (Thi + Tlo) / 2), sink = mdot * latent(Thi) - net;
  const closed = net > 0 ? (C * dT) / net : Infinity, open = sink > 0 ? (C * dT) / sink : Infinity;
  return { Thi, Tlo, dT, C, net, mdot, closed, open, period: closed + open, steam: mdot * open, Q: C * dT };
}
// Time (s) from cold to the first whistle, by stepping the same model.
export function firstWhistle(o) {
  const c = new Cooker(o);
  while (!c.whistles && c.t < 3600) c.step(0.5);
  return c.whistles ? c.t : Infinity;
}

// ---------------------------------------------------------------- cooking rate
// Arrhenius: k₂ ÷ k₁ = e^((Ea ÷ R)(1/T₁ − 1/T₂)). RateClear's dal: Ea = 86.5 kJ/mol, 40 min at 100 °C.
export const DAL = { Ea: 86.5, min: 40 };
export const speedUp = (Ea, Ta, Tb) => Math.exp(((Ea * 1000) / R_GAS) * (1 / (Ta + K0) - 1 / (Tb + K0)));
export const cookMin = (T, Ea = DAL.Ea, min = DAL.min) => min / speedUp(Ea, 100, T);

// ---------------------------------------------------------------- colours and numbers
export const COL = {
  hot: '#ff7a59', cold: '#6fb6ff', heat: '#ffb547', steam: '#8ef0ff', ok: '#5ce1a9', warn: '#ff5a6e', force: '#c49bff', text: '#e8eef8',
};
export const hex = (c) => new THREE.Color(c).getHex();
export const fmtT = (t) => (!isFinite(t) ? 'never' : t >= 3600 ? `${Math.floor(t / 3600)} h ${String(Math.floor((t % 3600) / 60)).padStart(2, '0')} min` : t >= 60 ? `${Math.floor(t / 60)} min ${String(Math.floor(t % 60)).padStart(2, '0')} s` : `${Math.round(t)} s`);
export const link = (slug, name, hash = '') => `<a href="https://glassbox.how/${slug}/${hash ? '#' + hash : ''}">${name}</a>`;

// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 5) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke();
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function dashH(g, X0, X1, y, text = '', col = 'rgba(255,255,255,.5)') {
  g.strokeStyle = col; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X0, y); g.lineTo(X1, y); g.stroke(); g.setLineDash([]);
  if (text) { g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(text, X1 - g.measureText(text).width - 4, y - 8); }
}
export function bars(g, rows, { x = 20, y = 64, w = 600, rowH = 52, labelW = 230, unit = (v) => v, max = null } = {}) {
  const mx = max ?? Math.max(1e-9, ...rows.map((r) => Math.abs(r.value))) * 1.15, span = w - labelW - 20;
  rows.forEach((r, i) => {
    const yy = y + i * rowH, L = (Math.min(Math.abs(r.value), mx) / mx) * span;
    g.font = 'bold 19px sans-serif'; g.fillStyle = r.color; g.fillText(r.label, x, yy + 24);
    g.globalAlpha = 0.85; g.fillRect(x + labelW, yy + 6, Math.max(2, L), rowH - 18); g.globalAlpha = 1;
    g.font = '18px sans-serif'; g.fillStyle = '#fff'; const t = r.text ?? unit(r.value), tw = g.measureText(t).width;
    g.fillText(t, x + labelW + L + 8 + tw > w ? x + labelW + L - tw - 8 : x + labelW + L + 8, yy + 25);
  });
}

// ---------------------------------------------------------------- layout helpers
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage: hide minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.14 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model. In the tall reel video they stack above it instead, so the portrait
// frame is filled. (On a phone they stay beside the model, clear of the readout; orbit to see them.)
export function placeBoards(stage, boards, { x = 0, top = 9.2, gap = 3.0, scale = 1.15 } = {}) {
  const tall = inReel() && stage.camera.aspect < 0.9;
  boards.forEach((b, i) => {
    if (!b.home) { b.home = b.mesh.position.clone(); b.homeRot = b.mesh.rotation.y; }
    if (tall) { b.mesh.position.set(x, top - i * gap, 0); b.mesh.rotation.y = 0; b.mesh.scale.setScalar(scale); }
    else { b.mesh.position.copy(b.home); b.mesh.rotation.y = b.homeRot; b.mesh.scale.setScalar(1); }
  });
  return tall;
}

// ---------------------------------------------------------------- 3D bits
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function dots(n, r, color = 0xffffff, seg = 8, opacity = 1) {
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { mesh.setColorAt(i, col); o.scale.setScalar(0.0001); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// Puffs of steam that drift from a source: step(dt, rate, at(), vel(p), life).
export function puffs(parent, n, r, color, rnd, opacity = 0.75) {
  const d = dots(n, r, color, 8, opacity); parent.add(d);
  const P = Array.from({ length: n }, () => ({ life: 0, max: 1, p: [0, -99, 0], v: [0, 0, 0] }));
  let acc = 0;
  return {
    mesh: d,
    step(dt, rate, at, vel, life = 1.2, grow = 1.8) {
      acc = Math.min(20, acc + rate * dt);
      for (let i = 0; i < n; i++) {
        const q = P[i];
        if (q.life <= 0 && acc >= 1) { acc -= 1; q.life = q.max = life * (0.75 + 0.5 * rnd()); q.p = at(); q.v = vel(q.p); }
        if (q.life > 0) { q.life -= dt; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; q.v[1] += 0.6 * dt; }
        const k = q.life / q.max;
        d.place(i, q.p[0], q.p[1], q.p[2], q.life > 0 ? 0.5 + grow * (1 - k) : 0.0001);
      }
      d.done();
    },
    clear() { P.forEach((q) => { q.life = 0; }); acc = 0; },
  };
}
// An arrow that ignores depth, aimed from a point along a direction with a length.
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function flowArrow(color, r = 0.05, head = 0.28) {
  const a = arrow(color, 1, head, r);
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.05) a.visible = false;
  };
  return a;
}
const C_COLD = new THREE.Color(0x3b7bff), C_MID = new THREE.Color(0xe8eef8), C_HOT = new THREE.Color(0xff5a2a);
export function tempColor(T, lo = 20, hi = 125, out = new THREE.Color()) {
  const k = clamp((T - lo) / (hi - lo), 0, 1);
  return k < 0.5 ? out.copy(C_COLD).lerp(C_MID, k * 2) : out.copy(C_MID).lerp(C_HOT, (k - 0.5) * 2);
}

// A gas burner on a steel stove top, top surface at y = 0.3. set(k) sizes the flame (0…1).
export function makeBurner(parent, { x = 0, z = 0, w = 7.5 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const top = box(w, 0.26, w * 0.8, M.metal(0x2a2e36, { roughness: 0.4 })); top.position.y = 0.13; g.add(top);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.22, 32), M.metal(0xb08c4a, { roughness: 0.45 })); cup.position.y = 0.37; g.add(cup);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.08, 32), M.matte(0x1b1d22)); cap.position.y = 0.5; g.add(cap);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.785, c = Math.cos(a), s = Math.sin(a);
    g.add(beam([c * 2.9, 0.26, s * 2.9], [c * 2.9, 0.62, s * 2.9], 0.07, M.matte(0x15171b)));
    g.add(beam([c * 2.9, 0.62, s * 2.9], [c * 1.1, 0.62, s * 1.1], 0.07, M.matte(0x15171b)));
  }
  const fm = new THREE.MeshBasicMaterial({ color: 0x4f9dff, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
  const flames = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU, f = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 8), fm);
    f.geometry.translate(0, 0.2, 0); f.position.set(Math.cos(a) * 0.8, 0.45, Math.sin(a) * 0.8); f.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
    g.add(f); flames.push(f);
  }
  let tt = 0;
  return {
    g, topY: 0.66,
    set(k, dt = 0) {
      tt += dt;
      flames.forEach((f, i) => { const s = k > 0.01 ? (0.35 + 0.9 * k) * (1 + 0.12 * Math.sin(tt * 23 + i * 1.7)) : 0.0001; f.scale.set(1, s, 1); f.visible = k > 0.01; });
    },
  };
}

// ---------------------------------------------------------------- the cooker
// A generic 5 L stovetop cooker (no maker's design): R = 2.75 (11 cm), H = 3.5 (14 cm).
// type 'outer': the lid sits on top and its skirt turns under the body's rim; the long lid handle
// lines up over the body handle when locked. type 'inner': an oval lid goes in through the oval mouth
// and steam pressure presses it up against the inside of the rim.
// The cut-away removes a wedge facing the camera (phi = 0 is +z in three.js lathes and cylinders).
export const CK = { R: 2.75, H: 3.5 };
export function makeCooker(parent, { type = 'outer', x = 0, y0 = 0.66, seed = 9, cut = true } = {}) {
  const { R, H } = CK, rnd = rng(seed);
  const g = new THREE.Group(); g.position.set(x, y0, 0); parent.add(g);
  const CUT = 1.9, C0 = 0.55, phiS = C0 + CUT / 2, phiL = TAU - CUT;
  const metal = M.metal(0xc9ced6, { roughness: 0.3, side: THREE.DoubleSide });
  const lidMetal = M.metal(0xd6dbe2, { roughness: 0.26, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const bake = M.plastic(0x17191e, { roughness: 0.55 });
  const lip = type === 'inner';
  const prof = [[0.001, 0], [R - 0.25, 0], [R - 0.05, 0.08], [R, 0.3], [R, H - 0.05]].concat(lip ? [[R - 0.08, H + 0.06], [R - 0.42, H + 0.1]] : [[R + 0.05, H], [R + 0.13, H + 0.02]]);
  const pts = prof.map(([r, y]) => new THREE.Vector2(r, y));
  const bodyFull = new THREE.Mesh(new THREE.LatheGeometry(pts, 72), metal);
  const bodyCut = new THREE.Mesh(new THREE.LatheGeometry(pts, 72, phiS, phiL), metal);
  [bodyFull, bodyCut].forEach((m) => { m.castShadow = m.receiveShadow = true; });
  const body = new THREE.Group(); body.add(bodyFull, bodyCut); g.add(body);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.3, R - 0.35, 0.12, 64), M.metal(0x9aa1ac, { roughness: 0.45 })); base.position.y = -0.06; g.add(base);
  // body handle (long, along +x) and the short helper handle opposite
  const bh = new THREE.Group(); g.add(bh);
  const bhBar = box(3.6, 0.32, 0.55, bake); bhBar.position.set(R + 2.0, H - 0.55, 0); bh.add(bhBar);
  const bhClamp = box(0.6, 0.6, 0.7, M.metal(0xaeb4be)); bhClamp.position.set(R + 0.2, H - 0.55, 0); bh.add(bhClamp);
  const helper = new THREE.Group(); g.add(helper);
  const hp = box(1.1, 0.3, 0.8, bake); hp.position.set(-R - 0.55, H - 0.55, 0); helper.add(hp);
  // the lid
  const lid = new THREE.Group(); g.add(lid);
  const lidY = lip ? H - 0.25 : H + 0.02; lid.position.y = lidY;
  let lidShell, gasketR;
  if (lip) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.32, R - 0.32, 0.1, 72), lidMetal); disc.scale.set(1, 1, 0.84); disc.position.y = 0.05; lid.add(disc);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(R - 0.32, 48, 12, 0, TAU, 0, 0.42), lidMetal); dome.scale.set(1, 0.35, 0.84); dome.position.y = 0.06 - (R - 0.32) * 0.35 * Math.cos(0.42); lid.add(dome);
    lidShell = [disc, dome]; gasketR = R - 0.3;
  } else {
    const lp = [[0.001, 0.32], [1.2, 0.27], [R - 0.2, 0.16], [R + 0.16, 0.06], [R + 0.2, -0.32], [R + 0.08, -0.36]].map(([r, y]) => new THREE.Vector2(r, y));
    const shell = new THREE.Mesh(new THREE.LatheGeometry(lp, 72), lidMetal); shell.castShadow = true; lid.add(shell);
    lidShell = [shell]; gasketR = R + 0.02;
  }
  const lh = box(3.4, 0.24, 0.5, bake); lh.position.set(R + 2.0, lip ? 0.3 : -0.15, 0); lid.add(lh);
  if (lip) { const bridge = beam([0.6, 0.12, 0], [R + 0.3, 0.3, 0], 0.09, M.metal(0xaeb4be)); lid.add(bridge); }
  else { const lhNeck = box(0.6, 0.3, 0.6, M.metal(0xaeb4be)); lhNeck.position.set(R + 0.25, 0.05, 0); lid.add(lhNeck); }
  const topY = lip ? 0.2 : 0.32;
  // vent tube on the lid's centre
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.6, 20), M.metal(0xe4e7ec)); vent.position.y = topY + 0.3; lid.add(vent);
  const ventTip = topY + 0.6;
  // safety valve boss and its fusible plug
  const SV = lip ? [-1.15, 0, 0.75] : [-1.25, 0, 0.95];
  const svY = lip ? 0.16 : 0.22;
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.22, 24), M.metal(0xaeb4be)); boss.position.set(SV[0], svY, SV[2]); lid.add(boss);
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 20), M.metal(0x8e939c, { roughness: 0.5, metalness: 0.6 })); g.add(plug);
  const plugHome = new THREE.Vector3(SV[0], lidY + svY + 0.12, SV[2]);
  // gasket release slot in the lid's skirt (outer lid) or rim (inner lid)
  const slotA = 0.35;
  const slot = box(0.45, 0.18, 0.08, M.matte(0x0b0c0f)); slot.position.set(Math.sin(slotA) * (lip ? R + 0.01 : R + 0.205), lip ? H - 0.12 - lidY : -0.14, Math.cos(slotA) * (lip ? R + 0.01 : R + 0.205)); slot.rotation.y = slotA;
  if (lip) g.add(slot); else lid.add(slot);
  // gasket: a black rubber ring
  const gasket = new THREE.Mesh(new THREE.TorusGeometry(gasketR, 0.085, 10, 96), M.matte(0x101114, { roughness: 0.7 }));
  gasket.rotation.x = Math.PI / 2; gasket.position.y = lip ? lidY + 0.12 : H + 0.0; if (lip) gasket.scale.set(1, 0.84, 1);
  g.add(gasket);
  // the weight ("whistle") sitting on the vent tube
  const wt = new THREE.Group(); g.add(wt);
  const wp = [[0.14, -0.42], [0.38, -0.42], [0.42, -0.3], [0.38, 0.05], [0.25, 0.22], [0.12, 0.28], [0.001, 0.29]].map(([r, y]) => new THREE.Vector2(r, y));
  const wBody = new THREE.Mesh(new THREE.LatheGeometry(wp, 40), M.metal(0xb8bec8, { roughness: 0.32, side: THREE.DoubleSide })); wBody.castShadow = true; wt.add(wBody);
  const wKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.3, 16), bake); wKnob.position.y = 0.42; wt.add(wKnob);
  const wtHome = new THREE.Vector3(0, lidY + ventTip, 0);
  // water and dal inside, cut like the body
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x4aa3ff, roughness: 0.1, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
  const wg = new THREE.CylinderGeometry(R - 0.06, R - 0.06, 1, 64, 1, false, phiS, phiL); wg.translate(0, 0.5, 0);
  const water = new THREE.Mesh(wg, waterMat); water.position.y = 0.04; g.add(water);
  const dal = dots(160, 0.11, 0xf2c14e); g.add(dal);
  const dalP = Array.from({ length: 160 }, () => { let a; do { a = rnd() * TAU; } while (Math.abs(((a - C0 + Math.PI * 3) % TAU) - Math.PI) < CUT / 2 + 0.1); const r = (R - 0.3) * Math.sqrt(rnd()); return { x: r * Math.sin(a), z: r * Math.cos(a), y: 0.12 + rnd() * 0.5, j: rnd() }; });
  const bub = dots(90, 0.07, 0xe6f8ff, 8, 0.8); g.add(bub);
  const bubP = Array.from({ length: 90 }, () => ({ a: rnd() * TAU, r: (R - 0.4) * Math.sqrt(rnd()), y: 0, v: 0.8 + rnd() * 1.4, on: false }));
  // steam molecules in the space above the water: more of them as the pressure rises
  const NV = 140, vap = dots(NV, 0.05, 0x8ef0ff); g.add(vap);
  const vapP = Array.from({ length: NV }, () => ({ a: rnd() * TAU, r: (R - 0.25) * Math.sqrt(rnd()), y: rnd(), w: rnd() * TAU, s: 0.5 + rnd() }));
  // steam outside
  const jet = puffs(g, 90, 0.09, 0xeef4fb, rnd, 0.55);
  const leak = puffs(g, 70, 0.07, 0xeef4fb, rnd, 0.5);
  const blow = puffs(g, 70, 0.1, 0xeef4fb, rnd, 0.6);

  const st = { explode: 0, cut: true, lift: 0, T: 30, level: 0.42, boil: 0, jet: 0, leak: 0, blow: 0, steamFill: 0, lidTurn: 0, lidUp: 0, plugOut: 0, food: true, glassLid: false, foam: 0 };
  const parts = {
    lid: { obj: lid, off: [0, 2.5, 0] }, wt: { obj: wt, off: [0, 4.1, 0] }, gasket: { obj: gasket, off: [0, 1.25, 0] }, plug: { obj: plug, off: [-0.6, 3.4, 0.6] },
    bh: { obj: bh, off: [2.0, 0, 0] }, helper: { obj: helper, off: [-1.2, 0, 0] }, base: { obj: base, off: [0, -0.35, 0] },
  };
  Object.values(parts).forEach((p) => { p.home = p.obj.position.clone(); });
  plug.position.copy(plugHome); parts.plug.home = plugHome.clone();
  wt.position.copy(wtHome); parts.wt.home = wtHome.clone();
  const foamM = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.08, R - 0.08, 1, 64, 1, false, phiS, phiL), new THREE.MeshStandardMaterial({ color: 0xf2cf6a, roughness: 0.9, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  foamM.geometry.translate(0, 0.5, 0); g.add(foamM);
  const ventClog = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), M.matte(0xf2cf6a)); ventClog.position.set(0, 0, 0); g.add(ventClog);

  let tt = 0;
  const col = new THREE.Color();
  const api = {
    g, st, R, H, lid, wt, gasket, plug, body, base, bh, helper, vent, boss, slot, water, lidMetal, lidShell, parts, type,
    ventTop: () => new THREE.Vector3(0, wt.position.y, 0),
    set(o) { Object.assign(st, o); },
    step(dt) {
      dt = Math.max(0, dt); tt += dt;
      const k = smooth(st.explode);
      for (const p of Object.values(parts)) p.obj.position.copy(p.home).addScaledVector(new THREE.Vector3(...p.off), k);
      // lid: turning to lock or unlock, lifting off
      lid.rotation.y = st.lidTurn; lid.position.y += st.lidUp;
      gasket.position.y += st.lidUp;
      const lift = st.lift * 0.22, wob = st.lift > 0.05 ? Math.sin(tt * 50) * 0.06 * st.lift : 0;
      wt.position.y += lift + st.lidUp; wt.rotation.z = wob; wt.rotation.x = wob * 0.6;
      plug.position.y += st.lidUp + st.plugOut * 1.6; plug.position.x -= st.plugOut * 0.8; plug.rotation.z = st.plugOut * 2.4;
      plug.visible = st.plugOut < 0.99;
      bodyFull.visible = !st.cut; bodyCut.visible = st.cut;
      lidMetal.opacity = st.glassLid ? 0.28 : 1; lidMetal.transparent = st.glassLid; lidMetal.depthWrite = !st.glassLid;
      const inside = k < 0.2 && st.cut;
      water.visible = inside && st.level > 0.01; water.scale.y = Math.max(0.01, st.level * H * 0.92);
      waterMat.color.copy(tempColor(st.T)).lerp(new THREE.Color(0x4aa3ff), 0.55);
      foamM.visible = inside && st.foam > 0.01; foamM.position.y = 0.04 + st.level * H * 0.92; foamM.scale.y = Math.max(0.01, st.foam * 0.85 * (H * 0.95 - st.level * H * 0.92));
      ventClog.visible = st.foam >= 0.999 && k < 0.2; ventClog.position.set(0, lid.position.y + topY + 0.58, 0);
      // dal settles at the bottom and jiggles when boiling
      const top = st.level * H * 0.92;
      dalP.forEach((d, i) => dal.place(i, d.x + st.boil * 0.04 * Math.sin(tt * 9 + i), Math.min(top - 0.1, d.y + st.boil * 0.05 * Math.sin(tt * 7 + i * 2)), d.z, inside && st.food && st.level > 0.05 ? 1 : 0.0001)); dal.done();
      bubP.forEach((b, i) => {
        if (!b.on && st.boil > 0 && rnd() < st.boil * dt * 3) { b.on = true; b.y = 0.15; }
        if (b.on) { b.y += b.v * dt * (0.6 + st.boil); if (b.y > top) b.on = false; }
        const a = b.a, ok = Math.abs(((a - C0 + Math.PI * 3) % TAU) - Math.PI) > CUT / 2 + 0.05;
        bub.place(i, b.r * Math.sin(a), b.y, b.r * Math.cos(a), b.on && inside && ok ? 0.6 + b.y / top * 0.6 : 0.0001);
      }); bub.done();
      const y0v = top + 0.1, y1v = lid.position.y - 0.15, nShow = Math.round(NV * clamp(st.steamFill, 0, 1));
      vapP.forEach((v, i) => {
        const a = v.a + Math.sin(tt * v.s + v.w) * 0.3, ok = Math.abs(((a - C0 + Math.PI * 3) % TAU) - Math.PI) > CUT / 2 + 0.05;
        const y = y0v + (y1v - y0v) * (0.5 + 0.48 * Math.sin(tt * v.s * 1.7 + v.w * 3) * (v.y * 0.5 + 0.5));
        vap.place(i, v.r * Math.sin(a), y, v.r * Math.cos(a), inside && ok && i < nShow && y1v > y0v + 0.1 ? 1 : 0.0001);
      }); vap.done();
      // steam jets
      const wy = wt.position.y - 0.38;
      jet.step(dt, 70 * st.jet, () => { const a = rnd() * TAU; return [Math.cos(a) * 0.42, wy, Math.sin(a) * 0.42]; }, (p) => [p[0] * 4, 1.6 + rnd() * 1.2, p[2] * 4], 1.0);
      leak.step(dt, 60 * st.leak, () => { const a = rnd() * TAU, r = lip ? R - 0.1 : R + 0.22; return [Math.sin(a) * r, H + (lip ? 0.15 : -0.1), Math.cos(a) * r]; }, (p) => [p[0] * 0.3, 0.8 + rnd(), p[2] * 0.3], 1.1);
      const pp = plugHome;
      blow.step(dt, 80 * st.blow, () => [pp.x, pp.y + st.lidUp + 0.1, pp.z], () => [(rnd() - 0.5) * 1.2, 3 + rnd() * 2, (rnd() - 0.5) * 1.2], 0.9);
    },
  };
  api.step(0);
  return api;
}

// ---------------------------------------------------------------- sound
// Filtered noise for the hiss of the whistle. The browser only lets a page make sound after a tap.
export function hissSound() {
  let ac = null, src = null, bp = null, gain = null;
  const start = () => {
    if (ac || inReel()) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 3;
    gain = ac.createGain(); gain.gain.value = 0;
    src.connect(bp).connect(gain).connect(ac.destination); src.start();
  };
  window.addEventListener('pointerdown', start); window.addEventListener('keydown', start);
  return {
    set(level) { if (!ac) return; gain.gain.setTargetAtTime(audio.muted ? 0 : clamp(level, 0, 0.4), ac.currentTime, 0.05); },
    dispose() {
      window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start);
      try { src?.stop(); ac?.close(); } catch { /* already closed */ }
      ac = null;
    },
  };
}
export { clamp, smooth, approach };
