/**
 * Runtime configuration for the SPA.
 *
 * `apiBaseUrl` points at the ASP.NET Core API's HTTPS profile
 * (`backend/AiInstituteManager.API/Properties/launchSettings.json`). The API calls
 * `UseHttpsRedirection()`, so the HTTP profile (5218) 307-redirects every request to this
 * one anyway — hitting it directly avoids sending CORS preflights through that redirect,
 * which browsers don't reliably follow. Requires `dotnet dev-certs https --trust` once per
 * machine (already done if Swagger loads without a cert warning at
 * https://localhost:7083/swagger).
 */
export const environment = {
  production: false,

  apiBaseUrl: 'https://localhost:7083',
};
