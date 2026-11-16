import {
  $, $$, esc, datos, cargarImagenes, img, imgSrc, media, credito, pintarImagenesEstaticas, listaCreditos,
  diaDelAnio, fechaLarga, registrarVisita, observarRevelado, avisar, compartir,
  tarjetaArticulo, errorCarga, iniciarComun, config, aplicarRequisitos
} from './comun.js';

iniciarComun();

const ETIQUETA_FRASE = { euskera: 'Hitza · palabra en euskera', refran: 'Dicho de la tierra', cita: 'Para pensar hoy', reflexion: 'Reflexión del día' };

async function iniciar() {
  try {
    await cargarImagenes();
  } catch (e) {
    errorCarga($('#contenido'), e);
    return;
  }
  pintarImagenesEstaticas();
  listaCreditos($('#lista-creditos'));

  // Interruptores de data/sitio.json; si no carga, todo lo opcional queda oculto.
  const cfg = await config().catch(() => ({ disp: {}, ejemplos: false, racha: false }));
  aplicarRequisitos(cfg.disp);
  if (cfg.racha) mostrarRacha();

  const tareas = [
    pintarHoy(), pintarArticulos(cfg), pintarTestimonios(cfg), pintarLuchas(),
    pintarMapa(), pintarDiario(cfg), pintarGaleria(), configurarImplicate(cfg)
  ];
  await Promise.allSettled(tareas);
  observarRevelado();
  iniciarContadores();
}

/* ---------- Racha ---------- */
function mostrarRacha() {
  const r = registrarVisita();
  const el = $('#racha');
  if (!r || !el) return;
  const texto = r.racha > 1
    ? `Llevas <strong>${r.racha} días seguidos</strong> acompañando a San Martín de Unx`
    : r.total > 1
      ? `Has acompañado a San Martín de Unx <strong>${r.total} días</strong>. ¡Vuelve mañana!`
      : 'Bienvenida, bienvenido. <strong>Vuelve mañana</strong> y empieza tu racha';
  el.innerHTML = `<span class="racha__fuego" aria-hidden="true">🔥</span><span>${texto}</span>`;
  el.hidden = false;
}

/* ---------- Palabra y testimonio del día ---------- */
async function pintarHoy() {
  const [frases, testimonios] = await Promise.all([datos('frases'), datos('testimonios')]);
  const dia = diaDelAnio();
  const f = frases[dia % frases.length];
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#palabra-dia').innerHTML = `
    <div class="tarjeta-dia__etiqueta"><span>${ETIQUETA_FRASE[f.tipo] || 'Hoy'}</span><span>${hoy}</span></div>
    <p class="tarjeta-dia__texto ${f.texto.length > 60 ? 'tarjeta-dia__texto--largo' : ''}">${f.tipo === 'cita' ? '«' + esc(f.texto) + '»' : esc(f.texto)}</p>
    <p class="tarjeta-dia__detalle">${esc(f.detalle)}</p>`;

  const t = testimonios[dia % testimonios.length];
  const el = $('#testimonio-dia');
  el.innerHTML = `
    ${media(t.img, { sizes: '(min-width: 860px) 60vw, 100vw' })}
    <div class="tarjeta-testimonio-dia__txt">
      <div class="tarjeta-dia__etiqueta">Testimonio del día</div>
      <blockquote>«${esc(t.cita)}»</blockquote>
      <p class="quien">${esc(t.quien)}<small>${esc(t.lugar)}${t.ejemplo ? '' : ''}</small></p>
    </div>`;
}

/* ---------- Artículos ---------- */
async function pintarArticulos(cfg) {
  const cont = $('#lista-articulos');
  try {
    const articulos = (await datos('articulos')).sort((a, b) => b.fecha.localeCompare(a.fecha));
    cont.innerHTML = articulos.map((a, i) => tarjetaArticulo(a, { grande: i === 0, ejemplos: cfg.ejemplos })).join('');
    const n = $('#n-historias');
    n.dataset.contar = articulos.length;
  } catch (e) { errorCarga(cont, e); }
}

/* ---------- Testimonios con filtros ---------- */
async function pintarTestimonios(cfg) {
  const cont = $('#lista-testimonios');
  const testimonios = await datos('testimonios');
  $('#n-testimonios').dataset.contar = testimonios.length;

  cont.innerHTML = testimonios.map(t => `
    <article class="testimonio revelar" data-temas="${t.temas.join(' ')}">
      ${media(t.img, { sizes: '(min-width: 1000px) 33vw, (min-width: 700px) 50vw, 100vw' })}
      <div class="testimonio__cuerpo">
        <span class="testimonio__comillas" aria-hidden="true">“</span>
        <blockquote>${esc(t.cita)}</blockquote>
        <div class="testimonio__pie">
          <p class="quien">${esc(t.quien)}<small>${esc(t.lugar)}</small></p>
          <div class="testimonio__temas">${t.temas.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>
        </div>
        ${t.ejemplo && cfg.ejemplos ? '<span class="aviso-ejemplo">[EJEMPLO – sustituir por testimonio real]</span>' : ''}
      </div>
    </article>`).join('');

  const temas = ['todos', ...new Set(testimonios.flatMap(t => t.temas))];
  crearFiltros($('#filtros-testimonios'), temas, tema => {
    $$('.testimonio', cont).forEach(el => {
      el.hidden = tema !== 'todos' && !el.dataset.temas.split(' ').includes(tema);
    });
  });
}

function crearFiltros(cont, opciones, alCambiar) {
  cont.innerHTML = opciones.map((o, i) =>
    `<button class="filtro" type="button" aria-pressed="${i === 0}" data-valor="${esc(o)}">${o === 'todos' ? 'Todos' : esc(o[0].toUpperCase() + o.slice(1))}</button>`
  ).join('');
  cont.addEventListener('click', e => {
    const b = e.target.closest('.filtro');
    if (!b) return;
    $$('.filtro', cont).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    alCambiar(b.dataset.valor);
  });
}

/* ---------- Luchas: frentes y línea del tiempo ---------- */
async function pintarLuchas() {
  const { frentes, hitos } = await datos('actividades');
  $('#frentes').innerHTML = frentes.map((f, i) => {
    const cuerpo = `
      ${media(f.img, { sizes: '(min-width: 860px) 33vw, 100vw' })}
      <div class="frente__cuerpo">
        <span class="frente__num">0${i + 1}</span>
        <h3>${esc(f.titulo)}</h3>
        <p>${esc(f.texto)}</p>
        ${f.enlace ? '<span class="frente__mas">Leer la historia <span aria-hidden="true">→</span></span>' : ''}
      </div>`;
    return f.enlace
      ? `<a class="frente revelar" href="articulo.html?a=${encodeURIComponent(f.enlace)}">${cuerpo}</a>`
      : `<article class="frente revelar">${cuerpo}</article>`;
  }).join('');

  const linea = $('#linea');
  linea.innerHTML = hitos.map(h => `
    <li class="hito revelar" data-cat="${esc(h.categoria)}">
      <span class="hito__anio">${esc(h.anio)}</span>
      <span class="hito__cat">${esc(h.categoria)}</span>
      <h4>${esc(h.titulo)}</h4>
      <p>${esc(h.texto)}</p>
      ${h.img ? `<div class="hito__img">${img(h.img, { sizes: '360px', ancho: 960 })}</div>` : ''}
      ${h.enlace ? `<br><a class="hito__enlace" href="articulo.html?a=${encodeURIComponent(h.enlace)}">Leer la historia →</a>` : ''}
    </li>`).join('');

  crearFiltros($('#filtros-linea'), ['todos', ...new Set(hitos.map(h => h.categoria))], cat => {
    $$('.hito', linea).forEach(el => { el.hidden = cat !== 'todos' && el.dataset.cat !== cat; });
    actualizarLinea();
  });

  // la línea se va "llenando" de color según avanzas
  function actualizarLinea() {
    const r = linea.getBoundingClientRect();
    const avance = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    linea.style.setProperty('--avance', `${avance * 100}%`);
  }
  addEventListener('scroll', () => requestAnimationFrame(actualizarLinea), { passive: true });
  actualizarLinea();
}

/* ---------- Mapa ---------- */
async function pintarMapa() {
  const cont = $('#mapa-leaflet');
  if (!window.L) { cont.innerHTML = '<p class="error-carga">No se pudo cargar el mapa.</p>'; return; }
  const lugares = await datos('lugares');
  const mapa = L.map(cont, { scrollWheelZoom: false }).setView([42.5186, -1.5637], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);
  mapa.on('click', () => mapa.scrollWheelZoom.enable());

  const marcadores = lugares.map(l => {
    const icono = L.divIcon({ className: '', html: `<div class="marcador ${l.tipo === 'Paraje' ? 'marcador--territorio' : ''}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
    return L.marker([l.lat, l.lng], { icon: icono, title: l.nombre, alt: l.nombre }).addTo(mapa).bindPopup(`
      <div class="popup">
        <small>${esc(l.tipo)}</small>
        <h4>${esc(l.nombre)}</h4>
        <p>${esc(l.texto)}</p>
        ${l.enlace ? `<a href="articulo.html?a=${encodeURIComponent(l.enlace)}">Leer su historia →</a>` : ''}
      </div>`);
  });

  mapa.fitBounds(L.featureGroup(marcadores).getBounds(), { padding: [30, 30] });

  $('#mapa-lista').innerHTML = lugares.map((l, i) => `<li><button type="button" data-i="${i}">${esc(l.nombre)}</button></li>`).join('');
  $('#mapa-lista').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const m = marcadores[b.dataset.i];
    mapa.flyTo(m.getLatLng(), 10, { duration: 1.2 });
    m.openPopup();
  });
}

/* ---------- Diario ---------- */
async function pintarDiario(cfg) {
  // Las entradas con "ejemplo": true solo se ven si mostrar_ejemplos está activado en sitio.json
  const entradas = (await datos('diario'))
    .filter(e => cfg.ejemplos || !e.ejemplo)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const giros = ['-1.5deg', '1deg', '-0.5deg', '1.5deg'];
  $('#lista-diario').innerHTML = entradas.map((e, i) => `
    <article class="nota revelar" style="--giro:${giros[i % giros.length]}">
      ${media(e.img, { sizes: '(min-width: 1000px) 25vw, (min-width: 600px) 50vw, 100vw', ancho: 960 })}
      <span class="nota__fecha">${fechaLarga(e.fecha)} · ${esc(e.lugar)}</span>
      <h3>${esc(e.titulo)}</h3>
      <p>${esc(e.texto)}</p>
    </article>`).join('');
}

/* ---------- Galería + lightbox ---------- */
async function pintarGaleria() {
  const fotos = await datos('galeria');
  const cont = $('#lista-galeria');
  cont.innerHTML = fotos.map((f, i) => `
    <button class="galeria__item revelar" type="button" data-i="${i}" aria-label="Ampliar: ${esc(f.pie)}">
      ${img(f.img, { sizes: '(min-width: 1100px) 25vw, (min-width: 560px) 50vw, 100vw', ancho: 960 })}
      <span>${esc(f.pie)}</span>
    </button>`).join('');

  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbPie = $('figcaption', lb);
  let actual = 0;
  let origen = null;

  const mostrar = i => {
    actual = (i + fotos.length) % fotos.length;
    const f = fotos[actual];
    lbImg.src = imgSrc(f.img, 1920);
    lbImg.alt = $(`[data-i="${actual}"] img`, cont)?.alt || f.pie;
    lbPie.innerHTML = `${esc(f.pie)} · ${actual + 1}/${fotos.length}<br>${credito(f.img)}`;
  };
  const abrir = i => { origen = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; mostrar(i); $('.lightbox__cerrar', lb).focus(); };
  const cerrar = () => { lb.hidden = true; document.body.style.overflow = ''; origen?.focus(); };

  cont.addEventListener('click', e => { const b = e.target.closest('.galeria__item'); if (b) abrir(+b.dataset.i); });
  $('.lightbox__cerrar', lb).addEventListener('click', cerrar);
  $('.lightbox__nav--ant', lb).addEventListener('click', () => mostrar(actual - 1));
  $('.lightbox__nav--sig', lb).addEventListener('click', () => mostrar(actual + 1));
  lb.addEventListener('click', e => { if (e.target === lb) cerrar(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'ArrowLeft') mostrar(actual - 1);
    if (e.key === 'ArrowRight') mostrar(actual + 1);
    if (e.key === 'Tab') { // mantener el foco dentro del visor
      const focos = $$('button', lb);
      const idx = focos.indexOf(document.activeElement);
      e.preventDefault();
      focos[(idx + (e.shiftKey ? -1 : 1) + focos.length) % focos.length].focus();
    }
  });
  // deslizar en el móvil
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

/* ---------- Implícate ---------- */
async function configurarImplicate(s) {
  if (s.disp.whatsapp) $('#link-whatsapp').href = s.whatsapp;
  if (s.disp.telegram) $('#link-telegram').href = s.telegram;
  if (s.disp.email) $('#link-email').href = `mailto:${s.email}`;
  $('#btn-compartir-sitio').addEventListener('click', () => compartir('Reflexiones en San Martín de Unx', location.origin + location.pathname));

  const form = $('#form-boletin');
  const msg = $('.boletin__msg', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.EMAIL.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Escribe un correo válido, por favor.'; form.EMAIL.focus(); return; }
    if (!s.boletin_action) { msg.textContent = '¡Gracias! (Modo de prueba: conecta Mailchimp o Brevo en data/sitio.json).'; form.reset(); return; }
    try {
      await fetch(s.boletin_action, { method: 'POST', mode: 'no-cors', body: new FormData(form) });
      msg.textContent = '¡Gracias! Revisa tu correo para confirmar la suscripción.';
      form.reset();
    } catch {
      msg.textContent = 'No se pudo enviar. Inténtalo de nuevo más tarde.';
    }
  });
}

/* ---------- Contadores animados ---------- */
function iniciarContadores() {
  const els = $$('[data-contar]');
  const animar = el => {
    const fin = +el.dataset.contar;
    const suf = el.dataset.sufijo || '';
    const t0 = performance.now();
    const paso = t => {
      const p = Math.min(1, (t - t0) / 1600);
      el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(animar); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { animar(e.target); io.unobserve(e.target); } }), { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

iniciar();
