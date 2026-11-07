import fs from "node:fs/promises";

const base = process.env.QA_BASE ?? "http://localhost:3102";
const stamp = Date.now().toString(36);
const password = "QaDemo2026!";
const emails = {
  guest: `qa-guest-${stamp}@example.com`,
  guestBooking: `qa-booking-${stamp}@example.com`,
  hostA: `qa-host-a-${stamp}@example.com`,
  hostB: `qa-host-b-${stamp}@example.com`,
};
const names = {
  guest: "QA Guest",
  guestBooking: "QA Booking Guest",
  hostA: "QA Host A",
  hostB: "QA Host B",
};
const results = [];
const artifacts = { emails, names, password, hostA: {}, hostB: {}, guest: {}, booking: {} };

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
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

async function request(path, options = {}) {
  const { jar, method = "GET", body, redirect = "manual" } = options;
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const cookie = jar?.header();
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect,
  });
  jar?.absorb(response);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // HTML response.
  }
  return {
    status: response.status,
    location: response.headers.get("location"),
    text,
    json,
  };
}

function check(name, passed, detail = "") {
  results.push({ name, passed: Boolean(passed), detail: String(detail).slice(0, 500) });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${passed ? "" : ` — ${detail}`}`);
}

function has(text, value) {
  return text.toLowerCase().includes(value.toLowerCase());
}

function extract(text, regex) {
  return text.match(regex)?.[1] ?? null;
}

function redirectPath(response) {
  if (response.location) return response.location;
  return extract(
    response.text,
    /NEXT_REDIRECT;(?:replace|push);([^;\\"]+);\d+;/,
  );
}

function isoDate(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function main() {
  await fs.mkdir(".qa", { recursive: true });

  const invalid = await request("/api/guest/signup", {
    method: "POST",
    body: { fullName: "Invalid", email: "not-an-email", password },
  });
  check("Invalid guest email is rejected", invalid.status === 400, `status ${invalid.status}`);

  const spacedEmail = await request("/api/guest/signup", {
    method: "POST",
    body: { fullName: "Invalid Example", email: "not alex.rivera@example.com", password },
  });
  check(
    "Email with spaces is rejected before account creation",
    spacedEmail.status === 400 && has(spacedEmail.text, "valid email"),
    `status ${spacedEmail.status}, ${spacedEmail.text}`,
  );

  const guestJar = new Jar();
  const guestSignup = await request("/api/guest/signup", {
    method: "POST",
    jar: guestJar,
    body: { fullName: names.guest, email: emails.guest, password },
  });
  check(
    "Standalone guest signup creates an account",
    guestSignup.status === 201 && guestSignup.json?.redirect === "/hosts",
    `status ${guestSignup.status}, ${guestSignup.text}`,
  );

  const duplicate = await request("/api/guest/signup", {
    method: "POST",
    body: { fullName: names.guest, email: emails.guest, password },
  });
  check("Duplicate guest email is rejected clearly", duplicate.status === 409, `status ${duplicate.status}, ${duplicate.text}`);

  const wrongLoginJar = new Jar();
  const wrongLogin = await request("/api/guest/account", {
    method: "POST",
    jar: wrongLoginJar,
    body: { email: emails.guest, password: "WrongPassword1" },
  });
  check("Wrong guest password is rejected", wrongLogin.status === 401, `status ${wrongLogin.status}`);

  const returningJar = new Jar();
  const returning = await request("/api/guest/account", {
    method: "POST",
    jar: returningJar,
    body: { email: emails.guest, password },
  });
  check(
    "Returning guest signs in without a booking",
    returning.status === 200 && returning.json?.redirect === "/hosts",
    `status ${returning.status}, ${returning.text}`,
  );

  const guestProfile = await request("/profile", { jar: guestJar });
  check(
    "No-book guest profile renders their account",
    guestProfile.status === 200 && has(guestProfile.text, names.guest) && has(guestProfile.text, emails.guest),
    `status ${guestProfile.status}`,
  );

  const noStay = await request("/stay", { jar: guestJar });
  check(
    "No-book “My stay” is an empty state, not signup",
    noStay.status === 200 &&
      has(noStay.text, "No stay linked to this account") &&
      !has(noStay.text, "Create your guest account"),
    `status ${noStay.status}`,
  );

  const welcomeNoStay = await request("/welcome", { jar: guestJar });
  const welcomeNoStayRedirect = redirectPath(welcomeNoStay);
  check(
    "Guest without a stay is sent from welcome to the host directory",
    welcomeNoStayRedirect === "/hosts",
    `status ${welcomeNoStay.status}, redirect ${welcomeNoStayRedirect}`,
  );

  const loggedOutStay = await request("/stay");
  const loggedOutStayRedirect = redirectPath(loggedOutStay);
  check(
    "Logged-out My stay redirects to guest sign-in and back to stay",
    Boolean(loggedOutStayRedirect?.includes("/guest/login?next=/stay")),
    `status ${loggedOutStay.status}, redirect ${loggedOutStayRedirect}`,
  );

  const noConnections = await request("/connections", { jar: guestJar });
  check(
    "Guest with no host sees a useful empty state",
    noConnections.status === 200 && has(noConnections.text, "No connections yet"),
    `status ${noConnections.status}`,
  );

  const loggedOutProfile = await request("/profile");
  const loggedOutRedirect = redirectPath(loggedOutProfile);
  check(
    "Logged-out protected page redirects to guest sign-in",
    Boolean(loggedOutRedirect?.includes("/guest/login?next=/profile")),
    `status ${loggedOutProfile.status}, redirect ${loggedOutRedirect}`,
  );

  const guestOnHost = await request("/host", { jar: guestJar });
  const guestOnHostRedirect = redirectPath(guestOnHost);
  check(
    "Guest account cannot open the host workspace",
    Boolean(guestOnHostRedirect?.startsWith("/host/login")),
    `status ${guestOnHost.status}, redirect ${guestOnHostRedirect}`,
  );

  const hostAJar = new Jar();
  const hostASignup = await request("/api/host/signup", {
    method: "POST",
    jar: hostAJar,
    body: {
      fullName: names.hostA,
      email: emails.hostA,
      password,
      offeringName: "QA Atelier Stay",
      offeringType: "stay",
      offeringCategory: "Apartment",
      city: "Barcelona",
      neighbourhood: "Gràcia",
      description: "A quiet QA apartment used only for automated testing.",
      address: "Carrer de Test 1",
      priceLabel: "€99 / night",
      duration: "Nightly",
    },
  });
  check(
    "Host signup creates account and first offering",
    hostASignup.status === 201,
    `status ${hostASignup.status}, ${hostASignup.text}`,
  );

  const hostAHome = await request("/host", { jar: hostAJar });
  check(
    "New host lands on their own workspace",
    hostAHome.status === 200 && has(hostAHome.text, "QA Atelier Stay"),
    `status ${hostAHome.status}`,
  );

  const hostOnGuestProfile = await request("/profile", { jar: hostAJar });
  const hostOnGuestProfileRedirect = redirectPath(hostOnGuestProfile);
  check(
    "Host account cannot open the guest profile area",
    Boolean(hostOnGuestProfileRedirect?.includes("/guest/login?next=/profile")),
    `status ${hostOnGuestProfile.status}, redirect ${hostOnGuestProfileRedirect}`,
  );
  check(
    "New host is not given the Casa Barcelona seed",
    !has(hostAHome.text, "Casa Barcelona"),
    "Casa Barcelona appeared in a new host workspace",
  );

  const hostAPropertyId = extract(hostAHome.text, /\/host\/properties\/([0-9a-f-]{36})/);
  check("Host offering id is available", Boolean(hostAPropertyId), "No offering link found");
  artifacts.hostA.propertyId = hostAPropertyId;

  const hostAEdit = hostAPropertyId
    ? await request(`/host/properties/${hostAPropertyId}`, { jar: hostAJar })
    : null;
  const hostAId = hostAEdit
    ? extract(hostAEdit.text, /\/hosts\/([0-9a-f-]{36})/)
    : null;
  check("Host public profile id is available", Boolean(hostAId), "No public profile link found");
  artifacts.hostA.hostId = hostAId;

  const hostAAffiliations = await request("/host/affiliations", { jar: hostAJar });
  check(
    "Host with no guests sees an empty affiliations state",
    hostAAffiliations.status === 200 && has(hostAAffiliations.text, "No guest requests yet"),
    `status ${hostAAffiliations.status}`,
  );

  const hostEdit = await request(`/api/host/properties/${hostAPropertyId}`, {
    method: "PATCH",
    jar: hostAJar,
    body: { description: "QA Atelier Stay — updated description from the offering form." },
  });
  check(
    "Host can save changes to their offering",
    hostEdit.status === 200 &&
      has(JSON.stringify(hostEdit.json), "updated description"),
    `status ${hostEdit.status}, ${hostEdit.text}`,
  );

  const publicAfterEdit = await request(`/hosts/${hostAId}`);
  check(
    "Saved offering changes appear on the public host profile",
    publicAfterEdit.status === 200 &&
      has(publicAfterEdit.text, "updated description from the offering form"),
    `status ${publicAfterEdit.status}`,
  );

  const hostDuplicate = await request("/api/host/signup", {
    method: "POST",
    body: {
      fullName: names.hostA,
      email: emails.hostA,
      password,
      offeringName: "QA Duplicate",
      offeringType: "stay",
      offeringCategory: "Apartment",
      city: "Barcelona",
      neighbourhood: "Gràcia",
      description: "A duplicate host account should not be created by this form.",
      address: "Carrer de Test 2",
    },
  });
  check("Duplicate host email is rejected", hostDuplicate.status === 400 && has(hostDuplicate.text, "already exists"), `status ${hostDuplicate.status}`);

  const guestOnHostLogin = await request("/api/host/login", {
    method: "POST",
    body: { email: emails.guest, password },
  });
  check(
    "Guest credentials are rejected by host sign-in",
    guestOnHostLogin.status !== 200 && has(guestOnHostLogin.text, "guest"),
    `status ${guestOnHostLogin.status}, ${guestOnHostLogin.text}`,
  );

  const guestAfterRoleTest = await request("/connections", { jar: guestJar });
  check(
    "Wrong host form does not sign out the guest",
    guestAfterRoleTest.status === 200 && has(guestAfterRoleTest.text, emails.guest),
    `status ${guestAfterRoleTest.status}`,
  );

  const hostAGuestLogin = await request("/api/guest/account", {
    method: "POST",
    body: { email: emails.hostA, password },
  });
  check(
    "Host credentials are rejected by guest sign-in",
    hostAGuestLogin.status === 403 && has(hostAGuestLogin.text, "not a guest"),
    `status ${hostAGuestLogin.status}, ${hostAGuestLogin.text}`,
  );

  const hostAAfterRoleTest = await request("/host", { jar: hostAJar });
  check(
    "Wrong guest form does not sign out the host",
    hostAAfterRoleTest.status === 200 && has(hostAAfterRoleTest.text, "QA Atelier Stay"),
    `status ${hostAAfterRoleTest.status}`,
  );

  const hostBHostJar = new Jar();
  const hostBSignup = await request("/api/host/signup", {
    method: "POST",
    jar: hostBHostJar,
    body: {
      fullName: names.hostB,
      email: emails.hostB,
      password,
      offeringName: "QA Night Walk",
      offeringType: "activity",
      offeringCategory: "Nightlife",
      city: "Barcelona",
      neighbourhood: "El Born",
      description: "A two-hour QA night walk through bars and clubs for testing.",
      address: "Plaça de Test 2",
      priceLabel: "€30 / person",
      duration: "2 hours · evenings",
    },
  });
  check("Second host signs up successfully", hostBSignup.status === 201, `status ${hostBSignup.status}, ${hostBSignup.text}`);

  const hostBHome = await request("/host", { jar: hostBHostJar });
  const hostBPropertyId = extract(hostBHome.text, /\/host\/properties\/([0-9a-f-]{36})/);
  const hostBEdit = hostBPropertyId
    ? await request(`/host/properties/${hostBPropertyId}`, { jar: hostBHostJar })
    : null;
  const hostBId = hostBEdit ? extract(hostBEdit.text, /\/hosts\/([0-9a-f-]{36})/) : null;
  artifacts.hostB.propertyId = hostBPropertyId;
  artifacts.hostB.hostId = hostBId;
  check("Second host offering and profile exist", Boolean(hostBPropertyId && hostBId), "Missing ids");

  const hostBEmpty = await request("/host/affiliations", { jar: hostBHostJar });
  check(
    "Second host starts with no guest requests",
    hostBEmpty.status === 200 && has(hostBEmpty.text, "No guest requests yet"),
    `status ${hostBEmpty.status}`,
  );

  const directory = await request("/hosts");
  check(
    "Multiple hosts are visible in the public directory",
    directory.status === 200 &&
      has(directory.text, names.hostA) &&
      has(directory.text, names.hostB) &&
      has(directory.text, "QA Atelier Stay") &&
      has(directory.text, "QA Night Walk"),
    `status ${directory.status}`,
  );

  const hostAProfile = await request(`/hosts/${hostAId}`, { jar: guestJar });
  check(
    "Guest can open a host profile",
    hostAProfile.status === 200 && has(hostAProfile.text, names.hostA) && has(hostAProfile.text, "Ask to connect"),
    `status ${hostAProfile.status}`,
  );

  const affiliation = await request("/api/guest/affiliations", {
    method: "POST",
    jar: guestJar,
    body: { hostId: hostAId, propertyId: hostAPropertyId },
  });
  check(
    "Guest can request affiliation",
    affiliation.status === 201 && affiliation.json?.affiliation?.status === "pending",
    `status ${affiliation.status}, ${affiliation.text}`,
  );
  artifacts.guest.affiliationId = affiliation.json?.affiliation?.id ?? null;

  const guestPending = await request("/connections", { jar: guestJar });
  check(
    "Guest sees pending affiliation",
    guestPending.status === 200 && has(guestPending.text, names.hostA) && has(guestPending.text, "Pending"),
    `status ${guestPending.status}`,
  );

  const hostPending = await request("/host/affiliations", { jar: hostAJar });
  check(
    "Host sees the pending guest request",
    hostPending.status === 200 && has(hostPending.text, names.guest) && has(hostPending.text, emails.guest),
    `status ${hostPending.status}`,
  );

  const accept = await request(`/api/host/affiliations/${artifacts.guest.affiliationId}`, {
    method: "PATCH",
    jar: hostAJar,
    body: { status: "accepted" },
  });
  check("Host can accept affiliation", accept.status === 200 && accept.json?.affiliation?.status === "accepted", `status ${accept.status}, ${accept.text}`);

  const guestAccepted = await request("/connections", { jar: guestJar });
  check(
    "Guest sees accepted affiliation",
    guestAccepted.status === 200 && has(guestAccepted.text, names.hostA) && has(guestAccepted.text, "Accepted"),
    `status ${guestAccepted.status}`,
  );

  const acceptedProfile = await request(`/hosts/${hostAId}`, { jar: guestJar });
  check(
    "Accepted state is visible on the host profile",
    acceptedProfile.status === 200 &&
      has(acceptedProfile.text, "Connected with") &&
      has(acceptedProfile.text, names.hostA),
    `status ${acceptedProfile.status}`,
  );

  const declineRequest = await request("/api/guest/affiliations", {
    method: "POST",
    jar: guestJar,
    body: { hostId: hostBId, propertyId: hostBPropertyId },
  });
  const declineId = declineRequest.json?.affiliation?.id;
  check("Guest can request a second host", declineRequest.status === 201, `status ${declineRequest.status}`);
  artifacts.guest.declinedAffiliationId = declineId;

  const decline = await request(`/api/host/affiliations/${declineId}`, {
    method: "PATCH",
    jar: hostBHostJar,
    body: { status: "declined" },
  });
  check("Host can decline affiliation", decline.status === 200 && decline.json?.affiliation?.status === "declined", `status ${decline.status}`);

  const guestDeclined = await request("/connections", { jar: guestJar });
  check(
    "Guest sees declined affiliation and retry control",
    guestDeclined.status === 200 &&
      has(guestDeclined.text, names.hostB) &&
      has(guestDeclined.text, "Declined") &&
      has(guestDeclined.text, "ask again"),
    `status ${guestDeclined.status}`,
  );

  const retry = await request("/api/guest/affiliations", {
    method: "POST",
    jar: guestJar,
    body: { hostId: hostBId, propertyId: hostBPropertyId },
  });
  check("Declined guest can retry", retry.status === 201 && retry.json?.affiliation?.status === "pending", `status ${retry.status}`);

  const reservation = await request("/api/host/reservations", {
    method: "POST",
    jar: hostAJar,
    body: {
      propertyId: hostAPropertyId,
      guestName: names.guestBooking,
      guestEmail: emails.guestBooking,
      checkInDate: isoDate(7),
      checkOutDate: isoDate(10),
      guests: 2,
      notes: "QA reservation for the post-reservation affiliation flow.",
    },
  });
  check(
    "Host can create an official reservation",
    reservation.status === 201 && Boolean(reservation.json?.reservation?.id),
    `status ${reservation.status}, ${reservation.text}`,
  );
  const reservationId = reservation.json?.reservation?.id;
  artifacts.booking.reservationId = reservationId;
  artifacts.booking.code = reservation.json?.reservation?.code;

  const reservationUpdate = await request(`/api/host/reservations/${reservationId}`, {
    method: "PATCH",
    jar: hostAJar,
    body: { status: "in_house" },
  });
  check(
    "Host can update a reservation status",
    reservationUpdate.status === 200 &&
      reservationUpdate.json?.reservation?.status === "in_house",
    `status ${reservationUpdate.status}, ${reservationUpdate.text}`,
  );

  const bookingJar = new Jar();
  const bookingSignup = await request("/api/guest/signup", {
    method: "POST",
    jar: bookingJar,
    body: { fullName: names.guestBooking, email: emails.guestBooking, password },
  });
  check(
    "Guest with a matching booking is linked at signup",
    bookingSignup.status === 201 && bookingSignup.json?.redirect === "/welcome",
    `status ${bookingSignup.status}, ${bookingSignup.text}`,
  );

  const bookingStay = await request("/stay", { jar: bookingJar });
  check(
    "Linked guest sees their official reservation on My stay",
    bookingStay.status === 200 &&
      has(bookingStay.text, "Official reservation") &&
      has(bookingStay.text, artifacts.booking.code ?? "missing-code"),
    `status ${bookingStay.status}`,
  );

  const bookingAffiliation = await request("/api/guest/affiliations", {
    method: "POST",
    jar: bookingJar,
    body: { hostId: hostAId, propertyId: hostAPropertyId, reservationId },
  });
  check(
    "Affiliation can be initiated from an official reservation",
    bookingAffiliation.status === 201 &&
      bookingAffiliation.json?.affiliation?.reservationId === reservationId,
    `status ${bookingAffiliation.status}, ${bookingAffiliation.text}`,
  );

  const hostBookingPending = await request("/host/affiliations", { jar: hostAJar });
  check(
    "Reservation-linked request appears for the host",
    hostBookingPending.status === 200 && has(hostBookingPending.text, names.guestBooking),
    `status ${hostBookingPending.status}`,
  );

  const support = await request("/api/requests", {
    method: "POST",
    jar: bookingJar,
    body: {
      description: "QA support request: the shower pressure needs checking.",
      category: "maintenance",
    },
  });
  check(
    "Guest can submit a support ticket",
    support.status === 200 && Boolean(support.json?.ticket?.code),
    `status ${support.status}, ${support.text}`,
  );
  const hostMaintenance = await request("/host/maintenance", { jar: hostAJar });
  check(
    "Support ticket appears in the host workspace",
    hostMaintenance.status === 200 && has(hostMaintenance.text, "shower pressure"),
    `status ${hostMaintenance.status}`,
  );

  const markRead = await request("/api/host/notifications/read", {
    method: "POST",
    jar: hostAJar,
  });
  check(
    "Host can mark notifications as read",
    (markRead.status === 303 || markRead.status === 307) &&
      (markRead.location ?? "").endsWith("/host"),
    `status ${markRead.status}, location ${markRead.location}`,
  );

  const nightlife = await request("/explore?category=nightlife", { jar: bookingJar });
  check(
    "Nightlife list uses club, bar and lounge labels",
    nightlife.status === 200 &&
      has(nightlife.text, "Club") &&
      has(nightlife.text, "Bar") &&
      has(nightlife.text, "Lounge") &&
      has(nightlife.text, "Nightlife:"),
    `status ${nightlife.status}`,
  );

  const oldAccount = await request("/guest/account");
  const oldAccountRedirect = redirectPath(oldAccount);
  check(
    "Old guest account URL redirects to the main sign-in",
    Boolean(oldAccountRedirect?.includes("/guest/login")),
    `status ${oldAccount.status}, redirect ${oldAccountRedirect}`,
  );

  const home = await request("/");
  check(
    "Home page exposes all four products",
    home.status === 200 &&
      ["Web", "Napkin", "AI agent", "Suno"].every((name) => has(home.text, name)),
    `status ${home.status}`,
  );

  const guestSignupPage = await request("/guest/signup");
  check(
    "Guest signup explains that any email works",
    guestSignupPage.status === 200 && has(guestSignupPage.text, "Any email works"),
    `status ${guestSignupPage.status}`,
  );

  const hostOfferingPage = await request("/host/properties", { jar: hostBHostJar });
  check(
    "Activity host sees offering language, not property-only language",
    hostOfferingPage.status === 200 &&
      has(hostOfferingPage.text, "What you offer") &&
      has(hostOfferingPage.text, "Add offering"),
    `status ${hostOfferingPage.status}`,
  );

  const guestSignOut = await request("/api/guest/reset", { jar: guestJar });
  check(
    "Guest sign-out returns to guest sign-in",
    (guestSignOut.status === 303 || guestSignOut.status === 307) &&
      (guestSignOut.location ?? "").includes("/guest/login"),
    `status ${guestSignOut.status}, location ${guestSignOut.location}`,
  );
  const guestAfterSignOut = await request("/connections", { jar: guestJar });
  check(
    "Signed-out guest cannot stay on a protected page",
    Boolean(redirectPath(guestAfterSignOut)?.includes("/guest/login")),
    `status ${guestAfterSignOut.status}, redirect ${redirectPath(guestAfterSignOut)}`,
  );

  const hostSignOut = await request("/api/host/logout", {
    method: "POST",
    jar: hostAJar,
  });
  check(
    "Host sign-out returns to host sign-in",
    hostSignOut.status === 303 && (hostSignOut.location ?? "").includes("/host/login"),
    `status ${hostSignOut.status}, location ${hostSignOut.location}`,
  );
  const hostAfterSignOut = await request("/host", { jar: hostAJar });
  check(
    "Signed-out host cannot stay in the host workspace",
    Boolean(redirectPath(hostAfterSignOut)?.startsWith("/host/login")),
    `status ${hostAfterSignOut.status}, redirect ${redirectPath(hostAfterSignOut)}`,
  );

  await fs.writeFile(".qa/artifacts.json", JSON.stringify({ emails, password, hostIds: { A: hostAId, B: hostBId }, propertyIds: { A: hostAPropertyId, B: hostBPropertyId }, reservationId }, null, 2));
  await fs.writeFile(".qa/results.json", JSON.stringify(results, null, 2));

  const failed = results.filter((result) => !result.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log("Failed checks:");
    for (const result of failed) console.log(`- ${result.name}: ${result.detail}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
