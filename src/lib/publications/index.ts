/**
 * Publication Utilities
 *
 * External API clients and DOI lookup services.
 */

export { lookupDoi, type DoiLookupResult } from "./doi-lookup";
export { fetchFromOpenAlex } from "./openalex";
export { fetchFromCrossref } from "./crossref";
export { type PublicationMetadata, normalizeDoi } from "./shared";
