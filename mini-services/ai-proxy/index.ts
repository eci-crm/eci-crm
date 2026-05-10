/**
 * AI Proxy Service
 * Proxies requests from the Caddy gateway to the z-ai API at 172.25.136.193:8080
 * This allows Vercel to access the AI API through the sandbox gateway.
 *
 * Usage from Vercel:
 *   AI_API_BASE_URL=https://<gateway-host>/v1?XTransformPort=3030
 */

const ZAI_BASE_URL = "http://172.25.136.193:8080/v1";
const PORT = 3030;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Chat-Id, X-Token, X-User-Id, X-Z-AI-From",
        },
      });
    }

    const url = new URL(req.url);
    const targetPath = url.pathname + url.search;

    // Only proxy to /v1/* endpoints
    if (!targetPath.startsWith("/v1/")) {
      return new Response(JSON.stringify({ error: "Only /v1/* paths are proxied" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Forward the request to the z-ai API
      const targetUrl = `http://172.25.136.193:8080${targetPath}`;

      // Clone headers, filtering out host
      const headers = new Headers();
      for (const [key, value] of req.headers.entries()) {
        const lower = key.toLowerCase();
        if (lower === "host") continue;
        headers.set(key, value);
      }

      // Ensure X-Z-AI-From is set
      if (!headers.has("X-Z-AI-From")) {
        headers.set("X-Z-AI-From", "Z");
      }

      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      });

      // Return the response with CORS headers
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Proxy error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to reach AI API" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});

console.log(`🤖 AI Proxy running on port ${PORT}`);
console.log(`   Proxying to ${ZAI_BASE_URL}`);
