const body = document.body;
const header = document.querySelector('header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navItems = document.querySelectorAll('.nav-item');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const closeDropdowns = () => {
  navItems.forEach((item) => {
    item.classList.remove('open');
    const toggle = item.querySelector('.dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });
};

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen) {
      closeDropdowns();
    }
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      closeDropdowns();
    });
  });
}

dropdownToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const item = toggle.closest('.nav-item');
    if (!item) return;

    const isOpen = item.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      navItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          const otherToggle = otherItem.querySelector('.dropdown-toggle');
          if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });
});

document.addEventListener('click', (event) => {
  if (!navLinks || !navToggle) return;
  const clickedInNav = navLinks.contains(event.target) || navToggle.contains(event.target);
  if (!clickedInNav) {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    closeDropdowns();
  }
});

function handleScroll() {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 12);
}

window.addEventListener('scroll', handleScroll);
handleScroll();

window.addEventListener('load', () => {
  body.classList.add('loaded');
});

const revealSet = new Set(document.querySelectorAll('.reveal'));

const addRevealGroup = (elements) => {
  let index = 0;
  elements.forEach((element) => {
    if (revealSet.has(element)) return;
    revealSet.add(element);
    element.classList.add('reveal');
    if (!element.dataset.revealDelay) {
      element.style.setProperty('--reveal-delay', `${index * 0.12}s`);
    }
    index += 1;
  });
};

const sections = document.querySelectorAll('main section');
sections.forEach((section) => {
  section.querySelectorAll(':scope [class*="grid"]').forEach((grid) => {
    const items = Array.from(grid.children);
    if (items.length) addRevealGroup(items);
  });

  const container = section.querySelector(':scope > .container');
  if (container) {
    const direct = Array.from(container.children).filter(
      (child) => !child.matches('[class*="grid"]')
    );
    if (direct.length) addRevealGroup(direct);
  } else {
    const direct = Array.from(section.children);
    if (direct.length) addRevealGroup(direct);
  }
});

const revealItems = Array.from(revealSet);
if (revealItems.length) {
  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
  }
}

const buttons = document.querySelectorAll('.btn');
buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = button.getBoundingClientRect();
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

const cursorGlow = window.matchMedia('(pointer: fine)').matches && !reduceMotion
  ? document.createElement('div')
  : null;

if (cursorGlow) {
  cursorGlow.className = 'cursor-glow';
  document.body.appendChild(cursorGlow);
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  const animateCursor = () => {
    currentX += (mouseX - currentX) * 0.15;
    currentY += (mouseY - currentY) * 0.15;
    cursorGlow.style.left = `${currentX}px`;
    cursorGlow.style.top = `${currentY}px`;
    requestAnimationFrame(animateCursor);
  };

  animateCursor();
}

const heroCanvas = document.getElementById('particle-canvas');
if (heroCanvas && !reduceMotion) {
  const ctx = heroCanvas.getContext('2d');
  const particles = [];
  const maxParticles = 60;

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    heroCanvas.width = heroCanvas.offsetWidth * ratio;
    heroCanvas.height = heroCanvas.offsetHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const createParticles = () => {
    particles.length = 0;
    const width = heroCanvas.offsetWidth;
    const height = heroCanvas.offsetHeight;
    for (let i = 0; i < maxParticles; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6
      });
    }
  };

  const renderParticles = () => {
    const width = heroCanvas.offsetWidth;
    const height = heroCanvas.offsetHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(37, 99, 235, 0.35)';
    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x < 0 || particle.x > width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > height) particle.speedY *= -1;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(renderParticles);
  };

  const handleResize = () => {
    resizeCanvas();
    createParticles();
  };

  window.addEventListener('resize', handleResize);
  handleResize();
  renderParticles();
}

const testimonialTrack = document.querySelector('.testimonial-track');
if (testimonialTrack) {
  const slides = Array.from(testimonialTrack.children);
  const prevButton = document.querySelector('.testimonial-prev');
  const nextButton = document.querySelector('.testimonial-next');
  let currentIndex = 0;
  let intervalId;

  const updateSlider = () => {
    testimonialTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentIndex);
    });
  };

  const goNext = () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  };

  const goPrev = () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlider();
  };

  const startAutoPlay = () => {
    intervalId = setInterval(goNext, 6000);
  };

  const stopAutoPlay = () => {
    if (intervalId) clearInterval(intervalId);
  };

  if (nextButton) nextButton.addEventListener('click', goNext);
  if (prevButton) prevButton.addEventListener('click', goPrev);

  testimonialTrack.addEventListener('mouseenter', stopAutoPlay);
  testimonialTrack.addEventListener('mouseleave', startAutoPlay);

  updateSlider();
  startAutoPlay();
}

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm && formStatus) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formStatus.textContent = 'Sending your request...';
    formStatus.className = 'form-status';

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.');
      }

      formStatus.textContent = data.message;
      formStatus.classList.add('success');
      contactForm.reset();
    } catch (error) {
      formStatus.textContent = error.message;
      formStatus.classList.add('error');
    }
  });
}

const anchorLinks = document.querySelectorAll('a[href^="#"]');
anchorLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

const whatsappUrl = 'https://wa.me/233598296093';
const whatsappSvg = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.52 3.48A11.45 11.45 0 0012.04 0C5.42 0 .07 5.35.07 11.96c0 2.12.55 4.18 1.6 6l-1.7 6.05 6.2-1.63a11.9 11.9 0 005.67 1.44h.01c6.62 0 11.97-5.35 11.97-11.96 0-3.2-1.25-6.2-3.3-8.38zM12 21.76h-.01a9.8 9.8 0 01-5-1.38l-.36-.21-3.68.97.98-3.58-.24-.37A9.8 9.8 0 0112 2.17c5.34 0 9.68 4.34 9.68 9.68S17.34 21.76 12 21.76zm5.62-7.24c-.31-.15-1.83-.9-2.12-1-.29-.1-.5-.15-.7.15-.21.31-.8 1-1 1.2-.19.21-.39.23-.7.08-.31-.15-1.3-.48-2.47-1.54-.91-.82-1.53-1.83-1.71-2.13-.18-.31-.02-.48.13-.63.14-.15.31-.39.47-.59.15-.2.2-.34.31-.55.1-.21.05-.4-.03-.55-.08-.15-.7-1.67-.96-2.3-.25-.6-.5-.5-.7-.5h-.6c-.21 0-.55.08-.83.4-.29.31-1.08 1.06-1.08 2.58 0 1.52 1.12 2.99 1.28 3.2.16.21 2.2 3.34 5.33 4.7.74.32 1.33.51 1.78.65.75.24 1.44.21 1.98.13.6-.09 1.82-.75 2.08-1.46.26-.72.26-1.33.18-1.46-.08-.13-.29-.21-.6-.36z"></path>
  </svg>
`;

document.querySelectorAll('.social-links').forEach((container) => {
  if (container.querySelector(`a[href="${whatsappUrl}"]`) ||
      container.querySelector('a[aria-label="WhatsApp"]')) {
    return;
  }

  const link = document.createElement('a');
  link.className = 'social-link';
  link.href = whatsappUrl;
  link.setAttribute('aria-label', 'WhatsApp');
  link.innerHTML = whatsappSvg.trim();
  container.appendChild(link);
});

const blogSuggestions = [
  {
    href: '/blog-social-platforms.html',
    tag: 'Marketing',
    title: 'Which Social Media Platforms Should You Use for Your Website?',
    description: 'Match your goals with the right channels and build a stronger traffic system.',
    image: '/img/socialmed.JPG',
    imageAlt: 'Social media platforms guide preview'
  },
  {
    href: '/blog-social-media-tips.html',
    tag: 'Marketing',
    title: '10 Easy Social Media Tips for Your Hard-Working Small Business',
    description: 'Simple strategies that turn your time online into real business growth.',
    image: '/img/Smallbus.JPG',
    imageAlt: 'Social media tips for small businesses preview'
  },
  {
    href: '/blog-15-ways.html',
    tag: 'Performance',
    title: '15 Ways to Improve Website Performance',
    description: 'Speed, SEO, and UX upgrades that keep users engaged and converting.',
    image: '/img/performance1.JPG',
    imageAlt: 'Website performance tips preview'
  },
  {
    href: '/blog-automation-playbooks.html',
    tag: 'Automation',
    title: 'Automation Playbooks That Save 10+ Hours Weekly',
    description: 'Automations that free your week and keep your business moving.',
    image: '/img/blogimage.JPG',
    imageAlt: 'Automation playbooks preview'
  },
  {
    href: '/blog-link-building.html',
    tag: 'SEO',
    title: 'How to Create a Link Building Strategy',
    description: 'Boost authority, earn trust, and grow organic visibility with smart links.',
    image: '/img/importseo.JPG',
    imageAlt: 'Link building strategy preview'
  },
  {
    href: '/blog-malware.html',
    tag: 'Security',
    title: 'What Is Malware? Here is What You Need to Know',
    description: 'Protect your website, your data, and your reputation from threats.',
    image: '/img/malware.JPG',
    imageAlt: 'Website security guide preview'
  },
  {
    href: '/blog-wordpress-migration.html',
    tag: 'Migration',
    title: 'How to Migrate Your WordPress Website to WesWorld',
    description: 'Keep your design while we take over speed, security, and maintenance.',
    image: '/img/migration.JPG',
    imageAlt: 'WordPress migration guide preview'
  },
  {
    href: '/blog-website-design.html',
    tag: 'Design',
    title: 'How to Design a Website: 6 Key Tips for Success',
    description: 'Design choices that capture attention and drive real results.',
    image: '/img/blogimage.JPG',
    imageAlt: 'Website design guide preview'
  },
  {
    href: '/blog-design-trends.html',
    tag: 'Trends',
    title: '12 of the Hottest Web Design Trends in 2026',
    description: 'Fresh ideas, bold visuals, and smarter experiences for modern sites.',
    image: '/img/hottest.JPG',
    imageAlt: 'Web design trends preview'
  },
  {
    href: '/blog-redesign-checklist.html',
    tag: 'Strategy',
    title: 'Your Website Redesign Checklist',
    description: 'Everything you need before you launch a high-performing redesign.',
    image: '/img/redesign.JPG',
    imageAlt: 'Website redesign checklist preview'
  }
];

const createSuggestionCard = (item) => {
  const card = document.createElement('a');
  card.className = 'blog-card';
  card.href = item.href;

  const media = document.createElement('div');
  media.className = 'blog-card-media';
  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.imageAlt;
  media.appendChild(img);

  const body = document.createElement('div');
  body.className = 'blog-card-body';
  const tag = document.createElement('span');
  tag.className = 'blog-card-tag';
  tag.textContent = item.tag;
  const title = document.createElement('h3');
  title.textContent = item.title;
  const description = document.createElement('p');
  description.textContent = item.description;
  const cta = document.createElement('span');
  cta.className = 'blog-card-cta';
  cta.textContent = 'Read full article';

  body.appendChild(tag);
  body.appendChild(title);
  body.appendChild(description);
  body.appendChild(cta);

  card.appendChild(media);
  card.appendChild(body);

  return card;
};

const shuffle = (items) => {
  const array = items.slice();
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const blogPostContent = document.querySelector('.blog-post-content');
if (blogPostContent && !blogPostContent.querySelector('.blog-suggestions')) {
  const currentPath = window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '');
  const filtered = blogSuggestions.filter((item) => {
    const itemPath = item.href.replace(/\.html$/, '');
    return itemPath !== currentPath;
  });
  const picks = shuffle(filtered).slice(0, 3);

  if (picks.length) {
    const suggestions = document.createElement('div');
    suggestions.className = 'blog-suggestions';
    const heading = document.createElement('h3');
    heading.textContent = 'Suggested Articles';
    const grid = document.createElement('div');
    grid.className = 'blog-grid';
    picks.forEach((item) => grid.appendChild(createSuggestionCard(item)));
    suggestions.appendChild(heading);
    suggestions.appendChild(grid);

    const insertBefore = blogPostContent.querySelector('.blog-hashtags') ||
      blogPostContent.querySelector('.blog-article-cta');
    if (insertBefore) {
      blogPostContent.insertBefore(suggestions, insertBefore);
    } else {
      blogPostContent.appendChild(suggestions);
    }
  }
}
