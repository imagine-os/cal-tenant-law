---
title: Usar CTL OS: roles, modo desarrollador, anotaciones e idiomas
role: all staff
part: IX
version: 0.1.0
updated: 2026-09-18
summary: Cómo entrar al sistema como tú o como cualquier rol, qué muestra el modo desarrollador, cómo reportar un error o pedir un cambio desde dentro del producto y cómo funciona el interruptor de idioma.
---

# Usar CTL OS: roles, modo desarrollador, anotaciones e idiomas

CTL OS es una sola aplicación con muchas superficies. Lo que ves lo decide tu rol, nunca el enlace que abriste. Este capítulo es cómo moverte por él y cómo avisarnos cuando algo está mal: desde dentro del producto, en la pantalla donde falló.

> IN PERSON: Pide a alguien que abra el centro en su pantalla y entre como tres roles distintos mientras observas cómo cambia el menú.

## Quién eres

Cada rol tiene un inicio, un menú filtrado a lo que puede hacer y un conjunto de permisos. Una página nunca pregunta «¿esta persona es abogado?»; pregunta si puede hacer la acción. Por eso la misma pantalla de caso puede ser segura para recepción y completa para el abogado.

{{roles}}

Mientras no existan cuentas reales, el centro permite a un superadministrador **ver como** cualquier rol con un usuario demo ficticio. Los guardias siguen siendo reales: solo la identidad es simulada. Si una página dice que no está disponible para tu rol, ese es el guardia funcionando, no un error.

## Modo desarrollador

El modo desarrollador (solo superadministrador) convierte el producto en su propia herramienta de construcción. Activado, cada página muestra su ficha de especificación en la esquina, `Ctrl + .` abre el inspector (especificación, tablas, reglas, componentes, acciones) y todo control aún no conectado muestra borde discontinuo y una etiqueta. Apagado ves exactamente lo que ve el bufete. Las capturas del manual se toman con él activado, así que una imagen puede mostrar marcadores que tú no tienes.

## Anotaciones: cómo reportar un error o pedir un cambio

Usa el botón de comentarios en cualquier página del equipo. Elige el elemento, escribe qué notaste y elige el tipo:

- **comentario** — una observación, sin acción esperada
- **petición** — por favor cambien esto
- **error** — esto está roto

El registro guarda quién eres, tu rol, el código de página, la ruta, el elemento, el ancho de la ventana, el tema y una captura, para que nadie tenga que preguntar «¿dónde estabas y de qué ancho era tu ventana?». Después un agente lo revisa y **registra la decisión en tu fila antes de cambiar nada**, así puedes ver si se aceptó y por qué. Una nota de contenido legal de un abogado es autoridad para la memoria legal; una nota de un cliente de prueba es señal, no instrucción.

[screenshot: HUB-01 — El centro: elegir rol, modo desarrollador, idioma]

## Idiomas

Inglés y español están desde el inicio; el interruptor está en todas las superficies y recuerda tu elección. Un texto sin español todavía cae a inglés en vez de romperse: es una brecha, nunca un bloqueo. La app del cliente y los subtítulos de los videos reciben el primer llenado en español, porque ahí nos encuentran los clientes hispanohablantes del bufete. Los términos legales conservan el término inglés entre paréntesis la primera vez.

## Dónde trabaja recepción

Como ejemplo de una superficie, estas son las pantallas de recepción, leídas de la app en marcha:

{{routes:frontdesk}}

> IN CTL OS: Activa el modo desarrollador, abre cualquier página, pulsa `Ctrl + .` y lee las acciones de esa página. Esas frases son también lo que aceptará el controlador de voz.

> DECISIÓN PENDIENTE: Si el equipo debe poder dejar anotaciones mientras ve como otro rol, o solo como sí mismo.
