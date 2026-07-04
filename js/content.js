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
  sheetApiUrl: "https://script.google.com/macros/s/AKfycbwk5OYxU4_MHI6Ma87yZ_iClCmyTTKZKso23V9v7s8FpEtRQVLP4kPfjvM1cxm5KJ7m/exec",

  programTitle: "Líderes Aumentados",
  programSubtitle: "Liderazgo estratégico e Inteligencia Artificial aplicada a la gestión pública",
  programTagline: "Propuesta de capacitación para el desarrollo de nuevos liderazgos estratégicos en Santa Cruz",

  // Texto de bienvenida que aparece en la sección Inicio.
  welcome: "Bienvenido/a a la plataforma del programa. Acá vas a encontrar el cronograma de encuentros, el material y los videos de cada módulo, las novedades y un espacio para dejar tus consultas. ¡Que lo aproveches!",

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
      role: "Coach de Líderes · Equipos · Gestión Organizacional",
      photo: "assets/christian.jpg",
      desc: "Coach especializado en el desarrollo de líderes y equipos, y en gestión organizacional. Acompaña a mandos y directivos a fortalecer sus habilidades de conducción y a sostener equipos motivados en contextos de cambio."
    },
    {
      name: "Andriy Trofymenko",
      role: "Ingeniero Industrial · Mejora Continua · Excelencia Operativa",
      photo: "assets/andriy.jpg",
      desc: "Ingeniero Industrial especializado en la gestión estratégica de proyectos y la excelencia operativa. Combina rigurosidad técnica y visión integral para transformar procesos, reducir costos y maximizar la productividad. Trabaja con metodologías Lean Manufacturing, Six Sigma, 5S y Kaizen, e integra tecnología e Industria 4.0 para impulsar una cultura de mejora continua."
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
    videoId: "",
    docs: []
  },
  {
    id: 2,
    title: "IA centrada en procesos vs. IA centrada en personas",
    description: "Dos caminos posibles para usar IA en la gestión: eficiencia de procesos por un lado, foco en las personas por el otro. Cómo integrar ambos con criterio humano.",
    videoId: "",
    docs: []
  },
  {
    id: 3,
    title: "Toma de decisiones ágiles",
    description: "Marcos y herramientas para decidir con más velocidad y menos desgaste, incorporando IA como apoyo — nunca como reemplazo del criterio.",
    videoId: "",
    docs: []
  },
  {
    id: 4,
    title: "Productividad pública aumentada",
    description: "Reuniones, informes y seguimiento de tareas: cómo aplicar IA para ganar tiempo real en el día a día de la gestión.",
    videoId: "",
    docs: []
  },
  {
    id: 5,
    title: "Conducción de equipos en contextos de cambio",
    description: "Comunicación, feedback y conversaciones difíciles para sostener equipos motivados durante procesos de transformación.",
    videoId: "",
    docs: []
  },
  {
    id: 6,
    title: "Rediseño de procesos con criterio humano",
    description: "Cómo mapear y mejorar procesos de gestión pública sin perder de vista a las personas que los sostienen y a quienes sirven.",
    videoId: "",
    docs: []
  },
  {
    id: 7,
    title: "Confianza, reputación y responsabilidad institucional",
    description: "Uso responsable de IA en el sector público: trazabilidad, ética, datos sensibles y supervisión humana.",
    videoId: "",
    docs: []
  },
  {
    id: 8,
    title: "Proyecto aplicado de mejora",
    description: "Cada participante presenta su proyecto de mejora, diseñado para implementar en su área dentro de los 30 días posteriores al cierre del programa.",
    videoId: "",
    docs: []
  }
];
