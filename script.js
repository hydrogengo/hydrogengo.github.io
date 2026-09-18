const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

openSidebar?.addEventListener("click", () => {
  sidebar.classList.add("open");
});

closeSidebar?.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

document.querySelectorAll(".sidebar nav a").forEach(link => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
});

// Highlight the current section while scrolling.
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll('.sidebar nav a[href^="#"]');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove("active"));
      const current = document.querySelector(
        `.sidebar nav a[href="#${entry.target.id}"]`
      );
      current?.classList.add("active");
    }
  });
}, { threshold: 0.45 });

sections.forEach(section => observer.observe(section));

const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");

function updateThemeLabel() {
  if (!themeLabel) return;
  themeLabel.textContent = document.body.classList.contains("light-mode")
    ? "☀ Light Mode"
    : "☾ Dark Mode";
}

if (localStorage.getItem("hydrogen-theme") === "light") {
  document.body.classList.add("light-mode");
}

updateThemeLabel();

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("hydrogen-theme", isLight ? "light" : "dark");
  updateThemeLabel();
});
