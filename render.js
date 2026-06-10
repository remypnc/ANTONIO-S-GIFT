/* =========================================================================
   RENDER v2 — isométrique abyssal, lumière autour du joueur
   Le monde émerge du noir : seules les tuiles proches s'éclairent.
   ========================================================================= */
(function () {

  // ---- Géométrie isométrique (tuiles plus grandes = plus "zoomé") ------
  const HW = 68;    // demi-largeur tuile
  const HH = 34;    // demi-hauteur tuile (2:1)
  const DUNIT = 17; // hauteur d'une unité de profondeur

  function project(gx, gy) { return { x: (gx - gy) * HW, y: (gx + gy) * HH }; }

  function hash(x, y) {
    let h = Math.sin((x + 12.9) * 127.1 + (y + 7.3) * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }

  // ---- Préchargement des SVG dessinés (panneau, flèches sol, alphabet) --
  const IMG = {};
  function img(src) { if (IMG[src]) return IMG[src]; const i = new Image(); i.decoding = "async"; i.src = src; IMG[src] = i; return i; }
  const ASSET = {
    sign: "uploads/sign.svg",
    arrowSol: { up: "uploads/fleche-sol-haut-gauche.svg", right: "uploads/fleche-sol-haut-droite.svg", down: "uploads/fleche-sol-bas-droite.svg", left: "uploads/fleche-sol-bas-gauche.svg" },
  };
  function glyphImg(ch) { return img("uploads/" + ch + ".svg"); }
  img(ASSET.sign); Object.keys(ASSET.arrowSol).forEach(k => img(ASSET.arrowSol[k]));
  "abcdefghijklmnopqrstuvwxyz".split("").forEach(glyphImg);   // alphabet secret

  // hex -> [r,g,b]
  function hexRgb(hex) { const n = parseInt((hex || "#5fd0ff").slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  // multiplie une couleur hex par un facteur de lumière (0..1)
  const _cache = {};
  function shade(hex, f) {
    const key = hex + "|" + (f = Math.max(0, Math.min(1, f))).toFixed(3);
    if (_cache[key]) return _cache[key];
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f);
    const g = Math.round(((n >> 8) & 255) * f);
    const b = Math.round((n & 255) * f);
    return (_cache[key] = "rgb(" + r + "," + g + "," + b + ")");
  }

  const C = {
    bg: "#000000",
    grout: 0.05,                 // luminosité du joint
    topA: "#f6f6f6", topB: "#d2d2d2",
    topBrightA: "#ffffff", topBrightB: "#e6e6e6",
    faceL_A: "#c4c4c4", faceL_B: "#000000",
    faceR_A: "#8e8e8e", faceR_B: "#000000",
    teleport: "#5fd0ff",
    secret: "#b98cff",
    gold: "#f4cf6a",
  };

  // ---- TUILE 3D ---------------------------------------------------------
  // light : 0..1 (proximité au joueur). hidden tiles handled by caller.
  function drawTile(ctx, tile, light) {
    const h = hash(tile.x, tile.y);
    // effet "île flottante" : milieu/côtés profonds, coins courts.
    const nb = (tile._nb != null ? tile._nb : 4);
    const baseDepth = (tile.depth != null && tile.depth > 5) ? tile.depth : (2.6 + nb * 1.8);
    const depth = baseDepth + h * 1.4;
    const d = depth * DUNIT;
    const p = project(tile.x, tile.y);
    const press = (tile.press || 0) * 6;
    const rev = tile.reveal == null ? 1 : tile.reveal;
    if (rev <= 0.01) return null;
    if (tile._fallen) return null;             // tuile écroulée = trou

    const ox = (h - 0.5) * 4;
    const oy = (hash(tile.y * 3.1, tile.x * 2.7) - 0.5) * 3;
    const sink = tile._sink || 0;       // tuile qui s'écroule : s'enfonce
    const shake = tile._shake || 0;     // vibration avant la chute
    const X = p.x + ox + shake;
    const emerge = (1 - rev) * 46;
    const Y = p.y + oy + press + emerge + sink;

    const N = { x: X, y: Y };
    const E = { x: X + HW, y: Y + HH };
    const S = { x: X, y: Y + 2 * HH };
    const Wp = { x: X - HW, y: Y + HH };
    const Eb = { x: E.x, y: E.y + d };
    const Sb = { x: S.x, y: S.y + d };
    const Wb = { x: Wp.x, y: Wp.y + d };

    // tuile "décor" (ex: photo suspendue au-dessus du vide) : pas de cube, juste la géométrie
    if (tile.decor) { ctx.globalAlpha = 1; return { cx: X, cy: Y + HH, topY: Y, depthPx: 0, N, E, S, W: Wp }; }

    ctx.globalAlpha = rev;
    const L = Math.max(C.grout, light);

    // Face droite -> noir
    let g = ctx.createLinearGradient(0, S.y, 0, Sb.y);
    g.addColorStop(0, shade(C.faceR_A, L * 0.85));
    g.addColorStop(0.7, shade(C.faceR_A, L * 0.18));
    g.addColorStop(1, "#000");
    ctx.fillStyle = g; poly(ctx, [E, S, Sb, Eb]); ctx.fill();

    // Face gauche -> noir (un peu plus claire)
    g = ctx.createLinearGradient(0, S.y, 0, Sb.y);
    g.addColorStop(0, shade(C.faceL_A, L));
    g.addColorStop(0.7, shade(C.faceL_A, L * 0.2));
    g.addColorStop(1, "#000");
    ctx.fillStyle = g; poly(ctx, [Wp, S, Sb, Wb]); ctx.fill();

    // arête verticale
    ctx.strokeStyle = shade("#000000", 1); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(Sb.x, Sb.y); ctx.stroke();

    // Top
    const tA = tile.bright ? C.topBrightA : C.topA;
    const tB = tile.bright ? C.topBrightB : C.topB;
    g = ctx.createLinearGradient(N.x, N.y, S.x, S.y);
    g.addColorStop(0, shade(tA, L)); g.addColorStop(1, shade(tB, L));
    ctx.fillStyle = g; poly(ctx, [N, E, S, Wp]); ctx.fill();

    // joint sombre
    ctx.strokeStyle = shade("#000000", 1); ctx.lineWidth = 2.5;
    poly(ctx, [N, E, S, Wp]); ctx.stroke();

    // tuile instable (crumble) : réseau de fissures gravé sur le dessus.
    //   au repos = traits gris gravés ; quand ça cède = veines de lave rouge qui s'ouvrent.
    if (tile.crumble && !tile._fallen) {
      const active = (tile._crumbleT || 0) > 0;
      const cx0 = X, cy0 = Y + HH;
      const open = active ? Math.min(1, (tile._crumbleT || 0) / 0.6) : 0;   // les fissures s'écartent
      ctx.save();
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.globalAlpha = rev * (active ? 1 : 0.62);
      // vecteur (u,v) du plan de la tuile -> pixels iso (losange)
      const iso = (u, v) => ({ x: (u - v) * HW * 0.5, y: (u + v) * HH * 0.5 });
      const seed = hash(tile.x, tile.y), branches = 5;
      // chaque branche serpente du centre vers un bord (marche aléatoire déterministe)
      const paths = [];
      for (let b = 0; b < branches; b++) {
        const segs = 3 + Math.floor(hash(b * 1.7, tile.y) * 3);
        let u = (hash(b, tile.x + tile.y) - 0.5) * 0.12, v = (hash(b + 3, tile.x) - 0.5) * 0.12;
        let dir = seed * 6.283 + b * (6.283 / branches) + (hash(b, tile.x) - 0.5) * 0.5;
        const pts = [iso(u, v)], reach = (0.6 + open * 0.28) / segs;
        for (let s = 0; s < segs; s++) {
          dir += (hash(tile.x + s, tile.y + b) - 0.5) * 0.95;        // serpente
          u += Math.cos(dir) * reach; v += Math.sin(dir) * reach;
          pts.push(iso(u, v));
        }
        paths.push(pts);
      }
      const stroke = (col, w) => {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        for (const pts of paths) { ctx.beginPath(); ctx.moveTo(cx0 + pts[0].x, cy0 + pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(cx0 + pts[i].x, cy0 + pts[i].y); ctx.stroke(); }
      };
      if (active) {
        ctx.shadowColor = "rgba(255,95,55,0.9)"; ctx.shadowBlur = 8 + open * 10;   // lueur de lave
        stroke("rgba(255,150,80," + (0.65 + 0.35 * open) + ")", 3 + open);
        ctx.shadowBlur = 0;
        stroke("rgba(120,22,10,0.95)", 1.2);                                       // cœur sombre
      } else {
        ctx.shadowBlur = 0;
        stroke("rgba(18,18,22,0.85)", 2.2);                                        // sillon gravé
        stroke("rgba(150,150,158,0.55)", 0.8);                                     // arête claire
      }
      ctx.restore();
      ctx.globalAlpha = rev;
    }

    // usure
    if (h > 0.78 && L > 0.4) {
      ctx.globalAlpha = rev * 0.16 * L;
      ctx.strokeStyle = "#777"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X - 22, Y + HH + 4); ctx.lineTo(X - 4, Y + HH - 8); ctx.stroke();
      ctx.globalAlpha = rev;
    }
    // racines abyssales : quelques traits qui plongent et se fondent dans le noir
    if (L > 0.28 && nb <= 3 && h > 0.45) {
      const cnt = 1 + Math.floor(h * 2);
      ctx.lineWidth = 2;
      for (let i = 0; i < cnt; i++) {
        const hx = hash(tile.x + i * 1.7, tile.y * 2.3);
        const rx = Sb.x + (hx - 0.5) * HW * 0.7;
        const len = 26 + hx * 40;
        const rg = ctx.createLinearGradient(0, Sb.y, 0, Sb.y + len);
        rg.addColorStop(0, shade("#444444", L * 0.5)); rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = rg; ctx.globalAlpha = rev * 0.6;
        ctx.beginPath(); ctx.moveTo(rx, Sb.y - 6); ctx.lineTo(rx + (hash(i, tile.x) - 0.5) * 10, Sb.y + len); ctx.stroke();
      }
      ctx.globalAlpha = rev;
    }
    ctx.globalAlpha = 1;
    return { cx: X, cy: Y + HH, topY: Y, depthPx: d, N, E, S, W: Wp };
  }

  // ---- Chevron de direction devant le héros (flèche dessinée fleche-*.svg) --
  //   up = haut-gauche · right = haut-droite · down = bas-droite · left = bas-gauche
  const FLECHE_PATHS = {
    up:    "M57 39.4395C46.6191 33.1698 28.4878 22.023 19.779 16.7509L18.7223 16.1112C15.0049 13.717 8.60624 11.1811 6.15726 9.11955M45 5.9995C35.5726 6.73595 18.889 7.37053 18.889 7.37053C18.889 7.37053 6.71825 8.32832 6.15726 9.11955C5.80342 10.746 6.15726 30.4283 6.15726 35.3164",
    right: "M6 39.4395C16.3809 33.1698 34.5122 22.023 43.221 16.7509L44.2777 16.1112C47.9951 13.717 54.3938 11.1811 56.8427 9.11955M18 5.9995C27.4274 6.73595 44.111 7.37053 44.111 7.37053C44.111 7.37053 56.2818 8.32832 56.8427 9.11955C57.1966 10.746 56.8427 30.4283 56.8427 35.3164",
    down:  "M6 6C16.3809 12.2697 34.5122 23.4164 43.221 28.6886L44.2777 29.3282C47.9951 31.7224 54.3938 34.2584 56.8427 36.3199M6 41C21.2382 39.9579 44.111 38.0689 44.111 38.0689C44.111 38.0689 56.2818 37.1111 56.8427 36.3199C57.1966 34.6935 56.8427 15.0112 56.8427 10.1231",
    left:  "M57 6C46.6191 12.2697 28.4878 23.4164 19.779 28.6886L18.7223 29.3282C15.0049 31.7224 8.60624 34.2584 6.15726 36.3199M57 41C41.7618 39.9579 18.889 38.0689 18.889 38.0689C18.889 38.0689 6.71825 37.1111 6.15726 36.3199C5.80342 34.6935 6.15726 15.0112 6.15726 10.1231",
  };
  const _flecheP = {};
  function flechePath(dir) { return _flecheP[dir] || (_flecheP[dir] = new Path2D(FLECHE_PATHS[dir])); }
  function drawFacingArrow(ctx, cx, cy, dir, t) {
    if (!FLECHE_PATHS[dir]) return;
    const G = { up: { x: -1, y: 0 }, down: { x: 1, y: 0 }, left: { x: 0, y: 1 }, right: { x: 0, y: -1 } }[dir];
    const F = { x: (G.x - G.y) * HW, y: (G.x + G.y) * HH };          // axe iso au sol
    const fl = Math.hypot(F.x, F.y); const ux = F.x / fl, uy = F.y / fl;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4.5);
    const off = 64 + pulse * 6;                                       // distance devant le perso (px écran)
    const ax = cx + ux * off, ay = cy + uy * off - 26;
    const scale = 0.5;
    ctx.save();
    ctx.translate(ax, ay); ctx.scale(scale, scale); ctx.translate(-31.5, -23);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    const p = flechePath(dir);
    ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 14; ctx.stroke(p);            // contour noir
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 7; ctx.stroke(p);             // flèche blanche
    ctx.restore();
  }

  // halo additif posé sur le sol (bloom de lumière)
  function floorGlow(ctx, cx, cy, r, color, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(cx, cy); ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, color.replace(")", "," + alpha + ")").replace("rgb", "rgba"));
    g.addColorStop(1, color.replace(")", ",0)").replace("rgb", "rgba"));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---- Flèche au sol : flèche dessinée (bold), plaquée NOIRE sur la tuile
  function drawFloorArrow(ctx, info, dir, alpha) {
    if (!info || !FLECHE_PATHS[dir]) return;
    const p = flechePath(dir), scale = 0.44;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.translate(info.cx, info.cy); ctx.scale(scale, scale); ctx.translate(-31.5, -23);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 16; ctx.stroke(p);   // halo (lisible sur fond sombre)
    ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 12; ctx.stroke(p);                  // flèche noire
    ctx.restore();
  }

  // ---- Tuile téléporteur : 4 rideaux de lumière qui montent sur chaque côté
  //   color pilote toute la teinte (bleu = téléporteur, rouge = case d'action/reveal).
  //   opts.pad = true : pad d'action plat (peu de rideaux), pour la case rouge.
  function drawTeleporterTop(ctx, info, color, t, light, opts) {
    if (!info) return;
    opts = opts || {};
    const { N, E, S, W, cx, cy } = info;
    const [cr0, cg0, cb0] = hexRgb(color || "#5fd0ff");
    const lift = (v, a) => Math.min(255, Math.round(v + a));
    const rgba = (a) => "rgba(" + cr0 + "," + cg0 + "," + cb0 + "," + a + ")";
    const cLite = "rgb(" + lift(cr0, 110) + "," + lift(cg0, 110) + "," + lift(cb0, 90) + ")";
    const cMid = "rgb(" + lift(cr0, 50) + "," + lift(cg0, 50) + "," + lift(cb0, 40) + ")";
    const cBase = "rgb(" + cr0 + "," + cg0 + "," + cb0 + ")";
    const pulse = (Math.sin(t * 3) + 1) / 2;
    ctx.save();
    // 1) dessus de tuile lumineux (teinté)
    ctx.globalAlpha = 0.5 + 0.4 * pulse;
    let g = ctx.createLinearGradient(N.x, N.y, S.x, S.y);
    g.addColorStop(0, cLite); g.addColorStop(0.5, cMid); g.addColorStop(1, cBase);
    ctx.fillStyle = g; poly(ctx, [N, E, S, W]); ctx.fill();
    ctx.globalAlpha = 0.75 + 0.25 * pulse; ctx.strokeStyle = cLite; ctx.lineWidth = opts.pad ? 3 : 2;
    poly(ctx, [N, E, S, W]); ctx.stroke();
    ctx.restore();

    // 2) RIDEAUX DE LUMIÈRE : un sur chacun des 4 côtés du losange, qui s'élève
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const edges = [[N, E], [E, S], [S, W], [W, N]];
    const bh = opts.pad ? 46 : 116;
    edges.forEach((ed, i) => {
      const [a, b] = ed;
      const wob = 0.85 + 0.15 * Math.sin(t * 2.4 + i * 1.7);   // chaque côté respire à son rythme
      const h = bh * wob;
      // quad qui monte depuis l'arête, légèrement resserré en haut
      const mx = (a.x + b.x) / 2, taper = 0.22;
      const aTop = { x: a.x + (mx - a.x) * taper, y: a.y - h };
      const bTop = { x: b.x + (mx - b.x) * taper, y: b.y - h };
      const cg = ctx.createLinearGradient(0, (a.y + b.y) / 2, 0, (a.y + b.y) / 2 - h);
      cg.addColorStop(0, rgba(0.30 + 0.14 * pulse));
      cg.addColorStop(0.55, rgba(0.12));
      cg.addColorStop(1, rgba(0));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(bTop.x, bTop.y); ctx.lineTo(aTop.x, aTop.y); ctx.closePath(); ctx.fill();
    });
    ctx.restore();

    // 3) CARRÉS IRRÉGULIERS qui montent le long de tout le périmètre (random)
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const corners = [N, E, S, W];
    const COUNT = opts.pad ? 14 : 30;
    for (let i = 0; i < COUNT; i++) {
      // bruit fixe par particule -> tailles/vitesses/positions non régulières
      const r1 = hash(i * 2.13, 7.7), r2 = hash(i * 5.31, 1.3), r3 = hash(i * 0.77, 9.1), r4 = hash(i * 3.9, 4.4);
      const side = Math.floor(r1 * 4);                       // sur quel côté il part
      const a = corners[side], b = corners[(side + 1) % 4];
      const u = r2;                                          // position le long de l'arête
      const ex = a.x + (b.x - a.x) * u, ey = a.y + (b.y - a.y) * u;
      const speed = 0.28 + r3 * 0.6;                         // vitesse propre
      const maxH = (opts.pad ? 30 : 84) + r4 * (opts.pad ? 26 : 70); // hauteur propre
      const sp = (t * speed + r1 * 3.1) % 1;                 // montée en boucle
      const rise = sp * maxH;
      const sway = Math.sin(t * (1.1 + r3) + i) * (6 + r4 * 12) * (1 - sp * 0.4);
      const x = ex + sway, y = ey - rise - 3;
      const fade = Math.sin(sp * Math.PI);
      ctx.globalAlpha = 0.8 * fade;
      ctx.fillStyle = (r2 > 0.66) ? cLite : (r2 > 0.33 ? cMid : cBase);
      if (r3 > 0.4) {
        const s = 1.6 + r4 * 4.2;                            // carré de taille aléatoire
        ctx.save(); ctx.translate(x, y); ctx.rotate(r1 * 1.2);
        ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(x, y, 0.8 + r4 * 1.6, 0, Math.PI * 2); ctx.fill();   // grain minuscule
      }
    }
    ctx.restore();
  }

  // ---- Trou de RACCOURCI : portail violet qui aspire vers le bas (salle d'en dessous)
  function drawDropPit(ctx, info, t, light) {
    if (!info) return;
    const N = info.N, E = info.E, S = info.S, W = info.W, cx = info.cx, cy = info.cy;
    const pulse = (Math.sin(t * 3) + 1) / 2;
    ctx.save();
    // trou sombre (losange creux)
    let g = ctx.createLinearGradient(N.x, N.y, S.x, S.y);
    g.addColorStop(0, "rgba(46,22,68,0.95)"); g.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = g; poly(ctx, [N, E, S, W]); ctx.fill();
    // bord violet pulsé
    ctx.globalAlpha = 0.55 + 0.35 * pulse; ctx.strokeStyle = "#b06cff"; ctx.lineWidth = 2.5;
    poly(ctx, [N, E, S, W]); ctx.stroke();
    ctx.globalAlpha = 1;
    // chevrons qui descendent (signale : on tombe vers le bas)
    ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round"; ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.8 + i * 0.34) % 1, yy = cy - 8 + ph * 32, a = Math.sin(ph * Math.PI);
      ctx.globalAlpha = 0.75 * a; ctx.strokeStyle = "#caa0ff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 11, yy); ctx.lineTo(cx, yy + 8); ctx.lineTo(cx + 11, yy); ctx.stroke();
    }
    ctx.restore();
  }

  // ---- Ombre de contact -------------------------------------------------
  function drawShadow(ctx, cx, cy, r, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, "rgba(0,0,0,0.9)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---- Héros : sphère noire 3D + lunettes orientées vers la direction ---
  // vecteurs ÉCRAN normalisés (cohérents avec le déplacement iso au clavier)
  const FACE_VEC = {
    up:    { x: -0.894, y: -0.447 },   // haut-gauche
    down:  { x:  0.894, y:  0.447 },   // bas-droite (vers la caméra)
    left:  { x: -0.894, y:  0.447 },   // bas-gauche
    right: { x:  0.894, y: -0.447 },   // haut-droite
  };
  function drawHero(ctx, cx, cy, opts) {
    const r = opts.radius;
    const sx = opts.squashX || 1, sy = opts.squashY || 1;
    const facing = opts.facing || "down";
    const fv = FACE_VEC[facing] || FACE_VEC.down;
    const shape = opts.glassesShape || "roundsquare";
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);

    function sphere() {
      const bg = ctx.createRadialGradient(-r * 0.34, -r * 0.46, r * 0.12, 0, 0, r * 1.2);
      bg.addColorStop(0, "#525252"); bg.addColorStop(0.5, "#1c1c1c"); bg.addColorStop(1, "#000");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      const tg = ctx.createRadialGradient(-fv.x * r * 0.7, -fv.y * r * 0.7, r * 0.2, -fv.x * r * 0.9, -fv.y * r * 0.9, r * 1.5);
      tg.addColorStop(0, "rgba(0,0,0,0.55)"); tg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.42, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    }

    // up (haut-gauche) & right (haut-droite) : on regarde vers le fond ->
    // la monture passe DERRIÈRE la boule, seule la branche proche repasse devant.
    if (facing === "up" || facing === "right") {
      drawGlassesOriented(ctx, r, shape, facing, "frame");   // monture (derrière)
      sphere();
      drawGlassesOriented(ctx, r, shape, facing, "temple");  // branche proche (devant)
    } else {
      sphere();
      drawGlassesOriented(ctx, r, shape, facing, "all");
    }
    ctx.restore();
  }

  // Lunettes = tracé vectoriel DESSINÉ par l'utilisateur (boule-*.svg), une
  // version par direction iso. On le plaque sur la sphère (repère du SVG ->
  // repère sphère via le centre du cercle d'origine), avec liseré + ombrage.
  //   up = haut-gauche · right = haut-droite · left = bas-gauche · down = bas-droite
  const GLASS_PATHS = {
    up:    { c: [52.5547, 47.5], d: ["M73.5547 12L102.555 43.5V58M73.5547 12L76.3047 30.25L46.3047 39L43.8047 25.25L37.5547 26.5L33.8047 41.5L2.55469 49L1.55469 28L33.8047 19L36.3047 21.5L42.5547 20.25L43.8047 17.75L73.5547 12Z", "M2.55469 30L33.0547 57.5V70"] },
    right: { c: [51.5, 47.5], d: ["M30.5 12L1.5 43.5V58M30.5 12L27.75 30.25L57.75 39L60.25 25.25L66.5 26.5L70.25 41.5L101.5 49L102.5 28L70.25 19L67.75 21.5L61.5 20.25L60.25 17.75L30.5 12Z", "M101.5 30L71 57.5V70"] },
    left:  { c: [52.555, 47.5], d: ["M7.55469 34L1.55469 36.5L2.55469 55L21.0547 58.5L22.5547 48L27.0547 49L29.5547 61.5L53.5547 65.5L57.0547 44.5M57.0547 44.5L30.5547 41L27.5547 44.5L23.5547 43.5L22.5547 39.5L1.55469 36.5M57.0547 44.5L93.0547 38.5L98.0547 44.5"] },
    down:  { c: [47.5, 47.5], d: ["M92.5 34L98.5 36.5L97.5 55L79 58.5L77.5 48L73 49L70.5 61.5L46.5 65.5L43 44.5M43 44.5L69.5 41L72.5 44.5L76.5 43.5L77.5 39.5L98.5 36.5M43 44.5L7 38.5L2 44.5"] },
  };
  const _glassP = {};
  function glassPaths(facing) {
    if (_glassP[facing]) return _glassP[facing];
    const g = GLASS_PATHS[facing] || GLASS_PATHS.down;
    return (_glassP[facing] = { c: g.c, paths: g.d.map(s => new Path2D(s)) });
  }
  function drawGlassesOriented(ctx, r, shape, facing, layer) {
    const G = glassPaths(facing), s = r / 47.5;            // 47.5 = rayon du cercle SVG
    // layer : "all" = tout · "frame" = monture (d[0]) · "temple" = branche proche (d[1])
    let paths = G.paths;
    if (layer === "frame") paths = G.paths.slice(0, 1);
    else if (layer === "temple") paths = G.paths.slice(1);
    if (!paths.length) return;
    ctx.save();
    ctx.scale(s, s); ctx.translate(-G.c[0], -G.c[1]);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(0,0,0,0.9)"; ctx.lineWidth = 7;
    paths.forEach(p => ctx.stroke(p));
    ctx.strokeStyle = "#f4f4f4"; ctx.lineWidth = 3.4;
    paths.forEach(p => ctx.stroke(p));
    ctx.strokeStyle = "rgba(170,230,255,0.5)"; ctx.lineWidth = 1.2;
    paths.forEach(p => ctx.stroke(p));
    ctx.restore();
  }

  // ---- Lunettes (héros / item / inventaire) ----------------------------
  function drawGlassesOn(ctx, ox, oy, span, shape) {
    const lensW = span * 0.42, lensH = span * 0.40, gap = span * 0.16;
    const lx = -gap / 2 - lensW / 2, rx = gap / 2 + lensW / 2;
    const rad = shape === "round" ? lensH / 2
      : shape === "square" ? lensH * 0.12
      : shape === "thin" ? lensH * 0.30 : lensH * 0.28;
    ctx.save(); ctx.translate(ox, oy); ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "#000"; ctx.lineWidth = span * 0.13;
    rr(ctx, lx - lensW / 2, -lensH / 2, lensW, lensH, rad); ctx.stroke();
    rr(ctx, rx - lensW / 2, -lensH / 2, lensW, lensH, rad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx + lensW / 2, 0); ctx.lineTo(rx - lensW / 2, 0); ctx.stroke();
    ctx.fillStyle = "rgba(10,10,14,0.5)";
    rr(ctx, lx - lensW / 2, -lensH / 2, lensW, lensH, rad); ctx.fill();
    rr(ctx, rx - lensW / 2, -lensH / 2, lensW, lensH, rad); ctx.fill();
    ctx.strokeStyle = "#f6f6f6"; ctx.lineWidth = span * (shape === "thin" ? 0.05 : 0.085);
    rr(ctx, lx - lensW / 2, -lensH / 2, lensW, lensH, rad); ctx.stroke();
    rr(ctx, rx - lensW / 2, -lensH / 2, lensW, lensH, rad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx + lensW / 2, 0); ctx.lineTo(rx - lensW / 2, 0); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx - lensW / 2, -lensH * 0.1); ctx.lineTo(lx - lensW / 2 - span * 0.14, -lensH * 0.2);
    ctx.moveTo(rx + lensW / 2, -lensH * 0.1); ctx.lineTo(rx + lensW / 2 + span * 0.14, -lensH * 0.2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = span * 0.03;
    ctx.beginPath(); ctx.moveTo(lx - lensW * 0.18, -lensH * 0.18); ctx.lineTo(lx + lensW * 0.04, -lensH * 0.32); ctx.stroke();
    ctx.restore();
  }

  // item lunettes flottant : ombre + rotation + halo si rare
  function drawGlassesItem(ctx, cx, cy, span, shape, t, rare) {
    const bob = Math.sin(t * 2.4) * 7;
    const spin = Math.cos(t * 1.6) * 0.18;
    ctx.save(); ctx.translate(cx, cy - 30 + bob);
    const col = rare ? "rgba(95,208,255," : "rgba(244,207,106,";
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, span);
    g.addColorStop(0, col + "0.35)"); g.addColorStop(1, col + "0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, span, 0, Math.PI * 2); ctx.fill();
    ctx.transform(Math.cos(spin), Math.sin(spin) * 0.25, 0, 1, 0, 0);
    drawGlassesOn(ctx, 0, 0, span, shape);
    ctx.restore();
  }

  // ---- PNJ de départ : la boule qui te donne le compagnon --------------
  function drawGiver(ctx, cx, cy, t) {
    const r = 21;
    const floatY = Math.sin(t * 1.8) * 4;
    ctx.save(); ctx.translate(cx, cy + floatY);
    const bg = ctx.createRadialGradient(-r * 0.32, -r * 0.44, r * 0.12, 0, 0, r * 1.2);
    bg.addColorStop(0, "#6b6b74"); bg.addColorStop(0.5, "#2a2a31"); bg.addColorStop(1, "#070709");
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.45; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.42, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    // yeux pixel sympas (clin d'œil)
    const px = r * 0.18, ex = r * 0.4, ey = -r * 0.02;
    ctx.fillStyle = "#f6f6f6";
    ctx.fillRect(Math.round(-ex - px), Math.round(ey - px), Math.round(px * 1.8), Math.round(px * 2.0));
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(Math.round(-ex - px * 0.3), Math.round(ey), Math.round(px * 0.9), Math.round(px * 1.0));
    ctx.fillStyle = "#f6f6f6"; ctx.fillRect(Math.round(ex - px * 0.7), Math.round(ey + px * 0.4), Math.round(px * 1.6), Math.round(px * 0.7));
    ctx.restore();
    // bulle "!" flottante au-dessus pour inviter à parler
    const by = cy - r - 22 + Math.sin(t * 3) * 3;
    ctx.save(); ctx.fillStyle = "#0c0c0c"; ctx.strokeStyle = "#f4cf6a"; ctx.lineWidth = 2;
    rr(ctx, cx - 11, by - 13, 22, 26, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f4cf6a"; ctx.font = "12px 'Press Start 2P'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("!", cx, by + 1); ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  // ---- Autre personnage (PNJ) : boule colorée, yeux pixel ---------------
  function drawNPC(ctx, cx, cy, t, color, emote) {
    const r = 20;
    const floatY = Math.sin(t * 1.7 + cx) * 4;
    ctx.save(); ctx.translate(cx, cy + floatY);
    const bg = ctx.createRadialGradient(-r * 0.32, -r * 0.44, r * 0.12, 0, 0, r * 1.2);
    bg.addColorStop(0, shade(color || "#7a6cff", 1)); bg.addColorStop(0.55, shade(color || "#7a6cff", 0.42)); bg.addColorStop(1, "#070709");
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.42, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    drawPixelEyes(ctx, r, emote || "neutral", false);
    ctx.restore();
    // bulle "?" pour signaler qu'on peut parler
    const by = cy - r - 20 + Math.sin(t * 3 + cx) * 3;
    ctx.save(); ctx.fillStyle = "#0c0c0c"; ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = 2;
    rr(ctx, cx - 10, by - 12, 20, 24, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f2f2f2"; ctx.font = "11px 'Press Start 2P'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("?", cx, by + 1); ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  // ---- Pièce / sou flottant ---------------------------------------------
  function drawCoin(ctx, cx, cy, t, light) {
    const L = Math.max(0.4, light);
    const bob = Math.sin(t * 3 + cx * 0.3) * 4;
    const sw = Math.abs(Math.cos(t * 2.4 + cx)) * 0.85 + 0.15;   // rotation sur l'axe vertical
    ctx.save(); ctx.translate(cx, cy - 22 + bob);
    // halo
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
    g.addColorStop(0, "rgba(244,207,106," + (0.3 * L) + ")"); g.addColorStop(1, "rgba(244,207,106,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    // disque
    ctx.scale(sw, 1);
    ctx.fillStyle = shade("#f4cf6a", L); ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade("#b8902f", L); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = shade("#fff3c8", L); ctx.font = "9px 'Press Start 2P'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (sw > 0.5) ctx.fillText("€", 0, 1); ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  // ---- Compagnon Rémy : yeux pixel expressifs --------------------------
  function drawRemy(ctx, cx, cy, opts) {
    const r = opts.radius, sx = opts.squashX || 1, sy = opts.squashY || 1;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);
    const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.15, 0, 0, r * 1.18);
    bg.addColorStop(0, "#565656"); bg.addColorStop(0.55, "#222"); bg.addColorStop(1, "#070707");
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.42, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    // antenne
    ctx.strokeStyle = "#eaeaea"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, -r * 1.45); ctx.stroke();
    ctx.fillStyle = "#eaeaea"; ctx.beginPath(); ctx.arc(0, -r * 1.55, r * 0.13, 0, Math.PI * 2); ctx.fill();
    drawPixelEyes(ctx, r, opts.emote || "neutral", opts.blink);
    ctx.restore();
  }

  // yeux en pixels (carrés) — rétro
  function drawPixelEyes(ctx, r, emote, blink) {
    const px = r * 0.16;                  // taille d'un "pixel"
    const ex = r * 0.42, ey = -r * 0.04;
    ctx.fillStyle = "#f6f6f6";
    const sq = (gx, gy, w, h) => ctx.fillRect(Math.round(gx - w / 2), Math.round(gy - h / 2), Math.round(w), Math.round(h));

    if (blink || emote === "blank") { sq(-ex, ey, px * 2.2, px * 0.7); sq(ex, ey, px * 2.2, px * 0.7); return; }

    function eyeOpen(x, look) {
      sq(x, ey, px * 1.8, px * 2.2);            // blanc
      ctx.fillStyle = "#0a0a0a"; sq(x + look * px * 0.4, ey + px * 0.3, px * 0.9, px * 1.1); // pupille
      ctx.fillStyle = "#f6f6f6";
    }
    function eyeHappy(x) { // ^
      ctx.fillStyle = "#f6f6f6";
      sq(x - px * 0.6, ey + px * 0.2, px * 0.7, px * 0.7);
      sq(x, ey - px * 0.4, px * 0.7, px * 0.7);
      sq(x + px * 0.6, ey + px * 0.2, px * 0.7, px * 0.7);
    }
    function eyeAngry(x, s) {
      sq(x, ey + px * 0.4, px * 1.8, px * 1.4);
      ctx.fillStyle = "#0a0a0a"; sq(x, ey + px * 0.5, px * 0.9, px * 0.8); ctx.fillStyle = "#f6f6f6";
      // sourcil
      sq(x + s * px * 0.4, ey - px * 0.8, px * 2.2, px * 0.6);
    }

    switch (emote) {
      case "happy": case "proud": eyeHappy(-ex); eyeHappy(ex); break;
      case "wink": eyeHappy(-ex); eyeOpen(ex, 0); break;
      case "smug": eyeAngry(-ex, 1); eyeAngry(ex, -1); break;
      case "sad":
        sq(-ex, ey + px * 0.6, px * 1.6, px * 1.2); sq(ex, ey + px * 0.6, px * 1.6, px * 1.2); break;
      case "surprised": sq(-ex, ey, px * 2.2, px * 2.6); sq(ex, ey, px * 2.2, px * 2.6);
        ctx.fillStyle = "#0a0a0a"; sq(-ex, ey, px, px * 1.2); sq(ex, ey, px, px * 1.2); break;
      default:
        const look = ({ left: -1, right: 1 })[emote] || 0;
        eyeOpen(-ex, look); eyeOpen(ex, look);
    }
  }

  // ---- Barre de saut chargé (pixel N&B) --------------------------------
  function drawPowerBar(ctx, cx, cy, ratio, level, max) {
    max = max || 4;
    const w = 16, h = 78, x = cx + 30, y = cy - h - 10;
    ctx.save();
    ctx.fillStyle = "#000"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    // graduations (max niveaux)
    for (let i = 1; i < max; i++) { const yy = y + h - (h * i / max); ctx.fillStyle = "#fff"; ctx.fillRect(x, yy - 1, w, 2); }
    // remplissage
    const fh = Math.max(0, Math.min(1, ratio)) * h;
    ctx.fillStyle = "#fff"; ctx.fillRect(x + 2, y + h - fh, w - 4, fh);
    // niveau
    ctx.fillStyle = "#fff"; ctx.font = "12px 'Press Start 2P'"; ctx.textAlign = "center";
    ctx.fillText(String(level), x + w / 2, y - 8);
    ctx.restore();
  }

  // ---- Photo : cadre PORTRAIT façon panneau bois (sombre, contour fin) ----
  //   opts = { hang:bool, img:HTMLImageElement|null }
  function drawPhoto(ctx, info, caption, light, locked, opts) {
    if (!info) return;
    opts = opts || {};
    const cx = info.cx, cy = info.cy, L = Math.max(0.42, light);
    const W = 84, H = 122, postH = 22;                 // portrait (plus haut que large)
    const by = opts.hang ? cy - 150 : cy - postH;      // bas du cadre
    const ty = by - H, lx = cx - W / 2;
    ctx.save(); ctx.lineJoin = "round";

    if (opts.hang) {
      ctx.strokeStyle = shade("#9c9c9c", L); ctx.lineWidth = 1.6;
      [lx + W * 0.22, lx + W * 0.78].forEach(x => { ctx.beginPath(); ctx.moveTo(cx + (x - cx) * 0.4, ty - 150); ctx.lineTo(x, ty + 2); ctx.stroke(); });
      [lx + W * 0.22, lx + W * 0.78].forEach(x => { ctx.fillStyle = shade("#d8d8d8", L); ctx.beginPath(); ctx.arc(x, ty + 2, 2.2, 0, Math.PI * 2); ctx.fill(); });
    } else {
      ctx.fillStyle = shade("#2a2a2a", L); ctx.fillRect(cx - 3.5, by, 7, cy - by);
      ctx.fillStyle = shade("#161616", L); ctx.fillRect(cx + 1, by, 2.5, cy - by);
      ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 4;
    }
    // planche bois sombre + contour blanc FIN
    ctx.fillStyle = shade("#141414", L); rr(ctx, lx, ty, W, H, 4); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = shade("#f0f0f0", L); ctx.lineWidth = 1.4; rr(ctx, lx, ty, W, H, 4); ctx.stroke();
    // image / placeholder (marge fine)
    const m = 7, ix = lx + m, iy = ty + m, iw = W - 2 * m, ih = H - 2 * m;
    if (locked) {
      ctx.fillStyle = shade("#0c0c0c", L); ctx.fillRect(ix, iy, iw, ih);
      ctx.fillStyle = shade("#666", Math.max(0.5, L)); ctx.font = "22px 'Press Start 2P'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("?", cx, iy + ih / 2); ctx.textBaseline = "alphabetic";
    } else if (opts.img && opts.img.complete && opts.img.naturalWidth) {
      ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
      const ir = opts.img.naturalWidth / opts.img.naturalHeight, fr = iw / ih;
      let dw = iw, dh = ih, ddx = ix, ddy = iy;
      if (ir > fr) { dw = ih * ir; ddx = ix - (dw - iw) / 2; } else { dh = iw / ir; ddy = iy - (dh - ih) / 2; }
      ctx.globalAlpha = L; ctx.drawImage(opts.img, ddx, ddy, dw, dh); ctx.globalAlpha = 1; ctx.restore();
      ctx.strokeStyle = shade("#000", 0.8); ctx.lineWidth = 1; ctx.strokeRect(ix, iy, iw, ih);
    } else {
      const gg = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
      gg.addColorStop(0, shade("#1c1c22", L)); gg.addColorStop(1, shade("#070708", L));
      ctx.fillStyle = gg; ctx.fillRect(ix, iy, iw, ih);
      ctx.fillStyle = shade("#7a7a7a", Math.max(0.45, L)); ctx.font = "7px 'Press Start 2P'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("PHOTO", cx, iy + ih / 2); ctx.textBaseline = "alphabetic";
    }
    // légende
    ctx.fillStyle = shade("#cfcfcf", Math.max(0.5, L)); ctx.font = "8px 'Press Start 2P'"; ctx.textAlign = "center";
    wrapText(ctx, caption || "", cx, cy + 16, 150, 11);
    ctx.restore();
  }

  // ---- Panneau : SVG dessiné (sign.svg) + alphabet secret par-dessus -----
  //   Le panneau fait face au bas-droite (dessiné ainsi), incliné vers nous.
  function drawSign(ctx, info, light, glyphword) {
    if (!info) return;
    const sg = img(ASSET.sign);
    const s = 0.34, ax = 175, ay = 346;                 // panneau plus petit
    const dx = info.cx - ax * s, dy = info.cy - ay * s;
    ctx.save();
    if (sg.complete && sg.naturalWidth) {
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 9; ctx.shadowOffsetY = 5;
      ctx.drawImage(sg, dx, dy, 334 * s, 351 * s);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    // alphabet secret : chaque lettre dans un CARRÉ uniforme, alignée par classe
    //   asc (b,l,d) = carré en bas (le haut dépasse) · desc (g,p,q) = carré en haut
    //   mid (f,j,h,t) = grande, centrée · autres = carré plein centré
    if (glyphword) {
      const word = ("" + glyphword).toLowerCase().replace(/[^a-z ]/g, "");
      const S = 42 * s, cellW = 30 * s, gap = 7 * s;
      const TALL = { b: "asc", l: "asc", d: "asc", g: "desc", p: "desc", q: "desc", f: "mid", j: "mid", h: "mid", t: "mid" };
      ctx.translate(info.cx + 4 * s, info.cy - 236 * s);     // remonté + centré sur la planche
      ctx.rotate(-0.16);
      let total = 0; for (const ch of word) total += (ch === " " ? cellW * 0.5 : cellW + gap);
      let x = -total / 2;
      for (const ch of word) {
        if (ch === " ") { x += cellW * 0.5; continue; }
        const gi = glyphImg(ch);
        if (gi.complete && gi.naturalWidth) {
          const ar = gi.naturalWidth / gi.naturalHeight, cls = TALL[ch];
          const dh = cls ? S * 1.5 : S, dw = dh * ar;
          let topY;
          if (cls === "asc") topY = S / 2 - dh;       // carré en bas, haut dépasse
          else if (cls === "desc") topY = -S / 2;     // carré en haut, bas dépasse
          else topY = -dh / 2;                        // mid + normal : centré
          ctx.drawImage(gi, x + (cellW - dw) / 2, topY, dw, dh);
        }
        x += cellW + gap;
      }
    }
    ctx.restore();
  }

  // ---- helpers ----------------------------------------------------------
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); }
  function clipPoly(ctx, pts) { ctx.save(); poly(ctx, pts); ctx.clip(); }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = (text || "").split(" "); let line = "", yy = y;
    for (const w of words) { const test = line + w + " ";
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line.trim(), x, yy); line = w + " "; yy += lh; }
      else line = test; }
    ctx.fillText(line.trim(), x, yy);
  }

  window.ISO = { HW, HH, DUNIT, project, hash };
  window.RENDER = {
    drawTile, floorGlow, drawFloorArrow, drawTeleporterTop, drawShadow, drawDropPit,
    drawHero, drawRemy, drawGiver, drawNPC, drawCoin, drawGlassesOn, drawGlassesItem, drawPixelEyes,
    drawPowerBar, drawPhoto, drawSign, drawFacingArrow, C, shade,
  };
})();
