/* =========================================================================
   LE MUSÉE DU GOAT
   -------------------------------------------------------------------------
   Édite tout ici : photos, questions, lunettes, secrets, plans de salles.
   Le moteur lit ROOMS / ORDER. Géométrie pensée pour être toujours jouable.
   ========================================================================= */
window.GAME_DATA = (function () {

  const META = { age: 24, years: 8, goal: 10, title: "LE MUSÉE DU GOAT" };

  /* ------------------------- LUNETTES --------------------------------- */
  const GLASSES = {
    g_round: { id: "g_round", name: "Lunettes rondes", shape: "round", pickup: "Lunettes rondes. Le drip commence." },
    g_square: { id: "g_square", name: "Lunettes carrées", shape: "square", pickup: "Carrées. Sérieuses. L'inverse de toi." },
    g_thin: { id: "g_thin", name: "Lunettes fines", shape: "thin", pickup: "Fines. Discrètes. Stylé, j'avoue." },
    g_thick: { id: "g_thick", name: "Lunettes épaisses", shape: "thick", pickup: "Épaisses. Tu vois tes erreurs en HD." },
    g_2024: { id: "g_2024", name: "Lunettes 2024", shape: "roundsquare", pickup: "Modèle 2024. Le goût monte." },
    g_iconic: { id: "g_iconic", name: "Lunettes ICONIQUES", shape: "roundsquare", rare: true, pickup: "ICONIQUES. Objet rare. Ça ouvre des salles." },
    g_start: { id: "g_start", name: "Lunettes OUBLIÉES", shape: "thin", rare: true, pickup: "Les lunettes oubliées au tout début. T'as fini par revenir les chercher. Boucle bouclée." },
    g_final: { id: "g_final", name: "Lunettes SOUVENIR", shape: "round", rare: true, pickup: "La paire souvenir. Cachée dans la dernière salle. 8 ans, 8 paires." },
  };

  const PHOTO_PATHS = {
    "enfance_01": "photos/bebe1.JPG",
    "enfance_02": "photos/bebe2.JPG",
    "enfance_03": "photos/bebe3.JPG",
    "enfance_04": "photos/bebe4.JPG",
    "enfance_05": "photos/bebe5.JPG",
    "photo_2019_01": "photos/jeune2019.JPG",
    "photo_2019_02": "photos/bebe-toto2022.JPG",
    "photo_2020_01": "photos/iconic2020.JPG",
    "photo_2020_02": "photos/VR2020.JPG",
    "photo_2020_03": "photos/ascenseur2020.jpg",
    "photo_2020_04": "photos/boxe2020.jpg",
    "photo_2020_05": "photos/froid2020.JPG",
    "photo_2021_01": "photos/wtf2021.JPG",
    "photo_2021_02": "photos/bizarre2021.JPG",
    "photo_2021_03": "photos/chezlui2021.JPG",
    "photo_2021_04": "photos/escalade2021.JPG",
    "photo_2021_05": "photos/nuit2021.JPG",
    "photo_2021_06": "photos/ptitdej2021.jpg",
    "photo_2022_01": "photos/style2022.JPG",
    "photo_2022_02": "photos/maxime2022.jpg",
    "photo_2023_01": "photos/fete2023.JPG",
    "photo_2023_02": "photos/chelou2023.jpg",
    "photo_2023_03": "photos/fac2023.jpg",
    "photo_2023_04": "photos/meme2023.jpg",
    "photo_2023_05": "photos/metro2023.jpg",
    "photo_2023_06": "photos/style2023.JPG",
    "photo_2023_07": "photos/visio2023.PNG",
    "photo_2024_01": "photos/BU2024.jpg",
    "photo_2024_02": "photos/chelou2024.jpg",
    "photo_2024_03": "photos/funny2024.jpg",
    "photo_2024_04": "photos/nuit2024.jpg",
    "photo_2024_05": "photos/vaisselle2024.jpg",
    "photo_2025_01": "photos/anniv2025.JPG",
    "photo_2025_02": "photos/basic2025.JPG",
    "photo_2025_03": "photos/bisou2025.jpg",
    "photo_2025_04": "photos/chez-moi2025.jpg",
    "photo_2025_05": "photos/iconic2025.jpg",
    "photo_2025_06": "photos/metro2025.jpg",
    "photo_2025_07": "photos/mochi2025.jpg",
    "photo_2025_08": "photos/nuit2025.jpg",
    "photo_2025_09": "photos/theniou2025.jpg",
    "photo_2026_01": "photos/drole-pose2026.jpg",
    "photo_2026_02": "photos/glace-aix2026.jpg",
    "photo_2026_03": "photos/kfc2026.jpg",
    "photo_2026_04": "photos/meme2026.jpg",
    "photo_2026_05": "photos/ratatouille2026.jpg",
    "photo_2026_06": "photos/soiree2026.jpg",
    "photo_2026_07": "photos/train2026.jpg",
    "toi_moi": "photos/toi-moi.jpg",
    "24ans": "photos/fun-end.jpg",
    "photo_final_01": "photos/bebe1.JPG",
    "photo_final_02": "photos/bebe2.JPG",
    "photo_final_03": "photos/bebe3.JPG",
    "photo_final_04": "photos/bebe5.JPG",
    "photo_1712": "photos/1712915761122.JPG",
    "photo_2023_07_18": "photos/20230718_163238.JPG",
    "photo_2023_07_30": "photos/20230730_131418.JPG",
    "photo_2024_10_29": "photos/20241029_211516.JPG",
    "photo_peche_antoine": "photos/pech.jpgantoine-20240303-0002.JPG",
  };

  const GALLERY_PHOTOS = [
    ["enfance_01", "Déjà ce regard de futur gamin attachant."],
    ["enfance_02", "Petit enfant trop mignon."],
    ["enfance_03", "La maternelle. Le crime de mode commence tôt."],
    ["enfance_04", "Le sourire édenté légendaire."],
    ["enfance_05", "Déjà un futur dentiste."],
    ["photo_2019_01", "2019. Le début des délire."],
    ["photo_2019_02", "2019. On aurait pu s'arrêter là (heureusement non)."],
    ["photo_2020_01", "2020. Confinés, mais c'est là que tout a commencé."],
    ["photo_2020_02", "2020. Le regard vers un avenir incertain."],
    ["photo_2020_03", "2020. Un trajet en ascenseur mémorable."],
    ["photo_2020_04", "2020. Prêt pour le combat de boxe."],
    ["photo_2020_05", "2020. Il faisait froid, mais on rigolait bien."],
    ["photo_2021_01", "2021. On faisait rien. Magnifiquement."],
    ["photo_2021_02", "2021. Pose bizarre documentée."],
    ["photo_2021_03", "2021. Tranquillement posés chez lui."],
    ["photo_2021_04", "2021. L'escalade vers les sommets."],
    ["photo_2021_05", "2021. Sortie dans la nuit sombre."],
    ["photo_2021_06", "2021. Un petit déj royal."],
    ["photo_2022_01", "2022. Une photo que la justice devrait interdire."],
    ["photo_2022_02", "2022. Dossier Maxime top secret."],
    ["photo_2023_01", "2023. Presque des adultes. Presque."],
    ["photo_2023_02", "2023. Pose chelou mais assumée."],
    ["photo_2023_03", "2023. En pleine fac."],
    ["photo_2023_04", "2023. Un meme qui restera dans l'histoire."],
    ["photo_2023_05", "2023. Dans le métro."],
    ["photo_2023_06", "2023. Le style est présent."],
    ["photo_2023_07", "2023. Une visio inoubliable."],
    ["photo_2024_01", "2024. Pic de style, documenté pour l'Histoire."],
    ["photo_2024_02", "2024. Encore du grand n'importe quoi."],
    ["photo_2024_03", "2024. C'est drôle ou c'est triste ?"],
    ["photo_2024_04", "2024. Rôder la nuit."],
    ["photo_2024_05", "2024. La vaisselle du GOAT."],
    ["photo_2025_01", "2025. 8 ans après, toujours aussi cramé."],
    ["photo_2025_02", "2025. Pose basique."],
    ["photo_2025_03", "2025. Un bisou amical."],
    ["photo_2025_04", "2025. Chez moi."],
    ["photo_2025_05", "2025. Iconique."],
    ["photo_2025_06", "2025. Encore le métro."],
    ["photo_2025_07", "2025. Le mochi."],
    ["photo_2025_08", "2025. Dans la nuit."],
    ["photo_2025_09", "2025. Theniou."],
    ["photo_2026_01", "2026. Drôle de pose."],
    ["photo_2026_02", "2026. Glace à Aix-en-Provence."],
    ["photo_2026_03", "2026. Le KFC légendaire."],
    ["photo_2026_04", "2026. Un meme récent."],
    ["photo_2026_05", "2026. Ratatouille."],
    ["photo_2026_06", "2026. En soirée."],
    ["photo_2026_07", "2026. Dans le train."],
    ["photo_1712", "Le dentiste le bien chaussé (ou le plus mal chaussé ? avec son bel appareil dentaire au travail)."],
    ["photo_2023_07_18", "Le blédard au bled (au Vietnam)."],
    ["photo_2023_07_30", "On ne saura jamais ce qui se passe par ta tête (mouchoir style)."],
    ["photo_2024_10_29", "Sais-tu que tu es mignon, toi ?"],
    ["photo_peche_antoine", "Ton péché mignon... Le Graal secret de cette galerie. 💕"],
    ["toi_moi", "Toi & moi. 8 ans au compteur, et ça continue."],
    ["24ans", "24 ans aujourd'hui. Joyeux anniversaire, frérot."],
  ];

  /* ------------------------- PANNEAUX --------------------------------- */
  // kind = pour ma lisibilité. Le moteur ne lit que speaker/crypt/lines.
  //  - "learn"  : tutoriel utile
  //  - "hint"   : vrai indice (plateforme cachée, direction d'un bonus...)
  //  - "useless": flavor qui ne sert à rien (troll)
  //  - "riddle" : énigme dont la réponse = une direction de saut (3 ponts)
  // Vocabulaire des directions (= flèches au sol) :
  //   HAUT-GAUCHE=up · BAS-DROITE=down · BAS-GAUCHE=left · HAUT-DROITE=right
  const PANELS = {
    // — Tutoriel —
    p_jump: { kind: "learn", speaker: "remy", unlock: "jump", glyph: "saut", crypt: true, cryptLabel: "⌖⟟⌑⍜⏃ ⊑⍜⌖", lines: ["Décodage…", "« Maintiens ESPACE pour charger un saut. »", "La jauge monte PUIS redescend. Lâche au pic = saut long. Trop tôt = tu manques le bord."] },
    p_secret: { kind: "hint", speaker: "remy", glyph: "brille", crypt: true, cryptLabel: "⊑⟒⌰⌖ ⟟⌑ ⌖⍜⊑", lines: ["Décodage…", "« Quand ça brille bleu dans le noir : il y a du sol invisible là-bas. »", "Avance vers la lueur. Les tuiles apparaissent sous tes pieds. Aie la foi, le goat."] },
    p_teleport: { kind: "learn", speaker: "remy", glyph: "bleu", lines: ["La tuile qui pulse en bleu : téléporteur.", "Monte dessus, E pour changer de salle. Ça marche dans les deux sens."] },

    // — Énigmes 3 ponts (réponse = direction) —
    p_riddle_2020: { kind: "riddle", speaker: "remy", crypt: true, cryptLabel: "⏃⍜⊑ ⟟⌰ ⌖⊬", lines: ["Décodage…", "« 2020. Enfermés. La sortie n'était jamais devant nous — toujours plus HAUT. »", "Traduction : saute vers le HAUT-GAUCHE. Les deux autres ponts ? L'un mène au vide d'ennui, l'autre à un vieux dossier."] },
    p_riddle_2023: { kind: "riddle", speaker: "remy", crypt: true, cryptLabel: "⟒⌑⟟⌑⟒ ⊑⌖", lines: ["Décodage…", "« On a presque grandi en 2023. Presque. Le bon chemin descend, vers le bas-droite, comme nos résolutions. »", "Donc : BAS-DROITE. À gauche y'a rien, à droite un indice. Choisis bien, ou retombe."] },
    p_riddle_2025: { kind: "riddle", speaker: "remy", crypt: true, cryptLabel: "⟟⌖⍜⟟⌖ ⌰⊑", lines: ["Décodage…", "« Pour finir, il faut viser le sommet. HAUT-DROITE : là où on voulait tous arriver. »", "Les autres ponts t'éloignent. Un mène à un sou, l'autre dans le noir."] },

    // — Indices —
    p_glasses: { kind: "hint", speaker: "remy", glyph: "verres", lines: ["Certaines lunettes ouvrent plus que du style : elles débloquent des portes.", "Les rares brillent au loin, sur du sol caché. Ramasse-les."] },
    p_hint_dead: { kind: "hint", speaker: "remy", glyph: "pont", lines: ["Petit conseil gratuit : un pont qui ne mène à rien, ça reste un pont.", "Le vrai chemin, lui, continue à briller plus loin. Suis ce qui pulse."] },
    p_hint_coin: { kind: "hint", speaker: "remy", glyph: "piece", lines: ["Tu sens la lueur dorée au sol ? Y'a un sou caché juste là-dessous.", "Marche dessus : la pièce sort du sol toute seule."] },

    // — Flavor inutile (troll) —
    p_void: { kind: "useless", speaker: "remy", glyph: "vide", crypt: true, cryptLabel: "⟟⌰ ⊬ ⏃ ⌖⍜⟟", lines: ["Décodage…", "« Ici le vide adore les gens trop confiants. »", "...Voilà. C'était l'info. Ça t'avance pas, je sais. De rien."] },
    p_useless1: { kind: "useless", speaker: "remy", glyph: "rien", crypt: true, cryptLabel: "⍀⟟⟒⌖ ⊑", lines: ["Décodage…", "« Ce panneau est en location. »", "J'ai traduit pour rien. On a perdu 4 secondes ensemble. Beau moment."] },
    p_useless2: { kind: "useless", speaker: "remy", glyph: "rien", crypt: true, cryptLabel: "⏃⌰⌰⍜ ⌖⊬⌑", lines: ["Décodage…", "« Si tu lis ça, t'es du genre à tout lire. »", "Respect. Mais y'a rien ici. Continue, lecteur d'étiquettes."] },
    p_dead: { kind: "useless", speaker: "remy", glyph: "vide", lines: ["Bravo. Île vide. Trésor : néant.", "Au moins t'as la vue. Demi-tour quand tu veux."] },
    p_intro: { kind: "learn", speaker: "remy", glyph: "suis", lines: ["Suis les flèches au sol si t'es perdu.", "Mais le vide cache parfois des choses. Et les panneaux mentent. Parfois."] },
    p_useless3: { kind: "useless", speaker: "remy", glyph: "zero", crypt: true, cryptLabel: "⊬⌑⏃ ⌖⍜", lines: ["Décodage…", "« Réservé aux gens qui lisent tout. »", "Toi, donc. Bravo. Toujours rien à signaler."] },
    p_useless4: { kind: "useless", speaker: "remy", glyph: "vide", crypt: true, cryptLabel: "⌰⍜⌖ ⊑⊬", lines: ["Décodage…", "« Panneau décoratif. »", "Joli, hein ? Voilà. C'est tout."] },
    p_egg_empty: { kind: "useless", speaker: "remy", lines: ["Bon. Y'a rien sur cette île.", "Mais regarde : d'autres îlots brillent autour. Tu vas pas t'arrêter là, hein ?"] },
    p_egg_empty2: { kind: "useless", speaker: "remy", lines: ["Toujours rien ici. Je te jure.", "...mais y'a ENCORE un îlot là-bas. Et un téléporteur. Curieux comme t'es..."] },
    // panneau spécial tutoriel : explique les ponts qui se reconstruisent
    p_bridge: { kind: "learn", speaker: "remy", glyph: "pont", lines: ["Astuce : certains ponts se reconstruisent quand tu reviens sur tes pas.", "Si t'es bloqué, fais demi-tour. Le chemin réapparaît parfois."] },
    // panneaux du TROU DE RACCOURCI (descente express d'un étage)
    p_drop: { kind: "hint", speaker: "remy", glyph: "vide", lines: ["Le trou violet entre les deux panneaux ? Un RACCOURCI vers l'étage d'en dessous.", "Saute pile dedans : tu retombes direct dans la salle d'avant. Pas besoin de tout refaire."] },
    p_drop2: { kind: "hint", speaker: "remy", glyph: "pont", lines: ["Descente express : vise le CENTRE, entre les deux pancartes.", "Tu vas tomber pour de vrai — mais tu réapparais en bas, du ciel. Stylé."] },
  };

  /* ------------------------- DIALOGUES -------------------------------- */
  const DIALOGUE = {
    intro_admin: [
      { speaker: "admin", emote: "neutral", t: "Ah ! Te voilà enfin !" },
      { speaker: "admin", emote: "smug", t: "T'en as mis du temps ! (le culot du gars, franchement.)" },
      { speaker: "admin", emote: "neutral", t: "Bon, j'ai pas trop le temps là, je dois aller bosser !" },
      { speaker: "admin", emote: "neutral", t: "Du coup je te donne ces 2-3 petits conseils avant d'y aller." },
      { speaker: "admin", emote: "neutral", t: "Va vers les points bleus qui brillent : ce sont des téléporteurs." },
      { speaker: "admin", emote: "neutral", t: "Et parle aux personnages que tu croises (touche E, ou fonce-leur dedans)." },
      { speaker: "admin", emote: "smug", t: "Le reste, tu trouveras tout seul. T'es un grand. Allez, salut !" },
    ],
    meet_giver: [
      { speaker: "npc", emote: "neutral", t: "Wesh le Goat ! ou plutôt, Le futur perdu de ce musée haha." },
      { speaker: "npc", emote: "neutral", t: "Ici c'est 8 ans de souvenirs. Dans le noir total." },
      { speaker: "npc", emote: "smug", t: "Vu ton niveau, tu vas sûrement tomber dans le vide... Souvent lol." },
      { speaker: "npc", emote: "neutral", t: "Donc tiens. Je te file un guide." },
      { speaker: "npc", emote: "neutral", t: "Il s'appelle 0x52-EMI. Un truc robotique du genre." },
      { speaker: "npc", emote: "wink", t: "Il traduit les panneaux. Et il se moque de toi. Profite." },
      { speaker: "npc", emote: "happy", t: "Allez file. Il te suit déjà." },
    ],
    meet_remy: [
      { speaker: "remy", emote: "blank", t: "...initialisation du guide..." },
      { speaker: "remy", emote: "neutral", t: "0x52-EMI en ligne. Salut le goat." },
      { speaker: "remy", emote: "neutral", t: "Bienvenue dans ton musée. Un musée fait pour toi..." },
      { speaker: "remy", emote: "neutral", t: "Sur toi." },
      { speaker: "remy", emote: "smug", t: "Enfin..." },
      { speaker: "remy", emote: "neutral", t: "sur nous. 8 ans, ça se respecte." },
      { speaker: "remy", emote: "wink", t: "Bref, je te suis. Je traduis les panneaux. Je me moque." },
      { speaker: "remy", emote: "neutral", t: "FLÈCHES pour t'orienter" },
      { speaker: "remy", emote: "neutral", t: "spam ESPACE pour avancer. Maintiens ESPACE pour sauter plus loin." },
      { speaker: "remy", emote: "smug", t: "Les tuiles s'allument parfois autour de toi. Le reste : le néant." },
      { speaker: "remy", emote: "neutral", t: "Essaye d'aller vers la tuile bleue qui brille. etc." },
      { speaker: "remy", emote: "neutral", t: "Bref, Gros j'ai la flemme... donc bon, on y va ?" },
    ],
    teleport_locked: [
      { speaker: "remy", emote: "smug", t: "Accès refusé. Il te manque du style mon gars." },
      { speaker: "remy", emote: "blank", t: "Reviens quand t'auras amélioré ta vision optique frérot." },
    ],
    ending: [
      { speaker: "remy", emote: "neutral", t: "Voilà." },
      { speaker: "remy", emote: "neutral", t: "8 ans qu'on traîne ensemble. 8 ans que je supporte tes sauts ratés." },
      { speaker: "remy", emote: "happy", t: "Et tu sais quoi ? Ces moments-là, je les garderai toute ma vie." },
      { speaker: "remy", emote: "neutral", t: "Les soirées, les dossiers, les fous rires à 3h du mat." },
      { speaker: "remy", emote: "proud", t: "J'ai adoré chaque instant passé avec toi, mon gars. Pour de vrai." },
      { speaker: "remy", emote: "wink", t: "Et c'est pas près de s'arrêter, crois-moi." },
      { speaker: "remy", emote: "neutral", t: "Parce qu'aujourd'hui... tu fêtes tes 24 ans." },
      { speaker: "remy", emote: "smug", t: "24 piges. J'ai même ressorti des photos de toi gamin pour l'occasion." },
      { speaker: "remy", emote: "happy", t: "Spoiler : t'avais déjà cette même tête de cramé. Aucune évolution." },
      { speaker: "remy", emote: "proud", t: "Joyeux anniversaire frérot. Ce musée, il est à toi." },
      { speaker: "remy", emote: "wink", t: "Va te balader. J'ai accroché tous nos souvenirs pour toi." },
    ],
    reveal: [
      { speaker: "remy", emote: "surprised", t: "Ah, au fait." },
      { speaker: "remy", emote: "proud", t: "0x52-EMI. Décode..." },
      { speaker: "remy", emote: "proud", t: "R-E-M-Y... Rémy." },
      { speaker: "remy", emote: "wink", t: "C'était moi depuis le début. Évidemment." },
    ],
  };

  /* --------------------------- QUIZ ----------------------------------- */
  const QUIZZES = {
    q2019: {
      intro: "En 2019, qui était objectivement le plus drôle ?",
      answers: ["Toi", "Moi", "Personne", "Les autres sans faire exprès"], correct: 1,
      good: "Bien ouej. Comme quoi, tout arrive lol.",
      bad: ["BWHAHAHA. Non. Mais t'étais confiant, c'est bien.", "Faux. Tu t'es menti à toi-même là."]
    },
    q2021: {
      intro: "2021. Notre niveau de productivité, honnêtement ?",
      answers: ["Élevé", "Correct", "Néant absolu", "On existait à peine"], correct: 2,
      good: "Exact. Le néant. Au moins t'es lucide.",
      bad: ["Non. On faisait rien et tu le sais.", "Faux. Zéro pointé."]
    },
    q2024: {
      intro: "2024. Qui avait objectivement le plus de drip ?",
      answers: ["Toi", "Moi", "Les deux", "Aucun, soyons honnêtes"], correct: 3,
      good: "Voilà. La vérité fait mal mais elle est belle.",
      bad: ["Mdr non.", "Faux. Regarde-toi avant de parler drip."]
    },
  };

  const FALL_LINES = [
    "Frérot… même le sol t'a esquivé.",
    "Tu viens de perdre contre du vide. Du VIDE !",
    "Le vide t'a regardé et il a dit : viens.",
    "Là c'était pas un saut, c'était un vol planné.",
    "T'as sauté avec une confiance que tu méritais pas.",
    "Je savais que t'étais maladroit, mais pas à ce point.",
    "Crash Airlines. Atterrissage dans le néant.",
    "T'as cru que t'avais des ailes ou quoi ?",
    "Je m'attendais à ce que tu tombes, mais pas aussi vite lol",
  ];
  const FALL_5X = "Là c'est plus un accident, c'est un style de vie.";
  const CHECKPOINT_LINES = [
    "Checkpoint... Malheureusement, tu progresses.",
    "Ok, t'as survécu... Pour l'instant.",
    "Sauvegarde... Le jeu a eu pitié.",
  ];
  const IDLE_LINE = "Tu réfléchis ou t'as crash ?";

  /* ===================================================================
     CONSTRUCTEUR DE SALLE
     =================================================================== */
  // bruit déterministe local (data.js n'a pas accès au hash du moteur de rendu)
  function orgHash(x, y) { const h = Math.sin((x + 19.7) * 127.1 + (y + 9.3) * 311.7) * 43758.5453; return h - Math.floor(h); }
  // Casse les rectangles : retire des coins convexes / pointes (jamais des points
  // d'articulation -> l'île reste connexe) et ajoute des presqu'îles d'1 tuile.
  // Les tuiles protégées (entrée, features, flèches, centres) ne bougent jamais.
  function organicize(map, prot) {
    const at = (x, y) => map[x + "," + y];
    const special = (t) => t && (t.type || t.hidden || t.arrow || t.coin || t.glasses || t.npc != null);
    const isProt = (x, y) => prot.has(x + "," + y) || special(at(x, y));
    const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

    // bbox + style par île
    const isls = {};
    for (const k of Object.keys(map)) {
      const t = map[k]; if (t.isl == null) continue;
      const b = isls[t.isl] || (isls[t.isl] = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
      b.x0 = Math.min(b.x0, t.x); b.y0 = Math.min(b.y0, t.y); b.x1 = Math.max(b.x1, t.x); b.y1 = Math.max(b.y1, t.y);
    }
    const styleOf = {};
    for (const id of Object.keys(isls)) {
      const h = orgHash(+id * 7.1 + 3.3, +id * 2.7 + 1.9);
      styleOf[id] = h < 0.40 ? "hollow" : (h < 0.72 ? "organic" : "blob");   // ~40% creux, ~32% rongées, ~28% pleines/difformes
    }

    // 1) COINS CREUX : on entaille chaque coin en diagonale -> côtés larges, coins vides
    const remove = new Set();
    for (const id of Object.keys(isls)) {
      if (styleOf[id] !== "hollow") continue;
      const b = isls[id]; const w = b.x1 - b.x0 + 1, hgt = b.y1 - b.y0 + 1;
      const cut = Math.min(w, hgt) >= 5 ? 2 : 1;                  // entaille plus profonde sur grandes îles
      for (const k of Object.keys(map)) {
        const t = map[k]; if (t.isl !== +id || isProt(t.x, t.y)) continue;
        const dx = Math.min(t.x - b.x0, b.x1 - t.x), dy = Math.min(t.y - b.y0, b.y1 - t.y);
        if (dx + dy < cut) remove.add(k);                         // proche d'un coin (diagonale) -> vide
      }
    }
    // 2) EROSION organique (uniquement style "organic")
    for (const k of Object.keys(map)) {
      const t = map[k]; if (!t || t.isl == null || styleOf[t.isl] !== "organic" || isProt(t.x, t.y)) continue;
      const r = !!at(t.x + 1, t.y), l = !!at(t.x - 1, t.y), d = !!at(t.x, t.y + 1), u = !!at(t.x, t.y - 1);
      const n = r + l + d + u, corner = n === 2 && (r || l) && (u || d), tip = n <= 1;
      const h = orgHash(t.x * 1.7, t.y * 2.9);
      if ((corner && h > 0.5) || (tip && h > 0.25)) remove.add(k);
    }
    remove.forEach(k => delete map[k]);

    // 3) CROISSANCE : excroissances d'1 tuile (presqu'îles) — JAMAIS vers une autre île.
    for (const k of Object.keys(map)) {
      const t = map[k]; const srcIsl = t.isl; if (srcIsl == null) continue;
      if (styleOf[srcIsl] === "hollow") continue;                 // on garde les îles creuses nettes
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = t.x + dx, ny = t.y + dy; if (at(nx, ny) || prot.has(nx + "," + ny)) continue;
        let orth = 0, touchOther = false;
        for (const [ex, ey] of N8) {
          const m = at(nx + ex, ny + ey); if (!m) continue;
          if (ex === 0 || ey === 0) orth++;
          if (m.hidden) touchOther = true;
          if (m.isl != null && m.isl !== srcIsl) touchOther = true;
        }
        if (orth === 1 && !touchOther && orgHash(nx * 2.3, ny * 1.7) > 0.64) map[nx + "," + ny] = { x: nx, y: ny, depth: 5, isl: srcIsl };
      }
    }
    // 4) FOSSÉ : supprime tout "bisou de coin" entre deux îles (contact diagonal seul)
    for (const k of Object.keys(map)) {
      const t = map[k]; if (t.isl == null) continue;
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const m = at(t.x + dx, t.y + dy);
        if (m && m.isl != null && m.isl !== t.isl && !at(t.x + dx, t.y) && !at(t.x, t.y + dy)) {
          if (!isProt(t.x, t.y)) { delete map[k]; break; }
          else if (!isProt(m.x, m.y)) { delete map[m.x + "," + m.y]; }
        }
      }
    }
  }

  function buildRoom(cfg) {
    const map = {};
    const put = (x, y, props) => { const k = x + "," + y; map[k] = Object.assign(map[k] || { x, y, depth: 5 }, props); };
    (cfg.islands || []).forEach(([x0, y0, w, h, d], idx) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(x, y, { depth: d || 5, isl: idx });
    });
    (cfg.blocks || []).forEach(([x, y, d]) => put(x, y, { depth: d || 6 }));
    (cfg.holes || []).forEach(([x, y]) => { delete map[x + "," + y]; });
    (cfg.secrets || []).forEach(([x, y]) => put(x, y, { depth: 7, hidden: true }));
    (cfg.arrows || []).forEach(a => put(a.at[0], a.at[1], { arrow: a.dir }));
    (cfg.features || []).forEach(f => { const p = Object.assign({}, f); const at = p.at; delete p.at; put(at[0], at[1], p); });
    // ---- silhouette organique : on grignote des coins et on fait pousser des presqu'îles
    const prot = new Set();
    const addP = (x, y) => prot.add(x + "," + y);
    addP(cfg.entry[0], cfg.entry[1]);
    if (cfg.guide) addP(cfg.guide[0], cfg.guide[1]);
    (cfg.arrows || []).forEach(a => {
      addP(a.at[0], a.at[1]);
      const g = GD[a.dir]; if (g) for (let k = 1; k <= 4; k++) addP(a.at[0] + g[0] * k, a.at[1] + g[1] * k);   // zone d'atterrissage du saut
    });
    (cfg.blocks || []).forEach(b => addP(b[0], b[1]));
    (cfg.features || []).forEach(f => addP(f.at[0], f.at[1]));
    (cfg.islands || []).forEach(([x, y, w, h]) => addP(x + Math.floor(w / 2), y + Math.floor(h / 2)));
    organicize(map, prot);
    const room = {
      id: cfg.id, year: cfg.year, title: cfg.title, bright: !!cfg.bright, voidtrap: !!cfg.voidtrap,
      spawn: { x: cfg.entry[0], y: cfg.entry[1] }, tiles: Object.values(map),
      guide: cfg.guide || null,
    };
    const e = room.tiles.find(t => t.x === cfg.entry[0] && t.y === cfg.entry[1]);
    if (e) e.type = "entry"; else room.tiles.push({ x: cfg.entry[0], y: cfg.entry[1], depth: 5, type: "entry" });
    return room;
  }

  /* ------------------------- AUTRES PERSOS ---------------------------- */
  // Personnages rencontrés sur d'autres îles (ajoute / édite librement).
  const NPCS = {
    archiviste: [
      { speaker: "npc2", emote: "neutral", t: "Halte. Je suis l'archiviste de cette année." },
      { speaker: "npc2", emote: "smug", t: "Je garde les souvenirs que t'as essayé d'oublier." },
      { speaker: "npc2", emote: "wink", t: "Continue. Y'a pire plus loin." },
    ],
    bug: [
      { speaker: "npc2", emote: "blank", t: "...je suis un bug. Coincé ici depuis 2021." },
      { speaker: "npc2", emote: "neutral", t: "Si tu trouves la sortie, dis-leur que j'existais." },
    ],
    fan: [
      { speaker: "npc2", emote: "happy", t: "OH. C'est toi le GOAT ? Trop hype." },
      { speaker: "npc2", emote: "wink", t: "Signe mon front. Non ? Ok. Bonne visite." },
    ],
    critique: [
      { speaker: "npc2", emote: "smug", t: "Franchement, ce musée ? 3 sur 10." },
      { speaker: "npc2", emote: "neutral", t: "Mais le héros est attachant. 4 sur 10." },
    ],
    tresor: [
      { speaker: "npc2", emote: "smug", t: "Hé ! C'est MON île au trésor, ça." },
      { speaker: "npc2", emote: "neutral", t: "T'as fait tout ce chemin pour ça ? Bon..." },
      { speaker: "npc2", emote: "wink", t: "Allez, prends ton butin et va-t'en. Demi-tour, gamin." },
    ],
    clochard: [
      { speaker: "npc2", emote: "neutral", t: "Pssst. Tu cherches un conseil ?" },
      { speaker: "npc2", emote: "smug", t: "Les panneaux mentent. Les flèches, non. Suis les flèches." },
    ],
  };

  /* ===================================================================
     CONSTRUCTEUR DE PARCOURS (multi-îles)
     Les salles sont grandes : on enchaîne plusieurs îles par des sauts.
     Tout est noir au loin : on découvre en avançant.
     =================================================================== */
  // Deltas de grille pour chaque direction iso (cohérent avec le clavier) :
  //   up = haut-gauche · down = bas-droite · left = bas-gauche · right = haut-droite
  const GD = { up: [-1, 0], down: [1, 0], left: [0, 1], right: [0, -1] };

  let _gid = 0;
  function centerOf(i) { return [i.x + Math.floor(i.w / 2), i.y + Math.floor(i.h / 2)]; }
  function usableTiles(i) {
    const cx = i.x + Math.floor(i.w / 2), cy = i.y + Math.floor(i.h / 2);
    const cand = [[cx, cy], [i.x, i.y], [i.x + i.w - 1, i.y], [i.x, i.y + i.h - 1],
    [i.x + i.w - 1, i.y + i.h - 1], [cx, i.y], [i.x, cy]];
    const seen = {}, out = [];
    for (const t of cand) { const k = t[0] + "," + t[1]; if (!seen[k]) { seen[k] = 1; out.push(t); } }
    return out;
  }
  // chaîne d'îles : chaque "leg" pose une île après un trou, le long d'un axe iso.
  function chain(first, legs) {
    const islands = [{ x: first[0], y: first[1], w: first[2], h: first[3] }];
    const arrows = []; let prev = islands[0];
    for (const leg of (legs || [])) {
      const [dx, dy] = GD[leg.k]; const gap = Math.max(2, leg.gap || 2), w = leg.w || 3, h = leg.h || 3, off = leg.off || 0;
      let nx, ny, ax, ay;
      if (dx !== 0) {
        nx = dx < 0 ? prev.x - gap - w : prev.x + prev.w + gap; ny = prev.y + off;
        ay = Math.max(prev.y, ny); ax = dx < 0 ? prev.x : prev.x + prev.w - 1;
      } else {
        ny = dy < 0 ? prev.y - gap - h : prev.y + prev.h + gap; nx = prev.x + off;
        ax = Math.max(prev.x, nx); ay = dy < 0 ? prev.y : prev.y + prev.h - 1;
      }
      arrows.push({ at: [ax, ay], dir: leg.k });
      const isl = { x: nx, y: ny, w, h }; islands.push(isl); prev = isl;
    }
    return { islands, arrows };
  }
  // plateforme cachée lumineuse "dans le vide", révélée quand on l'atteint
  function beacon(src, dir, gap) {
    const [dx, dy] = GD[dir]; gap = gap || 1; let bx, by;
    if (dx !== 0) { bx = dx < 0 ? src.x - gap - 1 : src.x + src.w + gap; by = src.y + Math.floor(src.h / 2); }
    else { by = dy < 0 ? src.y - gap - 1 : src.y + src.h + gap; bx = src.x + Math.floor(src.w / 2); }
    const tiles = [[bx, by], [bx + 1, by], [bx - 1, by], [bx, by + 1], [bx, by - 1]];
    return { beacon: [bx, by], tiles, gid: "g" + (_gid++) };
  }

  // pose une île adjacente à src, dans une direction iso, après un trou (saut).
  function placeAdj(src, dir, gap, w, h, off) {
    const [dx, dy] = GD[dir]; gap = Math.max(2, gap || 2); off = off || 0; w = w || 3; h = h || 3;
    const cx = src.x + Math.floor(src.w / 2), cy = src.y + Math.floor(src.h / 2);
    let nx, ny, ax, ay;
    if (dx !== 0) { nx = dx < 0 ? src.x - gap - w : src.x + src.w + gap; ny = src.y + off; ax = dx < 0 ? src.x : src.x + src.w - 1; ay = cy; }
    else { ny = dy < 0 ? src.y - gap - h : src.y + src.h + gap; nx = src.x + off; ay = dy < 0 ? src.y : src.y + src.h - 1; ax = cx; }
    return { isl: { x: nx, y: ny, w, h }, arrow: { at: [ax, ay], dir } };
  }

  // ====== TRAVERSÉE "pas japonais" =====================================
  // Pose, depuis le bord d'une île, une suite de tuiles dans le vide le long
  // d'un axe iso, puis (optionnel) une petite île à atteindre.
  //   spec.tokens : du bord vers l'extérieur — "." trou · "o" bloc normal · "x" bloc fissuré
  //   spec.dest   : { w, h } île d'arrivée (sinon : juste des blocs perdus dans le vide)
  //   spec.coin   : pose un sou au centre de l'île d'arrivée (ou sur le dernier bloc)
  //   spec.off    : décalage perpendiculaire (pour ne pas empiler plusieurs traversées)
  function crossing(islands, f, spec) {
    const src = islands[spec.from != null ? spec.from : 0]; if (!src) return;
    const [dx, dy] = GD[spec.dir]; const off = spec.off || 0;
    const midx = src.x + Math.floor(src.w / 2), midy = src.y + Math.floor(src.h / 2);
    let bx, by;                                   // case de bord de l'île source sur la ligne
    if (dx !== 0) { bx = dx < 0 ? src.x : src.x + src.w - 1; by = midy + off; }
    else { by = dy < 0 ? src.y : src.y + src.h - 1; bx = midx + off; }
    const tokens = spec.tokens || [];
    let i = 0, lastBlock = null;
    for (const tok of tokens) {
      i++; const tx = bx + dx * i, ty = by + dy * i;
      if (tok === "o") { f.push({ at: [tx, ty], depth: 6 }); lastBlock = [tx, ty]; }
      else if (tok === "x") { f.push({ at: [tx, ty], depth: 6, crumble: true }); lastBlock = [tx, ty]; }
      // "." = trou (rien)
    }
    if (spec.dest) {
      const w = spec.dest.w || 2, h = spec.dest.h || 2;
      const gx = bx + dx * (i + 1), gy = by + dy * (i + 1);   // 1re case de l'île d'arrivée
      let ix, iy;
      if (dx !== 0) { ix = dx < 0 ? gx - (w - 1) : gx; iy = gy - Math.floor(h / 2); }
      else { iy = dy < 0 ? gy - (h - 1) : gy; ix = gx - Math.floor(w / 2); }
      islands.push({ x: ix, y: iy, w, h });
      if (spec.coin) f.push({ at: [ix + Math.floor(w / 2), iy + Math.floor(h / 2)], coin: true });
    } else if (spec.coin && lastBlock) {
      f.push({ at: lastBlock, coin: true });
    }
  }

  // ====== SALLE À ÉNIGME (3 ponts) =====================================
  // Une île-carrefour porte un panneau-énigme (lu par Rémy). De là, 3 ponts :
  //   correct -> continue vers le téléporteur ; dead -> île vide ; hint -> indice + sou.
  function branchRoom(o) {
    const islands = [], arrows = [], f = [];
    const used = {}; const key = (t) => t[0] + "," + t[1];
    const reserve = (t) => { used[key(t)] = 1; return t; };
    const spawn = { x: o.first[0], y: o.first[1], w: o.first[2], h: o.first[3] };
    islands.push(spawn);

    // approche : quelques sauts du spawn jusqu'au carrefour
    let J = spawn;
    (o.approach || []).forEach(leg => { const p = placeAdj(J, leg.k, leg.gap, leg.w, leg.h, leg.off); islands.push(p.isl); arrows.push(p.arrow); J = p.isl; });

    // panneau-énigme au centre du carrefour
    if (o.riddle) { const c = centerOf(J); reserve(c); f.push({ at: c, type: "panel", panel: o.riddle }); }

    // un emplacement libre sur une île (centre sinon coin)
    const spot = (isl) => { const c = centerOf(isl); if (!used[key(c)]) return reserve(c); const alt = [[isl.x, isl.y], [isl.x + isl.w - 1, isl.y + isl.h - 1], [isl.x + isl.w - 1, isl.y], [isl.x, isl.y + isl.h - 1]]; for (const t of alt) if (!used[key(t)]) return reserve(t); return reserve(c); };

    let correctIsl = null;
    (o.branches || []).forEach(br => {
      const p = placeAdj(J, br.dir, br.gap || 2, br.w || 3, br.h || 3, br.off || 0);
      islands.push(p.isl); arrows.push(p.arrow);
      if (br.kind === "correct") correctIsl = p.isl;
      if (br.kind === "dead") f.push({ at: spot(p.isl), type: "panel", panel: br.panel || "p_dead" });
      if (br.kind === "hint") { f.push({ at: spot(p.isl), type: "panel", panel: br.panel || "p_hint_coin" }); if (br.coin !== false) f.push({ at: spot(p.isl), coin: true }); }
      if (br.photo) f.push({ at: spot(p.isl), type: "photo", photo: br.photo[0], caption: br.photo[1] });
      if (br.glasses) f.push({ at: spot(p.isl), type: "glasses", glasses: br.glasses });
    });

    // depuis l'île correcte : éventuels sauts supplémentaires puis téléporteur
    let last = correctIsl || J;
    (o.correctLegs || []).forEach(leg => { const p = placeAdj(last, leg.k, leg.gap, leg.w, leg.h, leg.off); islands.push(p.isl); arrows.push(p.arrow); last = p.isl; });
    const teleAt = centerOf(last); reserve(teleAt);
    f.push({ at: teleAt, type: "teleport", to: o.to, label: o.label, need: o.need, needGlasses: o.needGlasses });
    if (o.photo) f.push({ at: spot(last), type: "photo", photo: o.photo[0], caption: o.photo[1] });

    // bonus caché optionnel (plateforme "foi")
    if (o.secret) {
      const pl = beacon(last, o.secretDir || "left", 1);
      pl.tiles.forEach(t => f.push({ at: t, hidden: true, group: pl.gid, depth: 7 }));
      f.push({ at: pl.beacon, hidden: true, group: pl.gid, depth: 7, type: "glasses", glasses: o.secret });
    }

    // îlots DÉCORATIFS (vides, au loin, juste pour remplir le vide)
    (o.deco || []).forEach(dec => {
      const src = islands[dec.from != null ? dec.from : 0] || spawn;
      const p = placeAdj(src, dec.dir, dec.gap || 3, dec.w || 1, dec.h || 1, dec.off || 0);
      islands.push(p.isl);
      if (dec.coin) f.push({ at: centerOf(p.isl), coin: true });   // parfois un sou perdu, rien de plus
    });
    // TRAVERSÉES "pas japonais" : blocs perdus / ponts fissurés dans le vide
    (o.crossings || []).forEach(cr => crossing(islands, f, cr));

    return buildRoom({
      id: o.id, year: o.year, title: o.title,
      entry: o.spawn, islands: islands.map(i => [i.x, i.y, i.w, i.h]),
      arrows, features: f,
    });
  }

  function yearRoom(o) {
    const ch = chain(o.first, o.legs);
    const isls = ch.islands, spawnIsl = isls[0], mids = isls.slice(1), last = isls[isls.length - 1];
    const f = [], arrows = ch.arrows.slice();
    const used = {}; const key = (t) => t[0] + "," + t[1];
    const reserve = (t) => { used[key(t)] = 1; return t; };

    const teleAt = centerOf(last); used[key(teleAt)] = 1;
    // tuiles INSTABLES : centre d'îles intermédiaires (réservées avant les autres features)
    (o.crumble || []).forEach(idx => { const isl = isls[idx]; if (!isl || isl === last || isl === spawnIsl) return; const c = centerOf(isl); if (!used[key(c)]) { reserve(c); f.push({ at: c, crumble: true }); } });
    const perIsl = mids.map(i => usableTiles(i).filter(t => !used[key(t)]));
    const pool = []; for (let k = 0, go = true; go; k++) { go = false; for (const lst of perIsl) { if (lst[k]) { pool.push(lst[k]); go = true; } } }
    const take = () => { while (pool.length) { const t = pool.shift(); if (!used[key(t)]) return reserve(t); } return centerOf(last); };

    // sortie (dernière île)
    f.push({ at: teleAt, type: "teleport", to: o.to, label: o.label, need: o.need, needGlasses: o.needGlasses });
    // quiz : sur une île QUI N'EST PAS celle du spawn
    if (o.quiz) f.push({ at: take(), type: "quiz", quiz: o.quiz });
    // photos : réparties sur les îles suivantes
    (o.photos || []).forEach(ph => f.push({ at: take(), type: "photo", photo: ph[0], caption: ph[1], locked: ph[2] }));
    // panneau d'apprentissage sur l'île de spawn (près du guide), s'il y en a un
    if (o.spawnPanel) {
      const c = centerOf(spawnIsl); const t = (c[0] !== o.spawn[0] || c[1] !== o.spawn[1]) ? c : [spawnIsl.x, spawnIsl.y];
      f.push({ at: t, type: "panel", panel: o.spawnPanel });
    }
    if (o.panel) f.push({ at: take(), type: "panel", panel: o.panel });
    if (o.extraTele) f.push({ at: take(), type: "teleport", to: o.extraTele, label: "?" });
    if (o.npc) { const t = take(); f.push({ at: t, npc: o.npc, npcColor: o.npcColor || "#7a6cff" }); }
    if (o.merchant) { const t = take(); f.push({ at: t, npc: "merchant", npcColor: "#caa23a", merchant: true, sells: o.merchant }); }
    for (let i = 0; i < (o.coins == null ? 2 : o.coins); i++) f.push({ at: take(), coin: true });

    // lunettes principales : sur un bloc lumineux CACHÉ (révèle une plateforme)
    if (o.glasses) {
      const src = mids[0] || spawnIsl; const pl = beacon(src, o.glassesDir || "right", 1);
      pl.tiles.forEach(t => f.push({ at: t, hidden: true, group: pl.gid, depth: 7 }));
      f.push({ at: pl.beacon, hidden: true, group: pl.gid, depth: 7, type: "glasses", glasses: o.glasses });
      if (o.glassesPanel) f.push({ at: take(), type: "panel", panel: o.glassesPanel });
    }
    // lunettes rares : autre plateforme cachée
    if (o.secret) {
      const pl = beacon(last, o.secretDir || "left", 1);
      pl.tiles.forEach(t => f.push({ at: t, hidden: true, group: pl.gid, depth: 7 }));
      f.push({ at: pl.beacon, hidden: true, group: pl.gid, depth: 7, type: "glasses", glasses: o.secret });
    }

    // îlots DÉCORATIFS : petites plateformes vides, plus loin, atteignables au saut, mais qui ne servent à rien.
    (o.deco || []).forEach(dec => {
      const src = isls[dec.from != null ? dec.from : 0] || spawnIsl;
      const p = placeAdj(src, dec.dir, dec.gap || 3, dec.w || 1, dec.h || 1, dec.off || 0);
      isls.push(p.isl);
      if (dec.coin) f.push({ at: centerOf(p.isl), coin: true });   // parfois un sou perdu, rien de plus
    });
    // TRAVERSÉES "pas japonais" : blocs perdus / ponts fissurés dans le vide
    (o.crossings || []).forEach(cr => crossing(isls, f, cr));

    // TROU DE RACCOURCI : petite jetée séparée (un saut depuis l'île de fin), trou central
    // entre deux panneaux -> on tombe et on retombe "du ciel" dans la salle d'en dessous.
    if (o.drop) {
      const dd = o.drop;
      const p = placeAdj(last, dd.dir || "right", dd.gap || 2, 3, 3, dd.off || 0);
      arrows.push(p.arrow);
      const di = p.isl, ccx = di.x + 1, ccy = di.y + 1;
      for (let yy = di.y; yy < di.y + 3; yy++) for (let xx = di.x; xx < di.x + 3; xx++) {
        if (xx === ccx && yy === ccy) continue;                 // centre = le trou
        f.push({ at: [xx, yy], depth: 6 });                     // sol solide autour (jamais rongé)
      }
      f.push({ at: [ccx, ccy], decor: true, dropHole: true, dropTo: dd.to });
      f.push({ at: [ccx - 1, ccy], type: "panel", panel: "p_drop" });
      f.push({ at: [ccx + 1, ccy], type: "panel", panel: "p_drop2" });
    }

    return buildRoom({
      id: o.id, year: o.year, title: o.title,
      entry: o.spawn, guide: o.guide || null,
      islands: isls.map(i => [i.x, i.y, i.w, i.h]),
      arrows, features: f,
    });
  }

  const ROOMS = {};

  // HUB — salle principale de départ, vide : un tuto. On y rencontre le guide
  // qui donne le compagnon, puis on prend le premier téléporteur vers 2019.
  // Pas de saut ici (verrouillé) : juste s'orienter (flèches) et avancer (espace).
  ROOMS["hub"] = buildRoom({
    id: "hub", year: 2019, title: "Hall d'entrée — Bienvenue", bright: false,
    entry: [3, 3], guide: [5, 3],
    islands: [[0, 1, 9, 5]],
    features: [
      { at: [7, 3], type: "teleport", to: "2019", label: "2019", needCompanion: true },
      // téléporteur de RETOUR vers la galerie : sur la CASE DE DÉPART, apparaît une fois le jeu fini
      { at: [3, 3], type: "teleport", to: "gallery", label: "SOUVENIRS", needFinished: true },
      // EASTER EGG : la 8e paire, sur un bloc bleu DERRIÈRE le spawn, par-dessus le vide.
      // Inatteignable au début (pas de grand saut). On y revient en REJOUANT (saut gardé, sans Rémy).
      { at: [-3, 2], hidden: true, group: "ghub", depth: 6 },
      { at: [-3, 3], hidden: true, group: "ghub", depth: 6 },
      { at: [-3, 4], hidden: true, group: "ghub", depth: 6 },
      { at: [-2, 3], hidden: true, group: "ghub", depth: 6, type: "glasses", glasses: "g_start" },
    ],
  });

  // 2019 — première vraie salle : on arrive du hub, on apprend le saut, les secrets.
  ROOMS["2019"] = yearRoom({
    id: "2019", year: 2019, title: "2019 — Le début des problèmes",
    to: "2020", label: "2020", spawnPanel: "p_jump", glassesPanel: "p_secret", glasses: "g_round", quiz: "q2019",
    photos: [["photo_2019_01", "Le début des problèmes."], ["photo_2019_02", "On aurait dû s'arrêter là."]],
    secret: "g_iconic",
    merchant: "g_round", coins: 4,
    deco: [{ from: 0, dir: "down", gap: 4, w: 2, h: 2 }, { from: 0, dir: "right", gap: 5, w: 1, h: 1, coin: true }],
    crossings: [
      { from: 0, dir: "right", off: -2, tokens: [".", ".", "o", ".", "."], dest: { w: 2, h: 2 }, coin: true },
      { from: 0, dir: "down", off: -1, tokens: [".", "x", "o", "x", "."], dest: { w: 2, h: 2 }, coin: true },
    ],
    first: [6, 6, 4, 4], spawn: [9, 9],
    legs: [{ k: "up", gap: 2, w: 3, h: 3 }, { k: "left", gap: 2, w: 4, h: 3 }],
    glassesDir: "right", secretDir: "left"
  });

  // 2020 — ÉNIGME 3 ponts. Le bon (haut-gauche) mène au téléporteur ;
  // mais il faut les lunettes carrées, cachées sur le pont-indice (haut-droite).
  ROOMS["2020"] = branchRoom({
    id: "2020", year: 2020, title: "2020 — On a survécu, purée",
    to: "2021", label: "2021", needGlasses: "g_square",
    first: [7, 11, 3, 3], spawn: [8, 12],
    approach: [{ k: "up", gap: 2, w: 4, h: 4 }],
    deco: [{ from: 0, dir: "down", gap: 4, w: 1, h: 1, coin: true }, { from: 0, dir: "down", gap: 7, w: 2, h: 2 }],
    crossings: [
      { from: 0, dir: "down", off: 1, tokens: [".", "x", "o", "x", "."], dest: { w: 2, h: 2 }, coin: true },
      { from: 0, dir: "down", off: -2, tokens: [".", ".", "o"], coin: true },
    ],
    riddle: "p_riddle_2020",
    branches: [
      { dir: "up", kind: "correct", w: 4, h: 3, gap: 2, photo: ["photo_2020_01", "Confinés mais c'est le début de tout."] },
      { dir: "left", kind: "dead", w: 3, h: 3, gap: 2, panel: "p_void" },
      { dir: "right", kind: "hint", w: 3, h: 3, gap: 2, panel: "p_hint_coin", glasses: "g_square" },
    ],
  });

  // 2021 — direction bas-droite puis haut-droite. Île longue, bug coincé.
  ROOMS["2021"] = yearRoom({
    id: "2021", year: 2021, title: "2021 — Le néant productif",
    to: "2022", label: "2022", panel: "p_glasses", glasses: "g_thin", quiz: "q2021", extraTele: "egg1",
    photos: [["photo_2021_01", "On faisait rien. Magnifiquement."]], npc: "bug", npcColor: "#39c08a",
    crumble: [1],
    deco: [{ from: 0, dir: "up", gap: 4, w: 1, h: 1 }, { from: 0, dir: "left", gap: 4, w: 2, h: 1 },
    { from: 0, dir: "up", gap: 7, w: 1, h: 1, off: 2, coin: true }],
    crossings: [
      { from: 0, dir: "up", off: -1, tokens: [".", "x", "x", "o", "x", "x", "."], dest: { w: 2, h: 2 }, coin: true },
      { from: 0, dir: "left", off: 2, tokens: [".", ".", "o", ".", "."], dest: { w: 2, h: 2 }, coin: true },
    ],
    drop: { dir: "down", gap: 2, to: "2020" },
    first: [6, 6, 4, 4], spawn: [6, 9],
    legs: [{ k: "down", gap: 1, w: 3, h: 4 }, { k: "right", gap: 2, w: 4, h: 3 }],
    glassesDir: "down"
  });

  // 2022 — parkour de dossiers + panneaux pièges (qui ne servent à rien).
  ROOMS["2022"] = yearRoom({
    id: "2022", year: 2022, title: "2022 — L'année des dossiers",
    to: "2023", label: "2023", spawnPanel: "p_teleport", panel: "p_useless1", glassesPanel: "p_bridge", glasses: "g_thick", extraTele: "parkour",
    photos: [["photo_2022_01", "Une photo que la justice devrait interdire."], ["photo_2022_02", "Dossier classé — Maxime."]],

    coins: 3,
    merchant: "g_thick",
    deco: [{ from: 0, dir: "up", gap: 4, w: 2, h: 2 }, { from: 0, dir: "up", gap: 8, w: 1, h: 1, off: 3, coin: true }],
    crossings: [
      { from: 0, dir: "up", off: -1, tokens: [".", "x", "o", "x", "."], dest: { w: 2, h: 2 }, coin: true },
      { from: 0, dir: "right", off: -2, tokens: [".", ".", "o", ".", "."], dest: { w: 2, h: 2 }, coin: true },
    ],
    drop: { dir: "left", gap: 2, to: "2021" },
    first: [8, 6, 4, 4], spawn: [11, 9],
    legs: [{ k: "left", gap: 1, w: 3, h: 3 }, { k: "left", gap: 2, w: 4, h: 3 }],
    glassesDir: "down"
  });

  // 2023 — ÉNIGME 3 ponts (plus dure). Le bon = bas-droite.
  ROOMS["2023"] = branchRoom({
    id: "2023", year: 2023, title: "2023 — On a presque grandi",
    to: "2024", label: "2024",
    first: [3, 4, 3, 3], spawn: [4, 5],
    approach: [{ k: "left", gap: 2, w: 4, h: 4 }],
    deco: [{ from: 0, dir: "right", gap: 4, w: 1, h: 1, coin: true }, { from: 0, dir: "up", gap: 6, w: 2, h: 2 }],
    crossings: [
      { from: 0, dir: "up", off: -1, tokens: [".", "x", "o", "x", "."], dest: { w: 2, h: 2 }, coin: true },
      { from: 0, dir: "right", off: 2, tokens: [".", ".", "o"], coin: true },
    ],
    riddle: "p_riddle_2023",
    branches: [
      { dir: "down", kind: "correct", w: 4, h: 3, gap: 2, photo: ["photo_2023_01", "Presque des adultes. Presque."] },
      { dir: "left", kind: "dead", w: 3, h: 3, gap: 2, panel: "p_useless2" },
      { dir: "right", kind: "hint", w: 3, h: 3, gap: 2, panel: "p_hint_dead", coin: true },
    ],
    secret: "g_2024", secretDir: "down"
  });

  // 2024 — épreuve QUIZ + petit parkour. Pic de drip.
  ROOMS["2024"] = yearRoom({
    id: "2024", year: 2024, title: "2024 — Le drip maximal",
    to: "2025", label: "2025", panel: "p_useless3", quiz: "q2024", npc: "fan", npcColor: "#f4a93f",
    photos: [["photo_2024_01", "Pic de style. Documenté."]],
    crumble: [1],
    merchant: "g_square", coins: 3,
    deco: [{ from: 0, dir: "up", gap: 4, w: 1, h: 1 }, { from: 0, dir: "up", gap: 8, w: 2, h: 2, off: 2, coin: true }],
    crossings: [
      { from: 0, dir: "left", off: 0, tokens: [".", "x", "x", "o", "x", "x", "."], dest: { w: 2, h: 2 }, coin: true },
      { from: 0, dir: "up", off: -2, tokens: [".", ".", "o", ".", "."], dest: { w: 2, h: 2 }, coin: true },
    ],
    drop: { dir: "down", gap: 2, to: "2023" },
    first: [6, 6, 4, 4], spawn: [9, 9],
    legs: [{ k: "right", gap: 1, w: 3, h: 4 }, { k: "down", gap: 2, w: 4, h: 3 }],
    glassesDir: "right"
  });

  // 2025 — ÉNIGME finale (3 ponts). Le bon = haut-droite. Besoin de 3 lunettes.
  ROOMS["2025"] = branchRoom({
    id: "2025", year: 2025, title: "2025 — Salle des iconiques",
    to: "final", label: "FIN", need: 3,
    first: [4, 11, 3, 3], spawn: [5, 12],
    approach: [{ k: "up", gap: 2, w: 4, h: 4 }],
    deco: [{ from: 0, dir: "down", gap: 4, w: 1, h: 1, coin: true }, { from: 0, dir: "down", gap: 8, w: 2, h: 2 }],
    crossings: [
      { from: 0, dir: "down", off: 1, tokens: [".", "x", "o", "x", "."], dest: { w: 2, h: 2 }, coin: true },
      { from: 0, dir: "down", off: -2, tokens: [".", ".", "o"], coin: true },
    ],
    riddle: "p_riddle_2025",
    branches: [
      { dir: "right", kind: "correct", w: 4, h: 3, gap: 2, photo: ["photo_2025_01", "8 ans après, toujours aussi cramé."] },
      { dir: "left", kind: "dead", w: 3, h: 3, gap: 2, panel: "p_dead" },
      { dir: "up", kind: "hint", w: 3, h: 3, gap: 2, panel: "p_useless4", coin: true },
    ],
  });

  // ---- SALLE FINALE ---- (grande île lumineuse, mur de photos, objectif au centre)
  ROOMS["final"] = buildRoom({
    id: "final", year: 2026, title: "Salle Finale — Joyeux anniversaire", bright: true,
    entry: [4, 8], islands: [[1, 1, 7, 7]], holes: [[1, 1], [7, 1], [1, 7], [7, 7]],
    arrows: [{ at: [4, 7], dir: "right" }, { at: [4, 6], dir: "right" }, { at: [4, 5], dir: "right" }],
    features: [
      { at: [2, 1], type: "photo", photo: "photo_final_01", caption: "2019." },
      { at: [3, 1], type: "photo", photo: "photo_final_02", caption: "2022." },
      { at: [5, 1], type: "photo", photo: "photo_final_03", caption: "2025." },
      { at: [6, 1], type: "photo", photo: "photo_final_04", caption: "Toi & moi." },
      { at: [4, 4], type: "goal" },
      // RETOUR GALERIE : téléporteur au centre du fond, apparaît une fois le jeu fini.
      { at: [4, 1], type: "teleport", to: "gallery", label: "SOUVENIRS", needFinished: true },
      // EASTER EGG : 8e paire cachée sur un bloc bleu hors de l'île (petit saut latéral)
      { at: [-1, 3], hidden: true, group: "gfin", depth: 6 },
      { at: [-1, 5], hidden: true, group: "gfin", depth: 6 },
      { at: [-1, 4], hidden: true, group: "gfin", depth: 6, type: "glasses", glasses: "g_final" },
    ],
  });

  // ====== EASTER EGGS : chaîne d'îles vides + piège du vide =============
  ROOMS["egg1"] = buildRoom({
    id: "egg1", year: 0, title: "Île de... rien", bright: false,
    entry: [2, 2], islands: [[1, 1, 4, 4]],
    features: [
      { at: [2, 3], type: "panel", panel: "p_egg_empty" },
      { at: [3, 3], type: "teleport", to: "egg2", label: "???" },
    ],
  });
  ROOMS["egg2"] = buildRoom({
    id: "egg2", year: 0, title: "Toujours rien (vraiment)", bright: false,
    entry: [2, 2], islands: [[1, 1, 5, 4]],
    features: [
      { at: [2, 3], type: "panel", panel: "p_egg_empty2" },
      { at: [1, 1], coin: true }, { at: [5, 1], coin: true }, { at: [1, 4], coin: true }, { at: [5, 4], coin: true },
      { at: [4, 2], npc: "tresor", npcColor: "#c9a23a" },
      { at: [3, 4], type: "teleport", to: "eggvoid", label: "???" },
    ],
  });
  // le piège : un seul bloc au milieu du vide -> on tombe en boucle, choix de Rémy
  ROOMS["eggvoid"] = buildRoom({
    id: "eggvoid", year: 0, title: "...", bright: false, voidtrap: true,
    entry: [0, 0], islands: [[0, 0, 1, 1]],
    features: [],
  });

  // ====== SALLE UTILE : PARKOUR CHRONOMÉTRÉ ============================
  // Case ROUGE (reveal) -> révèle les blocs fantômes + lance le chrono.
  // Faut atteindre l'île de fin avant la fin du temps, sinon les blocs
  // disparaissent et on retombe à la case rouge. Le PNJ de fin révèle la
  // sortie (téléporteur). 3 blocs isolés à sauter : 2, 3 puis 2 cases.
  ROOMS["parkour"] = (function () {
    const f = [];
    // -- plateforme de DÉPART (3x3 solide, jamais rongée car en "blocks/features") --
    for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2; y++) f.push({ at: [x, y], depth: 6 });
    f.push({ at: [2, 1], type: "reveal" });                       // case ROUGE = lance le chrono

    // -- pierres de saut : apparaissent au chrono, et RESTENT en place après réussite --
    // Chemin sinueux :
    // saut 1 de [2,1] à [6,1] (longueur 4, direction down)
    f.push({ at: [6, 1], phantom: true, group: "pk", depth: 6, hidden: true });
    // saut 2 de [6,1] à [6,5] (longueur 4, direction left)
    f.push({ at: [6, 5], phantom: true, group: "pk", depth: 6, hidden: true });
    // saut 3 de [6,5] à [10,5] (longueur 4, direction down)
    f.push({ at: [10, 5], phantom: true, group: "pk", depth: 6, hidden: true });
    // saut 4 de [10,5] à [10,1] (longueur 4, direction right)
    f.push({ at: [10, 1], phantom: true, group: "pk", depth: 6, hidden: true });
    // saut 5 de [10,1] à [13,1] (longueur 3, direction down - atterrit dans l'EndZone)

    // -- grande plateforme d'ARRIVÉE, ÉQUILIBRÉE autour du bonhomme [14,1] (5x5 solide) --
    for (let x = 13; x <= 17; x++) for (let y = -1; y <= 3; y++) f.push({ at: [x, y], depth: 6, pkEndZone: true });
    f.push({ at: [14, 1], npc: "clochard", npcColor: "#8c96ff" });
    f.push({ at: [15, 1], type: "teleport", to: "2023", label: "OK", needTalk: true });

    // -- pont de RETOUR : comble les trous entre les pierres, révélé à la réussite --
    const pkStones = new Set(["6,1", "6,5", "10,5", "10,1"]);
    const bridgeTiles = [];
    
    // Chemin horizontal de retour x=3..6, y=1 (largeur 3, y=0..2)
    for (let x = 3; x <= 6; x++) for (let y = 0; y <= 2; y++) bridgeTiles.push([x, y]);
    // Liaison verticale x=6, y=2..4
    for (let x = 5; x <= 7; x++) for (let y = 2; y <= 4; y++) bridgeTiles.push([x, y]);
    // Liaison horizontale x=7..10, y=5
    for (let x = 7; x <= 10; x++) for (let y = 4; y <= 6; y++) bridgeTiles.push([x, y]);
    // Liaison verticale x=10, y=2..4
    for (let x = 9; x <= 11; x++) for (let y = 2; y <= 4; y++) bridgeTiles.push([x, y]);
    // Liaison finale vers l'EndZone x=11..12, y=1
    for (let x = 11; x <= 12; x++) for (let y = 0; y <= 2; y++) bridgeTiles.push([x, y]);

    const added = new Set();
    bridgeTiles.forEach(([bx, by]) => {
      const key = bx + "," + by;
      if (pkStones.has(key) || added.has(key)) return;
      added.add(key);
      f.push({ at: [bx, by], retBridge: true, hidden: true, group: "pkret", depth: 6 });
    });

    return buildRoom({
      id: "parkour", year: "P", title: "Salle du Parkour — case rouge = chrono", bright: false,
      entry: [1, 1], islands: [], features: f,
    });
  })();

  // ====== GALERIE DES SOUVENIRS (musée 3D à parcourir) =================
  // Long couloir iso éclairé. Photos debout sur les côtés, photos SUSPENDUES
  // au-dessus du vide (cordes du plafond), vitrines de lunettes, carte.
  // room.exhibits = liste ordonnée -> boutons Suivant / Précédent.
  function buildGallery() {
    const map = {};
    const put = (x, y, p) => { map[x + "," + y] = Object.assign(map[x + "," + y] || { x, y, depth: 4 }, p); };
    const glasses = Object.keys(GLASSES);

    // Dynamically filter out duplicate photos from the gallery based on image path
    const uniqueGalleryPhotos = [];
    const seenImagePaths = new Set();
    GALLERY_PHOTOS.forEach(gp => {
      const photoId = gp[0];
      const imgPath = PHOTO_PATHS[photoId];
      if (imgPath) {
        const lowerPath = imgPath.toLowerCase();
        if (!seenImagePaths.has(lowerPath)) {
          seenImagePaths.add(lowerPath);
          uniqueGalleryPhotos.push(gp);
        }
      } else {
        uniqueGalleryPhotos.push(gp);
      }
    });

    // contenu : carte, puis photos uniquement
    const items = [{ kind: "map" }];
    let pi = 0;
    while (pi < uniqueGalleryPhotos.length) {
      items.push({ kind: "photo", photo: uniqueGalleryPhotos[pi][0], caption: uniqueGalleryPhotos[pi][1] });
      pi++;
    }
    const startX = 2, step = 2, len = startX + items.length * step + 3;
    for (let x = 0; x < len; x++) for (let y = 0; y < 3; y++) put(x, y, { depth: 4, bright: true });
    const exhibits = [];
    items.forEach((it, i) => {
      const x = startX + i * step, place = i % 3, ex = { x, view: [x, 1] };
      if (it.kind === "glass") {
        put(x, 2, { type: "glassdisp", glasses: it.glasses });
        Object.assign(ex, { kind: "glass", glasses: it.glasses, caption: GLASSES[it.glasses].name, tile: [x, 2] });
      } else if (it.kind === "map") {
        put(x, 0, { type: "photo", photo: "map", caption: "La carte du musée — tout ce que t'as foulé." });
        Object.assign(ex, { kind: "map", photo: "map", caption: "La carte du musée", tile: [x, 0] });
      } else {
        if (place === 1) put(x, -2, { type: "photo", photo: it.photo, caption: it.caption, hang: true, decor: true, depth: 5 }), ex.tile = [x, -2];
        else if (place === 2) put(x, 2, { type: "photo", photo: it.photo, caption: it.caption }), ex.tile = [x, 2];
        else put(x, 0, { type: "photo", photo: it.photo, caption: it.caption }), ex.tile = [x, 0];
        Object.assign(ex, { kind: "photo", photo: it.photo, caption: it.caption });
      }
      if (i % 2 === 0) put(x, 1, { arrow: "down", depth: 4, bright: true });   // flèches "avance"
      exhibits.push(ex);
    });
    put(0, 1, { type: "entry" });
    map["0,1"].depth = 4; map["0,1"].bright = true;
    // téléporteur de SORTIE au bout du long chemin -> retour au hub (salle principale)
    const endX = startX + items.length * step + 1;
    put(endX, 1, { type: "teleport", to: "hub", label: "RETOUR" });
    for (let y = 0; y < 3; y++) put(endX, y, { depth: 4, bright: true });
    exhibits.push({ x: endX, view: [endX, 1], tile: [endX, 1], kind: "exit", caption: "Retour à la salle principale" });
    return {
      id: "gallery", year: 2026, title: "Galerie des souvenirs", bright: true, gallery: true,
      spawn: { x: 0, y: 1 }, tiles: Object.values(map), _index: null, exhibits
    };
  }
  ROOMS["gallery"] = buildGallery();

  const ORDER = ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "final"];
  return { META, GLASSES, GALLERY_PHOTOS, PHOTO_PATHS, PANELS, DIALOGUE, QUIZZES, NPCS, FALL_LINES, FALL_5X, CHECKPOINT_LINES, IDLE_LINE, ROOMS, ORDER, START: "hub" };
})();
