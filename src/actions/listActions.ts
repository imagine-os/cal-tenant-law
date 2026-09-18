import { getRoutes } from '../app/registry';
import { catalogActions, hasHandler, type ActionCatalogEntry } from './bus';

export interface ActionListing extends ActionCatalogEntry { live: boolean }

/** Every action in the app (the WebMCP / voice vocabulary) with whether a page currently serves it. Call inside functions, never at module top level. */
export function listActions(): ActionListing[] {
  return catalogActions(getRoutes()).map((e) => ({ ...e, live: hasHandler(e.def.id) }));
}
