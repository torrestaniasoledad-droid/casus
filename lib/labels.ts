export const PROFESSION_LABEL: Record<string, string> = {
  fonoaudiologia: "Fonoaudiología / Logopedia",
  psicologia: "Psicología",
  nutricion: "Nutrición",
  kinesiologia: "Kinesiología / Fisioterapia",
  medicina: "Medicina",
  odontologia: "Odontología",
  psicopedagogia: "Psicopedagogía",
  terapia_ocupacional: "Terapia Ocupacional",
};

export const FORMAT_LABEL: Record<string, string> = {
  REEL: "Reel",
  CARRUSEL: "Carrusel",
  POST: "Post",
  STORIES: "Stories",
};

export const OBJECTIVE_LABEL: Record<string, string> = {
  EDUCAR: "Educar",
  AUTORIDAD: "Generar autoridad",
  CONSULTAS: "Conseguir consultas",
  INTERACCION: "Aumentar interacción",
  CONFIANZA: "Generar confianza",
};

export const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  DESIDENTIFICADO: "Desidentificado",
  GENERADO: "Generado",
  EDITADO: "Editado",
  GUARDADO: "Guardado",
  ARCHIVADO: "Archivado",
};

export const EDITORIAL_STATUS_LABEL: Record<string, string> = {
  IDEA: "Idea",
  EN_PROCESO: "En proceso",
  LISTO: "Listo",
  PROGRAMADO: "Programado",
  PUBLICADO: "Publicado",
  NO_UTILIZAR: "No utilizar",
};

/** Orden fijo de columnas del checklist editorial — es el mismo orden en toda la UI (tablero, selects, etc.). */
export const EDITORIAL_STATUS_ORDER = [
  "IDEA",
  "EN_PROCESO",
  "LISTO",
  "PROGRAMADO",
  "PUBLICADO",
  "NO_UTILIZAR",
] as const;
