(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const THEME_KEY = "hydrogen-theme";

  /* ---------------- Theme ---------------- */
  const toggles = [...document.querySelectorAll("[data-theme-toggle]")];
  const themeLabel = document.getElementById("themeLabel");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const isLight = () => root.getAttribute("data-theme") === "light";

  function syncThemeUI() {
    const light = isLight();
    if (themeLabel) themeLabel.textContent = light ? "Light Mode" : "Dark Mode";
    toggles.forEach(btn => btn.setAttribute("aria-pressed", String(light)));
    themeMeta?.setAttribute("content", light ? "#f3faf5" : "#040c08");
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    syncThemeUI();
  }

  function onToggle(event) {
    const next = isLight() ? "dark" : "light";
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;

    // Circular reveal from the toggle where the browser supports it
    if (document.startViewTransition && !reduceMotion) {
      root.classList.add("theme-vt");
      const transition = document.startViewTransition(() => applyTheme(next));
      transition.ready.then(() => {
        const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(() => {});
      transition.finished.finally(() => root.classList.remove("theme-vt"));
    } else {
      // Smooth colour cross-fade fallback
      root.classList.add("theme-anim");
      applyTheme(next);
      setTimeout(() => root.classList.remove("theme-anim"), 600);
    }
  }

  toggles.forEach(btn => btn.addEventListener("click", onToggle));
  syncThemeUI();

  // keep open tabs in sync
  window.addEventListener("storage", e => {
    if (e.key === THEME_KEY && (e.newValue === "light" || e.newValue === "dark")) {
      root.setAttribute("data-theme", e.newValue);
      syncThemeUI();
    }
  });

  /* ---------------- Sidebar (mobile) ---------------- */
  const sidebar = document.getElementById("sidebar");
  const openSidebar = document.getElementById("openSidebar");
  const closeSidebar = document.getElementById("closeSidebar");

  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  document.body.appendChild(backdrop);

  function setSidebar(open) {
    if (!sidebar) return;
    sidebar.classList.toggle("open", open);
    backdrop.classList.toggle("show", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  openSidebar?.addEventListener("click", () => setSidebar(true));
  closeSidebar?.addEventListener("click", () => setSidebar(false));
  backdrop.addEventListener("click", () => setSidebar(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setSidebar(false); });
  document.querySelectorAll(".sidebar nav a").forEach(link =>
    link.addEventListener("click", () => setSidebar(false))
  );

  /* ---------------- Active nav highlight ---------------- */
  const hashLinks = [...document.querySelectorAll('.sidebar nav a[href^="#"]')];
  const targets = hashLinks
    .map(link => ({ link, el: document.getElementById(link.getAttribute("href").slice(1)) }))
    .filter(item => item.el);

  if (targets.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const match = targets.find(t => t.el === entry.target);
        if (!match) return;
        hashLinks.forEach(l => l.classList.remove("active"));
        match.link.classList.add("active");
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    targets.forEach(t => spy.observe(t.el));
  }

  /* ---------------- Scroll progress bar ---------------- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);

  let ticking = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    ticking = false;
  }
  addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
  }, { passive: true });
  updateProgress();

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll(
    ".section-heading, .about-grid > *, .tutorial-grid > *, .section > .glass-card, footer"
  );
  revealEls.forEach(el => {
    el.classList.add("reveal");
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains("glass-card") || c.classList.contains("tutorial-card"));
    const index = siblings.indexOf(el);
    if (el.parentElement.classList.contains("about-grid") || el.parentElement.classList.contains("tutorial-grid")) {
      el.style.setProperty("--d", `${Math.max(index, 0) * 0.12}s`);
    }
  });

  if ("IntersectionObserver" in window) {
    const reveal = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(el => reveal.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("in"));
  }

  /* ---------------- Card spotlight + hero tilt (desktop) ---------------- */
  if (finePointer && !reduceMotion) {
    document.addEventListener("pointermove", e => {
      const card = e.target.closest?.(".glass-card, .tutorial-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });

    const heroCard = document.querySelector(".hero-card");
    if (heroCard) {
      heroCard.addEventListener("pointermove", e => {
        const r = heroCard.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        heroCard.style.transform =
          `perspective(900px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) translateY(-4px)`;
      });
      heroCard.addEventListener("pointerleave", () => { heroCard.style.transform = ""; });
    }
  }
})();