/**
 * ==============================================================================
 * JavaScript for Beginners — Interactive Application Logic & Code Execution
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initProgressTracker();
  initCodeRunners();
  initCopyButtons();
  initTopicSearch();
  initMobileDrawer();
});

/**
 * 1. SIDEBAR NAVIGATION & SCROLLSPY
 */
function initNavigation() {
  const sections = document.querySelectorAll('.guide-section');
  const navItems = document.querySelectorAll('.nav-links .nav-item');

  // Setup Intersection Observer for smooth, accurate scrollspy
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        updateActiveNav(id);
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));

  function updateActiveNav(activeId) {
    navItems.forEach(item => {
      const link = item.querySelector('a');
      if (link && link.getAttribute('href') === `#${activeId}`) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Smooth scroll click handler
  navItems.forEach(item => {
    const link = item.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
          // Close mobile menu if open
          closeMobileMenu();
        }
      });
    }
  });
}

/**
 * 2. PROGRESS TRACKER (Global Bar & Sidebar Indicator)
 */
function initProgressTracker() {
  const globalBar = document.getElementById('globalProgressBar');
  const sidebarBar = document.getElementById('sidebarProgressFill');
  const progressText = document.getElementById('progressPercentageText');

  function calculateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    if (docHeight <= 0) return;

    const progress = Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100)));

    if (globalBar) globalBar.style.width = `${progress}%`;
    if (sidebarBar) sidebarBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}%`;
  }

  window.addEventListener('scroll', calculateProgress, { passive: true });
  calculateProgress();
}

/**
 * 3. COPY TO CLIPBOARD HANDLERS
 */
function initCopyButtons() {
  const copyBtns = document.querySelectorAll('.btn-copy-code');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.code-card');
      if (!card) return;

      const codeElement = card.querySelector('pre code');
      if (!codeElement) return;

      const textToCopy = codeElement.innerText || codeElement.textContent;

      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast('Snippet copied to clipboard! Paste into VS Code (Ctrl+V).', 'success');
        
        // Button temporary feedback
        const originalText = btn.innerHTML;
        btn.innerHTML = '✔ Copied!';
        btn.style.borderColor = 'var(--accent-green)';
        btn.style.color = 'var(--accent-green)';
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      } catch (err) {
        showToast('Failed to copy. Please select and copy manually.', 'error');
      }
    });
  });
}

/**
 * 4. IN-BROWSER INTERACTIVE CODE RUNNER & VIRTUAL CONSOLE
 */
function initCodeRunners() {
  const codeCards = document.querySelectorAll('.code-card');

  codeCards.forEach(card => {
    const runBtn = card.querySelector('.btn-run-code');
    const clearBtn = card.querySelector('.terminal-clear-btn');
    const consoleLogs = card.querySelector('.terminal-console-logs');
    const codeElement = card.querySelector('pre code');

    if (clearBtn && consoleLogs) {
      clearBtn.addEventListener('click', () => {
        consoleLogs.innerHTML = `
          <div class="log-line">
            <span class="log-prompt">&gt;</span> 
            <span class="log-value" style="color:var(--text-dim);">Terminal cleared. Click '▶ Run in Browser' to execute.</span>
          </div>`;
      });
    }

    if (runBtn && codeElement && consoleLogs) {
      runBtn.addEventListener('click', () => {
        const rawCode = codeElement.innerText || codeElement.textContent;
        executeSnippetInVirtualConsole(rawCode, consoleLogs);
      });
    }
  });
}

/**
 * Executes JS code safely, intercepting console methods and rendering to the widget
 */
function executeSnippetInVirtualConsole(codeString, logContainer) {
  logContainer.innerHTML = '';
  const startTime = performance.now();

  const logsBuffer = [];

  // Helper formatter for diverse JS types
  function formatValue(val) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
    if (Array.isArray(val)) {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return '[Array]';
      }
    }
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(val);
  }

  // Create custom logging context
  const customConsole = {
    log: (...args) => {
      const formatted = args.map(formatValue).join(' ');
      logsBuffer.push({ type: 'log', text: formatted });
    },
    warn: (...args) => {
      const formatted = args.map(formatValue).join(' ');
      logsBuffer.push({ type: 'warn', text: formatted });
    },
    error: (...args) => {
      const formatted = args.map(formatValue).join(' ');
      logsBuffer.push({ type: 'error', text: formatted });
    },
    info: (...args) => {
      const formatted = args.map(formatValue).join(' ');
      logsBuffer.push({ type: 'info', text: formatted });
    }
  };

  try {
    // Run inside Function wrapper with isolated scope
    const runnerFn = new Function('console', `"use strict";\n${codeString}`);
    runnerFn(customConsole);

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(4);

    if (logsBuffer.length === 0) {
      logsBuffer.push({
        type: 'log',
        text: `[Executed successfully in ${duration}s with no console.log output]`
      });
    } else {
      logsBuffer.push({
        type: 'info',
        text: `[Done] Process exited with code=0 in ${duration}s`
      });
    }

  } catch (executionError) {
    logsBuffer.push({
      type: 'error',
      text: `Runtime Error: ${executionError.name} - ${executionError.message}`
    });
  }

  // Render log lines into the target container
  logsBuffer.forEach(item => {
    const line = document.createElement('div');
    line.className = 'log-line';

    const prompt = document.createElement('span');
    prompt.className = 'log-prompt';
    prompt.textContent = '>';

    const value = document.createElement('span');
    value.className = `log-value ${item.type === 'error' ? 'error' : item.type === 'warn' ? 'warn' : item.type === 'info' ? 'success' : ''}`;
    value.textContent = ` ${item.text}`;

    line.appendChild(prompt);
    line.appendChild(value);
    logContainer.appendChild(line);
  });

  // Scroll to bottom of terminal
  logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * 5. TOPIC SEARCH & INSTANT FILTER
 */
function initTopicSearch() {
  const searchInput = document.getElementById('topicSearchInput');
  const navItems = document.querySelectorAll('.nav-links .nav-item');
  const sections = document.querySelectorAll('.guide-section');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query === '') {
      navItems.forEach(item => item.style.display = '');
      sections.forEach(sec => sec.style.display = '');
      return;
    }

    // Filter sidebar navigation
    navItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      const targetId = item.querySelector('a')?.getAttribute('href')?.replace('#', '');
      const sec = targetId ? document.getElementById(targetId) : null;
      const secTopics = sec ? (sec.getAttribute('data-topic') || '') : '';

      const isMatch = text.includes(query) || secTopics.includes(query);
      item.style.display = isMatch ? '' : 'none';
    });

    // Optionally highlight or filter sections
    sections.forEach(sec => {
      const content = sec.textContent.toLowerCase();
      const dataTopic = (sec.getAttribute('data-topic') || '').toLowerCase();
      const isMatch = content.includes(query) || dataTopic.includes(query);
      sec.style.opacity = isMatch ? '1' : '0.25';
    });
  });
}

/**
 * 6. MOBILE DRAWER NAVIGATION
 */
function initMobileDrawer() {
  const toggleBtn = document.getElementById('menuToggleBtn');
  const sidebar = document.getElementById('sidebarNav');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (!toggleBtn || !sidebar || !backdrop) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  backdrop.addEventListener('click', closeMobileMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeMobileMenu();
    }
  });
}

function openMobileMenu() {
  const sidebar = document.getElementById('sidebarNav');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.add('open');
  if (backdrop) backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  const sidebar = document.getElementById('sidebarNav');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * 7. TOAST NOTIFICATION UTILITY
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✔' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.25s, transform 0.25s';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}
