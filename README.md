# 🐾 PawCade

Nine small cat-themed games in one static site. No build step, no dependencies, no accounts. Best scores are saved in the browser's `localStorage`.

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

The platform also has search, a random game button, sound effects with a mute switch and a light/dark theme.

## Run locally

Open `index.html` in a browser, or serve the folder:

```powershell
python -m http.server 8000
```

Then visit http://localhost:8000.

## Project structure

```
index.html     page shell and script loading
style.css      theme tokens and styles for the platform and all games
app.js         game registry, grid, search, dialog, best scores, theme
games/*.js     one self-contained file per game
```

## Add a game

Create `games/yourgame.js`, add a `<script defer src="games/yourgame.js"></script>` line to `index.html`, and register it:

```js
Pawcade.register({
  id: 'yourgame', title: 'Your Game', emoji: '🐈', tags: 'search words',
  blurb: 'One sentence about the game.',
  mount(el, api) {
    // build the game inside `el`; call api.score(n) to record a score
    return () => { /* cleanup: timers, event listeners */ };
  }
});
```

## Deploy on GitHub Pages

Repository **Settings → Pages → Build and deployment**: source **Deploy from a branch**, branch `main`, folder `/ (root)`.

## License

MIT, see [LICENSE](LICENSE).
