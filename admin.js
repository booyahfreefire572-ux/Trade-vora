/**
 * TRADING JOURNAL - MASTER ADMIN PORTAL LOGIC
 * Features: Gatekeeper Authentication, Live Revenue Analytics, Payment Screenshot Lightbox,
 * Exact Package Duration (7, 30, 60, 90 Days), Admin-Assigned Groq AI Key Activation Engine,
 * User Support Ticket Resolution, All-Traders Database & Instant Cloud Settings Sync
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Direct Firebase Credentials & Configuration
  const ADMIN_PASSKEY = "momin132109"; // Your Master Admin Passkey
  const ADMIN_SESSION_KEY = "journal_admin_session_auth";

  const firebaseConfig = {
    apiKey: "AIzaSyDjnaAEsL_VWCl2mo2tjwbL2-64aPwKWPU",
    authDomain: "trading-journal-7876b.firebaseapp.com",
    projectId: "trading-journal-7876b",
    storageBucket: "trading-journal-7876b.firebasestorage.app",
    messagingSenderId: "1016230836404",
    appId: "1:1016230836404:web:3641cc25e86e9faaabffe1"
  };

  let db = null;
  let allUsersCache = [];
  let currentActiveLightboxReq = null;
  let pendingActivationData = null; // Holds user data when opening the activation modal

  // 2. DOM Elements
  const adminGatekeeper = document.getElementById("adminGatekeeper");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const masterPasskey = document.getElementById("masterPasskey");
  const gatekeeperError = document.getElementById("gatekeeperError");
  const adminApp = document.getElementById("adminApp");
  const adminLockBtn = document.getElementById("adminLockBtn");

  // Overview Stats
  const statTotalUsers = document.getElementById("statTotalUsers");
  const statActivePro = document.getElementById("statActivePro");
  const statPendingRequests = document.getElementById("statPendingRequests");
  const statExpiredUsers = document.getElementById("statExpiredUsers");
  const statTotalRevenue = document.getElementById("statTotalRevenue");

  // Tabs & Sections (4 Tabs)
  const tabPayments = document.getElementById("tabPayments");
  const tabUsers = document.getElementById("tabUsers");
  const tabSupport = document.getElementById("tabSupport");
  const tabSettings = document.getElementById("tabSettings");
  const sectionPayments = document.getElementById("sectionPayments");
  const sectionUsers = document.getElementById("sectionUsers");
  const sectionSupport = document.getElementById("sectionSupport");
  const sectionSettings = document.getElementById("sectionSettings");

  // Payment Requests Elements
  const refreshPaymentsBtn = document.getElementById("refreshPaymentsBtn");
  const paymentTableBody = document.getElementById("paymentTableBody");
  const noPaymentsMsg = document.getElementById("noPaymentsMsg");

  // Users Database Elements
  const searchUserFilter = document.getElementById("searchUserFilter");
  const usersTableBody = document.getElementById("usersTableBody");

  // Support Tickets Elements
  const refreshSupportBtn = document.getElementById("refreshSupportBtn");
  const supportTableBody = document.getElementById("supportTableBody");
  const noSupportMsg = document.getElementById("noSupportMsg");

  // Settings Elements
  const systemSettingsForm = document.getElementById("systemSettingsForm");
  const settingPayId = document.getElementById("settingPayId");
  const settingWalletAddress = document.getElementById("settingWalletAddress");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");

  // Lightbox Modal Elements
  const screenshotLightbox = document.getElementById("screenshotLightbox");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");
  const lightboxFullImg = document.getElementById("lightboxFullImg");
  const lightboxDetails = document.getElementById("lightboxDetails");
  const lightboxApproveBtn = document.getElementById("lightboxApproveBtn");

  // Assign AI Key & Activation Modal Elements
  const activationModal = document.getElementById("activationModal");
  const closeActivationModalBtn = document.getElementById("closeActivationModalBtn");
  const activationTraderInfo = document.getElementById("activationTraderInfo");
  const activationPlanInfo = document.getElementById("activationPlanInfo");
  const keyDurationHint = document.getElementById("keyDurationHint");
  const activationForm = document.getElementById("activationForm");
  const assignApiKeyInput = document.getElementById("assignApiKeyInput");
  const activationError = document.getElementById("activationError");
  const confirmActivationBtn = document.getElementById("confirmActivationBtn");

  // 3. Helper Functions
  const escapeHtml = (text) => {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 4. Initialize Firebase Connection
  const initFirebase = () => {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
    } catch (err) {
      console.error("Firebase admin initialization error:", err);
    }
  };

  // 5. Gatekeeper Master Login Engine
  adminLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const entered = masterPasskey.value.trim();

    if (entered === ADMIN_PASSKEY) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "authenticated");
      gatekeeperError.style.display = "none";
      unlockAdminApp();
    } else {
      gatekeeperError.textContent = "Invalid Master Passkey. Access denied.";
      gatekeeperError.style.display = "block";
      masterPasskey.value = "";
    }
  });

  adminLockBtn.addEventListener("click", () => {
    if (confirm("Lock Master Admin Portal?")) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      adminApp.style.display = "none";
      adminGatekeeper.style.display = "flex";
      masterPasskey.value = "";
    }
  });

  const checkExistingSession = () => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "authenticated") {
      unlockAdminApp();
    }
  };

  const unlockAdminApp = () => {
    adminGatekeeper.style.display = "none";
    adminApp.style.display = "block";
    loadAllAdminData();
  };

  // 6. Tab Switching Logic (Handles all 4 tabs)
  const activateTab = (activeTabBtn, activeSection) => {
    [tabPayments, tabUsers, tabSupport, tabSettings].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });
    [sectionPayments, sectionUsers, sectionSupport, sectionSettings].forEach((sec) => {
      if (sec) sec.style.display = "none";
    });

    if (activeTabBtn) activeTabBtn.classList.add("active");
    if (activeSection) activeSection.style.display = "block";
  };

  tabPayments.addEventListener("click", () => activateTab(tabPayments, sectionPayments));
  tabUsers.addEventListener("click", () => activateTab(tabUsers, sectionUsers));
  tabSupport.addEventListener("click", () => activateTab(tabSupport, sectionSupport));
  tabSettings.addEventListener("click", () => {
    activateTab(tabSettings, sectionSettings);
    loadLiveSystemSettings(); // Refresh settings input values on tab switch
  });

  // 7. Load All Admin Data (Metrics, Payments, Users, Support, Settings)
  const loadAllAdminData = async () => {
    initFirebase();
    if (!db) return;

    await Promise.all([
      loadPlatformMetrics(),
      loadIncomingPaymentRequests(),
      loadAllUsersDatabase(),
      loadSupportTickets(),
      loadLiveSystemSettings()
    ]);
  };

  // 8. Platform Overview Metrics Calculation
  const loadPlatformMetrics = async () => {
    if (!db) return;

    try {
      const usersSnap = await db.collection("users").get();
      const requestsSnap = await db.collection("payment_requests").get();

      const totalUsers = usersSnap.size;
      let activePro = 0;
      let expiredUsers = 0;
      let pendingRequests = 0;
      let estimatedRevenue = 0;

      const now = new Date();

      usersSnap.forEach((doc) => {
        const data = doc.data();
        const sub = data.subscription || {};
        const validUntil = new Date(sub.validUntil);

        if (validUntil > now) {
          activePro++;
        } else {
          expiredUsers++;
        }
      });

      requestsSnap.forEach((doc) => {
        const req = doc.data();
        if (req.status === "pending") {
          pendingRequests++;
        } else if (req.status === "approved") {
          const days = parseInt(req.packageDays) || 30;
          if (days === 7) estimatedRevenue += 3;
          else if (days === 30) estimatedRevenue += 10;
          else if (days === 60) estimatedRevenue += 18;
          else if (days === 90) estimatedRevenue += 25;
        }
      });

      statTotalUsers.textContent = totalUsers;
      statActivePro.textContent = activePro;
      statPendingRequests.textContent = pendingRequests;
      statExpiredUsers.textContent = expiredUsers;
      statTotalRevenue.textContent = `$${estimatedRevenue} USDT`;
    } catch (err) {
      console.error("Error computing platform metrics:", err);
    }
  };

  // 9. Load Incoming Payment Proofs & Screenshots (Tab 1)
  const loadIncomingPaymentRequests = async () => {
    if (!db) return;
    paymentTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Loading incoming payments...</td></tr>";

    try {
      const snapshot = await db
        .collection("payment_requests")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      paymentTableBody.innerHTML = "";

      if (snapshot.empty) {
        noPaymentsMsg.style.display = "block";
        return;
      }

      noPaymentsMsg.style.display = "none";

      snapshot.forEach((doc) => {
        const req = doc.data();
        const isApproved = req.status === "approved";
        const statusBadge = isApproved
          ? "<span class='badge-win'>Approved</span>"
          : "<span class='badge-be'>Pending</span>";

        const tr = document.createElement("tr");

        const thumbHtml = req.slipImage
          ? `<img src="${req.slipImage}" class="proof-thumb view-proof-btn" data-img="${encodeURIComponent(req.slipImage)}" data-trader="${escapeHtml(req.traderId)}" data-email="${escapeHtml(req.userEmail)}" data-order="${escapeHtml(req.orderId)}" data-plan="${escapeHtml(req.packageName)}" data-days="${req.packageDays}" data-uid="${req.userUid}" data-docid="${doc.id}" data-status="${req.status}" title="Click to view full screenshot proof">`
          : "<span style='color:var(--text-dim);font-size:0.75rem;'>No Image</span>";

        const durationDisplay = `
          <strong style="color:#f0b90b; font-size:0.85rem;">📅 ${req.packageDays || 30} Days</strong>
          <br><small style="color:var(--text-muted); font-size:0.72rem;">${escapeHtml(req.packageName || "")}</small>
        `;

        tr.innerHTML = `
          <td><strong>#${escapeHtml(req.traderId || "TRD")}</strong></td>
          <td>${escapeHtml(req.userEmail || "")}</td>
          <td>${durationDisplay}</td>
          <td><code>${escapeHtml(req.orderId || "")}</code></td>
          <td style="text-align:center;">${thumbHtml}</td>
          <td>${statusBadge}</td>
          <td>
            ${
              isApproved
                ? "<span style='color:var(--text-dim); font-size:0.75rem;'>Unlocked</span>"
                : `<button class="btn-approve trigger-activation-btn" data-docid="${doc.id}" data-uid="${req.userUid}" data-days="${req.packageDays}" data-plan="${escapeHtml(req.packageName)}" data-trader="${escapeHtml(req.traderId)}" data-email="${escapeHtml(req.userEmail)}">🔑 Activate (${req.packageDays}d)</button>`
            }
          </td>
        `;
        paymentTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      paymentTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:var(--accent-red);'>Error loading requests.</td></tr>";
    }
  };

  refreshPaymentsBtn.addEventListener("click", () => {
    loadIncomingPaymentRequests();
    loadPlatformMetrics();
  });

  // 10. Lightbox Modal Handlers (View Full-Screen Payment Screenshot)
  document.addEventListener("click", (e) => {
    const thumb = e.target.closest(".view-proof-btn");
    if (!thumb) return;

    const imgSrc = decodeURIComponent(thumb.dataset.img);
    const traderId = thumb.dataset.trader;
    const email = thumb.dataset.email;
    const orderId = thumb.dataset.order;
    const plan = thumb.dataset.plan;
    const days = thumb.dataset.days;
    const uid = thumb.dataset.uid;
    const docId = thumb.dataset.docid;
    const status = thumb.dataset.status;

    currentActiveLightboxReq = { docId, uid, days, plan, traderId, email };

    lightboxFullImg.src = imgSrc;
    lightboxDetails.innerHTML = `Trader: <strong>#${traderId}</strong> | Duration: <strong style="color:#f0b90b;">${days} Days</strong> | TxID: ${orderId}`;

    if (status === "approved") {
      lightboxApproveBtn.style.display = "none";
    } else {
      lightboxApproveBtn.style.display = "inline-block";
      lightboxApproveBtn.textContent = `🔑 Proceed to Activate (${days} Days)`;
    }

    screenshotLightbox.style.display = "flex";
  });

  closeLightboxBtn.addEventListener("click", () => {
    screenshotLightbox.style.display = "none";
  });

  screenshotLightbox.addEventListener("click", (e) => {
    if (e.target === screenshotLightbox) {
      screenshotLightbox.style.display = "none";
    }
  });

  lightboxApproveBtn.addEventListener("click", () => {
    if (!currentActiveLightboxReq) return;
    screenshotLightbox.style.display = "none";
    openActivationModal(currentActiveLightboxReq);
  });

  paymentTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".trigger-activation-btn");
    if (!btn) return;

    const reqData = {
      docId: btn.dataset.docid,
      uid: btn.dataset.uid,
      days: parseInt(btn.dataset.days) || 30,
      plan: btn.dataset.plan || "Pro Plan",
      traderId: btn.dataset.trader || "TRD",
      email: btn.dataset.email || ""
    };

    openActivationModal(reqData);
  });

  // 11. Assign AI API Key & Activate Account Modal Handlers
  const openActivationModal = (data) => {
    pendingActivationData = data;

    activationTraderInfo.textContent = `Trader: #${data.traderId} (${data.email})`;
    activationPlanInfo.innerHTML = `Purchased Package: <strong style="color:#f0b90b; font-size:0.95rem;">📅 ${data.days} Days</strong> (${escapeHtml(data.plan)})`;
    keyDurationHint.textContent = `${data.days} days`;

    assignApiKeyInput.value = "";
    activationError.style.display = "none";
    activationModal.style.display = "flex";
    assignApiKeyInput.focus();
  };

  closeActivationModalBtn.addEventListener("click", () => {
    activationModal.style.display = "none";
    pendingActivationData = null;
  });

  activationModal.addEventListener("click", (e) => {
    if (e.target === activationModal) {
      activationModal.style.display = "none";
      pendingActivationData = null;
    }
  });

  activationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!pendingActivationData || !db) return;

    const assignedKey = assignApiKeyInput.value.trim();
    if (!assignedKey) {
      activationError.textContent = "Please enter the Groq API key generated for this duration.";
      activationError.style.display = "block";
      return;
    }

    const { docId, uid, days, plan } = pendingActivationData;

    confirmActivationBtn.disabled = true;
    confirmActivationBtn.textContent = "Unlocking Account in Cloud...";

    try {
      const newExpiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      await db.collection("users").doc(uid).update({
        "subscription.status": "active",
        "subscription.validUntil": newExpiryDate,
        "subscription.plan": plan,
        "subscription.apiKey": assignedKey
      });

      await db.collection("payment_requests").doc(docId).update({
        status: "approved",
        assignedApiKey: assignedKey,
        approvedAt: new Date().toISOString()
      });

      alert(`✓ Successfully activated ${days} Days for Trader and assigned AI Key!`);
      activationModal.style.display = "none";
      pendingActivationData = null;

      loadIncomingPaymentRequests();
      loadAllUsersDatabase();
      loadPlatformMetrics();
    } catch (err) {
      console.error(err);
      activationError.textContent = "Failed to activate account: " + err.message;
      activationError.style.display = "block";
    } finally {
      confirmActivationBtn.disabled = false;
      confirmActivationBtn.textContent = "✓ Confirm Key & Unlock Account";
    }
  });

  // 12. All Traders Database (Tab 2)
  const loadAllUsersDatabase = async () => {
    if (!db) return;
    usersTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Loading traders...</td></tr>";

    try {
      const snapshot = await db.collection("users").get();
      allUsersCache = [];

      snapshot.forEach((doc) => {
        allUsersCache.push({ id: doc.id, ...doc.data() });
      });

      renderUsersTable(allUsersCache);
    } catch (err) {
      console.error(err);
      usersTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:var(--accent-red);'>Error loading users database.</td></tr>";
    }
  };

  const renderUsersTable = (usersList) => {
    usersTableBody.innerHTML = "";
    const now = new Date();

    if (usersList.length === 0) {
      usersTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No traders found.</td></tr>";
      return;
    }

    usersList.forEach((u) => {
      const sub = u.subscription || {};
      const validDate = new Date(sub.validUntil);
      const isExpired = validDate <= now;
      const daysLeft = Math.ceil((validDate - now) / (1000 * 60 * 60 * 24));

      const statusBadge = isExpired
        ? "<span class='badge-loss'>Expired</span>"
        : `<span class='badge-win'>Active (${daysLeft}d left)</span>`;

      const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-";
      const validUntilStr = sub.validUntil ? new Date(sub.validUntil).toLocaleDateString() : "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>#${escapeHtml(u.traderId || "TRD")}</strong></td>
        <td>${escapeHtml(u.email || "")}</td>
        <td>${regDate}</td>
        <td><span class='badge-rr'>${escapeHtml(sub.plan || "Free Trial")}</span></td>
        <td>${validUntilStr}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm grant-days-btn" data-uid="${u.id}" data-days="7" title="Grant 7 Days">+7d</button>
            <button class="btn btn-gold btn-sm grant-days-btn" data-uid="${u.id}" data-days="30" title="Grant 30 Days">+30d</button>
            <button class="btn btn-primary btn-sm grant-days-btn" data-uid="${u.id}" data-days="90" title="Grant 90 Days">+90d</button>
          </div>
        </td>
      `;
      usersTableBody.appendChild(tr);
    });
  };

  searchUserFilter.addEventListener("input", () => {
    const term = searchUserFilter.value.trim().toLowerCase();
    const filtered = allUsersCache.filter((u) => {
      const matchId = (u.traderId || "").toLowerCase().includes(term);
      const matchEmail = (u.email || "").toLowerCase().includes(term);
      return matchId || matchEmail;
    });
    renderUsersTable(filtered);
  });

  usersTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".grant-days-btn");
    if (!btn || !db) return;

    const userUid = btn.dataset.uid;
    const days = parseInt(btn.dataset.days);

    const apiKey = prompt(`Enter Groq API Key to grant ${days} days for this trader:`);
    if (!apiKey) return;

    try {
      const newExpiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      await db.collection("users").doc(userUid).update({
        "subscription.status": "active",
        "subscription.validUntil": newExpiryDate,
        "subscription.plan": `Admin Grant (${days} Days)`,
        "subscription.apiKey": apiKey.trim()
      });

      alert(`✓ Successfully granted ${days} days and attached AI Key!`);
      loadAllUsersDatabase();
      loadPlatformMetrics();
    } catch (err) {
      alert("Failed to update user: " + err.message);
    }
  });

  // 13. User Support Ticket Management Engine (Tab 3)
  const loadSupportTickets = async () => {
    if (!db) return;
    supportTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Loading support tickets...</td></tr>";

    try {
      const snapshot = await db
        .collection("support_tickets")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      supportTableBody.innerHTML = "";

      if (snapshot.empty) {
        noSupportMsg.style.display = "block";
        return;
      }

      noSupportMsg.style.display = "none";

      snapshot.forEach((doc) => {
        const ticket = doc.data();
        const isResolved = ticket.status === "resolved";
        const statusBadge = isResolved
          ? "<span class='badge-win'>Resolved</span>"
          : "<span class='badge-be'>Open</span>";

        const dateStr = ticket.createdAt
          ? new Date(ticket.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
          : "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>#${escapeHtml(ticket.traderId || "TRD")}</strong></td>
          <td>${escapeHtml(ticket.userEmail || "")}</td>
          <td><strong>${escapeHtml(ticket.subject || "")}</strong></td>
          <td><div class="ticket-desc-box">${escapeHtml(ticket.description || "")}</div></td>
          <td>${dateStr}</td>
          <td>${statusBadge}</td>
          <td>
            ${
              isResolved
                ? "<span style='color:var(--text-dim); font-size:0.75rem;'>Resolved</span>"
                : `<button class="btn-approve resolve-ticket-btn" data-docid="${doc.id}">✓ Mark Resolved</button>`
            }
          </td>
        `;
        supportTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      supportTableBody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:var(--accent-red);'>Error loading tickets.</td></tr>";
    }
  };

  refreshSupportBtn.addEventListener("click", () => {
    loadSupportTickets();
  });

  supportTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".resolve-ticket-btn");
    if (!btn || !db) return;

    const docId = btn.dataset.docid;

    if (confirm("Mark this support ticket as resolved?")) {
      btn.disabled = true;
      btn.textContent = "Resolving...";

      try {
        await db.collection("support_tickets").doc(docId).update({
          status: "resolved",
          resolvedAt: new Date().toISOString()
        });

        alert("✓ Support ticket marked as resolved!");
        loadSupportTickets();
      } catch (err) {
        console.error(err);
        alert("Failed to update ticket: " + err.message);
        btn.disabled = false;
        btn.textContent = "✓ Mark Resolved";
      }
    }
  });

  // 14. Live Settings Control Engine (Tab 4 - Robust Cloud Sync)
  const loadLiveSystemSettings = async () => {
    initFirebase();
    if (!db) return;

    try {
      const doc = await db.collection("settings").doc("general").get();
      if (doc.exists) {
        const data = doc.data();
        if (data.binancePayId && settingPayId) settingPayId.value = data.binancePayId;
        if (data.usdtAddress && settingWalletAddress) settingWalletAddress.value = data.usdtAddress;
      }
    } catch (err) {
      console.warn("Could not load dynamic settings:", err);
    }
  };

  systemSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    initFirebase();

    if (!db) {
      alert("Database connection is not initialized.");
      return;
    }

    const payId = settingPayId.value.trim();
    const address = settingWalletAddress.value.trim();

    if (!payId || !address) {
      alert("Please fill in both Binance Pay ID and USDT Address.");
      return;
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.disabled = true;
      saveSettingsBtn.textContent = "Saving to Cloud...";
    }

    try {
      await db.collection("settings").doc("general").set({
        binancePayId: payId,
        usdtAddress: address,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      alert("✓ Live settings saved to cloud! Binance details updated for all users in real-time.");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings: " + err.message);
    } finally {
      if (saveSettingsBtn) {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = "Save Settings to Cloud";
      }
    }
  });

  // Initial Startup
  initFirebase();
  checkExistingSession();
});