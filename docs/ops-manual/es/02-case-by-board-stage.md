---
title: El caso, fase por fase en el tablero
role: attorney, paralegal
part: III
version: 0.1.0
updated: 2026-09-18
summary: Qué hace el equipo en cada fase del tablero del desalojo, quién mueve y en qué pantalla se trabaja.
---

# El caso, fase por fase en el tablero

El tablero del desalojo (Unlawful Detainer Game Board) no es un póster que regalamos: es el flujo de trabajo. Cada caso está en un nodo. «¿Dónde estamos?» lo responde el nodo; «¿qué sigue?», los caminos que salen de él; «¿qué presentamos?», los documentos ligados al nodo; «¿cuánto costará?», las bandas de costo de cada camino; y «¿cuándo vence?», el motor de plazos, que cita una fila de ley para cada fecha que produce.

> IN PERSON: Imprime el tablero una vez, pon un caso encima con una moneda y recorre con ella un caso que terminó el año pasado, junto al abogado que lo llevó.

## Las diez fases

Las fases son las secciones del propio tablero, en su orden. Las etiquetas son literales del póster; los datos están en `../../game-board/nodes.json` y la transcripción en `../../game-board/README.md`.

| # | Fase | Quién mueve primero | Qué hace el equipo |
| --- | --- | --- | --- |
| 1 | START / notificación | el arrendador y el notificador | Leer el aviso y la demanda; evaluar si la notificación fue buena o mala; los ocupantes sin nombrar presentan su reclamo; los inquilinos por ejecución hipotecaria valoran el traslado a federal |
| 2 | Motion To Quash | nosotros | Notificación mala: presentar la moción, trabajar la audiencia, volver a notificar si se concede, petición de writ si se niega |
| 3 | Traslado a corte federal / Petición | nosotros | Solo inquilinos por ejecución hipotecaria: traslado, devolución al estado o la corte federal ve el caso; la columna de peticiones tiene el writ y el traslado |
| 4 | Demurrer | nosotros | Atacar la demanda misma; oponerse al ex parte para acortar plazos; contestar si se rechaza; desestimación o demanda enmendada si se acoge |
| 5 | Rebeldía (Default) | el secretario del juzgado | Cuatro formas de entrar (sin notificación, sin respuesta, plazo perdido, secretario mal informado); primero la suspensión ex parte, luego anular o relevo de la rebeldía |
| 6 | Discovery | nosotros | Solicitudes de admisión, interrogatorios y de producción; reunión y acuerdo; moción para obligar y posponer el juicio; compilar para el juicio |
| 7 | Juicio sumario | el arrendador | Preparar, presentar y notificar la oposición; audiencia; al juicio si se niega, a apelación si se concede |
| 8 | JUICIO | el juzgado | Pedir jurado; preparar escritos, testigos y pruebas; conferencias previas; juicio; ganar, desestimación, acuerdo — o sentencia, writ y desalojo |
| 9 | APELACIÓN | nosotros | Aviso de apelación y expediente; suspensión durante la apelación; alegatos; audiencia; writ de mandamus si se pierde |
| 10 | Resultados | — | Las casillas finales: desestimado, acuerdo en nuestros términos, quedarse y demandar al arrendador, o mudarse |

## Quién hace qué en cada fase

El patrón se repite, y son los mismos cuatro pasos en cualquier fase:

1. **El abogado decide el movimiento.** Qué camino sale del nodo y por qué. La decisión se registra en el caso, no en la cabeza de alguien.
2. **El asistente legal prepara el documento** desde la plantilla ligada al nodo, con los datos del caso y el plazo calculado por el motor.
3. **El abogado revisa y firma.** Nada sale del bufete sin revisión; el asistente de redacción nunca presenta nada por sí solo.
4. **Recepción avisa al cliente** qué pasó, en lenguaje claro, en su idioma, y para qué es el siguiente pago.

## En CTL OS

Las pantallas de los abogados, leídas de la app en marcha:

{{routes:counsel}}

[screenshot: GB-01 — El tablero con un caso colocado]

Cada regla que usamos lleva su autoridad y si ha sido verificada. Nada de lo siguiente es asesoría legal verificada hasta que un abogado ponga la fecha de verificación:

{{rules:ud_procedure}}

> IN CTL OS: Abre el tablero, coloca el caso demo y avánzalo un nodo. Lee el plazo que produce y entra a la fila de ley que lo respalda.

> DECISIÓN PENDIENTE: Las aristas del tablero se reconstruyeron del diseño del póster; el bufete debe confirmar las ambiguas antes de que el motor de plazos trate un camino como regla.
