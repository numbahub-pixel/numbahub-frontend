// 🟢 1. INSTANT SIDEBAR INJECTION (No Flashing)
(function loadCachedSidebar() {
  const host = document.getElementById("sidebar");
  const cached = sessionStorage.getItem("sidebar_html");
  if (host && cached) {
    host.innerHTML = cached;
  }
})();

document.addEventListener("DOMContentLoaded", async () => {
  const sidebarHost = document.getElementById("sidebar");
  const isPage = window.location.pathname.includes("/pages/");
  const base = isPage ? "../" : "./";

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // 2. Fetch Live USD/NGN Exchange Rate
  let currentRate = 1500;
  try {
    const rateData = await apiFetch("/currency/rate", { auth: false });
    currentRate = rateData.rate || 1500;
  } catch (err) {}

  const formatBalance = (balanceInNgn) => {
    const usdAmount = Number(balanceInNgn || 0) / currentRate;
    return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 3. Populate from cache instantly
  const cachedUser = typeof getUser === "function" ? getUser() : null;
  if (cachedUser) {
    setText("headerName", `${cachedUser.firstName} ${cachedUser.lastName}`);
    setText("profileEmail", cachedUser.email);
    setText("avatarInitials", `${cachedUser.firstName?.[0] || ""}${cachedUser.lastName?.[0] || ""}`.toUpperCase());
    setText("walletBalance", formatBalance(cachedUser.walletBalance));
    
    const profileName = document.getElementById("profileName");
    if (profileName) profileName.innerHTML = `${cachedUser.firstName}<br>${cachedUser.lastName}`;
  }

  // 4. Fetch Fresh Sidebar (Background Sync)
  if (sidebarHost) {
    try {
      const response = await fetch(`${base}components/sidebar.html`, { cache: "no-store" });
      if (!response.ok) throw new Error("Sidebar not found");
      const freshHtml = await response.text();
      
      // Save to memory for next page load
      sessionStorage.setItem("sidebar_html", freshHtml);

      // If it wasn't cached, inject it now
      if (!sessionStorage.getItem("sidebar_html") || sidebarHost.innerHTML.trim() === "") {
        sidebarHost.innerHTML = freshHtml;
      }

      setupSidebarLogic(sidebarHost, base);

    } catch (error) {
      console.error("Sidebar load error:", error);
    }
  }

  // 5. Sidebar Logic (Icons, Mobile Menu, Active State)
  function setupSidebarLogic(host, base) {
    const logoImg = document.getElementById('sidebarLogo');
    if (logoImg) {
      logoImg.src = `${base}img/NumbaHublogo.jpeg`;
      logoImg.onerror = () => { logoImg.style.display = 'none'; };
    }

    if (window.lucide) lucide.createIcons();

    const menuBtn = document.querySelector("[data-menu]");
    const overlay = document.querySelector(".overlay");
    const sidebarElement = document.querySelector(".sidebar");

    if (menuBtn && overlay && sidebarElement) {
      menuBtn.addEventListener("click", () => {
        sidebarElement.classList.add("open");
        overlay.classList.add("show");
      });
      overlay.addEventListener("click", () => {
        sidebarElement.classList.remove("open");
        overlay.classList.remove("show");
      });
    }

    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-route]").forEach((link) => {
      const route = link.dataset.route;
      link.href = base + route;
      link.classList.toggle("active", route.endsWith(current));
    });
  }

  // 6. Background Sync for User Balance
  if (typeof apiFetch === "function") {
    try {
      const data = await apiFetch("/auth/me");
      setUser(data.user);
      setText("headerName", `${data.user.firstName} ${data.user.lastName}`);
      setText("profileEmail", data.user.email);
      setText("walletBalance", formatBalance(data.user.walletBalance));
    } catch (err) {
      console.warn("Background sync failed:", err.message);
    }
  }

  // 7. PWA Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(`${base}service-worker.js`).catch(() => {});
    });
  }
});