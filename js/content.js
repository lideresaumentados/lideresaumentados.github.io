/* =========================================================================
   CONTENIDO EDITABLE DE LA PLATAFORMA — "Líderes Aumentados"
   -------------------------------------------------------------------------
   Este es el ÚNICO archivo que necesitan tocar para el día a día:
   cambiar la contraseña, cargar links de YouTube, agregar documentos,
   editar textos de los módulos, etc.

   Después de editar, guardá el archivo, hacé commit y push a GitHub.
   GitHub Pages actualiza el sitio solo, en 1-2 minutos.
   ========================================================================= */

const SITE_CONFIG = {
  // URL del Web App de Google Apps Script.
  // Es el ÚNICO valor imprescindible: maneja el acceso (correo + clave) y el foro.
  // Se completa siguiendo los pasos del README. Mientras diga "PEGAR_URL_ACA",
  // la plataforma muestra un aviso claro en la pantalla de acceso en vez de romperse.
  //
  // El acceso ya NO usa una contraseña compartida: cada persona entra con su
  // propio correo y clave, definidos desde el panel de Administración
  // (o cargados a mano en la hoja "Alumnos" de la planilla).
  sheetApiUrl: "https://script.google.com/macros/s/AKfycbzIU7UKU1hWpHw3SUhmKiOzMQY8goVWczp3lJh1lF1tH_ypPh2uf4ot01ECVdZ4qpms/exec",

  programTitle: "Líderes Aumentados",
  programSubtitle: "Liderazgo estratégico e Inteligencia Artificial aplicada a la gestión pública",
  programTagline: "Propuesta de capacitación para el desarrollo de nuevos liderazgos estratégicos en Santa Cruz",

  // Texto de bienvenida que aparece en la sección Inicio.
  welcome: "¡Bienvenido/a a Líderes Aumentados! Este será tu espacio de aprendizaje durante todo el programa. Aquí encontrarás el cronograma de encuentros, el material y los videos de cada módulo, las novedades y un espacio para realizar consultas. Te invitamos a explorar cada contenido, participar activamente y aprovechar al máximo esta experiencia de formación. ¡Muchos éxitos!",

  // Archivos descargables que aparecen en Inicio (presentaciones, brochures, etc.).
  // - url: link directo de Google Drive en formato descarga (o cualquier URL pública).
  // Para obtener el link de Drive: abrís el archivo → Compartir → "Cualquiera con el link"
  // y luego reemplazás "/view" por "/preview" en la URL (o usás el formato abajo).
  recursos: [
    {
      nombre: "Presentación del programa",
      desc: "PDF · Julio 2026",
      url: "https://drive.google.com/uc?export=download&id=1i2_eLe-C_zrwUT5q7fy6Kzlz5aEmkQpz",
      icono: "file-text"
    }
  ],

  // Logos que rotan en la franja blanca de la portada de Inicio (se ven 3 a la vez).
  // - logo: ruta a la imagen dentro de /assets (ej: "assets/logo-gobierno.png").
  //         Si el archivo todavía no existe, se muestra el nombre como texto en su lugar.
  heroLogos: [
    { name: "Gobierno de Santa Cruz", logo: "assets/logo-gobierno.png" },
    { name: "Santa Cruz Puede S.A.U.", logo: "assets/logo-scp.png" },
    { name: "SER", logo: "assets/logo-ser.png" },
    { name: "Christian Pollavini", logo: "assets/logo-christian.png" },
    { name: "Andriy Trofymenko", logo: "assets/logo-andriy.png" }
  ],

  // Números reales de la propuesta (slide "Arquitectura del programa")
  stats: [
    { number: "8", label: "Encuentros presenciales", detail: "3 horas cada uno, con metodología activa y casos reales." },
    { number: "24hs", label: "Entrenamiento aplicado", detail: "Simulaciones, matrices, role plays y uso guiado de IA." },
    { number: "50", label: "Directivos inscriptos", detail: "Líderes y mandos con potencial de conducción en Santa Cruz." },
    { number: "30", label: "Días para proyecto final", detail: "Cada participante cierra con un proyecto de mejora aplicado a su área." }
  ],

  // Equipo capacitador que se muestra en Inicio (tarjeta por persona).
  // - photo: ruta a la foto dentro de /assets (ej: "assets/andriy.jpg").
  //          Si el archivo no existe, la tarjeta muestra las iniciales.
  // - desc:  descripción que aparece debajo de la foto.
  org: "Gobierno de Santa Cruz · Santa Cruz Puede S.A.U. · SER",
  team: [
    {
      name: "Christian Pollavini",
      role: "Coach de Líderes",
      photo: "assets/christian.jpg",
      desc: "Especializado en liderazgo y desarrollo organizacional. Ayuda a organizaciones y equipos a desarrollar líderes, fortalecer la comunicación y gestionar procesos de cambio. Combina coaching ejecutivo, inteligencia emocional y estrategias de desarrollo organizacional para impulsar equipos de alto desempeño y construir culturas de trabajo orientadas a resultados.",
      links: [
        { type: "whatsapp", label: "+54 9 2966 - 692544", url: "https://wa.me/542966692544" },
        { type: "web", label: "www.christianpollavini.com", url: "https://www.christianpollavini.com" }
      ]
    },
    {
      name: "Andriy Trofymenko",
      role: "Ingeniero Industrial",
      photo: "assets/andriy.jpg",
      desc: "Especializado en transformación organizacional mediante Inteligencia Artificial, Machine Learning y metodologías de mejora continua. Ayuda a organizaciones a optimizar procesos, automatizar tareas, analizar datos y desarrollar ventajas competitivas mediante tecnologías de Industria 5.0. Combina el rigor de la ingeniería con una visión estratégica para convertir la innovación tecnológica en resultados concretos para personas y equipos.",
      links: [
        { type: "whatsapp", label: "+54 9 11-33278023", url: "https://wa.me/541133278023" },
        { type: "web", label: "andriytrofymenko.github.io", url: "https://andriytrofymenko.github.io/" }
      ]
    }
  ],
  contact: "549 2966692544 · www.christianpollavini.com"
};

/* -------------------------------------------------------------------------
   MÓDULOS DEL PROGRAMA
   Para cada módulo:
   - videoId: el ID de YouTube (lo que va después de "v=" en la URL).
              Ej: en https://www.youtube.com/watch?v=ABC123XYZ el ID es "ABC123XYZ"
              Dejalo vacío "" si todavía no hay video cargado.
   - docs: lista de documentos. "url" puede ser un archivo en la carpeta /docs
           del repo (ej: "docs/matriz-decision.pdf") o un link externo (Drive, etc.)
   ------------------------------------------------------------------------- */
const MODULES = [
  {
    id: 1,
    title: "Nuevo liderazgo público en la era de la IA",
    description: "Qué cambia en el rol de conducción cuando la Inteligencia Artificial entra a la gestión pública, y qué se espera hoy de un líder o líder a en Santa Cruz.",
    image: "assets/mod1.jpg",
    videoId: "",
    docs: []
  },
  {
    id: 2,
    title: "IA centrada en procesos vs. IA centrada en personas",
    description: "Dos caminos posibles para usar IA en la gestión: eficiencia de procesos por un lado, foco en las personas por el otro. Cómo integrar ambos con criterio humano.",
    image: "assets/mod2.jpg",
    videoId: "",
    docs: []
  },
  {
    id: 3,
    title: "Toma de decisiones ágiles",
    description: "Marcos y herramientas para decidir con más velocidad y menos desgaste, incorporando IA como apoyo — nunca como reemplazo del criterio.",
    image: "assets/mod3.jpg",
    videoId: "",
    docs: []
  },
  {
    id: 4,
    title: "Productividad pública aumentada",
    description: "Reuniones, informes y seguimiento de tareas: cómo aplicar IA para ganar tiempo real en el día a día de la gestión.",
    image: "assets/mod4.jpg",
    videoId: "",
    docs: []
  },
  {
    id: 5,
    title: "Conducción de equipos en contextos de cambio",
    description: "Comunicación, feedback y conversaciones difíciles para sostener equipos motivados durante procesos de transformación.",
    image: "assets/mod5.jpg",
    videoId: "",
    docs: []
  },
  {
    id: 6,
    title: "Rediseño de procesos con criterio humano",
    description: "Cómo mapear y mejorar procesos de gestión pública sin perder de vista a las personas que los sostienen y a quienes sirven.",
    image: "assets/mod6.jpg",
    videoId: "",
    docs: []
  },
  {
    id: 7,
    title: "Confianza, reputación y responsabilidad institucional",
    description: "Uso responsable de IA en el sector público: trazabilidad, ética, datos sensibles y supervisión humana.",
    image: "assets/mod7.jpg",
    videoId: "",
    docs: []
  },
  {
    id: 8,
    title: "Proyecto aplicado de mejora",
    description: "Cada participante presenta su proyecto de mejora, diseñado para implementar en su área dentro de los 30 días posteriores al cierre del programa.",
    image: "assets/mod8.jpg",
    videoId: "",
    docs: []
  }
];
