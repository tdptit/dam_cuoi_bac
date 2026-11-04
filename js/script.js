/**
 * THIỆP CƯỚI 221 PRE - MINH ĐỨC & THU HÀ
 * Vanilla JavaScript (No Frameworks required)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 0. MOBILE CANVAS RESPONSIVE SCALING
    // ----------------------------------------------------
    function updateMobileScale() {
        const pageRoot = document.getElementById('page-root-container');
        const scrollContainer = document.querySelector('[data-invitation-scroll]');
        if (!pageRoot) return;

        const winWidth = window.innerWidth || document.documentElement.clientWidth || 500;
        const availableWidth = Math.min(winWidth, 500);
        const baseWidth = 500;
        const baseHeight = 7017;
        
        const scale = availableWidth / baseWidth;
        document.documentElement.style.setProperty('--page-scale', scale);

        pageRoot.style.transform = `scale(${scale})`;
        pageRoot.style.transformOrigin = '0 0';

        const scaledHeight = Math.ceil(baseHeight * scale);
        if (scrollContainer) {
            scrollContainer.style.height = `${scaledHeight}px`;
            scrollContainer.style.minHeight = `${scaledHeight}px`;
        }
    }

    updateMobileScale();
    window.addEventListener('resize', updateMobileScale);
    window.addEventListener('orientationchange', updateMobileScale);
    // ----------------------------------------------------
    // 1. AUDIO PLAYER & VINYL SPINNING
    // ----------------------------------------------------
    const audio = document.getElementById('wedding-audio');
    const audioWrapper = document.getElementById('audio-control-wrapper');
    const audioToggle = document.querySelector('.audio-toggle');
    let isPlaying = false;

    function playAudio() {
        if (!audio) return;
        audio.play().then(() => {
            isPlaying = true;
            if (audioToggle) audioToggle.classList.add('is-playing');
        }).catch(err => {
            console.log("Autoplay waiting for interaction:", err);
        });
    }

    function pauseAudio() {
        if (!audio) return;
        audio.pause();
        isPlaying = false;
        if (audioToggle) audioToggle.classList.remove('is-playing');
    }

    if (audioToggle) {
        audioToggle.addEventListener('click', (e) => {
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
    const envelopeOverlay = document.getElementById('envelope-overlay');
    const envelopeOpenBtn = document.getElementById('envelope-open-btn');
    const envelopeCard = document.querySelector('.envelope-card');

    function openEnvelope() {
        if (envelopeOverlay) {
            envelopeOverlay.classList.add('opened');
            playAudio();
            burstHearts(window.innerWidth / 2, window.innerHeight / 2, 25);
        }
    }

    if (envelopeOpenBtn) {
        envelopeOpenBtn.addEventListener('click', openEnvelope);
    }
    if (envelopeCard) {
        envelopeCard.addEventListener('click', openEnvelope);
    }

    // ----------------------------------------------------
    // 3. COUNTDOWN TIMER (Target: 26.12.2026 09:30:00)
    // ----------------------------------------------------
    const targetDate = new Date('2026-12-26T09:30:00+07:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        let distance = targetDate - now;

        if (distance < 0) {
            distance = 0;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const countdownBlocks = document.querySelectorAll('.countdown-block');
        if (countdownBlocks.length >= 4) {
            const daysNum = countdownBlocks[0].querySelector('.countdown-num');
            const hoursNum = countdownBlocks[1].querySelector('.countdown-num');
            const minsNum = countdownBlocks[2].querySelector('.countdown-num');
            const secsNum = countdownBlocks[3].querySelector('.countdown-num');

            if (daysNum) daysNum.textContent = days < 10 ? '0' + days : days;
            if (hoursNum) hoursNum.textContent = hours < 10 ? '0' + hours : hours;
            if (minsNum) minsNum.textContent = minutes < 10 ? '0' + minutes : minutes;
            if (secsNum) secsNum.textContent = seconds < 10 ? '0' + seconds : seconds;
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ----------------------------------------------------
    // 4. SCROLL-IN TRANSITIONS (INTERSECTION OBSERVER)
    // ----------------------------------------------------
    const transitionElements = document.querySelectorAll('[data-transition-key]');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // once animated, keep visible
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.02,
            rootMargin: '50px 0px 50px 0px'
        });

        transitionElements.forEach(el => observer.observe(el));
    } else {
        // Fallback
        transitionElements.forEach(el => el.classList.add('is-visible'));
    }

    // ----------------------------------------------------
    // 5. FLOATING BLESSINGS (SỔ LƯU BÚT BAY)
    // ----------------------------------------------------
    const defaultBlessings = [
        { name: "Linh", text: "✨ Đồng tâm đồng lòng, xây đắp tổ ấm thịnh vượng!" },
        { name: "Hà", text: "Chúc mừng hạnh phúc hai bạn!" },
        { name: "Huy", text: "Chúc hai bạn trăm năm hạnh phúc!" },
        { name: "Chanh", text: "Chúc mừng hạnh phúc trăm năm!" },
        { name: "Chinh", text: "Mãi mãi bên nhau và thật hạnh phúc nhé!" }
    ];

    // Load extra blessings from localStorage if any
    let storedBlessings = [];
    try {
        const raw = localStorage.getItem('wedding_blessings');
        if (raw) storedBlessings = JSON.parse(raw);
    } catch(e) {}

    const allBlessings = [...storedBlessings, ...defaultBlessings];
    const blessingContainer = document.getElementById('blessing-msg-list');
    let blessingIndex = 0;

    // Hiển thị từng tin nhắn trôi lên — mỗi 3.5s một tin mới pop từ dưới lên
    const BLESSING_CYCLE = 3500; // ms mỗi tin
    const BLESSING_ANIM_DURATION = 7;  // seconds (phải khớp với CSS --blessing-duration)

    function spawnOneBlessing() {
        if (!blessingContainer) return;
        const b = allBlessings[blessingIndex % allBlessings.length];
        blessingIndex++;
        if (!b) return;

        const div = document.createElement('div');
        div.className = 'blessing-msg';
        div.style.setProperty('--blessing-duration', BLESSING_ANIM_DURATION + 's');
        div.innerHTML = `<strong>${escapeHtml(b.name)}</strong>: ${escapeHtml(b.text)}`;
        blessingContainer.appendChild(div);

        // Xóa sau khi animation kết thúc
        setTimeout(() => {
            if (div.parentNode) div.parentNode.removeChild(div);
        }, BLESSING_ANIM_DURATION * 1000 + 100);
    }

    // Giữ tối đa 3 tin nhắn cùng lúc, pop mới mỗi BLESSING_CYCLE
    spawnOneBlessing();
    setTimeout(spawnOneBlessing, 1200);
    setInterval(spawnOneBlessing, BLESSING_CYCLE);

    // ----------------------------------------------------
    // 6. MODAL UTILITIES (SHOW / HIDE)
    // ----------------------------------------------------
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const overlay = btn.closest('.wedding-modal-overlay');
            if (overlay) overlay.classList.remove('active');
        });
    });

    document.querySelectorAll('.wedding-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // ----------------------------------------------------
    // 7. TOAST NOTIFICATION
    // ----------------------------------------------------
    const toast = document.getElementById('wedding-toast');
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ----------------------------------------------------
    // 8. GIFT BOX MODAL (HỘP MỪNG CƯỚI)
    // ----------------------------------------------------
    const giftBtn = document.querySelector('.bar-gift-btn');
    if (giftBtn) {
        giftBtn.addEventListener('click', () => openModal('gift-modal'));
    }

    // Bank tabs inside Gift Modal
    const bankTabs = document.querySelectorAll('.bank-tab-btn');
    bankTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            bankTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetId = tab.getAttribute('data-target');
            document.querySelectorAll('.bank-card').forEach(card => card.style.display = 'none');
            const targetCard = document.getElementById(targetId);
            if (targetCard) targetCard.style.display = 'block';
        });
    });

    // Copy Account Number
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stNumber = btn.getAttribute('data-account');
            if (stNumber) {
                navigator.clipboard.writeText(stNumber).then(() => {
                    showToast('Đã sao chép số tài khoản: ' + stNumber);
                }).catch(() => {
                    showToast('Số tài khoản: ' + stNumber);
                });
            }
        });
    });

    // ----------------------------------------------------
    // 9. GUESTBOOK / BLESSING MESSAGE MODAL
    // ----------------------------------------------------
    const msgBtn = document.querySelector('.bar-msg-btn');
    if (msgBtn) {
        msgBtn.addEventListener('click', () => openModal('blessing-modal'));
    }

    const blessingForm = document.getElementById('blessing-form');
    if (blessingForm) {
        blessingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('blessing-name');
            const textInput = document.getElementById('blessing-content');

            const name = (nameInput?.value || '').trim() || 'Khách mời';
            const text = (textInput?.value || '').trim();

            if (!text) {
                alert('Vui lòng nhập lời chúc của bạn!');
                return;
            }

            const newBlessing = { name, text };
            allBlessings.unshift(newBlessing);
            storedBlessings.unshift(newBlessing);

            try {
                localStorage.setItem('wedding_blessings', JSON.stringify(storedBlessings));
            } catch(e) {}

            renderFloatingBlessings();
            closeModal('blessing-modal');
            showToast('Cảm ơn bạn đã gửi lời chúc ý nghĩa! 💕');
            burstHearts(window.innerWidth / 2, window.innerHeight / 2, 20);

            if (nameInput) nameInput.value = '';
            if (textInput) textInput.value = '';
        });
    }

    // Quick wishes chips
    document.querySelectorAll('.quick-wish-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const textInput = document.getElementById('blessing-content');
            if (textInput) {
                textInput.value = chip.textContent;
            }
        });
    });

    // ----------------------------------------------------
    // 10. RSVP BUTTON & FORM HANDLER
    // ----------------------------------------------------
    const rsvpToolbarBtn = document.querySelector('.bar-rsvp-btn');
    if (rsvpToolbarBtn) {
        rsvpToolbarBtn.addEventListener('click', () => {
            // Scroll smoothly to in-page RSVP form or open modal
            const inPageRsvp = document.querySelector('form[action=""]') || document.getElementById('rsvp-name');
            if (inPageRsvp) {
                inPageRsvp.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                openModal('rsvp-modal');
            }
        });
    }

    // In-page RSVP form
    const rsvpNameInput = document.getElementById('rsvp-name');
    if (rsvpNameInput) {
        const form = rsvpNameInput.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const guestName = rsvpNameInput.value.trim();
                if (!guestName) {
                    alert('Vui lòng nhập họ và tên của bạn!');
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
    const likeBtn = document.querySelector('.bar-like-btn');
    const likeCountEl = document.querySelector('.like-count');
    let likeCount = parseInt(localStorage.getItem('wedding_likes') || '675', 10);
    if (likeCountEl) likeCountEl.textContent = likeCount;

    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            likeCount++;
            if (likeCountEl) likeCountEl.textContent = likeCount;
            localStorage.setItem('wedding_likes', likeCount.toString());

            const rect = likeBtn.getBoundingClientRect();
            burstHearts(rect.left + rect.width / 2, rect.top, 12);
        });
    }

    // ----------------------------------------------------
    // 12. HEART BURST — CSS-animated DIVs (zero canvas lag)
    // ----------------------------------------------------
    const heartsContainer = document.getElementById('hearts-container');
    const heartEmojis = ['❤️', '💖', '💕', '🌹', '✨', '💐', '🥰'];

    function burstHearts(x, y, count = 20) {
        if (!heartsContainer) return;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'floating-heart';
            el.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

            const tx = (Math.random() - 0.5) * 180;
            const tyEnd = -(130 + Math.random() * 170);
            const rot = (Math.random() - 0.5) * 70;
            const size = 18 + Math.random() * 22;
            const delay = Math.random() * 0.3;
            const dur = 1.4 + Math.random() * 0.6;

            el.style.cssText = [
                'left:' + x + 'px',
                'top:' + y + 'px',
                'font-size:' + size + 'px',
                '--tx:' + tx + 'px',
                '--ty:' + (tyEnd * 0.5) + 'px',
                '--ty-end:' + tyEnd + 'px',
                '--rot:' + rot + 'deg',
                'animation-delay:' + delay + 's',
                'animation-duration:' + dur + 's'
            ].join(';');

            heartsContainer.appendChild(el);
            setTimeout(() => el.remove(), (delay + dur + 0.15) * 1000);
        }
    }

    // "Bắn tim" button
    const burstBtn = document.getElementById('animation-gift-preview-btn');
    if (burstBtn) {
        burstBtn.addEventListener('click', () => {
            const rect = burstBtn.getBoundingClientRect();
            burstHearts(rect.left + rect.width / 2, rect.top, 25);
        });
    }

    // ----------------------------------------------------
    // 13. LIGHTBOX GALLERY
    // ----------------------------------------------------
    const lightbox = document.getElementById('wedding-lightbox');
    const lightboxImg = document.getElementById('lightbox-image');

    document.querySelectorAll('.photo-bg-wrap').forEach(wrap => {
        wrap.style.cursor = 'pointer';
        wrap.addEventListener('click', () => {
            const bgImage = wrap.style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const match = bgImage.match(/url\(["']?([^"']+)["']?\)/);
                if (match && match[1]) {
                    let fullUrl = match[1];
                    // remove width/crop parameters for full resolution
                    fullUrl = fullUrl.replace(/(\?|&)width=\d+/, '').replace(/(\?|&)crop=[^&]+/, '');
                    if (lightboxImg) lightboxImg.src = fullUrl;
                    if (lightbox) lightbox.classList.add('active');
                }
            }
        });
    });

    if (lightbox) {
        lightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }

    // ----------------------------------------------------
    // 14. GOOGLE MAPS BUTTONS ("XEM CHỈ ĐƯỜNG")
    // ----------------------------------------------------
    document.querySelectorAll('p').forEach(p => {
        if (p.textContent.trim().toLowerCase().includes('xem chỉ đường')) {
            const parent = p.closest('.text-box-component') || p.parentElement;
            if (parent) {
                parent.style.cursor = 'pointer';
                parent.addEventListener('click', () => {
                    const address = "Số 1 Lương Yên, Bạch Đằng, Hai Bà Trưng, Hà Nội";
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
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

