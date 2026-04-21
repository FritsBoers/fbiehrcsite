/* ============================================
   Animated Counters
   ============================================ */

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  if (isNaN(target) || el.dataset.animated) return;
  el.dataset.animated = 'true';

  let current = 0;
  const duration = 2000;
  const increment = target / (duration / 16);
  const step = () => {
    current += increment;
    if (current >= target) {
      el.textContent = target;
    } else {
      el.textContent = Math.floor(current);
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

function animateCounters() {
  const counters = document.querySelectorAll('.counter-number');
  if (!counters.length) return;

  // Use IntersectionObserver for counters that may be below the fold
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    counters.forEach(el => {
      // If element is already visible in viewport, animate immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        animateCounter(el);
      } else {
        observer.observe(el);
      }
    });
  } else {
    // Fallback: animate all immediately
    counters.forEach(el => animateCounter(el));
  }
}

document.addEventListener('DOMContentLoaded', animateCounters);
