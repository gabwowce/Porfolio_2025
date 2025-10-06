document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".newsletter");
  if (!form) return;

  const btn = form.querySelector("button");
  const note = form.querySelector(".form-note");

  // Tiny inline SVG icons
  const icons = {
    spinner:
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" opacity=".25"/><path class="svg-spin" d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    check:
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross:
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  };

  const setBtnState = (state, text, noteText = "", noteKind = "") => {
    btn.classList.remove("is-sending", "is-ok", "is-err");
    note.className = "form-note";
    if (state) btn.classList.add(state);
    note.textContent = "";
    if (noteText) {
      note.textContent = noteText;
      if (noteKind) note.classList.add(noteKind);
    }
    btn.innerHTML = text; // replace button content (icon + label)
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Sending…
    btn.disabled = true;
    setBtnState("is-sending", `${icons.spinner} Sending…`);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });

      if (res.ok) {
        form.reset();
        setBtnState(
          "is-ok",
          `${icons.check} Sent`,
          "Thanks! Your message was sent.",
          "ok"
        );
      } else {
        let msg = "Could not send. Please try again.";
        try {
          const data = await res.json();
          if (
            data &&
            Array.isArray(data.errors) &&
            data.errors[0] &&
            typeof data.errors[0].message === "string"
          ) {
            msg = data.errors[0].message;
          }
        } catch (_) {}
        setBtnState("is-err", `${icons.cross} Try again`, msg, "err");
      }
    } catch {
      setBtnState(
        "is-err",
        `${icons.cross} Try again`,
        "Network error. Check your connection and try again.",
        "err"
      );
    } finally {
      // Restore default button after 3.5s
      setTimeout(() => {
        btn.disabled = false;
        setBtnState("", "Say hi 👋");
      }, 8000);
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const menu = document.getElementById("themeMenu");
  const btn = document.getElementById("themeBtn");
  const list = menu.querySelector(".theme-list");
  const items = Array.from(list.querySelectorAll("[data-theme]"));

  // apply saved theme
  const saved = localStorage.getItem("theme") || "cream";
  applyTheme(saved);

  // open/close
  const setOpen = (open) => {
    menu.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", () =>
    setOpen(menu.getAttribute("aria-expanded") !== "true")
  );

  // choose theme
  items.forEach((el) => {
    el.addEventListener("click", () => {
      const t = el.dataset.theme;
      applyTheme(t);
      setOpen(false);
      btn.focus();
    });
  });

  // a11y: esc / outside click
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) setOpen(false);
  });

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    // update current state
    items.forEach((i) =>
      i.setAttribute(
        "aria-current",
        i.dataset.theme === theme ? "true" : "false"
      )
    );
    // recolor header swatch
    // (nebūtina: rely on CSS var)
  }

  /* Header blur tik kai scroll > 8px */
  const setScrolled = () => {
    document.documentElement.classList.toggle("scrolled", window.scrollY > 8);
  };
  setScrolled();
  window.addEventListener("scroll", setScrolled, {
    passive: true,
  });

  /* Process rail – tik jei yra DOM'e */
  const rail = document.getElementById("processRail");
  if (rail) {
    const updateProgress = () => {
      const rect = rail.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.max(
        0,
        Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
      );
      const ratio = Math.max(
        0,
        Math.min(1, visible / Math.min(rect.height, vh))
      );
      rail.style.setProperty("--progress", ratio.toFixed(3));
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, {
      passive: true,
    });
    window.addEventListener("resize", updateProgress);

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            rail.style.setProperty("--pct", "100");
          }
        });
      },
      {
        threshold: 0.2,
      }
    );
    obs.observe(rail);
  }

  /* Segmented filtras (jei naudojamas) */
  const seg = document.querySelector(".segmented");
  if (seg) {
    const btns = Array.from(seg.querySelectorAll(".seg-btn"));
    let thumb = seg.querySelector(".seg-thumb");
    if (!thumb) {
      thumb = document.createElement("span");
      thumb.className = "seg-thumb";
      seg.prepend(thumb);
    }

    const moveThumb = (btn) => {
      const x = btn.offsetLeft;
      const w = btn.offsetWidth;
      thumb.style.width = w + "px";
      thumb.style.transform = `translateX(${x}px)`;
    };

    const setActive = (btn) => {
      btns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      moveThumb(btn);
    };

    // init
    const current = seg.querySelector(".seg-btn.is-active") || btns[0];
    if (current) setActive(current);

    // click
    seg.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      setActive(btn);

      const f = btn.dataset.filter; // 'all' | 'web' | 'mobile' | 'desktop'
      document.querySelectorAll(".featured-grid .project").forEach((card) => {
        const cats = (card.dataset.cat || "").split(/\s+/); // palaiko 'web desktop'
        const show = f === "all" || cats.includes(f);
        card.classList.toggle("is-hidden", !show);
      });
    });

    // responsive – perbraižyti poziciją
    window.addEventListener("resize", () =>
      moveThumb(seg.querySelector(".seg-btn.is-active") || btns[0])
    );
  }
});

(function () {
  if (window.__navInit) return;
  window.__navInit = true;

  var body = document.body;
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  var overlay = document.getElementById("navOverlay");
  var closeBtn = document.getElementById("navClose");

  function setNavOpen(open) {
    body.classList.toggle("nav-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
    if (overlay) overlay.hidden = !open;
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setNavOpen(!body.classList.contains("nav-open"));
    });
  }
  if (overlay) {
    overlay.addEventListener("click", function () {
      setNavOpen(false);
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      setNavOpen(false);
    });
  }
  if (nav) {
    nav.addEventListener("click", function (e) {
      if (e && e.target && e.target.closest && e.target.closest("a")) {
        setNavOpen(false);
      }
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNavOpen(false);
  });
})();
/* === Featured image rotator === */
(() => {
  const wrap = document.querySelector(".project-xl .container-canva");
  if (!wrap) return;

  const track = wrap.querySelector("#card .slides");
  const slides = Array.from(track ? track.children : []);
  const dots = wrap.querySelector(".carousel-ui .dots");
  const carEl = wrap.querySelector("#card .carousel");
  if (!track || slides.length < 2 || !dots || !carEl) return;

  const intervalMs = Number(carEl.getAttribute("data-auto")) || 3000;

  // sukurti dots
  slides.forEach((_, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Go to slide ${idx + 1}`);
    b.addEventListener("click", () => go(idx, true));
    dots.appendChild(b);
  });

  let i = 0,
    timer = null;
  const update = () => {
    track.style.transform = `translateX(-${i * 100}%)`;
    dots
      .querySelectorAll("button")
      .forEach((b, idx) => b.setAttribute("aria-current", String(idx === i)));
  };
  const go = (to, user = false) => {
    i = (to + slides.length) % slides.length;
    update();
    if (user) restart();
  };
  const nextSlide = () => go(i + 1);

  const start = () => {
    if (!timer) timer = setInterval(nextSlide, intervalMs);
  };
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  const restart = () => {
    stop();
    start();
  };

  // pauzė ant hover
  wrap.addEventListener("mouseenter", stop);
  wrap.addEventListener("mouseleave", start);

  // start tik kai matoma
  const io = new IntersectionObserver(
    ([e]) => {
      e.isIntersecting ? start() : stop();
    },
    {
      threshold: 0.2,
    }
  );
  io.observe(wrap);

  // init
  update();
})();
// Lengvas IO su „stagger“
(() => {
  const opts = { threshold: 0.12, rootMargin: "0px 0px -8% 0px" };

  // 1) Grupės: .u-stagger (vaikai po vieną su delay)
  const ioGroup = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const wrap = e.target;

      // paimam TIK animuojamus vaikus
      const kids = Array.from(wrap.querySelectorAll(":scope > .u-reveal"));
      // nustatom jų indeksą --i (kad neskaičiuotų neanimuojamų elementų)
      kids.forEach((el, i) => el.style.setProperty("--i", i));

      // uždedam in-view klases (delay pritaikys CSS pagal --i ir --stagger)
      wrap.classList.add("is-inview");
      kids.forEach((el) => el.classList.add("is-inview"));

      ioGroup.unobserve(wrap); // vieną kartą
    });
  }, opts);

  document.querySelectorAll(".u-stagger").forEach((w) => ioGroup.observe(w));

  // 2) Pavieniai elementai: .u-reveal (ne esantys u-stagger vaikais)
  const ioSingle = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-inview");
      ioSingle.unobserve(e.target);
    });
  }, opts);

  document.querySelectorAll(".u-reveal").forEach((el) => {
    // jei nėra artimo .u-stagger tėvo – animuojam kaip singlą
    const parent = el.parentElement;
    if (!(parent && parent.classList.contains("u-stagger"))) {
      ioSingle.observe(el);
    }
  });
})();
