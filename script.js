const targetDate = new Date('2026-12-26T17:30:00');
const music = document.getElementById('bg-music');
const miniToggle = document.querySelector('.mini-toggle');
let isMusicPlaying = false;

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  const timerNodes = document.querySelectorAll('.countdown');
  timerNodes.forEach((timer) => {
    if (diff <= 0) {
      timer.innerHTML = '<span>00<small>ngày</small></span><span>00<small>giờ</small></span><span>00<small>phút</small></span><span>00<small>giây</small></span>';
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    timer.innerHTML = `
      <span>${days}<small>ngày</small></span>
      <span>${hours}<small>giờ</small></span>
      <span>${minutes}<small>phút</small></span>
      <span>${seconds}<small>giây</small></span>
    `;
  });
}

function toggleMusic() {
  if (!music || !miniToggle) return;

  if (!isMusicPlaying) {
    music.play().catch(() => {});
    miniToggle.classList.add('playing');
    isMusicPlaying = true;
  } else {
    music.pause();
    miniToggle.classList.remove('playing');
    isMusicPlaying = false;
  }
}

if (miniToggle) miniToggle.addEventListener('click', toggleMusic);

const likeBtn = document.querySelector('.like-btn');
if (likeBtn) {
  likeBtn.addEventListener('click', () => {
    const countEl = likeBtn.querySelector('strong');
    let value = Number(countEl.textContent || 0);
    value += 1;
    countEl.textContent = value;

    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = '♥';
    heart.style.left = `${Math.random() * 70 + 10}%`;
    document.body.appendChild(heart);

    setTimeout(() => heart.remove(), 1200);
  });
}

const commentBtn = document.querySelector('.comment-btn');
if (commentBtn) {
  commentBtn.addEventListener('click', () => {
    document.querySelector('.comment-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

const scrollUp = document.querySelector('.scroll-up');
const scrollDown = document.querySelector('.scroll-down');
if (scrollUp) {
  scrollUp.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
if (scrollDown) {
  scrollDown.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
}

const tabButtons = document.querySelectorAll('.tab');
if (tabButtons.length) {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((item) => item.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

const messageList = document.querySelector('.message-list');
if (messageList) {
  const messages = Array.from(messageList.children);
  if (messages.length) {
    messages.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      messageList.appendChild(clone);
    });
  }
}

setInterval(updateCountdown, 1000);
updateCountdown();

const styles = document.createElement('style');
styles.textContent = `
  .mini-toggle.playing::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 2px solid rgba(148, 98, 112, 0.7);
    animation: ring 1.6s linear infinite;
  }

  .floating-heart {
    position: fixed;
    bottom: 120px;
    left: 50%;
    color: rgba(202, 61, 82, 0.8);
    font-size: 22px;
    animation: floatUp 1.2s ease forwards;
    pointer-events: none;
    z-index: 99;
  }

  @keyframes ring {
    0% { transform: scale(0.9); opacity: 1; }
    100% { transform: scale(1.3); opacity: 0; }
  }

  @keyframes floatUp {
    0% { transform: translateY(0) scale(0.8); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(-100px) scale(1.1); opacity: 0; }
  }
`;
document.head.appendChild(styles);
