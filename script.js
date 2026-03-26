const revealItems = document.querySelectorAll("[data-reveal]");
const filterButtons = document.querySelectorAll(".gallery-filter");
const galleryCards = document.querySelectorAll(".gallery-card");
const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const navLinks = document.querySelectorAll(".site-nav a, .header-actions a");
const heroSection = document.querySelector(".hero");
const heroBg = document.querySelector(".hero-bg");
const counterItems = document.querySelectorAll("[data-count]");
const tiltSelectors = [
  ".hero-main-shot",
  ".highlight-card",
  ".insta-card",
  ".feature-card",
  ".command-card",
  ".metric-card",
  ".gallery-card",
  ".list-card",
  ".contact-card",
  ".timeline-item",
  ".page-hero-card",
  ".event-card"
];

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("revealed"));
}

if (filterButtons.length) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      galleryCards.forEach((card) => {
        const matches = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !matches);
      });
    });
  });
}

if (menuToggle && siteHeader) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("is-menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("is-menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    siteHeader.classList.remove("is-menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
}

const enableTilt =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (enableTilt) {
  const tiltCards = document.querySelectorAll(tiltSelectors.join(","));

  tiltCards.forEach((card) => {
    card.classList.add("tilt-card");

    const resetTilt = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    };

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 10;
      const rotateX = (0.5 - y) * 10;

      card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", resetTilt);
    card.addEventListener("pointercancel", resetTilt);
    card.addEventListener("blur", resetTilt);
  });
}

const progressBar = document.createElement("div");
progressBar.className = "scroll-progress";
document.body.appendChild(progressBar);

const backToTop = document.createElement("button");
backToTop.className = "back-to-top";
backToTop.type = "button";
backToTop.textContent = "Back to top";
backToTop.setAttribute("aria-label", "Back to top");
document.body.appendChild(backToTop);

if (heroSection) {
  heroSection.style.setProperty("--hero-scale", "1.08");
  requestAnimationFrame(() => {
    heroSection.style.setProperty("--hero-scale", "1.02");
  });
}

const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  progressBar.style.width = `${progress}%`;

  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", scrollTop > 10);
  }

  backToTop.classList.toggle("is-visible", scrollTop > 400);

  if (heroSection && heroBg) {
    const rect = heroSection.getBoundingClientRect();
    const offset = Math.min(Math.max(-rect.top, 0), window.innerHeight);
    heroBg.style.setProperty("--hero-offset", `${offset * 0.12}px`);
  }
};

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", handleScroll);
handleScroll();

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const animateCounter = (element) => {
  const target = Number(element.dataset.count);
  if (Number.isNaN(target)) {
    return;
  }

  if (prefersReducedMotion) {
    element.textContent = target.toString();
    return;
  }

  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(target * progress);
    element.textContent = value.toString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

if (counterItems.length) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  counterItems.forEach((item) => counterObserver.observe(item));
}
