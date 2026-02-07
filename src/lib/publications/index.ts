/**
 * Publication Utilities
 *
 * External API clients, DOI lookup, and sync services.
 */

export { lookupDoi, type DoiLookupResult } from "./doi-lookup";
export { syncDoi, type DoiSyncResult } from "./doi-sync";
export { fetchFromOpenAlex, fetchSyncFromOpenAlex } from "./openalex";
export { fetchFromCrossref, fetchCitationsFromCrossref } from "./crossref";
export {
  type PublicationMetadata,
  type SyncMetadata,
  type AuthorInfo,
  normalizeDoi,
  SYNC_DELAY,
} from "./shared";
