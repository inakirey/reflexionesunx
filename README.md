# Reflexiones en San Martín de Unx

Blog estático (HTML + CSS + JavaScript, sin instalar nada) con reflexiones, testimonios, tradiciones y memoria de San Martín de Unx, en la Zona Media de Navarra, escrito por Iñaki Rey.

## Estructura

```
ReflexionesUnx/
├── index.html          Portada: hero, palabra del día, historias, testimonios, actividades,
│                       mapa, diario, galería, quién es Iñaki, implícate
├── articulo.html       Plantilla de artículo (articulo.html?a=slug-del-articulo)
├── css/estilos.css     Todo el diseño (colores al principio, en :root; modo oscuro incluido)
├── js/comun.js         Utilidades: imágenes, tema, menú, racha, compartir…
├── js/portada.js       Lógica de la portada
├── js/articulo.js      Lógica de la página de artículo
├── img/                Aquí van tus fotos propias
└── data/               ← EL CONTENIDO. Solo hay que tocar estos archivos
    ├── articulos.json    Historias y reflexiones
    ├── testimonios.json  Tarjetas de testimonios
    ├── frases.json       Palabra o reflexión del día (cambia sola cada día)
    ├── diario.json       Diario de Iñaki
    ├── actividades.json  Grandes citas del año + línea del tiempo
    ├── lugares.json      Puntos del mapa (coordenadas de OpenStreetMap)
    ├── galeria.json      Fotos de la galería
    ├── imagenes.json     Catálogo de todas las fotos (con autor y licencia)
    └── sitio.json        Correo, WhatsApp, Telegram, boletín
```

## Verlo en tu ordenador

El blog lee archivos JSON, así que **no funciona con doble clic** (`file://`). Hay que abrirlo desde un servidor:

1. Abre el panel de XAMPP y pulsa **Start** en *Apache*.
2. Ve a <http://localhost/MisProyectos/ReflexionesUnx/>.

## Publicar una entrada nueva

1. Abre `data/articulos.json` y copia un artículo entero (desde `{` hasta `}`).
2. Pégalo al principio de la lista, separado del siguiente por una coma, y cambia:
   - `slug`: identificador único sin espacios ni tildes (por ejemplo `la-vendimia-de-2026`). Es lo que aparece en el enlace.
   - `titulo`, `subtitulo`, `fecha` (`AAAA-MM-DD`), `categoria`, `etiquetas`.
   - `portada`: el identificador de una foto de `imagenes.json`.
   - `ejemplo`: pon `false`, o borra la línea, para quitar el aviso de "ejemplo".
3. Escribe el `cuerpo` con estos bloques, en el orden que quieras:

   | Bloque | Ejemplo |
   |---|---|
   | Párrafo | `{ "t": "p", "texto": "..." }` |
   | Subtítulo | `{ "t": "h2", "texto": "..." }` |
   | Cita grande | `{ "t": "cita", "texto": "...", "autor": "Nombre (con su permiso)" }` |
   | Foto | `{ "t": "img", "img": "cripta-naves", "pie": "..." }` |
   | Foto a pantalla completa | `{ "t": "img", "img": "cripta-naves", "pie": "...", "ancho": "sangre" }` |
   | Palabra en euskera | `{ "t": "euskera", "palabra": "Auzolan", "significado": "Trabajo vecinal" }` |

4. Guarda el archivo. La entrada aparece arriba en la portada, con la etiqueta **"Nuevo hoy"** si la fecha es la de hoy (o **"Nuevo"** durante 3 días).

> Si el blog deja de cargar después de editar, casi siempre falta o sobra una coma. Pega el archivo en <https://jsonlint.com> para encontrar el error.

Los testimonios, el diario, las frases, las actividades, los lugares del mapa y la galería funcionan igual: copia una entrada, pégala y cámbiala.

## Añadir tus fotos

En Wikimedia Commons hay buenas fotos del pueblo (calles, iglesias, cripta), pero casi ninguna de **sus campos en cada estación, de sus fiestas o de su gente**. Esas tendrán que ser tuyas, y son las que harán único el blog.

1. Copia la foto en `img/` (por ejemplo `img/almendros-marzo.jpg`). Conviene que pese menos de 400 KB: puedes reducirla en <https://squoosh.app>.
2. En `data/imagenes.json` añade una entrada:
   ```json
   "almendros-marzo": {
     "local": "img/almendros-marzo.jpg",
     "alt": "Almendros en flor en los campos de San Martín de Unx",
     "autor": "Iñaki Rey"
   }
   ```
3. Usa `almendros-marzo` en cualquier artículo, testimonio o en `galeria.json`.
4. Para tu retrato de "Quién es Iñaki", añade `"local": "img/inaki.jpg"` a la entrada `inaki-provisional`. Hay más huecos marcados como `FOTO PROPIA` en `index.html`.

Con fotos de personas, sobre todo de menores, pide siempre permiso.

## Conectar el boletín (Mailchimp o Brevo)

1. En Mailchimp: *Audience → Signup forms → Embedded forms*. Copia la URL del `action="..."` del formulario.
   En Brevo: *Contactos → Formularios*. Copia la URL de envío.
2. Pégala en `data/sitio.json`, en `"boletin_action"`.
3. En ese mismo archivo, sustituye los marcadores `SUSTITUIR` por tu correo de contacto y por los enlaces de tus canales de WhatsApp y Telegram.

## Subirlo a internet gratis

### Opción A · Netlify Drop (la más fácil)
1. Entra en <https://app.netlify.com/drop> y crea una cuenta gratuita.
2. Arrastra la carpeta `ReflexionesUnx` entera a la página.
3. En unos segundos tendrás una dirección del tipo `https://nombre.netlify.app`. Puedes cambiarla en *Site settings → Change site name* (por ejemplo `reflexiones-unx`).
4. Para publicar cambios: *Deploys* → arrastra de nuevo la carpeta.

### Opción B · GitHub Pages
1. Crea un repositorio en GitHub y sube el contenido de la carpeta (*Add file → Upload files*).
2. Ve a *Settings → Pages → Branch: main → Save*.
3. La web estará en `https://tu-usuario.github.io/nombre-repo/`. A partir de ahí, para publicar una entrada basta con editar `data/articulos.json` en la propia web de GitHub (icono del lápiz) y guardar.

### Opción C · Vercel
Crea una cuenta en <https://vercel.com>, elige *Add New → Project*, importa el repositorio de GitHub y pulsa *Deploy*.

Cuando tengas la dirección definitiva, ponla en `data/sitio.json` (`"url"`).

## Antes de publicar: revisar
- Todo el contenido marcado como **[EJEMPLO]**: los 3 artículos, los 6 testimonios y el diario son textos de muestra. Las citas **no** son de personas reales.
- Los datos del pueblo vienen de la Wikipedia: 352 habitantes (INE 2025), bodega cooperativa de 1914, Día del Rosado el primer domingo de junio, fiestas el primer martes de agosto, fiestas pequeñas por San Martín, romería de Santa Zita el último sábado de abril y primera mención como «Vnsi» en 1062. Conviene que los revise alguien del pueblo.
- La bodega cooperativa no aparece en OpenStreetMap, así que no está en el mapa. Puedes añadirla a `lugares.json` con sus coordenadas: en Google Maps, clic derecho sobre el sitio y copiar los números.
- Las fotos de viñedos de Elvillar (Rioja Alavesa) y el rosado con el palacio de Olite son imágenes ilustrativas de la zona, no del pueblo. Ve sustituyéndolas por las tuyas.

## Notas técnicas
- Las fotos se cargan desde Wikimedia Commons (licencias CC y dominio público). El crédito aparece en cada foto y en el pie de página, como exigen las licencias.
- Al compartir un artículo en WhatsApp, la vista previa muestra la imagen y el título generales del blog, porque WhatsApp no ejecuta JavaScript.
- La racha de visitas se guarda en el navegador de cada lector (`localStorage`): no hace falta servidor ni base de datos.
