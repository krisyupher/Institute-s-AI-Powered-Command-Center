/**
 * Runtime configuration for the SPA.
 *
 * `apiBaseUrl` points at the ASP.NET Core API's HTTP profile
 * (`backend/AiInstituteManager.API/Properties/launchSettings.json`). The HTTPS profile
 * (7083) works too, but only after `dotnet dev-certs https --trust`.
 */
export const environment = {
  production: false,

  apiBaseUrl: 'http://localhost:5218',

  /**
   * Ticket 2.3 stopgap. Backend Tickets 2.1/2.2 (JWT + `AuthController`) are not built
   * yet, so `POST /api/auth/login` does not exist. While this is `true`, a failed login
   * request falls back to a locally minted, UNSIGNED mock token so the app stays usable
   * end to end and the interceptor has a real token to attach.
   *
   * Flip to `false` the moment `/api/auth/login` is live — nothing else needs to change.
   */
  useMockAuth: true,
};
