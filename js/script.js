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
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
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
  const autoScrollSpeed = 70;

  function stopInvitationAutoScroll() {
    if (!autoScrollFrameId) return;

    cancelAnimationFrame(autoScrollFrameId);
    autoScrollFrameId = 0;
    autoScrollLastTime = 0;
    if (invitationScroll) {
      invitationScroll.setAttribute("data-auto-scrolling", "false");
    }
  }

  function startInvitationAutoScroll() {
    if (!invitationScroll || autoScrollFrameId) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
        stopInvitationAutoScroll();
        return;
      }

      autoScrollFrameId = requestAnimationFrame(scrollFrame);
    }

    autoScrollFrameId = requestAnimationFrame(scrollFrame);
  }

  if (invitationScroll) {
    invitationScroll.addEventListener("wheel", stopInvitationAutoScroll, {
      passive: true,
    });
    invitationScroll.addEventListener("touchstart", stopInvitationAutoScroll, {
      passive: true,
    });
    invitationScroll.addEventListener("pointerdown", stopInvitationAutoScroll);
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
      burstHearts(window.innerWidth / 2, window.innerHeight / 2, 25);
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
  const targetDate = new Date("2026-12-26T09:30:00+07:00").getTime();

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
    { name: "Bích", text: "Nhìn hai bạn thật xứng đôi! 🕊️" },
    { name: "Quân", text: "Mãi yêu thương nhau, có nhiều niềm vui! 🎉" },
    { name: "Yến", text: "Chúc ngày vui như mơ, hạnh phúc như mong đợi! 🌹" },
    { name: "Nam", text: "Cuộc sống mới của hai bạn thật đẹp! 💑" },
    { name: "Minh", text: "Yêu nhau rồi thì cùng nhau đi hết con đường! ❤️" },
    { name: "Đạt", text: "Hạnh phúc trọn vẹn cho hai bạn! 🫶" },
    { name: "Út", text: "Chúc luôn bình an và ngập tràn tiếng cười! 😊" },
    { name: "Mai", text: "Tình yêu đẹp như trong phim! ✨" },
    { name: "Khoa", text: "Chúc hai bạn thành công trong ngôi nhà mới! 🏡" },
    { name: "Thảo", text: "Mãi là một cặp đôi hoàn hảo! 💘" },
    { name: "Vân", text: "Hạnh phúc trăm năm thật là tuyệt vời! 💫" },
    { name: "Dương", text: "Một ngày cưới đẹp như mơ! 🌷" },
    { name: "Tú", text: "Cứ đi tiếp cùng nhau, hạnh phúc sẽ đến! 💖" },
    { name: "Ngọc", text: "Chúc cả hai luôn nắm tay nhau! 🤍" },
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

  // Cấu hình chuyển động
  const BLESSING_INTERVAL = 1200; // Khoảng cách giữa 2 tin nhắn (ms)
  const BLESSING_SPEED = 34; // Tốc độ di chuyển (pixel/giây)
  const BLESSING_HEIGHT = 30;

  let blessingQueue = [...allBlessings].reverse();
  let visibleBlessings = [];

  let lastFrameTime = 0;
  let lastSpawnTime = 0;
  let animationFrameId = null;

  function createBlessingElement(name, text, isUser = false) {
    const div = document.createElement("div");

    div.className = "blessing-msg" + (isUser ? " is-user" : "");

    div.innerHTML = `
      <strong>${escapeHtml(name)}:</strong>
      <span class="blessing-text">${escapeHtml(text)}</span>
    `;

    return div;
  }

  // Thêm một tin nhắn vào phía dưới vùng hiển thị
  function appendBlessing(item) {
    if (!track || !blessingContainer) return;

    const element = createBlessingElement(item.name, item.text, item.isUser);

    const startY = blessingContainer.clientHeight - BLESSING_HEIGHT;

    element.style.position = "absolute";
    element.style.left = "0";
    element.style.top = "0";
    element.style.transform = `translate3d(0, ${startY}px, 0)`;

    track.appendChild(element);

    visibleBlessings.push({
      element,
      y: startY,
    });
  }

  // Vòng lặp di chuyển liên tục
  function animateBlessings(timestamp) {
    if (!track || !blessingContainer) return;

    if (!lastFrameTime) lastFrameTime = timestamp;

    const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);

    lastFrameTime = timestamp;

    // Di chuyển tất cả tin nhắn lên trên
    visibleBlessings.forEach((item) => {
      item.y -= BLESSING_SPEED * deltaTime;

      item.element.style.transform = `translate3d(0, ${item.y}px, 0)`;

      // Mờ dần khi tin nhắn gần ra khỏi vùng hiển thị
      const fadeDistance = 25;

      if (item.y < fadeDistance) {
        item.element.style.opacity = Math.max(0, item.y / fadeDistance);
      }
    });

    // Xóa tin nhắn đã đi khỏi màn hình
    visibleBlessings = visibleBlessings.filter((item) => {
      if (item.y < -BLESSING_HEIGHT) {
        item.element.remove();
        return false;
      }

      return true;
    });

    // Tạo tin nhắn mới theo chu kỳ
    if (timestamp - lastSpawnTime >= BLESSING_INTERVAL) {
      if (!blessingQueue.length) {
        // Hết danh sách thì phát lại các lời chúc mẫu
        blessingQueue = [...defaultBlessings].reverse();
      }

      const nextBlessing = blessingQueue.shift();

      if (nextBlessing) {
        appendBlessing(nextBlessing);
      }

      lastSpawnTime = timestamp;
    }

    animationFrameId = requestAnimationFrame(animateBlessings);
  }

  // Khởi động luồng lời chúc
  function renderBlessingStream() {
    if (!track || !blessingContainer || !allBlessings.length) return;

    track.replaceChildren();

    visibleBlessings = [];
    blessingQueue = [...allBlessings].reverse();

    lastFrameTime = 0;
    lastSpawnTime = performance.now();

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }

    // Hiện ngay tin nhắn đầu tiên
    const firstBlessing = blessingQueue.shift();

    if (firstBlessing) {
      appendBlessing(firstBlessing);
    }

    // Bắt đầu chuyển động
    animationFrameId = requestAnimationFrame(animateBlessings);
  }

  renderBlessingStream();

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
      } catch (e) {}

      appendBlessing(newBlessing);

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
  document.querySelectorAll("p").forEach((p) => {
    if (p.textContent.trim().toLowerCase().includes("xem chỉ đường")) {
      const parent = p.closest(".text-box-component") || p.parentElement;
      if (parent) {
        parent.style.cursor = "pointer";
        parent.addEventListener("click", () => {
          const address = "Số 1 Lương Yên, Bạch Đằng, Hai Bà Trưng, Hà Nội";
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
            "_blank",
          );
        });
      }
    }
  });

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
