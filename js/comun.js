// Utilidades compartidas por la portada y la página de artículo.

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function esc(texto = '') {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Datos (JSON en /data) ---------- */
const cache = {};
export function datos(nombre) {
  if (!cache[nombre]) {
    cache[nombre] = fetch(`data/${nombre}.json`).then(r => {
      if (!r.ok) throw new Error(`No se pudo cargar data/${nombre}.json`);
      return r.json();
    });
  }
  return cache[nombre];
}

/* ---------- Imágenes ---------- */
let IMGS = {};
const ANCHOS = [500, 960, 1920]; // tamaños estándar de miniatura de Wikimedia

export async function cargarImagenes() {
  IMGS = await datos('imagenes');
  return IMGS;
}

function urlCommons(archivo, ancho) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(archivo)}?width=${ancho}`;
}

export function imgSrc(id, ancho = 1280) {
  const i = IMGS[id];
  if (!i) return '';
  return i.local || urlCommons(i.archivo, ancho);
}

export function img(id, { sizes = '100vw', eager = false, ancho = 1280 } = {}) {
  const i = IMGS[id];
  if (!i) return '';
  const srcset = i.local ? '' : ANCHOS.map(w => `${urlCommons(i.archivo, w)} ${w}w`).join(', ');
  return `<img src="${imgSrc(id, ancho)}"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ''} alt="${esc(i.alt)}"${i.foco ? ` style="object-position:${esc(i.foco)}"` : ''} loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
}

export function media(id, opciones) {
  return `<div class="media">${img(id, opciones)}</div>`;
}

export function credito(id) {
  const i = IMGS[id];
  if (!i) return '';
  if (i.propia && !i.local) return '<span class="credito credito--propia">Foto provisional · sustituir por foto propia</span>';
  if (i.local) return `<span class="credito">Foto: ${esc(i.autor || 'Iñaki Rey')}</span>`;
  const pagina = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(i.archivo.replace(/ /g, '_'))}`;
  return `<a class="credito" href="${pagina}" target="_blank" rel="noopener">Foto: ${esc(i.autor)} · ${esc(i.licencia)} · Wikimedia Commons</a>`;
}

// Rellena los elementos con data-img="id" y data-credito="id" del HTML estático.
export function pintarImagenesEstaticas() {
  $$('[data-img]').forEach(el => {
    if (!el.querySelector('img')) el.innerHTML = img(el.dataset.img, { eager: el.hasAttribute('data-eager'), ancho: 1920 });
  });
  $$('[data-credito]').forEach(el => { el.innerHTML = credito(el.dataset.credito); });
}

export function listaCreditos(el) {
  if (!el) return;
  el.innerHTML = Object.keys(IMGS)
    .filter(id => !IMGS[id].propia)
    .map(id => `<li>${esc(IMGS[id].alt)} — ${credito(id)}</li>`)
    .join('');
}

/* ---------- Fechas ---------- */
export function hoyISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function diasDesde(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((hoy - new Date(a, m - 1, d)) / 86400000);
}

export function diaDelAnio(d = new Date()) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

export function fechaLarga(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function chipNovedad(fechaISO) {
  const dias = diasDesde(fechaISO);
  if (dias === 0) return '<span class="chip chip--nuevo">Nuevo hoy</span>';
  if (dias > 0 && dias <= 3) return '<span class="chip chip--nuevo">Nuevo</span>';
  return '';
}

/* ---------- Racha de visitas ---------- */
export function registrarVisita() {
  const hoy = hoyISO();
  const ayer = hoyISO(new Date(Date.now() - 86400000));
  try {
    const d = JSON.parse(localStorage.getItem('vo-racha') || '{}');
    if (d.ultima !== hoy) {
      d.racha = d.ultima === ayer ? (d.racha || 0) + 1 : 1;
      d.total = (d.total || 0) + 1;
      d.ultima = hoy;
      localStorage.setItem('vo-racha', JSON.stringify(d));
    }
    return d;
  } catch {
    return null;
  }
}

/* ---------- Tema claro / oscuro ---------- */
function iniciarTema() {
  const raiz = document.documentElement;
  try {
    const guardado = localStorage.getItem('vo-tema');
    if (guardado) raiz.dataset.theme = guardado;
  } catch { /* sin almacenamiento */ }
  $('#btn-tema')?.addEventListener('click', () => {
    const oscuroAhora = raiz.dataset.theme
      ? raiz.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    raiz.dataset.theme = oscuroAhora ? 'light' : 'dark';
    try { localStorage.setItem('vo-tema', raiz.dataset.theme); } catch { /* sin almacenamiento */ }
  });
}

/* ---------- Cabecera, menú y progreso de lectura ---------- */
function iniciarCabecera() {
  const cab = $('#cabecera');
  const barra = $('.progreso span');
  const alScroll = () => {
    cab?.classList.toggle('es-solida', scrollY > 60);
    if (barra) {
      const max = document.documentElement.scrollHeight - innerHeight;
      barra.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    }
  };
  addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  const btn = $('#btn-menu');
  const menu = $('#menu');
  const cerrar = () => { menu.classList.remove('abierto'); btn.setAttribute('aria-expanded', 'false'); };
  btn?.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    btn.setAttribute('aria-expanded', String(abierto));
    if (abierto) cab.classList.add('es-solida');
  });
  $$('a', menu).forEach(a => a.addEventListener('click', cerrar));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.classList.contains('abierto')) { cerrar(); btn.focus(); } });
}

/* ---------- Animaciones al hacer scroll ---------- */
let observador;
export function observarRevelado(ctx = document) {
  if (!('IntersectionObserver' in window)) { $$('.revelar', ctx).forEach(el => el.classList.add('visto')); return; }
  observador ??= new IntersectionObserver(entradas => {
    entradas.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); observador.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.revelar:not(.visto)', ctx).forEach(el => observador.observe(el));
}

function iniciarParallax() {
  const capas = $$('.parallax');
  if (!capas.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const mover = () => capas.forEach(c => {
    const r = c.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    c.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * -0.15}px, 0)`;
  });
  addEventListener('scroll', () => requestAnimationFrame(mover), { passive: true });
  mover();
}

/* ---------- Aviso flotante ---------- */
let temporizador;
export function avisar(texto) {
  const el = $('#aviso');
  if (!el) return;
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => el.classList.remove('visible'), 3200);
}

/* ---------- Compartir ---------- */
export async function compartir(titulo, url = location.href) {
  if (navigator.share) {
    try { await navigator.share({ title: titulo, url }); return; } catch { /* cancelado */ }
  }
  try { await navigator.clipboard.writeText(url); avisar('Enlace copiado. ¡Compártelo!'); }
  catch { avisar(url); }
}

export function botonesCompartir(titulo, url) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titulo);
  return `
    <a class="c-whatsapp" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener">WhatsApp</a>
    <a class="c-facebook" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a>
    <a class="c-x" href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener">X</a>
    <a class="c-telegram" href="https://t.me/share/url?url=${u}&text=${t}" target="_blank" rel="noopener">Telegram</a>
    <button class="c-copiar" type="button" data-copiar>Copiar enlace</button>`;
}

/* ---------- Configuración (data/sitio.json) ---------- */
// Un destino solo cuenta si está relleno y no es un marcador SUSTITUIR.
const configurado = v => typeof v === 'string' && v.trim() !== '' && !v.includes('SUSTITUIR');

export async function config() {
  const s = await datos('sitio');
  const ejemplos = s.mostrar_ejemplos === true;
  const diario = await datos('diario').catch(() => []);
  const disp = {
    boletin: configurado(s.boletin_action),
    whatsapp: configurado(s.whatsapp),
    telegram: configurado(s.telegram),
    email: configurado(s.email),
    diario: diario.some(e => ejemplos || !e.ejemplo)
  };
  disp.canales = disp.whatsapp || disp.telegram;
  disp.implicate = disp.boletin || disp.canales || disp.email;
  return { ...s, disp, ejemplos, racha: s.mostrar_racha === true };
}

// Muestra u oculta los elementos marcados con data-requiere="clave" según lo disponible.
export function aplicarRequisitos(disp) {
  $$('[data-requiere]').forEach(el => { el.hidden = !disp[el.dataset.requiere]; });
}

/* ---------- Tarjeta de artículo ---------- */
export function tarjetaArticulo(a, { grande = false, ejemplos = false } = {}) {
  return `
    <a class="tarjeta ${grande ? 'tarjeta--grande' : ''} revelar" href="articulo.html?a=${encodeURIComponent(a.slug)}">
      ${media(a.portada, { sizes: grande ? '(min-width: 1000px) 66vw, 100vw' : '(min-width: 1000px) 33vw, (min-width: 680px) 50vw, 100vw' })}
      <div class="tarjeta__cuerpo">
        <div class="tarjeta__meta">
          ${chipNovedad(a.fecha)}
          <span class="chip">${esc(a.categoria)}</span>
          ${a.ejemplo && ejemplos ? '<span class="chip chip--ejemplo">Ejemplo</span>' : ''}
          <span>${fechaLarga(a.fecha)} · ${minutosLectura(a)} min</span>
        </div>
        <h3>${esc(a.titulo)}</h3>
        <p class="tarjeta__resumen">${esc(a.subtitulo)}</p>
      </div>
    </a>`;
}

export function minutosLectura(a) {
  const palabras = a.cuerpo.map(b => b.texto || b.significado || '').join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(palabras / 200));
}

/* ---------- Inicio común ---------- */
export function errorCarga(contenedor, e) {
  console.error(e);
  const enLocal = location.protocol === 'file:';
  contenedor.insertAdjacentHTML('afterbegin', `<p class="error-carga">${enLocal
    ? 'Para ver el contenido, abre el blog desde un servidor (por ejemplo, http://localhost/… con XAMPP) y no haciendo doble clic en el archivo.'
    : 'No se pudo cargar el contenido. Recarga la página en unos segundos.'}</p>`);
}

export function iniciarComun() {
  iniciarTema();
  iniciarCabecera();
  iniciarParallax();
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-copiar]')) return;
    navigator.clipboard?.writeText(location.href)
      .then(() => avisar('Enlace copiado. ¡Compártelo!'))
      .catch(() => avisar(location.href));
  });
}
