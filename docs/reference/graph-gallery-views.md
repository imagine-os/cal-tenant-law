# graph-gallery views and what each is for in CTL OS

Source: `imagine-os/graph-gallery` (22 static demos, vanilla ES modules, D3 7.9 and three.js 0.186 from pinned CDN import maps, shared datasets `shared/org.json` and `shared/system.json`, dependency-free HUD `shared/hud.js`). Justin: "the Objects 3D map, and other maps from this library can be useful. lanes skill-tree and radial tree are good too. I always like Object views so that it's more clear what each node actually is based on its icon or preview of what it is." Study details in the study report §4. Licence: imagine-os's own work (no LICENSE file; internal reuse fine); third-party D3 (ISC), three.js (MIT); avoid Cosmograph (CC-BY-NC) and Neo4j NVL (proprietary). CDN URLs in the gallery were derived offline and must be verified once online.

## The four views

| View | Demo | Mechanism | Data shape |
| --- | --- | --- | --- |
| **Radial tree** | `demos/radial-tree-d3/` (D3 SVG, 171 lines) | `d3.hierarchy` per department with angular sectors proportional to leaf count, rings by depth, `d3.linkRadial`, sector arcs and `<textPath>` labels, typed glyphs via `d3.symbol()`, collapse / expand, hover dims, zoom | `org.json` tree `{ id, type, label, children[] }` |
| **Lanes skill-tree** | `demos/lanes-skilltree/` (D3 SVG, 188 lines) | One horizontal swimlane per department; fixed columns by type; leaves wrapped into columns x rows; `d3.linkHorizontal` edges tinted by lane; rails between siblings; skills draw level ticks; toggles spread / collapse; scroll pans, ctrl+wheel zooms; keyed joins with tweens | `org.json` nodes with `department`, `level`, `status` |
| **Objects 3D** | `demos/three-objects-3d/` (three.js + GLTFLoader + OrbitControls + GLTFExporter, 203 lines) | Every node is its `.glb` model by type (or procedural fallback), logo / thumbnail painted as a `CanvasTexture` plaque, ground plane with depth bands by type refined by a small 2D relaxation, relation-styled tube / dashed edges with arrow cones, always-visible sprite labels, hover card, click fly-to, glTF export | `system.json` `{ meta: { type_models, relation_styles }, nodes: [{ id, type, label, icon, thumb, ... }], links, groups }` |
| **Radial 3D** | `demos/three-radial-3d/` (three.js + bloom + InstancedMesh) | Centre sphere, department limbs on octahedral directions, project cones, instanced typed glyph leaves, tinted tube edges, fog, auto-orbit | `org.json` |

Also useful: **Business Sunburst** (`demos/sunburst-business/`, D3 partition with drill-down and diverging colour) for the owner's revenue by stage / SKU / attorney.

## Where each view goes in CTL OS

| CTL OS surface | View | Why | Task |
| --- | --- | --- | --- |
| **Client binder / documents map** (C-20, L-31) | **Objects 3D** (with a 2D objects fallback) | Every document is an object you recognise (pleading stack, photo, text-message bubble, receipt, court form) with its thumbnail on the plaque; depth bands = board stage; edges = "supports", "served on", "responds to". Justin's preference for object views is strongest here. | T-070, T-076 |
| **Game board 3D** (GB-04) | **Objects 3D** pattern: nodes as objects by kind (document, hearing gavel, outcome flag), paths as relation-styled tubes with the five KEY colours, phases as ground bands | The board "turned into something more three-dimensional and more complete"; the same `nodes.json` drives 2D and 3D. | T-076 |
| **Case timeline by actor** (L-12) | **Lanes skill-tree** | One lane per actor (tenant, landlord, court, opposing counsel), columns by time or board phase, documents and hearings as typed glyphs, rails between related filings; scroll pans time. | T-057 |
| **Map of the law** (K-10) | **Radial tree** | Codes -> titles -> sections -> remedies as a hierarchy; sector per topic (`topics/*.md`); collapse / expand; verified rows solid, unverified hollow; a law-change entry pulses its sector. | T-049 (basic), later pass |
| **Dependency graph of the plan** (PM-04) | **Lanes** (lane per plan lane, column per pass) and **Radial** (passes as rings) with object icons per deliverable kind (page, script, doc, schema) | Justin asked for the dependency graph as an object view so each node is clear from its icon / preview. | T-031 |
| **Radial 3D** | Owner's network view (offices -> attorneys -> cases) as a later showpiece; not in the first passes | | Pass 6+ |
| **Sunburst** | Revenue by stage / SKU / attorney (O-20) | | T-081 |

## Rules when porting

- Libraries only from cdnjs / jsDelivr pins or npm dependencies (D3, three); wrap each view as a library **organism** with a meta (P-07): `RadialTree`, `LanesTree`, `ObjectsScene`, each taking typed props, never a page-local script.
- Every view has a **2D or list fallback** and full **keyboard navigation** (arrow keys between connected nodes, Enter opens) plus zoom buttons (P-03, P-04); 3D is progressive enhancement.
- Node types map to the design tokens (`type_colors` -> token names), never to hard-coded hex.
- Datasets come from the `DataProvider` (`useTable`) and are shaped into the gallery's `org.json` / `system.json` forms by pure adapter functions with tests.
- `hud.js` patterns (legend, toggles, tooltip, `H` hides chrome for screenshots) become library molecules.

## Resumen en español

Las cuatro vistas de graph-gallery y su uso en CTL OS: Objects 3D (nodos como objetos reconocibles con miniatura) para la carpeta de documentos del cliente y el tablero en 3D; lanes skill-tree (carriles) para la línea de tiempo del caso por actor; radial tree para el mapa de la ley por tema; y para el grafo de dependencias del plan, carriles y radial con iconos por tipo de entregable. Reglas: cada vista es un componente de la biblioteca con meta, con alternativa 2D o lista, navegación por teclado y botones de zoom; colores desde tokens; datos desde el `DataProvider`.
