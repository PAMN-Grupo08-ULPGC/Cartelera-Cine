// Recoge la cartelera real de los cines de Las Palmas de Gran Canaria y la
// guarda en JSON y CSV para usarla como datos de prueba realistas.
//
// Fuentes públicas:
//   - eCartelera: Yelmo Las Arenas y Yelmo Premium Alisios (películas y horarios).
//   - Web de venta de OCINE Premium 7 Palmas: películas, horarios, sala y aforo.
//
// Uso: node docs/datos-reales/recolectar-cartelera.mjs
// Requiere Node 18 o superior (fetch nativo). Sin dependencias.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CARPETA_SALIDA = dirname(fileURLToPath(import.meta.url));
const AGENTE_USUARIO = "Mozilla/5.0 (proyecto academico PAMN ULPGC)";
const PAUSA_ENTRE_PETICIONES_MS = 400;
const DIAS_A_RECOGER = 7;

const CINES_ECARTELERA = [
  {
    id: "yelmo-las-arenas",
    nombre: "Yelmo Cines Las Arenas",
    urlDia: (dia) => `https://www.ecartelera.com/cines/355,${dia},1.html`,
  },
  {
    id: "yelmo-premium-alisios",
    nombre: "Yelmo Cines Premium Alisios",
    urlDia: (dia) =>
      `https://www.ecartelera.com/cines/yelmo-cines-premium-alisios/${dia === 0 ? "" : dia + "/"}`,
  },
];

const OCINE = {
  id: "ocine-premium-7-palmas",
  nombre: "OCINE Premium 7 Palmas",
  cadena: "OCINE",
  direccion: "Av. Pintor Felo Monzón, 44, 35019 Las Palmas de Gran Canaria",
  urlApi: "https://tickets.ocinepremium7palmas.es/api/v1",
};

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function pedirTexto(url, opciones = {}) {
  await esperar(PAUSA_ENTRE_PETICIONES_MS);
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { "User-Agent": AGENTE_USUARIO, ...(opciones.headers ?? {}) },
  });
  if (!respuesta.ok) throw new Error(`${respuesta.status} en ${url}`);
  return respuesta.text();
}

const pedirJson = async (url, opciones) => JSON.parse(await pedirTexto(url, opciones));

const ENTIDADES_HTML = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };

function decodificarHtml(texto) {
  const tildes = { aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ",
    Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", uuml: "ü" };
  return texto
    .replace(/&#(\d+);/g, (_, codigo) => String.fromCodePoint(Number(codigo)))
    .replace(/&([a-zA-Z]+);/g, (original, nombre) => ENTIDADES_HTML[nombre] ?? tildes[nombre] ?? original);
}

const limpiarHtml = (html) => decodificarHtml(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").replace(/ ,/g, ",").trim();

// Clave para unir la misma película entre cines aunque cambien mayúsculas o tildes.
function claveTitulo(titulo) {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sumarDias(fechaIso, dias) {
  const fecha = new Date(`${fechaIso}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function fechaDeHoy() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Atlantic/Canary" }).format(new Date());
}

// ---------- eCartelera (Yelmo) ----------

function extraerDatosCine(html) {
  const filas = [...html.matchAll(/<(?:p|div) class="crow">([\s\S]*?)<\/(?:p|div)>/g)].map((m) => limpiarHtml(m[1]));
  const valor = (etiqueta) => filas.find((f) => f.startsWith(etiqueta))?.slice(etiqueta.length).replace(/^:\s*/, "").replace(/\s*Mapa$/, "").trim();
  return {
    cadena: valor("Cadena"),
    direccion: valor("Dirección"),
    telefono: valor("Teléfono"),
    precios: valor("Precios")?.replace(/,\s*$/, ""),
    preciosReducidos: valor("Reducidos y día del espectador"),
  };
}

function extraerPeliculasEcartelera(html) {
  const bloques = html.split('<div class="titem"').slice(1);
  return bloques.map((bloque) => {
    const titulo = limpiarHtml(bloque.match(/<p class="tit">([\s\S]*?)<\/p>/)?.[1] ?? "");
    const datos = [...(bloque.match(/<p class="data">([\s\S]*?)<\/p>/)?.[1] ?? "").matchAll(/<span>([\s\S]*?)<\/span>/g)].map((m) => limpiarHtml(m[1]));
    const duracion = datos.find((d) => /^\d+ min\.$/.test(d));
    const clasificacion = datos.find((d) => /^\+\d+$/.test(d));
    const resto = datos.filter((d) => d !== duracion && d !== clasificacion);
    const reparto = [...(bloque.match(/<p class="cast">([\s\S]*?)<\/p>/)?.[1] ?? "").matchAll(/title="([^"]+)"/g)].map((m) => decodificarHtml(m[1]));
    const direccion = [...(bloque.match(/<p class="dir">([\s\S]*?)<\/p>/)?.[1] ?? "").matchAll(/title="([^"]+)"/g)].map((m) => decodificarHtml(m[1]));
    const sesiones = [...bloque.matchAll(/data-session-time="([^"]+)" data-session-format="([^"]*)"/g)].map((m) => ({
      hora: m[1],
      formato: decodificarHtml(m[2]) || null,
    }));
    return {
      idEcartelera: bloque.match(/data-movie-id="(\d+)"/)?.[1],
      titulo,
      duracionMinutos: duracion ? Number.parseInt(duracion, 10) : null,
      pais: resto[0] ?? null,
      genero: resto[1] ?? null,
      clasificacionEdad: clasificacion ?? null,
      direccion,
      reparto,
      urlCartel: bloque.match(/<img\s+src="([^"]+)"/)?.[1]?.replace("_mini", "") ?? null,
      urlFicha: bloque.match(/<p class="tit"><a href="([^"]+)"/)?.[1] ?? null,
      sesiones,
    };
  });
}

async function recogerCineEcartelera(cine, hoy) {
  const resultado = { cine: { id: cine.id, nombre: cine.nombre, fuente: cine.urlDia(0) }, peliculas: [], sesiones: [] };
  for (let dia = 0; dia < DIAS_A_RECOGER; dia++) {
    const html = await pedirTexto(cine.urlDia(dia));
    if (dia === 0) Object.assign(resultado.cine, extraerDatosCine(html));
    const fecha = sumarDias(hoy, dia);
    for (const pelicula of extraerPeliculasEcartelera(html)) {
      const { sesiones, ...ficha } = pelicula;
      resultado.peliculas.push(ficha);
      for (const sesion of sesiones) {
        resultado.sesiones.push({ cine: cine.id, titulo: ficha.titulo, fecha, hora: sesion.hora, sala: null,
          formato: sesion.formato, aforo: null, butacasLibres: null });
      }
    }
    console.log(`  ${cine.nombre} ${fecha}: ${resultado.sesiones.filter((s) => s.fecha === fecha).length} sesiones`);
  }
  return resultado;
}

// ---------- OCINE Premium 7 Palmas ----------

async function recogerOcine() {
  const cabeceras = { "Content-Type": "application/json" };
  const cartelera = await pedirJson(`${OCINE.urlApi}/sessions`, {
    method: "POST",
    headers: cabeceras,
    body: JSON.stringify({ token: "", idioma: "es", urlWeb: "https://tickets.ocinepremium7palmas.es/" }),
  });
  const listado = [...cartelera.pelicules, ...cartelera.estrenes, ...cartelera.anticipades];
  const idsUnicos = [...new Set(listado.map((p) => p.id))];

  const resultado = { cine: { id: OCINE.id, nombre: OCINE.nombre, cadena: OCINE.cadena, direccion: OCINE.direccion,
    fuente: "https://www.ocinepremium7palmas.es/" }, peliculas: [], sesiones: [] };
  const salas = new Map();

  for (const id of idsUnicos) {
    const detalle = await pedirJson(`${OCINE.urlApi}/pelicula/${id}?lang=es`);
    const categoria = listado.find((p) => p.id === id)?.categoria;
    resultado.peliculas.push({
      idOcine: id,
      titulo: detalle.titol,
      tituloOriginal: detalle.titolOriginal,
      duracionMinutos: Number(detalle.durada) || null,
      genero: detalle.genereComercial || null,
      clasificacionEdad: detalle.classificacio || null,
      direccion: detalle.director ? [detalle.director] : [],
      reparto: [detalle.actor1, detalle.actriu1, detalle.actor2, detalle.actriu2].filter(Boolean),
      sinopsis: detalle.sinopsis?.trim() || null,
      urlTrailer: detalle.videoExtern || null,
      fechaEstreno: detalle.dataEstrena?.slice(0, 10) || null,
      esProximoEstreno: categoria === "estrena" || categoria === "anticipada",
    });

    const versiones = detalle.esGrup
      ? detalle.subPelicules.map((v) => ({ formato: v.propietatsDesc.join(" ") || null, sesiones: v.sessions ?? [] }))
      : [{ formato: (detalle.propietatsDesc ?? []).join(" ") || null, sesiones: detalle.sessions ?? [] }];

    for (const version of versiones) {
      for (const sesion of version.sesiones) {
        salas.set(sesion.nomSala, sesion.totals);
        resultado.sesiones.push({ cine: OCINE.id, titulo: detalle.titol, fecha: sesion.data.slice(0, 10),
          hora: sesion.hora.slice(0, 5), sala: sesion.nomSala, formato: version.formato,
          aforo: sesion.totals, butacasLibres: sesion.disponibles });
      }
    }
  }
  resultado.cine.salas = [...salas].map(([nombre, aforo]) => ({ nombre, aforo }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
  console.log(`  ${OCINE.nombre}: ${resultado.peliculas.length} películas, ${resultado.sesiones.length} sesiones`);
  return resultado;
}

// ---------- Unión y salida ----------

// Un cine puede abreviar el título ("Wildwood" frente a "Wildwood: El bosque salvaje").
function buscarClaveEquivalente(clave, clavesExistentes) {
  return clavesExistentes.find((otra) => otra === clave || otra.startsWith(clave + " ") || clave.startsWith(otra + " "));
}

function unirPeliculas(listas) {
  const porClave = new Map();
  for (const pelicula of listas.flat()) {
    const clave = buscarClaveEquivalente(claveTitulo(pelicula.titulo), [...porClave.keys()]) ?? claveTitulo(pelicula.titulo);
    const existente = porClave.get(clave) ?? {};
    // Se conserva el primer valor no vacío de cada campo.
    for (const [campo, valor] of Object.entries(pelicula)) {
      const vacio = valor == null || (Array.isArray(valor) && valor.length === 0);
      if (!vacio && (existente[campo] == null || (Array.isArray(existente[campo]) && existente[campo].length === 0))) {
        existente[campo] = valor;
      }
    }
    porClave.set(clave, existente);
  }
  return [...porClave.entries()].map(([clave, p]) => ({ id: clave.replace(/ /g, "-"), ...p }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
}

function aCsv(filas, columnas) {
  const escapar = (valor) => {
    const texto = valor == null ? "" : String(valor);
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  return [columnas.join(","), ...filas.map((f) => columnas.map((c) => escapar(f[c])).join(","))].join("\n") + "\n";
}

async function main() {
  const hoy = fechaDeHoy();
  console.log(`Recogiendo cartelera de Las Palmas de Gran Canaria (${hoy})`);

  const resultados = [];
  for (const cine of CINES_ECARTELERA) resultados.push(await recogerCineEcartelera(cine, hoy));
  resultados.push(await recogerOcine());

  const peliculas = unirPeliculas(resultados.map((r) => r.peliculas));
  const idPorClave = new Map(peliculas.map((p) => [claveTitulo(p.titulo), p.id]));
  const idDeTitulo = (titulo) => idPorClave.get(buscarClaveEquivalente(claveTitulo(titulo), [...idPorClave.keys()]));
  const sesiones = resultados.flatMap((r) => r.sesiones)
    .map(({ titulo, ...s }) => ({ pelicula: idDeTitulo(titulo), titulo, ...s }))
    .sort((a, b) => (a.cine + a.fecha + a.hora).localeCompare(b.cine + b.fecha + b.hora));

  const datos = {
    fechaRecogida: new Date().toISOString(),
    aviso: "Datos públicos recogidos para uso académico. Las sinopsis y carteles pertenecen a sus autores; no publicar.",
    cines: resultados.map((r) => r.cine),
    peliculas,
    sesiones,
  };

  await mkdir(CARPETA_SALIDA, { recursive: true });
  const base = join(CARPETA_SALIDA, `cartelera-lpgc-${hoy}`);
  await writeFile(`${base}.json`, JSON.stringify(datos, null, 2) + "\n", "utf8");
  await writeFile(`${base}-sesiones.csv`, aCsv(sesiones,
    ["cine", "pelicula", "titulo", "fecha", "hora", "sala", "formato", "aforo", "butacasLibres"]), "utf8");
  console.log(`Guardado: ${datos.cines.length} cines, ${peliculas.length} películas, ${sesiones.length} sesiones -> ${base}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
