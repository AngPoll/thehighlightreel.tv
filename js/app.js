(function () {
  var user = THRAuth.currentUser();
  if (!user || !THRAuth.hasFavorites(user)) return;
  var sports = document.querySelectorAll(".sport");
  var teamToggle = document.getElementById("teamToggle");
  var teamList = document.getElementById("teamList");
  var teamValue = "all";
  var extraTeams = [];
  var form = document.getElementById("searchForm");
  var input = document.getElementById("q");
  var clearBtn = document.getElementById("clearSearch");
  var suggest = document.getElementById("suggest");
  var feed = document.getElementById("feed");
  var empty = document.getElementById("empty");
  var feedTitle = document.getElementById("feedTitle");
  var feedMeta = document.getElementById("feedMeta");
  var hideLocked = document.getElementById("hideLocked");
  var resetEmpty = document.getElementById("resetEmpty");
  var state = { sport: "all", selection: { type: "all" }, query: "" };
  var renderedSig = "";
  var activeSuggest = -1;

  document.getElementById("avatarLink").textContent = (user.name || "?").trim().charAt(0).toUpperCase() || "?";
  document.getElementById("avatarLink").setAttribute("aria-label", "Settings for " + user.name);
  hideLocked.checked = !!user.hideBlocked;

  function leagueOf(id) {
    return THRTeams.league(id);
  }

  function selectionFrom(value) {
    if (!value || value === "all") return { type: "all" };
    if (value.indexOf("league:") === 0) return { type: "league", id: value.slice(7) };
    if (value.indexOf("team:") === 0) return { type: "team", name: decodeURIComponent(value.slice(5)) };
    return { type: "all" };
  }

  function teamItems() {
    var fav = THRAuth.getFavorites();
    var items = [{ value: "all", label: "All highlights", group: "" }];
    fav.leagues.forEach(function (id) {
      var league = leagueOf(id);
      if (league) items.push({ value: "league:" + id, label: league.name, group: "Leagues" });
    });
    fav.teams.forEach(function (team) {
      items.push({ value: "team:" + encodeURIComponent(team.name), label: team.name, group: "Teams" });
    });
    extraTeams.forEach(function (name) {
      var value = "team:" + encodeURIComponent(name);
      if (items.some(function (item) { return item.value === value; })) return;
      items.push({ value: value, label: name, group: "From this highlight" });
    });
    return items;
  }

  function fillTeams() {
    var items = teamItems();
    if (!items.some(function (item) { return item.value === teamValue; })) teamValue = "all";
    teamList.innerHTML = "";
    var lastGroup = null;
    items.forEach(function (item) {
      if (item.group && item.group !== lastGroup) {
        var heading = document.createElement("div");
        heading.className = "group";
        heading.textContent = item.group;
        teamList.appendChild(heading);
        lastGroup = item.group;
      }
      var button = document.createElement("button");
      button.type = "button";
      button.className = "team-option";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", item.value === teamValue ? "true" : "false");
      button.dataset.value = item.value;
      button.textContent = item.label;
      button.addEventListener("click", function () {
        setTeamValue(item.value);
        closeTeams();
      });
      teamList.appendChild(button);
    });
    var current = items.filter(function (item) { return item.value === teamValue; })[0];
    teamToggle.textContent = current ? current.label : "All highlights";
    state.selection = selectionFrom(teamValue);
  }

  function setTeamValue(value) {
    teamValue = value;
    fillTeams();
    render();
  }

  function closeTeams() {
    teamList.hidden = true;
    teamToggle.setAttribute("aria-expanded", "false");
  }

  function ensureTeamOption(name) {
    if (extraTeams.indexOf(name) === -1) extraTeams.push(name);
    setTeamValue("team:" + encodeURIComponent(name));
  }

  function visibleClips() {
    var clips = THRSearch.filterClips(HIGHLIGHTS, state.query, {
      sport: state.sport,
      selection: state.selection
    });
    if (hideLocked.checked) clips = clips.filter(function (clip) { return THRPlayer.statusOf(clip.id) !== "locked"; });
    return clips;
  }

  function thumb(videoId) {
    var span = document.createElement("span");
    span.className = "thumb";
    span.style.backgroundImage = "url(https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg)";
    return span;
  }

  function chips(clip) {
    var row = document.createElement("div");
    row.className = "chips";
    (clip.teams || []).forEach(function (name) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.dataset.team = name;
      button.textContent = name;
      row.appendChild(button);
    });
    return row;
  }

  function metaLine(clip) {
    var league = leagueOf(clip.leagueId);
    var p = document.createElement("p");
    p.className = "sub";
    p.textContent = (league ? league.name : "") + " · " + THRSearch.formatDate(clip.date);
    return p;
  }

  function renderFeed(clips) {
    var sig = clips.map(function (clip) { return clip.id; }).join(",") + "|" + (hideLocked.checked ? "1" : "0");
    if (sig === renderedSig && feed.childElementCount) {
      THRPlayer.applyBadges(feed);
      if (THRPlayer.statusOf(clips[0].id) === "locked") THRPlayer.mountInline(clips[0].id);
      return;
    }
    renderedSig = sig;
    feed.innerHTML = "";
    if (!clips.length) return;
    var feature = document.createElement("article");
    feature.className = "feature";
    feature.dataset.v = clips[0].id;
    var wrap = document.createElement("div");
    wrap.className = "pwrap";
    wrap.id = "inlineWrap";
    var tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = THRPlayer.tagFor(clips[0]);
    feature.appendChild(tag);
    feature.appendChild(wrap);
    var meta = document.createElement("div");
    meta.className = "meta";
    var title = document.createElement("h3");
    title.textContent = clips[0].title;
    meta.appendChild(title);
    meta.appendChild(metaLine(clips[0]));
    meta.appendChild(chips(clips[0]));
    feature.appendChild(meta);
    feed.appendChild(feature);

    clips.slice(1).forEach(function (clip) {
      var card = document.createElement("article");
      card.className = "card";
      card.dataset.v = clip.id;
      var open = document.createElement("button");
      open.type = "button";
      open.className = "card-open";
      open.setAttribute("aria-label", "Play " + clip.title);
      var shot = thumb(clip.id);
      var badge = document.createElement("span");
      badge.className = "tag";
      badge.textContent = THRPlayer.tagFor(clip);
      shot.appendChild(badge);
      open.appendChild(shot);
      var heading = document.createElement("span");
      heading.className = "card-title";
      heading.textContent = clip.title;
      open.appendChild(heading);
      card.appendChild(open);
      var foot = document.createElement("div");
      foot.className = "meta";
      foot.appendChild(metaLine(clip));
      foot.appendChild(chips(clip));
      card.appendChild(foot);
      feed.appendChild(card);
    });
    THRPlayer.applyBadges(feed);
    THRPlayer.mountInline(clips[0].id);
  }

  function renderLabels(clips) {
    var query = state.query.trim();
    if (query) {
      feedTitle.textContent = 'Results for “' + query + '”';
    } else {
      feedTitle.textContent = "Highlights";
    }
    var noun = clips.length === 1 ? "highlight" : "highlights";
    feedMeta.textContent = clips.length + " " + noun + ", newest first";
    empty.hidden = clips.length !== 0;
    feed.hidden = clips.length === 0;
    if (!clips.length) {
      var text = query
        ? "Nothing matches “" + query + "” with the current sport and My teams filters."
        : "No highlights for this sport and team yet.";
      empty.querySelector("p").textContent = text;
    }
    clearBtn.hidden = !query;
  }

  function render() {
    var clips = visibleClips();
    renderLabels(clips);
    if (!clips.length) {
      renderedSig = "";
      feed.innerHTML = "";
      THRPlayer.clearInline();
      return;
    }
    renderFeed(clips);
  }

  function hideSuggestions() {
    suggest.hidden = true;
    suggest.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeSuggest = -1;
  }

  function markText(text, query) {
    var span = document.createElement("span");
    var q = query.trim();
    var index = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (index < 0) {
      span.textContent = text;
      return span;
    }
    span.appendChild(document.createTextNode(text.slice(0, index)));
    var mark = document.createElement("mark");
    mark.textContent = text.slice(index, index + q.length);
    span.appendChild(mark);
    span.appendChild(document.createTextNode(text.slice(index + q.length)));
    return span;
  }

  function renderSuggestions() {
    var query = input.value.trim();
    if (!query) {
      hideSuggestions();
      return;
    }
    var items = THRSearch.suggestions(query, HIGHLIGHTS, { sport: "all", selection: { type: "all" } });
    if (!items.length) {
      hideSuggestions();
      return;
    }
    suggest.innerHTML = "";
    var order = ["league", "team", "event", "clip"];
    var labels = { league: "Leagues", team: "Teams", event: "Events", clip: "Highlights" };
    var index = 0;
    order.forEach(function (type) {
      var rows = items.filter(function (item) { return item.type === type; });
      if (!rows.length) return;
      var group = document.createElement("div");
      group.className = "group";
      group.textContent = labels[type];
      suggest.appendChild(group);
      rows.forEach(function (item) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "suggest-item";
        button.setAttribute("role", "option");
        button.id = "suggest-" + index;
        index += 1;
        var label = document.createElement("span");
        label.appendChild(markText(item.label, query));
        var detail = document.createElement("small");
        detail.textContent = item.detail;
        button.appendChild(label);
        button.appendChild(detail);
        button.addEventListener("click", function () {
          chooseSuggestion(item);
        });
        suggest.appendChild(button);
      });
    });
    suggest.hidden = false;
    input.setAttribute("aria-expanded", "true");
    activeSuggest = -1;
  }

  function chooseSuggestion(item) {
    if (item.type === "clip") {
      var clip = HIGHLIGHTS.filter(function (row) { return row.id === item.value; })[0];
      hideSuggestions();
      if (clip) THRPlayer.open(clip);
      return;
    }
    input.value = item.value;
    state.query = item.value;
    hideSuggestions();
    render();
    input.focus();
  }

  function setActive(buttons) {
    buttons.forEach(function (button, index) {
      button.setAttribute("aria-selected", index === activeSuggest ? "true" : "false");
      if (index === activeSuggest) button.scrollIntoView({ block: "nearest" });
    });
    if (activeSuggest >= 0 && buttons[activeSuggest]) input.setAttribute("aria-activedescendant", buttons[activeSuggest].id);
    else input.removeAttribute("aria-activedescendant");
  }

  sports.forEach(function (button) {
    button.addEventListener("click", function () {
      sports.forEach(function (item) {
        item.classList.remove("on");
        item.setAttribute("aria-pressed", "false");
      });
      button.classList.add("on");
      button.setAttribute("aria-pressed", "true");
      state.sport = button.dataset.sport;
      render();
    });
  });

  teamToggle.addEventListener("click", function () {
    var open = teamList.hidden;
    if (open) {
      teamList.hidden = false;
      teamToggle.setAttribute("aria-expanded", "true");
    } else closeTeams();
  });
  teamToggle.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      teamList.hidden = false;
      teamToggle.setAttribute("aria-expanded", "true");
      var first = teamList.querySelector(".team-option");
      if (first) first.focus();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeTeams();
  });

  input.addEventListener("input", function () {
    state.query = input.value;
    render();
    renderSuggestions();
  });

  input.addEventListener("keydown", function (event) {
    var buttons = [].slice.call(suggest.querySelectorAll('[role="option"]'));
    if (event.key === "ArrowDown" && buttons.length) {
      event.preventDefault();
      activeSuggest = (activeSuggest + 1) % buttons.length;
      setActive(buttons);
    } else if (event.key === "ArrowUp" && buttons.length) {
      event.preventDefault();
      activeSuggest = activeSuggest <= 0 ? buttons.length - 1 : activeSuggest - 1;
      setActive(buttons);
    } else if (event.key === "Escape") {
      hideSuggestions();
    } else if (event.key === "Enter" && activeSuggest >= 0 && buttons[activeSuggest]) {
      event.preventDefault();
      buttons[activeSuggest].click();
    }
  });

  form.addEventListener("submit", function (event) { event.preventDefault(); hideSuggestions(); });
  clearBtn.addEventListener("click", function () {
    input.value = "";
    state.query = "";
    hideSuggestions();
    render();
    input.focus();
  });
  document.addEventListener("click", function (event) {
    if (!form.contains(event.target)) hideSuggestions();
    if (!event.target.closest(".team-control")) closeTeams();
  });

  feed.addEventListener("click", function (event) {
    var chip = event.target.closest(".chip");
    if (chip) {
      ensureTeamOption(chip.dataset.team);
      return;
    }
    var opener = event.target.closest(".card-open");
    if (!opener) return;
    var card = opener.closest(".card");
    var clip = HIGHLIGHTS.filter(function (row) { return row.id === card.dataset.v; })[0];
    if (clip) THRPlayer.open(clip);
  });

  hideLocked.addEventListener("change", function () {
    THRAuth.updateUser({ hideBlocked: hideLocked.checked }).then(function () { render(); });
  });

  resetEmpty.addEventListener("click", function () {
    input.value = "";
    state.query = "";
    state.sport = "all";
    teamValue = "all";
    state.selection = { type: "all" };
    fillTeams();
    sports.forEach(function (item) {
      var on = item.dataset.sport === "all";
      item.classList.toggle("on", on);
      item.setAttribute("aria-pressed", on ? "true" : "false");
    });
    hideSuggestions();
    render();
  });

  THRPlayer.onStatus(function () { render(); });
  THRPlayer.bind();
  fillTeams();
  render();

  var openId = new URLSearchParams(location.search).get("open");
  if (openId) {
    var clip = HIGHLIGHTS.filter(function (row) { return row.id === openId; })[0];
    if (clip) THRPlayer.open(clip, false);
  }
})();
