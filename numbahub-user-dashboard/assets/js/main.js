document.addEventListener("DOMContentLoaded", async () => {
  const sidebarHost = document.getElementById("sidebar");
  const isPage = window.location.pathname.includes("/pages/");
  const base = isPage ? "../" : "./";

  if (sidebarHost) {
    try {
      // 1. Fetch Sidebar
      const response = await fetch(`${base}components/sidebar.html`, { cache: "no-store" });
      if (!response.ok) throw new Error("Sidebar not found");
      sidebarHost.innerHTML = await response.text();
      
      // 2. Set Dynamic Page Title
      // E.g., "Airtime — NumbaHub" becomes "Airtime"
      const pageTitle = document.title.split("—")[0].trim() || "Dashboard";
      const headerNameEl = document.getElementById("headerName");
      if (headerNameEl) headerNameEl.textContent = pageTitle;

      // 3. Fetch User Data
      if (typeof apiFetch === 'function') {
        try {
          const data = await apiFetch("/auth/me");
          const greetingEl = document.getElementById("greetingText");
          if (greetingEl) greetingEl.textContent = `Welcome back, ${data.user.firstName}`;
          
          document.getElementById("profileName").innerHTML = `${data.user.firstName}<br>${data.user.lastName}`;
          document.getElementById("profileEmail").textContent = data.user.email;
          document.getElementById("avatarInitials").textContent = (data.user.firstName[0] + data.user.lastName[0]).toUpperCase();
        } catch (e) { 
          console.log("User not logged in.");
          const greetingEl = document.getElementById("greetingText");
          if (greetingEl) greetingEl.textContent = `Welcome back`;
          document.getElementById("profileName").textContent = "Guest";
          document.getElementById("profileEmail").textContent = "Please log in";
          document.getElementById("avatarInitials").textContent = "?";
        }
      }

      // 4. Mobile Menu Logic
      const sidebar = document.querySelector(".sidebar");
      const overlay = document.querySelector(".overlay");
      const menuButton = document.querySelector("[data-menu]");

      menuButton?.addEventListener("click", () => {
        sidebar?.classList.add("open");
        overlay?.classList.add("show");
      });
      overlay?.addEventListener("click", () => {
        sidebar?.classList.remove("open");
        overlay?.classList.remove("show");
      });

    } catch (error) {
      console.error("Unable to load sidebar:", error);
      sidebarHost.innerHTML = '<p style="padding:20px;color:red;">Sidebar could not be loaded.</p>';
    }
  }

  if (window.lucide) lucide.createIcons();
  
  // 5. Highlight Active Link
  document.querySelectorAll("[data-route]").forEach(link => {
    const route = link.dataset.route;
    link.href = base + route;
    const current = window.location.pathname.split("/").pop() || "index.html";
    link.classList.toggle("active", route.endsWith(current));
  });
});