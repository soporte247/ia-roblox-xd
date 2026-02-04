/**
 * Frontend Performance Optimizer
 * Lazy loading, caching, debouncing, y optimizaciones varias
 */

class FrontendOptimizer {
  constructor() {
    this.cache = new Map();
    this.observers = new Map();
    this.debounceTimers = new Map();
  }

  /**
   * Debounce function - evita llamadas excesivas
   */
  debounce(key, func, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Throttle function - limita frecuencia de ejecución
   */
  throttle(key, func, limit = 300) {
    if (this.debounceTimers.has(key)) {
      return;
    }

    func();
    this.debounceTimers.set(key, true);

    setTimeout(() => {
      this.debounceTimers.delete(key);
    }, limit);
  }

  /**
   * Cache de datos con TTL
   */
  cacheGet(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  cacheSet(key, data, ttl = 300000) { // 5 minutos por defecto
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  cacheClear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Lazy loading de imágenes
   */
  setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback para navegadores antiguos
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      });
    }
  }

  /**
   * Precarga de recursos críticos
   */
  preloadCriticalResources() {
    const criticalLinks = [
      { href: '/api/health', as: 'fetch' },
      // Agregar más recursos críticos aquí
    ];

    criticalLinks.forEach(link => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.href = link.href;
      preloadLink.as = link.as;
      document.head.appendChild(preloadLink);
    });
  }

  /**
   * Optimizar animaciones con requestAnimationFrame
   */
  smoothScroll(element, target, duration = 500) {
    const start = element.scrollTop;
    const change = target - start;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      element.scrollTop = start + change * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Virtual scrolling para listas largas
   */
  createVirtualList(container, items, renderItem, itemHeight = 50) {
    const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    let scrollTop = 0;

    const updateList = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems, items.length);

      container.innerHTML = '';
      container.style.paddingTop = `${startIndex * itemHeight}px`;
      container.style.paddingBottom = `${(items.length - endIndex) * itemHeight}px`;

      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        container.appendChild(item);
      }
    };

    container.addEventListener('scroll', () => {
      this.throttle('virtualScroll', () => {
        scrollTop = container.scrollTop;
        updateList();
      }, 16); // ~60fps
    });

    updateList();
  }

  /**
   * Service Worker registration
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker registrado'))
        .catch(err => console.log('❌ Service Worker error:', err));
    }
  }

  /**
   * Detectar y notificar cuando usuario está offline
   */
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.showNotification('✅ Conexión restaurada', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNotification('⚠️ Sin conexión a internet', 'warning');
    });
  }

  /**
   * Notificaciones toast mejoradas
   */
  showNotification(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer') || this.createToastContainer();
    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-remover
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Copiar al clipboard con fallback
   */
  async copyToClipboard(text) {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Clipboard API failed:', err);
      }
    }

    // Fallback para navegadores antiguos
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  }

  /**
   * Formato de código con syntax highlighting
   */
  highlightCode(code, language = 'lua') {
    // Implementación simple de syntax highlighting
    const keywords = ['local', 'function', 'end', 'if', 'then', 'else', 'for', 'while', 'do', 'return'];
    let highlighted = code;

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
    });

    // Strings
    highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
    
    // Comentarios
    highlighted = highlighted.replace(/--.*$/gm, '<span class="comment">$&</span>');

    return highlighted;
  }

  /**
   * Medición de performance
   */
  measurePerformance(name, func) {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  /**
   * Initialize all optimizations
   */
  init() {
    this.setupLazyLoading();
    this.setupOfflineDetection();
    // this.registerServiceWorker(); // Descomentar cuando esté listo el SW
    
    console.log('✅ Frontend Optimizer initialized');
  }
}

// Singleton
const optimizer = new FrontendOptimizer();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => optimizer.init());
} else {
  optimizer.init();
}

// Exportar para uso global
window.optimizer = optimizer;
