# 🐾 PawCade

28 small cat-themed games in one static site. No build step, no dependencies, no accounts. Best scores are saved in the browser's `localStorage`. Installable as a PWA.

**Play online:** https://hackercat-git.github.io/PawCade/

## Games

| Game | What you do |
| --- | --- |
| Cat Snake | Eat fish, grow longer, avoid your own tail |
| Whack-a-Mouse | Tap the mice before they hide (30 seconds) |
| Meowmory | Match eight pairs of cats in as few moves as possible |
| Cat 2048 | Slide and merge tiles to reach 2048 |
| Wordcat | Guess the five-letter word in six tries |
| Zen Cat | No goal: pet the cat and listen to it purr |
| Flappy Cat | Tap to flap and squeeze between the scratching posts |
| Fish Catcher | Catch falling fish in the basket, dodge the boots |
| Paddle Pounce | Pong against the computer, you lose after 3 misses |
| Pong 2P | Local two-player pong |
| Breakout | Smash bricks with a bouncing ball |
| Dash Cat | Auto-runner — jump over obstacles |
| Simon Says | Repeat the colour sequence |
| Asteroids | Shoot rocks in space (with a cat ship) |
| Typing Cat | Type the falling words before they hit the ground |
| Slide Puzzle | Slide tiles to restore the picture |
| Yarn Duel | Tug-of-war with yarn |
| Stack | Stack blocks as high as you can |
| Darts | Throw darts at a moving board |
| Tug of War | Button-mashing tug-of-war |
| Sea Battle | Battleship vs the computer |
| Checkers | Classic draughts |
| Chess | Full chess against a basic AI |
| Cat Jump | Jump from platform to platform |
| Balloon | Pop balloons before they escape |
| Fish Slap | Slap fish out of the air |
| GravCat | Flip gravity to navigate the cat |
| Cat Pinball | Pinball with a cat theme |

## Run locally

Open `index.html` in a browser, or serve the folder:

```powershell
python -m http.server 8000
```

Then visit http://localhost:8000.

## Project structure

```
index.html          page shell and script loading
style.css           theme tokens and styles for the platform and all games
app.js              game registry, grid, search, dialog, best scores, theme
manifest.json       PWA manifest (icons, display mode, theme colours)
sw.js               service worker — stale-while-revalidate for offline play
games/sprites.js    shared sprite drawing helpers
games/thumbnails.js pre-drawn canvas thumbnails for the game grid
games/*.js          one self-contained file per game (28 total)
icons/              PWA icons (192 × 192 and 512 × 512 PNG)
```

## Add a game

Create `games/yourgame.js`, add a `<script defer src="games/yourgame.js"></script>` line to `index.html`, and register it:

```js
Pawcade.register({
  id: 'yourgame',
  title: 'Your Game',
  emoji: '🐈',
  tags: ['arcade', 'one-button'],   // used for category tabs and search
  blurb: 'One sentence about the game.',
  mount(el, api) {
    // build the game inside `el`
    // call api.score(n) to record a score and update the best-score display
    // call api.beep(freq, duration, type) for sound effects
    return () => { /* cleanup: cancel timers, remove event listeners */ };
  }
});
```

Available category tags: `arcade`, `puzzle`, `word`, `chill`, `versus` (and their synonyms — see `TAG_MAP` in `app.js`).

## Deploy on GitHub Pages

Repository **Settings → Pages → Build and deployment**: source **Deploy from a branch**, branch `main`, folder `/ (root)`.

## License

MIT, see [LICENSE](LICENSE).
