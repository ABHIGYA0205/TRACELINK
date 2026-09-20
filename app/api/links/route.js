import { backendFetch } from "@/lib/backend";

function requestHeaders(request, json = false) {
  const headers = {};
  const cookie = request.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export async function GET(request) {
  try {
    const response = await backendFetch("/api/links", { cache: "no-store", headers: requestHeaders(request) });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Links proxy error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Backend server is unavailable",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const response = await backendFetch(
      "/api/links",
      {
        method: "POST",
        headers: requestHeaders(request, true),
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "TraceLink proxy error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Backend server is unavailable",
      },
      {
        status: 500,
      }
    );
  }
}
