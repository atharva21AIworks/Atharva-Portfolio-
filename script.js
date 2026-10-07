// -----------------------------
// Canvas Scroll Animation Logic
// -----------------------------
const canvas = document.getElementById('animationCanvas');
const context = canvas.getContext('2d');

const frameCount = 300;
const currentFrame = index => (
  `frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`
);

const images = [];

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    context.scale(dpr, dpr);
    
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
}

resizeCanvas();

function drawImage(img) {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    const canvasRatio = canvasWidth / canvasHeight;
    const imgRatio = img.width / img.height;
    
    let drawWidth, drawHeight;

    if (canvasRatio > imgRatio) {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgRatio;
    } else {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgRatio;
    }

    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

const img = new Image();
img.src = currentFrame(1);
img.onload = () => drawImage(img);

for (let i = 1; i <= frameCount; i++) {
  const image = new Image();
  image.src = currentFrame(i);
  images.push(image);
}

// -----------------------------
// UI & Interaction Logic
// -----------------------------

const progressBar = document.getElementById('progress-bar');
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section');
const customCursor = document.getElementById('custom-cursor');
const magneticElements = document.querySelectorAll('.magnetic');
const audioEl = document.getElementById('audio-element');
const playBtn = document.getElementById('play-pause');
const trackBtns = document.querySelectorAll('.track-btn');
const waveform = document.querySelector('.waveform');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
  
  const frameIndex = Math.min(
    frameCount - 1,
    Math.floor(scrollFraction * frameCount)
  );
  if (images[frameIndex] && images[frameIndex].complete) {
    requestAnimationFrame(() => drawImage(images[frameIndex]));
  }
  // hide canvas when scroll reaches the end so animation stops at page end
  if (scrollFraction >= 1) {
    canvas.style.display = 'none';
  } else {
    canvas.style.display = 'block';
  }
  
  progressBar.style.width = `${scrollFraction * 100}%`;
  
  let current = '';
  sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (scrollTop >= sectionTop - 200) {
          current = section.getAttribute('id') || current;
      }
  });
  navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
      }
  });
});

window.addEventListener('resize', () => {
    resizeCanvas();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const frameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
    if (images[frameIndex] && images[frameIndex].complete) drawImage(images[frameIndex]);
});

canvas.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
        document.exitFullscreen();
    }
});

if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener('mousemove', (e) => {
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
    });
    
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        el.addEventListener('mouseenter', () => {
            customCursor.classList.add('hovering');
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = `translate(0px, 0px)`;
            customCursor.classList.remove('hovering');
        });
    });
}

if (playBtn) {
    playBtn.addEventListener('click', () => {
        if (audioEl.paused) {
            audioEl.play();
            playBtn.innerHTML = '&#10074;&#10074;';
            waveform.classList.add('playing');
        } else {
            audioEl.pause();
            playBtn.innerHTML = '&#9654;';
            waveform.classList.remove('playing');
        }
    });
    audioEl.addEventListener('ended', () => {
        playBtn.innerHTML = '&#9654;';
        waveform.classList.remove('playing');
    });
    trackBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            trackBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            audioEl.src = btn.getAttribute('data-src');
            playBtn.innerHTML = '&#9654;';
            waveform.classList.remove('playing');
        });
    });
}

// Custom audio players for project cards
(function() {
    const audioCards = document.querySelectorAll('.audio-card');
    let currentlyPlaying = null;

    audioCards.forEach(card => {
        const audioSrc = card.getAttribute('data-audio');
        if (!audioSrc) return;
        const audio = new Audio(audioSrc);
        const playBtn = card.querySelector('.play-pause');
        const muteBtn = card.querySelector('.mute-btn');
        const seekBar = card.querySelector('.seek-bar');
        const timeDisplay = card.querySelector('.time');
        const waveform = card.querySelector('.waveform');

        // create waveform bars
        for (let i = 0; i < 20; i++) {
            const bar = document.createElement('span');
            waveform.appendChild(bar);
        }

        const formatTime = sec => {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        const updateUI = () => {
            const current = audio.currentTime;
            const duration = audio.duration || 0;
            timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
            if (duration) {
                seekBar.value = (current / duration) * 100;
            }
        };

        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                if (currentlyPlaying && currentlyPlaying !== audio) {
                    currentlyPlaying.pause();
                }
                audio.play();
                card.classList.add('playing');
                currentlyPlaying = audio;
                playBtn.innerHTML = '&#10074;&#10074;'; // pause icon
            } else {
                audio.pause();
                card.classList.remove('playing');
                playBtn.innerHTML = '&#9654;'; // play icon
            }
        });

        muteBtn.addEventListener('click', () => {
            audio.muted = !audio.muted;
            muteBtn.innerHTML = audio.muted ? '&#128263;' : '&#128264;'; // muted / sound icons
        });

        audio.addEventListener('timeupdate', updateUI);
        audio.addEventListener('ended', () => {
            card.classList.remove('playing');
            playBtn.innerHTML = '&#9654;';
        });

        seekBar.addEventListener('input', () => {
            if (audio.duration) {
                audio.currentTime = (seekBar.value / 100) * audio.duration;
            }
        });
    });

    // Pause all when tab/window loses focus
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && currentlyPlaying) {
            currentlyPlaying.pause();
        }
    });
})();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            if (entry.target.classList.contains('about-section') && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const counts = document.querySelectorAll('.count');
                counts.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    let count = 0;
                    const updateCount = () => {
                        const inc = target / 20;
                        if (count < target) {
                            count += inc;
                            counter.innerText = Math.ceil(count);
                            setTimeout(updateCount, 40);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    updateCount();
                });
            }
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// -----------------------------
// Contact Form & FAQ Logic
// -----------------------------

const WHATSAPP_NUMBER = "919405862575";

const form = document.getElementById('wa-form');
const successCard = document.getElementById('success-card');
const formContainer = document.getElementById('form-container');
const waRetryLink = document.getElementById('wa-retry-link');

if(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const honeypot = document.querySelector('.honeypot').value;
        if (honeypot) return; // bot detected
        
        let isValid = true;
        
        const name = document.getElementById('wa-name').value.trim();
        const email = document.getElementById('wa-email').value.trim();
        const phone = document.getElementById('wa-phone').value.trim();
        const company = document.getElementById('wa-company').value.trim();
        let message = document.getElementById('wa-message').value.trim();
        
        if (!name) { document.getElementById('err-name').innerText = "Please enter your name"; isValid = false; }
        else { document.getElementById('err-name').innerText = ""; }
        
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) { document.getElementById('err-email').innerText = "Valid email required"; isValid = false; }
        else { document.getElementById('err-email').innerText = ""; }
        
        if (!message) { document.getElementById('err-message').innerText = "Please tell me how I can help"; isValid = false; }
        else { document.getElementById('err-message').innerText = ""; }
        
        if (!isValid) return;
        
        // Truncate message to 500 chars
        if (message.length > 500) message = message.substring(0, 500) + '...';
        
        const companyStr = company ? ` from ${company}` : '';
        const phoneStr = phone ? `\nPhone: ${phone}` : '';
        
        const waText = `Hi Atharva, I'm ${name}${companyStr}.\n\nWhat I need help with:\n${message}\n\nEmail: ${email}${phoneStr}\n\n(Sent from your portfolio website)`;
        
        const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
        
        // Try opening in new tab, or redirect if on mobile
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            window.location.href = waLink;
        } else {
            window.open(waLink, '_blank', 'noopener');
        }
        
        // Show success UI
        document.getElementById('success-heading').innerText = `Almost done, ${name}!`;
        waRetryLink.href = waLink;
        formContainer.classList.add('hidden');
        successCard.classList.remove('hidden');
    });
}

const editBtn = document.getElementById('edit-msg-btn');
if(editBtn) {
    editBtn.addEventListener('click', () => {
        successCard.classList.add('hidden');
        formContainer.classList.remove('hidden');
    });
}

const copyEmailBtn = document.getElementById('copy-email-btn');
if(copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('ekboteatharva1@gmail.com').then(() => {
            copyEmailBtn.innerText = "Copied ✓";
            setTimeout(() => {
                copyEmailBtn.innerText = "Copy";
            }, 2000);
        });
    });
}

// Accordion
const accordions = document.querySelectorAll('.accordion-header');
accordions.forEach(acc => {
    acc.addEventListener('click', () => {
        const isOpen = acc.getAttribute('aria-expanded') === 'true';
        
        // Close all others
        accordions.forEach(otherAcc => {
            otherAcc.setAttribute('aria-expanded', 'false');
            otherAcc.nextElementSibling.style.maxHeight = null;
            otherAcc.querySelector('.icon').innerText = '+';
        });
        
        if (!isOpen) {
            acc.setAttribute('aria-expanded', 'true');
            const content = acc.nextElementSibling;
            content.style.maxHeight = content.scrollHeight + "px";
            acc.querySelector('.icon').innerText = 'x';
        }
    });
});
