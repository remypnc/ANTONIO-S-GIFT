/* =========================================================================
   GAME v2 — lumière abyssale, saut chargé, téléporteurs, salles par année
   ========================================================================= */
(function () {
  const D = window.GAME_DATA;
  const { project, HH, HW } = window.ISO;
  const R = window.RENDER;
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const portrait = document.getElementById("dlg-portrait");
  const pctx = portrait.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const IMAGES = {};
  let activeMapCanvas = null;
  if (D.PHOTO_PATHS) {
    Object.entries(D.PHOTO_PATHS).forEach(([id, src]) => {
      const img = new Image();
      img.src = src;
      IMAGES[id] = img;
    });
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let DPR = 1, W = 0, H = 0;
  const cam = { x: 0, y: 0 };
  let mode = "intro", overlay = null, transitioning = false;
  let lastInputT = 0, idleFired = false, fallCount = 0, lost = 0;

  const collected = new Set(), solved = new Set(), visited = new Set(), coinsGot = new Set();
  let bonusCoins = 0;                          // pièces gagnées hors tuiles (quiz)
  let coinsSpent = 0;                          // pièces dépensées chez le marchand
  let jumpMax = 4;                             // portée max du saut chargé (5 après amélioration)
  let floorTeleUnlocked = false;               // téléporteur d'étage (inventaire, touche I)
  let maxFloorReached = 0;                     // étage le plus loin atteint (dans D.ORDER)
  let finished = false;                        // jeu terminé une fois (débloque le rejouer-easter-egg)
  const roomReturn = {};                     // roomId -> {room,x,y}
  let roomId = D.START, room = null, checkpoint = null;
  let jumpUnlocked = false;                   // saut bloqué tant qu'on n'a pas parlé au guide
  let pkOn = false, pkT = 0, pkDone = false;  // parkour chronométré
  let skyDropActive = false, skyT = 0;        // atterrissage "depuis le ciel" (raccourci vers la salle d'en dessous)
  const particles = [];

  const player = {
    x: 0, y: 0, rx: 0, ry: 0, fromX: 0, fromY: 0, tx: 0, ty: 0,
    facing: "left", moving: false, mt: 0, mdur: 0.14, peak: 16, isJump: false,
    squashX: 1, squashY: 1, alpha: 1, fall: 0, falling: false, bob: 0, glasses: "roundsquare",
  };
  const remy = { x: 0, y: 0, rx: 0, ry: 0, following: false, emote: "neutral", scale: 1, blinkT: 2 };
  const giver = { x: 0, y: 0, active: false };
  const npcs = [];                            // {x,y,id,color}
  let remyName = "0x52-EMI";

  // charge
  let charging = false, chargeStart = 0, chargeLevel = 1, chargeRatio = 0;
  const CHARGE_MS = 850, TAP_MS = 150;

  function coinAvailable() { return coinsGot.size + bonusCoins - coinsSpent; }

  /* ----------------------------- ROOMS ------------------------------- */
  function loadRoom(id) {
    roomId = id; room = D.ROOMS[id];
    const oi = D.ORDER.indexOf(id); if (oi >= 0) maxFloorReached = Math.max(maxFloorReached, oi);
    pkOn = false; pkT = 0; pkDone = false;
    room._index = {};
    room.tiles.forEach(t => {
      room._index[t.x + "," + t.y] = t;
      t.press = 0;
      if (t.type === "photo" && t.photo) {
        t._img = IMAGES[t.photo];
      }
      if (t.crumble) { t._crumbleT = 0; t._fallen = false; t._shake = 0; t._sink = 0; }
      if (t.phantom) { t._discovered = false; t.reveal = 0; }
      else if (t.hidden && !t._discovered) t.reveal = 0; else t.reveal = (t.reveal == null ? 1 : t.reveal);
    });
    // nombre de voisins -> silhouette d'île flottante (centre/côtés profonds, coins courts)
    room.tiles.forEach(t => {
      let n = 0;
      if (room._index[(t.x + 1) + "," + t.y]) n++;
      if (room._index[(t.x - 1) + "," + t.y]) n++;
      if (room._index[t.x + "," + (t.y + 1)]) n++;
      if (room._index[t.x + "," + (t.y - 1)]) n++;
      t._nb = n;
    });
    // autres personnages présents dans la salle
    npcs.length = 0;
    room.tiles.forEach(t => { if (t.npc) npcs.push({ x: t.x, y: t.y, id: t.npc, color: t.npcColor || "#7a6cff", reveals: t.reveals || null, merchant: !!t.merchant, sells: t.sells || null }); });
    updateHUD();
  }
  function tileAt(x, y) { return room._index[x + "," + y]; }
  function walkable(x, y) {
    const t = tileAt(x, y);
    // décor = pas de sol ; tuile écroulée = trou ; bloc-fantôme du saut = solide seulement pendant/après le parkour ;
    // pont de retour = solide UNIQUEMENT une fois le parkour réussi ; trou de raccourci = on tombe (chute volontaire)
    return !!t && !t.decor && !t._fallen && !t.dropHole && !(t.phantom && !pkOn && !pkDone) && !(t.retBridge && !pkDone);
  }  function occupied(x, y) {
    if (giver.active && roomId === D.START && giver.x === x && giver.y === y) return true;
    for (const n of npcs) if (n.x === x && n.y === y) return true;
    return false;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener("resize", resize);

  /* ----------------------------- INPUT ------------------------------- */
  const DIRS = { up: { dx: -1, dy: 0 }, down: { dx: 1, dy: 0 }, left: { dx: 0, dy: 1 }, right: { dx: 0, dy: -1 } };
  function keyToDir(e) {
    switch (e.key) { case "ArrowUp": return "up"; case "ArrowDown": return "down"; case "ArrowLeft": return "left"; case "ArrowRight": return "right"; }
    switch (e.code) { case "KeyZ": case "KeyW": return "up"; case "KeyS": return "down"; case "KeyQ": case "KeyA": return "left"; case "KeyD": return "right"; }
    return null;
  }

  addEventListener("keydown", (e) => {
    if (mode === "intro") return;
    lastInputT = performance.now(); idleFired = false;

    if (overlay) {
      if (overlay === "photo") {
        if (mode === "gallery" && (e.key === "ArrowRight" || e.key === "ArrowDown")) { e.preventDefault(); nextExhibit(); return; }
        if (mode === "gallery" && (e.key === "ArrowLeft" || e.key === "ArrowUp")) { e.preventDefault(); prevExhibit(); return; }
        if (e.key === "Enter" || e.key === "Escape" || e.code === "Space" || e.code === "KeyE") { e.preventDefault(); closePhoto(); }
        return;
      }
      if (overlay === "dialogue" && dlg.choosing && pendingChoice) {
        let n = null;
        if (e.code.indexOf("Digit") === 0) n = +e.code.slice(5);
        if (e.code.indexOf("Numpad") === 0) n = +e.code.slice(6);
        if (n >= 1 && n <= 9) { e.preventDefault(); pendingChoice(n - 1); return; }
        return;
      }
      if (overlay === "quiz" && dlg.choosing) {
        let n = null;
        if (e.code.startsWith("Digit")) n = +e.code.slice(5);
        if (e.code.startsWith("Numpad")) n = +e.code.slice(6);
        if (n >= 1 && n <= 4) { e.preventDefault(); answerQuiz(n - 1); return; }
      }
      if (e.key === "Enter" || e.code === "Space") { e.preventDefault(); advanceDialogue(); return; }
      if (e.key === "Escape" && !dlg.choosing) { e.preventDefault(); closeDialogue(); return; }
      return;
    }
    if (transitioning || player.falling || skyDropActive) return;

    if (e.key === "i" || e.key === "I") { toggleInventory(); return; }
    if (e.code === "KeyE") { e.preventDefault(); interact(); return; }

    const dir = keyToDir(e);
    if (dir) { e.preventDefault(); if (!player.falling) player.facing = dir; return; }   // les flèches ne font QUE tourner sur place

    if (e.code === "Space") {
      e.preventDefault();
      if (e.repeat) return;
      if (!jumpUnlocked) { if (!player.moving) step(player.facing); return; }   // saut bloqué avant le guide
      if (!player.moving) { charging = true; chargeStart = performance.now(); }
    }
  });

  addEventListener("keyup", (e) => {
    if (e.code === "Space" && charging) {
      charging = false;
      const dur = performance.now() - chargeStart;
      player.squashY = 1;
      if (dur < TAP_MS) step(player.facing);
      else jump(player.facing, chargeLevel);     // utilise le niveau courant de la jauge
    }
  });

  /* --------------------------- MOVEMENT ------------------------------ */
  function startTween(tx, ty, peak, dur, isJump) {
    player.fromX = player.x; player.fromY = player.y;
    player.tx = tx; player.ty = ty; player.x = tx; player.y = ty;
    player.peak = peak; player.mdur = dur; player.isJump = isJump;
    player.moving = true; player.mt = 0; lost++;
    if (isJump) remy.hopAnim = 0.0001;          // le compagnon saute juste après nous
  }
  function step(dir) {
    if (player.moving || player.falling || overlay || transitioning) return;
    player.facing = dir; const d = DIRS[dir];
    const ent = entityAt(player.x + d.dx, player.y + d.dy);
    if (ent) { talkTo(ent); return; }                         // foncer dans qqn = lui parler
    if (room && room.gallery && !walkable(player.x + d.dx, player.y + d.dy)) return;  // pas de chute dans la galerie
    startTween(player.x + d.dx, player.y + d.dy, 16, 0.14, false);
  }
  function jump(dir, level) {
    if (player.moving || player.falling || overlay || transitioning) return;
    if (!jumpUnlocked) { step(dir); return; }                 // saut verrouillé -> simple pas
    player.facing = dir; const d = DIRS[dir];
    const ent = entityAt(player.x + d.dx, player.y + d.dy);
    if (ent) { talkTo(ent); return; }                         // qqn juste devant = lui parler
    if (room && room.gallery && !walkable(player.x + d.dx * level, player.y + d.dy * level)) { step(dir); return; }
    if (occupied(player.x + d.dx * level, player.y + d.dy * level)) return;
    startTween(player.x + d.dx * level, player.y + d.dy * level, 24 + level * 16, 0.16 + level * 0.05, true);
  }
  function onLand() {
    const t = tileAt(player.x, player.y);
    if (!t) { return; }
    if (!t.phantom && !t.crumble) checkpoint = { room: roomId, x: player.x, y: player.y };   // jamais sur un bloc fantôme / instable
    t.press = 1; spawnDust(player.x, player.y);
    if (t.crumble && !t._fallen && !(t._crumbleT > 0)) { t._crumbleT = 0.0001; remy.emote = "surprised"; toast("ÇA S'ÉCROULE ! Saute ailleurs, vite !"); }
    if (t.type === "reveal" && !pkDone) startParkour();
    if (t.pkEndZone && pkOn && !pkDone) { pkDone = true; pkT = 0; revealGroup("pkret", true); remy.emote = "proud"; toast("PROPRE ! Un chemin de retour large s'ouvre. Parle au type là-bas pour la sortie."); }
    if (t.hidden && !t._discovered) revealSecret(t);
    if (t.coin && !coinsGot.has(t.x + "," + t.y)) collectCoin(t);
    if (t.type === "glasses" && t.glasses && !collected.has(t.glasses)) collectGlasses(t);
    if (t.type === "quiz" && t.quiz && !solved.has(t.quiz)) openQuiz(t.quiz);
    if (t.type === "goal" && !visited.has("goal")) { visited.add("goal"); startEnding(); }
    saveGame();
  }
  // ---- Parkour chronométré : révèle les blocs fantômes + lance le chrono
  function revealGroup(grp, on) {
    room.tiles.forEach(x => { if (x.group === grp) { x._discovered = on; x.reveal = on ? Math.max(0.001, x.reveal || 0) : 0; if (on && x.reveal == null) x.reveal = 0.001; } });
  }
  function startParkour() {
    pkDone = false; pkOn = true; pkT = 15;
    revealGroup("pk", true);
    remy.emote = "smug"; toast("Chrono lancé ! Saute jusqu'à l'île d'en face AVANT la fin, ou tu tombes.");
  }
  function failParkour() {
    pkOn = false; pkT = 0;
    revealGroup("pk", false);
    remy.emote = "blank"; toast("Trop lent ! Les blocs s'effacent. Recommence à la case rouge.");
    const here = tileAt(player.x, player.y);
    if (!player.moving && here && here.phantom) startFall(player.x, player.y);
  }
  function collectCoin(t) {
    coinsGot.add(t.x + "," + t.y); spawnSparkle(t.x, t.y, "#f4cf6a"); spawnCoinPop(t.x, t.y);
    toast("+1 sou. La pièce est sortie du sol. Tu t'enrichis. Doucement.", "gold"); updateHUD();
  }

  function revealSecret(t) {
    const grp = t.group;
    const affected = grp ? room.tiles.filter(x => x.group === grp) : [t];
    affected.forEach(x => { x._discovered = true; if (x.reveal == null || x.reveal > 0) x.reveal = 0; });
    spawnSparkle(t.x, t.y, "#b98cff");
    if (!visited.has("secretmsg")) { visited.add("secretmsg"); toast("WESH. Une plateforme cachée. Ok Sherlock."); }
  }

  function startFall(tx, ty) {
    const dt = tileAt(tx, ty);
    if (dt && dt.dropHole && dt.dropTo) player._dropTo = dt.dropTo;   // trou de raccourci -> salle d'en dessous
    player.falling = true; player.fall = 0;
    player.fromX = player.x; player.fromY = player.y; player.x = tx; player.y = ty;
  }
  // RACCOURCI : on tombe dans un trou -> on "retombe du ciel" dans la salle d'en dessous (pas de remontée)
  function skyDropTo(toRoom) {
    const f = $("fade");
    loadRoom(toRoom);
    const land = room.tiles.find(t => t.type === "dropLand");
    const lx = land ? land.x : room.spawn.x, ly = land ? land.y : room.spawn.y;
    player.x = player.rx = player.fromX = lx; player.y = player.ry = player.fromY = ly;
    player.facing = "down"; player.moving = false; player.falling = false; player.fall = 0;
    player.alpha = 1; player.hop = 0; player._fellHandled = false;
    remy.rx = lx + 0.3; remy.ry = ly + 0.3; remy.x = lx; remy.y = ly;
    checkpoint = { room: toRoom, x: lx, y: ly };
    cam.x = project(lx, ly).x; cam.y = project(lx, ly).y;
    skyT = 0; skyDropActive = true; player._skyY = 700;
    f.style.opacity = 0;
    remy.emote = "surprised";
    setTimeout(() => toast("Raccourci ! Tu retombes dans " + (room.title || toRoom) + "."), 400);
    lost = 0; saveGame();
  }
  function respawn() {
    fallCount++;
    if (!checkpoint || !D.ROOMS[checkpoint.room]) checkpoint = { room: roomId, x: room.spawn.x, y: room.spawn.y };
    if (checkpoint.room !== roomId) loadRoom(checkpoint.room);
    else if (room) room.tiles.forEach(t => { if (t.crumble) { t._crumbleT = 0; t._fallen = false; t._shake = 0; t._sink = 0; } });
    player.x = player.rx = player.fromX = checkpoint.x;
    player.y = player.ry = player.fromY = checkpoint.y;
    player.falling = false; player.fall = 0; player.alpha = 1;
    player.moving = false; player.hop = 0; player.peak = 0; player._fellHandled = false;
    remy.rx = player.rx + 0.3; remy.ry = player.ry + 0.3;
    remy.x = player.x; remy.y = player.y;
    cam.x = project(player.rx, player.ry).x; cam.y = project(player.rx, player.ry).y;
    updateHUD(); saveGame();
  }
  let voidFalls = 0;
  function fallSequence() {
    remy.emote = "smug";
    if (room && room.voidtrap) {
      voidFalls++;
      if (voidFalls % 3 === 0) {
        askChoice("remy", "C'est bon, tu me crois maintenant ? Y'a RIEN ici. On fait quoi ?",
          ["Rester et retomber (lol)", "Revenir au téléporteur d'avant"], (i) => {
            if (i === 1) { const r = roomReturn[roomId]; if (r) goRoom(r.room, r.x, r.y); else goRoom("egg2", null, null); }
            else toast("Ok. Continue de tomber, champion. On en reparle dans 3 chutes.");
          });
        return;
      }
      toast(["Tu tombes. Encore. Sur le SEUL bloc du vide.", "Y'a rien. Je te jure qu'y'a rien.", "Tu fais exprès là."][voidFalls % 3]);
      return;
    }
    const line = (fallCount === 5) ? D.FALL_5X : D.FALL_LINES[Math.floor(Math.random() * D.FALL_LINES.length)];
    toast(line);
  }

  function setCheckpoint(t) {
    if (checkpoint && checkpoint.room === roomId && checkpoint.x === t.x && checkpoint.y === t.y) return;
    checkpoint = { room: roomId, x: t.x, y: t.y };
    spawnRing(t.x, t.y);
  }

  /* -------------------------- INTERACTION ---------------------------- */
  function interactTarget() {
    if (giver.active && roomId === D.START && !remy.following &&
        Math.abs(giver.x - player.x) + Math.abs(giver.y - player.y) <= 1) return { kind: "giver" };
    const here = tileAt(player.x, player.y);
    // une case avec une cible `to` est un téléporteur — même si c'est aussi l'entrée (case de départ)
    if (here && here.to && !(here.needFinished && !finished)) return { kind: "teleport", tile: here };
    if (here && here.type === "teleport" && !(here.needFinished && !finished)) return { kind: "teleport", tile: here };
    if (here && here.type === "entry" && roomReturn[roomId] && !(room && room.voidtrap)) return { kind: "return", tile: here };
    for (const n of npcs) { if (Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1) return { kind: "npc", npc: n }; }
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0, -2], [0, -3]]) {
      const t = tileAt(player.x + dx, player.y + dy);
      if (t && t.type === "photo") return { kind: "photo", tile: t };
    }
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = tileAt(player.x + dx, player.y + dy);
      if (t && t.type === "panel") return { kind: "panel", tile: t };
    }
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = tileAt(player.x + dx, player.y + dy);
      if (t && t.type === "glassdisp") return { kind: "glassdisp", tile: t };
    }
    return null;
  }
  function interact() {
    if (player.moving) return;
    const g = interactTarget(); if (!g) return;
    if (g.kind === "giver") meetGiver();
    else if (g.kind === "npc") { if (g.npc.merchant) { openShop(g.npc); } else { if (g.npc.reveals) { revealGroup(g.npc.reveals, true); toast("Sortie ouverte ! Le téléporteur vient d'apparaître."); } talkNpc(g.npc.id); } }
    else if (g.kind === "panel") {
      if (!remy.following) { toast("Sans guide, ces panneaux ? Du charabia crypté. Retrouve 0x52-EMI d'abord.", "sys"); }
      else openPanel(g.tile.panel);
    }
    else if (g.kind === "photo") openPhoto(g.tile);
    else if (g.kind === "glassdisp") { const gl = D.GLASSES[g.tile.glasses]; toast(collected.has(g.tile.glasses) ? (gl.name + " — débloquée. " + gl.pickup) : (gl.name + " — pas encore débloquée. Faut fouiller mieux."), collected.has(g.tile.glasses) ? "gold" : "sys"); }
    else if (g.kind === "teleport") useTeleport(g.tile);
    else if (g.kind === "return") { const r = roomReturn[roomId]; goRoom(r.room, r.x, r.y); }
  }
  function meetGiver() {
    runDialogue(D.DIALOGUE.meet_giver, () => {
      spawnSparkle(giver.x, giver.y, "#f4cf6a");
      giver.active = false;
      remy.following = true;
      remy.x = remy.rx = player.x; remy.y = remy.ry = player.y;
      saveGame();
      runDialogue(D.DIALOGUE.meet_remy);
    });
  }
  // entité (PNJ / donneur) occupant une case
  function entityAt(x, y) {
    if (giver.active && roomId === D.START && giver.x === x && giver.y === y) return { kind: "giver" };
    for (const n of npcs) if (n.x === x && n.y === y) return { kind: "npc", npc: n };
    return null;
  }
  // parler en FONÇANT dans quelqu'un (espace / flèche vers lui)
  function talkTo(ent) {
    if (overlay || transitioning) return;
    if (ent.kind === "giver") { if (!remy.following) meetGiver(); }
    else if (ent.kind === "npc") { if (ent.npc.merchant) openShop(ent.npc); else talkNpc(ent.npc.id); }
  }
  // parler à un habitant : dialogue + (1ère fois) une petite récompense en pièces
  function talkNpc(id) {
    const lines = (D.NPCS[id] || [{ speaker: "npc2", emote: "neutral", t: "..." }]).slice();
    const key = "npc:" + id;
    if (!visited.has(key)) {
      visited.add(key); bonusCoins += 2; updateHUD(); saveGame();
      lines.push({ speaker: "npc2", emote: "wink", t: "Tiens, +2 pièces pour la route. Raconte pas que je suis radin." });
    }
    runDialogue(lines);
  }

  // ---- MARCHAND : échange tes pièces contre une paire de lunettes, un saut +1, ou le téléporteur d'étage
  const SHOP_PRICE = { glass: 4, jump: 6, tele: 5 };
  function openShop(npc) {
    const avail = coinAvailable();
    const items = [];
    if (npc.sells && !collected.has(npc.sells)) items.push({ key: "glass", label: D.GLASSES[npc.sells].name + " — " + SHOP_PRICE.glass + "€", price: SHOP_PRICE.glass, glass: npc.sells });
    if (jumpMax < 5) items.push({ key: "jump", label: "Saut AMÉLIORÉ · 5 cases — " + SHOP_PRICE.jump + "€", price: SHOP_PRICE.jump });
    if (!floorTeleUnlocked) items.push({ key: "tele", label: "Téléporteur d'étage (touche I) — " + SHOP_PRICE.tele + "€", price: SHOP_PRICE.tele });
    const opts = items.map(it => it.label + (avail < it.price ? "  ✗" : ""));
    opts.push("Rien, merci");
    const intro = items.length ? ("Marchand du musée. T'as " + avail + "€. Je te sors quoi ?")
      : ("J'ai plus rien pour toi — t'as déjà tout raflé. (" + avail + "€)");
    askChoice("npc2", intro, opts, (i) => {
      if (i >= items.length) return;                       // « Rien, merci »
      const it = items[i];
      if (coinAvailable() < it.price) { remy.emote = "smug"; toast("Pas assez de sous. Reviens plus riche, gros.", "sys"); return; }
      coinsSpent += it.price; updateHUD();
      if (it.key === "glass") { collected.add(it.glass); player.glasses = D.GLASSES[it.glass].shape; spawnSparkle(player.x, player.y, "#f4cf6a"); toast(D.GLASSES[it.glass].name + " achetée ! Elle disparaît de la salle.", "gold"); }
      else if (it.key === "jump") { jumpMax = 5; toast("Saut amélioré : tu peux viser 5 cases maintenant.", "gold"); }
      else if (it.key === "tele") { floorTeleUnlocked = true; toast("Téléporteur d'étage débloqué ! Ouvre l'inventaire (I).", "gold"); }
      updateHUD(); saveGame();
      setTimeout(() => openShop(npc), 320);                // ré-ouvre la boutique
    });
  }
  function floorLabel(rid) { return rid === "final" ? "FIN" : rid; }
  function warpToFloor(rid) { if (rid === roomId) return; goRoom(rid, null, null); }

  /* ----------------------------- PHOTO ------------------------------- */
  function openPhoto(tile) {
    overlay = "photo";
    const cap = $("photo-cap"), yr = $("photo-year");
    yr.textContent = room ? (room.title || ("Année " + room.year)) : "";
    cap.textContent = tile.caption || "";
    const frame = $("photo-frame");
    frame.classList.toggle("locked", !!tile.locked);
    frame.innerHTML = "";
    if (tile.locked) {
      frame.textContent = "?";
    } else if (tile.photo === "map") {
      const canvasEl = document.createElement("canvas");
      canvasEl.width = 560;
      canvasEl.height = 420;
      canvasEl.style.width = "100%";
      canvasEl.style.height = "100%";
      frame.appendChild(canvasEl);
      activeMapCanvas = canvasEl;
      drawMapOnCanvas(canvasEl);
    } else if (tile._img) {
      const imgEl = document.createElement("img");
      imgEl.src = tile._img.src;
      frame.appendChild(imgEl);
    } else {
      frame.textContent = "PHOTO";
    }
    $("photoview").classList.add("show");
    document.body.classList.add("dlg-open");
  }
  function closePhoto() {
    $("photoview").classList.remove("show"); overlay = null;
    document.body.classList.remove("dlg-open");
    activeMapCanvas = null;
  }

  function drawMapOnCanvas(canvasEl) {
    const ctx = canvasEl.getContext("2d");
    const W = canvasEl.width;
    const H = canvasEl.height;
    
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#08080c");
    grad.addColorStop(1, "#12121c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    
    // Draw some stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 40; i++) {
      const sx = Math.sin(i * 9.9) * 0.5 + 0.5;
      const x = (Math.cos(i * 12.7) * 0.5 + 0.5) * W;
      const y = (Math.sin(i * 24.3) * 0.5 + 0.5) * H;
      ctx.globalAlpha = 0.15 + 0.45 * sx;
      ctx.fillRect(x, y, sx > 0.6 ? 2 : 1, sx > 0.6 ? 2 : 1);
    }
    ctx.globalAlpha = 1.0;
    
    // Nodes for each room
    const mapNodes = [
      { id: "hub", label: "HUB", x: 70, y: 340, desc: "Départ" },
      { id: "2019", label: "2019", x: 130, y: 260, desc: "Saut" },
      { id: "2020", label: "2020", x: 190, y: 320, desc: "Énigme" },
      { id: "2021", label: "2021", x: 270, y: 280, desc: "Bug" },
      { id: "2022", label: "2022", x: 330, y: 200, desc: "Maxime" },
      { id: "2023", label: "2023", x: 380, y: 270, desc: "Fac" },
      { id: "2024", label: "2024", x: 440, y: 190, desc: "Pic style" },
      { id: "2025", label: "2025", x: 490, y: 110, desc: "Theniou" },
      { id: "final", label: "FINAL", x: 390, y: 70, desc: "Anniv" },
      { id: "gallery", label: "GALERIE", x: 230, y: 110, desc: "Souvenirs" }
    ];
    
    const connections = [
      ["hub", "2019"],
      ["2019", "2020"],
      ["2020", "2021"],
      ["2021", "2022"],
      ["2022", "2023"],
      ["2023", "2024"],
      ["2024", "2025"],
      ["2025", "final"],
      ["final", "gallery"],
      ["gallery", "hub"]
    ];
    
    // Check if node is visited
    const isVisited = (nodeId) => {
      if (nodeId === "hub") return true;
      if (nodeId === "gallery") return !!finished || roomId === "gallery";
      const idx = D.ORDER.indexOf(nodeId);
      if (idx >= 0) return idx <= maxFloorReached;
      return false;
    };
    
    // Draw connections
    connections.forEach(([n1, n2]) => {
      const node1 = mapNodes.find(n => n.id === n1);
      const node2 = mapNodes.find(n => n.id === n2);
      if (!node1 || !node2) return;
      
      const v1 = isVisited(n1);
      const v2 = isVisited(n2);
      const active = v1 && v2;
      
      ctx.lineWidth = active ? 4 : 2;
      ctx.strokeStyle = active ? "#5fd0ff" : "#2d2d3a";
      
      if (active) {
        ctx.shadowColor = "#5fd0ff";
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(node2.x, node2.y);
      ctx.stroke();
      
      // Draw small arrow along the connection
      if (active) {
        const mx = (node1.x + node2.x) / 2;
        const my = (node1.y + node2.y) / 2;
        const angle = Math.atan2(node2.y - node1.y, node2.x - node1.x);
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);
        ctx.fillStyle = "#5fd0ff";
        ctx.beginPath();
        ctx.moveTo(-5, -4);
        ctx.lineTo(5, 0);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
    
    ctx.shadowBlur = 0; // reset shadow
    
    // Draw nodes
    mapNodes.forEach(node => {
      const visited = isVisited(node.id);
      const current = node.id === roomId;
      
      const cx = node.x;
      const cy = node.y;
      const hw = 22;
      const hh = 11;
      
      // Left side face
      ctx.fillStyle = visited ? (current ? "#1b4d66" : "#2b3b4f") : "#1b1b24";
      ctx.beginPath();
      ctx.moveTo(cx - hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx, cy + hh + 10);
      ctx.lineTo(cx - hw, cy + 10);
      ctx.closePath();
      ctx.fill();
      
      // Right side face
      ctx.fillStyle = visited ? (current ? "#0f2f40" : "#1a2533") : "#0f0f15";
      ctx.beginPath();
      ctx.moveTo(cx, cy + hh);
      ctx.lineTo(cx + hw, cy);
      ctx.lineTo(cx + hw, cy + 10);
      ctx.lineTo(cx, cy + hh + 10);
      ctx.closePath();
      ctx.fill();
      
      // Top face
      if (current) {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#5fd0ff";
        ctx.shadowBlur = 12;
      } else if (visited) {
        ctx.fillStyle = "#5fd0ff";
        ctx.shadowColor = "#5fd0ff";
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = "#474757";
        ctx.shadowBlur = 0;
      }
      
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx + hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx - hw, cy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow
      
      // Node label
      ctx.font = "8px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.fillStyle = current ? "#ffffff" : (visited ? "#5fd0ff" : "#5a5a6a");
      ctx.fillText(node.label, cx, cy - 18);
      
      // Under-label descriptor
      ctx.font = "14px 'VT323'";
      ctx.fillStyle = current ? "#f4cf6a" : (visited ? "#cfcfdf" : "#444454");
      ctx.fillText(node.desc, cx, cy + 28);
      
      // If current room, draw a small bounce marker above the node
      if (current) {
        const bounce = Math.sin(performance.now() * 0.008) * 3 - 6;
        ctx.fillStyle = "#f4cf6a";
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 26 + bounce);
        ctx.lineTo(cx + 4, cy - 26 + bounce);
        ctx.lineTo(cx, cy - 20 + bounce);
        ctx.closePath();
        ctx.fill();
      }
      
      // If visited but not current, draw a tiny checkmark or glow dot
      if (visited && !current && node.id !== "hub" && node.id !== "gallery") {
        ctx.fillStyle = "#f4cf6a";
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Title inside map
    ctx.font = "12px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillStyle = "#f4cf6a";
    ctx.fillText("CARTE DU MUSEE", 30, 40);
    
    ctx.font = "16px 'VT323'";
    ctx.fillStyle = "#8a8a9a";
    const visitedCount = mapNodes.filter(n => isVisited(n.id)).length;
    ctx.fillText("Progression : " + visitedCount + " / " + mapNodes.length + " zones foulées", 30, 60);
  }

  function useTeleport(t) {
    if (t.needFinished && !finished) return;
    if (t.needTalk && !visited.has("npc:clochard")) { remy.emote = "neutral"; toast("Le gardien doit t'ouvrir la sortie. Parle-lui d'abord (E)."); return; }
    if (mode === "gallery" && t.to === "hub") {                    // sortie de la galerie -> hub
      $("gallery-nav").classList.remove("show"); overlay = null; mode = "play"; goRoom("hub"); return;
    }
    if (t.to === "gallery") { enterGallery(); return; }            // retour à la galerie des souvenirs
    if (t.needCompanion && !remy.following && !finished) { toast("Téléporteur endormi. Parle d'abord au guide pour le réveiller."); return; }
    const okCount = !t.need || collected.size >= t.need;
    const okGlass = !t.needGlasses || collected.has(t.needGlasses);
    if (!okCount || !okGlass) { remy.emote = "smug"; runDialogue(D.DIALOGUE.teleport_locked); return; }
    roomReturn[t.to] = { room: roomId, x: t.x, y: t.y };
    goRoom(t.to, null, null);
  }
  function goRoom(id, sx, sy) {
    irisTo(() => {
      loadRoom(id);
      const s = (sx != null) ? { x: sx, y: sy } : room.spawn;
      player.x = player.rx = player.fromX = s.x;
      player.y = player.ry = player.fromY = s.y;
      remy.rx = s.x + 0.3; remy.ry = s.y + 0.3; remy.x = s.x; remy.y = s.y;
      checkpoint = { room: id, x: s.x, y: s.y };
      cam.x = project(s.x, s.y).x; cam.y = project(s.x, s.y).y;
      lost = 0;
      toast(room.title); saveGame();
    });
  }

  function openPanel(id) {
    const p = D.PANELS[id]; if (!p) return;
    const q = [];
    if (p.crypt) { q.push({ speaker: "sign", emote: null, t: p.cryptLabel }); p.lines.forEach((l, i) => q.push({ speaker: "remy", emote: i === 0 ? "smug" : "neutral", t: l })); }
    else p.lines.forEach(l => q.push({ speaker: p.speaker, emote: "neutral", t: l }));
    // certaines lectures DÉBLOQUENT une compétence (tutoriel structuré)
    if (p.unlock === "jump" && !jumpUnlocked) {
      q.push({ speaker: "remy", emote: "proud", t: "Compétence débloquée : SAUT CHARGÉ. Maintiens ESPACE, lâche au bon moment." });
    }
    runDialogue(q, () => {
      if (p.unlock === "jump" && !jumpUnlocked) { jumpUnlocked = true; saveGame(); toast("Nouvelle compétence : SAUT CHARGÉ.", "gold"); }
    });
  }

  /* ----------------------------- GLASSES ----------------------------- */
  function collectGlasses(tile) {
    const g = D.GLASSES[tile.glasses];
    collected.add(tile.glasses); player.glasses = g.shape;
    spawnSparkle(tile.x, tile.y, g.rare ? "#5fd0ff" : "#f4cf6a");
    remy.emote = "surprised"; toast(g.name + " — " + g.pickup, "gold"); updateHUD();
  }
  function toggleInventory() {
    const inv = $("inventory");
    if (inv.classList.contains("show")) { inv.classList.remove("show"); return; }
    const grid = $("inv-grid"); grid.innerHTML = "";
    Object.values(D.GLASSES).forEach(g => {
      const cell = document.createElement("div");
      cell.className = "inv-cell" + (collected.has(g.id) ? "" : " locked");
      const c = document.createElement("canvas"); c.width = 120; c.height = 90;
      const cc = c.getContext("2d"); cc.translate(60, 46);
      if (collected.has(g.id)) R.drawGlassesOn(cc, 0, 0, 72, g.shape);
      else { cc.fillStyle = "#333"; cc.font = "26px 'Press Start 2P'"; cc.textAlign = "center"; cc.fillText("?", 0, 12); }
      cell.appendChild(c);
      const lab = document.createElement("div"); lab.className = "inv-label";
      lab.textContent = collected.has(g.id) ? g.name : "verrouillé"; cell.appendChild(lab);
      grid.appendChild(cell);
    });
    // section TÉLÉPORTEUR D'ÉTAGE (visible une fois débloqué chez le marchand)
    let ft = $("inv-floortele");
    if (!ft) { ft = document.createElement("div"); ft.id = "inv-floortele"; inv.insertBefore(ft, inv.querySelector(".inv-close")); }
    ft.innerHTML = "";
    if (floorTeleUnlocked) {
      const ttl = document.createElement("div"); ttl.className = "inv-ft-title"; ttl.textContent = "TÉLÉPORTEUR D'ÉTAGE"; ft.appendChild(ttl);
      const sub = document.createElement("div"); sub.className = "inv-ft-sub"; sub.textContent = "Étages déjà faits :"; ft.appendChild(sub);
      const row = document.createElement("div"); row.className = "inv-ft-row";
      D.ORDER.forEach((rid, idx) => {
        const b = document.createElement("button"); b.className = "inv-ft-btn"; b.textContent = floorLabel(rid);
        if (idx > maxFloorReached) { b.classList.add("locked"); b.disabled = true; }
        else if (rid === roomId) { b.classList.add("here"); b.disabled = true; }
        else b.onclick = () => { inv.classList.remove("show"); warpToFloor(rid); };
        row.appendChild(b);
      });
      ft.appendChild(row);
    }
    inv.classList.add("show");
  }

  /* ------------------------------- QUIZ ------------------------------ */
  let curQuiz = null;
  function openQuiz(id) {
    curQuiz = D.QUIZZES[id]; curQuiz._id = id; overlay = "quiz"; showBox();
    dlg.queue = [{ speaker: "remy", emote: "smug", t: curQuiz.intro }]; dlg.idx = -1; dlg.choosing = false;
    dlg.afterIntro = showChoices; advanceDialogue();
  }
  function showChoices() {
    dlg.choosing = true; setSpeaker("remy", "neutral"); typeLine(curQuiz.intro);   // on redonne la question à chaque fois
    const box = $("dlg-choices"); box.innerHTML = "";
    curQuiz.answers.forEach((a, i) => { const el = document.createElement("div"); el.className = "choice"; el.innerHTML = "<b>" + (i + 1) + "</b> " + a; el.onclick = () => answerQuiz(i); box.appendChild(el); });
    box.classList.add("show");
  }
  function answerQuiz(i) {
    $("dlg-choices").classList.remove("show"); dlg.choosing = false;
    if (i === curQuiz.correct) {
      if (!solved.has(curQuiz._id)) { bonusCoins += 3; }      // récompense : +3 pièces (une fois)
      solved.add(curQuiz._id); saveGame(); updateHUD();
      remy.emote = "happy"; spawnSparkle(player.x, player.y, "#f4cf6a");
      runDialogue([{ speaker: "remy", emote: "wink", t: curQuiz.good + " +3 pièces, cadeau." }]);
    }
    else { const bad = curQuiz.bad[Math.floor(Math.random() * curQuiz.bad.length)]; remy.emote = "smug"; dlg.queue = [{ speaker: "remy", emote: "smug", t: bad }]; dlg.idx = -1; dlg.afterIntro = showChoices; advanceDialogue(); }
  }

  /* ------------------------------ ENDING ----------------------------- */
  function startEnding() {
    mode = "end"; finished = true;
    runDialogue(D.DIALOGUE.ending, () => { remyName = "Rémy"; remy.scale = 1.7; runDialogue(D.DIALOGUE.reveal, showEndCard); });
  }
  // REJOUER : garde la sauvegarde (lunettes, saut), recommence au HUB sans Rémy
  function replayKeepProgress() {
    const s = loadSave() || {};
    const sp = D.ROOMS.hub.spawn;
    Object.assign(s, {
      roomId: "hub", px: sp.x, py: sp.y, facing: "up",
      following: false, giverActive: false, finished: true, jumpUnlocked: true,
      collected: [...collected], solved: [...solved], visited: [...visited], coinsGot: [...coinsGot],
      bonusCoins, fallCount, remyName, remyScale: 1, checkpoint: { room: "hub", x: sp.x, y: sp.y },
      coinsSpent, jumpMax, floorTeleUnlocked, maxFloorReached,
    });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {}
    location.reload();
  }
  function showEndCard() {
    $("end-complete").textContent = "Lunettes : " + collected.size + "/" + Object.keys(D.GLASSES).length + "   ·   Chutes : " + fallCount;
    $("endcard").classList.add("show");
  }

  /* ------------------------------ GALERIE ---------------------------- */
  let galIdx = -1;
  function enterGallery() {
    $("endcard").classList.remove("show");
    overlay = null; transitioning = false; mode = "gallery";
    giver.active = false; remy.following = true; remy.scale = 1; remy.emote = "happy";
    loadRoom("gallery");
    const sp = room.spawn;
    player.x = player.rx = player.fromX = sp.x; player.y = player.ry = player.fromY = sp.y;
    player.facing = "down"; player.moving = false; player.falling = false; player.alpha = 1;
    remy.x = remy.rx = sp.x; remy.y = remy.ry = sp.y;
    cam.x = project(sp.x, sp.y).x; cam.y = project(sp.x, sp.y).y;
    jumpUnlocked = true; lost = 0; galIdx = -1;
    $("gallery-nav").classList.add("show");
    $("gal-label").textContent = room.title;
    lastInputT = performance.now();
    setTimeout(() => toast("Balade-toi : flèches pour viser, espace pour avancer. Ou SUIVANT pour défiler les souvenirs."), 500);
  }
  function exitGallery() {
    $("gallery-nav").classList.remove("show");
    overlay = null; mode = "end";
    $("photoview").classList.remove("show"); document.body.classList.remove("dlg-open");
    showEndCard();
  }
  function goToExhibit(i) {
    if (!room || !room.exhibits || !room.exhibits.length) return;
    galIdx = clamp(i, 0, room.exhibits.length - 1);
    const ex = room.exhibits[galIdx];
    // place le joueur sur la tuile d'observation, face à l'expo
    player.x = player.rx = player.fromX = ex.view[0]; player.y = player.ry = player.fromY = ex.view[1];
    player.moving = false; player.falling = false;
    // oriente vers la tuile de l'expo
    const dx = ex.tile[0] - ex.view[0], dy = ex.tile[1] - ex.view[1];
    player.facing = dy < 0 ? "right" : dy > 0 ? "left" : dx < 0 ? "up" : "down";
    remy.x = remy.rx = ex.view[0]; remy.y = remy.ry = ex.view[1] + 0.4;
    cam.x = project(player.rx, player.ry).x; cam.y = project(player.rx, player.ry).y;
    $("gal-label").textContent = ex.caption || room.title;
    if (ex.kind === "exit") { toast("Au bout du chemin : un téléporteur de retour vers la salle principale. Monte dessus + E."); }
    else if (ex.kind === "glass") { const gl = D.GLASSES[ex.glasses]; toast(collected.has(ex.glasses) ? (gl.name + " — débloquée.") : (gl.name + " — pas débloquée."), collected.has(ex.glasses) ? "gold" : "sys"); }
    else openPhoto({ caption: ex.caption, locked: false, _img: IMAGES[ex.photo], photo: ex.photo });
  }
  function nextExhibit() { goToExhibit(galIdx + 1 >= room.exhibits.length ? 0 : galIdx + 1); }
  function prevExhibit() { goToExhibit(galIdx - 1 < 0 ? room.exhibits.length - 1 : galIdx - 1); }

  /* --------------------------- DIALOGUE ------------------------------ */
  const dlg = { queue: [], idx: 0, text: "", shown: 0, speed: 22, lastChar: 0, done: false, choosing: false, onDone: null, afterIntro: null, speaker: "remy" };
  function runDialogue(lines, onDone) { overlay = "dialogue"; showBox(); dlg.queue = lines.slice(); dlg.idx = -1; dlg.onDone = onDone || null; dlg.afterIntro = null; dlg.choosing = false; pendingChoice = null; $("dlg-choices").classList.remove("show"); advanceDialogue(); }
  // choix générique (1/2/...) lu par un PNJ — clic ou touche chiffre
  let pendingChoice = null;
  function askChoice(speaker, text, opts, onPick) {
    overlay = "dialogue"; showBox(); dlg.queue = []; dlg.idx = 0; dlg.onDone = null; dlg.afterIntro = null;
    setSpeaker(speaker, "neutral"); typeLine(text); dlg.shown = text.length; dlg.done = true; renderDlg();
    dlg.choosing = true; pendingChoice = (i) => { pendingChoice = null; dlg.choosing = false; $("dlg-choices").classList.remove("show"); $("dialogue").classList.remove("show"); overlay = null; onPick(i); };
    const box = $("dlg-choices"); box.innerHTML = "";
    opts.forEach((o, i) => { const el = document.createElement("div"); el.className = "choice"; el.innerHTML = "<b>" + (i + 1) + "</b> " + o; el.onclick = () => pendingChoice && pendingChoice(i); box.appendChild(el); });
    box.classList.add("show");
  }
  function showBox() { $("dialogue").classList.add("show"); }
  function closeDialogue() { $("dialogue").classList.remove("show"); $("dlg-choices").classList.remove("show"); overlay = null; const cb = dlg.onDone; dlg.onDone = null; if (cb) cb(); }
  function setSpeaker(sp, emote) { dlg.speaker = sp; dlg.emote = emote || "neutral"; if (sp === "remy") { remy.emote = emote || "neutral"; $("dlg-name").textContent = remyName; } else if (sp === "admin") { $("dlg-name").textContent = "L'ADMIN"; } else if (sp === "npc") { $("dlg-name").textContent = "???"; } else if (sp === "npc2") { $("dlg-name").textContent = "Inconnu"; } else $("dlg-name").textContent = "Panneau"; }
  function typeLine(t) { dlg.text = t; dlg.shown = 0; dlg.done = false; dlg.lastChar = performance.now(); }
  function advanceDialogue() {
    if (!dlg.done && dlg.idx >= 0 && !dlg.choosing) { dlg.shown = dlg.text.length; dlg.done = true; renderDlg(); return; }
    if (dlg.choosing) return;
    dlg.idx++;
    if (dlg.idx >= dlg.queue.length) { if (dlg.afterIntro) { const f = dlg.afterIntro; dlg.afterIntro = null; f(); return; } closeDialogue(); return; }
    const line = dlg.queue[dlg.idx]; setSpeaker(line.speaker, line.emote); typeLine(line.t);
  }
  function renderDlg() {
    const el = $("dlg-text"); el.textContent = dlg.text.slice(0, dlg.shown);
    el.classList.toggle("crypt", dlg.speaker === "sign");
    $("dlg-arrow").style.opacity = (dlg.done && !dlg.choosing) ? 1 : 0;
  }
  function updateDialogue(now) {
    if (overlay !== "dialogue" && overlay !== "quiz") return;
    if (dlg.idx < 0 || dlg.done) { renderDlg(); return; }
    while (now - dlg.lastChar > dlg.speed && dlg.shown < dlg.text.length) {
      dlg.shown++; dlg.lastChar += dlg.speed; const c = dlg.text[dlg.shown - 1];
      if (".!?,".includes(c)) dlg.lastChar += dlg.speed * 4;
    }
    if (dlg.shown >= dlg.text.length) dlg.done = true; renderDlg();
  }

  /* --------------------------- TRANSITION ---------------------------- */
  function irisTo(swap) {
    transitioning = true; const fx = $("iris"); fx.style.display = "block";
    let t = 0;
    const close = () => { t += 0.05; const r = Math.max(0, (1 - t) * 95); fx.style.background = "radial-gradient(circle at 50% 50%, transparent " + r + "%, #000 " + (r + 1) + "%)"; if (t < 1) requestAnimationFrame(close); else { swap(); t = 0; requestAnimationFrame(open); } };
    const open = () => { t += 0.05; const r = t * 95; fx.style.background = "radial-gradient(circle at 50% 50%, transparent " + r + "%, #000 " + (r + 1) + "%)"; if (t < 1) requestAnimationFrame(open); else { fx.style.display = "none"; transitioning = false; } };
    close();
  }

  /* --------------------------- PARTICLES ----------------------------- */
  function foot(gx, gy) { const p = project(gx, gy); return { x: p.x, y: p.y + HH }; }
  function spawnDust(gx, gy) { const f = foot(gx, gy); for (let i = 0; i < 7; i++) { const a = Math.random() * Math.PI * 2, s = 10 + Math.random() * 20; particles.push({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.4 - 6, life: 0, max: 0.4, c: "#d8d8d8", r: 2 + Math.random() * 2 }); } }
  function spawnSparkle(gx, gy, col) { const f = foot(gx, gy); for (let i = 0; i < 20; i++) { const a = Math.random() * Math.PI * 2, s = 24 + Math.random() * 60; particles.push({ x: f.x, y: f.y - 26, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 24, life: 0, max: 0.8, c: col || "#f4cf6a", r: 1.5 + Math.random() * 2.5, g: 70 }); } }
  function spawnRing(gx, gy) { const f = foot(gx, gy); particles.push({ ring: true, x: f.x, y: f.y, life: 0, max: 0.8, c: "#fff" }); }
  // pièce qui SORT du sol (la lueur jaune devient une pièce qui jaillit)
  function spawnCoinPop(gx, gy) { const f = foot(gx, gy); particles.push({ coinpop: true, x: f.x, y0: f.y - 6, rise: 46, life: 0, max: 0.9 }); }
  function updateParticles(dt) { for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life += dt; if (p.life >= p.max) { particles.splice(i, 1); continue; } if (!p.ring && !p.coinpop) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 30) * dt; } } }
  function drawParticles(t) {
    for (const p of particles) { const k = 1 - p.life / p.max;
      if (p.ring) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5); ctx.strokeStyle = "rgba(255,255,255," + k + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, (1 - k) * 80, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      else if (p.coinpop) { const e = p.life / p.max, up = Math.sin(Math.min(1, e * 1.3) * Math.PI * 0.5); ctx.save(); ctx.globalAlpha = Math.min(1, (1 - e) * 1.6); R.drawCoin(ctx, p.x, p.y0 - p.rise * up, (t || 0) + p.life * 6, 1); ctx.restore(); }
      else { ctx.globalAlpha = k; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } }
  }

  /* ----------------------------- HUD --------------------------------- */
  function updateHUD() {
    const tt = $("title-text"); if (tt) tt.textContent = room ? room.title : "";
    const mf = $("mm-floor"); if (mf) mf.textContent = room ? ("ÉTAGE · " + (room.year ? room.year : "???")) : "";
    $("hud-glasses").textContent = collected.size + "/" + Object.keys(D.GLASSES).length;
    const c = $("hud-coins"); if (c) c.textContent = coinAvailable();
  }
  // minimap vue de dessus (haut-droite)
  const mmCanvas = $("minimap"), mmx = mmCanvas && mmCanvas.getContext("2d");
  function drawMinimap() {
    if (!mmx || !room) return;
    const W = mmCanvas.width, H = mmCanvas.height; mmx.clearRect(0, 0, W, H);
    const ts = room.tiles.filter(t => (!t.decor || t.dropHole) && !(t.hidden && !t._discovered));
    if (!ts.length) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const t of ts) { x0 = Math.min(x0, t.x); y0 = Math.min(y0, t.y); x1 = Math.max(x1, t.x); y1 = Math.max(y1, t.y); }
    const gw = x1 - x0 + 1, gh = y1 - y0 + 1, pad = 8;
    const cell = Math.max(2, Math.min((W - pad * 2) / gw, (H - pad * 2) / gh));
    const ox = (W - gw * cell) / 2, oy = (H - gh * cell) / 2;
    const px = (gx) => ox + (gx - x0) * cell, py = (gy) => oy + (gy - y0) * cell;
    for (const t of ts) {
      let col = "#3a3a3e";
      if ((t.type === "teleport" || t.to) && !(t.needFinished && !finished)) col = "#5fd0ff"; else if (t.type === "reveal") col = "#e0564f";
      else if (t.dropHole) col = "#b06cff";
      else if (t.type === "goal") col = "#f4cf6a"; else if (t.type === "panel") col = "#7a7a82";
      else if (t.type === "glasses" && !collected.has(t.glasses)) col = "#b98cff";
      else if (t.coin && !coinsGot.has(t.x + "," + t.y)) col = "#caa23a";
      else if (t.npc) col = "#8c96ff";
      mmx.fillStyle = col; mmx.fillRect(px(t.x), py(t.y), Math.ceil(cell - 0.5), Math.ceil(cell - 0.5));
    }
    // joueur
    mmx.fillStyle = "#fff";
    mmx.fillRect(px(Math.round(player.rx)) - 0.5, py(Math.round(player.ry)) - 0.5, Math.ceil(cell) + 1, Math.ceil(cell) + 1);
  }
  let toastT = 0;
  const toastFace = $("toast-face"), tfx = toastFace.getContext("2d");
  // Tout ce que le jeu te dit, c'est RÉMY qui le dit (sauf messages système sans guide).
  function toast(msg, kind) {
    const el = $("toast");
    const sys = kind === "sys";
    el.className = "show" + (kind === "gold" ? " gold" : "") + (sys ? " sys" : "");
    $("toast-msg").textContent = msg;
    $("toast-who").textContent = sys ? "SYSTÈME" : remyName;
    if (!sys) {
      tfx.clearRect(0, 0, 56, 56); tfx.save(); tfx.translate(28, 31);
      R.drawRemy(tfx, 0, 0, { radius: 21, emote: remy.emote || "neutral", blink: false });
      tfx.restore();
    }
    toastT = performance.now();
  }
  function updateToast(now) { if (now - toastT > 3400) $("toast").classList.remove("show"); }

  /* ----------------------------- SAVE -------------------------------- */
  // Sauvegarde réelle dans le navigateur : survit aux rechargements normaux.
  // Seul un vrai effacement des données du site (vider le cache/données) remet à zéro.
  const SAVE_KEY = "museeGoat.save.v2";
  function saveGame() {
    if (mode !== "play" && mode !== "end") return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 2, roomId, px: player.x, py: player.y, facing: player.facing, glasses: player.glasses,
        collected: [...collected], solved: [...solved], visited: [...visited], coinsGot: [...coinsGot],
        roomReturn, checkpoint, jumpUnlocked, following: remy.following, giverActive: giver.active,
        fallCount, remyName, remyScale: remy.scale, bonusCoins, finished,
        coinsSpent, jumpMax, floorTeleUnlocked, maxFloorReached,
      }));
    } catch (e) {}
  }
  function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
  function restoreFrom(s) {
    (s.collected || []).forEach(g => collected.add(g));
    (s.solved || []).forEach(g => solved.add(g));
    (s.visited || []).forEach(g => visited.add(g));
    (s.coinsGot || []).forEach(g => coinsGot.add(g));
    bonusCoins = s.bonusCoins || 0;
    coinsSpent = s.coinsSpent || 0;
    jumpMax = s.jumpMax || 4;
    floorTeleUnlocked = !!s.floorTeleUnlocked;
    maxFloorReached = s.maxFloorReached || 0;
    if (s.roomReturn) Object.assign(roomReturn, s.roomReturn);
    jumpUnlocked = !!s.jumpUnlocked;
    fallCount = s.fallCount || 0;
    finished = !!s.finished;
    remyName = s.remyName || remyName;
    const rid = D.ROOMS[s.roomId] ? s.roomId : D.START;
    loadRoom(rid);
    player.x = player.rx = player.fromX = s.px; player.y = player.ry = player.fromY = s.py;
    player.facing = s.facing || "up"; player.glasses = s.glasses || "roundsquare";
    checkpoint = (s.checkpoint && D.ROOMS[s.checkpoint.room]) ? s.checkpoint : { room: rid, x: s.px, y: s.py };
    giver.active = !!s.giverActive;
    if (giver.active) { const g = room.guide; const gv = Array.isArray(g) ? { x: g[0], y: g[1] } : (g || { x: s.px, y: s.py }); giver.x = gv.x; giver.y = gv.y; }
    remy.following = !!s.following; remy.scale = s.remyScale || 1;
    remy.x = remy.rx = player.x; remy.y = remy.ry = player.y;
    cam.x = project(player.rx, player.ry).x; cam.y = project(player.rx, player.ry).y;
    updateHUD();
    setTimeout(() => toast("Sauvegarde chargée — " + room.title), 700);
  }

  /* ----------------------------- LOOP -------------------------------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt, now);
    draw(now / 1000);
    if (overlay === "photo" && activeMapCanvas) {
      drawMapOnCanvas(activeMapCanvas);
    }
    requestAnimationFrame(frame);
  }

  function tileLight(x, y) {
    const d = Math.hypot(x - player.rx, y - player.ry);
    if (room && room.gallery) return clamp(1.25 - d * 0.06, 0.5, 1);   // musée éclairé : on voit loin
    return clamp(1.2 - d * 0.17, 0.1, 1);
  }

  function update(dt, now) {
    // charge : jauge qui monte PUIS redescend (triangle) — il faut lâcher au bon moment
    if (charging) {
      const raw = (now - chargeStart) / CHARGE_MS;     // 0..∞
      const tri = 1 - Math.abs((raw % 2) - 1);          // 0 -> 1 -> 0 -> 1 ...
      chargeRatio = tri;
      chargeLevel = clamp(1 + Math.round(tri * (jumpMax - 1)), 1, jumpMax);
      player.squashY = 1 - tri * 0.24; player.squashX = 1 + tri * 0.18;
    }

    // atterrissage "depuis le ciel" (raccourci) : le joueur descend du haut de l'écran et se pose
    if (skyDropActive) {
      skyT += dt; const DUR = 0.85;
      if (skyT >= DUR) { skyDropActive = false; player._skyY = 0; player.squashX = 1.3; player.squashY = 0.7; spawnDust(player.x, player.y); lastInputT = performance.now(); }
      else { const e = skyT / DUR; player._skyY = 700 * (1 - e * e); }   // chute accélérée (gravité)
    }

    if (player.moving) {
      player.mt += dt / player.mdur;
      if (player.mt >= 1) {
        player.mt = 1; player.moving = false; player.rx = player.x; player.ry = player.y; player.peak = 0;
        if (!walkable(player.x, player.y)) { startFall(player.x, player.y); }
        else onLand();
        player.squashX = 1; player.squashY = 1;
      } else {
        const e = player.mt; player.rx = player.fromX + (player.x - player.fromX) * e; player.ry = player.fromY + (player.y - player.fromY) * e;
        player.hop = Math.sin(e * Math.PI) * player.peak;
        const sq = Math.sin(e * Math.PI); player.squashX = 1 + sq * 0.1; player.squashY = 1 - sq * 0.08;
      }
    } else if (player.falling) {
      player.fall += dt; const e = Math.min(1, player.fall / 0.6);
      player.rx = player.fromX + (player.x - player.fromX) * Math.min(1, e * 2);
      player.ry = player.fromY + (player.y - player.fromY) * Math.min(1, e * 2);
      player.hop = -(e * e) * 340;                 // accélère vers le BAS (gravité)
      player.alpha = Math.max(0, 1 - e * 1.05);
      if (player.fall >= 0.62 && !player._fellHandled) { player._fellHandled = true; fallFade(); }
    } else if (!charging) {
      player.squashX += (1 - player.squashX) * 0.2; player.squashY += (1 - player.squashY) * 0.2; player.bob = Math.sin(now / 430) * 3;
    }

    if (remy.following) {
      // suit la tuile que le joueur vient de quitter -> toujours du sol valide, juste derrière
      const tx = player.fromX, ty = player.fromY;
      remy.rx += (tx - remy.rx) * Math.min(1, dt * 7); remy.ry += (ty - remy.ry) * Math.min(1, dt * 7);
      remy.x = Math.round(remy.rx); remy.y = Math.round(remy.ry);
    }
    remy.scale += (1 - remy.scale) * 0.03; remy.blinkT -= dt;
    if (remy.hopAnim > 0) { remy.hopAnim += dt / 0.42; if (remy.hopAnim >= 1) { remy.hopAnim = 0; remy.hop = 0; } else { remy.hop = Math.sin(remy.hopAnim * Math.PI) * 26; } }

    if (room) for (const t of room.tiles) { if (t.reveal < 1 && (t._discovered || !t.hidden)) t.reveal = Math.min(1, t.reveal + dt * 4); if (t.press > 0) t.press = Math.max(0, t.press - dt * 4); }
    // tuiles qui s'écroulent : vibrent puis s'enfoncent doucement, le temps de sauter ailleurs
    if (room) for (const t of room.tiles) {
      if (t.crumble && t._crumbleT > 0 && !t._fallen) {
        t._crumbleT += dt;
        const SHAKE = 0.5, SINK = 1.5;
        if (t._crumbleT < SHAKE) { t._shake = (Math.random() - 0.5) * 4; t._sink = 0; }
        else {
          const e = Math.min(1, (t._crumbleT - SHAKE) / SINK);
          t._shake = (Math.random() - 0.5) * 3 * (1 - e);
          t._sink = e * e * 160;                       // accélère vers le bas
          if (e >= 1) {
            t._fallen = true; t._shake = 0;
            if (!player.moving && !player.falling && player.x === t.x && player.y === t.y) startFall(player.x, player.y);
          }
        }
      }
    }

    updateParticles(dt);
    const target = project(player.rx, player.ry);
    cam.x += (target.x - cam.x) * Math.min(1, dt * 6); cam.y += (target.y - cam.y) * Math.min(1, dt * 6);

    if (mode === "play" && !overlay && !transitioning && now - lastInputT > 9000 && !idleFired) { idleFired = true; remy.emote = "smug"; toast(D.IDLE_LINE); }
    // chrono du parkour : si le temps s'écoule avant l'île de fin -> échec + chute
    if (pkOn && !pkDone && !overlay) { pkT -= dt; if (pkT <= 0) failParkour(); }
    updateDialogue(now); updateToast(now); drawMinimap();
  }

  let fadeBusy = false;
  function fallFade() {
    if (fadeBusy) return; fadeBusy = true; const f = $("fade"); f.style.opacity = 1;
    setTimeout(() => {
      if (player._dropTo) { const to = player._dropTo; player._dropTo = null; skyDropTo(to); fadeBusy = false; return; }
      respawn(); fallSequence(); f.style.opacity = 0; setTimeout(() => { fadeBusy = false; }, 300);
    }, 220);
  }

  /* ----------------------------- DRAW -------------------------------- */
  function draw(t) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    if (!room) return;
    ctx.save(); ctx.translate(W / 2 - cam.x, H * 0.58 - cam.y);

    const tiles = room.tiles.filter(tt => !(tt.hidden && !tt._discovered) && tt.reveal > 0.01)
      .sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x);

    const infos = {};
    // PASS A : tuiles + décor posé
    for (const tile of tiles) {
      const light = tileLight(tile.x, tile.y);
      const info = R.drawTile(ctx, tile, light); if (!info) continue;
      infos[tile.x + "," + tile.y] = { info, light };
      if ((tile.to && !(tile.needFinished && !finished)) || (tile.type === "teleport" && !(tile.needFinished && !finished)) || (tile.type === "entry" && roomReturn[roomId])) R.drawTeleporterTop(ctx, info, "#5fd0ff", t, light);
      if (tile.type === "reveal" && !pkDone) R.drawTeleporterTop(ctx, info, "#e0564f", t, light, { pad: true });
      if (tile.dropHole) R.drawDropPit(ctx, info, t, light);
      if (tile.arrow && (showArrows() || roomId === "hub" || (room && room.gallery))) R.drawFloorArrow(ctx, info, tile.arrow, clamp(light * 1.2, 0.45, 0.95));
      if (tile.type === "glasses" && tile.glasses && !collected.has(tile.glasses)) { const g = D.GLASSES[tile.glasses]; R.drawShadow(ctx, info.cx, info.cy + 4, 24, 0.4 * light); R.drawGlassesItem(ctx, info.cx, info.cy, 46, g.shape, t, g.rare); }
      if (tile.type === "photo") R.drawPhoto(ctx, info, tile.caption, light, tile.locked, { hang: tile.hang, img: tile._img });
      if (tile.type === "glassdisp") drawGlassDisp(tile, info, t, light);
      if (tile.type === "panel") R.drawSign(ctx, info, light, D.PANELS[tile.panel] && D.PANELS[tile.panel].glyph);
      if (tile.coin && !coinsGot.has(tile.x + "," + tile.y)) { const pulse = 0.6 + 0.4 * Math.sin(t * 3 + tile.x * 1.3); R.floorGlow(ctx, info.cx, info.cy + 2, 58, "rgb(244,207,106)", 0.22 * pulse); }
    }

    // fantômes des tuiles cachées proches (à peine visibles)
    for (const tile of room.tiles) {
      if (tile.hidden && !tile._discovered) {
        const d = Math.abs(tile.x - player.rx) + Math.abs(tile.y - player.ry);
        if (d < 2.2) { const p = project(tile.x, tile.y); ctx.save(); ctx.globalAlpha = (2.2 - d) * 0.12; ctx.strokeStyle = "#b98cff"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 68, p.y + 34); ctx.lineTo(p.x, p.y + 68); ctx.lineTo(p.x - 68, p.y + 34); ctx.closePath(); ctx.stroke(); ctx.restore(); }
      }
    }

    // BLOOM additif
    R.floorGlow(ctx, project(player.rx, player.ry).x, project(player.rx, player.ry).y + HH, 230, "rgb(250,250,238)", 0.10);
    if (remy.following) R.floorGlow(ctx, project(remy.rx, remy.ry).x, project(remy.rx, remy.ry).y + HH, 150, "rgb(240,245,255)", 0.06);
    for (const tile of tiles) { const ii = infos[tile.x + "," + tile.y]; if (!ii) continue;
      if ((tile.to && !(tile.needFinished && !finished)) || (tile.type === "teleport" && !(tile.needFinished && !finished)) || (tile.type === "entry" && roomReturn[roomId])) R.floorGlow(ctx, ii.info.cx, ii.info.cy, 150, "rgb(150,228,255)", 0.22);
      if (tile.type === "goal") R.floorGlow(ctx, ii.info.cx, ii.info.cy, 150, "rgb(244,207,106)", 0.18);
      if (tile.type === "reveal" && !pkDone) R.floorGlow(ctx, ii.info.cx, ii.info.cy, 140, "rgb(224,86,79)", 0.22);
      if (tile.dropHole) R.floorGlow(ctx, ii.info.cx, ii.info.cy, 130, "rgb(176,108,255)", 0.2);
      if (tile.hidden && tile.glasses && !collected.has(tile.glasses)) R.floorGlow(ctx, ii.info.cx, ii.info.cy, 120, "rgb(95,208,255)", 0.16);
    }
    // beacons des bonus cachés non découverts (ça brille dans le noir)
    for (const tile of room.tiles) { if (tile.hidden && !tile._discovered && tile.glasses && !collected.has(tile.glasses)) { const p = project(tile.x, tile.y); R.floorGlow(ctx, p.x, p.y + HH, 110, "rgb(95,208,255)", 0.14 + 0.06 * Math.sin(t * 3)); } }

    // indicateur d'atterrissage pendant la charge (tuile cible ou tuile fantôme = chute)
    if (charging) drawLandingIndicator();

    // PASS B : entités au-dessus de tout
    const ents = [];
    ents.push({ z: player.rx + player.ry, kind: "p" });
    if (remy.following) ents.push({ z: remy.rx + remy.ry, kind: "r" });
    if (giver.active) ents.push({ z: giver.x + giver.y, kind: "g" });
    for (const n of npcs) ents.push({ z: n.x + n.y, kind: "n", npc: n });
    ents.sort((a, b) => a.z - b.z);
    for (const e of ents) { if (e.kind === "p") drawPlayer(t); else if (e.kind === "r") drawRemy(t); else if (e.kind === "g") drawGiver(t); else drawNpcEnt(t, e.npc); }

    // PASS B.5 : quand on plonge dans un trou-raccourci, on REDESSINE les blocs côté caméra
    // par-dessus le joueur -> il s'enfonce À L'INTÉRIEUR du trou au lieu de passer devant.
    if (player.falling && player._dropTo) {
      const hx = player.x, hy = player.y;
      for (const [ddx, ddy] of [[0, 1], [1, 0], [1, 1]]) {
        const ft = tileAt(hx + ddx, hy + ddy);
        if (ft && !ft.decor && !ft._fallen) {
          const info = R.drawTile(ctx, ft, tileLight(ft.x, ft.y));
          if (ft.type === "panel" && info) R.drawSign(ctx, info, tileLight(ft.x, ft.y), D.PANELS[ft.panel] && D.PANELS[ft.panel].glyph);
        }
      }
    }

    // PASS C : UI en monde
    if (charging) { const p = project(player.rx, player.ry); R.drawPowerBar(ctx, p.x, p.y + HH - 26 - (player.hop || 0), chargeRatio, chargeLevel, jumpMax); }
    drawParticles(t);
    drawPrompt(t);
    ctx.restore();

    // vignette finale -> noir abyssal aux bords
    const vg = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.18, W / 2, H * 0.55, Math.max(W, H) * 0.62);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    // chrono du parkour (gros chiffre, haut-centre)
    if (pkOn && !pkDone) {
      ctx.save(); ctx.textAlign = "center";
      ctx.font = "40px 'Press Start 2P', monospace";
      ctx.fillStyle = pkT < 3 ? "#e0564f" : "#fff";
      ctx.fillText(Math.ceil(pkT), W / 2, 96);
      ctx.font = "10px 'Press Start 2P', monospace"; ctx.fillStyle = "#9a9aa2";
      ctx.fillText("ATTEINS L'ÎLE D'EN FACE", W / 2, 116);
      ctx.restore();
    }
  }

  function showArrows() { return lost >= 4 || (performance.now() - lastInputT > 4000); }

  function drawPlayer(t) {
    const p = project(player.rx, player.ry);
    // si le joueur est sur une tuile qui s'écroule, il s'enfonce ET vibre avec elle
    let rideSink = 0, rideShake = 0;
    const ct = tileAt(player.x, player.y);
    if (ct && ct.crumble && ct._crumbleT > 0 && !ct._fallen && !player.moving && !player.falling) { rideSink = ct._sink || 0; rideShake = ct._shake || 0; }
    const px = p.x + rideShake; const baseY = p.y + HH + rideSink;
    const skyY = player._skyY || 0;
    const floatY = (player.moving || player.falling) ? 0 : player.bob;
    // chevron de direction devant lui (repère d'orientation) — au sol, quand il vise
    if (!player.falling && !player.moving && !overlay && !transitioning && !skyDropActive) R.drawFacingArrow(ctx, px, baseY, player.facing, t);
    R.drawShadow(ctx, px, baseY + 2, 30 * player.alpha * (1 - skyY / 900), 0.5 * player.alpha);
    R.drawHero(ctx, px, baseY - 28 - (player.hop || 0) + floatY - skyY, { radius: 23, facing: player.facing, squashX: player.squashX, squashY: player.squashY, glassesShape: player.glasses });
    ctx.globalAlpha = 1;
  }
  function drawLandingIndicator() {
    const d = DIRS[player.facing]; if (!d) return;
    const lvl = jumpUnlocked ? chargeLevel : 1;
    const tx = player.x + d.dx * lvl, ty = player.y + d.dy * lvl;
    const pj = project(tx, ty); const cx = pj.x, cy = pj.y + HH;
    const N = { x: cx, y: cy - HH }, E = { x: cx + HW, y: cy }, S = { x: cx, y: cy + HH }, Wp = { x: cx - HW, y: cy };
    const ok = walkable(tx, ty);
    ctx.save();
    if (ok) {
      R.floorGlow(ctx, cx, cy, 82, "rgb(120,214,255)", 0.22);
      ctx.strokeStyle = "rgba(160,232,255,0.95)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(N.x, N.y); ctx.lineTo(E.x, E.y); ctx.lineTo(S.x, S.y); ctx.lineTo(Wp.x, Wp.y); ctx.closePath(); ctx.stroke();
    } else {
      // tuile FANTÔME au-dessus du vide : prévient qu'on va tomber
      ctx.fillStyle = "rgba(220,80,80,0.13)";
      ctx.beginPath(); ctx.moveTo(N.x, N.y); ctx.lineTo(E.x, E.y); ctx.lineTo(S.x, S.y); ctx.lineTo(Wp.x, Wp.y); ctx.closePath(); ctx.fill();
      ctx.setLineDash([8, 6]); ctx.strokeStyle = "rgba(240,120,120,0.95)"; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,170,170,0.95)"; ctx.font = "20px 'Press Start 2P', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("!", cx, cy - 1); ctx.textBaseline = "alphabetic";
    }
    ctx.restore();
  }
  function drawRemy(t) {
    const p = project(remy.rx, remy.ry); const baseY = p.y + HH; const floatY = Math.sin(t * 1.6 + 1) * 4;
    R.drawShadow(ctx, p.x, baseY + 2, 22 * remy.scale, 0.45);
    let blink = false; if (remy.blinkT < 0) { blink = remy.blinkT > -0.12; if (remy.blinkT < -0.12) remy.blinkT = 2 + Math.random() * 3; }
    R.drawRemy(ctx, p.x, baseY - 24 + floatY - (remy.hop || 0), { radius: 19 * remy.scale, emote: remy.emote, blink });
  }
  function drawGiver(t) {
    const p = project(giver.x, giver.y); const baseY = p.y + HH;
    R.drawShadow(ctx, p.x, baseY + 2, 22, 0.45);
    R.floorGlow(ctx, p.x, baseY, 90, "rgb(244,207,106)", 0.06);
    R.drawGiver(ctx, p.x, baseY - 24, t);
  }
  function drawNpcEnt(t, n) {
    const p = project(n.x, n.y); const baseY = p.y + HH;
    R.drawShadow(ctx, p.x, baseY + 2, 20, 0.45);
    R.floorGlow(ctx, p.x, baseY, 80, "rgb(140,150,255)", 0.05);
    R.drawNPC(ctx, p.x, baseY - 24, t, n.color, "neutral");
  }

  // socle de musée + paire de lunettes qui flotte au-dessus (galerie)
  function polyG(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); }
  function drawGlassDisp(tile, info, t, light) {
    const cx = info.cx, cy = info.cy, L = Math.max(0.4, light);
    const HW2 = window.ISO.HW, HH2 = window.ISO.HH;
    const A = { x: HW2, y: HH2 }, B = { x: -HW2, y: HH2 };
    const G = (a, b, up) => ({ x: cx + a * A.x + b * B.x, y: cy + a * A.y + b * B.y - (up || 0) });
    const pa = 0.34, ph = 34;
    const sh = R.shade;
    // faces du socle
    ctx.fillStyle = sh("#3a3a40", L); polyG([G(pa, -pa, 0), G(pa, pa, 0), G(pa, pa, ph), G(pa, -pa, ph)]); ctx.fill();
    ctx.fillStyle = sh("#24242a", L); polyG([G(-pa, pa, 0), G(pa, pa, 0), G(pa, pa, ph), G(-pa, pa, ph)]); ctx.fill();
    // dessus
    ctx.fillStyle = sh("#4a4a52", L); polyG([G(-pa, -pa, ph), G(pa, -pa, ph), G(pa, pa, ph), G(-pa, pa, ph)]); ctx.fill();
    ctx.strokeStyle = sh("#000", 1); ctx.lineWidth = 1.2; ctx.stroke();
    // halo + lunettes flottantes
    const top = G(0, 0, ph);
    const g = D.GLASSES[tile.glasses] || { shape: "round", rare: false };
    if (collected.has(tile.glasses)) {
      R.floorGlow(ctx, top.x, top.y, 80, g.rare ? "rgb(95,208,255)" : "rgb(244,207,106)", 0.16);
      R.drawGlassesItem(ctx, top.x, top.y - 22, 48, g.shape, t, g.rare);
    } else {
      ctx.fillStyle = sh("#555", L); ctx.font = "26px 'Press Start 2P'"; ctx.textAlign = "center";
      ctx.fillText("?", top.x, top.y - 14);
    }
  }

  function drawPrompt(t) {
    if (overlay || transitioning || player.moving || player.falling || charging) return;
    const g = interactTarget(); if (!g) return;
    let gx, gy, label = "E";
    if (g.kind === "giver") { gx = giver.x; gy = giver.y; }
    else if (g.kind === "npc") { gx = g.npc.x; gy = g.npc.y; }
    else { gx = g.tile.x; gy = g.tile.y; }
    const p = project(gx, gy); const y = p.y + HH - 74 + Math.sin(t * 4) * 3;
    ctx.save(); ctx.fillStyle = "#0c0c0c"; ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = 2;
    rrect(ctx, p.x - 16, y - 16, 32, 32, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f2f2f2"; ctx.font = "14px 'Press Start 2P'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, p.x, y + 1); ctx.textBaseline = "alphabetic"; ctx.restore();
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  function drawPortrait(t) {
    pctx.clearRect(0, 0, portrait.width, portrait.height);
    if (!overlay) return;
    pctx.save(); pctx.translate(portrait.width / 2, portrait.height / 2 + 8);
    if (dlg.speaker === "sign") { pctx.fillStyle = "#1c1c1c"; pctx.strokeStyle = "#f0f0f0"; pctx.lineWidth = 3; pctx.fillRect(-28, -26, 56, 42); pctx.strokeRect(-28, -26, 56, 42); pctx.strokeStyle = "rgba(240,240,240,0.6)"; pctx.lineWidth = 2; for (let i = 0; i < 3; i++) { pctx.beginPath(); pctx.moveTo(-20, -18 + i * 9); pctx.lineTo(14 - i * 7, -18 + i * 9); pctx.stroke(); } }
    else if (dlg.speaker === "npc") {
      const r = 32;
      const bg = pctx.createRadialGradient(-r * 0.32, -r * 0.44, r * 0.12, 0, 0, r * 1.2);
      bg.addColorStop(0, "#6b6b74"); bg.addColorStop(0.5, "#2a2a31"); bg.addColorStop(1, "#070709");
      pctx.fillStyle = bg; pctx.beginPath(); pctx.arc(0, 0, r, 0, Math.PI * 2); pctx.fill();
      pctx.globalAlpha = 0.4; pctx.fillStyle = "#fff"; pctx.beginPath(); pctx.ellipse(-r * 0.3, -r * 0.42, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2); pctx.fill(); pctx.globalAlpha = 1;
      const px = r * 0.18, ex = r * 0.4;
      pctx.fillStyle = "#f6f6f6"; pctx.fillRect(Math.round(-ex - px), Math.round(-px), Math.round(px * 1.8), Math.round(px * 2));
      pctx.fillStyle = "#0a0a0a"; pctx.fillRect(Math.round(-ex - px * 0.3), 0, Math.round(px * 0.9), Math.round(px));
      pctx.fillStyle = "#f6f6f6"; pctx.fillRect(Math.round(ex - px * 0.7), Math.round(px * 0.4), Math.round(px * 1.6), Math.round(px * 0.7));
    }
    else if (dlg.speaker === "npc2") {
      const r = 32, col = "#7a6cff";
      const bg = pctx.createRadialGradient(-r * 0.32, -r * 0.44, r * 0.12, 0, 0, r * 1.2);
      bg.addColorStop(0, col); bg.addColorStop(0.55, "#2a2440"); bg.addColorStop(1, "#070709");
      pctx.fillStyle = bg; pctx.beginPath(); pctx.arc(0, 0, r, 0, Math.PI * 2); pctx.fill();
      pctx.globalAlpha = 0.4; pctx.fillStyle = "#fff"; pctx.beginPath(); pctx.ellipse(-r * 0.3, -r * 0.42, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2); pctx.fill(); pctx.globalAlpha = 1;
      R.drawPixelEyes(pctx, r, dlg.emote || "neutral", false);
    }
    else if (dlg.speaker === "admin") {
      // L'admin : un type un peu pressé, casquette de staff + badge
      pctx.save();
      // tête
      const r = 26;
      pctx.fillStyle = "#d49b6a"; pctx.beginPath(); pctx.arc(0, -2, r, 0, Math.PI * 2); pctx.fill();
      // casquette
      pctx.fillStyle = "#2a3550"; pctx.beginPath(); pctx.arc(0, -6, r + 1, Math.PI, 0); pctx.fill();
      pctx.fillRect(-r - 1, -8, (r + 1) * 2, 6);
      pctx.fillStyle = "#1c2438"; pctx.fillRect(-6, -10, 30, 6);   // visière
      pctx.fillStyle = "#f4cf6a"; pctx.fillRect(-5, -20, 10, 5);   // écusson
      // yeux + sourire pressé
      pctx.fillStyle = "#1a1a1a"; pctx.fillRect(-10, 0, 5, 6); pctx.fillRect(6, 0, 5, 6);
      pctx.strokeStyle = "#1a1a1a"; pctx.lineWidth = 2.5; pctx.beginPath();
      if ((dlg.emote || "") === "smug") { pctx.moveTo(-8, 13); pctx.lineTo(10, 9); }
      else { pctx.moveTo(-8, 11); pctx.quadraticCurveTo(0, 16, 9, 11); }
      pctx.stroke();
      pctx.restore();
    }
    else { let blink = (Math.sin(t * 1.5) > 0.985); R.drawRemy(pctx, 0, 0, { radius: 34, emote: remy.emote, blink }); }
    pctx.restore();
  }

  /* ----------------------------- INTRO ------------------------------- */
  function startGame() {
    $("intro").classList.add("hide"); setTimeout(() => { $("intro").style.display = "none"; }, 700);
    mode = "play";
    const s = loadSave();
    if (s && s.roomId && D.ROOMS[s.roomId]) { restoreFrom(s); lastInputT = performance.now(); return; }
    loadRoom(D.START);
    const sp = room.spawn; player.x = player.rx = player.fromX = sp.x; player.y = player.ry = player.fromY = sp.y;
    player.facing = "down";
    checkpoint = { room: D.START, x: sp.x, y: sp.y };
    cam.x = project(sp.x, sp.y).x; cam.y = project(sp.x, sp.y).y;
    // PNJ donneur près d'une extrémité de l'île ; Rémy n'apparaît qu'après le dialogue
    const g = room.guide;
    const gv = Array.isArray(g) ? { x: g[0], y: g[1] } : (g || { x: sp.x - 1, y: sp.y });
    jumpUnlocked = false;
    giver.active = true; giver.x = gv.x; giver.y = gv.y;
    remy.following = false; remy.x = remy.rx = gv.x; remy.y = remy.ry = gv.y;
    lastInputT = performance.now();
    runDialogue(D.DIALOGUE.intro_admin);   // l'admin nous accueille (input bloqué pendant le dialogue)
  }

  let started = false;
  function startGameOnce() { if (started) return; started = true; startGame(); }
  $("startBtn").addEventListener("click", startGameOnce);
  // filets : Entrée/Espace ou clic n'importe où sur l'intro lancent aussi la partie
  $("intro").addEventListener("click", (e) => { if (mode === "intro") startGameOnce(); });
  addEventListener("keydown", (e) => { if (mode === "intro" && (e.key === "Enter" || e.code === "Space")) { e.preventDefault(); startGameOnce(); } });
  $("endReplay") && $("endReplay").addEventListener("click", replayKeepProgress);
  $("endClose") && $("endClose").addEventListener("click", enterGallery);
  $("gal-next") && $("gal-next").addEventListener("click", () => nextExhibit());
  $("gal-prev") && $("gal-prev").addEventListener("click", () => prevExhibit());
  $("gal-exit") && $("gal-exit").addEventListener("click", exitGallery);
  document.querySelectorAll(".inv-close").forEach(b => b.addEventListener("click", () => $("inventory").classList.remove("show")));

  // Reprise : si une sauvegarde existe, le bouton propose de continuer + d'effacer
  (function initIntroSave() {
    const s = loadSave();
    if (s && s.roomId) { $("startBtn").textContent = "CONTINUER"; const rb = $("resetBtn"); if (rb) rb.style.display = ""; }
  })();
  $("resetBtn") && $("resetBtn").addEventListener("click", () => { clearSave(); location.reload(); });

  function portraitLoop(now) { drawPortrait(now / 1000); requestAnimationFrame(portraitLoop); }

  // ---- Touches clavier à l'écran : retour visuel + clic souris ----------
  (function setupKeys() {
    const caps = {};
    document.querySelectorAll("#controls .cap").forEach(el => caps[el.dataset.cap] = el);
    const press = (n) => { const c = caps[n]; if (c) c.classList.add("down"); };
    const release = (n) => { const c = caps[n]; if (c) c.classList.remove("down"); };
    function capForCode(code) {
      if (code === "Space") return "space";
      if (code === "KeyE") return "E";
      if (code === "KeyI") return "I";
      if (code === "ArrowUp" || code === "KeyZ" || code === "KeyW") return "up";
      if (code === "ArrowDown" || code === "KeyS") return "down";
      if (code === "ArrowLeft" || code === "KeyQ" || code === "KeyA") return "left";
      if (code === "ArrowRight" || code === "KeyD") return "right";
      return null;
    }
    const ctrl = document.getElementById("controls");
    let scheme = "arrows";
    function setScheme(s) { if (s === scheme) return; scheme = s; ctrl.classList.toggle("letters", s === "letters"); }
    addEventListener("keydown", (e) => {
      const n = capForCode(e.code); if (!n) return;
      if (e.code.indexOf("Arrow") === 0) setScheme("arrows");
      else if (["KeyZ", "KeyW", "KeyQ", "KeyA", "KeyS", "KeyD"].indexOf(e.code) >= 0) setScheme("letters");
      press(n);
    });
    addEventListener("keyup", (e) => { const n = capForCode(e.code); if (n) release(n); });
    addEventListener("blur", () => { Object.keys(caps).forEach(release); });
    Object.keys(caps).forEach((n) => {
      const el = caps[n];
      el.addEventListener("mouseleave", () => el.classList.remove("down"));
      el.addEventListener("click", () => {
        if (mode === "intro") return;
        el.classList.add("down"); setTimeout(() => el.classList.remove("down"), 120);
        if (n === "E") interact();
        else if (n === "I") toggleInventory();
        else if (n === "space") { if (!player.moving && !overlay) step(player.facing); }
        else { if (!overlay) player.facing = n; }
      });
    });
  })();

  // ---- Clic direct sur le canvas de jeu pour interagir -----------------
  canvas.addEventListener("click", (e) => {
    if (mode !== "play" && mode !== "gallery" && mode !== "end") return;
    if (overlay) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    let closest = null;
    let minDist = 40; // max click distance in pixels
    
    room.tiles.forEach(tile => {
      if (tile.type !== "photo" && tile.type !== "glassdisp" && tile.type !== "panel") return;
      const p = project(tile.x, tile.y);
      let cx = p.x + (W / 2 - cam.x);
      let cy = p.y + HH + (H * 0.58 - cam.y);
      
      if (tile.type === "photo") {
        if (tile.hang) cy -= 211; // height adjustment for hanging photos
        else cy -= 83; // height adjustment for normal photos
      } else if (tile.type === "panel") {
        cy -= 50; // height adjustment for signs
      }
      
      const dist = Math.hypot(mx - cx, my - cy);
      if (dist < minDist) {
        minDist = dist;
        closest = tile;
      }
    });
    
    if (closest) {
      if (closest.type === "photo") openPhoto(closest);
      else if (closest.type === "glassdisp") {
        const gl = D.GLASSES[closest.glasses];
        toast(collected.has(closest.glasses) ? (gl.name + " — débloquée. " + gl.pickup) : (gl.name + " — pas encore débloquée. Faut fouiller mieux."), collected.has(closest.glasses) ? "gold" : "sys");
      }
      else if (closest.type === "panel") {
        if (!remy.following) toast("Sans guide, ces panneaux ? Du charabia crypté. Retrouve 0x52-EMI d'abord.", "sys");
        else openPanel(closest.panel);
      }
    }
  });

  resize(); requestAnimationFrame(frame); requestAnimationFrame(portraitLoop);
  window.GAME = { player, remy, giver, npcs, collected, coinsGot, tick: (n, dt) => { for (let i = 0; i < (n || 1); i++) update(dt || 0.016, performance.now()); draw(performance.now() / 1000); }, jump, step, goRoom, loadRoom, interact, enterGallery, nextExhibit, prevExhibit, get room() { return room; }, get mode() { return mode; }, get jumpUnlocked() { return jumpUnlocked; } };
})();