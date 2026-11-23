/* ============================================================
   AMBAJAI — Site estático
   JavaScript principal
   - Navbar scroll state
   - Mobile menu
   - Reveal on scroll (Fade In Up + Scale) via IntersectionObserver
   - Parallax via scroll + requestAnimationFrame
   - Contact form (FormSubmit — funciona em GitHub Pages)
   - Scroll-to-top button
   - Toast notifications
   - Footer year
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Navbar scroll state
     ============================================================ */
  const navbar = $('#navbar');
  const onScrollNav = () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ============================================================
     Mobile menu
     ============================================================ */
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  const mobileClose = $('#mobileClose');
  const mobileOverlay = $('#mobileOverlay');
  const mobileLinks = $$('.mobile-links a, .mobile-cta');

  const openMenu = () => {
    mobileMenu.classList.add('open');
    mobileOverlay.classList.add('open');
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  menuToggle.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);
  mobileOverlay.addEventListener('click', closeMenu);
  mobileLinks.forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });

  /* ============================================================
     Reveal on scroll — Fade In Up with Scale (IntersectionObserver)
     ============================================================ */
  const reveals = $$('[data-reveal], .reveal, .reveal-soft, .reveal-stagger');

  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    // For stagger containers, assign --i to each item
    $$('.reveal-stagger').forEach((container) => {
      $$('.reveal-item', container).forEach((item, i) => {
        item.style.setProperty('--i', i);
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    reveals.forEach((el) => io.observe(el));
  }

  /* ============================================================
     Parallax (scroll-based transform)
     ============================================================ */
  const parallaxEls = $$('[data-parallax]');

  if (!reduceMotion && parallaxEls.length > 0) {
    let ticking = false;
    const updateParallax = () => {
      const viewportH = window.innerHeight;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const rect = el.parentElement.getBoundingClientRect();
        // element is in viewport
        if (rect.bottom < 0 || rect.top > viewportH) return;
        // progress from -1 (just entered bottom) to 1 (just leaving top)
        const progress = (rect.top + rect.height / 2 - viewportH / 2) / (viewportH / 2 + rect.height / 2);
        // translate up to ±speed * 100 / 2 percent
        const shift = progress * speed * 50;
        el.style.transform = `translate3d(0, ${shift}%, 0) scale(1.15)`;
      });
      ticking = false;
    };

    const onScrollParallax = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollParallax, { passive: true });
    window.addEventListener('resize', onScrollParallax, { passive: true });
    updateParallax();
  }

  /* ============================================================
     Contact form — FormSubmit (gratuito, sem backend)
     ============================================================ */
  const form = $('#contactForm');
  const submitBtn = $('#submitBtn');
  const btnLabel = $('.btn-label', submitBtn);
  const btnSpinner = $('.btn-spinner', submitBtn);
  const successMsg = $('#formSuccess');
  const errorMsg = $('#formError');
  const toast = $('#toast');

  // Email de destino da AMBAJAI
  const AMBAJAI_EMAIL = 'ambajai.1972@gmail.com';
  // Endpoint FormSubmit (sem cadastro necessário; na 1ª submissão chega um email de confirmação)
  const FORM_ENDPOINT = `https://formsubmit.co/ajax/${AMBAJAI_EMAIL}`;

  const showToast = (message, type = 'success') => {
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
      toast.className = 'toast ' + type;
    }, 4000);
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      successMsg.hidden = true;
      errorMsg.hidden = true;

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        showToast('Preencha todos os campos antes de enviar.', 'error');
        return;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        showToast('E-mail inválido. Confira e tente novamente.', 'error');
        return;
      }

      submitBtn.disabled = true;
      btnLabel.textContent = 'Enviando...';
      btnSpinner.hidden = false;

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            message,
            _subject: 'Nova mensagem para a AMBAJAI',
            _template: 'table',
          }),
        });

        if (!res.ok) throw new Error('Falha na rede');

        const data = await res.json().catch(() => ({}));
        if (data && data.success === false) throw new Error(data.message || 'Rejeitado');

        form.reset();
        successMsg.hidden = false;
        showToast('Mensagem enviada! Em breve a AMBAJAI responderá. Obrigado!', 'success');
      } catch (err) {
        console.error('[AMBAJAI contato] erro:', err);
        errorMsg.hidden = false;
        showToast('Não foi possível enviar agora. Escreva para ambajai.1972@gmail.com', 'error');
      } finally {
        submitBtn.disabled = false;
        btnLabel.textContent = 'Enviar mensagem';
        btnSpinner.hidden = true;
      }
    });
  }

  /* ============================================================
     Scroll-to-top
     ============================================================ */
  const scrollTop = $('#scrollTop');
  const onScrollTop = () => {
    if (window.scrollY > 600) scrollTop.classList.add('visible');
    else scrollTop.classList.remove('visible');
  };
  onScrollTop();
  window.addEventListener('scroll', onScrollTop, { passive: true });
  scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ============================================================
     Footer year
     ============================================================ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     Smooth-scroll fallback for older browsers (CSS handles modern)
     ============================================================ */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const reduce = reduceMotion ? 'auto' : 'smooth';
      target.scrollIntoView({ behavior: reduce, block: 'start' });
    });
  });
})();
