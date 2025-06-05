// Detect system preference
function getPreferredColorScheme() {
  if (window.localStorage.getItem("color-scheme")) {
    return window.localStorage.getItem("color-scheme");
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setColorScheme(scheme) {
  document.documentElement.setAttribute("data-color-scheme", scheme);
  window.localStorage.setItem("color-scheme", scheme);
  // Update icon
  const btn = document.getElementById("darkModeToggle");
  if (btn) {
    btn.innerHTML = scheme === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Set initial color scheme
  setColorScheme(getPreferredColorScheme());
  // Toggle handler
  const btn = document.getElementById("darkModeToggle");
  if (btn) {
    btn.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-color-scheme") === "dark" ? "dark" : "light";
      setColorScheme(current === "dark" ? "light" : "dark");
    });
  }
});
