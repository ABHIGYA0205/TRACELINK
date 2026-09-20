import { backendFetch } from "@/lib/backend";

const actions = new Set(["signup", "login", "logout", "me"]);

async function proxy(request, params) {
  const { action } = await params;
  if (!actions.has(action)) return Response.json({ success: false, message: "Not found" }, { status: 404 });
  const headers = {};
  const cookie = request.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  const options = { method: request.method, headers };
  if (request.method !== "GET") {
    headers["Content-Type"] = "application/json";
    options.body = action === "logout" ? "{}" : JSON.stringify(await request.json());
  }
  const response = await backendFetch(`/api/auth/${action}`, options);
  const result = Response.json(await response.json(), { status: response.status });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) result.headers.set("set-cookie", setCookie);
  return result;
}

export async function GET(request, { params }) { try { return await proxy(request, params); } catch { return Response.json({ success: false, message: "Backend server is unavailable" }, { status: 500 }); } }
export async function POST(request, { params }) { try { return await proxy(request, params); } catch { return Response.json({ success: false, message: "Backend server is unavailable" }, { status: 500 }); } }
