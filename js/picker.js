/* Shared league-then-team favorites picker. */
(function (root) {
  function mount(container, initial, onChange) {
    var leagues = (root.THR_LEAGUES || []).slice();
    var selectedLeagues = (initial && initial.leagues ? initial.leagues : []).slice();
    var selectedTeams = (initial && initial.teams ? initial.teams : []).map(function (team) {
      return { leagueId: team.leagueId, name: team.name };
    });
    var active = leagues[0] ? leagues[0].id : "";
    var filter = "";

    container.innerHTML = "";
    var layout = document.createElement("div");
    layout.className = "picker";
    var nav = document.createElement("div");
    nav.className = "league-nav";
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", "Leagues");
    var panel = document.createElement("div");
    panel.className = "league-panel";
    panel.setAttribute("role", "tabpanel");
    layout.appendChild(nav);
    layout.appendChild(panel);
    container.appendChild(layout);

    function hasTeam(leagueId, name) {
      return selectedTeams.some(function (team) { return team.leagueId === leagueId && team.name === name; });
    }

    function countFor(leagueId) {
      var n = selectedLeagues.indexOf(leagueId) !== -1 ? 1 : 0;
      selectedTeams.forEach(function (team) { if (team.leagueId === leagueId) n += 1; });
      return n;
    }

    function read() {
      return {
        leagues: selectedLeagues.slice(),
        teams: selectedTeams.map(function (team) { return { leagueId: team.leagueId, name: team.name }; })
      };
    }

    function emit() {
      if (typeof onChange === "function") onChange(read());
    }

    function drawNav() {
      nav.innerHTML = "";
      leagues.forEach(function (league) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "league-tab" + (league.id === active ? " on" : "");
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", league.id === active ? "true" : "false");
        button.id = "league-tab-" + league.id;
        var count = countFor(league.id);
        button.innerHTML = "";
        var label = document.createElement("span");
        label.textContent = league.name;
        button.appendChild(label);
        if (count) {
          var badge = document.createElement("span");
          badge.className = "count";
          badge.textContent = String(count);
          button.appendChild(badge);
        }
        button.addEventListener("click", function () {
          active = league.id;
          filter = "";
          draw();
        });
        nav.appendChild(button);
      });
    }

    function drawPanel() {
      var league = leagues.filter(function (item) { return item.id === active; })[0];
      panel.innerHTML = "";
      if (!league) return;
      panel.setAttribute("aria-labelledby", "league-tab-" + league.id);
      var head = document.createElement("div");
      head.className = "panel-head";
      var title = document.createElement("h2");
      title.textContent = league.name;
      var sub = document.createElement("p");
      sub.textContent = league.teams.length
        ? "Follow the whole league, specific teams, or both."
        : "This is an individual tour. Follow the whole tour.";
      head.appendChild(title);
      head.appendChild(sub);
      panel.appendChild(head);

      var follow = document.createElement("button");
      follow.type = "button";
      follow.className = "follow-league";
      follow.setAttribute("aria-pressed", selectedLeagues.indexOf(league.id) !== -1 ? "true" : "false");
      follow.textContent = selectedLeagues.indexOf(league.id) !== -1 ? "Following all of " + league.name : "Follow all of " + league.name;
      follow.addEventListener("click", function () {
        var index = selectedLeagues.indexOf(league.id);
        if (index === -1) selectedLeagues.push(league.id);
        else selectedLeagues.splice(index, 1);
        draw();
        emit();
      });
      panel.appendChild(follow);

      if (!league.teams.length) return;

      var filterLabel = document.createElement("label");
      filterLabel.className = "team-filter";
      filterLabel.textContent = "Filter teams";
      var filterInput = document.createElement("input");
      filterInput.type = "search";
      filterInput.value = filter;
      filterInput.placeholder = "Type a team";
      filterInput.setAttribute("aria-label", "Filter teams in " + league.name);
      filterLabel.appendChild(filterInput);
      panel.appendChild(filterLabel);
      filterInput.addEventListener("input", function () {
        filter = filterInput.value;
        drawTeams(league);
      });

      var list = document.createElement("div");
      list.className = "team-grid";
      list.id = "teamGrid";
      panel.appendChild(list);
      drawTeams(league);
    }

    function drawTeams(league) {
      var list = panel.querySelector("#teamGrid");
      if (!list) return;
      list.innerHTML = "";
      var q = filter.trim().toLowerCase();
      var shown = 0;
      league.teams.forEach(function (team) {
        var hay = (team.name + " " + team.aliases.join(" ")).toLowerCase();
        if (q && hay.indexOf(q) === -1) return;
        shown += 1;
        var pressed = hasTeam(league.id, team.name);
        var button = document.createElement("button");
        button.type = "button";
        button.className = "team-pick" + (pressed ? " on" : "");
        button.setAttribute("aria-pressed", pressed ? "true" : "false");
        button.textContent = team.name;
        button.addEventListener("click", function () {
          if (hasTeam(league.id, team.name)) {
            selectedTeams = selectedTeams.filter(function (item) {
              return !(item.leagueId === league.id && item.name === team.name);
            });
          } else {
            selectedTeams.push({ leagueId: league.id, name: team.name });
          }
          drawNav();
          drawTeams(league);
          emit();
        });
        list.appendChild(button);
      });
      if (!shown) {
        var empty = document.createElement("p");
        empty.className = "help";
        empty.textContent = "No teams match that filter.";
        list.appendChild(empty);
      }
    }

    function draw() {
      drawNav();
      drawPanel();
    }

    draw();
    return { read: read };
  }

  root.THRPicker = { mount: mount };
})(typeof window !== "undefined" ? window : globalThis);
