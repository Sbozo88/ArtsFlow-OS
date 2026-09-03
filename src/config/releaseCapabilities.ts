export const releaseCapabilities = Object.freeze({
  // The guardian UI remains in the codebase, but it must stay unavailable
  // until invitation acceptance and every portal read are enforced by a
  // relationship-scoped server-side design with emulator coverage.
  guardianPortal: false,
  learnerSelfService: false,
});
