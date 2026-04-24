;(() => {
   const PAGES = {
      intro: 'docs/pages/intro.html',
      normalize: 'docs/pages/normalize.html',
      validate: 'docs/pages/validate.html',
      handlers: 'docs/pages/handlers.html',
      schema: 'docs/pages/schema.html',
      serve: 'docs/pages/serve.html',
      plugins: 'docs/pages/plugins.html',
      cheatsheet: 'docs/pages/cheatsheet.html',
   }

   const DEFAULT_PAGE = 'intro'

   const mainEl = document.getElementById('page-content')
   const navEl = document.getElementById('site-nav')
   const overlay = document.getElementById('nav-overlay')
   const toggle = document.getElementById('nav-toggle')
   const themeBtn = document.getElementById('theme-toggle')

   let currentPage = null
   const cache = {}

   // ── THEME ──────────────────────────────────────────────────────────────────
   const savedTheme = localStorage.getItem('dh-theme')
   if (savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)

   function updateThemeIcon() {
      const isDark =
         document.documentElement.getAttribute('data-theme') !== 'light'
      themeBtn.innerHTML = isDark
         ? `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>`
         : `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`
   }

   themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme')
      const next = current === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('dh-theme', next)
      updateThemeIcon()
   })

   updateThemeIcon()

   // ── MOBILE NAV ─────────────────────────────────────────────────────────────
   function openNav() {
      navEl.classList.add('open')
      overlay.classList.add('open')
      document.body.style.overflow = 'hidden'
      toggle.textContent = '✕'
   }

   function closeNav() {
      navEl.classList.remove('open')
      overlay.classList.remove('open')
      document.body.style.overflow = ''
      toggle.textContent = '☰'
   }

   toggle.addEventListener('click', () =>
      navEl.classList.contains('open') ? closeNav() : openNav(),
   )
   overlay.addEventListener('click', closeNav)

   // ── ACTIVE NAV ─────────────────────────────────────────────────────────────
   function setActiveNav(page) {
      navEl.querySelectorAll('a[data-page]').forEach(a => {
         a.classList.toggle('active', a.dataset.page === page)
      })
   }

   // ── COPY BUTTONS ───────────────────────────────────────────────────────────
   function bindCopyButtons(container) {
      container.querySelectorAll('.copy-btn').forEach(btn => {
         btn.addEventListener('click', () => {
            const pre = btn.closest('.card').querySelector('pre')
            if (!pre) return
            navigator.clipboard.writeText(pre.innerText).then(() => {
               btn.textContent = 'Copiado!'
               btn.classList.add('copied')
               setTimeout(() => {
                  btn.textContent = 'Copiar'
                  btn.classList.remove('copied')
               }, 1800)
            })
         })
      })
   }

   // ── SCROLL SPY ─────────────────────────────────────────────────────────────
   let spy = null

   function initScrollSpy() {
      if (spy) spy.disconnect()

      const sections = mainEl.querySelectorAll('h2.section[id]')
      const navLinks = navEl.querySelectorAll('a[data-anchor]')
      if (!sections.length || !navLinks.length) return

      spy = new IntersectionObserver(
         entries => {
            entries.forEach(e => {
               if (e.isIntersecting) {
                  navLinks.forEach(l => l.classList.remove('active'))
                  const match = navEl.querySelector(
                     `a[data-anchor="${e.target.id}"]`,
                  )
                  if (match) match.classList.add('active')
               }
            })
         },
         { rootMargin: '-15% 0px -70% 0px' },
      )

      sections.forEach(s => spy.observe(s))
   }

   // ── LOAD PAGE ──────────────────────────────────────────────────────────────
   async function loadPage(page, anchor) {
      if (!PAGES[page]) page = DEFAULT_PAGE
      if (currentPage === page && !anchor) return

      currentPage = page
      setActiveNav(page)

      if (anchor) {
         const el = mainEl.querySelector(`#${anchor}`)
         if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
         }
      }

      mainEl.innerHTML = '<div class="page-loading">Carregando</div>'
      window.scrollTo({ top: 0 })

      if (!cache[page]) {
         try {
            const res = await fetch(PAGES[page])
            if (!res.ok) throw new Error(res.status)
            cache[page] = await res.text()
         } catch {
            mainEl.innerHTML =
               '<p style="color:var(--text-3);padding:40px 0">Não foi possível carregar esta página.</p>'
            return
         }
      }

      mainEl.innerHTML = cache[page]
      bindCopyButtons(mainEl)
      initScrollSpy()

      if (anchor) {
         requestAnimationFrame(() => {
            const el = mainEl.querySelector(`#${anchor}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
         })
      }

      if (window.innerWidth <= 768) closeNav()
   }

   // ── ROUTING ────────────────────────────────────────────────────────────────
   function parseHash() {
      const raw = location.hash.replace('#', '')
      if (!raw) return { page: DEFAULT_PAGE, anchor: null }

      if (PAGES[raw]) return { page: raw, anchor: null }

      for (const [p] of Object.entries(PAGES)) {
         if (raw.startsWith(p + '/')) {
            return { page: p, anchor: raw.slice(p.length + 1) }
         }
      }

      return { page: DEFAULT_PAGE, anchor: raw }
   }

   window.addEventListener('hashchange', () => {
      const { page, anchor } = parseHash()
      loadPage(page, anchor)
   })

   // ── NAV CLICKS ─────────────────────────────────────────────────────────────
   navEl.addEventListener('click', e => {
      const a = e.target.closest('a[data-page]')
      if (!a) return
      e.preventDefault()
      const page = a.dataset.page
      const anchor = a.dataset.anchor || null
      history.pushState(null, '', anchor ? `#${page}/${anchor}` : `#${page}`)
      loadPage(page, anchor)
   })

   // ── INIT ───────────────────────────────────────────────────────────────────
   const { page, anchor } = parseHash()
   loadPage(page, anchor)
})()
