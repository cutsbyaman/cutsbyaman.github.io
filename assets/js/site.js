/* ==========================================================================
   Cuts by Aman - rendering + behaviour
   Everything here is driven by config.js. You shouldn't need to edit this file
   to add videos, testimonials or tools.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG;
  if (!CFG) { console.error("config.js did not load"); return; }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Helpers ----------------------------------------------------------- */

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (kid) {
      if (kid) node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function mount(id, node) {
    var host = document.getElementById(id);
    if (host && node) host.appendChild(node);
    return host;
  }

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Wraps the accent phrase in the serif face. If the phrase already sits inside
  // the headline it is highlighted in place; otherwise it is added to the end.
  function withAccent(text, accent) {
    var safe = esc(text);
    if (!accent) return safe;
    var a = esc(accent);
    var serif = '<span class="serif">' + a + "</span>";
    var i = safe.toLowerCase().lastIndexOf(a.toLowerCase());
    if (i < 0) return safe + " " + serif;
    return safe.slice(0, i) + serif + safe.slice(i + a.length);
  }

  /* --- Video source parsing ---------------------------------------------- */
  // Accepts a full YouTube URL in any shape, a bare 11-char ID, or a file path.

  var YT_PATTERNS = [
    /(?:youtube\.com|youtube-nocookie\.com)\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
  ];

  function parseSource(src) {
    var s = String(src || "").trim();
    if (!s) return null;

    for (var i = 0; i < YT_PATTERNS.length; i++) {
      var m = s.match(YT_PATTERNS[i]);
      if (m) return { kind: "youtube", id: m[1] };
    }
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { kind: "youtube", id: s };
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(s)) return { kind: "file", src: s };

    console.warn('Unrecognised video source, skipped: "' + s + '"');
    return null;
  }

  function ytEmbed(id, opts) {
    var p = [
      "playsinline=1",
      "rel=0",
      "modestbranding=1",
      "enablejsapi=1",
      "loop=1",
      "playlist=" + id,
      "cc_load_policy=0",   // no burnt-in auto captions
      "iv_load_policy=3",   // no annotation cards
      "disablekb=1",
      "fs=0",
      "autoplay=" + (opts.autoplay ? 1 : 0),
      "mute=" + (opts.muted ? 1 : 0),
      "controls=" + (opts.controls ? 1 : 0),
    ];
    return "https://www.youtube-nocookie.com/embed/" + id + "?" + p.join("&");
  }

  function ytPoster(id) { return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }

  /* --- Aspect ratios ------------------------------------------------------ */
  // Accepts "9/16", "9 : 16", "9:16", "16 by 9" and the like, so the ratio can
  // be written in config however feels natural.
  function parseRatio(value) {
    var nums = String(value == null ? "" : value)
      .split(/[^\d.]+/)
      .map(parseFloat)
      .filter(function (n) { return !isNaN(n) && n > 0; });
    var w = nums[0] || 16;
    var h = nums[1] || 9;
    return { css: w + " / " + h, label: w + ":" + h, portrait: h > w };
  }

  function ytCommand(iframe, func, args) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: func, args: args || [] }), "*");
    } catch (e) { /* cross-origin hiccup, nothing to do */ }
  }

  // cc_load_policy alone doesn't reliably suppress auto-captions. The player
  // only accepts API calls once it is ready, and it reloads the caption module
  // every time the clip loops, so we handshake first and then unload captions
  // on each state change.
  var captionWatch = [];

  window.addEventListener("message", function (e) {
    if (!/youtube(-nocookie)?\.com$/.test(String(e.origin).replace(/^https?:\/\//, ""))) return;
    captionWatch.forEach(function (iframe) {
      if (iframe.contentWindow !== e.source) return;
      iframe.__answered = true;
      // The player streams status several times a second, so this is throttled;
      // it still catches the module being reloaded on a loop restart.
      var now = Date.now();
      if (iframe.__ccAt && now - iframe.__ccAt < 2000) return;
      iframe.__ccAt = now;
      ytCommand(iframe, "setOption", ["captions", "track", {}]);
      ytCommand(iframe, "setOption", ["cc", "track", {}]);
      ytCommand(iframe, "unloadModule", ["captions"]);
      ytCommand(iframe, "unloadModule", ["cc"]);
    });
  });

  function ytHideCaptions(iframe) {
    if (captionWatch.indexOf(iframe) < 0) captionWatch.push(iframe);
    // Knock until the player answers, then stop. Pinging a player that is
    // already talking to us makes its own script throw.
    var tries = 0;
    var ping = setInterval(function () {
      if (iframe.__answered || ++tries > 12) return clearInterval(ping);
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "listening", id: tries, channel: "widget" }), "*");
      } catch (err) { /* not up yet */ }
    }, 400);
  }

  /* --- Autoplay-while-visible -------------------------------------------- */
  // Players mount on first sight and pause when they scroll away, so a page
  // full of cards never loads a dozen iframes at once.

  var players = [];

  // Only one thing on the page is ever allowed to make noise. Whoever turns
  // sound on claims this slot and silences whoever held it before.
  var audioOwner = null;

  function claimAudio(owner) {
    if (audioOwner && audioOwner !== owner) audioOwner.silence();
    audioOwner = owner;
  }
  function releaseAudio(owner) {
    if (audioOwner === owner) audioOwner = null;
  }

  // One row plays at a time. A card runs only if it is on screen AND it sits in
  // the labelled row nearest the middle of the viewport, so scrolling hands
  // playback from one row to the next instead of running the whole page at once.
  var rows = [];
  var activeRow = null;

  function indexRows() {
    rows = [];
    Array.prototype.forEach.call(document.querySelectorAll(".group"), function (el) {
      var found = 0;
      Array.prototype.forEach.call(el.querySelectorAll(".vcard__media"), function (m) {
        if (!m.__player) return;
        m.__player.row = el;
        found++;
      });
      if (found) rows.push(el);
    });
    syncPlayback();
  }

  function pickRow() {
    var h = window.innerHeight || 0;
    var mid = h / 2;
    var best = null;
    var bestDistance = Infinity;
    rows.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= h) return; // nowhere near the screen
      var distance = Math.abs(r.top + r.height / 2 - mid);
      if (distance < bestDistance) { bestDistance = distance; best = el; }
    });
    return best;
  }

  function syncPlayback() {
    activeRow = pickRow();
    players.forEach(function (p) {
      // A card the visitor deliberately unmuted keeps running wherever it sits.
      var wanted = p.visible && (p.isUnmuted() || p.row === activeRow);
      if (wanted) p.enter(); else p.leave();
    });
  }

  var syncQueued = false;
  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(function () { syncQueued = false; syncPlayback(); });
  }

  var visibility = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var p = entry.target.__player;
          if (p) p.visible = entry.isIntersecting;
        });
        syncPlayback();
      }, { threshold: 0.4 })
    : null;

  function makePlayer(media, parsed, autoplay) {
    var live = false;
    var node = null;
    var unmuted = false;

    var poster = parsed.kind === "youtube"
      ? el("img", {
          class: "vcard__poster", src: ytPoster(parsed.id), alt: "", loading: "lazy",
          onerror: function () { this.style.visibility = "hidden"; },
        })
      : null;
    if (poster) media.appendChild(poster);

    function build(auto) {
      if (parsed.kind === "youtube") {
        node = el("iframe", {
          src: ytEmbed(parsed.id, { autoplay: auto, muted: !unmuted, controls: unmuted }),
          title: "Video",
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
          allowfullscreen: "",
          loading: "lazy",
        });
        if (!unmuted) ytHideCaptions(node);
        media.classList.add("is-live");
      } else {
        node = el("video", {
          src: parsed.src, loop: "", playsinline: "", preload: "metadata",
        });
        node.muted = !unmuted;
        node.controls = unmuted;
        // The overlay only clears once there are real frames on screen, so a
        // card that hasn't started yet still shows its play button.
        node.addEventListener("playing", function () { media.classList.add("is-live"); });
        node.addEventListener("loadeddata", function () { media.classList.add("has-frame"); });
      }
      media.appendChild(node);
      live = true;
      if (auto && parsed.kind === "file") {
        var play = node.play();
        if (play && play.catch) play.catch(function () { /* browser said no */ });
      }
    }

    // Local files mount right away at metadata level: the first frame stands in
    // for a poster, and playback still waits until the card is on screen.
    if (parsed.kind === "file") build(false);

    var player = {
      visible: false,
      row: null,
      isUnmuted: function () { return unmuted; },

      enter: function () {
        if (reducedMotion || !autoplay) return;
        if (!live) build(true);
        else if (parsed.kind === "youtube") ytCommand(node, "playVideo");
        else if (node.paused) node.play().catch(function () {});
        media.classList.add("is-playing");
      },

      leave: function () {
        media.classList.remove("is-playing");
        // Scrolling a card away puts it back to silent autoplay, so coming
        // back to it never restarts sound the visitor has moved on from.
        if (unmuted) return player.silence();
        if (!live) return;
        if (parsed.kind === "youtube") ytCommand(node, "pauseVideo");
        else if (!node.paused) node.pause();
      },

      // Click anywhere on the card: sound on, controls on.
      activate: function () {
        if (unmuted) return;
        claimAudio(player);
        unmuted = true;
        if (parsed.kind === "youtube") {
          if (node) node.remove();
          build(true);
        } else {
          if (!live) build(true);
          node.muted = false;
          node.controls = true;
          node.play().catch(function () {});
        }
        media.classList.add("is-unmuted");
      },

      // Back to the default: muted, no controls, ready to autoplay on sight.
      silence: function () {
        releaseAudio(player);
        if (!unmuted) return;
        unmuted = false;
        media.classList.remove("is-unmuted");
        if (parsed.kind === "youtube") {
          // The mute and controls flags are baked into the embed URL, so the
          // player is dropped and rebuilt muted next time the card is seen.
          if (node) node.remove();
          node = null;
          live = false;
          media.classList.remove("is-live");
        } else {
          node.pause();
          node.muted = true;
          node.controls = false;
        }
      },
    };

    media.__player = player;
    players.push(player);
    if (visibility) visibility.observe(media);
    return player;
  }

  /* --- Video card -------------------------------------------------------- */

  function videoCard(item, ratio, autoplay) {
    var parsed = parseSource(item.src);
    if (!parsed) return null;

    var media = el("div", { class: "vcard__media", style: "--ratio:" + ratio });
    var player = makePlayer(media, parsed, autoplay);

    // Stays in the DOM and stays focusable while the card is muted, so sound is
    // reachable by keyboard even once the play overlay has gone.
    media.appendChild(el("button", {
      class: "vcard__badge", type: "button",
      "aria-label": "Turn on sound for " + (item.title || "this video"),
      text: "Tap for sound",
      onclick: function (e) { e.stopPropagation(); player.activate(); },
    }));
    media.appendChild(el("button", {
      class: "vcard__play",
      type: "button",
      "aria-label": "Play " + (item.title || "video") + " with sound",
      html: '<span><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72L19 12z"/></svg></span>',
      onclick: function (e) { e.stopPropagation(); player.activate(); },
    }));

    media.addEventListener("click", function () { player.activate(); });

    return el("article", { class: "vcard" }, [
      media,
      item.title ? el("p", { class: "vcard__title", text: item.title }) : null,
    ]);
  }

  /* --- Carousel ---------------------------------------------------------- */

  function carousel(videos, ratio, autoplay) {
    var track = el("div", { class: "carousel__track", role: "list" });
    var count = 0;

    videos.forEach(function (item) {
      var card = videoCard(item, ratio.css, autoplay);
      if (!card) return;
      card.setAttribute("role", "listitem");
      track.appendChild(card);
      count++;
    });
    if (!count) return null;

    var prev = el("button", {
      class: "carousel__btn carousel__btn--prev", type: "button", "aria-label": "Previous",
      html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    });
    var next = el("button", {
      class: "carousel__btn carousel__btn--next", type: "button", "aria-label": "Next",
      html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    });

    var root = el("div", {
      class: "carousel",
      "data-ratio": ratio.label,
      "data-orient": ratio.portrait ? "portrait" : "landscape",
    }, [prev, track, next]);

    function step() {
      var card = track.querySelector(".vcard");
      return card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    }
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });

    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      var atStart = track.scrollLeft <= 2;
      var atEnd = track.scrollLeft >= max - 2;
      prev.disabled = atStart;
      next.disabled = atEnd || max <= 2;
      root.setAttribute("data-fade",
        max <= 2 ? "none" : atStart ? "end" : atEnd ? "start" : "both");
    }
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    requestAnimationFrame(sync);

    return root;
  }

  /* --- Sections ---------------------------------------------------------- */

  function renderTools() {
    var list = CFG.tools || [];
    if (!list.length) return;

    function chip(tool) {
      var badge = el("span", {
        class: "tool__badge" + (tool.logo ? " tool__badge--logo" : ""),
        style: "--tool-color:" + (tool.color || "#f5f5f8"),
      });
      if (tool.logo) {
        // Brands with no published mark fall back to the lettermark, so a
        // missing or misspelt file leaves a readable chip rather than a hole.
        badge.appendChild(el("img", {
          src: tool.logo, alt: "", loading: "lazy",
          onerror: function () {
            badge.classList.remove("tool__badge--logo");
            badge.textContent = tool.short || tool.name.slice(0, 2);
          },
        }));
      } else {
        badge.textContent = tool.short || "";
      }
      return el("div", { class: "tool" }, [badge, el("span", { text: tool.name })]);
    }
    var track = el("div", { class: "marquee__track" });
    // Rendered twice so the -50% translate loops without a seam.
    for (var pass = 0; pass < 2; pass++) {
      list.forEach(function (tool) {
        var c = chip(tool);
        if (pass === 1) c.setAttribute("aria-hidden", "true");
        track.appendChild(c);
      });
    }
    mount("tools", el("div", { class: "marquee" }, [track]));
  }

  function renderProjects() {
    var cfg = CFG.projects;
    if (!cfg) return;
    var host = document.getElementById("projects-body");
    if (!host) return;

    (cfg.sections || []).forEach(function (section) {
      var groups = [];
      var autoplay = section.autoplay !== false; // opt out per section, on by default
      var ratio = parseRatio(section.ratio);

      (section.groups || []).forEach(function (group) {
        var car = carousel(group.videos || [], ratio, autoplay);
        if (!car) return; // an empty group simply doesn't render

        var n = car.querySelectorAll(".vcard").length;
        groups.push(el("div", { class: "group reveal" }, [
          el("div", { class: "group__head" }, [
            el("h3", { class: "h-group", text: group.label }),
            el("span", { class: "group__count", text: n + (n === 1 ? " video" : " videos") }),
          ]),
          car,
        ]));
      });

      if (!groups.length) return; // and neither does an empty section

      var head = el("div", { class: "projects__section-head reveal" }, [
        el("h3", { class: "h-group", text: section.label }),
        el("span", { class: "projects__ratio", text: ratio.label }),
      ]);
      host.appendChild(el("div", { class: "projects__section" }, [head].concat(groups)));
    });
  }

  // The first few stats, repeated compactly in the hero so the numbers land
  // before anyone has to scroll for them.
  function renderHeroProof() {
    var host = document.getElementById("hero-proof");
    if (!host) return;
    var list = (CFG.stats || []).slice(0, 3);
    if (!list.length) return host.remove();

    list.forEach(function (s) {
      host.appendChild(el("span", { class: "hero__proof-item" }, [
        el("span", { class: "hero__proof-value", text: s.value }),
        el("span", { text: s.label }),
      ]));
    });
  }

  function renderStats() {
    var list = CFG.stats || [];
    if (!list.length) return;
    var grid = el("div", { class: "stats reveal" });
    list.forEach(function (s) {
      grid.appendChild(el("div", { class: "stat" }, [
        el("div", { class: "stat__value", text: s.value }),
        el("div", { class: "stat__label", text: s.label }),
      ]));
    });
    mount("stats", grid);
  }

  function renderTestimonials() {
    var cfg = CFG.testimonials;
    if (!cfg || !(cfg.people || []).length) return;

    var heading = document.getElementById("testimonials-heading");
    if (heading) heading.innerHTML = withAccent(cfg.heading, cfg.accent);

    var grid = el("div", { class: "testimonials__grid" });
    cfg.people.forEach(function (p) {
      var video = el("video", {
        class: "tcard__video", src: p.video, controls: "", playsinline: "",
        preload: "metadata", "aria-label": "Testimonial from " + p.name,
      });
      // Testimonials share the one-sound-at-a-time rule with the project cards.
      var owner = { silence: function () { video.pause(); } };
      video.addEventListener("play", function () { claimAudio(owner); });
      video.addEventListener("pause", function () { releaseAudio(owner); });
      grid.appendChild(el("div", { class: "tcard reveal" }, [
        el("div", { class: "tcard__person" }, [
          el("img", { class: "tcard__avatar", src: p.avatar, alt: "", loading: "lazy" }),
          el("div", {}, [
            el("div", { class: "tcard__name", text: p.name }),
            el("div", { class: "tcard__meta", text: p.meta }),
          ]),
        ]),
        video,
      ]));
    });
    mount("testimonials-grid", grid);
  }

  var ICONS = {
    instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    linkedin: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.885 3.4',
  };

  // The placeholder becomes the row itself rather than wrapping one, so it is
  // the direct flex child its layout rules expect.
  function fillSocials(hostId, className) {
    var host = document.getElementById(hostId);
    if (!host) return;
    host.className = className;
    (CFG.socials || []).forEach(function (s) {
      var path = ICONS[s.icon];
      if (!path) return;
      host.appendChild(el("a", {
        class: "social", href: s.url, target: "_blank", rel: "noopener",
        "aria-label": s.name,
        html: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + path + '"/></svg>',
      }));
    });
  }

  function renderSocials() {
    fillSocials("hero-socials", "hero__socials");
    fillSocials("footer-socials", "footer__socials");

    var copy = document.getElementById("footer-copy");
    if (copy && CFG.brand) {
      copy.textContent = String(CFG.brand.copyright || "")
        .replace(/\{year\}/g, new Date().getFullYear());
    }
  }

  /* --- Text injection ---------------------------------------------------- */

  // Turns the phrases in CFG.links into anchors inside copy that was just
  // bound as plain text, so config stays free of markup.
  function linkify(node) {
    var map = CFG.links || {};
    var phrases = Object.keys(map).filter(function (phrase) {
      return node.textContent.indexOf(phrase) > -1;
    });
    if (!phrases.length) return;

    // A flex or grid parent trims the whitespace on either side of each child,
    // so "Certified by AEVY TV" would lose its space once the anchor split the
    // text in two. Keeping the copy inside one inline wrapper avoids that.
    var wrap = el("span", { text: node.textContent });
    node.textContent = "";
    node.appendChild(wrap);

    phrases.forEach(function (phrase) {
      var walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT, null);
      var hits = [], t;
      while ((t = walker.nextNode())) {
        if (t.nodeValue.indexOf(phrase) > -1) hits.push(t);
      }
      hits.forEach(function (textNode) {
        var at = textNode.nodeValue.indexOf(phrase);
        var tail = textNode.splitText(at);
        tail.nodeValue = tail.nodeValue.slice(phrase.length);
        textNode.parentNode.insertBefore(el("a", {
          class: "copy-link", href: map[phrase],
          target: "_blank", rel: "noopener", text: phrase,
        }), tail);
      });
    });
  }

  function fillText() {
    document.querySelectorAll("[data-text]").forEach(function (node) {
      var value = CFG;
      node.getAttribute("data-text").split(".").forEach(function (key) {
        value = value == null ? value : value[key];
      });
      if (value != null) { node.textContent = value; linkify(node); }
    });

    document.querySelectorAll("[data-href]").forEach(function (node) {
      var value = CFG;
      node.getAttribute("data-href").split(".").forEach(function (key) {
        value = value == null ? value : value[key];
      });
      if (value) node.setAttribute("href", value);
    });

    document.querySelectorAll("[data-src]").forEach(function (node) {
      var value = CFG;
      node.getAttribute("data-src").split(".").forEach(function (key) {
        value = value == null ? value : value[key];
      });
      if (value) node.setAttribute("src", value);
    });

    // Headline + accent word pairs.
    document.querySelectorAll("[data-accent-of]").forEach(function (node) {
      var base = node.getAttribute("data-accent-of");
      var value = CFG, accent = CFG;
      base.split(".").forEach(function (k) { value = value == null ? value : value[k]; });
      (node.getAttribute("data-accent") || "").split(".").forEach(function (k) {
        accent = accent == null ? accent : accent[k];
      });
      if (value) node.innerHTML = withAccent(value, accent);
    });
  }

  /* --- About page -------------------------------------------------------- */

  function renderAbout() {
    var cfg = CFG.about;
    if (!cfg) return;

    var bio = document.getElementById("about-bio");
    if (bio) {
      (cfg.bio || []).forEach(function (p) { bio.appendChild(el("p", { text: p })); });
      if (cfg.languages) {
        bio.appendChild(el("p", { class: "profile__meta", text: "Languages: " + cfg.languages }));
      }
    }

    var skills = document.getElementById("about-skills");
    if (skills && (cfg.skills || []).length) {
      var grid = el("div", { class: "cards" });
      cfg.skills.forEach(function (name) {
        grid.appendChild(el("div", { class: "card" }, [el("span", { text: name })]));
      });
      skills.appendChild(grid);
    }

    var tools = document.getElementById("about-tools");
    if (tools && (CFG.tools || []).length) {
      var toolGrid = el("div", { class: "cards cards--tools" });
      CFG.tools.forEach(function (t) {
        var mark;
        if (t.logo) {
          mark = el("span", { class: "card__logo" });
          mark.appendChild(el("img", {
            src: t.logo, alt: "", loading: "lazy",
            onerror: function () {
              mark.className = "card__logo card__logo--text";
              mark.style.setProperty("--tool-color", t.color || "#f5f5f8");
              mark.textContent = t.short || t.name.slice(0, 2);
            },
          }));
        } else {
          mark = el("span", {
            class: "card__logo card__logo--text",
            style: "--tool-color:" + (t.color || "#f5f5f8"),
            text: t.short || t.name.slice(0, 2),
          });
        }
        toolGrid.appendChild(el("div", { class: "card card--tool" }, [mark, el("span", { text: t.name })]));
      });
      tools.appendChild(toolGrid);
    }

    // Experience and Education stay hidden until config has entries.
    function timeline(hostId, sectionId, entries, render) {
      var host = document.getElementById(hostId);
      var section = document.getElementById(sectionId);
      if (!host || !(entries || []).length) { if (section) section.remove(); return; }
      var wrap = el("div", { class: "timeline" });
      entries.forEach(function (e) { wrap.appendChild(render(e)); });
      host.appendChild(wrap);
    }

    timeline("about-experience", "experience-section", cfg.experience, function (e) {
      var body = el("div", { class: "tl__body" }, [
        el("div", { class: "tl__role", text: e.role }),
        el("div", { class: "tl__org" }, [
          e.url
            ? el("a", { href: e.url, target: "_blank", rel: "noopener", text: e.org })
            : el("span", { text: e.org }),
          e.type ? el("span", { text: " · " + e.type }) : null,
        ]),
        e.description ? el("p", { class: "tl__desc", text: e.description }) : null,
      ]);
      if ((e.points || []).length) {
        var list = el("ul", { class: "tl__points" });
        e.points.forEach(function (point) { list.appendChild(el("li", { text: point })); });
        body.appendChild(list);
      }
      return el("div", { class: "tl reveal" }, [
        el("div", { class: "tl__date", text: e.date }),
        body,
      ]);
    });

    timeline("about-education", "education-section", cfg.education, function (e) {
      return el("div", { class: "tl reveal" }, [
        el("div", { class: "tl__date", text: e.date }),
        el("div", { class: "tl__body" }, [
          el("div", { class: "tl__role", text: e.title }),
          el("div", { class: "tl__org", text: e.org }),
        ]),
      ]);
    });
  }

  /* --- Reveal on scroll -------------------------------------------------- */

  function initReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reducedMotion) {
      targets.forEach(function (t) { t.classList.add("is-in"); });
      return;
    }
    // Observers attach right away. Deferring them until the title card lifts
    // would strand any section the visitor had already scrolled past.
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    targets.forEach(function (t, i) {
      t.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
      obs.observe(t);
    });
  }

  /* --- Boot -------------------------------------------------------------- */

  function boot() {
    fillText();
    renderTools();
    renderProjects();
    renderHeroProof();
    renderStats();
    renderTestimonials();
    renderSocials();
    renderAbout();
    initReveal();

    // The active row is whichever one the viewport is centred on, so it has to
    // be recomputed as the page moves, not just when a card crosses in or out.
    indexRows();
    window.addEventListener("scroll", queueSync, { passive: true });
    window.addEventListener("resize", queueSync);

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
