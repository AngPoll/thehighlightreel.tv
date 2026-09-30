/* Demo accounts live in localStorage. Passwords are salted SHA-256 hashes, never plaintext. */
(function (root) {
  var USERS_KEY = "thr.users";
  var SESSION_KEY = "thr.session";

  function loadUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function bytesToHex(buf) {
    var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    var out = "";
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
    return out;
  }

  function randomSalt() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }

  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return randomSalt() + randomSalt();
  }

  function hashPassword(password, salt) {
    var data = new TextEncoder().encode(salt + ":" + password);
    return crypto.subtle.digest("SHA-256", data).then(bytesToHex);
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function publicUser(user) {
    if (!user) return null;
    var fav = user.favorites || {};
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      favorites: {
        leagues: Array.isArray(fav.leagues) ? fav.leagues.slice() : [],
        teams: Array.isArray(fav.teams) ? fav.teams.map(function (t) {
          return { leagueId: t.leagueId, name: t.name };
        }) : []
      },
      hideBlocked: !!user.hideBlocked,
      createdAt: user.createdAt
    };
  }

  function currentRecord() {
    var id;
    try { id = localStorage.getItem(SESSION_KEY); } catch (e) { return null; }
    if (!id) return null;
    var user = loadUsers().find(function (u) { return u.id === id; });
    if (!user) {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      return null;
    }
    return user;
  }

  function fail(field, error) {
    return { ok: false, field: field, error: error };
  }

  function signUp(input) {
    var name = String((input && input.name) || "").trim();
    var email = String((input && input.email) || "").trim().toLowerCase();
    var password = String((input && input.password) || "");
    if (!name) return Promise.resolve(fail("name", "Enter a name."));
    if (name.length > 40) return Promise.resolve(fail("name", "Use 40 characters or fewer."));
    if (!validEmail(email)) return Promise.resolve(fail("email", "Enter a valid email address."));
    if (password.length < 8) return Promise.resolve(fail("password", "Password must be at least 8 characters."));
    var users = loadUsers();
    if (users.some(function (u) { return u.email === email; })) {
      return Promise.resolve(fail("email", "An account with that email already exists."));
    }
    var salt = randomSalt();
    return hashPassword(password, salt).then(function (passwordHash) {
      var user = {
        id: uid(),
        name: name,
        email: email,
        salt: salt,
        passwordHash: passwordHash,
        favorites: { leagues: [], teams: [] },
        hideBlocked: false,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
      localStorage.setItem(SESSION_KEY, user.id);
      return { ok: true, user: publicUser(user) };
    });
  }

  function logIn(input) {
    var email = String((input && input.email) || "").trim().toLowerCase();
    var password = String((input && input.password) || "");
    if (!email) return Promise.resolve(fail("email", "Enter your email."));
    if (!validEmail(email)) return Promise.resolve(fail("email", "Enter a valid email address."));
    if (!password) return Promise.resolve(fail("password", "Enter your password."));
    var user = loadUsers().find(function (u) { return u.email === email; });
    if (!user) return Promise.resolve(fail("email", "No account found for that email."));
    return hashPassword(password, user.salt).then(function (hash) {
      if (hash !== user.passwordHash) return fail("password", "That password is incorrect.");
      localStorage.setItem(SESSION_KEY, user.id);
      return { ok: true, user: publicUser(user) };
    });
  }

  function logOut() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function currentUser() {
    return publicUser(currentRecord());
  }

  function updateUser(patch) {
    var users = loadUsers();
    var record = currentRecord();
    if (!record) return Promise.resolve(fail("", "You are signed out."));
    var index = users.findIndex(function (u) { return u.id === record.id; });
    var user = users[index];
    patch = patch || {};
    if (patch.name != null) {
      var name = String(patch.name).trim();
      if (!name) return Promise.resolve(fail("name", "Enter a name."));
      if (name.length > 40) return Promise.resolve(fail("name", "Use 40 characters or fewer."));
      user.name = name;
    }
    if (patch.email != null) {
      var email = String(patch.email).trim().toLowerCase();
      if (!validEmail(email)) return Promise.resolve(fail("email", "Enter a valid email address."));
      if (users.some(function (u) { return u.email === email && u.id !== user.id; })) {
        return Promise.resolve(fail("email", "An account with that email already exists."));
      }
      user.email = email;
    }
    var nextPassword = patch.password == null ? "" : String(patch.password);
    if (nextPassword.trim() && nextPassword.length < 8) {
      return Promise.resolve(fail("password", "Password must be at least 8 characters."));
    }
    if (patch.hideBlocked != null) user.hideBlocked = !!patch.hideBlocked;
    if (patch.favorites) user.favorites = normalizeFavorites(patch.favorites);
    var finish = function () {
      users[index] = user;
      saveUsers(users);
      return { ok: true, user: publicUser(user) };
    };
    if (nextPassword.trim()) {
      user.salt = randomSalt();
      return hashPassword(nextPassword, user.salt).then(function (passwordHash) {
        user.passwordHash = passwordHash;
        return finish();
      });
    }
    return Promise.resolve(finish());
  }

  function normalizeFavorites(favorites) {
    var leagues = [];
    var teams = [];
    (favorites.leagues || []).forEach(function (id) {
      if (leagues.indexOf(id) === -1) leagues.push(id);
    });
    (favorites.teams || []).forEach(function (team) {
      if (!team || !team.leagueId || !team.name) return;
      var key = team.leagueId + "::" + team.name;
      if (teams.some(function (t) { return t.leagueId + "::" + t.name === key; })) return;
      teams.push({ leagueId: team.leagueId, name: team.name });
    });
    return { leagues: leagues, teams: teams };
  }

  function deleteUser() {
    var record = currentRecord();
    if (!record) return;
    saveUsers(loadUsers().filter(function (u) { return u.id !== record.id; }));
    logOut();
  }

  function getFavorites() {
    var user = currentUser();
    if (!user) return { leagues: [], teams: [] };
    return user.favorites;
  }

  function setFavorites(favorites) {
    var users = loadUsers();
    var record = currentRecord();
    if (!record) return { ok: false, error: "You are signed out." };
    var index = users.findIndex(function (u) { return u.id === record.id; });
    users[index].favorites = normalizeFavorites(favorites || {});
    saveUsers(users);
    return { ok: true, favorites: publicUser(users[index]).favorites };
  }

  function hasFavorites(user) {
    var fav = (user || currentUser() || {}).favorites || { leagues: [], teams: [] };
    return (fav.leagues && fav.leagues.length > 0) || (fav.teams && fav.teams.length > 0);
  }

  root.THRAuth = {
    signUp: signUp,
    logIn: logIn,
    logOut: logOut,
    currentUser: currentUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    getFavorites: getFavorites,
    setFavorites: setFavorites,
    hasFavorites: hasFavorites
  };
})(typeof window !== "undefined" ? window : globalThis);
