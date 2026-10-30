const encoder = new TextEncoder();
const LOGIN_ATTEMPTS = new Map();
const MAX_LOGIN_ATTEMPTS = 6;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const SESSION_SECONDS = 2 * 60 * 60;
const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024;

function corsHeaders(request, env) {
  const headers = new Headers({
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  if (request.headers.get("Origin") === env.SITE_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", env.SITE_ORIGIN);
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
    headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, ETag");
    headers.set("Access-Control-Max-Age", "600");
  }
  return headers;
}

function json(request, env, data, status) {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status: status || 200, headers: headers });
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function createSession(env) {
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({
    sub: "owner",
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  })));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(env.SESSION_SECRET), encoder.encode(payload));
  return payload + "." + base64UrlEncode(new Uint8Array(signature));
}

async function isOwner(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ") || !env.SESSION_SECRET) return false;
  const token = authorization.slice(7);
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const key = await hmacKey(env.SESSION_SECRET);
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(parts[1]), encoder.encode(parts[0]));
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    return payload.sub === "owner" && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch (_) {
    return false;
  }
}

async function passwordMatches(password, expectedHex) {
  if (!expectedHex || !/^[a-f0-9]{64}$/i.test(expectedHex)) return false;
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  const actual = Array.from(new Uint8Array(digest)).map(function (v) {
    return v.toString(16).padStart(2, "0");
  }).join("");
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= actual.charCodeAt(i) ^ expectedHex.toLowerCase().charCodeAt(i);
  return difference === 0;
}

function requestIsFromSite(request, env) {
  return request.headers.get("Origin") === env.SITE_ORIGIN;
}

function safeName(value) {
  const name = String(value || "video").normalize("NFKC")
    .replace(/[\/\\\u0000-\u001f\u007f]/g, "_")
    .replace(/[^\p{L}\p{N}._() -]/gu, "_")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 150);
  return name || "video";
}

function allowedVideo(name, type) {
  const extension = String(name).toLowerCase().split(".").pop();
  const allowed = ["mp4", "webm", "mov", "m4v", "mkv", "avi", "ogv", "3gp"];
  return allowed.includes(extension) || String(type || "").toLowerCase().startsWith("video/");
}

function contentTypeFor(type, name) {
  if (String(type || "").toLowerCase().startsWith("video/")) return type;
  const ext = String(name).toLowerCase().split(".").pop();
  const types = {
    mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm",
    mov: "video/quicktime", mkv: "video/x-matroska",
    avi: "video/x-msvideo", ogv: "video/ogg", "3gp": "video/3gpp"
  };
  return types[ext] || "application/octet-stream";
}

function cleanKey(value) {
  const key = String(value || "");
  if (!key.startsWith("videos/") || key.includes("..") || key.includes("\\") || key.length > 240) return "";
  return key;
}

async function requireOwner(request, env) {
  if (!requestIsFromSite(request, env)) {
    return json(request, env, { error: "Request origin is not allowed." }, 403);
  }
  if (!(await isOwner(request, env))) {
    return json(request, env, { error: "Owner login is required." }, 401);
  }
  return null;
}

async function login(request, env) {
  if (!requestIsFromSite(request, env)) return json(request, env, { error: "Request origin is not allowed." }, 403);
  if (!env.ADMIN_PASSWORD_SHA256 || !env.SESSION_SECRET) {
    return json(request, env, { error: "Gallery security has not been configured yet." }, 503);
  }
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  let record = LOGIN_ATTEMPTS.get(ip);
  if (!record || now - record.started > LOGIN_WINDOW_MS) record = { started: now, count: 0 };
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    LOGIN_ATTEMPTS.set(ip, record);
    return json(request, env, { error: "Too many login attempts. Try again after 15 minutes." }, 429);
  }
  let body;
  try { body = await request.json(); } catch (_) { return json(request, env, { error: "Invalid login request." }, 400); }
  const password = String(body.password || "");
  if (password.length < 1 || password.length > 300) return json(request, env, { error: "Invalid password." }, 400);
  if (!(await passwordMatches(password, env.ADMIN_PASSWORD_SHA256))) {
    record.count += 1;
    LOGIN_ATTEMPTS.set(ip, record);
    return json(request, env, { error: "Incorrect owner password." }, 401);
  }
  LOGIN_ATTEMPTS.delete(ip);
  return json(request, env, { token: await createSession(env), expiresIn: SESSION_SECONDS }, 200);
}

async function listVideos(request, env) {
  const videos = [];
  let cursor;
  let pages = 0;
  do {
    const page = await env.GALLERY.list({ prefix: "videos/", limit: 1000, cursor: cursor, include: ["httpMetadata", "customMetadata"] });
    for (const item of page.objects) {
      videos.push({
        key: item.key,
        name: (item.customMetadata && item.customMetadata.originalName) || item.key.split("/").pop(),
        size: item.size,
        type: (item.httpMetadata && item.httpMetadata.contentType) || "video/mp4",
        uploadedAt: item.uploaded ? item.uploaded.toISOString() : null
      });
    }
    cursor = page.truncated ? page.cursor : undefined;
    pages += 1;
  } while (cursor && pages < 5);
  videos.sort(function (a, b) {
    return String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || ""));
  });
  return json(request, env, { videos: videos, truncated: Boolean(cursor) }, 200);
}

async function startUpload(request, env) {
  const blocked = await requireOwner(request, env);
  if (blocked) return blocked;
  let body;
  try { body = await request.json(); } catch (_) { return json(request, env, { error: "Invalid upload request." }, 400); }
  const name = safeName(body.name);
  const size = Number(body.size);
  const type = contentTypeFor(body.type, name);
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_SIZE) {
    return json(request, env, { error: "Video must be between 1 byte and 20 GB." }, 400);
  }
  if (!allowedVideo(name, body.type)) return json(request, env, { error: "Only video files are accepted." }, 415);
  const key = "videos/" + crypto.randomUUID() + "-" + name;
  const upload = await env.GALLERY.createMultipartUpload(key, {
    httpMetadata: { contentType: type, cacheControl: "private, no-store" },
    customMetadata: { originalName: name, uploadedBy: "owner", createdAt: new Date().toISOString() }
  });
  return json(request, env, { key: key, uploadId: upload.uploadId, partSize: 10 * 1024 * 1024 }, 201);
}

async function uploadPart(request, env, url) {
  const blocked = await requireOwner(request, env);
  if (blocked) return blocked;
  const key = cleanKey(url.searchParams.get("key"));
  const uploadId = url.searchParams.get("uploadId") || "";
  const partNumber = Number(url.searchParams.get("partNumber"));
  const length = Number(request.headers.get("Content-Length") || 0);
  if (!key || !uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
    return json(request, env, { error: "Invalid multipart upload part." }, 400);
  }
  if (length > 100 * 1024 * 1024) return json(request, env, { error: "Upload part is too large." }, 413);
  const upload = env.GALLERY.resumeMultipartUpload(key, uploadId);
  const part = await upload.uploadPart(partNumber, request.body);
  return json(request, env, { partNumber: part.partNumber, etag: part.etag }, 200);
}

async function completeUpload(request, env) {
  const blocked = await requireOwner(request, env);
  if (blocked) return blocked;
  let body;
  try { body = await request.json(); } catch (_) { return json(request, env, { error: "Invalid completion request." }, 400); }
  const key = cleanKey(body.key);
  const uploadId = String(body.uploadId || "");
  const parts = Array.isArray(body.parts) ? body.parts : [];
  if (!key || !uploadId || !parts.length || parts.length > 10000) {
    return json(request, env, { error: "Invalid multipart completion data." }, 400);
  }
  const normalized = parts.map(function (part) {
    return { partNumber: Number(part.partNumber), etag: String(part.etag || "") };
  }).sort(function (a, b) { return a.partNumber - b.partNumber; });
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i].partNumber !== i + 1 || !normalized[i].etag) {
      return json(request, env, { error: "Upload parts are incomplete or out of order." }, 400);
    }
  }
  await env.GALLERY.resumeMultipartUpload(key, uploadId).complete(normalized);
  return json(request, env, { ok: true, key: key }, 200);
}

async function abortUpload(request, env, url) {
  const blocked = await requireOwner(request, env);
  if (blocked) return blocked;
  const key = cleanKey(url.searchParams.get("key"));
  const uploadId = url.searchParams.get("uploadId") || "";
  if (!key || !uploadId) return json(request, env, { error: "Invalid upload reference." }, 400);
  await env.GALLERY.resumeMultipartUpload(key, uploadId).abort();
  return json(request, env, { ok: true }, 200);
}

async function deleteVideo(request, env, url) {
  const blocked = await requireOwner(request, env);
  if (blocked) return blocked;
  const key = cleanKey(url.searchParams.get("key"));
  if (!key) return json(request, env, { error: "Invalid video key." }, 400);
  await env.GALLERY.delete(key);
  return json(request, env, { ok: true }, 200);
}

async function streamVideo(request, env, url) {
  if (url.searchParams.has("download")) return json(request, env, { error: "Download links are disabled." }, 403);
  const key = cleanKey(url.searchParams.get("key"));
  if (!key) return json(request, env, { error: "Video not found." }, 404);
  const options = {};
  if (request.headers.has("Range")) options.range = request.headers;
  const object = await env.GALLERY.get(key, options);
  if (!object) return json(request, env, { error: "Video not found." }, 404);
  const headers = corsHeaders(request, env);
  if (object.writeHttpMetadata) object.writeHttpMetadata(headers);
  headers.set("Content-Type", (object.httpMetadata && object.httpMetadata.contentType) || "video/mp4");
  headers.set("Content-Disposition", "inline");
  headers.set("Accept-Ranges", "bytes");
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  let status = 200;
  if (object.range && Number.isFinite(object.range.offset) && Number.isFinite(object.range.length)) {
    const start = object.range.offset;
    const end = start + object.range.length - 1;
    headers.set("Content-Range", "bytes " + start + "-" + end + "/" + object.size);
    headers.set("Content-Length", String(object.range.length));
    status = 206;
  } else {
    headers.set("Content-Length", String(object.size));
  }
  return new Response(request.method === "HEAD" ? null : object.body, { status: status, headers: headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    try {
      if (path === "/api/health" && request.method === "GET") {
        return json(request, env, { ok: true, service: "grks-3d-gallery", storage: "private-r2" }, 200);
      }
      if (path === "/api/auth/login" && request.method === "POST") return await login(request, env);
      if (path === "/api/admin/session" && request.method === "GET") {
        const blocked = await requireOwner(request, env);
        return blocked || json(request, env, { ok: true, expiresIn: SESSION_SECONDS }, 200);
      }
      if (path === "/api/videos" && request.method === "GET") return await listVideos(request, env);
      if (path === "/api/video" && (request.method === "GET" || request.method === "HEAD")) return await streamVideo(request, env, url);
      if (path === "/api/admin/upload/start" && request.method === "POST") return await startUpload(request, env);
      if (path === "/api/admin/upload/part" && request.method === "PUT") return await uploadPart(request, env, url);
      if (path === "/api/admin/upload/complete" && request.method === "POST") return await completeUpload(request, env);
      if (path === "/api/admin/upload/abort" && request.method === "DELETE") return await abortUpload(request, env, url);
      if (path === "/api/admin/videos" && request.method === "DELETE") return await deleteVideo(request, env, url);
      return json(request, env, { error: "Not found." }, 404);
    } catch (error) {
      return json(request, env, { error: "Gallery service error.", detail: env.ENVIRONMENT === "development" ? String(error && error.message || error) : undefined }, 500);
    }
  }
};
