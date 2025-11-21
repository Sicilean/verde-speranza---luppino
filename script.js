// ============================================
// NAVBAR MOBILE MENU
// ============================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
  });
}

// Chiudi menu quando si clicca su un link
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
  });
});

// Chiudi menu quando si clicca fuori
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
  }
});

// ============================================
// SMOOTH SCROLL PER NAVBAR LINKS
// ============================================
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
      const navbarHeight = document.querySelector('.navbar').offsetHeight;
      const targetPosition = targetSection.offsetTop - navbarHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
  } else {
    navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  }
  
  lastScroll = currentScroll;
});

// ============================================
// FORM DI CONTATTO
// ============================================
const contactForm = document.getElementById('contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Raccogli dati del form
    const formData = {
      nome: document.getElementById('nome').value,
      cognome: document.getElementById('cognome').value,
      email: document.getElementById('email').value,
      telefono: document.getElementById('telefono').value,
      messaggio: document.getElementById('messaggio').value
    };
    
    // Validazione base
    if (!formData.nome || !formData.cognome || !formData.email || !formData.messaggio) {
      alert('Per favore, compila tutti i campi obbligatori.');
      return;
    }
    
    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Per favore, inserisci un indirizzo email valido.');
      return;
    }
    
    // Simula invio (in produzione, qui andrebbe una chiamata API)
    console.log('Dati del form:', formData);
    
    // Mostra messaggio di successo
    alert('Grazie per il tuo messaggio! Ti contatteremo presto.');
    
    // Reset form
    contactForm.reset();
    
    // Scroll alla sezione contatti per feedback visivo
    const contattiSection = document.getElementById('contatti');
    if (contattiSection) {
      const navbarHeight = navbar.offsetHeight;
      const targetPosition = contattiSection.offsetTop - navbarHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
}

// ============================================
// COOKIE BANNER
// ============================================
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookiesBtn = document.getElementById('accept-cookies');

// Controlla se l'utente ha già accettato i cookie
function checkCookieConsent() {
  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    // Mostra il banner dopo 1 secondo
    setTimeout(() => {
      if (cookieBanner) {
        cookieBanner.classList.add('show');
      }
    }, 1000);
  }
}

// Gestisci accettazione cookie
if (acceptCookiesBtn) {
  acceptCookiesBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    if (cookieBanner) {
      cookieBanner.classList.remove('show');
    }
  });
}

// Inizializza controllo cookie al caricamento
checkCookieConsent();

// ============================================
// BOTTONE COOKIE (bottom left)
// ============================================
function createCookieButton() {
  const cookieButton = document.createElement('button');
  cookieButton.className = 'cookie-button';
  cookieButton.textContent = 'Cookie';
  cookieButton.setAttribute('aria-label', 'Gestione Cookie');
  cookieButton.addEventListener('click', () => {
    window.location.href = 'cookie-policy.html';
  });
  document.body.appendChild(cookieButton);
}

createCookieButton();

// ============================================
// ANIMAZIONI AL SCROLL (Intersection Observer)
// ============================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Applica animazioni alle sezioni
const sections = document.querySelectorAll('section');
sections.forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(20px)';
  section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(section);
});

// Applica animazioni alle card prodotti
const prodottoCards = document.querySelectorAll('.prodotto-card');
prodottoCards.forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
  observer.observe(card);
});

// Applica animazioni alle card terreni
const terrenoCards = document.querySelectorAll('.terreno-card');
terrenoCards.forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
  observer.observe(card);
});

// ============================================
// LAZY LOADING IMMAGINI
// ============================================
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      imageObserver.unobserve(img);
    }
  });
});

images.forEach(img => imageObserver.observe(img));

// ============================================
// GESTIONE ERRORI IMMAGINI
// ============================================
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', function() {
    this.src = 'https://via.placeholder.com/800x600?text=Immagine+non+disponibile';
    this.alt = 'Immagine non disponibile';
  });
});

// ============================================
// ACCESSIBILITÀ: Skip to main content
// ============================================
function createSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#home';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Vai al contenuto principale';
  document.body.insertBefore(skipLink, document.body.firstChild);
}

createSkipLink();

// ============================================
// PREVENZIONE SUBMIT MULTIPLO FORM
// ============================================
if (contactForm) {
  let isSubmitting = false;
  
  contactForm.addEventListener('submit', (e) => {
    if (isSubmitting) {
      e.preventDefault();
      return;
    }
    
    isSubmitting = true;
    const submitBtn = contactForm.querySelector('.btn-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso...';
    }
    
    // Reset dopo 3 secondi (in caso di errore)
    setTimeout(() => {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Invia Messaggio';
      }
    }, 3000);
  });
}

// ============================================
// INIZIALIZZAZIONE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Verde Speranza - Luppino website loaded');
  
  // Assicura che il primo scroll funzioni correttamente
  if (window.location.hash) {
    const targetId = window.location.hash;
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      setTimeout(() => {
        const navbarHeight = navbar.offsetHeight;
        const targetPosition = targetSection.offsetTop - navbarHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }
});
