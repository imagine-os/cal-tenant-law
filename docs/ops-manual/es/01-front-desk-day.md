---
title: Un día en recepción
role: front desk, all staff
part: I
version: 0.1.0
updated: 2026-09-18
summary: El turno completo en orden: abrir el día, tomar una admisión a alguien asustado, reservar la consulta, cobrar y entregar el caso al abogado.
---

# Un día en recepción

Recepción es donde el inquilino conoce a California Tenant Law. Casi todos los que llaman están asustados y con poca información: hay un aviso pegado en la puerta, entregaron una citación a un vecino, o un aviso del sheriff dice cinco días. Tu trabajo en los dos primeros minutos es que la persona sienta que esto es un proceso con reglas, que nosotros conocemos las reglas y que está en el lugar correcto. Todo lo demás en esta página es procedimiento.

> IN PERSON: Siéntate con quien atiende recepción hoy y toma tres llamadas con esa persona antes de tomar una sola. Escucha cómo baja el ritmo de la llamada.

## En persona

**Abre el día.** Mira qué está esperando: formularios de admisión que llegaron de noche, consultas reservadas para hoy, pagos que no se completaron y mensajes sin responder. Lee la franja de plazos antes que el correo: un plazo de respuesta que vence hoy manda sobre todo lo demás.

**Toma la llamada.** Consigue, en este orden: nombre y mejor teléfono, la ciudad del alquiler (decide la oficina y qué ordenanzas locales importan), qué papel tiene en la mano y la fecha en que lo entregaron o lo pegaron. Las fechas son el caso entero. Si no sabe la fecha, pide las fechas del propio papel y anota cuál es cuál.

**Nunca des asesoría legal.** No eres el abogado y no contestas «¿tengo que irme?». Dices qué hacemos, cuánto cuesta una consulta y cuándo hay hueco. Si insisten, la respuesta honesta es la útil: «un abogado tiene que ver sus papeles antes de que alguien le diga qué opciones tiene».

**Reserva la consulta.** Las consultas son con abogado con licencia, por teléfono o video, prepagadas y con tiempo limitado. Pide que vea primero los videos gratuitos: no es una excusa, es la razón de que nuestras consultas sean cortas y útiles. Envía el enlace del formulario y confirma el horario en la misma llamada.

**Cobra una sola vez.** Un pago, un recibo, un registro en el caso. Si un pago falla, no vuelvas a pasar la tarjeta a ciegas: revisa si el primer intento entró.

**Entrega el caso.** Una consulta reservada pero sin preparar es media hora perdida. Antes de que el abogado la abra, el caso necesita los papeles subidos, las fechas escritas y la ciudad puesta.

## En CTL OS

Estas son las pantallas donde vive recepción. La lista se lee de la app en marcha, así que nunca queda desactualizada:

{{routes:frontdesk}}

La ciudad de la admisión decide la oficina; las oficinas, su cobertura y su zona horaria vienen del sistema, no de una lista en la pared:

{{offices}}

[screenshot: F-01 — Recepción hoy: cola de admisión, consultas y pagos]

Los precios no se escriben en este manual. Un precio vive en el catálogo y recepción lo lee en la pantalla del pedido:

{{pricing:consultations}}

> IN CTL OS: Entra como el usuario demo de recepción con el modo desarrollador apagado y lleva a una persona imaginaria desde la admisión hasta la consulta pagada. Nada de lo que hagas como usuario demo toca un caso real.

## Lo que nunca se escribe a mano

Plazos, precios, números de ley y direcciones de oficina nunca se escriben en un capítulo, una nota ni un correo. Cada uno tiene un único hogar en el sistema y la pantalla muestra el valor actual con su estado de verificación. Un plazo que la app no puede citar es un plazo que en este bufete nadie dice en voz alta.

> DECISIÓN PENDIENTE: Qué superficie de pago usa recepción antes de conectar Stripe: el enlace de la tienda actual o una fila de recibo manual en CTL OS.

> DECISIÓN PENDIENTE: Quién cubre recepción en las oficinas sin recepción propia (reglas de cobertura por oficina).
