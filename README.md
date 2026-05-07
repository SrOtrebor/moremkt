# MoreMKT - Landing Page "Próximamente"

Esta es la página web de aterrizaje (Landing Page) en modo "Próximamente" para **MoreMKT** (Estrategia de Paid Media y Performance).
Existen dos versiones visuales del diseño para comparación y elección de la clienta.

## 🚀 Tecnologías Utilizadas

- **HTML5:** Estructura semántica del contenido.
- **CSS3 Vainilla:** Estilos personalizados, gradientes y animaciones avanzadas (sin frameworks externos para asegurar máximo rendimiento y compatibilidad).
- **Google Fonts:**
  - `Outfit` para los títulos principales (look moderno).
  - `Inter` para los textos de lectura (alta legibilidad).
- **Phosphor Icons:** Para la iconografía minimalista y moderna de los botones de contacto.

## 📂 Estructura de Archivos

- `index.html`: Versión principal — fondo violeta/púrpura con acento amarillo dorado.
- `style.css`: Estilos de la versión violeta.
- `index-dark.html`: Versión alternativa — fondo carbón oscuro con acento naranja dorado (inspirada en el dorso de la tarjeta de presentación).
- `style-dark.css`: Estilos de la versión carbón.
- `SVG/`: Directorio que contiene los recursos gráficos de la marca.
  - `logo-amari.svg`: El logotipo principal en color amarillo (usado en ambas versiones).
  - `logo-full.svg`: Versión completa del logotipo.
  - `iso.svg`: El isotipo utilizado como icono de la pestaña del navegador (Favicon).

## 🎨 Características de la Interfaz (ambas versiones)

1. **Fondo Inmersivo:** Gradiente radial que oscurece los bordes y resalta el logo en el centro.
2. **Animaciones Dinámicas:**
   - **SlideUp & Fade:** Los textos y botones entran deslizando hacia arriba en cascada al cargar la web.
   - **Flotación:** El logotipo principal tiene un movimiento sutil de flotación continua.
   - **Hover effects:** Los botones de contacto tienen efectos estilo *glassmorphism* que se iluminan al pasar el cursor.
   - **Esquinas decorativas:** Bordes asimétricos que aparecen suavemente simulando el marco del diseño.
3. **Contactos Directos:**
   - Enlace configurado para enviar un mensaje directo a WhatsApp al número `11 7642-6155`.
   - Enlace `mailto:` configurado hacia `hola@morehdmkt.com`.

## 🖌️ Diferencias entre versiones

| | Versión Violeta (`index.html`) | Versión Carbón (`index-dark.html`) |
|---|---|---|
| **Fondo** | Púrpura oscuro `#4c2c5c → #23122c` | Carbón oscuro `#3a3a3a → #1a1a1a` |
| **Acento** | Amarillo dorado `#f6c039` | Naranja dorado `#e07b2a` |
| **Inspiración** | Identidad visual de marca | Dorso tarjeta de presentación |
| **Logo** | `logo-amari.svg` | `logo-amari.svg` |

## 🛠️ Cómo visualizar y editar el sitio

- **Para ver la versión violeta:** Doble clic en `index.html`.
- **Para ver la versión carbón:** Doble clic en `index-dark.html`.
- **Para modificar un texto:** Abrí el archivo `.html` correspondiente, buscá el texto y guardá.
- **Para cambiar los colores:** Abrí `style.css` o `style-dark.css` y modificá las variables bajo `:root` (ej. `--accent-color`, `--bg-color-center`).
