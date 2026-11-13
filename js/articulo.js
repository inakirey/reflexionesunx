import {
  $, esc, datos, cargarImagenes, img, imgSrc, media, credito, fechaLarga, chipNovedad,
  minutosLectura, botonesCompartir, tarjetaArticulo, observarRevelado, errorCarga, iniciarComun,
  config, aplicarRequisitos
} from './comun.js';

iniciarComun();

// Cada tipo de bloque del cuerpo del artículo (campo "t" en articulos.json)
const BLOQUES = {
  p: b => `<p>${esc(b.texto)}</p>`,
  h2: b => `<h2>${esc(b.texto)}</h2>`,
  cita: b => `
    <blockquote class="cita-grande revelar">
      <p>«${esc(b.texto)}»</p>
      ${b.autor ? `<cite>— ${esc(b.autor)}</cite>` : ''}
    </blockquote>`,
  img: b => `
    <figure class="${b.ancho === 'sangre' ? 'sangre' : ''} revelar">
      ${media(b.img, { sizes: b.ancho === 'sangre' ? '100vw' : '(min-width: 720px) 42rem, 100vw' })}
      <figcaption><span>${esc(b.pie || '')}</span>${credito(b.img)}</figcaption>
    </figure>`,
  euskera: b => `
    <aside class="euskera revelar" aria-label="Palabra en euskera">
      <span class="euskera__icono" aria-hidden="true">🍇</span>
      <div>
        <span class="euskera__etiqueta">Hitza · en euskera</span>
        <span class="euskera__palabra" lang="eu">${esc(b.palabra)}</span>
        <p>${esc(b.significado)}</p>
      </div>
    </aside>`
};

function ponerMeta(selector, valor) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', valor);
}

async function iniciar() {
  const cont = $('#articulo');
  let articulos;
  try {
    [articulos] = await Promise.all([datos('articulos'), cargarImagenes()]);
  } catch (e) { errorCarga(cont, e); return; }

  const cfg = await config().catch(() => ({ disp: {}, ejemplos: false }));
  aplicarRequisitos(cfg.disp);

  articulos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const slug = new URLSearchParams(location.search).get('a');
  const i = articulos.findIndex(a => a.slug === slug);
  if (i === -1) {
    cont.innerHTML = `<div class="contenedor seccion"><h1>Historia no encontrada</h1><p><a href="index.html#historias">Ver todas las historias</a></p></div>`;
    return;
  }
  const a = articulos[i];

  document.title = `${a.titulo} · Reflexiones en San Martín de Unx`;
  ponerMeta('meta[name="description"]', a.subtitulo);
  ponerMeta('meta[property="og:title"]', a.titulo);
  ponerMeta('meta[property="og:description"]', a.subtitulo);
  ponerMeta('meta[property="og:image"]', imgSrc(a.portada, 1280));

  // "Continúa leyendo": el siguiente más antiguo (o el más reciente si es el último)
  const siguiente = articulos[(i + 1) % articulos.length];
  const relacionados = articulos
    .filter(x => x !== a && x !== siguiente)
    .map(x => ({ x, comun: x.etiquetas.filter(t => a.etiquetas.includes(t)).length }))
    .sort((p, q) => q.comun - p.comun)
    .slice(0, 3)
    .map(r => r.x);

  cont.innerHTML = `
    <header class="articulo-hero">
      <div data-img="${esc(a.portada)}">${img(a.portada, { eager: true, ancho: 1920 })}</div>
      <div class="articulo-hero__texto">
        <p class="antetitulo">${esc(a.categoria)}</p>
        <h1>${esc(a.titulo)}</h1>
        <p class="articulo-hero__sub">${esc(a.subtitulo)}</p>
        <div class="articulo-meta">
          ${chipNovedad(a.fecha)}
          <span>${fechaLarga(a.fecha)}</span>
          <span>${minutosLectura(a)} min de lectura</span>
          <span>Por Iñaki Rey</span>
        </div>
      </div>
    </header>
    

    <article class="articulo">
      <div class="prosa">
        ${a.cuerpo.map(b => (BLOQUES[b.t] || (() => ''))(b)).join('')}
      </div>

      <section class="compartir" aria-labelledby="compartir-titulo">
        <h2 id="compartir-titulo">Que esta historia llegue lejos</h2>
        <div class="compartir__botones">${botonesCompartir(a.titulo, location.href)}</div>
        <div class="etiquetas">${a.etiquetas.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}</div>
      </section>
    </article>

    <a class="continua" href="articulo.html?a=${encodeURIComponent(siguiente.slug)}">
      ${media(siguiente.portada, { sizes: '(min-width: 760px) 50vw, 100vw' })}
      <div class="continua__txt">
        <p class="antetitulo">Continúa leyendo</p>
        <h2>${esc(siguiente.titulo)}</h2>
        <p>${esc(siguiente.subtitulo)}</p>
      </div>
    </a>

    ${relacionados.length ? `
    <section class="seccion" aria-labelledby="rel-titulo">
      <div class="contenedor">
        <header class="seccion__cabecera">
          <p class="antetitulo">Historias que no te puedes perder</p>
          <h2 id="rel-titulo">Sigue paseando por San Martín</h2>
        </header>
        <div class="relacionados">${relacionados.map(r => tarjetaArticulo(r, { ejemplos: cfg.ejemplos })).join('')}</div>
      </div>
    </section>` : ''}`;

  observarRevelado(cont);
}

iniciar();
