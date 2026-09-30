/* League and team catalog. Team aliases cover nicknames and short forms used in search. */
(function (root) {
  var STOP = {
    fc: 1, sc: 1, cf: 1, ac: 1, city: 1, united: 1, town: 1, club: 1,
    de: 1, the: 1, and: 1, of: 1, "04": 1, "05": 1, sox: 1
  };

  var EXTRA = {
    "New York Yankees": ["NYY", "Yanks"],
    "Boston Red Sox": ["Red Sox", "BoSox"],
    "Chicago White Sox": ["White Sox"],
    "New York Mets": ["Mets"],
    "Los Angeles Dodgers": ["Dodgers"],
    "San Diego Padres": ["Padres"],
    "Chicago Cubs": ["Cubs"],
    "Toronto Blue Jays": ["Blue Jays", "Jays"],
    "Athletics": ["A's"],
    "Toronto Maple Leafs": ["Leafs"],
    "Montreal Canadiens": ["Habs", "Canadiens"],
    "Vegas Golden Knights": ["VGK", "Knights"],
    "Chicago Blackhawks": ["Blackhawks"],
    "Vancouver Canucks": ["Canucks"],
    "Edmonton Oilers": ["Oilers"],
    "Golden State Warriors": ["Dubs", "GSW", "Warriors"],
    "Los Angeles Lakers": ["Lakers", "LAL"],
    "LA Clippers": ["Clippers"],
    "Philadelphia 76ers": ["Sixers"],
    "Oklahoma City Thunder": ["OKC", "Thunder"],
    "New York Knicks": ["Knicks"],
    "San Antonio Spurs": ["Spurs"],
    "FC Barcelona": ["Barca", "Barça", "Barca"],
    "Atlético de Madrid": ["Atletico", "Atletico Madrid", "Atleti"],
    "Real Madrid": ["Madrid"],
    "Deportivo Alavés": ["Alaves", "Alavés"],
    "Deportivo de La Coruña": ["Deportivo", "Depor"],
    "Málaga": ["Malaga"],
    "Bayern Munich": ["Bayern", "FC Bayern"],
    "Borussia Dortmund": ["BVB", "Dortmund"],
    "Borussia Mönchengladbach": ["Gladbach", "Monchengladbach"],
    "1. FC Köln": ["Koln", "Köln", "Cologne"],
    "Paris Saint-Germain": ["PSG"],
    "Olympique de Marseille": ["OM", "Marseille"],
    "AS Monaco": ["Monaco"],
    "Olympique Lyonnais": ["Lyon", "OL"],
    "Stade Rennais": ["Rennes"],
    "Stade Brestois": ["Brest"],
    "Manchester City": ["Man City", "ManCity"],
    "Manchester United": ["Man Utd", "Man United", "Man U"],
    "Tottenham Hotspur": ["Spurs", "Tottenham"],
    "Brighton & Hove Albion": ["Brighton"],
    "Wolverhampton Wanderers": ["Wolves"],
    "Nottingham Forest": ["Forest"],
    "Inter": ["Inter Milan", "Internazionale"],
    "AC Milan": ["Milan"],
    "Inter Miami CF": ["Inter Miami"],
    "Red Bull Racing": ["Red Bull"],
    "New England Patriots": ["Pats"],
    "Tampa Bay Buccaneers": ["Bucs"],
    "Green Bay Packers": ["Pack"],
    "Kansas City Chiefs": ["Chiefs"],
    "San Francisco 49ers": ["Niners", "49ers"]
  };

  function team(name) {
    var extra = EXTRA[name] || [];
    var parts = name.split(/\s+/);
    var aliases = extra.slice();
    var last = parts[parts.length - 1].replace(/[^A-Za-z0-9']/g, "");
    if (last && last.length > 2 && !STOP[last.toLowerCase()] && aliases.indexOf(last) === -1) aliases.push(last);
    var initials = parts.filter(function (part) {
      var word = part.replace(/[^A-Za-z0-9]/g, "");
      return word && !STOP[word.toLowerCase()];
    }).map(function (part) { return part.replace(/[^A-Za-z0-9]/g, "").charAt(0); }).join("");
    if (initials.length >= 2 && initials.length <= 4) aliases.push(initials.toUpperCase());
    var seen = {};
    aliases = aliases.filter(function (alias) {
      var key = alias.toLowerCase();
      if (!alias || key === name.toLowerCase() || seen[key]) return false;
      seen[key] = 1;
      return true;
    });
    return { name: name, aliases: aliases };
  }

  function names(list) {
    return list.map(team);
  }

  var leagues = [
    {
      id: "nba", name: "NBA", sport: "basketball", sportLabel: "Basketball", tag: "NBA", geo: false, aliases: [],
      teams: names(["Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets", "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets", "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers", "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat", "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks", "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns", "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors", "Utah Jazz", "Washington Wizards"])
    },
    {
      id: "nfl", name: "NFL", sport: "football", sportLabel: "Football", tag: "NFL", geo: false, aliases: [],
      teams: names(["Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills", "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns", "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers", "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins", "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants", "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers", "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"])
    },
    {
      id: "mlb", name: "MLB", sport: "baseball", sportLabel: "Baseball", tag: "MLB", geo: false, aliases: [],
      teams: names(["Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox", "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians", "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals", "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers", "Minnesota Twins", "New York Mets", "New York Yankees", "Athletics", "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants", "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers", "Toronto Blue Jays", "Washington Nationals"])
    },
    {
      id: "nhl", name: "NHL", sport: "hockey", sportLabel: "Hockey", tag: "NHL", geo: false, aliases: [],
      teams: names(["Anaheim Ducks", "Boston Bruins", "Buffalo Sabres", "Calgary Flames", "Carolina Hurricanes", "Chicago Blackhawks", "Colorado Avalanche", "Columbus Blue Jackets", "Dallas Stars", "Detroit Red Wings", "Edmonton Oilers", "Florida Panthers", "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens", "Nashville Predators", "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators", "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks", "Seattle Kraken", "St. Louis Blues", "Tampa Bay Lightning", "Toronto Maple Leafs", "Utah Mammoth", "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals", "Winnipeg Jets"])
    },
    {
      id: "mls", name: "MLS", sport: "soccer", sportLabel: "Soccer", tag: "MLS", geo: false, aliases: ["Major League Soccer"],
      teams: names(["Atlanta United", "Austin FC", "Charlotte FC", "Chicago Fire FC", "FC Cincinnati", "Colorado Rapids", "Columbus Crew", "D.C. United", "FC Dallas", "Houston Dynamo FC", "Sporting Kansas City", "LA Galaxy", "Los Angeles FC", "Inter Miami CF", "Minnesota United FC", "CF Montréal", "Nashville SC", "New England Revolution", "New York City FC", "New York Red Bulls", "Orlando City SC", "Philadelphia Union", "Portland Timbers", "Real Salt Lake", "San Diego FC", "San Jose Earthquakes", "Seattle Sounders FC", "St. Louis City SC", "Toronto FC", "Vancouver Whitecaps FC"])
    },
    {
      id: "premier-league", name: "Premier League", sport: "soccer", sportLabel: "Soccer", tag: "PREMIER LEAGUE", geo: true, aliases: ["EPL", "Prem"],
      teams: names(["Arsenal", "Aston Villa", "AFC Bournemouth", "Brentford", "Brighton & Hove Albion", "Chelsea", "Coventry City", "Crystal Palace", "Everton", "Fulham", "Hull City", "Ipswich Town", "Leeds United", "Liverpool", "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur"])
    },
    {
      id: "la-liga", name: "La Liga", sport: "soccer", sportLabel: "Soccer", tag: "LALIGA", geo: true, aliases: ["LaLiga", "Laliga"],
      teams: names(["Athletic Club", "Atlético de Madrid", "Osasuna", "Celta Vigo", "Deportivo Alavés", "Elche", "FC Barcelona", "Getafe", "Levante", "Málaga", "Racing Santander", "Rayo Vallecano", "Deportivo de La Coruña", "Espanyol", "Real Betis", "Real Madrid", "Real Sociedad", "Sevilla", "Valencia", "Villarreal"])
    },
    {
      id: "serie-a", name: "Serie A", sport: "soccer", sportLabel: "Soccer", tag: "SERIE A", geo: true, aliases: ["SerieA"],
      teams: names(["Atalanta", "Bologna", "Cagliari", "Como", "Fiorentina", "Frosinone", "Genoa", "Inter", "Juventus", "Lazio", "Lecce", "AC Milan", "Monza", "Napoli", "Parma", "Roma", "Sassuolo", "Torino", "Udinese", "Venezia"])
    },
    {
      id: "bundesliga", name: "Bundesliga", sport: "soccer", sportLabel: "Soccer", tag: "BUNDESLIGA", geo: true, aliases: [],
      teams: names(["FC Augsburg", "Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund", "Borussia Mönchengladbach", "Eintracht Frankfurt", "SV Elversberg", "SC Freiburg", "Hamburger SV", "TSG Hoffenheim", "1. FC Köln", "RB Leipzig", "Mainz 05", "SC Paderborn", "Schalke 04", "Union Berlin", "VfB Stuttgart", "Werder Bremen"])
    },
    {
      id: "ligue-1", name: "Ligue 1", sport: "soccer", sportLabel: "Soccer", tag: "LIGUE 1", geo: true, aliases: ["Ligue1"],
      teams: names(["Angers", "Auxerre", "Stade Brestois", "Le Havre", "Le Mans", "Lens", "Lille", "Lorient", "Olympique Lyonnais", "Olympique de Marseille", "AS Monaco", "Nice", "Paris FC", "Paris Saint-Germain", "Stade Rennais", "Strasbourg", "Toulouse", "Troyes"])
    },
    {
      id: "f1", name: "F1", sport: "f1", sportLabel: "F1", tag: "F1", geo: false, aliases: ["Formula 1", "Formula One"],
      teams: names(["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Racing Bulls", "Aston Martin", "Haas", "Audi", "Alpine", "Cadillac"])
    },
    {
      id: "pga", name: "PGA Tour", sport: "golf", sportLabel: "Golf", tag: "PGA", geo: false, aliases: ["PGA"],
      teams: []
    },
    {
      id: "wta", name: "WTA", sport: "tennis", sportLabel: "Tennis", tag: "WTA", geo: false, aliases: [],
      teams: []
    }
  ];

  function league(id) {
    for (var i = 0; i < leagues.length; i++) if (leagues[i].id === id) return leagues[i];
    return null;
  }

  function findTeam(leagueId, name) {
    var row = league(leagueId);
    if (!row) return null;
    for (var i = 0; i < row.teams.length; i++) if (row.teams[i].name === name) return row.teams[i];
    return null;
  }

  root.THR_LEAGUES = leagues;
  root.THRTeams = {
    leagues: function () { return leagues; },
    league: league,
    findTeam: findTeam
  };
})(typeof window !== "undefined" ? window : globalThis);
