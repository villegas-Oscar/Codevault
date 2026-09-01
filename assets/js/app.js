(function () {
  if (window.__cldErrBridge) return;
  window.__cldErrBridge = 1;
  var sent = 0;
  function send(kind, message, source, line, col) {
    // Hard cap: a render loop can throw continuously, and a flooded parent is
    // a hung tab. After this the preview is clearly broken anyway.
    if (sent++ > 50) return;
    try {
      parent.postMessage({
        __cloudairyPreviewError: true,
        kind: kind,
        message: String(message == null ? "" : message).slice(0, 500),
        source: String(source || "").slice(0, 200),
        line: line || 0,
        col: col || 0
      }, "*");
    } catch (e) { /* parent gone or blocked — never let reporting break the page */ }
  }
  window.addEventListener("error", function (e) {
    // Resource failures (img/script/link) surface as error events on the
    // element rather than as script errors, and carry no message.
    if (e && e.target && e.target !== window && e.target.tagName) {
      send("resource", e.target.tagName + " failed to load", e.target.src || e.target.href || "", 0, 0);
      return;
    }
    send("runtime", e && e.message, e && e.filename, e && e.lineno, e && e.colno);
  }, true);
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    send("promise", (r && (r.message || r)) || "Unhandled promise rejection", "", 0, 0);
  });
  var origError = console.error;
  console.error = function () {
    try {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i];
        parts.push(a && a.message ? a.message : String(a));
      }
      send("console", parts.join(" "), "", 0, 0);
    } catch (e) {}
    // Call through — the user's own console must still work.
    return origError.apply(console, arguments);
  };
})();

(function () {
  if (window.__cldNavBridge) return;
  window.__cldNavBridge = 1;
  var PAGES = [];
  var sent = 0;

  function normalize(s) {
    s = String(s == null ? "" : s).trim().toLowerCase();
    if (!s) return "";
    s = s.split("?")[0].split("#")[0];
    var parts = s.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  }

  function pageFor(href) {
    var raw = String(href == null ? "" : href).trim();
    if (!raw) return null;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) return null;
    if (raw.charAt(0) === "#") return null;
    var p = normalize(raw);
    return PAGES.indexOf(p) === -1 ? null : p;
  }

  document.addEventListener("click", function (e) {
    // Let the user's own modifier clicks behave normally, and never fight a
    // handler that already dealt with the event.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var el = e.target;
    while (el && el !== document && el.tagName !== "A") el = el.parentNode;
    if (!el || el.tagName !== "A") return;
    if (el.target && el.target !== "" && el.target !== "_self") return;

    // getAttribute, NOT el.href: the resolved property turns "about.html" into
    // an absolute URL against the opaque origin ("null"), which matches nothing.
    var raw = el.getAttribute("href");

    // IN-PAGE ANCHOR — scroll it ourselves. Letting the browser handle it
    // navigates this srcdoc frame to about:srcdoc#id, which blanks the whole
    // preview. See the note at the top of previewNav.js.
    if (typeof raw === "string" && raw.charAt(0) === "#") {
      e.preventDefault();
      var id = raw.slice(1);
      if (!id) {
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (err) { window.scrollTo(0, 0); }
        return;
      }
      var target = null;
      try {
        target = document.getElementById(id);
        if (!target) target = document.getElementsByName(id)[0] || null;
      } catch (err) { target = null; }
      if (target && target.scrollIntoView) {
        try { target.scrollIntoView({ behavior: "smooth", block: "start" }); }
        catch (err) { target.scrollIntoView(true); }
      }
      return;
    }

    var page = pageFor(raw);
    if (!page) return;

    e.preventDefault();
    if (sent++ > 200) return;
    try {
      parent.postMessage({ __cloudairyPreviewNav: true, page: page }, "*");
    } catch (err) { /* parent gone — never let navigation reporting break the page */ }
  }, true);
})();

// Mobile Menu Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
});

// Close menu when link is clicked
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.style.display = 'none';
    });
});

// Portfolio Filtering
const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        portfolioItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.opacity = '1';
                }, 10);
            } else {
                item.style.opacity = '0';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    });
});

// Pricing Toggle
const billingToggle = document.getElementById('billingToggle');
const prices = document.querySelectorAll('.price');

billingToggle.addEventListener('change', () => {
    prices.forEach(price => {
        if (billingToggle.checked) {
            price.textContent = '$' + (Math.round(price.dataset.annual / 12)).toLocaleString();
        } else {
            price.textContent = '$' + parseInt(price.dataset.monthly).toLocaleString();
        }
    });
});

// Form Validation and Handling
const contactForm = document.getElementById('contactForm');
const formFields = contactForm.querySelectorAll('input, textarea');
const successMessage = document.querySelector('.success-message');

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateField(field) {
    const errorElement = field.parentElement.querySelector('.error-message');
    let isValid = true;
    
    if (field.type === 'email') {
        if (!field.value.trim() || !validateEmail(field.value)) {
            errorElement.textContent = 'Por favor, ingresa un email válido';
            isValid = false;
        } else {
            errorElement.textContent = '';
        }
    } else if (field.required && !field.value.trim()) {
        errorElement.textContent = 'Este campo es requerido';
        isValid = false;
    } else if (field.name === 'project' && field.value.trim().length < 10) {
        errorElement.textContent = 'La descripción debe tener al menos 10 caracteres';
        isValid = false;
    } else {
        errorElement.textContent = '';
    }
    
    if (isValid) {
        field.classList.remove('error');
    } else {
        field.classList.add('error');
    }
    
    return isValid;
}

formFields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
            validateField(field);
        }
    });
});

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isFormValid = true;
    formFields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });
    
    if (isFormValid) {
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            company: document.getElementById('company').value,
            project: document.getElementById('project').value,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('lastContactSubmission', JSON.stringify(formData));
        
        contactForm.style.display = 'none';
        successMessage.style.display = 'block';
        successMessage.scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            contactForm.reset();
            contactForm.style.display = 'flex';
            successMessage.style.display = 'none';
        }, 3000);
    } else {
        document.querySelector('input[required]').focus();
    }
});

// Scroll Animation for elements
function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
            }
        });
    }, observerOptions);
    
    const elementsToObserve = document.querySelectorAll('.service-card, .testimonial-card, .process-step, .portfolio-item');
    elementsToObserve.forEach(el => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s ease';
        observer.observe(el);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    observeElements();
    
    // Set initial pricing display
    const nameField = document.getElementById('name');
    if (nameField && localStorage.getItem('lastContactSubmission')) {
        const savedData = JSON.parse(localStorage.getItem('lastContactSubmission'));
        nameField.value = savedData.name || '';
        document.getElementById('email').value = savedData.email || '';
        document.getElementById('company').value = savedData.company || '';
    }
});

// Keyboard navigation for service cards
document.querySelectorAll('.service-card, .testimonial-card, .process-step').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });
});

// Portfolio lightbox functionality
document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('click', () => {
        const overlay = item.querySelector('.portfolio-overlay');
        if (overlay) {
            overlay.style.pointerEvents = 'auto';
        }
    });
});

// Smooth scroll fallback for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}


(function(){
  var SKIP = /modal|overlay|lightbox|dialog|popup|tooltip|dropdown|menu|toast|backdrop|drawer/i;
  function reveal(){
    var nodes = document.querySelectorAll('body *');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var cs = window.getComputedStyle(el);
      if (cs.opacity !== '0') continue;
      if (cs.position === 'fixed') continue;
      var name = (el.className && el.className.toString ? el.className.toString() : '') + ' ' + (el.id || '');
      if (SKIP.test(name)) continue;
      if (el.closest('[aria-hidden="true"],[hidden],dialog')) continue;
      if (!(el.textContent || '').trim()) continue;
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    }
  }
  if (document.readyState === 'complete') setTimeout(reveal, 900);
  else window.addEventListener('load', function(){ setTimeout(reveal, 900); });
})();