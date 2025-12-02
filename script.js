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
    const href = link.getAttribute('href');
    
    // Se il link punta a index.html (da pagine esterne), lascia navigare normalmente
    if (href && href.includes('index.html')) {
      // Non fare preventDefault, lascia che il browser navighi
      return;
    }
    
    // Se siamo nella stessa pagina, gestisci lo smooth scroll
    e.preventDefault();
    const targetId = href;
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
// FORM DI CONTATTO CON reCAPTCHA v3
// ============================================
const contactForm = document.getElementById('contact-form');
const RECAPTCHA_SITE_KEY = '6Lc68R4sAAAAANqU1nHms0Sq_B-qif2L_LUYHg4c';

// Funzione per verificare che reCAPTCHA sia caricato
function waitForRecaptcha() {
  return new Promise((resolve, reject) => {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
      grecaptcha.ready(() => {
        if (typeof grecaptcha.execute !== 'undefined') {
          resolve();
        } else {
          reject(new Error('reCAPTCHA execute non disponibile'));
        }
      });
    } else {
      // Aspetta che lo script si carichi
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
          grecaptcha.ready(() => {
            if (typeof grecaptcha.execute !== 'undefined') {
              clearInterval(checkInterval);
              resolve();
            }
          });
        } else if (attempts > 50) {
          clearInterval(checkInterval);
          reject(new Error('reCAPTCHA non caricato dopo 5 secondi'));
        }
      }, 100);
    }
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Raccogli dati del form
    const formData = {
      nome: document.getElementById('nome').value.trim(),
      cognome: document.getElementById('cognome').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      messaggio: document.getElementById('messaggio').value.trim()
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
    
    // Disabilita il pulsante submit per evitare invii multipli
    const submitBtn = contactForm.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso...';
    
    // Esegui reCAPTCHA v3
    try {
      // Aspetta che reCAPTCHA sia pronto
      await waitForRecaptcha();
      
      const recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {action: 'submit'});
      formData.recaptchaToken = recaptchaToken;
      
      // Salva il token nel campo nascosto
      document.getElementById('recaptcha-token').value = recaptchaToken;
      
      // Invia i dati al server PHP
      try {
        console.log('Invio dati del form...', formData);
        
        const response = await fetch('send-email.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        console.log('Risposta server:', response.status, response.statusText);
        
        // Verifica se la risposta è JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Risposta non JSON:', text);
          throw new Error('Risposta del server non valida');
        }
        
        const result = await response.json();
        console.log('Risultato:', result);
        
        if (result.success) {
          // Mostra messaggio di successo
          alert(result.message || 'Grazie per il tuo messaggio! Ti contatteremo presto.');
          
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
        } else {
          console.error('Errore dal server:', result);
          alert(result.message || 'Si è verificato un errore durante l\'invio. Riprova più tardi.');
        }
      } catch (fetchError) {
        console.error('Errore invio form:', fetchError);
        alert('Si è verificato un errore durante l\'invio del messaggio. Controlla la console per i dettagli o contattaci direttamente a info@verde-speranza.com');
      } finally {
        // Riabilita il pulsante
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    } catch (error) {
      console.error('Errore reCAPTCHA:', error);
      alert('Si è verificato un errore durante la verifica. Riprova più tardi.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
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
  cookieButton.setAttribute('aria-label', 'Gestione Cookie');
  
  // Usa l'icona SVG dal file
  const cookieIcon = document.createElement('img');
  cookieIcon.src = 'public/cookie-svgrepo-com.svg';
  cookieIcon.alt = 'Cookie';
  cookieIcon.style.width = '20px';
  cookieIcon.style.height = '20px';
  cookieIcon.style.filter = 'brightness(0) invert(1)'; // Rende l'icona bianca
  
  cookieButton.appendChild(cookieIcon);
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
// GALLERY CAROSELLO MOBILE
// ============================================
const galleryCarousel = document.getElementById('gallery-carousel');
const carouselTrack = document.getElementById('carousel-track');
const galleryPrev = document.getElementById('gallery-prev');
const galleryNext = document.getElementById('gallery-next');
const galleryDots = document.getElementById('gallery-dots');

if (galleryCarousel && carouselTrack) {
  const slides = carouselTrack.querySelectorAll('.carousel-slide');
  let currentSlide = 0;
  
  // Crea i dots
  if (galleryDots && slides.length > 0) {
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Vai alla slide ${index + 1}`);
      dot.addEventListener('click', () => goToSlide(index));
      galleryDots.appendChild(dot);
    });
  }
  
  // Funzione per andare a una slide specifica
  function goToSlide(index) {
    currentSlide = index;
    const translateX = -currentSlide * 100;
    carouselTrack.style.transform = `translateX(${translateX}%)`;
    
    // Aggiorna dots
    if (galleryDots) {
      const dots = galleryDots.querySelectorAll('.carousel-dot');
      dots.forEach((dot, i) => {
        if (i === currentSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }
  
  // Pulsante precedente
  if (galleryPrev) {
    galleryPrev.addEventListener('click', () => {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      goToSlide(currentSlide);
    });
  }
  
  // Pulsante successivo
  if (galleryNext) {
    galleryNext.addEventListener('click', () => {
      currentSlide = (currentSlide + 1) % slides.length;
      goToSlide(currentSlide);
    });
  }
  
  // Touch/swipe support
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  
  carouselTrack.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });
  
  carouselTrack.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
  });
  
  carouselTrack.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    
    const diffX = startX - currentX;
    const threshold = 50;
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swipe left - next
        currentSlide = (currentSlide + 1) % slides.length;
      } else {
        // Swipe right - prev
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      }
      goToSlide(currentSlide);
    }
  });
}

// ============================================
// TERRENI CAROSELLO MOBILE
// ============================================
const terreniCarousel = document.getElementById('terreni-carousel');
const terreniCarouselTrack = document.getElementById('terreni-carousel-track');
const terreniPrev = document.getElementById('terreni-prev');
const terreniNext = document.getElementById('terreni-next');
const terreniDots = document.getElementById('terreni-dots');

if (terreniCarousel && terreniCarouselTrack) {
  const terreniSlides = terreniCarouselTrack.querySelectorAll('.terreni-carousel-slide');
  let currentTerrenoSlide = 0;
  
  // Crea i dots
  if (terreniDots && terreniSlides.length > 0) {
    terreniSlides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'terreni-carousel-dot';
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Vai al terreno ${index + 1}`);
      dot.addEventListener('click', () => goToTerrenoSlide(index));
      terreniDots.appendChild(dot);
    });
  }
  
  // Funzione per andare a una slide specifica
  function goToTerrenoSlide(index) {
    currentTerrenoSlide = index;
    const translateX = -currentTerrenoSlide * 100;
    terreniCarouselTrack.style.transform = `translateX(${translateX}%)`;
    
    // Aggiorna dots
    if (terreniDots) {
      const dots = terreniDots.querySelectorAll('.terreni-carousel-dot');
      dots.forEach((dot, i) => {
        if (i === currentTerrenoSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }
  
  // Pulsante precedente
  if (terreniPrev) {
    terreniPrev.addEventListener('click', () => {
      currentTerrenoSlide = (currentTerrenoSlide - 1 + terreniSlides.length) % terreniSlides.length;
      goToTerrenoSlide(currentTerrenoSlide);
    });
  }
  
  // Pulsante successivo
  if (terreniNext) {
    terreniNext.addEventListener('click', () => {
      currentTerrenoSlide = (currentTerrenoSlide + 1) % terreniSlides.length;
      goToTerrenoSlide(currentTerrenoSlide);
    });
  }
  
  // Touch/swipe support migliorato
  let terreniStartX = 0;
  let terreniCurrentX = 0;
  let terreniIsDragging = false;
  let terreniStartTransform = 0;
  
  terreniCarouselTrack.addEventListener('touchstart', (e) => {
    terreniStartX = e.touches[0].clientX;
    terreniIsDragging = true;
    const transform = terreniCarouselTrack.style.transform;
    terreniStartTransform = transform ? parseFloat(transform.match(/-?\d+\.?\d*/)[0]) : 0;
    terreniCarouselTrack.style.transition = 'none';
  }, { passive: true });
  
  terreniCarouselTrack.addEventListener('touchmove', (e) => {
    if (!terreniIsDragging) return;
    e.preventDefault();
    terreniCurrentX = e.touches[0].clientX;
    const diffX = terreniCurrentX - terreniStartX;
    const currentTransform = terreniStartTransform + (diffX / terreniCarouselTrack.offsetWidth) * 100;
    terreniCarouselTrack.style.transform = `translateX(${currentTransform}%)`;
  }, { passive: false });
  
  terreniCarouselTrack.addEventListener('touchend', () => {
    if (!terreniIsDragging) return;
    terreniIsDragging = false;
    terreniCarouselTrack.style.transition = 'transform 0.5s ease';
    
    const diffX = terreniStartX - terreniCurrentX;
    const threshold = 50;
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swipe left - next
        currentTerrenoSlide = (currentTerrenoSlide + 1) % terreniSlides.length;
      } else {
        // Swipe right - prev
        currentTerrenoSlide = (currentTerrenoSlide - 1 + terreniSlides.length) % terreniSlides.length;
      }
    }
    goToTerrenoSlide(currentTerrenoSlide);
  }, { passive: true });
  
  // Inizializza la prima slide
  goToTerrenoSlide(0);
}

// ============================================
// PRODOTTI CAROSELLO MOBILE
// ============================================
const prodottiCarousel = document.getElementById('prodotti-carousel');
const prodottiCarouselTrack = document.getElementById('prodotti-carousel-track');
const prodottiPrev = document.getElementById('prodotti-prev');
const prodottiNext = document.getElementById('prodotti-next');
const prodottiDots = document.getElementById('prodotti-dots');

if (prodottiCarousel && prodottiCarouselTrack) {
  const prodottiSlides = prodottiCarouselTrack.querySelectorAll('.prodotti-carousel-slide');
  let currentProdottoSlide = 0;
  
  // Crea i dots
  if (prodottiDots && prodottiSlides.length > 0) {
    prodottiSlides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'prodotti-carousel-dot';
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Vai al prodotto ${index + 1}`);
      dot.addEventListener('click', () => goToProdottoSlide(index));
      prodottiDots.appendChild(dot);
    });
  }
  
  // Funzione per andare a una slide specifica
  function goToProdottoSlide(index) {
    currentProdottoSlide = index;
    const translateX = -currentProdottoSlide * 100;
    prodottiCarouselTrack.style.transform = `translateX(${translateX}%)`;
    
    // Aggiorna dots
    if (prodottiDots) {
      const dots = prodottiDots.querySelectorAll('.prodotti-carousel-dot');
      dots.forEach((dot, i) => {
        if (i === currentProdottoSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }
  
  // Pulsante precedente
  if (prodottiPrev) {
    prodottiPrev.addEventListener('click', () => {
      currentProdottoSlide = (currentProdottoSlide - 1 + prodottiSlides.length) % prodottiSlides.length;
      goToProdottoSlide(currentProdottoSlide);
    });
  }
  
  // Pulsante successivo
  if (prodottiNext) {
    prodottiNext.addEventListener('click', () => {
      currentProdottoSlide = (currentProdottoSlide + 1) % prodottiSlides.length;
      goToProdottoSlide(currentProdottoSlide);
    });
  }
  
  // Touch/swipe support migliorato
  let prodottiStartX = 0;
  let prodottiCurrentX = 0;
  let prodottiIsDragging = false;
  let prodottiStartTransform = 0;
  
  prodottiCarouselTrack.addEventListener('touchstart', (e) => {
    prodottiStartX = e.touches[0].clientX;
    prodottiIsDragging = true;
    const transform = prodottiCarouselTrack.style.transform;
    prodottiStartTransform = transform ? parseFloat(transform.match(/-?\d+\.?\d*/)[0]) : 0;
    prodottiCarouselTrack.style.transition = 'none';
  }, { passive: true });
  
  prodottiCarouselTrack.addEventListener('touchmove', (e) => {
    if (!prodottiIsDragging) return;
    e.preventDefault();
    prodottiCurrentX = e.touches[0].clientX;
    const diffX = prodottiCurrentX - prodottiStartX;
    const currentTransform = prodottiStartTransform + (diffX / prodottiCarouselTrack.offsetWidth) * 100;
    prodottiCarouselTrack.style.transform = `translateX(${currentTransform}%)`;
  }, { passive: false });
  
  prodottiCarouselTrack.addEventListener('touchend', () => {
    if (!prodottiIsDragging) return;
    prodottiIsDragging = false;
    prodottiCarouselTrack.style.transition = 'transform 0.5s ease';
    
    const diffX = prodottiStartX - prodottiCurrentX;
    const threshold = 50;
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swipe left - next
        currentProdottoSlide = (currentProdottoSlide + 1) % prodottiSlides.length;
      } else {
        // Swipe right - prev
        currentProdottoSlide = (currentProdottoSlide - 1 + prodottiSlides.length) % prodottiSlides.length;
      }
    }
    goToProdottoSlide(currentProdottoSlide);
  }, { passive: true });
  
  // Inizializza la prima slide
  goToProdottoSlide(0);
}

// ============================================
// LIGHTBOX MODAL
// ============================================
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

let currentImageIndex = 0;
let galleryImages = [];

// Raccogli tutte le immagini dalla gallery
function initGalleryImages() {
  galleryImages = [];
  
  // Immagini dalla masonry
  const masonryItems = document.querySelectorAll('.gallery-masonry .gallery-item img');
  masonryItems.forEach(img => {
    galleryImages.push({
      src: img.src,
      alt: img.alt
    });
  });
  
  // Se non ci sono immagini nella masonry, prendile dal carosello
  if (galleryImages.length === 0) {
    const carouselSlides = document.querySelectorAll('.carousel-slide img');
    carouselSlides.forEach(img => {
      galleryImages.push({
        src: img.src,
        alt: img.alt
      });
    });
  }
}

// Apri lightbox
function openLightbox(index) {
  if (galleryImages.length === 0) return;
  
  currentImageIndex = index;
  updateLightboxImage();
  lightboxModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Chiudi lightbox
function closeLightbox() {
  lightboxModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Aggiorna immagine nel lightbox
function updateLightboxImage() {
  if (galleryImages[currentImageIndex]) {
    lightboxImage.src = galleryImages[currentImageIndex].src;
    lightboxImage.alt = galleryImages[currentImageIndex].alt;
    lightboxCaption.textContent = galleryImages[currentImageIndex].alt;
  }
}

// Immagine precedente
function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  updateLightboxImage();
}

// Immagine successiva
function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  updateLightboxImage();
}

// Inizializza event listeners per le immagini
function initLightbox() {
  initGalleryImages();
  
  // Event listeners per immagini masonry
  const masonryItems = document.querySelectorAll('.gallery-masonry .gallery-item');
  masonryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });
  
  // Event listeners per immagini carosello
  const carouselSlides = document.querySelectorAll('.carousel-slide');
  carouselSlides.forEach((slide, index) => {
    slide.addEventListener('click', () => openLightbox(index));
  });
  
  // Chiudi lightbox
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  
  // Chiudi cliccando fuori dall'immagine
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }
  
  // Navigazione
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      prevImage();
    });
  }
  
  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      nextImage();
    });
  }
  
  // Chiusura con ESC
  document.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    }
  });
  
  // Previeni chiusura quando si clicca sull'immagine
  if (lightboxImage) {
    lightboxImage.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  if (lightboxCaption) {
    lightboxCaption.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}

// ============================================
// INIZIALIZZAZIONE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Verde Speranza - Luppino website loaded');
  
  // Inizializza lightbox
  initLightbox();
  
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
