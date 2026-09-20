import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    // The redirect route runs server-side, so explicitly preserve the browser
    // request metadata that Express uses for analytics.
    const headers = {};
    ["user-agent", "referer", "x-forwarded-for", "x-real-ip", "x-forwarded-proto", "x-forwarded-host"].forEach((name) => {
      const value = request.headers.get(name);
      if (value) headers[name] = value;
    });

    const response = await backendFetch(
      `/api/redirect/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return new NextResponse(
        "TraceLink not found",
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();

    if (!data.destination) {
      return new NextResponse(
        "Destination not found",
        {
          status: 500,
        }
      );
    }

    return NextResponse.redirect(
      data.destination
    );
  } catch (error) {
    console.error(
      "Redirect error:",
      error
    );

    return new NextResponse(
      "Something went wrong",
      {
        status: 500,
      }
    );
  }
}
