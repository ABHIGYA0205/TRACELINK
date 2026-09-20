const developmentBackendUrl = "http://localhost:5001";

export function getBackendUrl() {
  return (process.env.BACKEND_URL || developmentBackendUrl).replace(/\/$/, "");
}

export async function backendFetch(path, options = {}) {
  return fetch(`${getBackendUrl()}${path}`, options);
}
