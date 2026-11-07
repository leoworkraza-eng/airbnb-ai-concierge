import fs from "node:fs/promises";

const base = process.env.QA_BASE ?? "http://localhost:3102";
const artifacts = JSON.parse(await fs.readFile(".qa/artifacts.json", "utf8"));
const { emails, password, hostIds, propertyIds } = artifacts;

class Jar {
  cookies = new Map();
  absorb(response) {
    const values =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];
    for (const raw of values) {
      const first = raw.split(";")[0];
      const index = first.indexOf("=");
      if (index < 1) continue;
      const name = first.slice(0, index).trim();
      const value = first.slice(index + 1);
      if (!value) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

async function request(path, options = {}) {
  const { jar, method = "GET", body } = options;
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (jar?.header()) headers.cookie = jar.header();
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  jar?.absorb(response);
  const text = await response.text();
  return {
    status: response.status,
    location: response.headers.get("location"),
    text,
  };
}

async function loginGuest(email, jar) {
  const response = await request("/api/guest/account", {
    method: "POST",
    jar,
    body: { email, password },
  });
  if (response.status !== 200) {
    throw new Error(`Guest login failed for ${email}: ${response.text}`);
  }
}

async function loginHost(email, jar) {
  const response = await request("/api/host/login", {
    method: "POST",
    jar,
    body: { email, password },
  });
  if (response.status !== 200) {
    throw new Error(`Host login failed for ${email}: ${response.text}`);
  }
}

function redirectPath(response) {
  if (response.location) return response.location;
  return (
    response.text.match(/NEXT_REDIRECT;(?:replace|push);([^;\\"]+);\d+;/)?.[1] ??
    null
  );
}

function decode(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
}

function internalTarget(raw) {
  if (!raw || raw.startsWith("#")) return null;
  if (/^(?:https?:|mailto:|tel:)/i.test(raw)) return null;
  let url;
  try {
    url = new URL(decode(raw), base);
  } catch {
    return null;
  }
  if (url.origin !== base) return null;
  return `${url.pathname}${url.search}`;
}

const guestJar = new Jar();
const bookingJar = new Jar();
const hostJar = new Jar();
await loginGuest(emails.guest, guestJar);
await loginGuest(emails.guestBooking, bookingJar);
await loginHost(emails.hostA, hostJar);

const contexts = [
  {
    name: "public",
    jar: null,
    pages: [
      "/",
      "/hosts",
      `/hosts/${hostIds.A}`,
      "/guest/login",
      "/guest/signup",
      "/host/login",
      "/host/signup",
    ],
  },
  {
    name: "guest",
    jar: guestJar,
    pages: [
      "/",
      "/hosts",
      `/hosts/${hostIds.A}`,
      `/hosts/${hostIds.B}`,
      "/connections",
      "/profile",
      "/stay",
    ],
  },
  {
    name: "booking guest",
    jar: bookingJar,
    pages: [
      "/welcome",
      "/stay",
      "/itinerary",
      "/concierge",
      "/explore?category=nightlife",
      "/support",
      "/connections",
      "/profile",
      "/hosts",
    ],
  },
  {
    name: "host",
    jar: hostJar,
    pages: [
      "/host",
      "/host/affiliations",
      "/host/properties",
      `/host/properties/${propertyIds.A}`,
      "/host/properties/new",
      "/host/reservations",
      "/host/reservations/new",
      "/host/guests",
      "/host/settings",
      "/host/maintenance",
      "/host/integrations",
    ],
  },
];

const pages = [];
const links = new Map();
const forms = new Map();

for (const context of contexts) {
  for (const path of context.pages) {
    const response = await request(path, { jar: context.jar });
    const redirect = redirectPath(response);
    const ok = response.status === 200 && !redirect;
    pages.push({
      context: context.name,
      path,
      status: response.status,
      redirect,
      ok,
    });
    if (!ok) continue;

    const anchorPattern = /<a\b[^>]*\bhref="([^"]*)"/gi;
    for (const match of response.text.matchAll(anchorPattern)) {
      const target = internalTarget(match[1]);
      if (!target) continue;
      if (target.startsWith("/api/")) continue;
      const key = `${context.name} ${target}`;
      if (!links.has(key)) {
        links.set(key, { context: context.name, path: target, jar: context.jar });
      }
    }

    const formPattern = /<form\b([^>]*)>/gi;
    for (const match of response.text.matchAll(formPattern)) {
      const attrs = match[1];
      const action = attrs.match(/\baction="([^"]*)"/i)?.[1];
      if (!action) continue;
      const target = internalTarget(action);
      if (!target) continue;
      const method = attrs.match(/\bmethod="([^"]*)"/i)?.[1]?.toUpperCase() ?? "GET";
      forms.set(`${context.name} ${method} ${target}`, {
        context: context.name,
        method,
        path: target,
      });
    }
  }
}

const linkResults = [];
for (const entry of links.values()) {
  const response = await request(entry.path, { jar: entry.jar });
  const redirect = redirectPath(response);
  const authRedirect =
    redirect?.startsWith("/guest/login") || redirect?.startsWith("/host/login");
  const ok = response.status === 200 && (!redirect || authRedirect);
  linkResults.push({
    ...entry,
    status: response.status,
    redirect,
    ok,
  });
}

await fs.writeFile(".qa/link-audit.json", JSON.stringify({ pages, links: linkResults, forms: [...forms.values()] }, null, 2));

const badPages = pages.filter((page) => !page.ok);
const badLinks = linkResults.filter((link) => !link.ok);
console.log(`${pages.length - badPages.length}/${pages.length} pages load cleanly.`);
console.log(`${linkResults.length - badLinks.length}/${linkResults.length} unique internal links resolve.`);
for (const page of badPages) {
  console.log(`PAGE FAIL ${page.context} ${page.path}: ${page.status} ${page.redirect ?? ""}`);
}
for (const link of badLinks) {
  console.log(`LINK FAIL ${link.context} ${link.path}: ${link.status} ${link.redirect ?? ""}`);
}
for (const form of forms.values()) {
  console.log(`FORM ${form.context} ${form.method} ${form.path}`);
}

if (badPages.length || badLinks.length) process.exitCode = 1;
