document.addEventListener("DOMContentLoaded", async () => {
  const sidebarHost = document.getElementById("sidebar");
  const isPage = window.location.pathname.includes("/pages/");
  const base = isPage ? "../" : "./";

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // 1. Populate from cache instantly
  const cachedUser = typeof getUser === "function" ? getUser() : null;
  if (cachedUser) {
    // 👈 Shows First + Last Name
    setText("headerName", `${cachedUser.firstName} ${cachedUser.lastName}`);
    setText("profileEmail", cachedUser.email);
    setText("avatarInitials", `${cachedUser.firstName?.[0] || ""}${cachedUser.lastName?.[0] || ""}`.toUpperCase());
    setText("walletBalance", `₦${Number(cachedUser.walletBalance || 0).toLocaleString()}`);
    
    const profileName = document.getElementById("profileName");
    if (profileName) profileName.innerHTML = `${cachedUser.firstName}<br>${cachedUser.lastName}`;
  }

  // 2. Fetch Sidebar HTML
  if (sidebarHost) {
    try {
      const response = await fetch(`${base}components/sidebar.html`, { cache: "no-store" });
      if (!response.ok) throw new Error("Sidebar component not found");
      sidebarHost.innerHTML = await response.text();

      // 👈 SET THE LOGO PATH HERE (Pointing to the img folder)
      const logoImg = document.getElementById('sidebarLogo');
      if (logoImg) {
        logoImg.src = `${base}img/NumbaHublogo.jpeg`;
        
        // Fallback: If the image is missing, hide it so the text still looks good
        logoImg.onerror = () => {
          logoImg.style.display = 'none';
        };
      }

      // Re-apply data after HTML injection
      if (cachedUser) {
        setText("headerName", `${cachedUser.firstName} ${cachedUser.lastName}`);
        setText("profileEmail", cachedUser.email);
        setText("avatarInitials", `${cachedUser.firstName?.[0] || ""}${cachedUser.lastName?.[0] || ""}`.toUpperCase());
        const profileName = document.getElementById("profileName");
        if (profileName) profileName.innerHTML = `${cachedUser.firstName}<br>${cachedUser.lastName}`;
      }

      // Render Icons inside the sidebar
      if (window.lucide) lucide.createIcons();

      // 3. Background Sync (Check if token is valid & balance changed)
      if (typeof apiFetch === "function") {
        try {
          const data = await apiFetch("/auth/me");
          setUser(data.user);
          // 👈 Shows First + Last Name
          setText("headerName", `${data.user.firstName} ${data.user.lastName}`);
          setText("profileEmail", data.user.email);
          setText("walletBalance", `₦${Number(data.user.walletBalance || 0).toLocaleString()}`);
        } catch (err) {
          console.warn("Background sync failed:", err.message);
        }
      }

      // 4. Mobile Sidebar Toggle Logic
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

    } catch (error) {
      console.error("Sidebar load error:", error);
    }
  }

  // 5. Active Link Highlighting
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-route]").forEach((link) => {
    const route = link.dataset.route;
    link.href = base + route;
    link.classList.toggle("active", route.endsWith(current));
  });
});