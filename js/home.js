/* Rotates the four marquee cards under the homepage headline.
   The cards are official clips already listed in js/highlights.js:
   NBA Finals Game 5, the Messi free kick, a grand slam, and the Azerbaijan Grand Prix. */
(function () {
  var root = document.getElementById("marquee");
  if (!root) return;
  var track = root.querySelector(".marquee-track");
  if (!track || track.children.length < 2) return;

  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var timer = null;
  var paused = false;

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (motion.matches || paused) return;
    timer = window.setInterval(function () {
      var first = track.firstElementChild;
      if (first) track.appendChild(first);
    }, 4000);
  }

  root.addEventListener("mouseenter", function () {
    paused = true;
    stop();
  });
  root.addEventListener("mouseleave", function () {
    paused = false;
    start();
  });
  root.addEventListener("focusin", function () {
    paused = true;
    stop();
  });
  root.addEventListener("focusout", function (event) {
    if (root.contains(event.relatedTarget)) return;
    paused = false;
    start();
  });
  if (motion.addEventListener) {
    motion.addEventListener("change", start);
  }
  start();
})();
