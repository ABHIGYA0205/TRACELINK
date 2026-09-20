import { backendFetch } from "@/lib/backend";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const response = await backendFetch(
      `/api/links/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
        headers: request.headers.get("cookie") ? { cookie: request.headers.get("cookie") } : {},
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Analytics proxy error:", error);

    return Response.json(
      {
        success: false,
        message: "Backend server is unavailable",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    const headers = request.headers.get("cookie") ? { cookie: request.headers.get("cookie") } : {};
    const response = await backendFetch(`/api/links/${encodeURIComponent(slug)}`, { method: "DELETE", headers });
    return Response.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("Delete proxy error:", error);
    return Response.json({ success: false, message: "Backend server is unavailable" }, { status: 500 });
  }
}
