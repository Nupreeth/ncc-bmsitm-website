document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const clearScrolled = () => header.classList.remove("scrolled");

  clearScrolled();
  window.addEventListener("scroll", clearScrolled, { passive: true });
  window.addEventListener("resize", clearScrolled);
});
