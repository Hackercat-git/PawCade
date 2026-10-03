// sprites.js — shared pixel-art sprite system for PawCade
// Each sprite is an array of equal-length strings.
// One char = one logical pixel. '.' = transparent.
window.Sprites = (() => {

  // ── Colour palette ─────────────────────────────────────────────────
  const P = {
    '.': null,
    // universal outline
    k: '#1a0d06',
    // orange cat
    o: '#e89038',  // body
    s: '#b06015',  // stripe / shadow
    w: '#f5e8d0',  // cream muzzle / white
    i: '#f2b0a0',  // inner ear
    e: '#44cc44',  // eye green
    E: '#2a8a2a',  // eye pupil / dark
    n: '#e87070',  // nose pink
    // gray cat (P2)
    G: '#b8b8b8',  // gray body
    g: '#707070',  // gray stripe / shadow
    // fish / food
    B: '#4488e8',  // fish body blue
    F: '#1e4aaa',  // fish dark fin / scale
    // yarn ball
    Y: '#d42888',  // yarn dark pink
    y: '#ff80cc',  // yarn light pink
    // paw pad
    p: '#cc6858',  // paw pad / toe
    // coin / collectible
    c: '#ffcc22',  // gold
    C: '#c89600',  // gold dark
    // fish tail accent
    T: '#66aaff',  // tail highlight
    // dog (obstacle in Dash)
    D: '#c8824a',  // dog brown
    d: '#8a4a20',  // dog dark brown
  };

  // ── Sprite definitions ─────────────────────────────────────────────
  // Cat: 12 wide × 10 tall, side-facing right
  const CAT = [
    '...kk..kk...',
    '..kiik.kik..',
    '..kk..kkkk..',
    '..koooooookk',
    '..koeoonoook',
    '..koeoowwook',
    '..kkkwwwsook',
    '...ksoosook.',
    '...kooooook.',
    '...kk..kk...',
  ];

  // Gray cat: same silhouette, gray palette
  const CAT_GRAY = [
    '...kk..kk...',
    '..kGGk.kGk..',
    '..kk..kkkk..',
    '..kGGGGGGGkk',
    '..kGeGGnGGGk',
    '..kGeGGwwGGk',
    '..kkkwwwgGGk',
    '...kgGGgGGk.',
    '...kGGGGGGk.',
    '...kk..kk...',
  ];

  // Fish: 10 wide × 9 tall, facing left
  const FISH = [
    '....kk....',
    '...kBBk...',
    '..kBFBBk..',
    '.kBwBBBkTk',
    'kFBBBBBBTk',
    '.kBwBBBkTk',
    '..kBFBBk..',
    '...kBBk...',
    '.kk....kk.',
  ];

  // Yarn ball: 8 wide × 8 tall
  const YARN = [
    '..kkkk..',
    '.kYyYyk.',
    'kYyYYyYk',
    'kYYyyyYk',
    'kyYYYyyk',
    'kYyyYYYk',
    '.kYyYyk.',
    '..kkkk..',
  ];

  // Paw print: 8 wide × 7 tall
  const PAW = [
    '.kk.kk..',
    'kppkkppk',
    '.kk.kk..',
    '..kppk..',
    '.kppppk.',
    'kppppppk',
    '.kkkkkk.',
  ];

  // Gold coin: 6 wide × 6 tall
  const COIN = [
    '..kkkk',
    '.kcCCk',
    'kcCcCk',
    'kCcCck',
    '.kcCck',
    '..kkkk',
  ];

  // Dog obstacle (for Dash): 10 wide × 9 tall
  const DOG = [
    '.....kk...',
    '....kDDk..',
    '...kDDdDk.',
    '..kDDDDDk.',
    '.kDDDDDDDk',
    'kDdDDDdDDk',
    '.kDDkDDk..',
    '.kk.....k.',
    '........k.',
  ];

  const DEFS = {
    cat:     CAT,
    catGray: CAT_GRAY,
    fish:    FISH,
    yarn:    YARN,
    paw:     PAW,
    coin:    COIN,
    dog:     DOG,
  };

  // ── Renderer ────────────────────────────────────────────────────────
  // draw(ctx, name, cx, cy, px, flipX)
  //   cx / cy  — centre of the sprite in canvas coords
  //   px       — size of each logical pixel in canvas pixels (integer, ≥1)
  //   flipX    — mirror horizontally (for leftward-facing sprites)
  function draw(ctx, name, cx, cy, px, flipX) {
    const rows = DEFS[name];
    if (!rows) return;
    px = Math.max(1, px | 0);
    const rh = rows.length, rw = rows[0].length;
    const ox = Math.round(cx - rw * px / 2);
    const oy = Math.round(cy - rh * px / 2);

    ctx.save();
    if (flipX) {
      // mirror around cx
      ctx.translate(cx * 2, 0);
      ctx.scale(-1, 1);
    }
    for (let r = 0; r < rh; r++) {
      for (let c = 0; c < rw; c++) {
        const col = P[rows[r][c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(ox + c * px, oy + r * px, px, px);
      }
    }
    ctx.restore();
  }

  // Returns the pixel-art size {w, h} of a sprite (logical pixels, before scaling)
  function size(name) {
    const rows = DEFS[name];
    if (!rows) return { w: 0, h: 0 };
    return { w: rows[0].length, h: rows.length };
  }

  return { draw, size };
})();
