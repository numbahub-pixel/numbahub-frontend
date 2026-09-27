document.addEventListener("DOMContentLoaded", async () => {
  const sidebarHost = document.getElementById("sidebar");
  const isPage = window.location.pathname.split("/").pop() !== "index.html" && !window.location.pathname.endsWith("/") && !window.location.pathname.endsWith("numbahub-dashboard");
  const base = isPage ? "../" : "";

  if (sidebarHost) {
    try {
      const response = await fetch(`${base}components/sidebar.html`);
      if (!response.ok) throw new Error(`Sidebar request failed: ${response.status}`);
      sidebarHost.innerHTML = (await response.text()).replaceAll("__ROOT__", base);
    } catch (error) {
      console.error("Unable to load sidebar:", error);
      sidebarHost.innerHTML = '<p style="padding:20px;color:#b42318">Sidebar could not be loaded. Run this project with VS Code Live Server.</p>';
    }
  }

  if (window.lucide) lucide.createIcons();

  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");
  const menuButton = document.querySelector("[data-menu]");

  document.querySelectorAll("[data-route]").forEach(link => {
    const route = link.dataset.route;
    link.href = base + route;
    const current = window.location.pathname.split("/").pop() || "index.html";
    link.classList.toggle("active", route.endsWith(current));
  });

  menuButton?.addEventListener("click", () => {
    sidebar?.classList.add("open");
    overlay?.classList.add("show");
  });
  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
  });
  document.querySelectorAll("[data-close-menu]").forEach(el => el.addEventListener("click", () => {
    sidebar?.classList.remove("open"); overlay?.classList.remove("show");
  }));
  document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "fund") alert("Wallet funding flow will be connected here.");
    if (action === "save") alert("Settings saved.");
    if (action === "buy") alert("Purchase flow will be connected here.");
  }));
  const search = document.querySelector("[data-search]");
  search?.addEventListener("input", () => {
    const query = search.value.toLowerCase().trim();
    document.querySelectorAll("[data-searchable]").forEach(item => item.style.display = item.textContent.toLowerCase().includes(query) ? "" : "none");
  });
});
