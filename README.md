# Líderes Aumentados — Plataforma del programa

Sitio simple (HTML/CSS/JS, sin build) para alojar en **GitHub Pages**: video de cada módulo (YouTube), documentación descargable, y un foro de comentarios por módulo respaldado en una Google Sheet.

No es una plataforma con seguridad de nivel corporativo, pero **cada persona entra con su propio correo y clave** (no hay una contraseña compartida). La lista de habilitados vive en tu Google Sheet privada, no en el código, y los organizadores dan de alta/baja a cada alumno desde un panel dentro de la web. Está pensada para un grupo cerrado de ~50 personas conocidas; es un nivel de seguridad "liviano pero razonable" y suficiente para este uso.

---

## 1. Subir el sitio a GitHub Pages

1. Creá un repositorio nuevo en GitHub (puede ser público o privado — con privado, GitHub Pages funciona igual si tenés plan Pro; con público, cualquiera con el link accede, aunque no lo vea listado en ningún lado).
2. Subí **todos los archivos de esta carpeta** manteniendo la estructura (`index.html`, `css/`, `js/`, `assets/`, `docs/`).
3. Andá a **Settings → Pages**.
4. En "Branch" elegí `main` y la carpeta `/ (root)`. Guardá.
5. En 1-2 minutos GitHub te va a dar una URL tipo `https://tu-usuario.github.io/tu-repo/`. Esa es la que comparten con los 50 inscriptos.

Cada vez que editen un archivo y hagan commit + push, el sitio se actualiza solo.

---

## 2. Acceso: administradores y alumnos

Ya **no hay una contraseña compartida**. Cada persona entra con **su propio correo y su clave**, y los organizadores (admins) habilitan/deshabilitan a cada alumno desde un **panel dentro de la plataforma**.

- La lista de personas habilitadas vive en la hoja **`Alumnos`** de tu Google Sheet (no en el código, así que no queda a la vista de nadie).
- Vos y Christian son filas con `rol = admin`: al entrar ven la sección **Administración → Gestión de alumnos**, donde agregan, habilitan, deshabilitan o eliminan personas y les asignan la clave.
- Un alumno deshabilitado no puede entrar, aunque sepa su clave.

Todo esto depende de la configuración del backend (paso 5). El primer admin se carga a mano en la planilla una única vez (ver paso 5-B); de ahí en adelante se gestiona todo desde la web.

---

## 3. Cargar los videos de cada módulo

Los videos se suben a **YouTube como "No listado"** (así solo entra quien tiene el link, pero no requiere que sepan editar el HTML).

1. Subí el video a YouTube con visibilidad "No listado".
2. Copiá el ID de la URL: en `https://www.youtube.com/watch?v=ABC123XYZ` el ID es `ABC123XYZ`.
3. En `js/content.js`, buscá el módulo correspondiente y completá:

```js
videoId: "ABC123XYZ",
```

Mientras `videoId` esté vacío (`""`), la plataforma muestra automáticamente "el video todavía no fue cargado" — no rompe nada.

---

## 4. Cargar documentos de cada módulo

Dos opciones, ambas válidas:

**A) Subir el archivo directo al repo (recomendado para PDFs livianos, <20 MB):**
1. Poné el PDF dentro de la carpeta `docs/`.
2. En `content.js`, referencialo como `"docs/nombre-del-archivo.pdf"`.

**B) Linkear a Google Drive (para archivos grandes):**
1. Subilo a Drive, click derecho → Compartir → "Cualquier persona con el enlace".
2. Pegá ese link directamente en el campo `url` de `content.js`.

---

## 5. Backend: acceso + foro (Google Sheets + Apps Script)

Es la única configuración de una sola vez. Con esto quedan activos **el acceso de alumnos y el foro** (usan la misma planilla).

**A) Crear la planilla con las dos hojas**

1. Creá una **Google Sheet nueva**, cualquier nombre.
2. Creá **cuatro hojas** (pestañas de abajo) con estos nombres exactos: `Alumnos`, `Comentarios`, `Novedades` y `Cronograma`. En la **fila 1** de cada una poné los encabezados:
   - Hoja `Alumnos` → columnas para: **correo, clave, nombre, rol, habilitado, fecha de alta**
   - Hoja `Comentarios` → columnas para: **módulo, nombre, mensaje, fecha, tipo**
   - Hoja `Novedades` → columnas para: **fecha, título, texto**
   - Hoja `Cronograma` → columnas para: **fecha, hora, título, detalle**

   > En `Comentarios`, la columna **"Tipo"** guarda si el mensaje es de un alumno o del organizador (se completa sola). Sirve para destacar tus respuestas y para la bandeja de Consultas. Es opcional, pero conviene tenerla.

   > Los encabezados podés escribirlos **en español** (ej: "Correo electrónico", "Clave", "Rol", "Habilitado"), en **cualquier orden**, e incluso agregar columnas extra (ej: "Apellido"): el código encuentra cada columna por su nombre. Solo importa que los nombres de las **pestañas** (`Alumnos` y `Comentarios`) sean exactos.
   >
   > El acceso usa solo **correo y clave**. La columna `nombre` es opcional (si la dejás vacía, la persona se muestra con la parte de su correo antes de la @).

**B) Cargar el primer admin (una sola vez)**

En la hoja `Alumnos`, agregá tu fila a mano, por ejemplo:

| email | clave | nombre | rol | habilitado | fecha_alta |
|---|---|---|---|---|---|
| andriy@correo.com | (una clave) | Andriy Trofymenko | admin | SI | (vacío) |

Podés agregar a Christian igual con `rol = admin`. Desde ahí, el resto de las altas se hacen desde el panel de la web.

**C) Pegar el código y elegir tu clave secreta**

3. Andá a **Extensiones → Apps Script**.
4. Borrá lo que haya y pegá el contenido de `apps-script/Code.gs`.
5. **Importante:** cambiá el valor de `SECRET` (arriba de todo en el código) por una frase larga e inventada por vos. Firma las sesiones; no la compartas.
6. Guardá el proyecto (ícono de disquete).

**D) Implementar como aplicación web**

7. Arriba a la derecha: **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo (tu cuenta de Google)**
   - Quién tiene acceso: **Cualquier usuario**
8. Autorizá los permisos que pida Google (es tu propia planilla, es seguro). Google va a pedir permiso para **acceder a tus planillas** y para **enviar correos en tu nombre** (esto último es para el aviso automático de consultas nuevas).
9. Copiá la **URL de la aplicación web** y pegala en `js/content.js`:

```js
sheetApiUrl: "https://script.google.com/macros/s/AKfycb.../exec",
```

Listo. Ya podés entrar con tu correo + clave de admin y empezar a cargar alumnos desde la sección **Administración**.

> Si más adelante editás `Code.gs`, tenés que volver a **Implementar → Gestionar implementaciones → editar (lápiz) → Nueva versión** para que los cambios tomen efecto (la URL sigue siendo la misma).

Los comentarios de todos los módulos van a la hoja `Comentarios`, identificados por `moduleId`; podés moderarlos borrando la fila correspondiente.

### Cómo funcionan las consultas y respuestas

- Un alumno deja una consulta en un módulo → se guarda en la hoja `Comentarios` y **te llega un mail** avisándote.
- Como admin, tenés la sección **Consultas** (menú lateral): junta **todas las preguntas de todos los módulos** en un solo lugar, con las **pendientes resaltadas** y un contador en el menú.
- Tocás **"Responder"** y te lleva al módulo con la respuesta empezada (citando a la persona). Tu respuesta queda marcada como **"Organizador"** y la ve quien preguntó y el resto del módulo.
- Todo el historial (preguntas y respuestas) queda guardado para siempre en la hoja `Comentarios` y visible en la plataforma.

---

## 6. Editar textos, agregar o quitar módulos

Todo el contenido editable (títulos, descripciones, estadísticas de la portada y los módulos) está en **`js/content.js`**, con comentarios explicando cada campo. No hace falta tocar `app.js` ni `styles.css` para el uso normal.

### Portada de Inicio

La portada (título, subtítulo, fondo con motivo de IA y logos de los organismos) ya no es una foto fija: se genera con HTML/CSS, así que se ve nítida en cualquier pantalla y el texto sale directo de `content.js` (`programTitle`, `programSubtitle`, `programTagline`).

Los logos van en `orgLogos` (dentro de `content.js`), cada uno apuntando a un archivo en `/assets` (ej: `assets/logo-gobierno.png`). Mientras el archivo no exista, se muestra el nombre del organismo como texto chico en su lugar — no rompe nada.

---

## Estructura de archivos

```
├── index.html              → estructura de la página (no hace falta editarlo)
├── css/styles.css          → estilos e identidad visual
├── js/content.js           → ← EDITAR ACÁ el contenido del curso
├── js/app.js               → lógica de la app (no hace falta editarlo)
├── assets/                 → fotos del equipo y logos de los organismos
├── docs/                   → poné acá los PDFs de cada módulo
└── apps-script/Code.gs     → código para pegar en Google Apps Script
```
