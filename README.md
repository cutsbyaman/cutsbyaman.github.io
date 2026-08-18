# Cuts by Aman

Portfolio site for GitHub Pages. Plain HTML, CSS and JavaScript, no build step
and no dependencies. Push to the repo and it's live.

```
index.html        home: hero, tools, projects, testimonials, contact
about-me.html     about page
config.js         >>> all content lives here <<<
assets/css        stylesheet
assets/js         rendering + carousels + autoplay
assets/fonts      Satoshi + Instrument Serif, self-hosted
assets/media      videos, portrait, client avatars
```

## Adding a video

Open `config.js`, find the group you want, add one line:

```js
{ label: "Brand Work", videos: [
    { src: "https://youtu.be/dQw4w9WgXcQ", title: "Client name" },
] },
```

`src` takes any of these, pasted straight from the browser:

| Form | Example |
| --- | --- |
| Watch URL | `https://www.youtube.com/watch?v=VIDEO_ID` |
| Short URL | `https://youtu.be/VIDEO_ID` |
| Shorts URL | `https://www.youtube.com/shorts/VIDEO_ID` |
| Bare ID | `VIDEO_ID` |
| Local file | `assets/media/clip.mp4` |

`title` is optional. A group with an empty `videos: []` list hides itself, and a
section whose groups are all empty hides too, so nothing half-built ever shows.

The six groups are fixed in config as: Short-form (Brand Work, AI Work, Personal
Content) at 9:16, and Long-form (Motion Design, Brand Work, AI Video) at 16:9.
Rename or reorder them freely, they're just entries in the file.

## How playback works

One row plays at a time. Whichever labelled row sits nearest the middle of the
screen has its visible cards playing, muted and looping; every other row is
paused, including rows you have already scrolled through. Scrolling hands
playback from one row to the next. Clicking a card turns the sound on and shows
the player controls.

A card you have deliberately unmuted is the exception: it keeps playing as you
scroll away from its row, until it leaves the screen entirely.

Only one thing on the page is ever audible. Turning the sound on for a card
mutes whatever was playing before it, testimonials included, and starting a
testimonial mutes any card. Sound is also temporary: scroll an unmuted card out
of view and it drops back to silent autoplay, so returning to it later never
restarts audio you had moved on from.

Only the cards you can actually see load a player, so a page of twenty videos
doesn't open twenty YouTube embeds at once. Off-screen cards show a thumbnail.

Set `autoplay: false` on a section in `config.js` if you'd rather that section
showed click-to-play thumbnails instead.

Anyone browsing with "reduce motion" turned on gets thumbnails and a play
button rather than moving video.

## The opening animation

The home page opens on a black card. The words land one at a time, a signature
writes itself stroke by stroke, it holds for a beat, then the card lifts away.
Roughly 4 seconds start to finish.

```js
intro: {
  enabled: true,
  oncePerSession: false,  // true = only on the first visit of a session
},
```

Set `oncePerSession: true` if replaying it on every return to the home page
gets tiring. Visitors browsing with "reduce motion" turned on skip it entirely.

The whole sequence is CSS keyframes, so the card clears itself even if the
JavaScript fails to load. The wording and the signature artwork live in
`index.html`, not in config, since the signature is a hand-drawn SVG.

Each pen stroke is its own `<path>` carrying a `--delay` and `--dur`, sized to
that stroke's length so they run back to back as one continuous hand. They have
to be separate paths: SVG restarts a dash pattern at every subpath, so one path
with `M` jumps in it draws its letters out of order. If you retime them, keep
each stroke's delay equal to the previous stroke's delay plus its duration.

## The hero

`hero.availability` fills the pill with the pulsing green dot, so say when
you're actually free to take work. `hero.badge` is the small credential tag on
the portrait; set it to `""` to hide it.

The three numbers under the buttons are the first three entries of `stats`, the
same ones the section further down uses, so they only need editing once.

## Other things in config.js

Hero copy, tools marquee, stats row, testimonials, social links, the Calendly
URL, and the About page bio and skills.

`about.experience` and `about.education` start empty, which hides those two
sections. Fill them in and they appear:

```js
experience: [
  { date: "2024 - Present", role: "Freelance Video Editor",
    org: "Cuts by Aman", type: "Self-employed", description: "..." },
],
```

## Running it locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. A plain server is needed rather than opening
the file directly, otherwise the video embeds won't load.
