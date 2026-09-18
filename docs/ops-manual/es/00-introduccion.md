---
title: Introducción: cómo funciona California Tenant Law con CTL OS
role: todo el personal
part: I
version: 0.1.0
updated: 2026-09-18
summary: Qué es CTL OS, cómo se organiza este manual en nueve partes, cómo funciona una lección (en persona y luego en el software) y cómo practicar sin riesgo como usuario demo.
---

# Introducción: cómo funciona California Tenant Law con CTL OS

California Tenant Law representa inquilinos, y solo inquilinos, desde 1980, por teléfono y video en toda California, vendiendo el trabajo legal por piezas para que el cliente controle el costo, y enseñando primero con videos gratuitos y el Tablero de Juego del Desalojo (Unlawful Detainer Game Board). CTL OS es el único software que ahora lo hace funcionar todo: el sitio público y la tienda, la app del cliente, la recepción, los espacios de trabajo de abogados y asistentes, los tableros del dueño, el portal del abogado contrario, las comunicaciones, los documentos y el papel de alegatos, el sistema de aprendizaje y este manual.

Está leyendo el manual dentro de ese software. Donde un capítulo muestra un precio, un plazo, un artículo de ley o una oficina, el bloque azul **en vivo** lee el valor real de hoy desde el sistema, no un número que alguien escribió hace meses. Si un bloque en vivo dice "no verificado", la regla detrás aún no ha sido revisada por un abogado (ver Parte IX, capítulo 91, y `docs/legal/README.md`).

## Cómo se organiza el manual

{{routes:manual}}

| Parte | Para | Qué aprende |
| --- | --- | --- |
| I Recepción | recepción, todos | el día en el mostrador, teléfonos y la línea directa, pagos |
| II Admisión y consultas | recepción, abogados | el formulario de admisión, la agenda, la consulta con su grabación y resumen, clientes que regresan |
| III Trabajo de casos por etapa del tablero | abogados, asistentes | un capítulo por fase del tablero, desde la notificación hasta la apelación |
| IV Discovery | abogados, asistentes | reunir documentos, evidencia de correo y mensajes, nuestro discovery y el de ellos, mociones para obligar, la carpeta |
| V Documentos y alegatos | asistentes, abogados | plantillas por etapa, ensamblado, papel de alegatos en CTL OS, edición conjunta, firma electrónica |
| VI Aprendizaje del cliente | todos | el currículo de videos, qué ha visto un cliente, contenido a lo largo del caso |
| VII Dueño y finanzas | dueño | radar de trabajo atrasado, asignaciones, ingresos, la red de abogados, precios y hojas de ruta de costos |
| VIII Marketing | marketing, dueño | prospectos, calendario de contenido, páginas por ciudad, reseñas |
| IX Uso de CTL OS | todos | el hub, roles y modo desarrollador, anotaciones, idiomas, el appliance |

## Cómo funciona una lección

Cada capítulo tiene dos secciones. **En persona** es lo que un colega le muestra en el mostrador o en una llamada. **En CTL OS** es la misma tarea en el software, con capturas en las que puede hacer clic para abrir la página real. Cuando haya hecho ambas, pulse los dos botones del encabezado del capítulo; el sistema registra su avance para que el dueño vea quién ha aprendido qué.

> EN PERSONA: Siéntese con la persona que hace esta tarea hoy y observe un caso real antes de leer los pasos del software.

> EN CTL OS: Abra el hub, elija su rol, apague el modo desarrollador y siga el capítulo con la página real abierta al lado.

## Practicar sin riesgo

Hasta que existan cuentas reales, el hub permite entrar como cualquier **usuario demo**: una persona ficticia de recepción, un abogado, un asistente, el dueño, marketing, un cliente o un abogado contrario. Nada de lo que haga como usuario demo toca un caso real. Los datos demo se regeneran solos; si algo queda desordenado, el inspector de datos en las herramientas de desarrollo lo reinicia.

{{demo-users}}

## El tablero es el flujo de trabajo

Cada caso en CTL OS está en un nodo del Tablero de Juego del Desalojo. "¿Dónde estamos?" lo responde el tablero, "¿qué sigue?" sus aristas, "¿qué presentamos?" los documentos ligados al nodo, "¿cuánto cuesta?" las bandas de costo y "¿cuándo vence?" el motor de plazos, que cita el artículo de ley de cada fecha. La Parte III recorre el tablero fase por fase.

{{board:phase:start}}

> DECISIÓN PENDIENTE: ¿Quién en el bufete verifica las reglas legales (fija `verified_on`) para que el motor de plazos las trate como vigentes? Hasta entonces cada plazo muestra "no verificado".
