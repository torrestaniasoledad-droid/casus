# CASUS — ETAPA 1 a ETAPA 5 (MVP completo)

Etapa 1: arquitectura, base de datos, autenticación, layout, dashboard,
onboarding y la pantalla "Crear contenido" (sin IA conectada).

Etapa 2: el pipeline real de IA — detección de datos identificables,
desidentificación, semáforo de riesgo y extracción del aprendizaje
clínico — más límites de uso por plan.

Etapa 3: selección de objetivo y formato, y generación de contenido para
Reel, Carrusel, Post y Stories.

Etapa 4: biblioteca funcional — abrir, editar, duplicar y eliminar
contenidos.

Etapa 5 (agregada ahora): testing, seguridad, navegación mobile,
manejo de errores y accesibilidad.

## Qué funciona hoy

- Registro (`/register`) → crea usuario + subscription FREE + settings.
- Login (`/login`) con NextAuth (credenciales, sesión JWT).
- Rutas `/dashboard/*` y `/onboarding` protegidas por `middleware.ts`.
- Onboarding corto (`/onboarding`) → guarda `Profile` y redirige a crear contenido.
- Dashboard (`/dashboard`) con saludo, últimos contenidos (vacío por ahora) e "ideas para vos".
- Pantalla "Crear contenido" (`/dashboard/create`) con textarea, estados amigables
  ("Analizando...", "Protegiendo...", "Identificando el aprendizaje...") y, al terminar, la
  pantalla de "Protección de identidad": qué dato se detectó, qué se hizo con él (eliminado /
  generalizado), el semáforo de riesgo con su disclaimer, el texto ya desidentificado y el
  aprendizaje clínico extraído.
- `/api/content/analyze` ahora ejecuta el pipeline real: llama a Claude con un único prompt
  (`analysisPrompt` en `/lib/ai/prompts/analysis.ts`), valida el JSON de salida con Zod, y
  persiste `Content` + `Analysis` + `PrivacyFlag` — **nunca el texto original**, solo el
  resultado ya desidentificado. Los datos originales detectados solo viajan en la respuesta
  HTTP de esa request (para el "momento wow" en pantalla), nunca a la base de datos.
- Límite de uso mensual por plan (`/lib/plans.ts`): FREE tiene 5 análisis y 10
  generaciones/mes; al superarlos, la API devuelve `429` con un mensaje explicando el
  límite.
- Después de la revisión de privacidad, el usuario elige **objetivo** (educar, autoridad,
  consultas, interacción, confianza) y **formato** (Reel, Carrusel, Post, Stories) y CASUS
  genera el contenido final vía `/api/content/generate`, guardándolo como `ContentVersion` y
  marcando el `Content` como `GENERADO`. Cada formato tiene su propio prompt
  (`reelGenerator`, `carouselGenerator`, `storyGenerator`, `postGenerator`) y su propio
  schema de validación, pero comparten el framing de objetivo definido una sola vez en
  `contentStrategy.ts`.
- Landing mínima en `/`.
- **Biblioteca** (`/dashboard/library`) con tabs por formato (Todos/Reels/Carruseles/Posts/
  Stories), mostrando fecha, objetivo, formato, título y estado de cada contenido. Desde ahí
  se puede **abrir** (`/dashboard/library/[id]`), **duplicar** y **eliminar** cada tarjeta sin
  salir de la lista.
- La pantalla de detalle (`/dashboard/library/[id]`) muestra el semáforo de riesgo y los datos
  protegidos (categoría + acción, nunca el valor original — ver Etapa 2), y permite **editar**
  hook/guion/caption/CTA/hashtags. Guardar no sobreescribe la versión generada por la IA: crea
  una `ContentVersion` nueva encima, así el historial queda completo.

## Cómo correrlo localmente

```bash
npm install
cp .env.example .env   # completar DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY
npx prisma migrate dev --name init
npm run dev
npm test                # corre la suite de Vitest
```

## Decisiones técnicas tomadas (sin preguntarte, por ser razonables)

- **NextAuth con proveedor de credenciales** (email + password con bcrypt), en vez de
  magic links u OAuth, porque es lo más simple para un MVP y no depende de un proveedor de
  email todavía. Fácil de sumar Google/OAuth después sin tocar el modelo de datos.
- **`profession` y `specialty` son texto, no tablas ni enums.** Así se suman psicología,
  nutrición, etc. cargando datos, sin migrar el esquema. Los prompts específicos por
  profesión van a vivir en `/lib/ai/prompts`, seleccionados en runtime según `profession`.
- **Nunca se guarda el input crudo del usuario en la base de datos.** `Content.deidentifiedInput`
  solo se llena en Etapa 2, después de pasar por desidentificación. Esto es intencional por
  la sección 13 del brief (protección de datos).
- **`AIProvider` como interfaz + `ClaudeProvider` como única implementación por ahora.**
  Ningún archivo fuera de `/lib/ai` importa el SDK de Anthropic directamente.
- **Paleta y tipografía propias** (verde petróleo + ámbar reservado solo para hallazgos de
  privacidad, Fraunces + Inter) para evitar el look genérico de IA y transmitir
  seguridad/profesionalismo clínico, como pide la sección 9.

## Qué NO está construido todavía (a propósito)

- Dictado por voz (el botón "Dictar" está deshabilitado a propósito; ver nota sobre
  `Permissions-Policy` más abajo).
- Integración de pagos (el modelo `Subscription` ya está listo para Stripe, pero no se
  conecta nada todavía).
- Panel administrativo (sección 25 del brief) — el modelo de datos ya lo permite (usuarios,
  planes, uso), pero no hay UI.
- Tests end-to-end (Playwright/Cypress) — ver el porqué en la sección de Etapa 5 más abajo.

## Qué agrega la Etapa 5

**Testing** — suite de Vitest (`npm test`) cubriendo la lógica más crítica y menos visible a
simple vista:
- `tests/json.test.ts`: que la extracción de JSON de la respuesta de la IA maneje fences
  ` ```json ` (los modelos a veces los agregan aunque se les pida no hacerlo).
- `tests/contentGeneration.test.ts`: que el schema de Carrusel rechace 6 u 8 slides (tiene
  que ser exactamente 7) y el de Stories rechace algo distinto de 4 historias — el
  guardarraíl que evita persistir una respuesta de IA malformada.
- `tests/analysis.test.ts`: que el schema de análisis acepte una detección vacía (caso sin
  datos identificables) y rechace niveles de riesgo o categorías fuera del enum esperado.
- `tests/rateLimit.test.ts` y `tests/plans.test.ts`: el limitador de uso y los topes por plan.
- `tests/errors.test.ts`: que un error interno (stack trace, nombres de archivo) nunca llegue
  tal cual al usuario.

No hay tests end-to-end todavía — para un MVP de este tamaño, el mayor riesgo estaba en la
validación de datos de IA y en la privacidad, que es justo lo que cubre esta suite. E2E es un
buen candidato a sumar cuando el flujo de pantallas se estabilice más.

**Seguridad**
- `lib/env.ts`: valida `DATABASE_URL`, `NEXTAUTH_SECRET` y `ANTHROPIC_API_KEY` al entrar a
  cualquier endpoint que dependa de IA, con un mensaje claro en los logs en vez de un error
  críptico de Prisma o del SDK a mitad de una request.
- `lib/rateLimit.ts`: rate limiting en memoria aplicado a `/api/auth/register` (por IP) y a
  `/api/content/analyze` / `/api/content/generate` (por usuario). **Importante**: es en
  memoria de un solo proceso — sirve para el MVP, pero en producción con más de una instancia
  hay que reemplazarlo por Redis/Upstash manteniendo la misma firma de `checkRateLimit`.
- Límite de longitud (4000 caracteres) en el relato que se envía a analizar, reflejado tanto
  en el frontend (contador + `maxLength`) como validado de nuevo en el backend.
- Headers de seguridad HTTP (`next.config.js`): `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`. La `Permissions-Policy` bloquea hoy `microphone`
  porque el dictado por voz no está implementado — **hay que revisarla cuando se construya
  esa función**, o el micrófono va a quedar bloqueado por el propio header.
- Todos los endpoints de contenido (`/api/content/[id]`, `/duplicate`) verifican que el
  `Content` pertenezca al usuario autenticado antes de leer, editar o borrar — no solo que
  haya sesión, sino que sea *su* contenido (sección 26: "acceso únicamente a sus propios
  contenidos").

**Navegación mobile** — este era el bug más grave que quedaba: el sidebar del dashboard
estaba oculto en mobile (`hidden md:flex`) sin ningún reemplazo, así que en un celular no
había forma de navegar entre Inicio/Crear/Biblioteca/Perfil. Se agregó `MobileNav.tsx`, una
barra inferior fija con las mismas 4 secciones, más un header simple en mobile con el logo.

**Manejo de errores y estados de carga**
- `app/error.tsx` y `app/not-found.tsx`: pantallas en español en vez de la página en blanco
  o el mensaje técnico por defecto de Next.js.
- `app/dashboard/error.tsx`: específico para fallos al cargar dashboard/biblioteca (ej. caída
  de base de datos), con botón de reintentar.
- `app/dashboard/loading.tsx` y `app/dashboard/library/loading.tsx`: skeletons mientras
  cargan los datos del servidor, en vez de una pantalla en blanco.

**Accesibilidad** — `aria-label` en los botones de solo ícono (duplicar/eliminar en la
biblioteca), un link de "saltar al contenido principal" para navegación por teclado, y
`aria-current` en la navegación mobile para indicar la sección activa.

## Decisiones técnicas de la Etapa 4

- **Editar crea una `ContentVersion` nueva, no sobreescribe la existente.** El schema ya
  estaba pensado para esto desde la Etapa 1 (ver comentario en `schema.prisma`): así queda
  historial completo y "duplicar" puede copiar limpiamente la última versión sin ambigüedad
  sobre cuál es "la" versión.
- **Duplicar no vuelve a llamar a la IA.** Copia `Content` + la última `ContentVersion` tal
  cual, incluyendo el `raw` completo. Es una operación de base de datos, no de IA — más rápida
  y no consume el límite de generaciones del plan.
- **El campo `script` guarda formatos distintos según el tipo de contenido** (texto plano para
  Reel/Post, JSON de un array para Carrusel/Stories). El editor lo convierte a líneas
  separadas para editar y lo vuelve a serializar al guardar, para no tener que agregar
  columnas nuevas por formato.

## Decisiones técnicas de la Etapa 3

- **La "estrategia de contenido" no es una llamada aparte a la IA.** El brief la sugiere como
  un prompt separado antes de generar; acá cada generador de formato (Reel/Carrusel/Post/
  Stories) importa la guía por objetivo desde `contentStrategy.ts` y la aplica dentro de su
  propio prompt, porque el ángulo correcto depende del formato final, no solo del objetivo —
  encadenar dos llamadas hubiera duplicado costo sin mejorar el resultado.
- **Cada formato tiene su propio schema Zod** (`reelSchema`, `carouselSchema`,
  `storiesSchema`, `postSchema`) en vez de un schema genérico laxo, para que un carrusel con
  6 slides en vez de 7, por ejemplo, se rechace como `invalid_response` antes de llegar al
  usuario, no después.
- **`ContentVersion` normaliza los 4 formatos a las mismas columnas** (`hook`, `script`,
  `caption`, `cta`, `hashtags`) para que la futura Biblioteca (Etapa 4) pueda listar y
  previsualizar cualquier formato sin lógica condicional pesada; el JSON completo y sin
  normalizar queda igual en la columna `raw` por si hace falta reconstruir la vista original.

## Decisiones técnicas de la Etapa 2

- **Un solo prompt para detección + desidentificación + riesgo + aprendizaje**, en vez de 4
  llamadas separadas a la IA. Las cuatro tareas dependen del mismo análisis del texto;
  encadenarlas multiplicaría costo y latencia sin beneficio real para el MVP.
- **El texto original nunca toca la base de datos.** `rawInput` vive solo en memoria durante
  la request a `/api/content/analyze`. Lo que se persiste es `deidentified_text`. Los
  `original_excerpt` que el usuario ve en pantalla (el "momento wow") viajan únicamente en la
  respuesta HTTP de esa request — el modelo `PrivacyFlag` ni siquiera tiene una columna para
  guardarlos.
- **Límite de uso ya funciona de punta a punta** (aunque no haya pagos todavía): cada plan
  tiene un tope de análisis/mes en `/lib/plans.ts`, y el endpoint devuelve `429` con un
  mensaje claro al superarlo.

## Riesgos técnicos a tener en cuenta

- El rate limiter de la Etapa 5 es en memoria (un `Map` por proceso). Funciona para el MVP en
  un solo servidor, pero si CASUS corre en más de una instancia (por ejemplo, autoscaling),
  cada instancia va a tener su propio contador y el límite real efectivo será más alto que el
  configurado. Migrar a Redis/Upstash antes de escalar horizontalmente.
- `RiskLevel` hoy es un enum simple (BAJO/REVISAR/ALTO). Si la IA necesita matices
  intermedios más adelante, migrar el enum es una migración de datos, no solo de esquema —
  vale la pena confirmarlo antes de escalar el semáforo.
- El prompt de análisis pide JSON estricto y se valida con Zod, pero un modelo de lenguaje
  puede eventualmente devolver un JSON malformado; el pipeline ya lo maneja como error
  `invalid_response` (mensaje amigable, no se guarda nada), pero conviene loguear estos casos
  para ajustar el prompt con el tiempo.
- No hay reintento automático ante timeout/rate limit todavía — el usuario tiene que tocar
  "Analizar con CASUS" de nuevo. Vale la pena para Etapa 5 (testing/optimización).
- El post generado hoy no se puede editar ni volver a ver fuera de esta pantalla — como la
  Biblioteca (Etapa 4) todavía no existe, una vez que el usuario navega afuera de
  `/dashboard/create`, el contenido generado sigue en la base de datos pero no hay UI para
  volver a verlo. Es el próximo problema a resolver.
- La edición de Carrusel/Stories como "una línea por slide/historia" es simple pero rígida:
  si en el futuro un slide necesita saltos de línea internos, hay que cambiar el separador.
  No es un problema para el MVP, pero vale la pena tenerlo presente antes de escalar.
- No hay confirmación de "¿seguro que querés salir sin guardar?" en el editor — si alguien
  edita y navega afuera sin tocar "Guardar cambios", pierde la edición en curso. Candidato
  para la Etapa 5.
