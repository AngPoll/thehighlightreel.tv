/* Event finder: teams, leagues, players, series, and dates. Feed order stays newest first. */
(function (root) {
  var MONTHS = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
  };
  var MONTH_RE = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
  /* Offered in suggestions even when no current clip is tagged with them. */
  var SERIES = [
    { name: "World Series" },
    { name: "NBA Finals" },
    { name: "Stanley Cup Final", aliases: ["Stanley Cup", "Stanley Cup Finals"] },
    { name: "Champions League", aliases: ["UEFA Champions League"] },
    { name: "Ryder Cup" },
    { name: "Monaco Grand Prix", aliases: ["Monaco GP"] },
    { name: "US Open", aliases: ["U.S. Open"] },
    { name: "playoffs", aliases: ["playoff"] }
  ];

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function ymd(date) {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  }

  function fromYmd(n) {
    return { y: Math.floor(n / 10000), m: Math.floor((n % 10000) / 100), d: n % 100 };
  }

  function shiftDays(date, days) {
    var next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + days);
    return ymd(next);
  }

  function leagueOf(id) {
    var leagues = root.THR_LEAGUES || [];
    for (var i = 0; i < leagues.length; i++) if (leagues[i].id === id) return leagues[i];
    return null;
  }

  function dateBits(iso) {
    var parts = iso.split("-");
    var y = +parts[0], m = +parts[1], d = +parts[2];
    var names = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    var short = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    return [
      iso,
      String(y),
      names[m - 1] + " " + d,
      short[m - 1] + " " + d,
      names[m - 1] + " " + y,
      short[m - 1] + " " + y,
      m + "/" + d + "/" + y,
      d + " " + names[m - 1]
    ];
  }

  function blob(clip) {
    var league = leagueOf(clip.leagueId);
    var parts = [clip.title, clip.channel || ""].concat(clip.players || [], clip.events || [], clip.teams || [], dateBits(clip.date));
    if (league) parts.push(league.name, league.tag, league.sport, league.sportLabel, (league.aliases || []).join(" "));
    (clip.teams || []).forEach(function (name) {
      var team = root.THRTeams && root.THRTeams.findTeam(clip.leagueId, name);
      if (team) parts = parts.concat(team.aliases);
    });
    return norm(parts.join(" "));
  }

  function emptyConstraint() {
    return { exact: null, month: null, day: null, year: null, start: null, end: null };
  }

  function hasDate(c) {
    return c.exact || c.month || c.day || c.year || c.start || c.end;
  }

  function parseSearch(raw, today) {
    today = today || new Date();
    var constraint = emptyConstraint();
    var work = " " + String(raw || "").toLowerCase() + " ";
    if (/\byesterday\b/.test(work)) {
      constraint.exact = shiftDays(today, -1);
      work = work.replace(/\byesterday\b/g, " ");
    }
    if (/\btoday\b/.test(work)) {
      constraint.exact = shiftDays(today, 0);
      work = work.replace(/\btoday\b/g, " ");
    }
    if (/\blast week\b/.test(work)) {
      constraint.start = shiftDays(today, -7);
      constraint.end = shiftDays(today, -1);
      work = work.replace(/\blast week\b/g, " ");
    }
    work = work.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, function (_, y, m, d) {
      var dt = new Date(+y, +m - 1, +d);
      if (dt.getFullYear() === +y && dt.getMonth() === +m - 1 && dt.getDate() === +d) constraint.exact = ymd(dt);
      return " ";
    });
    work = work.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, function (_, m, d, y) {
      var dt = new Date(+y, +m - 1, +d);
      if (dt.getFullYear() === +y && dt.getMonth() === +m - 1 && dt.getDate() === +d) constraint.exact = ymd(dt);
      return " ";
    });
    work = norm(work);
    var dayRe = new RegExp("\\b(" + MONTH_RE + ")\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b", "g");
    work = work.replace(dayRe, function (_, month, day, year) {
      constraint.month = MONTHS[month];
      constraint.day = +day;
      if (year) constraint.year = +year;
      return " ";
    });
    var monthYearRe = new RegExp("\\b(" + MONTH_RE + ")\\s+(\\d{4})\\b", "g");
    work = work.replace(monthYearRe, function (_, month, year) {
      constraint.month = MONTHS[month];
      constraint.year = +year;
      return " ";
    });
    var tokens = norm(work).split(" ").filter(Boolean).filter(function (token) {
      if (/^\d{4}$/.test(token)) {
        var year = +token;
        if (year >= 1990 && year <= 2100) {
          constraint.year = year;
          return false;
        }
      }
      return true;
    });
    return { raw: String(raw || "").trim(), tokens: tokens, constraint: constraint };
  }

  function dateNumber(iso) {
    var parts = iso.split("-");
    return (+parts[0]) * 10000 + (+parts[1]) * 100 + (+parts[2]);
  }

  function dateOk(iso, c) {
    if (!hasDate(c)) return true;
    var n = dateNumber(iso);
    var parts = fromYmd(n);
    if (c.exact && n !== c.exact) return false;
    if (c.start && n < c.start) return false;
    if (c.end && n > c.end) return false;
    if (c.month && parts.m !== c.month) return false;
    if (c.day && parts.d !== c.day) return false;
    if (c.year && parts.y !== c.year) return false;
    return true;
  }

  function tokenHit(token, text) {
    if (!token) return true;
    if (token === "gp") return text.indexOf("grand prix") !== -1 || text.split(" ").indexOf("gp") !== -1;
    if (token.length === 1) return text.split(" ").indexOf(token) !== -1;
    if (text.indexOf(token) !== -1) return true;
    return text.split(" ").some(function (word) { return word.indexOf(token) === 0; });
  }

  function textOk(clip, parsed) {
    if (!parsed.tokens.length) return true;
    var text = blob(clip);
    return parsed.tokens.every(function (token) { return tokenHit(token, text); });
  }

  function selectionOk(clip, selection) {
    if (!selection || selection.type === "all") return true;
    if (selection.type === "league") return clip.leagueId === selection.id;
    if (selection.type === "team") return (clip.teams || []).indexOf(selection.name) !== -1;
    return true;
  }

  function sportOk(clip, sport) {
    if (!sport || sport === "all") return true;
    var league = leagueOf(clip.leagueId);
    return !!league && league.sport === sport;
  }

  function clipVisible(clip, parsed, opts) {
    opts = opts || {};
    return sportOk(clip, opts.sport) && selectionOk(clip, opts.selection) && dateOk(clip.date, parsed.constraint) && textOk(clip, parsed);
  }

  function scoreClip(clip, parsed) {
    if (!parsed.raw) return 0;
    var title = norm(clip.title);
    var text = blob(clip);
    var q = norm(parsed.raw);
    var score = 0;
    if (title === q) score += 120;
    if (q && title.indexOf(q) !== -1) score += 50;
    (clip.teams || []).forEach(function (name) {
      if (norm(name) === q) score += 80;
    });
    (clip.events || []).forEach(function (name) {
      var n = norm(name);
      if (n === q) score += 90;
      else if (q && n.indexOf(q) !== -1) score += 40;
    });
    parsed.tokens.forEach(function (token) {
      if (tokenHit(token, title)) score += 12;
      else if (tokenHit(token, text)) score += 4;
    });
    return score;
  }

  function filterClips(clips, query, opts) {
    opts = opts || {};
    var parsed = parseSearch(query, opts.today);
    var list = (clips || []).filter(function (clip) { return clipVisible(clip, parsed, opts); });
    list.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return scoreClip(b, parsed) - scoreClip(a, parsed);
    });
    return list;
  }

  function scoreName(names, query) {
    var q = norm(query);
    var best = 0;
    names.forEach(function (name) {
      var n = norm(name);
      if (!n || !q) return;
      if (n === q) best = Math.max(best, 100);
      else if (n.indexOf(q) === 0) best = Math.max(best, 80);
      else if (n.indexOf(q) !== -1) best = Math.max(best, 55);
      else if (q.split(" ").every(function (token) { return tokenHit(token, n); })) best = Math.max(best, 45);
    });
    return best;
  }

  function suggestions(query, clips, opts) {
    opts = opts || {};
    var parsed = parseSearch(query, opts.today);
    var q = parsed.raw;
    if (!norm(q)) return [];
    var out = [];
    if (parsed.tokens.length) {
      (root.THR_LEAGUES || []).forEach(function (league) {
        var score = scoreName([league.name, league.tag, league.sportLabel].concat(league.aliases || []), q);
        if (score) out.push({ type: "league", label: league.name, detail: league.sportLabel, value: league.name, score: score });
      });
      (root.THR_LEAGUES || []).forEach(function (league) {
        league.teams.forEach(function (team) {
          var score = scoreName([team.name].concat(team.aliases), q);
          if (score) out.push({ type: "team", label: team.name, detail: league.name, value: team.name, score: score });
        });
      });
      var seenEvents = {};
      function addEvent(label, aliases) {
        var key = norm(label);
        if (!key || seenEvents[key]) return;
        seenEvents[key] = true;
        var score = scoreName([label].concat(aliases || []), q);
        if (score) out.push({ type: "event", label: label, detail: "Series", value: label, score: score + 5 });
      }
      SERIES.forEach(function (series) { addEvent(series.name, series.aliases); });
      (clips || []).forEach(function (clip) {
        (clip.events || []).forEach(function (event) { addEvent(event); });
      });
    }
    var matched = filterClips(clips, query, opts).slice().sort(function (a, b) {
      var diff = scoreClip(b, parsed) - scoreClip(a, parsed);
      if (diff) return diff;
      return a.date < b.date ? 1 : -1;
    });
    matched.slice(0, 4).forEach(function (clip) {
      var league = leagueOf(clip.leagueId);
      out.push({
        type: "clip",
        label: clip.title,
        detail: (league ? league.name : "") + " · " + formatDate(clip.date),
        value: clip.id,
        score: 30 + scoreClip(clip, parsed)
      });
    });
    var limits = { league: 3, team: 4, event: 3, clip: 4 };
    var counts = { league: 0, team: 0, event: 0, clip: 0 };
    return out.sort(function (a, b) { return b.score - a.score; }).filter(function (item) {
      if (counts[item.type] >= limits[item.type]) return false;
      counts[item.type] += 1;
      return true;
    });
  }

  function formatDate(iso) {
    var parts = iso.split("-");
    var dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  root.THRSearch = {
    parseSearch: parseSearch,
    filterClips: filterClips,
    suggestions: suggestions,
    formatDate: formatDate,
    norm: norm
  };
})(typeof window !== "undefined" ? window : globalThis);
