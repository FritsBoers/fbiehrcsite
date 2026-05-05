/* Cookie Consent & Google Analytics */
(function() {
  const GA_ID = 'G-NXFH7XYDM7';

  function loadGA() {
    if (document.getElementById('ga-script')) return;
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function showBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-consent';
    banner.innerHTML = `
      <div class="cookie-consent-inner">
        <p>This site uses cookies (Google Analytics) to measure traffic. No personal data is sold or shared.</p>
        <div class="cookie-consent-buttons">
          <button id="cookie-accept" class="btn btn-primary">Accept</button>
          <button id="cookie-decline" class="btn btn-outline">Decline</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', function() {
      localStorage.setItem('cookie-consent', 'accepted');
      banner.remove();
      loadGA();
    });

    document.getElementById('cookie-decline').addEventListener('click', function() {
      localStorage.setItem('cookie-consent', 'declined');
      banner.remove();
    });
  }

  var consent = localStorage.getItem('cookie-consent');
  if (consent === 'accepted') {
    loadGA();
  } else if (consent !== 'declined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
