/**
 * TRADING JOURNAL - COMMERCIAL SAAS ARCHITECTURE (MOBILE APP UI)
 * Features: Auto Image Resizer & Optimizer (Fixes 'invalid image data'),
 * Smart TradingView Chart Reader with Auto Math-Calculation for BUY/SELL/WIN/LOSS,
 * Instant Cloud Binance Settings Sync, Mobile App UI Tab Switching,
 * Slim Profile Drawer, Auto-Connected Firebase, 3-Day Trial & Expiry Lockdown,
 * Binance Pay with Mandatory Screenshot Proof, Admin-Assigned AI Key Delivery,
 * Live Equity Engine & User Support Ticket Submission
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Direct Firebase Credentials & Local Storage Keys
  const LOCAL_STORAGE_KEY = "offline_trading_journal_data";

  const firebaseConfig = {
    apiKey: "AIzaSyDjnaAEsL_VWCl2mo2tjwbL2-64aPwKWPU",
    authDomain: "trading-journal-7876b.firebaseapp.com",
    projectId: "trading-journal-7876b",
    storageBucket: "trading-journal-7876b.firebasestorage.app",
    messagingSenderId: "1016230836404",
    appId: "1:1016230836404:web:3641cc25e86e9faaabffe1"
  };

  let trades = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
  let currentUser = null;
  let userProfileData = null;
  let db = null;
  let auth = null;
  let isLoginMode = true;

  // Selected subscription package state (default 30 days)
  let selectedPlanDays = 30;
  let selectedPlanName = "30 Days Plan ($10 USDT)";
  let paymentSlipBase64 = "";

  // 2. DOM Elements
  const tradeForm = document.getElementById("tradeForm");
  const tradeIdInput = document.getElementById("tradeId");
  const tradeDateInput = document.getElementById("tradeDate");
  const pairInput = document.getElementById("pair");
  const typeInput = document.getElementById("type");
  const tradeResultInput = document.getElementById("tradeResult");
  const riskRewardInput = document.getElementById("riskReward");
  const entryPriceInput = document.getElementById("entryPrice");
  const exitPriceInput = document.getElementById("exitPrice");
  const lotSizeInput = document.getElementById("lotSize");
  const pnlInput = document.getElementById("pnl");
  const strategyInput = document.getElementById("strategy");
  const notesInput = document.getElementById("notes");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const formTitle = document.getElementById("formTitle");

  // Dashboard Stats Elements
  const totalTradesEl = document.getElementById("totalTrades");
  const winRateEl = document.getElementById("winRate");
  const avgRREl = document.getElementById("avgRR");
  const totalPnLEl = document.getElementById("totalPnL");
  const totalWinsEl = document.getElementById("totalWins");
  const totalLossesEl = document.getElementById("totalLosses");

  // Equity Curve Elements
  const equityCanvas = document.getElementById("equityChart");
  const chartGrowthBadge = document.getElementById("chartGrowthBadge");
  const chartNoDataMsg = document.getElementById("chartNoDataMsg");

  // Filters & Table Elements
  const filterType = document.getElementById("filterType");
  const searchPair = document.getElementById("searchPair");
  const tradeTableBody = document.getElementById("tradeTableBody");
  const noDataMessage = document.getElementById("noDataMessage");

  // Backup & Report Elements
  const exportBtn = document.getElementById("exportBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const importFile = document.getElementById("importFile");

  // AI Dropzone Elements
  const dropzone = document.getElementById("dropzone");
  const screenshotInput = document.getElementById("screenshotInput");
  const dropzonePrompt = document.getElementById("dropzonePrompt");
  const aiStatus = document.getElementById("aiStatus");
  const aiStatusText = document.getElementById("aiStatusText");
  const previewWrapper = document.getElementById("previewWrapper");
  const imagePreview = document.getElementById("imagePreview");
  const removeImageBtn = document.getElementById("removeImageBtn");

  // Auth & Profile Header Elements
  const openAuthModalBtn = document.getElementById("openAuthModalBtn");
  const userProfile = document.getElementById("userProfile");
  const profileModal = document.getElementById("profileModal");
  const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");
  const userIdBadge = document.getElementById("userIdBadge");
  const userEmailDisplay = document.getElementById("userEmailDisplay");
  const userPlanBadge = document.getElementById("userPlanBadge");
  const openUpgradeModalBtn = document.getElementById("openUpgradeModalBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Support Modal Elements
  const openSupportModalBtn = document.getElementById("openSupportModalBtn");
  const supportModal = document.getElementById("supportModal");
  const closeSupportModalBtn = document.getElementById("closeSupportModalBtn");
  const supportForm = document.getElementById("supportForm");
  const supportSubject = document.getElementById("supportSubject");
  const supportDesc = document.getElementById("supportDesc");

  // Auth Modal Elements
  const authModal = document.getElementById("authModal");
  const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
  const authModalTitle = document.getElementById("authModalTitle");
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const authForm = document.getElementById("authForm");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const authErrorMsg = document.getElementById("authErrorMsg");

  // Binance Paywall Elements
  const paywallModal = document.getElementById("paywallModal");
  const closePaywallModalBtn = document.getElementById("closePaywallModalBtn");
  const selectedPackageNameEl = document.getElementById("selectedPackageName");
  const copyPayIdBtn = document.getElementById("copyPayIdBtn");
  const binancePayIdText = document.getElementById("binancePayIdText");
  const copyAddressBtn = document.getElementById("copyAddressBtn");
  const binanceAddressText = document.getElementById("binanceAddressText");
  const paymentVerifyForm = document.getElementById("paymentVerifyForm");
  const paymentOrderIdInput = document.getElementById("paymentOrderIdInput");
  const paymentAlertMsg = document.getElementById("paymentAlertMsg");
  const packageCards = document.querySelectorAll(".package-card");

  // Payment Slip Proof Elements
  const paymentSlipDropzone = document.getElementById("paymentSlipDropzone");
  const paymentSlipInput = document.getElementById("paymentSlipInput");
  const paymentSlipPrompt = document.getElementById("paymentSlipPrompt");
  const paymentSlipPreviewWrapper = document.getElementById("paymentSlipPreviewWrapper");
  const paymentSlipPreviewImg = document.getElementById("paymentSlipPreviewImg");
  const removePaymentSlipBtn = document.getElementById("removePaymentSlipBtn");

  // Mobile Bottom Navigation Elements
  const navItems = document.querySelectorAll(".mobile-bottom-nav .nav-item[data-tab]");
  const tabViews = document.querySelectorAll(".tab-view");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  // 3. Helper Functions
  const saveToLocal = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
  };

  const setDefaultDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    tradeDateInput.value = now.toISOString().slice(0, 16);
  };

  const formatCurrency = (amount) => {
    const sign = amount >= 0 ? "+$" : "-$";
    return `${sign}${Math.abs(amount).toFixed(2)}`;
  };

  const escapeHtml = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const parseRRValue = (rrStr) => {
    if (!rrStr) return null;
    const str = rrStr.toString().trim().toUpperCase().replace("R", "");
    if (str.includes(":")) {
      const parts = str.split(":");
      const left = parseFloat(parts[0]);
      const right = parseFloat(parts[1]);
      if (!isNaN(left) && !isNaN(right) && left > 0) {
        return right / left;
      }
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };

  /**
   * Client-side Image Optimizer & Compressor
   * Standardizes images for Groq Vision API
   */
  const optimizeImageForAI = (dataUrl, maxDimension = 1280, quality = 0.85) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Standard clean JPEG data URL
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  pnlInput.addEventListener("input", () => {
    const val = parseFloat(pnlInput.value);
    if (!isNaN(val)) {
      if (val > 0) tradeResultInput.value = "WIN";
      else if (val < 0) tradeResultInput.value = "LOSS";
      else tradeResultInput.value = "BE";
    }
  });

  // 4. Mobile Bottom Navigation Tab Switching Logic
  if (navItems.length > 0) {
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const targetTab = item.dataset.tab;

        navItems.forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");

        tabViews.forEach((view) => {
          view.classList.remove("active");
          if (view.id === `view${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`) {
            view.classList.add("active");
          }
        });

        if (targetTab === "home") {
          setTimeout(drawEquityCurve, 60);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      alert("🌙 Ultra-Dark OLED mode is active by default for optimal trading contrast.");
    });
  }

  // 5. Firebase Cloud Initialization & Live Settings Sync
  const initFirebase = () => {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      auth = firebase.auth();
      db = firebase.firestore();

      // Listen to Real-Time Cloud Payment Settings
      db.collection("settings").doc("general").onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data.binancePayId && binancePayIdText) {
            binancePayIdText.textContent = data.binancePayId;
          }
          if (data.usdtAddress && binanceAddressText) {
            binanceAddressText.textContent = data.usdtAddress;
          }
        }
      }, (err) => {
        console.warn("Live payment settings sync notice:", err);
      });

      auth.onAuthStateChanged(async (user) => {
        if (user) {
          currentUser = user;
          if (userEmailDisplay) userEmailDisplay.textContent = user.email;
          if (openAuthModalBtn) openAuthModalBtn.style.display = "none";
          if (userProfile) userProfile.style.display = "inline-flex";

          await syncUserProfile();
          await loadTradesFromCloud();
        } else {
          currentUser = null;
          userProfileData = null;
          if (openAuthModalBtn) openAuthModalBtn.style.display = "inline-flex";
          if (userProfile) userProfile.style.display = "none";

          trades = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
          renderTable();
        }
      });
    } catch (e) {
      console.error("Firebase connection error:", e);
    }
  };

  /**
   * Sync Trader Profile, generate Trader ID and evaluate Expiration
   */
  const syncUserProfile = async () => {
    if (!currentUser || !db) return;

    const userDocRef = db.collection("users").doc(currentUser.uid);
    try {
      const doc = await userDocRef.get();

      if (!doc.exists) {
        const randomId = "TRD-" + Math.floor(1000 + Math.random() * 9000);
        const trialExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

        userProfileData = {
          traderId: randomId,
          email: currentUser.email,
          createdAt: new Date().toISOString(),
          subscription: {
            status: "trial",
            plan: "Free Trial (3 Days)",
            validUntil: trialExpiry,
            apiKey: ""
          }
        };

        await userDocRef.set(userProfileData);
      } else {
        userProfileData = doc.data();
      }

      updateUserBadgeUI();
    } catch (err) {
      console.error("Error syncing profile:", err);
    }
  };

  const updateUserBadgeUI = () => {
    if (!userProfileData) return;

    if (userIdBadge) userIdBadge.textContent = `ID: #${userProfileData.traderId || "TRD"}`;

    const sub = userProfileData.subscription || {};
    const validUntilDate = new Date(sub.validUntil);
    const now = new Date();
    const diffMs = validUntilDate - now;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (userPlanBadge) {
      if (diffMs <= 0) {
        userPlanBadge.textContent = "Expired ⚠️";
        userPlanBadge.className = "user-plan-chip expired";
        openPaywall(true);
      } else if (sub.status === "trial") {
        userPlanBadge.textContent = `Trial: ${daysLeft}d left`;
        userPlanBadge.className = "user-plan-chip";
      } else {
        userPlanBadge.textContent = `👑 ${sub.plan || "Pro"} (${daysLeft}d left)`;
        userPlanBadge.className = "user-plan-chip pro";
      }
    }
  };

  const isSubscriptionActive = () => {
    if (!userProfileData || !userProfileData.subscription) return false;
    const validUntilDate = new Date(userProfileData.subscription.validUntil);
    return validUntilDate > new Date();
  };

  const openPaywall = (isExpiredNotice = false) => {
    if (!paywallModal) return;

    if (paymentAlertMsg) paymentAlertMsg.style.display = "none";
    if (paymentVerifyForm) paymentVerifyForm.reset();
    clearPaymentSlipPreview();

    const bannerMsg = document.getElementById("paywallUserMsg");
    if (bannerMsg) {
      if (isExpiredNotice) {
        bannerMsg.textContent = "⚠️ Your package has expired! Please choose a plan (7, 30, 60, or 90 days) and submit payment proof to reactivate.";
      } else {
        bannerMsg.textContent = "Select a plan to activate or renew your trading journal access.";
      }
    }

    if (profileModal) profileModal.style.display = "none";
    paywallModal.style.display = "flex";
  };

  // 6. Cloud Firestore Data Handlers
  const loadTradesFromCloud = async () => {
    if (!currentUser || !db) return;
    try {
      const snapshot = await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("trades")
        .orderBy("date", "desc")
        .get();

      trades = [];
      snapshot.forEach((doc) => {
        trades.push(doc.data());
      });

      saveToLocal();
      renderTable();
    } catch (err) {
      console.error("Cloud fetch error:", err);
      renderTable();
    }
  };

  const saveTradeToCloud = async (tradeData) => {
    if (!currentUser || !db) return;
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("trades")
        .doc(tradeData.id)
        .set(tradeData);
    } catch (err) {
      console.error("Error saving to cloud:", err);
    }
  };

  const deleteTradeFromCloud = async (tradeId) => {
    if (!currentUser || !db) return;
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("trades")
        .doc(tradeId)
        .delete();
    } catch (err) {
      console.error("Error deleting from cloud:", err);
    }
  };

  // 7. Live Equity Curve Canvas Drawing Engine
  const drawEquityCurve = () => {
    if (!equityCanvas) return;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedTrades.length === 0) {
      if (chartNoDataMsg) chartNoDataMsg.style.display = "flex";
      if (chartGrowthBadge) {
        chartGrowthBadge.textContent = "$0.00 Net P&L";
        chartGrowthBadge.className = "badge-growth-capsule";
      }
      const ctx = equityCanvas.getContext("2d");
      ctx.clearRect(0, 0, equityCanvas.width, equityCanvas.height);
      return;
    }

    if (chartNoDataMsg) chartNoDataMsg.style.display = "none";

    let cumulative = 0;
    const points = [{ pnl: 0 }];
    sortedTrades.forEach((t) => {
      cumulative += parseFloat(t.pnl) || 0;
      points.push({ pnl: cumulative });
    });

    if (chartGrowthBadge) {
      chartGrowthBadge.textContent = `${formatCurrency(cumulative)} Net P&L`;
      chartGrowthBadge.className = `badge-growth-capsule ${cumulative >= 0 ? "profit" : "loss"}`;
    }

    const rect = equityCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 320;
    const height = rect.height || 240;

    equityCanvas.width = width * dpr;
    equityCanvas.height = height * dpr;

    const ctx = equityCanvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padTop = 30;
    const padBottom = 30;
    const padLeft = 45;
    const padRight = 25;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const pnlValues = points.map((p) => p.pnl);
    let minPnl = Math.min(0, ...pnlValues);
    let maxPnl = Math.max(0, ...pnlValues);

    const rangeMargin = (maxPnl - minPnl) * 0.1 || 10;
    minPnl -= rangeMargin;
    maxPnl += rangeMargin;
    const pnlRange = maxPnl - minPnl || 1;

    const getX = (index) => padLeft + (index / (points.length - 1 || 1)) * chartW;
    const getY = (val) => padTop + chartH - ((val - minPnl) / pnlRange) * chartH;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      const labelVal = maxPnl - (i / 4) * pnlRange;
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`$${labelVal.toFixed(0)}`, padLeft - 8, y + 3);
    }

    const zeroY = getY(0);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    const isProfitable = cumulative >= 0;
    const lineColor = isProfitable ? "#10b981" : "#ef4444";
    const gradientTop = isProfitable ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)";

    const fillGrad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    fillGrad.addColorStop(0, gradientTop);
    fillGrad.addColorStop(1, "rgba(0, 0, 0, 0.0)");

    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0].pnl));

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].pnl));
    }
    ctx.lineTo(getX(points.length - 1), zeroY);
    ctx.lineTo(getX(0), zeroY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0].pnl));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].pnl));
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    const lastX = getX(points.length - 1);
    const lastY = getY(points[points.length - 1].pnl);
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.stroke();
  };

  window.addEventListener("resize", drawEquityCurve);

  // 8. Update Overview Dashboard Statistics
  const updateDashboard = () => {
    const totalCount = trades.length;
    let totalWins = 0;
    let totalLosses = 0;
    let netPnL = 0;
    let rrSum = 0;
    let rrCount = 0;

    trades.forEach((trade) => {
      const pnl = parseFloat(trade.pnl) || 0;
      netPnL += pnl;

      const res = trade.result || (pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE");
      if (res === "WIN") totalWins++;
      else if (res === "LOSS") totalLosses++;

      const rrVal = parseRRValue(trade.riskReward);
      if (rrVal !== null && rrVal > 0) {
        rrSum += rrVal;
        rrCount++;
      }
    });

    const winRate = totalCount > 0 ? ((totalWins / totalCount) * 100).toFixed(1) : 0;
    const avgRR = rrCount > 0 ? (rrSum / rrCount).toFixed(2) : "0.0";

    if (totalTradesEl) totalTradesEl.textContent = totalCount;
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    if (totalWinsEl) totalWinsEl.textContent = totalWins;
    if (totalLossesEl) totalLossesEl.textContent = totalLosses;

    if (avgRREl) avgRREl.textContent = `1:${avgRR}`;

    if (totalPnLEl) {
      totalPnLEl.textContent = formatCurrency(netPnL);
      totalPnLEl.className = `stat-value ${netPnL >= 0 ? "text-success" : "text-danger"}`;
    }

    drawEquityCurve();
  };

  // 9. Render Trade Table
  const renderTable = () => {
    if (!tradeTableBody) return;

    const typeFilterVal = filterType ? filterType.value : "ALL";
    const searchVal = searchPair ? searchPair.value.trim().toUpperCase() : "";

    const filteredTrades = trades.filter((trade) => {
      const res = trade.result || (parseFloat(trade.pnl) > 0 ? "WIN" : parseFloat(trade.pnl) < 0 ? "LOSS" : "BE");

      const matchesType =
        typeFilterVal === "ALL" ||
        (typeFilterVal === "WIN" && res === "WIN") ||
        (typeFilterVal === "LOSS" && res === "LOSS") ||
        (typeFilterVal === "BE" && res === "BE");

      const matchesSearch =
        searchVal === "" || (trade.pair && trade.pair.toUpperCase().includes(searchVal));

      return matchesType && matchesSearch;
    });

    tradeTableBody.innerHTML = "";

    if (filteredTrades.length === 0) {
      if (noDataMessage) noDataMessage.style.display = "block";
    } else {
      if (noDataMessage) noDataMessage.style.display = "none";

      filteredTrades.forEach((trade) => {
        const pnl = parseFloat(trade.pnl) || 0;
        const pnlClass = pnl >= 0 ? "text-success" : "text-danger";
        const typeBadge = trade.type === "BUY" ? "badge-buy" : "badge-sell";

        const res = trade.result || (pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE");
        const resBadge = res === "WIN" ? "badge-win" : res === "LOSS" ? "badge-loss" : "badge-be";
        const rrDisplay = trade.riskReward ? `<span class="badge-rr">${escapeHtml(trade.riskReward)}</span>` : "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${new Date(trade.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
          <td><strong>${escapeHtml(trade.pair || "-")}</strong></td>
          <td><span class="${typeBadge}">${trade.type || "BUY"}</span></td>
          <td><span class="${resBadge}">${res}</span></td>
          <td>${rrDisplay}</td>
          <td>${trade.entryPrice ? parseFloat(trade.entryPrice).toFixed(4) : "-"}</td>
          <td>${trade.exitPrice ? parseFloat(trade.exitPrice).toFixed(4) : "-"}</td>
          <td>${trade.lotSize ? parseFloat(trade.lotSize) : "-"}</td>
          <td class="${pnlClass}">${formatCurrency(pnl)}</td>
          <td>${escapeHtml(trade.strategy) || "-"}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon edit-btn" data-id="${trade.id}" title="Edit trade">✏️</button>
              <button class="btn-icon delete delete-btn" data-id="${trade.id}" title="Delete trade">🗑️</button>
            </div>
          </td>
        `;
        tradeTableBody.appendChild(tr);
      });
    }

    updateDashboard();
  };

  // 10. Handle Form Submit with Lockdown Check
  if (tradeForm) {
    tradeForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!isSubscriptionActive()) {
        openPaywall(true);
        return;
      }

      const tradeId = tradeIdInput.value;
      const tradeData = {
        id: tradeId ? tradeId : Date.now().toString(),
        date: tradeDateInput.value,
        pair: pairInput.value.trim().toUpperCase(),
        type: typeInput.value,
        result: tradeResultInput.value,
        riskReward: riskRewardInput.value.trim(),
        entryPrice: parseFloat(entryPriceInput.value) || 0,
        exitPrice: parseFloat(exitPriceInput.value) || 0,
        lotSize: parseFloat(lotSizeInput.value) || 0,
        pnl: parseFloat(pnlInput.value) || 0,
        strategy: strategyInput.value.trim(),
        notes: notesInput.value.trim(),
      };

      if (tradeId) {
        trades = trades.map((t) => (t.id === tradeId ? tradeData : t));
      } else {
        trades.unshift(tradeData);
      }

      saveToLocal();
      saveTradeToCloud(tradeData);
      resetForm();
      renderTable();
    });
  }

  // 11. Reset Form
  const resetForm = () => {
    if (!tradeForm) return;
    tradeForm.reset();
    tradeIdInput.value = "";
    pairInput.value = "";
    riskRewardInput.value = "";
    entryPriceInput.value = "";
    exitPriceInput.value = "";
    lotSizeInput.value = "";
    pnlInput.value = "";
    strategyInput.value = "";
    notesInput.value = "";
    tradeResultInput.value = "WIN";
    typeInput.value = "BUY";
    if (formTitle) formTitle.textContent = "New Trade Entry";
    if (saveBtn) saveBtn.textContent = "Save Trade";
    if (cancelBtn) cancelBtn.style.display = "none";
    clearImagePreview();
    setDefaultDateTime();
  };

  if (cancelBtn) cancelBtn.addEventListener("click", resetForm);

  // 12. Action Buttons (Edit & Delete delegation)
  if (tradeTableBody) {
    tradeTableBody.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".edit-btn");
      const deleteBtn = e.target.closest(".delete-btn");

      if (editBtn) {
        if (!isSubscriptionActive()) {
          openPaywall(true);
          return;
        }

        const id = editBtn.dataset.id;
        const trade = trades.find((t) => t.id === id);
        if (trade) {
          tradeIdInput.value = trade.id;
          tradeDateInput.value = trade.date;
          pairInput.value = trade.pair || "";
          typeInput.value = trade.type || "BUY";
          tradeResultInput.value = trade.result || (parseFloat(trade.pnl) > 0 ? "WIN" : parseFloat(trade.pnl) < 0 ? "LOSS" : "BE");
          riskRewardInput.value = trade.riskReward || "";
          entryPriceInput.value = trade.entryPrice || "";
          exitPriceInput.value = trade.exitPrice || "";
          lotSizeInput.value = trade.lotSize || "";
          pnlInput.value = trade.pnl !== undefined ? trade.pnl : "";
          strategyInput.value = trade.strategy || "";
          notesInput.value = trade.notes || "";

          if (formTitle) formTitle.textContent = "Edit Trade Entry";
          if (saveBtn) saveBtn.textContent = "Update Trade";
          if (cancelBtn) cancelBtn.style.display = "inline-flex";
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }

      if (deleteBtn) {
        if (!isSubscriptionActive()) {
          openPaywall(true);
          return;
        }

        const id = deleteBtn.dataset.id;
        if (confirm("Are you sure you want to permanently delete this trade?")) {
          trades = trades.filter((t) => t.id !== id);
          saveToLocal();
          deleteTradeFromCloud(id);
          renderTable();
        }
      }
    });
  }

  // 13. Search & Filter Events
  if (filterType) filterType.addEventListener("change", renderTable);
  if (searchPair) searchPair.addEventListener("input", renderTable);

  // 14. Excel (CSV) Report Export
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      if (trades.length === 0) {
        alert("No trade data available to export to CSV!");
        return;
      }

      const headers = [
        "Date",
        "Pair",
        "Type",
        "Result",
        "Risk_Reward",
        "Entry_Price",
        "Exit_Price",
        "Lot_Size",
        "PnL_USD",
        "Strategy",
        "Notes"
      ];

      const rows = trades.map((t) => [
        `"${t.date || ""}"`,
        `"${t.pair || ""}"`,
        `"${t.type || ""}"`,
        `"${t.result || ""}"`,
        `"${t.riskReward || ""}"`,
        t.entryPrice || 0,
        t.exitPrice || 0,
        t.lotSize || 0,
        t.pnl || 0,
        `"${(t.strategy || "").replace(/"/g, '""')}"`,
        `"${(t.notes || "").replace(/"/g, '""')}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `trading_journal_report_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  // 15. Backup: Export Data to JSON
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      if (trades.length === 0) {
        alert("No trade data available to export!");
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trades, null, 2));
      const downloadAnchor = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `trading_journal_backup_${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // 16. Restore: Import Data from JSON
  if (importFile) {
    importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (Array.isArray(importedData)) {
            if (confirm("Import this backup? It will be merged with your trades.")) {
              const existingIds = new Set(trades.map((t) => t.id));
              const newEntries = importedData.filter((t) => t.id && !existingIds.has(t.id));
              trades = [...newEntries, ...trades];
              saveToLocal();

              for (const item of newEntries) {
                await saveTradeToCloud(item);
              }

              renderTable();
              alert("Backup imported successfully!");
            }
          } else {
            alert("Invalid file structure. Please upload a valid JSON backup file.");
          }
        } catch (err) {
          alert("Failed to parse the backup file. Please verify the file format.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
  }

  // 17. Authentication & Profile Modal Handlers
  if (userProfile) {
    userProfile.addEventListener("click", () => {
      if (profileModal) profileModal.style.display = "flex";
    });
  }

  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener("click", () => {
      if (profileModal) profileModal.style.display = "none";
    });
  }

  if (openAuthModalBtn) {
    openAuthModalBtn.addEventListener("click", () => {
      if (authErrorMsg) authErrorMsg.style.display = "none";
      if (authModal) authModal.style.display = "flex";
    });
  }

  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener("click", () => {
      if (authModal) authModal.style.display = "none";
    });
  }

  if (tabLogin) {
    tabLogin.addEventListener("click", () => {
      isLoginMode = true;
      tabLogin.classList.add("active");
      if (tabRegister) tabRegister.classList.remove("active");
      if (authModalTitle) authModalTitle.textContent = "Log In to Your Journal";
      if (authSubmitBtn) authSubmitBtn.textContent = "Log In";
      if (authErrorMsg) authErrorMsg.style.display = "none";
    });
  }

  if (tabRegister) {
    tabRegister.addEventListener("click", () => {
      isLoginMode = false;
      tabRegister.classList.add("active");
      if (tabLogin) tabLogin.classList.remove("active");
      if (authModalTitle) authModalTitle.textContent = "Create Permanent Account";
      if (authSubmitBtn) authSubmitBtn.textContent = "Sign Up";
      if (authErrorMsg) authErrorMsg.style.display = "none";
    });
  }

  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!auth) {
        alert("Firebase connection initializing, please try again in a moment.");
        return;
      }

      const email = authEmail.value.trim();
      const password = authPassword.value;
      if (authErrorMsg) authErrorMsg.style.display = "none";
      if (authSubmitBtn) {
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = "Please wait...";
      }

      try {
        if (isLoginMode) {
          await auth.signInWithEmailAndPassword(email, password);
        } else {
          await auth.createUserWithEmailAndPassword(email, password);
        }
        if (authModal) authModal.style.display = "none";
        authForm.reset();
      } catch (err) {
        if (authErrorMsg) {
          authErrorMsg.textContent = err.message;
          authErrorMsg.style.display = "block";
        }
      } finally {
        if (authSubmitBtn) {
          authSubmitBtn.disabled = false;
          authSubmitBtn.textContent = isLoginMode ? "Log In" : "Sign Up";
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("Do you want to log out of your profile?")) {
        if (profileModal) profileModal.style.display = "none";
        if (auth) await auth.signOut();
      }
    });
  }

  // 18. User Support Ticket Modal Handlers
  if (openSupportModalBtn) {
    openSupportModalBtn.addEventListener("click", () => {
      if (!currentUser) {
        alert("Please log in to submit a support ticket.");
        return;
      }
      if (profileModal) profileModal.style.display = "none";
      if (supportForm) supportForm.reset();
      if (supportModal) supportModal.style.display = "flex";
    });
  }

  if (closeSupportModalBtn) {
    closeSupportModalBtn.addEventListener("click", () => {
      if (supportModal) supportModal.style.display = "none";
    });
  }

  if (supportForm) {
    supportForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUser || !db) {
        alert("Please log in to submit a support ticket.");
        return;
      }

      const subject = supportSubject.value.trim();
      const desc = supportDesc.value.trim();

      if (!subject || !desc) return;

      const submitBtn = supportForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending Ticket...";
      }

      try {
        await db.collection("support_tickets").add({
          traderId: userProfileData?.traderId || "TRD",
          userEmail: currentUser.email,
          userUid: currentUser.uid,
          subject: subject,
          description: desc,
          status: "open",
          createdAt: new Date().toISOString()
        });

        alert("✓ Support ticket submitted successfully! Admin will review your issue shortly.");
        supportForm.reset();
        if (supportModal) supportModal.style.display = "none";
      } catch (err) {
        console.error(err);
        alert("Failed to submit support ticket: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Support Ticket";
        }
      }
    });
  }

  // 19. Binance Paywall & 7, 30, 60, 90 Days Package Selection
  if (openUpgradeModalBtn) {
    openUpgradeModalBtn.addEventListener("click", () => {
      if (profileModal) profileModal.style.display = "none";
      openPaywall(false);
    });
  }

  if (closePaywallModalBtn) {
    closePaywallModalBtn.addEventListener("click", () => {
      if (paywallModal) paywallModal.style.display = "none";
    });
  }

  if (packageCards && packageCards.length > 0) {
    packageCards.forEach((card) => {
      card.addEventListener("click", () => {
        packageCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");

        selectedPlanDays = parseInt(card.dataset.days);
        const name = card.dataset.name;
        const price = card.dataset.price;
        selectedPlanName = `${name} ($${price})`;

        if (selectedPackageNameEl) selectedPackageNameEl.textContent = selectedPlanName;
      });
    });
  }

  if (copyPayIdBtn && binancePayIdText) {
    copyPayIdBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(binancePayIdText.textContent.trim()).then(() => {
        copyPayIdBtn.textContent = "✓ Copied!";
        setTimeout(() => (copyPayIdBtn.textContent = "📋 Copy"), 2000);
      });
    });
  }

  if (copyAddressBtn && binanceAddressText) {
    copyAddressBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(binanceAddressText.textContent.trim()).then(() => {
        copyAddressBtn.textContent = "✓ Copied!";
        setTimeout(() => (copyAddressBtn.textContent = "📋 Copy"), 2000);
      });
    });
  }

  // 20. Mandatory Payment Slip Screenshot Upload & Submission
  const clearPaymentSlipPreview = () => {
    paymentSlipBase64 = "";
    if (paymentSlipInput) paymentSlipInput.value = "";
    if (paymentSlipPreviewImg) paymentSlipPreviewImg.src = "";
    if (paymentSlipPreviewWrapper) paymentSlipPreviewWrapper.style.display = "none";
    if (paymentSlipPrompt) paymentSlipPrompt.style.display = "flex";
  };

  if (removePaymentSlipBtn) {
    removePaymentSlipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearPaymentSlipPreview();
    });
  }

  if (paymentSlipDropzone) {
    paymentSlipDropzone.addEventListener("click", (e) => {
      if (e.target !== removePaymentSlipBtn && (!paymentSlipPreviewWrapper || !paymentSlipPreviewWrapper.contains(e.target))) {
        if (paymentSlipInput) paymentSlipInput.click();
      }
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      paymentSlipDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        paymentSlipDropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      paymentSlipDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        paymentSlipDropzone.classList.remove("dragover");
      });
    });

    paymentSlipDropzone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        handlePaymentSlipFile(files[0]);
      }
    });
  }

  if (paymentSlipInput) {
    paymentSlipInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handlePaymentSlipFile(e.target.files[0]);
      }
    });
  }

  const handlePaymentSlipFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target.result;
      if (paymentSlipPreviewImg) paymentSlipPreviewImg.src = rawDataUrl;
      if (paymentSlipPrompt) paymentSlipPrompt.style.display = "none";
      if (paymentSlipPreviewWrapper) paymentSlipPreviewWrapper.style.display = "inline-block";

      paymentSlipBase64 = await optimizeImageForAI(rawDataUrl, 1080, 0.8);
    };
    reader.readAsDataURL(file);
  };

  if (paymentVerifyForm) {
    paymentVerifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!currentUser || !db) {
        alert("Please log in to submit a payment proof.");
        return;
      }

      const orderId = paymentOrderIdInput ? paymentOrderIdInput.value.trim() : "";
      if (!orderId) {
        alert("Please enter your Binance Order ID / TxID.");
        return;
      }

      if (!paymentSlipBase64) {
        alert("⚠️ Mandatory: Please upload your payment confirmation screenshot before submitting.");
        return;
      }

      const submitBtn = document.getElementById("submitPaymentBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting proof...";
      }

      try {
        await db.collection("payment_requests").add({
          userUid: currentUser.uid,
          traderId: userProfileData?.traderId || "TRD",
          userEmail: currentUser.email,
          packageDays: selectedPlanDays,
          packageName: selectedPlanName,
          orderId: orderId,
          slipImage: paymentSlipBase64,
          status: "pending",
          createdAt: new Date().toISOString()
        });

        if (paymentAlertMsg) {
          paymentAlertMsg.textContent = "✓ Payment proof & screenshot submitted! Admin will verify and unlock your account shortly.";
          paymentAlertMsg.style.display = "block";
        }
        if (paymentOrderIdInput) paymentOrderIdInput.value = "";
        clearPaymentSlipPreview();
      } catch (err) {
        console.error(err);
        alert("Error submitting payment proof: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Payment Proof";
        }
      }
    });
  }

  // 21. Smart AI Vision Auto-Fill Logic with Auto Math-Calculator
  const clearImagePreview = () => {
    if (imagePreview) imagePreview.src = "";
    if (previewWrapper) previewWrapper.style.display = "none";
    if (dropzonePrompt) dropzonePrompt.style.display = "flex";
    if (screenshotInput) screenshotInput.value = "";
  };

  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearImagePreview();
    });
  }

  if (dropzone) {
    dropzone.addEventListener("click", (e) => {
      if (!isSubscriptionActive()) {
        openPaywall(true);
        return;
      }

      if (e.target !== removeImageBtn && (!previewWrapper || !previewWrapper.contains(e.target))) {
        if (screenshotInput) screenshotInput.click();
      }
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      if (!isSubscriptionActive()) {
        openPaywall(true);
        return;
      }

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        handleImageFile(files[0]);
      }
    });
  }

  if (screenshotInput) {
    screenshotInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleImageFile(e.target.files[0]);
      }
    });
  }

  window.addEventListener("paste", (e) => {
    if (!isSubscriptionActive()) return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        handleImageFile(file);
        break;
      }
    }
  });

  const handleImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target.result;
      if (imagePreview) imagePreview.src = rawDataUrl;
      if (dropzonePrompt) dropzonePrompt.style.display = "none";
      if (previewWrapper) previewWrapper.style.display = "inline-block";

      // Compress and optimize heavy mobile screenshot before sending to AI
      const optimizedDataUrl = await optimizeImageForAI(rawDataUrl);
      analyzeTradeScreenshot(optimizedDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeTradeScreenshot = async (dataUrl) => {
    const assignedKey = userProfileData?.subscription?.apiKey || userProfileData?.assignedAiKey || "";

    if (!assignedKey) {
      if (aiStatus) aiStatus.style.display = "none";
      alert("⚠️ AI Vision is not active on your profile yet. Please purchase or renew a package to activate AI scanning.");
      openPaywall(false);
      return;
    }

    if (aiStatus) aiStatus.style.display = "flex";
    if (aiStatusText) aiStatusText.textContent = "⚡ Groq Vision is analyzing screenshot...";

    // Explicit Vision System Prompt designed for Desktop and Mobile TradingView / MT4 / MT5
    const promptText = `
You are an expert trading chart and financial data extractor. Analyze this trading screenshot carefully.
It may be a Mobile or Desktop TradingView chart, MetaTrader (MT4/MT5), Binance, or a broker execution ticket.

CRITICAL INSTRUCTIONS:
1. Pair / Asset:
   - Check the top-left corner, bottom toolbar, or background watermark (e.g., XAUUSD, EURUSD, BTCUSDT, US30, NAS100).
   - If NOT clearly identifiable with certainty, return null. DO NOT guess or return "UNKNOWN".

2. Trade Direction / Type:
   - If TradingView Long/Short Position tool is present:
     * If the GREEN box (target) is ABOVE the entry line, it is "BUY".
     * If the GREEN box (target) is BELOW the entry line, it is "SELL".
   - If broker ticket: look for Buy / Sell text.
   - If uncertain, return null.

3. Entry Price:
   - Look at the dividing line between green and red boxes, or grey entry line, or open price.
   - If not clearly visible, return null.

4. Exit Price (Target or Stop hit):
   - Price at target / SL boundary or current price if closed.
   - If not clearly visible, return null.

5. Risk to Reward (R:R):
   - Look for the text written on the position tool (e.g., "Risk/Reward Ratio: 2.5" or "1:2.5").
   - If not visible, return null.

6. STRICT RULE: DO NOT guess, fabricate or hallucinate any numbers or symbols. If any value is uncertain or missing, you MUST return null or empty string "". NEVER output "UNKNOWN".

Respond ONLY with a valid JSON object matching this schema:
{
  "pair": string or null,
  "type": "BUY" or "SELL" or null,
  "result": "WIN" or "LOSS" or "BE" or null,
  "riskReward": string or null,
  "entryPrice": number or null,
  "exitPrice": number or null,
  "lotSize": number or null,
  "pnl": number or null,
  "strategy": string or null
}
`;

    // Official Groq Vision Model
    const activeModel = "llama-3.2-11b-vision-preview";

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${assignedKey.trim()}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                {
                  type: "image_url",
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "AI request failed.");
      }

      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI.");

      let cleanJsonStr = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      cleanJsonStr = cleanJsonStr.replace(/```json\s*|```/g, "").trim();

      const jsonMatch = cleanJsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanJsonStr = jsonMatch[0];

      const parsedData = JSON.parse(cleanJsonStr);

      // Auto-Fill Form & Smart Recalculation (Only fill if data is valid and not "UNKNOWN")
      if (parsedData.pair && parsedData.pair !== "UNKNOWN" && parsedData.pair !== "null" && pairInput) {
        pairInput.value = parsedData.pair.toUpperCase().trim();
      }

      let tradeType = "BUY";
      if (parsedData.type && parsedData.type !== "UNKNOWN" && typeInput) {
        tradeType = parsedData.type.toUpperCase().includes("SELL") ? "SELL" : "BUY";
        typeInput.value = tradeType;
      }

      let entry = (parsedData.entryPrice !== undefined && parsedData.entryPrice !== null && !isNaN(parsedData.entryPrice)) 
        ? parseFloat(parsedData.entryPrice) 
        : 0;
      let exit = (parsedData.exitPrice !== undefined && parsedData.exitPrice !== null && !isNaN(parsedData.exitPrice)) 
        ? parseFloat(parsedData.exitPrice) 
        : 0;

      if (entry > 0 && entryPriceInput) entryPriceInput.value = entry;
      if (exit > 0 && exitPriceInput) exitPriceInput.value = exit;

      if (lotSizeInput && parsedData.lotSize && !isNaN(parsedData.lotSize)) {
        lotSizeInput.value = parsedData.lotSize;
      }

      if (riskRewardInput && parsedData.riskReward && parsedData.riskReward !== "UNKNOWN" && parsedData.riskReward !== "null") {
        riskRewardInput.value = parsedData.riskReward.toString().trim();
      }

      if (strategyInput && parsedData.strategy && parsedData.strategy !== "UNKNOWN" && parsedData.strategy !== "null") {
        strategyInput.value = parsedData.strategy.trim();
      }

      // Smart Math Calculator for Result & PnL
      let finalResult = "BE";
      if (entry > 0 && exit > 0) {
        if (tradeType === "BUY") {
          finalResult = exit > entry ? "WIN" : exit < entry ? "LOSS" : "BE";
        } else {
          finalResult = exit < entry ? "WIN" : exit > entry ? "LOSS" : "BE";
        }
      } else if (parsedData.result && parsedData.result !== "UNKNOWN") {
        const rUpper = parsedData.result.toUpperCase();
        finalResult = rUpper.includes("WIN") ? "WIN" : rUpper.includes("LOSS") ? "LOSS" : "BE";
      } else if (parsedData.pnl !== undefined && parsedData.pnl !== null && !isNaN(parsedData.pnl)) {
        finalResult = parseFloat(parsedData.pnl) > 0 ? "WIN" : parseFloat(parsedData.pnl) < 0 ? "LOSS" : "BE";
      }

      if (tradeResultInput) tradeResultInput.value = finalResult;
      if (pnlInput && parsedData.pnl !== undefined && parsedData.pnl !== null && !isNaN(parsedData.pnl)) {
        pnlInput.value = parsedData.pnl;
      }

      // Auto scroll to form so user sees it immediately
      if (tradeForm) {
        tradeForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (aiStatusText) aiStatusText.textContent = "✓ Trade details auto-filled successfully!";
      setTimeout(() => {
        if (aiStatus) aiStatus.style.display = "none";
      }, 2500);
    } catch (err) {
      console.error(err);
      if (aiStatus) aiStatus.style.display = "none";
      alert("AI Scanning Error: " + err.message);
    }
  };

  // Close modals on clicking overlay
  [authModal, paywallModal, supportModal, profileModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    }
  });

  // Initialization
  setDefaultDateTime();
  initFirebase();
  renderTable();
});