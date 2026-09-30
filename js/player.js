/* YouTube IFrame API popup, inline featured player, and region pre-check. */
(function (root) {
  var GEO = ["LALIGA", "SERIE A", "LIGUE 1", "BUNDESLIGA", "PREMIER LEAGUE", "EPL"];
  var status = {};
  var statusCode = {};
  var probed = {};
  var modalPlayer = null;
  var inlinePlayer = null;
  var current = null;
  var pushed = false;
  var apiReady = false;
  var listeners = [];
  var params = new URLSearchParams(location.search);
  var SIM = (params.get("simulateBlock") || "").split(",").map(function (id) { return id.trim(); }).filter(Boolean);

  function isRegion(code) { return code === 101 || code === 150 || code === "sim"; }

  function blockedHTML(code) {
    var region = isRegion(code);
    return '<div class="blocked"><div class="ic" aria-hidden="true">' + (region ? "🌍" : "⚠️") + "</div><b>" +
      (region ? "Not available in your region" : "This video isn't available") + "</b><p>" +
      (region
        ? "The league has restricted this highlight where you're watching from. Try another clip, there's plenty more below."
        : "This clip was removed or can't be played right now. Try another one below.") +
      "</p></div>";
  }

  function leagueOf(id) {
    var leagues = root.THR_LEAGUES || [];
    for (var i = 0; i < leagues.length; i++) if (leagues[i].id === id) return leagues[i];
    return null;
  }

  function tagFor(clip) {
    var league = leagueOf(clip.leagueId);
    return league ? league.tag : "";
  }

  function isRiskyClip(clip) {
    return GEO.indexOf(String(tagFor(clip)).trim().toUpperCase()) !== -1;
  }

  function notify() {
    listeners.forEach(function (fn) { fn(status); });
  }

  function setBadge(videoId, cls, text) {
    document.querySelectorAll('[data-v="' + videoId + '"] .thumb').forEach(function (thumb) {
      var badge = thumb.querySelector(".lock");
      if (!badge) {
        badge = document.createElement("span");
        thumb.appendChild(badge);
      }
      badge.className = "lock " + cls;
      badge.textContent = text;
    });
  }

  function markCard(videoId, code) {
    status[videoId] = "locked";
    statusCode[videoId] = code;
    document.querySelectorAll('[data-v="' + videoId + '"]').forEach(function (card) {
      card.classList.add("locked");
    });
    setBadge(videoId, "", isRegion(code) ? "Region locked" : "Unavailable");
    notify();
  }

  function showBlocked(wrap, videoId, code) {
    wrap.innerHTML = blockedHTML(code);
    markCard(videoId, code);
  }

  function makePlayer(wrap, videoId, autoplay) {
    wrap.innerHTML = "<div></div>";
    if (SIM.indexOf(videoId) !== -1) {
      showBlocked(wrap, videoId, "sim");
      return null;
    }
    return new YT.Player(wrap.firstChild, {
      host: "https://www.youtube-nocookie.com",
      videoId: videoId,
      playerVars: { autoplay: autoplay ? 1 : 0, rel: 0, playsinline: 1, origin: location.origin },
      events: { onError: function (event) { showBlocked(wrap, videoId, event.data); } }
    });
  }

  function probe(videoId) {
    var done = false;
    var pl = null;
    var holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-9999px;top:0;width:320px;height:180px";
    var slot = document.createElement("div");
    holder.appendChild(slot);
    document.body.appendChild(holder);
    function fin(result, code) {
      if (done) return;
      done = true;
      try { if (pl && pl.destroy) pl.destroy(); } catch (e) {}
      holder.remove();
      if (result === "locked") markCard(videoId, code);
      else if (result === "ok") {
        status[videoId] = "ok";
        setBadge(videoId, "ok", "✓ Plays in your region");
        notify();
      } else {
        status[videoId] = "unknown";
        setBadge(videoId, "chk", "May be region locked");
        notify();
      }
    }
    if (SIM.indexOf(videoId) !== -1) {
      fin("locked", "sim");
      return;
    }
    pl = new YT.Player(slot, {
      host: "https://www.youtube-nocookie.com",
      videoId: videoId,
      playerVars: { autoplay: 1, mute: 1, playsinline: 1, origin: location.origin },
      events: {
        onError: function (event) { fin("locked", event.data); },
        onStateChange: function (event) { if (event.data === 1) fin("ok"); }
      }
    });
    setTimeout(function () { fin("unknown"); }, 12000);
  }

  function startProbes() {
    var clips = (root.HIGHLIGHTS || []).filter(isRiskyClip);
    clips.forEach(function (clip, index) {
      if (probed[clip.id]) return;
      probed[clip.id] = true;
      if (!status[clip.id]) {
        status[clip.id] = "checking";
        setBadge(clip.id, "chk", "Checking region…");
      }
      setTimeout(function () { probe(clip.id); }, 300 * index);
    });
  }

  function applyBadges(scope) {
    var rootEl = scope || document;
    Object.keys(status).forEach(function (videoId) {
      var state = status[videoId];
      rootEl.querySelectorAll('[data-v="' + videoId + '"]').forEach(function (card) {
        card.classList.toggle("locked", state === "locked");
      });
      if (state === "locked") setBadge(videoId, "", "Region locked");
      else if (state === "ok") setBadge(videoId, "ok", "✓ Plays in your region");
      else if (state === "unknown") setBadge(videoId, "chk", "May be region locked");
      else if (state === "checking") setBadge(videoId, "chk", "Checking region…");
    });
  }

  function modalEls() {
    return {
      modal: document.getElementById("m"),
      wrap: document.getElementById("modalWrap"),
      title: document.getElementById("t"),
      channel: document.getElementById("c")
    };
  }

  function open(clip, push) {
    var els = modalEls();
    if (!els.modal || !clip) return;
    current = clip;
    els.title.textContent = clip.title;
    var league = leagueOf(clip.leagueId);
    els.channel.textContent = league ? league.name : "";
    els.modal.classList.add("open");
    els.modal.removeAttribute("hidden");
    if (push !== false) {
      history.pushState({ m: 1 }, "");
      pushed = true;
    }
    if (status[clip.id] === "locked") {
      els.wrap.innerHTML = blockedHTML(150);
      return;
    }
    if (window.YT && YT.Player) modalPlayer = makePlayer(els.wrap, clip.id, true);
    var close = document.getElementById("close");
    if (close) close.focus();
  }

  function close() {
    if (modalPlayer && modalPlayer.destroy) {
      try { modalPlayer.destroy(); } catch (e) {}
    }
    modalPlayer = null;
    var els = modalEls();
    if (els.wrap) els.wrap.innerHTML = "";
    if (els.modal) {
      els.modal.classList.remove("open");
      els.modal.setAttribute("hidden", "");
    }
    current = null;
    pushed = false;
  }

  function requestClose() {
    if (pushed && history.state && history.state.m) history.back();
    else close();
  }

  function destroyInline() {
    if (inlinePlayer && inlinePlayer.destroy) {
      try { inlinePlayer.destroy(); } catch (e) {}
    }
    inlinePlayer = null;
  }

  function mountInline(videoId) {
    var wrap = document.getElementById("inlineWrap");
    if (!wrap || !videoId) {
      destroyInline();
      return;
    }
    var mode = status[videoId] === "locked" ? "blocked" : "player";
    if (wrap.dataset.vid === videoId && wrap.dataset.mode === mode && wrap.childElementCount) return;
    wrap.dataset.vid = videoId;
    wrap.dataset.mode = mode;
    destroyInline();
    if (mode === "blocked") {
      wrap.innerHTML = blockedHTML(statusCode[videoId] || 150);
      return;
    }
    if (!(window.YT && YT.Player)) return;
    inlinePlayer = makePlayer(wrap, videoId, false);
  }

  root.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    var wrap = document.getElementById("inlineWrap");
    if (wrap && wrap.dataset.vid) {
      var id = wrap.dataset.vid;
      wrap.dataset.vid = "";
      mountInline(id);
    }
    if (current && !modalPlayer && status[current.id] !== "locked") {
      var els = modalEls();
      if (els.wrap) modalPlayer = makePlayer(els.wrap, current.id, true);
    }
    startProbes();
  };

  function bind() {
    var modal = document.getElementById("m");
    var closeBtn = document.getElementById("close");
    if (closeBtn) closeBtn.addEventListener("click", requestClose);
    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) requestClose();
      });
    }
    addEventListener("popstate", function () { close(); });
    addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal && modal.classList.contains("open")) requestClose();
    });
    if (window.YT && YT.Player) root.onYouTubeIframeAPIReady();
  }

  root.THRPlayer = {
    status: status,
    statusOf: function (id) { return status[id] || ""; },
    isRisky: isRiskyClip,
    bind: bind,
    open: open,
    close: close,
    requestClose: requestClose,
    mountInline: mountInline,
    clearInline: destroyInline,
    applyBadges: applyBadges,
    onStatus: function (fn) { listeners.push(fn); },
    tagFor: tagFor
  };
})(typeof window !== "undefined" ? window : globalThis);
