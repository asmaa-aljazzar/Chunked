const greeting = document.querySelector("#greeting");
const todayDate = document.querySelector("#today-date");

if (greeting) {
  const hour = new Date().getHours();
  greeting.textContent = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

if (todayDate) {
  todayDate.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

const revealTargets = document.querySelectorAll(
  ".dashboard-content > section, .dashboard-grid > *, .dashboard-content > .demo-note",
);
const supportsScrollReveal = "IntersectionObserver" in window
  && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (supportsScrollReveal) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });

  revealTargets.forEach((target, index) => {
    target.classList.add("dashboard-reveal");
    target.style.setProperty("--reveal-delay", `${Math.min(index * 65, 260)}ms`);
    revealObserver.observe(target);
  });
}
