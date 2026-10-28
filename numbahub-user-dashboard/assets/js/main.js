document.addEventListener("DOMContentLoaded", async () => {
  const sidebarHost = document.getElementById("sidebar");
  const isPage = window.location.pathname.includes("/pages/");
  const base = isPage ? "../" : "./";

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // 1. Fetch Live USD/NGN Exchange Rate
  let currentRate = 1500; // Fallback default
  try {
    const rateData = await apiFetch("/currency/rate", { auth: false }); // auth:false because it's a public route
    currentRate = rateData.rate || 1500;
    console.log(`Live Rate Loaded: $1 = ₦${currentRate}`);
  } catch (err) {
    console.warn("Using fallback exchange rate:", err.message);
  }

  // Helper to format Wallet Balance to USD using the live rate
  const formatBalance = (balanceInNgn) => {
    const usdAmount = Number(balanceInNgn || 0) / currentRate;
    return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 2. Populate from cache instantly (uses live rate)
  const cachedUser = typeof getUser === "function" ? getUser() : null;
  if (cachedUser) {
    setText("headerName", `${cachedUser.firstName} ${cachedUser.lastName}`);
    setText("profileEmail", cachedUser.email);
    setText("avatarInitials", `${cachedUser.firstName?.[0] || ""}${cachedUser.lastName?.[0] || ""}`.toUpperCase());
    
    // 👈 Set Balance in USD
    setText("walletBalance", formatBalance(cachedUser.walletBalance));
    
    const profileName = document.getElementById("profileName");
    if (profileName) profileName.innerHTML = `${cachedUser.firstName}<br>${cachedUser.lastName}`;
  }

  // 3. Fetch Sidebar HTML
  if (sidebarHost) {
    try {
      const response = await fetch(`${base}components/sidebar.html`, { cache: "no-store" });
      if (!response.ok) throw new Error("Sidebar component not found");
      sidebarHost.innerHTML = await response.text();

      // Set the Logo path
      const logoImg = document.getElementById('sidebarLogo');
      if (logoImg) {
        logoImg.src = `${base}img/NumbaHublogo.jpeg`;
        logoImg.onerror = () => { logoImg.style.display = 'none'; };
      }

      // Re-apply data after HTML injection
      if (cachedUser) {
        setText("headerName", `${cachedUser.firstName} ${cachedUser.lastName}`);
        setText("profileEmail", cachedUser.email);
        setText("avatarInitials", `${cachedUser.firstName?.[0] || ""}${cachedUser.lastName?.[0] || ""}`.toUpperCase());
        const profileName = document.getElementById("profileName");
        if (profileName) profileName.innerHTML = `${cachedUser.firstName}<br>${cachedUser.lastName}`;
      }

      if (window.lucide) lucide.createIcons();

      // 4. Background Sync (Check if token is valid & balance changed)
      if (typeof apiFetch === "function") {
        try {
          const data = await apiFetch("/auth/me");
          setUser(data.user);
          setText("headerName", `${data.user.firstName} ${data.user.lastName}`);
          setText("profileEmail", data.user.email);
          
          // 👈 Set Balance in USD with live rate
          setText("walletBalance", formatBalance(data.user.walletBalance));
          
        } catch (err) {
          console.warn("Background sync failed:", err.message);
        }
      }

      // 5. Mobile Sidebar Toggle Logic
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

  // 6. Active Link Highlighting
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-route]").forEach((link) => {
    const route = link.dataset.route;
    link.href = base + route;
    link.classList.toggle("active", route.endsWith(current));
  });
});