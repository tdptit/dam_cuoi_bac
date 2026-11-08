/**
 * THIỆP CƯỚI 221 PRE - MINH ĐỨC & THU HÀ
 * Vanilla JavaScript (No Frameworks required)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------------
  // 0. MOBILE CANVAS RESPONSIVE SCALING
  // ----------------------------------------------------
  function updateMobileScale() {
    const pageRoot = document.getElementById("page-root-container");
    const scrollContainer = document.querySelector("[data-invitation-scroll]");
    if (!pageRoot) return;

    const winWidth =
      window.innerWidth || document.documentElement.clientWidth || 500;
    const availableWidth = Math.min(winWidth, 500);
    const baseWidth = 500;
    const scale = availableWidth / baseWidth;
    document.documentElement.style.setProperty("--page-scale", scale);

    pageRoot.style.transform = `scale(${scale})`;
    pageRoot.style.transformOrigin = "0 0";

    if (scrollContainer) {
      const baseHeight = pageRoot.offsetHeight;
      const scaledHeight = Math.ceil(baseHeight * scale);
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      pageRoot.style.marginBottom = `${scaledHeight - baseHeight}px`;
      scrollContainer.style.height = `${viewportHeight}px`;
      scrollContainer.style.minHeight = `${viewportHeight}px`;
    }
  }

  updateMobileScale();
  window.addEventListener("resize", updateMobileScale);
  window.addEventListener("orientationchange", updateMobileScale);
  // ----------------------------------------------------
  // 1. AUDIO PLAYER & VINYL SPINNING
  // ----------------------------------------------------
  const audio = document.getElementById("wedding-audio");
  const audioWrapper = document.getElementById("audio-control-wrapper");
  const audioToggle = document.querySelector(".audio-toggle");
  let isPlaying = false;

  function playAudio() {
    if (!audio) return;
    audio
      .play()
      .then(() => {
        isPlaying = true;
        if (audioToggle) audioToggle.classList.add("is-playing");
      })
      .catch((err) => {
        console.log("Autoplay waiting for interaction:", err);
      });
  }

  function pauseAudio() {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    if (audioToggle) audioToggle.classList.remove("is-playing");
  }

  if (audioToggle) {
    audioToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    });
  }

  // ----------------------------------------------------
  // 1.5. CÁ NHÂN HÓA TÊN KHÁCH MỜI (Hỗ trợ: ?to=, #hash, /path)
  // ----------------------------------------------------
  (function initGuestName() {
    try {
      let rawName = "";

      // 1. Đọc từ Query string (?to=... hoặc ?guest=... hoặc ?Anh-Tuấn)
      const urlParams = new URLSearchParams(window.location.search);
      rawName =
        urlParams.get("to") ||
        urlParams.get("guest") ||
        urlParams.get("ten") ||
        urlParams.get("u") ||
        urlParams.get("name") ||
        "";

      // Nếu query chỉ có dạng ?Anh-Tuấn (không có dấu =)
      if (!rawName && window.location.search) {
        const queryStr = decodeURIComponent(window.location.search.substring(1)).trim();
        if (queryStr && !queryStr.includes("=")) {
          rawName = queryStr;
        }
      }

      // 2. Đọc từ Hash (#Anh-Tuấn hoặc #to=Anh-Tuấn)
      if (!rawName && window.location.hash) {
        const hashStr = decodeURIComponent(window.location.hash.substring(1)).trim();
        if (hashStr) {
          rawName = hashStr.startsWith("to=") ? hashStr.substring(3) : hashStr;
        }
      }

      // 3. Đọc từ Path (/Anh-Tuấn hoặc /bachawedding.site/Anh-Tuấn)
      if (!rawName && window.location.pathname) {
        const segments = window.location.pathname
          .split("/")
          .map((s) => decodeURIComponent(s).trim())
          .filter((s) => Boolean(s) && !s.includes(".html") && !s.includes(".php"));

        if (segments.length > 0) {
          const last = segments[segments.length - 1];
          const ignored = ["index", "home", "thiep", "moi", "dam_cuoi_bac"];
          if (last && !ignored.includes(last.toLowerCase())) {
            rawName = last;
          }
        }
      }

      if (rawName && rawName.trim()) {
        let cleanName = rawName.trim();
        try {
          cleanName = decodeURIComponent(cleanName);
        } catch (e) { }

        // Tự động chuyển dấu '-' hoặc '_' thành khoảng trắng nếu tên dùng gạch nối
        if (cleanName.includes("-") && !cleanName.includes(" ")) {
          cleanName = cleanName.replace(/-/g, " ");
        } else if (cleanName.includes("_") && !cleanName.includes(" ")) {
          cleanName = cleanName.replace(/_/g, " ");
        }

        const guestTag = document.querySelector(".opening-guest-tag");
        if (guestTag) {
          guestTag.textContent = cleanName;
        }

        // Cập nhật tiêu đề trang tương ứng
        document.title = `Phùng Bắc & Thu Hà – Kính mời ${cleanName}`;
      }
    } catch (e) {
      console.warn("Could not parse guest name from URL:", e);
    }
  })();

  // ----------------------------------------------------
  // 2. ENVELOPE OPENING OVERLAY
  // ----------------------------------------------------
  const envelopeOverlay = document.getElementById("miuOpening");
  const envelopeOpenBtn = document.getElementById("miuOpeningCtaBtn");
  const envelopeCardBtn = document.getElementById("miuOpeningBtn");
  const openingStage = document.getElementById("miuOpeningSides");
  const openingHeartsLayer = document.getElementById("miuOpeningHearts");
  const invitationScroll = document.querySelector("[data-invitation-scroll]");
  let autoScrollFrameId = 0;
  let autoScrollLastTime = 0;
  let autoScrollPaused = false;
  let resumeOnNextClick = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  const autoScrollSpeed = 70;

  function stopInvitationAutoScroll(paused = true) {
    if (!autoScrollFrameId) return;

    cancelAnimationFrame(autoScrollFrameId);
    autoScrollFrameId = 0;
    autoScrollLastTime = 0;
    autoScrollPaused = paused;
    if (invitationScroll) {
      invitationScroll.setAttribute("data-auto-scrolling", "false");
    }
  }

  function startInvitationAutoScroll() {
    if (!invitationScroll || autoScrollFrameId) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const atBottom =
      invitationScroll.scrollTop + invitationScroll.clientHeight >=
      invitationScroll.scrollHeight - 1;
    if (atBottom) {
      autoScrollPaused = false;
      return;
    }

    autoScrollPaused = false;
    resumeOnNextClick = false;
    invitationScroll.setAttribute("data-auto-scrolling", "true");

    function scrollFrame(timestamp) {
      if (!autoScrollLastTime) autoScrollLastTime = timestamp;

      const elapsed = Math.min(timestamp - autoScrollLastTime, 100);
      autoScrollLastTime = timestamp;
      invitationScroll.scrollTop += (autoScrollSpeed * elapsed) / 1000;

      const atBottom =
        invitationScroll.scrollTop + invitationScroll.clientHeight >=
        invitationScroll.scrollHeight - 1;

      if (atBottom) {
        stopInvitationAutoScroll(false);
        return;
      }

      autoScrollFrameId = requestAnimationFrame(scrollFrame);
    }

    autoScrollFrameId = requestAnimationFrame(scrollFrame);
  }

  if (invitationScroll) {
    invitationScroll.addEventListener(
      "wheel",
      () => {
        stopInvitationAutoScroll();
        resumeOnNextClick = false;
      },
      { passive: true },
    );
    invitationScroll.addEventListener("pointerdown", (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest(
          "a, button, input, select, textarea, [role='button'], #zen-toolbar",
        )
      ) {
        resumeOnNextClick = false;
        return;
      }

      if (autoScrollFrameId) {
        stopInvitationAutoScroll();
        resumeOnNextClick = false;
      } else if (autoScrollPaused) {
        resumeOnNextClick = true;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
      }
    });
    invitationScroll.addEventListener("pointermove", (event) => {
      if (
        resumeOnNextClick &&
        Math.abs(event.clientX - pointerStartX) +
        Math.abs(event.clientY - pointerStartY) >
        8
      ) {
        resumeOnNextClick = false;
      }
    });
    invitationScroll.addEventListener("click", () => {
      if (!autoScrollPaused || !resumeOnNextClick) return;

      startInvitationAutoScroll();
      resumeOnNextClick = false;
    });
  }

  document.addEventListener("keydown", (event) => {
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
        "Enter",
      ].includes(
        event.key,
      )
    ) {
      stopInvitationAutoScroll();
      resumeOnNextClick = false;
    }
  });

  function generateOpeningHearts() {
    if (!openingHeartsLayer) return;

    openingHeartsLayer.innerHTML = "";
    const totalHearts = 42;

    for (let i = 0; i < totalHearts; i++) {
      const heart = document.createElement("span");
      heart.className = "miu-opening-heart";

      const size = (6 + Math.random() * 11).toFixed(2);
      const left = (Math.random() * 100).toFixed(2) + "%";
      const duration = (8 + Math.random() * 10).toFixed(2) + "s";
      const delay = (Math.random() * 7).toFixed(2) + "s";
      const drift = (Math.random() * 90 - 45).toFixed(2) + "px";
      const spin = (Math.random() * 90 - 45).toFixed(2) + "deg";

      heart.style.setProperty("--size", size + "px");
      heart.style.left = left;
      heart.style.setProperty("--duration", duration);
      heart.style.setProperty("--delay", delay);
      heart.style.setProperty("--drift", drift);
      heart.style.setProperty("--spin", spin);

      openingHeartsLayer.appendChild(heart);
    }
  }

  generateOpeningHearts();

  function openEnvelope() {
    if (
      !envelopeOverlay ||
      !openingStage ||
      envelopeOverlay.getAttribute("data-open") === "0"
    ) {
      return;
    }

    const sides = openingStage.querySelectorAll(".card-side");
    let done = 0;

    function finish() {
      envelopeOverlay.setAttribute("data-open", "0");
      envelopeOverlay.style.display = "none";
      document.body.classList.add("wedding-ready");
      playAudio();
      startInvitationAutoScroll();
    }

    if (!sides || !sides.length) {
      finish();
      return;
    }

    sides.forEach((side) => {
      side.addEventListener(
        "animationend",
        () => {
          done += 1;
          if (done >= sides.length) {
            finish();
          }
        },
        { once: true },
      );
    });

    openingStage.classList.add("_animating");
  }

  if (envelopeOpenBtn) {
    envelopeOpenBtn.addEventListener("click", openEnvelope);
  }
  if (envelopeCardBtn) {
    envelopeCardBtn.addEventListener("click", openEnvelope);
  }

  // ----------------------------------------------------
  // 3. COUNTDOWN TIMER (Target: 26.12.2026 09:30:00)
  // ----------------------------------------------------
  const targetDate = new Date("2026-11-27T15:00:00+07:00").getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    let distance = targetDate - now;

    if (distance < 0) {
      distance = 0;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const countdownBlocks = document.querySelectorAll(".countdown-block");
    if (countdownBlocks.length >= 4) {
      const daysNum = countdownBlocks[0].querySelector(".countdown-num");
      const hoursNum = countdownBlocks[1].querySelector(".countdown-num");
      const minsNum = countdownBlocks[2].querySelector(".countdown-num");
      const secsNum = countdownBlocks[3].querySelector(".countdown-num");

      if (daysNum) daysNum.textContent = days < 10 ? "0" + days : days;
      if (hoursNum) hoursNum.textContent = hours < 10 ? "0" + hours : hours;
      if (minsNum) minsNum.textContent = minutes < 10 ? "0" + minutes : minutes;
      if (secsNum) secsNum.textContent = seconds < 10 ? "0" + seconds : seconds;
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ----------------------------------------------------
  // 4. SCROLL-IN TRANSITIONS (INTERSECTION OBSERVER)
  // ----------------------------------------------------
  const transitionElements = document.querySelectorAll("[data-transition-key]");
  const scrollContainer = document.querySelector("[data-invitation-scroll]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
        root: scrollContainer || null,
      },
    );

    transitionElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback
    transitionElements.forEach((el) => el.classList.add("is-visible"));
  }

  // ----------------------------------------------------
  // 5. TIKTOK LIVE CONTINUOUS STREAMING BLESSINGS
  // ----------------------------------------------------
  const defaultBlessings = [
    { name: "Linh", text: "Chúc hai bạn trăm năm hạnh phúc! ✨" },
    { name: "Hà", text: "Mãi yêu nhau, mãi ngọt ngào! 💖" },
    { name: "Huy", text: "Tổ ấm ấm áp, cuộc sống luôn vui vẻ! 🥰" },
    {
      name: "Chanh",
      text: "Đám cưới đẹp quá, chúc hai bạn thật hạnh phúc! 💐",
    },
    { name: "Chinh", text: "Nụ cười của hai bạn đẹp lắm! 🌷" },
    { name: "Tuấn", text: "Chúc cô dâu chú rể luôn đồng hành! 💞" },
    { name: "Lan", text: "Sớm sinh quý tử nha! 👶" },
    { name: "Mai", text: "Trăm năm tình viên mãn, đầu bạc răng long! 💍" },
    { name: "Phương", text: "Chúc mừng hạnh phúc Bắc & Hà nha! 🎉" },
    { name: "Hoàng", text: "Chúc hai bạn luôn đong đầy yêu thương! 🥂" },
  ];

  // Load lời chúc đã lưu
  let storedBlessings = [];

  try {
    const raw = localStorage.getItem("wedding_blessings");
    if (raw) storedBlessings = JSON.parse(raw);
  } catch (e) {
    console.warn("Cannot load wedding blessings:", e);
  }

  const allBlessings = [...storedBlessings, ...defaultBlessings];

  const blessingContainer = document.getElementById("blessing-msg-list");
  let track = null;

  if (blessingContainer) {
    track = document.getElementById("blessing-stream-track");

    if (!track) {
      track = document.createElement("div");
      track.id = "blessing-stream-track";
      blessingContainer.appendChild(track);
    }
  }

  // Cấu hình chuyển động đồng đều tuyệt đối
  const BLESSING_SPEED = 32; // Tốc độ di chuyển mượt mà (pixel/giây)
  const MESSAGE_GAP = 12; // Khoảng cách cố định tuyệt đối giữa mọi lời chúc (px)

  let blessingQueue = [...allBlessings].reverse();
  let visibleBlessings = [];

  let lastFrameTime = 0;
  let animationFrameId = null;
  let isTabHidden = false;

  function createBlessingElement(name, text, isUser = false) {
    const div = document.createElement("div");

    div.className = "blessing-msg" + (isUser ? " is-user" : "");

    div.innerHTML = `
      <strong>${escapeHtml(name)}:</strong>
      <span class="blessing-text">${escapeHtml(text)}</span>
    `;

    return div;
  }

  // Thêm một tin nhắn vào luồng với toạ độ y xác định
  function appendBlessingAt(item, targetY) {
    if (!track || !blessingContainer) return;

    const element = createBlessingElement(item.name, item.text, item.isUser);
    track.appendChild(element);

    // Lấy chiều cao thực tế chính xác (fallback 36px nếu tab đang ẩn chưa layout)
    const measured = element.offsetHeight;
    const height = (measured && measured > 20) ? measured : 36;

    element.style.position = "absolute";
    element.style.left = "0";
    element.style.top = "0";
    element.style.transform = `translate3d(0, ${targetY}px, 0)`;

    visibleBlessings.push({
      element,
      y: targetY,
      height,
      needsMeasure: !measured || measured <= 20,
    });
  }

  // Sinh tin nhắn tiếp theo nối tiếp tin nhắn trước với khoảng cách đồng đều 100%
  function spawnNextBlessing(targetY) {
    if (!blessingQueue.length) {
      blessingQueue = [...defaultBlessings].reverse();
    }
    const nextItem = blessingQueue.shift();
    if (nextItem) {
      appendBlessingAt(nextItem, targetY);
    }
  }

  // Đảm bảo đáy khung luôn được cấp tin nhắn nối tiếp nhau đúng khoảng cách chuẩn
  function maintainBlessingStream() {
    if (!blessingContainer) return;
    const containerHeight = blessingContainer.clientHeight || 240;

    let safetyCounter = 0;
    while (safetyCounter < 4) {
      safetyCounter++;
      if (visibleBlessings.length === 0) {
        // Chưa có tin nhắn nào: xuất hiện ngay ở đáy khung
        spawnNextBlessing(containerHeight - 40);
      } else {
        const lowest = visibleBlessings[visibleBlessings.length - 1];
        const lowestBottom = lowest.y + (lowest.height || 36);

        // Khi đuôi tin nhắn thấp nhất đã dâng lên trên đáy một khoảng >= MESSAGE_GAP
        if (lowestBottom + MESSAGE_GAP <= containerHeight) {
          // Tin nhắn mới xuất hiện NGAY DƯỚI đuôi tin nhắn trước đúng MESSAGE_GAP
          spawnNextBlessing(lowestBottom + MESSAGE_GAP);
        } else {
          // Đã đủ tin nhắn ở đáy, không cần sinh thêm
          break;
        }
      }
    }
  }

  // Vòng lặp di chuyển liên tục 60fps
  function animateBlessings(timestamp) {
    if (!track || !blessingContainer) return;

    if (!lastFrameTime || isTabHidden) {
      lastFrameTime = timestamp;
      animationFrameId = requestAnimationFrame(animateBlessings);
      return;
    }

    // Giới hạn deltaTime tối đa 35ms (tránh nhảy bước lớn khi lag)
    const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.035);
    lastFrameTime = timestamp;

    // Di chuyển tất cả tin nhắn lên trên cùng một vận tốc
    visibleBlessings.forEach((item) => {
      if (item.needsMeasure && item.element.offsetHeight > 20) {
        item.height = item.element.offsetHeight;
        item.needsMeasure = false;
      }
      item.y -= BLESSING_SPEED * deltaTime;
      item.element.style.transform = `translate3d(0, ${item.y}px, 0)`;

      // Mờ dần khi tin nhắn gần ra khỏi đỉnh vùng hiển thị
      const fadeDistance = 30;
      if (item.y < fadeDistance) {
        item.element.style.opacity = Math.max(0, item.y / fadeDistance);
      }
    });

    // Xóa tin nhắn đã ra khỏi đỉnh màn hình
    visibleBlessings = visibleBlessings.filter((item) => {
      const height = item.height || 36;
      if (item.y < -height - 10) {
        item.element.remove();
        return false;
      }
      return true;
    });

    // Duy trì luồng tin nhắn nối tiếp nhau đều tăm tắp
    maintainBlessingStream();

    animationFrameId = requestAnimationFrame(animateBlessings);
  }

  // Xử lý khi người dùng đổi tab trình duyệt (chống nhảy cóc và chống lệch khoảng cách)
  document.addEventListener("visibilitychange", () => {
    isTabHidden = document.hidden;
    lastFrameTime = 0;
  });

  window.addEventListener("focus", () => {
    isTabHidden = false;
    lastFrameTime = 0;
  });

  window.addEventListener("blur", () => {
    lastFrameTime = 0;
  });

  // Khởi động luồng lời chúc
  function renderBlessingStream() {
    if (!track || !blessingContainer || !allBlessings.length) return;

    track.replaceChildren();

    visibleBlessings = [];
    blessingQueue = [...allBlessings].reverse();

    lastFrameTime = 0;
    isTabHidden = false;

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }

    // Khởi tạo luồng tin nhắn ban đầu với khoảng cách đều
    maintainBlessingStream();

    // Bắt đầu chuyển động
    animationFrameId = requestAnimationFrame(animateBlessings);
  }

  renderBlessingStream();

  // ----------------------------------------------------
  // 5.1. TOGGLE BLESSING STREAM (BẬT / TẮT HIỂN THỊ LỜI CHÚC)
  // ----------------------------------------------------
  const toggleStreamBtn = document.getElementById("toggle-blessing-stream-btn");
  let isStreamVisible = true;

  if (toggleStreamBtn && blessingContainer) {
    toggleStreamBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isStreamVisible = !isStreamVisible;

      if (isStreamVisible) {
        blessingContainer.classList.remove("is-hidden");
        toggleStreamBtn.classList.remove("is-off");
        toggleStreamBtn.classList.add("is-on");
        toggleStreamBtn.setAttribute("title", "Tắt hiển thị lời chúc");
        if (typeof showToast === "function") {
          showToast("Đã bật hiển thị lời chúc 💕");
        }
        maintainBlessingStream();
      } else {
        blessingContainer.classList.add("is-hidden");
        toggleStreamBtn.classList.remove("is-on");
        toggleStreamBtn.classList.add("is-off");
        toggleStreamBtn.setAttribute("title", "Bật hiển thị lời chúc");
        if (typeof showToast === "function") {
          showToast("Đã ẩn lời chúc");
        }
      }
    });
  }

  // ----------------------------------------------------
  // 6. MODAL UTILITIES (SHOW / HIDE)
  // ----------------------------------------------------
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  document.querySelectorAll(".modal-close-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const overlay = btn.closest(".wedding-modal-overlay");
      if (overlay) overlay.classList.remove("active");
    });
  });

  document.querySelectorAll(".wedding-modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });

  // ----------------------------------------------------
  // 7. TOAST NOTIFICATION
  // ----------------------------------------------------
  const toast = document.getElementById("wedding-toast");
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // ----------------------------------------------------
  // 8. GIFT BOX MODAL (HỘP MỪNG CƯỚI)
  // ----------------------------------------------------
  const giftBtn = document.querySelector(".bar-gift-btn");
  if (giftBtn) {
    giftBtn.addEventListener("click", () => openModal("gift-modal"));
  }

  // Bank tabs inside Gift Modal
  const bankTabs = document.querySelectorAll(".bank-tab-btn");
  bankTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      bankTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.getAttribute("data-target");
      document
        .querySelectorAll(".bank-card")
        .forEach((card) => (card.style.display = "none"));
      const targetCard = document.getElementById(targetId);
      if (targetCard) targetCard.style.display = "block";
    });
  });

  // Copy Account Number
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stNumber = btn.getAttribute("data-account");
      if (stNumber) {
        navigator.clipboard
          .writeText(stNumber)
          .then(() => {
            showToast("Đã sao chép số tài khoản: " + stNumber);
          })
          .catch(() => {
            showToast("Số tài khoản: " + stNumber);
          });
      }
    });
  });

  // ----------------------------------------------------
  // 9. GUESTBOOK / BLESSING MESSAGE MODAL
  // ----------------------------------------------------
  const msgBtn = document.querySelector(".bar-msg-btn");
  if (msgBtn) {
    msgBtn.addEventListener("click", () => openModal("blessing-modal"));
  }

  const blessingForm = document.getElementById("blessing-form");
  if (blessingForm) {
    blessingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("blessing-name");
      const textInput = document.getElementById("blessing-content");

      const name = (nameInput?.value || "").trim() || "Khách mời";
      const text = (textInput?.value || "").trim();

      if (!text) {
        alert("Vui lòng nhập lời chúc của bạn!");
        return;
      }

      const newBlessing = { name, text };
      newBlessing.isUser = true;

      allBlessings.unshift(newBlessing);
      storedBlessings.unshift(newBlessing);

      try {
        localStorage.setItem(
          "wedding_blessings",
          JSON.stringify(storedBlessings),
        );
      } catch (e) { }

      blessingQueue.unshift(newBlessing);
      maintainBlessingStream();

      closeModal("blessing-modal");
      showToast("Cảm ơn bạn đã gửi lời chúc ý nghĩa! 💕");
      burstHearts(window.innerWidth / 2, window.innerHeight / 2, 20);

      if (nameInput) nameInput.value = "";
      if (textInput) textInput.value = "";
    });
  }

  // Quick wishes chips
  document.querySelectorAll(".quick-wish-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const textInput = document.getElementById("blessing-content");
      if (textInput) {
        textInput.value = chip.textContent;
      }
    });
  });

  // ----------------------------------------------------
  // 10. RSVP BUTTON & FORM HANDLER
  // ----------------------------------------------------
  const rsvpToolbarBtn = document.querySelector(".bar-rsvp-btn");
  if (rsvpToolbarBtn) {
    rsvpToolbarBtn.addEventListener("click", () => {
      // Scroll smoothly to in-page RSVP form or open modal
      const inPageRsvp =
        document.querySelector('form[action=""]') ||
        document.getElementById("rsvp-name");
      if (inPageRsvp) {
        inPageRsvp.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        openModal("rsvp-modal");
      }
    });
  }

  // In-page RSVP form
  const rsvpNameInput = document.getElementById("rsvp-name");
  if (rsvpNameInput) {
    const form = rsvpNameInput.closest("form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const guestName = rsvpNameInput.value.trim();
        if (!guestName) {
          alert("Vui lòng nhập họ và tên của bạn!");
          rsvpNameInput.focus();
          return;
        }

        showToast(`Cảm ơn ${guestName} đã xác nhận tham dự! 🎉`);
        burstHearts(window.innerWidth / 2, window.innerHeight / 2, 25);
      });
    }
  }

  // ----------------------------------------------------
  // 11. LIKE BUTTON & COUNTER
  // ----------------------------------------------------
  const likeBtn = document.querySelector(".bar-like-btn");
  const likeCountEl = document.querySelector(".like-count");
  let likeCount = parseInt(localStorage.getItem("wedding_likes") || "675", 10);
  if (likeCountEl) likeCountEl.textContent = likeCount;

  if (likeBtn) {
    likeBtn.addEventListener("click", (e) => {
      likeCount++;
      if (likeCountEl) likeCountEl.textContent = likeCount;
      localStorage.setItem("wedding_likes", likeCount.toString());

      const rect = likeBtn.getBoundingClientRect();
      burstHearts(rect.left + rect.width / 2, rect.top, 12);
    });
  }

  // ----------------------------------------------------
  // 12. HEART BURST — CSS-animated DIVs (zero canvas lag)
  // ----------------------------------------------------
  const heartsContainer = document.getElementById("hearts-container");
  const heartEmojis = ["❤️", "💖", "💕", "🌹", "✨", "💐", "🥰"];

  function burstHearts(x, y, count = 20) {
    if (!heartsContainer) return;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "floating-heart";
      el.textContent =
        heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

      const tx = (Math.random() - 0.5) * 180;
      const tyEnd = -(130 + Math.random() * 170);
      const rot = (Math.random() - 0.5) * 70;
      const size = 18 + Math.random() * 22;
      const delay = Math.random() * 0.3;
      const dur = 1.4 + Math.random() * 0.6;

      el.style.cssText = [
        "left:" + x + "px",
        "top:" + y + "px",
        "font-size:" + size + "px",
        "--tx:" + tx + "px",
        "--ty:" + tyEnd * 0.5 + "px",
        "--ty-end:" + tyEnd + "px",
        "--rot:" + rot + "deg",
        "animation-delay:" + delay + "s",
        "animation-duration:" + dur + "s",
      ].join(";");

      heartsContainer.appendChild(el);
      setTimeout(() => el.remove(), (delay + dur + 0.15) * 1000);
    }
  }

  // "Bắn tim" button
  const burstBtn = document.getElementById("animation-gift-preview-btn");
  if (burstBtn) {
    burstBtn.addEventListener("click", () => {
      const rect = burstBtn.getBoundingClientRect();
      burstHearts(rect.left + rect.width / 2, rect.top, 25);
    });
  }

  // ----------------------------------------------------
  // 13. LIGHTBOX GALLERY
  // ----------------------------------------------------
  const lightbox = document.getElementById("wedding-lightbox");
  const lightboxImg = document.getElementById("lightbox-image");

  document.querySelectorAll(".photo-bg-wrap").forEach((wrap) => {
    wrap.style.cursor = "pointer";
    wrap.addEventListener("click", () => {
      const bgImage = wrap.style.backgroundImage;
      if (bgImage && bgImage !== "none") {
        const match = bgImage.match(/url\(["']?([^"']+)["']?\)/);
        if (match && match[1]) {
          let fullUrl = match[1];
          // remove width/crop parameters for full resolution
          fullUrl = fullUrl
            .replace(/(\?|&)width=\d+/, "")
            .replace(/(\?|&)crop=[^&]+/, "");
          if (lightboxImg) lightboxImg.src = fullUrl;
          if (lightbox) lightbox.classList.add("active");
        }
      }
    });
  });

  if (lightbox) {
    lightbox.addEventListener("click", () => {
      lightbox.classList.remove("active");
    });
  }

  // ----------------------------------------------------
  // 14. GOOGLE MAPS BUTTONS ("XEM CHỈ ĐƯỜNG")
  // ----------------------------------------------------
  const MAP_URLS = {
    groom: "https://www.google.com/maps?q=Quang+Trung,+V%C4%A9nh+Y%C3%AAn,+Ph%C3%BA+Th%E1%BB%8D&ftid=0x3134f03c9320672f:0x16d57ea0f2e6bcd9&entry=gps&shh=CAE&lucs=,94297699,100826475,94231188,100821559,47071704,100809208,94218641,94282134,100835699,94286869,100820247,100822504,100804975,100838877,121816461,100849759&g_ep=CAISEjI2LjQ0LjQuMDA2ODc3NDIxMBgAINeCAyqaASw5NDI5NzY5OSwxMDA4MjY0NzUsOTQyMzExODgsMTAwODIxNTU5LDQ3MDcxNzA0LDEwMDgwOTIwOCw5NDIxODY0MSw5NDI4MjEzNCwxMDA4MzU2OTksOTQyODY4NjksMTAwODIwMjQ3LDEwMDgyMjUwNCwxMDA4MDQ5NzUsMTAwODM4ODc3LDEyMTgxNjQ2MSwxMDA4NDk3NTlCAlZO&skid=01ca8150-8b82-41cc-a865-48435e15881d&g_st=ifm",
    bride: "https://www.google.com/maps?q=21.2959202,105.5641428&entry=gps&shh=CAE&lucs=,94297699,100826475,94231188,100821559,47071704,100809208,94218641,94282134,100835699,94286869,100820247,100822504,100804975,100838877,121816461,100849759&g_ep=CAISEjI2LjQ1LjEuMDExNzM4Mjc5MBgAINeCAyqaASw5NDI5NzY5OSwxMDA4MjY0NzUsOTQyMzExODgsMTAwODIxNTU5LDQ3MDcxNzA0LDEwMDgwOTIwOCw5NDIxODY0MSw5NDI4MjEzNCwxMDA4MzU2OTksOTQyODY4NjksMTAwODIwMjQ3LDEwMDgyMjUwNCwxMDA4MDQ5NzUsMTAwODM4ODc3LDEyMTgxNjQ2MSwxMDA4NDk3NTlCAlZO&skid=eb9b2ae2-a985-4fdb-8fe3-23b539030ef0&g_st=ifm"
  };

  // Nhà trai map button (Node hJviEDP9ZI)
  const groomMapBox = document.querySelector('[data-node-id="hJviEDP9ZI"]');
  if (groomMapBox) {
    groomMapBox.style.cursor = "pointer";
    groomMapBox.addEventListener("click", () => {
      window.open(MAP_URLS.groom, "_blank");
    });
  }

  // Nhà gái map button (Node xKsBv0AnUa)
  const brideMapBox = document.querySelector('[data-node-id="xKsBv0AnUa"]');
  if (brideMapBox) {
    brideMapBox.style.cursor = "pointer";
    brideMapBox.addEventListener("click", () => {
      window.open(MAP_URLS.bride, "_blank");
    });
  }

  // Fallback for any other 'xem chỉ đường' elements
  document.querySelectorAll("p").forEach((p) => {
    if (p.textContent.trim().toLowerCase().includes("xem chỉ đường")) {
      const parent = p.closest(".text-box-component") || p.parentElement;
      if (parent && !parent.getAttribute("data-map-bound")) {
        parent.setAttribute("data-map-bound", "true");
        parent.style.cursor = "pointer";
        const isBride = parent.getAttribute("data-node-id") === "xKsBv0AnUa";
        parent.addEventListener("click", () => {
          window.open(isBride ? MAP_URLS.bride : MAP_URLS.groom, "_blank");
        });
      }
    }
  });


  // ----------------------------------------------------
  // 15. OUR LOVE 3D PEEK CAROUSEL (Touch, Swipe & Auto)
  // ----------------------------------------------------
  const loveCarousel = document.getElementById("our-love-carousel");
  if (loveCarousel) {
    const dotsContainer = document.getElementById("love-carousel-dots");
    const slides = Array.from(loveCarousel.querySelectorAll(".love-slide"));
    const totalSlides = slides.length;
    let currentIndex = 0;
    let autoPlayTimer = null;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let hasMoved = false;

    // Tạo thanh pagination dots
    if (dotsContainer && totalSlides > 0) {
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = "love-dot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          goToSlide(i);
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateSlides() {
      slides.forEach((slide, i) => {
        slide.classList.remove("is-active", "is-prev", "is-next", "is-far-prev", "is-far-next");

        let diff = (i - currentIndex) % totalSlides;
        if (diff > totalSlides / 2) diff -= totalSlides;
        if (diff < -totalSlides / 2) diff += totalSlides;

        if (diff === 0) {
          slide.classList.add("is-active");
        } else if (diff === -1) {
          slide.classList.add("is-prev");
        } else if (diff === 1) {
          slide.classList.add("is-next");
        } else if (diff < -1) {
          slide.classList.add("is-far-prev");
        } else {
          slide.classList.add("is-far-next");
        }
      });

      // Cập nhật dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll(".love-dot");
        dots.forEach((dot, idx) => {
          dot.classList.toggle("active", idx === currentIndex);
        });
      }
    }

    function goToSlide(index) {
      currentIndex = (index + totalSlides) % totalSlides;
      updateSlides();
      restartAutoPlay();
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(nextSlide, 3500);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function restartAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(nextSlide, 4000);
    }

    // Bấm vào ảnh 2 bên mép để chuyển nhanh tới ảnh đó
    slides.forEach((slide) => {
      slide.addEventListener("click", (e) => {
        if (hasMoved) return; // Nếu đang vuốt tay thì bỏ qua
        if (slide.classList.contains("is-prev")) {
          e.stopPropagation();
          prevSlide();
        } else if (slide.classList.contains("is-next")) {
          e.stopPropagation();
          nextSlide();
        }
      });
    });

    // Vuốt tay (Touch Gestures) trên màn hình điện thoại
    loveCarousel.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      hasMoved = false;
      startX = e.touches[0].clientX;
      currentX = startX;
      stopAutoPlay();
    }, { passive: true });

    loveCarousel.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      if (Math.abs(diffX) > 10) {
        hasMoved = true;
      }
    }, { passive: true });

    loveCarousel.addEventListener("touchend", () => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = currentX - startX;
      if (diffX < -35) {
        nextSlide();
      } else if (diffX > 35) {
        prevSlide();
      } else {
        restartAutoPlay();
      }
    });

    loveCarousel.addEventListener("touchcancel", () => {
      isDragging = false;
      restartAutoPlay();
    });

    // Kéo chuột (Mouse Drag) trên máy tính
    loveCarousel.addEventListener("mousedown", (e) => {
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      currentX = startX;
      stopAutoPlay();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      currentX = e.clientX;
      const diffX = currentX - startX;
      if (Math.abs(diffX) > 8) {
        hasMoved = true;
      }
    });

    window.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = currentX - startX;
      if (diffX < -35) {
        nextSlide();
      } else if (diffX > 35) {
        prevSlide();
      } else {
        restartAutoPlay();
      }
    });

    // Tạm dừng khi di chuột vào và chạy lại khi rê chuột ra
    loveCarousel.addEventListener("mouseenter", stopAutoPlay);
    loveCarousel.addEventListener("mouseleave", startAutoPlay);

    // Kích hoạt khởi đầu
    updateSlides();
    startAutoPlay();
  }

  // Helper
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
