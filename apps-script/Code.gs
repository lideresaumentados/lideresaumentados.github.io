/**
 * Líderes Aumentados — Backend (Google Sheets + Apps Script)
 *
 * Maneja DOS cosas en la misma planilla:
 *   1) ACCESO de alumnos y administradores  -> hoja "Alumnos"
 *   2) FORO de comentarios por módulo        -> hoja "Comentarios"
 *
 * Las columnas se detectan POR SU NOMBRE (no por su posición), así que podés
 * escribir los encabezados en español, en el orden que quieras, y agregar
 * columnas extra (ej: "Apellido") sin romper nada. Nombres aceptados por campo:
 *
 *   Hoja "Alumnos":
 *     - correo:      "Correo electrónico" / "correo" / "email"
 *     - clave:       "Clave" / "contraseña" / "password"
 *     - nombre:      "Nombre" (+ "Apellido" opcional)  (opcional; se muestran juntos)
 *     - rol:         "Rol"                            (poné "Admin" o "Alumno")
 *     - habilitado:  "Habilitado" / "Activo" / "Estado"   (poné "Sí" o "No")
 *     - fecha alta:  "Fecha de alta" / "Fecha"        (opcional, se completa sola)
 *
 *   Hoja "Comentarios":
 *     - módulo:  "Módulo" / "moduleId"
 *     - nombre:  "Nombre" / "name" / "Autor"
 *     - mensaje: "Mensaje" / "message"
 *     - fecha:   "Fecha" / "timestamp"
 *     - tipo:    "Tipo"                 (opcional; guarda "Organizador" o "Alumno")
 *
 *   Hoja "Novedades":
 *     - fecha:   "Fecha"   (se completa sola)
 *     - titulo:  "Título"  (opcional)
 *     - texto:   "Texto" / "Mensaje"
 *
 *   Hoja "Cronograma":
 *     - fecha:   "Fecha"
 *     - hora:    "Hora"    (opcional)
 *     - titulo:  "Título" / "Tema" / "Actividad"
 *     - detalle: "Detalle" / "Lugar" (opcional)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * INSTALACIÓN (ver README.md):
 *  1. Crear las hojas "Alumnos" y "Comentarios" con sus encabezados (fila 1).
 *  2. Cargar a mano tu primera fila de admin en "Alumnos" (Rol=Admin, Habilitado=Sí).
 *  3. CAMBIAR el valor de SECRET (abajo) por una frase larga y única tuya.
 *  4. Extensiones > Apps Script > pegar este archivo > Implementar >
 *     Nueva implementación > Aplicación web (Ejecutar como: Yo / Acceso: Cualquier usuario).
 *  5. Copiar la URL y pegarla en js/content.js -> sheetApiUrl
 * ─────────────────────────────────────────────────────────────────────────
 */

// ⚠️ CAMBIAR por una frase larga, única e inventada por vos (mín. 20 caracteres).
const SECRET = "CAMBIAR-esta-frase-por-una-larga-y-unica-2026";

const SHEET_USERS = "Alumnos";
const SHEET_COMMENTS = "Comentarios";
const SHEET_NOVEDADES = "Novedades";
const SHEET_CRONOGRAMA = "Cronograma";

// Nombres de columna aceptados para cada campo (se comparan sin distinguir
// mayúsculas ni acentos). Podés sumar más alias si querés otros encabezados.
const USER_FIELDS = {
  email:      ["correo electronico", "correo", "email", "e-mail", "mail"],
  clave:      ["clave", "contrasena", "password", "pass"],
  nombre:     ["nombre"],
  apellido:   ["apellido", "apellidos"],
  rol:        ["rol", "role"],
  habilitado: ["habilitado", "activo", "estado"],
  fecha_alta: ["fecha de alta", "fecha_alta", "fecha alta", "fecha", "alta"]
};
const COMMENT_FIELDS = {
  moduleId:  ["modulo", "moduleid", "modulo id", "id modulo", "id"],
  name:      ["nombre", "name", "autor"],
  message:   ["mensaje", "message", "comentario"],
  timestamp: ["fecha", "timestamp", "fecha y hora", "fecha_hora"],
  tipo:      ["tipo", "rol", "organizador"]  // "Organizador" o "Alumno" (opcional pero recomendado)
};
const NOVEDAD_FIELDS = {
  fecha:  ["fecha", "timestamp", "fecha y hora"],
  titulo: ["titulo", "title", "asunto"],
  texto:  ["texto", "mensaje", "message", "novedad", "detalle"]
};
const CRONO_FIELDS = {
  fecha:   ["fecha", "date", "dia"],
  hora:    ["hora", "time", "horario"],
  titulo:  ["titulo", "title", "tema", "actividad", "encuentro"],
  detalle: ["detalle", "descripcion", "lugar", "notas", "modalidad"]
};

/* ============================ Router ============================ */

function doGet(e) {
  if (e.parameter && (e.parameter.action === "comments" || e.parameter.moduleId)) {
    return getComments(e.parameter.moduleId);
  }
  return json({ ok: true, service: "lideres-aumentados" });
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
  var action = body.action || "addComment";

  switch (action) {
    case "login":       return login(body);
    case "validate":    return validate(body);
    case "listUsers":   return listUsers(body);
    case "addUser":     return addUser(body);
    case "updateUser":  return updateUser(body);
    case "deleteUser":  return deleteUser(body);
    case "addComment":  return addComment(body);
    case "allComments": return allComments(body);
    case "deleteComment": return deleteComment(body);
    case "getNovedades":    return json({ ok: true, items: readTable(SHEET_NOVEDADES, NOVEDAD_FIELDS) });
    case "addNovedad":      return addNovedad(body);
    case "deleteNovedad":   return deleteRowGeneric(SHEET_NOVEDADES, NOVEDAD_FIELDS, body);
    case "getCronograma":   return json({ ok: true, items: readTable(SHEET_CRONOGRAMA, CRONO_FIELDS) });
    case "addCronograma":   return addCronograma(body);
    case "deleteCronograma":return deleteRowGeneric(SHEET_CRONOGRAMA, CRONO_FIELDS, body);
    case "getModuleLocks":  return getModuleLocks();
    case "setModuleLock":   return setModuleLock(body);
    default:            return json({ ok: false, error: "Acción desconocida." });
  }
}

/* ============================ Acceso / Usuarios ============================ */

function login(body) {
  var email = normEmail(body.email);
  var clave = String(body.clave || "");
  if (!email || !clave) return json({ ok: false, error: "Completá correo y clave." });

  var found = findUser(email);
  if (!found) return json({ ok: false, error: "No encontramos ese correo. Pedíselo a los organizadores." });

  var u = found.user;
  if (!isHabilitado(u.habilitado)) return json({ ok: false, error: "Tu acceso todavía no fue habilitado por los organizadores." });
  if (String(u.clave) !== clave) return json({ ok: false, error: "Clave incorrecta. Volvé a intentar." });

  return json({
    ok: true,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol || "alumno",
    token: makeToken(u.email, u.clave)
  });
}

function validate(body) {
  var u = verifySession(body.email, body.token);
  if (!u) return json({ ok: false });
  return json({ ok: true, email: u.email, nombre: u.nombre, rol: u.rol || "alumno" });
}

function listUsers(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });
  var users = readUsers().map(function (r) {
    return {
      email: r.user.email,
      nombre: r.user.nombre,
      clave: r.user.clave,
      rol: r.user.rol || "alumno",
      habilitado: isHabilitado(r.user.habilitado),
      fecha_alta: r.user.fecha_alta
    };
  });
  return json({ ok: true, users: users });
}

function addUser(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });

  var email = normEmail(body.email);
  var nombre = String(body.nombre || "").trim(); // opcional
  var clave = String(body.clave || "").trim();
  var rol = (String(body.rol || "alumno").toLowerCase() === "admin") ? "Admin" : "Alumno";

  if (!email || !clave) return json({ ok: false, error: "Faltan datos (correo y clave son obligatorios)." });
  if (findUser(email)) return json({ ok: false, error: "Ya existe un usuario con ese correo." });

  var sheet = getSheet(SHEET_USERS);
  var hmap = headerMap(sheet);
  if (colOf(hmap, USER_FIELDS.email) < 0 || colOf(hmap, USER_FIELDS.clave) < 0) {
    return json({ ok: false, error: "No encuentro las columnas de correo y clave en la hoja Alumnos." });
  }
  var rowNum = sheet.getLastRow() + 1;
  setCell(sheet, rowNum, hmap, USER_FIELDS.email, email);
  setCell(sheet, rowNum, hmap, USER_FIELDS.clave, clave);
  if (nombre) setCell(sheet, rowNum, hmap, USER_FIELDS.nombre, nombre);
  setCell(sheet, rowNum, hmap, USER_FIELDS.rol, rol);
  setCell(sheet, rowNum, hmap, USER_FIELDS.habilitado, "Sí");
  setCell(sheet, rowNum, hmap, USER_FIELDS.fecha_alta, new Date());
  return json({ ok: true });
}

function updateUser(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });

  var email = normEmail(body.email);
  var found = findUser(email);
  if (!found) return json({ ok: false, error: "No se encontró ese usuario." });

  var sheet = getSheet(SHEET_USERS);
  var hmap = headerMap(sheet);
  var rowNum = found.rowNum;

  if (body.hasOwnProperty("habilitado")) setCell(sheet, rowNum, hmap, USER_FIELDS.habilitado, body.habilitado ? "Sí" : "No");
  if (body.nombre != null && String(body.nombre).trim()) setCell(sheet, rowNum, hmap, USER_FIELDS.nombre, String(body.nombre).trim());
  if (body.clave != null && String(body.clave).trim()) setCell(sheet, rowNum, hmap, USER_FIELDS.clave, String(body.clave).trim());
  if (body.rol != null) setCell(sheet, rowNum, hmap, USER_FIELDS.rol, String(body.rol).toLowerCase() === "admin" ? "Admin" : "Alumno");

  return json({ ok: true });
}

function deleteUser(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });

  var email = normEmail(body.email);
  if (email === normEmail(body.adminEmail)) return json({ ok: false, error: "No podés eliminar tu propia cuenta de administrador." });

  var found = findUser(email);
  if (!found) return json({ ok: false, error: "No se encontró ese usuario." });

  getSheet(SHEET_USERS).deleteRow(found.rowNum);
  return json({ ok: true });
}

/* ============================ Foro de comentarios ============================ */

// Lee TODOS los comentarios (opcionalmente filtrados por módulo).
function readComments(moduleId) {
  var sheet = getSheet(SHEET_COMMENTS);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var hmap = rowHeaderMap(data[0]);
  var cId = colOf(hmap, COMMENT_FIELDS.moduleId);
  var cName = colOf(hmap, COMMENT_FIELDS.name);
  var cMsg = colOf(hmap, COMMENT_FIELDS.message);
  var cTs = colOf(hmap, COMMENT_FIELDS.timestamp);
  var cTipo = colOf(hmap, COMMENT_FIELDS.tipo);

  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (cId < 0 || !row[cId]) continue;
    if (moduleId != null && String(row[cId]) !== String(moduleId)) continue;
    var ts = cTs >= 0 ? row[cTs] : "";
    out.push({
      row: r + 1, // fila real en la planilla (para poder moderar/borrar)
      moduleId: row[cId],
      name: cName >= 0 ? row[cName] : "",
      message: cMsg >= 0 ? row[cMsg] : "",
      timestamp: ts ? new Date(ts).toISOString() : "",
      tipo: cTipo >= 0 ? String(row[cTipo] || "") : ""
    });
  }
  return out;
}

// Borra un comentario (solo admin). Verifica la fila para no borrar la equivocada
// si mientras tanto se agregaron/quitaron comentarios.
function deleteComment(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });

  var sheet = getSheet(SHEET_COMMENTS);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return json({ ok: false, error: "No hay comentarios." });

  var hmap = rowHeaderMap(data[0]);
  var cId = colOf(hmap, COMMENT_FIELDS.moduleId);
  var cTs = colOf(hmap, COMMENT_FIELDS.timestamp);
  var wantMod = String(body.moduleId || "");
  var wantTs = String(body.timestamp || "");
  function tsIso(v) { return v ? new Date(v).toISOString() : ""; }

  // 1) Intento por la fila indicada, verificando módulo (y fecha si viene).
  var hint = parseInt(body.row, 10);
  if (hint >= 2 && hint <= data.length) {
    var row = data[hint - 1];
    var okMod = cId < 0 || String(row[cId]) === wantMod;
    var okTs = !wantTs || cTs < 0 || tsIso(row[cTs]) === wantTs;
    if (okMod && okTs) { sheet.deleteRow(hint); return json({ ok: true }); }
  }

  // 2) Fallback: buscar por módulo + fecha (por si cambió el orden de filas).
  if (wantTs && cTs >= 0) {
    for (var r = 1; r < data.length; r++) {
      var row2 = data[r];
      if ((cId < 0 || String(row2[cId]) === wantMod) && tsIso(row2[cTs]) === wantTs) {
        sheet.deleteRow(r + 1);
        return json({ ok: true });
      }
    }
  }

  return json({ ok: false, error: "No se encontró el comentario (quizás ya fue borrado). Actualizá la página." });
}

function getComments(moduleId) {
  return json(readComments(moduleId)); // el frontend espera un array
}

// Todos los comentarios de todos los módulos (para la bandeja del admin).
function allComments(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });
  return json({ ok: true, comments: readComments(null) });
}

function addComment(body) {
  var moduleId = String(body.moduleId || "").slice(0, 50);
  var message = String(body.message || "").slice(0, 2000);
  if (!moduleId || !message) return json({ ok: false, error: "Faltan datos" });

  // Comentar requiere estar logueado: así el nombre y el rol son confiables.
  var u = verifySession(body.email, body.token);
  if (!u) return json({ ok: false, error: "Tu sesión expiró. Volvé a entrar para comentar." });

  var name = (u.nombre && String(u.nombre).trim()) ? u.nombre : String(u.email).split("@")[0];
  var esOrganizador = (u.rol === "admin");

  var sheet = getSheet(SHEET_COMMENTS);
  var hmap = headerMap(sheet);
  var rowNum = sheet.getLastRow() + 1;
  setCell(sheet, rowNum, hmap, COMMENT_FIELDS.moduleId, moduleId);
  setCell(sheet, rowNum, hmap, COMMENT_FIELDS.name, name);
  setCell(sheet, rowNum, hmap, COMMENT_FIELDS.message, message);
  setCell(sheet, rowNum, hmap, COMMENT_FIELDS.timestamp, new Date());
  setCell(sheet, rowNum, hmap, COMMENT_FIELDS.tipo, esOrganizador ? "Organizador" : "Alumno");

  // Avisar por mail a los admins cuando pregunta un alumno (no cuando responde un organizador).
  if (!esOrganizador) notifyAdmins(moduleId, name, message);

  return json({ ok: true });
}

// Envía un correo a todos los admins habilitados avisando de una consulta nueva.
function notifyAdmins(moduleId, name, message) {
  try {
    var admins = readUsers().filter(function (r) {
      return r.user.rol === "admin" && isHabilitado(r.user.habilitado);
    });
    var to = admins.map(function (r) { return r.user.email; }).filter(function (e) { return e; }).join(",");
    if (!to) return;
    var subject = "Nueva consulta (Módulo " + moduleId + ") — Líderes Aumentados";
    var bodyTxt =
      name + " dejó una consulta en el Módulo " + moduleId + ":\n\n" +
      "\"" + message + "\"\n\n" +
      "Entrá a la plataforma → Consultas para responderla.";
    MailApp.sendEmail(to, subject, bodyTxt);
  } catch (e) {
    // Si falla el mail (p. ej. cuota), no rompemos el guardado del comentario.
  }
}

/* ============================ Novedades y Cronograma ============================ */

// Lee cualquier hoja "tabla" (Novedades/Cronograma) según su mapa de campos.
function readTable(sheetName, fieldMap) {
  var sheet = getSheet(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var hmap = rowHeaderMap(data[0]);
  var cols = {};
  for (var k in fieldMap) cols[k] = colOf(hmap, fieldMap[k]);

  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var obj = { row: r + 1 };
    var any = false;
    for (var f in cols) {
      var c = cols[f];
      var v = c >= 0 ? row[c] : "";
      if (v instanceof Date) v = v.toISOString();
      obj[f] = v;
      if (String(v).trim()) any = true;
    }
    if (any) out.push(obj);
  }
  return out;
}

function addNovedad(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });
  var texto = String(body.texto || "").trim().slice(0, 2000);
  if (!texto) return json({ ok: false, error: "Escribí el texto de la novedad." });

  var sheet = getSheet(SHEET_NOVEDADES);
  if (!sheet) return json({ ok: false, error: "Falta la hoja 'Novedades' en la planilla." });
  var hmap = headerMap(sheet);
  var rowNum = sheet.getLastRow() + 1;
  setCell(sheet, rowNum, hmap, NOVEDAD_FIELDS.fecha, new Date());
  if (String(body.titulo || "").trim()) setCell(sheet, rowNum, hmap, NOVEDAD_FIELDS.titulo, String(body.titulo).trim().slice(0, 200));
  setCell(sheet, rowNum, hmap, NOVEDAD_FIELDS.texto, texto);
  return json({ ok: true });
}

function addCronograma(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });
  var titulo = String(body.titulo || "").trim().slice(0, 200);
  var fecha = String(body.fecha || "").trim();
  if (!titulo || !fecha) return json({ ok: false, error: "La fecha y el título son obligatorios." });

  var sheet = getSheet(SHEET_CRONOGRAMA);
  if (!sheet) return json({ ok: false, error: "Falta la hoja 'Cronograma' en la planilla." });
  var hmap = headerMap(sheet);
  var rowNum = sheet.getLastRow() + 1;
  setCell(sheet, rowNum, hmap, CRONO_FIELDS.fecha, fecha);
  if (String(body.hora || "").trim()) setCell(sheet, rowNum, hmap, CRONO_FIELDS.hora, String(body.hora).trim());
  setCell(sheet, rowNum, hmap, CRONO_FIELDS.titulo, titulo);
  if (String(body.detalle || "").trim()) setCell(sheet, rowNum, hmap, CRONO_FIELDS.detalle, String(body.detalle).trim().slice(0, 500));
  return json({ ok: true });
}

// Borra una fila de Novedades/Cronograma (solo admin). Verifica con la fila indicada
// y un campo de control (body.verifyField / body.verifyValue) para no borrar la equivocada.
function deleteRowGeneric(sheetName, fieldMap, body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });
  var sheet = getSheet(sheetName);
  if (!sheet) return json({ ok: false, error: "No se encontró la hoja." });
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return json({ ok: false, error: "No hay datos." });

  var hmap = rowHeaderMap(data[0]);
  var vCol = body.verifyField ? colOf(hmap, fieldMap[body.verifyField]) : -1;
  var vVal = String(body.verifyValue || "");
  function norm(v) { return v instanceof Date ? v.toISOString() : String(v); }

  var hint = parseInt(body.row, 10);
  if (hint >= 2 && hint <= data.length) {
    var okV = vCol < 0 || norm(data[hint - 1][vCol]) === vVal;
    if (okV) { sheet.deleteRow(hint); return json({ ok: true }); }
  }
  if (vCol >= 0) {
    for (var r = 1; r < data.length; r++) {
      if (norm(data[r][vCol]) === vVal) { sheet.deleteRow(r + 1); return json({ ok: true }); }
    }
  }
  return json({ ok: false, error: "No se encontró (quizás ya fue borrado). Actualizá la página." });
}

/* ============================ Bloqueo de módulos ============================ */

function getModuleLocks() {
  var props = PropertiesService.getScriptProperties();
  var locked = JSON.parse(props.getProperty("lockedModules") || "[]");
  return json({ ok: true, locked: locked });
}

function setModuleLock(body) {
  if (!verifyAdmin(body.adminEmail, body.token)) return json({ ok: false, error: "No autorizado." });
  var props = PropertiesService.getScriptProperties();
  var locked = JSON.parse(props.getProperty("lockedModules") || "[]");
  var id = parseInt(body.moduleId, 10);
  if (body.locked) {
    if (locked.indexOf(id) === -1) locked.push(id);
  } else {
    locked = locked.filter(function(x) { return x !== id; });
  }
  props.setProperty("lockedModules", JSON.stringify(locked));
  return json({ ok: true, locked: locked });
}

/* ============================ Helpers ============================ */

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normEmail(v) {
  return String(v || "").trim().toLowerCase();
}

// Normaliza un encabezado: minúsculas, sin espacios de borde y sin acentos.
function normHeader(s) {
  return String(s || "").trim().toLowerCase()
    .replace(/[áàäâ]/g, "a").replace(/[éèëê]/g, "e").replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o").replace(/[úùüû]/g, "u").replace(/ñ/g, "n");
}

// { encabezadoNormalizado: índiceDeColumna(0-based) } a partir de la fila 1.
function headerMap(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  return rowHeaderMap(sheet.getRange(1, 1, 1, lastCol).getValues()[0]);
}
function rowHeaderMap(headerRow) {
  var map = {};
  for (var i = 0; i < headerRow.length; i++) {
    var h = normHeader(headerRow[i]);
    if (h && !map.hasOwnProperty(h)) map[h] = i;
  }
  return map;
}

// Devuelve el índice (0-based) de la primera columna cuyo encabezado coincide
// con alguno de los alias del campo; -1 si no existe.
function colOf(hmap, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var k = normHeader(aliases[i]);
    if (hmap.hasOwnProperty(k)) return hmap[k];
  }
  return -1;
}

// Escribe un valor en la columna del campo (si esa columna existe).
function setCell(sheet, rowNum, hmap, aliases, value) {
  var c = colOf(hmap, aliases);
  if (c >= 0) sheet.getRange(rowNum, c + 1).setValue(value);
}

// Lee todos los usuarios como objetos + su número de fila real en la planilla.
function readUsers() {
  var sheet = getSheet(SHEET_USERS);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var hmap = rowHeaderMap(data[0]);
  var cEmail = colOf(hmap, USER_FIELDS.email);
  var cClave = colOf(hmap, USER_FIELDS.clave);
  var cNombre = colOf(hmap, USER_FIELDS.nombre);
  var cApellido = colOf(hmap, USER_FIELDS.apellido);
  var cRol = colOf(hmap, USER_FIELDS.rol);
  var cHab = colOf(hmap, USER_FIELDS.habilitado);
  var cFecha = colOf(hmap, USER_FIELDS.fecha_alta);

  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var email = cEmail >= 0 ? row[cEmail] : "";
    if (!email) continue;

    // Nombre visible = "Nombre" + "Apellido" juntos (lo que esté cargado).
    var nom = cNombre >= 0 ? String(row[cNombre] || "").trim() : "";
    var ape = cApellido >= 0 ? String(row[cApellido] || "").trim() : "";
    var nombreCompleto = (nom + " " + ape).trim();

    out.push({
      rowNum: r + 1,
      user: {
        email: normEmail(email),
        clave: cClave >= 0 ? row[cClave] : "",
        nombre: nombreCompleto,
        rol: String(cRol >= 0 ? row[cRol] : "alumno").toLowerCase(),
        habilitado: cHab >= 0 ? row[cHab] : "",
        fecha_alta: cFecha >= 0 ? row[cFecha] : ""
      }
    });
  }
  return out;
}

function findUser(email) {
  var target = normEmail(email);
  var all = readUsers();
  for (var i = 0; i < all.length; i++) {
    if (all[i].user.email === target) return all[i];
  }
  return null;
}

function isHabilitado(v) {
  if (v === true) return true;
  var s = String(v).trim().toLowerCase();
  return s === "si" || s === "sí" || s === "true" || s === "x" || s === "1";
}

// Token de sesión: hash de (email|clave|SECRET). No expone la clave en el navegador.
function makeToken(email, clave) {
  var raw = normEmail(email) + "|" + String(clave) + "|" + SECRET;
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function verifySession(email, token) {
  var found = findUser(email);
  if (!found) return null;
  var u = found.user;
  if (!isHabilitado(u.habilitado)) return null;
  if (makeToken(u.email, u.clave) !== String(token)) return null;
  return u;
}

function verifyAdmin(email, token) {
  var u = verifySession(email, token);
  if (!u || u.rol !== "admin") return null;
  return u;
}
