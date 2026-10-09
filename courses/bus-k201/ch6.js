/* ============================================================
 * BUS K201 · Chapter 6 · Business Data Foundations:
 * Entities, Relationships, and Rules
 * Why data models matter, conceptual / logical / physical models,
 * entities vs. attributes vs. values vs. relationships, requirements
 * gathering and scope, the noun/verb technique, structural vs.
 * operative business rules, cardinality, simplified crow's foot ERDs,
 * and data-integrity requirements.
 * All explanations, narratives and examples are original to this site.
 * ============================================================ */
(function () {
  const U = STUDY.util;
  const Q = STUDY.q;
  const K = STUDY.k201;
  const S = K.S;
  const C = "bus-k201";

  /* ---------- small local helpers ---------- */
  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const art = w => (/^[aeiou]/i.test(w) ? "an" : "a");
  const Art = w => (/^[aeiou]/i.test(w) ? "An" : "A");
  const tc = w => w.replace(/\b\w/g, ch => ch.toUpperCase());
  const lc1 = t => t.charAt(0).toLowerCase() + t.slice(1);
  const quote = t => `<div class="example">${t}</div>`;

  /* ---------- simplified crow's foot diagram ----------
   * left / right: entity names; leftMany / rightMany: draw a crow's foot
   * at that end (many) or a single bar (one); verb: label on the line. */
  function erd(left, right, leftMany, rightMany, verb) {
    const y = 43, x1 = 132, x2 = 258;
    const box = (x, name) => `<rect x="${x}" y="24" width="126" height="38" rx="5" stroke="currentColor" fill="none" stroke-width="1.5"/>` +
      `<text x="${x + 63}" y="48" text-anchor="middle" font-size="13" fill="currentColor" stroke="none">${name}</text>`;
    const foot = (xEnt, dir) => {
      const xTip = xEnt + dir * 18;
      return `<line x1="${xTip}" y1="${y}" x2="${xEnt}" y2="${y - 11}" stroke="currentColor"/>` +
        `<line x1="${xTip}" y1="${y}" x2="${xEnt}" y2="${y}" stroke="currentColor"/>` +
        `<line x1="${xTip}" y1="${y}" x2="${xEnt}" y2="${y + 11}" stroke="currentColor"/>`;
    };
    const bar = (xEnt, dir) => { const x = xEnt + dir * 10; return `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="currentColor"/>`; };
    return `<svg viewBox="0 0 390 80" style="max-width:100%;height:auto" role="img">` +
      box(6, left) + box(258, right) +
      `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="1.5"/>` +
      (leftMany ? foot(x1, 1) : bar(x1, 1)) + (rightMany ? foot(x2, -1) : bar(x2, -1)) +
      (verb ? `<text x="195" y="34" text-anchor="middle" font-size="11" fill="currentColor" stroke="none">${verb}</text>` : "") +
      `</svg>`;
  }

  /* ============================================================
   * RELATIONSHIP BANK (cardinality + crow's foot topics)
   * a/b: entity names; aV / aVb: A→B verb (3rd person / base form);
   * bV / bVb: B→A verb. card: "1:1", "1:N" (A is the one side) or "M:N".
   * ============================================================ */
  const REL = [
    { a: "employee", aPl: "employees", b: "employee profile", bPl: "employee profiles", aV: "has", aVb: "have", bV: "belongs to", bVb: "belong to", card: "1:1" },
    { a: "order", aPl: "orders", b: "invoice", bPl: "invoices", aV: "generates", aVb: "generate", bV: "is issued for", bVb: "be issued for", card: "1:1" },
    { a: "member", aPl: "members", b: "locker", bPl: "lockers", aV: "rents", aVb: "rent", bV: "is rented by", bVb: "be rented by", card: "1:1" },
    { a: "student", aPl: "students", b: "parking permit", bPl: "parking permits", aV: "holds", aVb: "hold", bV: "is issued to", bVb: "be issued to", card: "1:1" },
    { a: "vehicle", aPl: "vehicles", b: "title record", bPl: "title records", aV: "has", aVb: "have", bV: "describes", bVb: "describe", card: "1:1" },
    { a: "customer", aPl: "customers", b: "order", bPl: "orders", aV: "places", aVb: "place", bV: "is placed by", bVb: "be placed by", card: "1:N" },
    { a: "supplier", aPl: "suppliers", b: "product", bPl: "products", aV: "provides", aVb: "provide", bV: "is provided by", bVb: "be provided by", card: "1:N" },
    { a: "department", aPl: "departments", b: "employee", bPl: "employees", aV: "employs", aVb: "employ", bV: "works in", bVb: "work in", card: "1:N" },
    { a: "instructor", aPl: "instructors", b: "class", bPl: "classes", aV: "teaches", aVb: "teach", bV: "is taught by", bVb: "be taught by", card: "1:N" },
    { a: "room", aPl: "rooms", b: "class", bPl: "classes", aV: "hosts", aVb: "host", bV: "is held in", bVb: "be held in", card: "1:N" },
    { a: "pet owner", aPl: "pet owners", b: "pet", bPl: "pets", aV: "owns", aVb: "own", bV: "is owned by", bVb: "be owned by", card: "1:N" },
    { a: "team", aPl: "teams", b: "player", bPl: "players", aV: "has", aVb: "have", bV: "plays for", bVb: "play for", card: "1:N" },
    { a: "building", aPl: "buildings", b: "room", bPl: "rooms", aV: "contains", aVb: "contain", bV: "is located in", bVb: "be located in", card: "1:N" },
    { a: "order", aPl: "orders", b: "product", bPl: "products", aV: "contains", aVb: "contain", bV: "appears on", bVb: "appear on", card: "M:N" },
    { a: "student", aPl: "students", b: "class", bPl: "classes", aV: "enrolls in", aVb: "enroll in", bV: "enrolls", bVb: "enroll", card: "M:N" },
    { a: "store", aPl: "stores", b: "product", bPl: "products", aV: "sells", aVb: "sell", bV: "is sold at", bVb: "be sold at", card: "M:N" },
    { a: "author", aPl: "authors", b: "book", bPl: "books", aV: "writes", aVb: "write", bV: "is written by", bVb: "be written by", card: "M:N" },
    { a: "doctor", aPl: "doctors", b: "patient", bPl: "patients", aV: "treats", aVb: "treat", bV: "sees", bVb: "see", card: "M:N" },
    { a: "recipe", aPl: "recipes", b: "ingredient", bPl: "ingredients", aV: "uses", aVb: "use", bV: "is used in", bVb: "be used in", card: "M:N" },
    { a: "tutor", aPl: "tutors", b: "subject", bPl: "subjects", aV: "covers", aVb: "cover", bV: "is covered by", bVb: "be covered by", card: "M:N" },
  ];
  const CARDS = ["1:1", "1:N", "M:N"];
  const CL = { "1:1": "One-to-one (1:1)", "1:N": "One-to-many (1:N)", "M:N": "Many-to-many (M:N)" };
  const CL_ORDER = CARDS.map(c => CL[c]);
  /* fm: one A can relate to many B; bm: one B can relate to many A */
  const flags = card => ({ fm: card !== "1:1", bm: card === "M:N" });
  const cardOf = (fm, bm) => (fm && bm ? "M:N" : (fm || bm) ? "1:N" : "1:1");
  const fwd = (e, many) => many ? `${Art(e.a)} ${e.a} can ${e.aVb} many ${e.bPl}.` : `Each ${e.a} ${e.aV} exactly one ${e.b}.`;
  const back = (e, many) => many ? `${Art(e.b)} ${e.b} can ${e.bVb} many ${e.aPl}.` : `Each ${e.b} ${e.bV} exactly one ${e.a}.`;
  const pair = (e, fm, bm) => `“${fwd(e, fm)}” and “${back(e, bm)}”`;
  const rulesBox = (e, fm, bm) => `<div class="example"><b>Rule 1.</b> ${fwd(e, fm)}<br><b>Rule 2.</b> ${back(e, bm)}</div>`;
  /* draw A–B with A on a random side; returns {svg, leftName, rightName} */
  function draw(e, fm, bm, swap) {
    const A = tc(e.a), B = tc(e.b);
    if (swap) return erd(B, A, fm, bm, e.bV);
    return erd(A, B, bm, fm, e.aV);
  }
  const whyCard = (e, fm, bm) => {
    const c = cardOf(fm, bm);
    return `Reading both directions: one ${e.a} → ${fm ? "many" : "one"} ${fm ? e.bPl : e.b}; one ${e.b} → ${bm ? "many" : "one"} ${bm ? e.aPl : e.a}. ` +
      (c === "M:N" ? "“Many” in both directions makes it <b>M:N</b>." : c === "1:N" ? `“Many” in only one direction makes it <b>1:N</b>, with the crow's foot at the <b>${tc(fm ? e.b : e.a)}</b> end.` : "“One” in both directions makes it <b>1:1</b>.");
  };
  const footPlace = (e, fm, bm) => fm && bm ? "At both ends" : fm ? `At the ${tc(e.b)} end only` : bm ? `At the ${tc(e.a)} end only` : "At neither end";

  /* ============================================================
   * NOUN / VERB NARRATIVES
   * nouns: { n, cat, why, of?, pit? }  cat ∈ NCATS
   * pit: value | synonym | role | onetime | out  (used by the pitfall question)
   * ============================================================ */
  const NCATS = ["Entity", "Attribute", "Attribute value", "Merge into another entity", "Out of scope"];
  const NARR = [
    {
      biz: "Pawfect Grooming",
      text: "Pawfect Grooming, a neighborhood pet salon, wants to retire its paper appointment book. Pet owners phone in to book an appointment for one of their pets. For every pet, the receptionist notes its name, breed and weight. Each appointment is handled by one groomer and is set for a specific date and time. Clients who spend more than $500 a year are tagged with the status “VIP.” The manager wants to see each groomer's bookings for the day.",
      ents: ["Owner", "Pet", "Appointment", "Groomer"], events: ["Appointment"],
      nouns: [
        { n: "pet owners", cat: "Entity", why: "The salon must keep a record for each person who books and owns pets, so Owner is an entity." },
        { n: "pets", cat: "Entity", why: "Each pet has its own details (name, breed, weight), so Pet is an entity." },
        { n: "appointment", cat: "Entity", why: "An appointment is a business event with its own date, time and groomer, so it is an entity." },
        { n: "groomer", cat: "Entity", why: "The manager wants bookings per groomer, so each groomer must be a tracked thing." },
        { n: "breed", cat: "Attribute", of: "Pet", why: "Breed describes a pet; it is a characteristic, not a thing with its own details." },
        { n: "weight", cat: "Attribute", of: "Pet", why: "Weight is one fact about a pet, so it is an attribute of Pet." },
        { n: "date and time", cat: "Attribute", of: "Appointment", why: "When the appointment happens is a detail of the appointment." },
        { n: "“VIP”", cat: "Attribute value", pit: "value", why: "“VIP” is one possible value of a customer-status attribute on Owner, not a separate kind of thing." },
        { n: "clients", cat: "Merge into another entity", pit: "synonym", why: "“Clients” are the same people as “pet owners” — a synonym, so merge them into Owner." },
        { n: "Pawfect Grooming", cat: "Out of scope", pit: "out", why: "The salon is the organization running the system; there is only one of it, so it is not tracked as records." },
        { n: "paper appointment book", cat: "Out of scope", pit: "out", why: "The paper book is the old tool being replaced, not a business thing the new model must store." },
        { n: "receptionist", cat: "Out of scope", pit: "out", why: "Who types the data in is not something the salon asked to track; it describes the process, not the data." },
      ],
      rels: [["Owner", "owns", "Pet"], ["Owner", "books", "Appointment"], ["Appointment", "is for", "Pet"], ["Groomer", "handles", "Appointment"]],
      notRels: [
        { t: "Pet — has — breed", why: "Breed is an attribute of Pet. “Has a breed” describes a characteristic; a relationship links two entities." },
        { t: "Receptionist — notes — weight", why: "Receptionist is out of scope and weight is an attribute, so neither end is an entity in the model." },
        { t: "Pawfect Grooming — retires — appointment book", why: "This describes the project. The business itself and its old paper tool are outside the model." },
        { t: "Client — is tagged — VIP", why: "“VIP” is a value stored in a status attribute; tagging someone is recording an attribute value, not linking two entities." },
      ],
    },
    {
      biz: "Spokes bike share",
      text: "Spokes, a campus bike-share program, rents bikes to riders from docking stations. A rider sets up an account with an email address and a phone number. Each rental begins at one station and records a start time and an end time. Every bike has a serial number and a frame size, and a bike whose status is “Under Repair” cannot be rented. Students and faculty both ride; faculty simply pay a different rate.",
      ents: ["Rider", "Bike", "Station", "Rental"], events: ["Rental"],
      nouns: [
        { n: "riders", cat: "Entity", why: "Spokes keeps an email and phone for each rider and links riders to rentals, so Rider is an entity." },
        { n: "bikes", cat: "Entity", why: "Each bike has a serial number, frame size and status, so Bike is an entity." },
        { n: "docking stations", cat: "Entity", why: "Rentals start at a particular station, and there are many stations, so Station is an entity." },
        { n: "rental", cat: "Entity", why: "A rental is a business event with its own start and end time, so it becomes an entity." },
        { n: "email address", cat: "Attribute", of: "Rider", why: "An email address describes a rider." },
        { n: "frame size", cat: "Attribute", of: "Bike", why: "Frame size is a characteristic of a bike." },
        { n: "start time", cat: "Attribute", of: "Rental", why: "When a rental begins is a detail of that rental." },
        { n: "serial number", cat: "Attribute", of: "Bike", why: "A serial number identifies and describes one bike." },
        { n: "“Under Repair”", cat: "Attribute value", pit: "value", why: "“Under Repair” is one value of the bike's Status attribute, not a new entity." },
        { n: "account", cat: "Merge into another entity", pit: "synonym", why: "The “account” is just the rider's record under another name — merge it into Rider." },
        { n: "students", cat: "Merge into another entity", pit: "role", why: "Students are riders playing a particular role; record the difference with a Rider Type attribute instead of a new entity." },
        { n: "faculty", cat: "Merge into another entity", pit: "role", why: "Faculty are also riders; the different rate is handled by a rider-type attribute, not a separate entity." },
        { n: "Spokes", cat: "Out of scope", pit: "out", why: "Spokes is the organization running the system, not something it tracks many instances of." },
      ],
      rels: [["Rider", "makes", "Rental"], ["Rental", "uses", "Bike"], ["Rental", "starts at", "Station"], ["Station", "docks", "Bike"]],
      notRels: [
        { t: "Bike — has — frame size", why: "Frame size is an attribute of Bike, so this is a characteristic, not a relationship between two entities." },
        { t: "Rider — sets up — account", why: "The account is the Rider record itself (a synonym), so there is no second entity to link." },
        { t: "Faculty — pay — rate", why: "Faculty is a rider role and the rate is an attribute; neither is a separate entity." },
        { t: "Spokes — rents — bikes", why: "Spokes is the organization running the system, so it is out of scope; the real relationship is Rental uses Bike." },
      ],
    },
    {
      biz: "Limestone Catering",
      text: "Limestone Catering books events for clients across southern Indiana. A customer may book several events a year. Each event has a date, a venue address and a guest count. Each event's menu is built from dishes on the company's dish list, and every dish has a name and a price per serving. A head chef is put in charge of each event — the head chef is simply one of the company's employees. Once, a customer left a note that the venue's side door is locked on Sundays.",
      ents: ["Customer", "Event", "Dish", "Employee"], events: ["Event"],
      nouns: [
        { n: "customer", cat: "Entity", why: "The company must track who books events, so Customer is an entity." },
        { n: "events", cat: "Entity", why: "Each catered event has its own date, address and guest count — a business event that becomes an entity." },
        { n: "dishes", cat: "Entity", why: "Dishes have names and prices and are reused across many events, so Dish is an entity." },
        { n: "employees", cat: "Entity", why: "The company needs to know which employee leads each event, so Employee is an entity." },
        { n: "venue address", cat: "Attribute", of: "Event", why: "Where the event is held is a detail of the event." },
        { n: "guest count", cat: "Attribute", of: "Event", why: "Guest count describes one event." },
        { n: "price per serving", cat: "Attribute", of: "Dish", why: "Price per serving describes a dish." },
        { n: "note about the side door", cat: "Attribute", pit: "onetime", why: "A one-off comment is not a thing with its own instances; store it in a Notes attribute (here, on Event)." },
        { n: "clients", cat: "Merge into another entity", pit: "synonym", why: "“Clients” and “customer” mean the same people — confirm and merge into Customer." },
        { n: "head chef", cat: "Merge into another entity", pit: "role", why: "The head chef is an Employee playing a role on an event, not a different kind of thing." },
        { n: "Limestone Catering", cat: "Out of scope", pit: "out", why: "The company is the organization that owns the system, not a record inside it." },
        { n: "southern Indiana", cat: "Out of scope", pit: "out", why: "The general service area is background; nothing in the narrative asks to track regions as records." },
      ],
      rels: [["Customer", "books", "Event"], ["Event", "includes", "Dish"], ["Employee", "leads", "Event"]],
      notRels: [
        { t: "Dish — has — price per serving", why: "Price per serving is an attribute of Dish, not a second entity." },
        { t: "Customer — leaves — note", why: "The note is a one-time detail stored as an attribute, not an entity." },
        { t: "Limestone Catering — serves — southern Indiana", why: "Both the company and the region are out of scope for the model." },
        { t: "Event — has — guest count", why: "Guest count describes an event; a characteristic is an attribute, not a relationship." },
      ],
    },
    {
      biz: "the campus makerspace",
      text: "The campus makerspace lends equipment such as 3D printers and laser cutters. A student must complete a safety training session before reserving any equipment. Each reservation is for one piece of equipment and covers one time slot. For every training session, the makerspace records the date and the staff member who ran it — the “trainer” is just a staff member in that role. Each piece of equipment has an asset tag and a condition; a condition of “Out of Service” blocks new reservations.",
      ents: ["Student", "Equipment", "Reservation", "Training Session", "Staff Member"], events: ["Reservation", "Training Session"],
      nouns: [
        { n: "student", cat: "Entity", why: "Students make reservations and complete training, so the makerspace must track each one." },
        { n: "equipment", cat: "Entity", why: "Each piece has an asset tag and condition and is reserved many times, so Equipment is an entity." },
        { n: "reservation", cat: "Entity", why: "A reservation is a business event with its own time slot, so it is an entity." },
        { n: "training session", cat: "Entity", why: "Each session has a date and a staff member, so it is an event-type entity." },
        { n: "staff member", cat: "Entity", why: "The makerspace records which staff member ran each session." },
        { n: "time slot", cat: "Attribute", of: "Reservation", why: "The time slot is a detail of one reservation." },
        { n: "asset tag", cat: "Attribute", of: "Equipment", why: "An asset tag identifies and describes one piece of equipment." },
        { n: "condition", cat: "Attribute", of: "Equipment", why: "Condition describes the state of a piece of equipment." },
        { n: "3D printers", cat: "Attribute value", pit: "value", why: "“3D printer” is one value of an Equipment Type attribute; making it an entity would need a new entity for every kind of tool." },
        { n: "laser cutters", cat: "Attribute value", pit: "value", why: "“Laser cutter” is another value of Equipment Type, not its own entity." },
        { n: "“Out of Service”", cat: "Attribute value", pit: "value", why: "“Out of Service” is one value of the Condition attribute." },
        { n: "trainer", cat: "Merge into another entity", pit: "role", why: "The trainer is a staff member in a role — merge into Staff Member." },
        { n: "makerspace", cat: "Out of scope", pit: "out", why: "The makerspace is the organization running the system, not a record in it." },
      ],
      rels: [["Student", "makes", "Reservation"], ["Reservation", "is for", "Equipment"], ["Student", "completes", "Training Session"], ["Staff Member", "runs", "Training Session"]],
      notRels: [
        { t: "Equipment — has — asset tag", why: "Asset tag is an attribute of Equipment, so this is a characteristic, not a relationship." },
        { t: "3D printer — is a kind of — equipment", why: "“3D printer” is a value of an Equipment Type attribute, not a separate entity to link to." },
        { t: "Makerspace — lends — equipment", why: "The makerspace is out of scope; the relationship the data needs is Reservation is for Equipment." },
        { t: "Condition — blocks — reservations", why: "This is an operative rule (a condition check), not a structural link between two entities." },
      ],
    },
    {
      biz: "Suds Car Wash",
      text: "Suds Car Wash runs a wash club. A customer can register one or more vehicles, and for each vehicle the club records the license plate and make. Every trip through the wash is logged as a visit with a date and the wash package used. The packages are named Basic, Deluxe and Ultimate, and each has a price. Patrons who choose Ultimate get a free tire shine.",
      ents: ["Customer", "Vehicle", "Visit", "Wash Package"], events: ["Visit"],
      nouns: [
        { n: "customer", cat: "Entity", why: "The club tracks each member customer and their vehicles." },
        { n: "vehicles", cat: "Entity", why: "Each vehicle has a plate and make and belongs to a customer, so Vehicle is an entity." },
        { n: "visit", cat: "Entity", why: "A visit is a business event with its own date and package, so it is an entity." },
        { n: "wash package", cat: "Entity", why: "Packages have names and prices and are reused on many visits, so Wash Package is an entity." },
        { n: "license plate", cat: "Attribute", of: "Vehicle", why: "A license plate describes (and helps identify) a vehicle." },
        { n: "make", cat: "Attribute", of: "Vehicle", why: "Make is a characteristic of a vehicle." },
        { n: "date", cat: "Attribute", of: "Visit", why: "The date is a detail of one visit." },
        { n: "price", cat: "Attribute", of: "Wash Package", why: "Price describes a wash package." },
        { n: "“Deluxe”", cat: "Attribute value", pit: "value", why: "“Deluxe” is one value of the package-name attribute, i.e. one instance of Wash Package, not a separate entity." },
        { n: "“Ultimate”", cat: "Attribute value", pit: "value", why: "“Ultimate” is a value (one package's name), not its own entity." },
        { n: "patrons", cat: "Merge into another entity", pit: "synonym", why: "“Patrons” are the same people as customers — merge the synonym." },
        { n: "trip through the wash", cat: "Merge into another entity", pit: "synonym", why: "A “trip through the wash” is just another name for a Visit." },
        { n: "Suds Car Wash", cat: "Out of scope", pit: "out", why: "The business itself runs the system; it is not tracked as a record." },
      ],
      rels: [["Customer", "registers", "Vehicle"], ["Vehicle", "receives", "Visit"], ["Visit", "uses", "Wash Package"]],
      notRels: [
        { t: "Wash Package — has — price", why: "Price is an attribute of Wash Package, not a separate entity." },
        { t: "Patron — chooses — Ultimate", why: "“Ultimate” is a value (one package's name) and “patron” is a synonym; the real link is Visit uses Wash Package." },
        { t: "Suds Car Wash — runs — wash club", why: "The business and its program are the context, not entities in the model." },
        { t: "Vehicle — has — license plate", why: "License plate describes a vehicle; that makes it an attribute, not a relationship." },
      ],
    },
    {
      biz: "the Writing Center",
      text: "The Writing Center wants to schedule tutoring sessions. Each session pairs one tutor with one student and takes place in a study room. For each student, the center records an ID number, a major and a class year; students whose class year is “Senior” get early booking. Tutors list the subjects they can help with, and a subject can be covered by many tutors. Peer mentors are tutors too and are scheduled the same way.",
      ents: ["Session", "Tutor", "Student", "Study Room", "Subject"], events: ["Session"],
      nouns: [
        { n: "session", cat: "Entity", why: "A tutoring session is a business event linking a tutor, a student and a room, so it is an entity." },
        { n: "tutor", cat: "Entity", why: "The center schedules and tracks each tutor." },
        { n: "student", cat: "Entity", why: "The center records each student's ID, major and class year." },
        { n: "study room", cat: "Entity", why: "Rooms are reused by many sessions, so Study Room is an entity." },
        { n: "subjects", cat: "Entity", why: "Subjects are linked to many tutors (and tutors to many subjects), so Subject is an entity." },
        { n: "ID number", cat: "Attribute", of: "Student", why: "An ID number identifies and describes one student." },
        { n: "major", cat: "Attribute", of: "Student", why: "Major is a characteristic of a student." },
        { n: "class year", cat: "Attribute", of: "Student", why: "Class year describes a student." },
        { n: "“Senior”", cat: "Attribute value", pit: "value", why: "“Senior” is one value of the Class Year attribute." },
        { n: "peer mentors", cat: "Merge into another entity", pit: "role", why: "Peer mentors are tutors in a particular role; merge them into Tutor." },
        { n: "Writing Center", cat: "Out of scope", pit: "out", why: "The Writing Center is the organization running the system." },
      ],
      rels: [["Tutor", "leads", "Session"], ["Student", "attends", "Session"], ["Session", "is held in", "Study Room"], ["Tutor", "covers", "Subject"]],
      notRels: [
        { t: "Student — has — major", why: "Major is an attribute of Student, not an entity." },
        { t: "Senior — gets — early booking", why: "“Senior” is an attribute value, and early booking is an operative rule, not a structural link." },
        { t: "Writing Center — schedules — sessions", why: "The Writing Center is the organization itself, outside the model." },
        { t: "Peer mentor — is — tutor", why: "This is a synonym/role statement telling you to merge, not a relationship between two different entities." },
      ],
    },
  ];
  const PIT = {
    value: "It treats an attribute value as an entity",
    synonym: "It creates a duplicate entity for a synonym",
    role: "It mistakes a role for a new entity",
    onetime: "It models a one-time detail as an entity",
    out: "It is outside the scope of the system",
  };
  const PITWHY = {
    value: "A value such as “Gold” or “VIP” is the content of an attribute for one instance, not a kind of thing.",
    synonym: "Two words for the same thing (client / customer) should be confirmed with stakeholders and merged.",
    role: "A role (manager, head chef, trainer) is a part an existing entity plays; record it as an attribute or relationship.",
    onetime: "A one-off note or comment belongs in an attribute, not in its own entity.",
    out: "Some nouns describe the organization itself, the old tool, or where work happens — not data the system must track.",
  };

  /* ============================================================
   * LESSONS
   * ============================================================ */
  const notes = [
    {
      title: "Why businesses need a data model",
      lo: "Explain how data models organize business information and why that matters.",
      html: `<p>Picture <b>The Daily Grind</b>, a campus coffee shop whose owner keeps customers in one spiral notebook, orders in another and inventory on sticky notes. Orders go missing, popular items run out, and nobody can say who the best customers are. The problem is not a lack of data — it is that the data has no agreed <em>structure</em>.</p>
<p>A <b>data model</b> is a blueprint for how a system's data is organized, structured and related. It settles three things before anything is built: <b>what</b> information is stored, <b>how</b> the pieces connect, and <b>which rules</b> the data must follow. Like an architect's blueprint, it is cheap to change on paper and expensive to change once the building is up.</p>
<p>A good model pays off in five ways:</p>
<ul>
<li><b>Consistency</b> — everyone reads “customer” or “order” the same way.</li>
<li><b>Efficiency</b> — each fact is stored once and reused by many apps and reports.</li>
<li><b>Accuracy</b> — relationships and rules block errors such as an order with no customer.</li>
<li><b>Scalability</b> — the structure can grow as the business adds stores, products or channels.</li>
<li><b>Communication</b> — managers and technical staff share one vocabulary and one picture.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> A data model decides what is stored, how it connects and what rules govern it — before any database exists.</div>
<div class="example"><b>Example.</b> If the shop's model says “every order belongs to exactly one customer,” then a monthly report of top customers is just a count of orders per customer. In the notebooks, the same question means flipping pages and guessing which “J. Smith” is which.</div>
<div class="trap"><b>Common trap.</b> Thinking a data model is just “the database.” The model is the plan; the database is one way of building it. A shop can have a bad database because it never had a clear model.</div>`,
      gens: ["k201-ch6-models"],
    },
    {
      title: "Conceptual, logical and physical models",
      lo: "Distinguish conceptual, logical and physical models and how each moves from requirements toward a database.",
      html: `<p>Data models are built in three passes, each more detailed and aimed at a different audience:</p>
<table class="tbl"><thead><tr><th>Model</th><th>What it shows</th><th>Main audience</th><th>Architect analogy</th></tr></thead><tbody>
<tr><td><b>Conceptual</b></td><td>The important business “things” and how they connect; a few key attributes at most. No data types, keys or storage.</td><td>Business stakeholders</td><td>A bubble sketch drawn with the client: “kitchen next to the dining room,” no measurements</td></tr>
<tr><td><b>Logical</b></td><td>Every entity, attribute and relationship in a full ERD, with redundancy removed (normalization). Still independent of any database product.</td><td>Business analysts</td><td>A floor plan with every room dimensioned</td></tr>
<tr><td><b>Physical</b></td><td>The real implementation in one database system: tables, exact data types, indexes, constraints (SQL).</td><td>Database administrators</td><td>Construction blueprints with materials and wiring</td></tr>
</tbody></table>
<p>This chapter lives at the <b>conceptual</b> level. A conceptual model answers three questions: <em>What are the important things? How do they connect? What rules govern those connections?</em></p>
<div class="keyidea"><b>Key idea.</b> Start with the business, not the database tool. A mistake caught in a conceptual sketch costs a conversation and an eraser; the same mistake found after the database holds real data costs weeks of rework, data migration and lost trust.</div>
<div class="example"><b>Example.</b> A bookstore owner looks at a sketch with boxes for Customer, Account and Order and says, “No — one customer can have several accounts, one for the café and one for books.” Fixing that line on a whiteboard takes a minute. Fixing it after thousands of orders are stored means rewriting tables and moving data.</div>
<div class="trap"><b>Common trap.</b> Putting data types (VARCHAR, DECIMAL) or indexes into a conceptual model. Those are physical decisions; they clutter the picture and make it unreadable for the business people who must confirm it.</div>`,
      gens: ["k201-ch6-models"],
    },
    {
      title: "Building blocks: entities, attributes, values and relationships",
      lo: "Define and apply entities, attributes, attribute values and relationships.",
      html: `<ul>
<li>An <b>entity</b> is a person, place, object, event or concept the business needs to keep track of — many instances of it, each with its own details. Some are tangible (Customer, Product, Employee); many are <b>business events</b> (Order, Reservation, Service Call, Registration).</li>
<li>An <b>attribute</b> is a named characteristic that describes an entity: Customer has Customer ID, First Name, Email; Product has Product ID, Name, Size, Price.</li>
<li>An <b>attribute value</b> is the actual data for one instance: <code>jlee@example.com</code> is a value of Email; “Large” is a value of Size.</li>
<li>A <b>relationship</b> is how two entities are associated: Customer <em>places</em> Order; Supplier <em>provides</em> Product; Student <em>enrolls in</em> Class.</li>
</ul>
<div class="keyidea"><b>Key idea.</b> Entity = the kind of thing (a table-to-be). Attribute = a column describing it. Value = what's in one cell. Relationship = a verb linking two entities.</div>
<div class="example"><b>Example.</b> At a gym: Member is an entity; Membership Type is an attribute; “Gold” is a value of Membership Type; “Member <em>registers for</em> Class” is a relationship.</div>
<div class="trap"><b>Common trap.</b> Promoting a value to an entity. “Gold Member” is not a new entity — it is a Member whose Membership Type value is “Gold.” If you made Gold Member, Silver Member and Bronze Member separate entities, you would need a new entity every time marketing invents a tier.</div>
<p>This entity–relationship approach fits <b>structured</b> data (fields and records). Emails, videos, comments and documents are unstructured and are handled differently later in the course.</p>`,
      gens: ["k201-ch6-components"],
    },
    {
      title: "Gathering requirements, setting scope and validating",
      lo: "Translate requirements into model components; define and validate scope; test the model with stakeholders and scenarios.",
      html: `<p>Stakeholders describe their business in everyday language — “I need to know which customers haven't paid,” “each patient can see more than one doctor, but every appointment is with exactly one.” The modeler's job is to turn that language into structure. Four elicitation techniques help:</p>
<table class="tbl"><thead><tr><th>Technique</th><th>What it is</th><th>Best when</th></tr></thead><tbody>
<tr><td><b>Stakeholder interviews</b></td><td>One-on-one conversations about goals and pain points</td><td>Early, to learn what people need</td></tr>
<tr><td><b>Document analysis</b></td><td>Studying forms, spreadsheets, invoices, reports</td><td>Any time — shows the data people really record by hand</td></tr>
<tr><td><b>Observation</b></td><td>Watching the work as it is actually done</td><td>When the official procedure may not match practice</td></tr>
<tr><td><b>JAD sessions</b> (Joint Application Design)</td><td>Structured, facilitated group workshops</td><td>When several departments' needs must be reconciled</td></tr>
</tbody></table>
<p>Useful interview prompts: <em>Walk me through it from start to finish. What do you write down on paper or in a spreadsheet? What information do you wish you could get easily? What has gone wrong because information was missing or wrong?</em></p>
<p><b>Traceability.</b> Every entity, attribute, relationship and rule should trace back to a stakeholder need or a business document. If the team can't explain why a rule exists, go back to the stakeholders.</p>
<p><b>Scope.</b> Decide what is in and out, and guard against scope creep, by asking “<em>What decision will this data support?</em>” <b>Validation.</b> Walk stakeholders through concrete scenarios (“Can someone register without an active membership? What happens when a class is full?”). Their answers confirm or change the model — conceptual modeling is iterative.</p>
<div class="keyidea"><b>Key idea.</b> Models come from evidence (interviews, documents, observation, workshops), are bounded by the decisions they support, and are confirmed by testing them against real scenarios.</div>
<div class="example"><b>Example.</b> At The Daily Grind, the owner says in an interview that every order is rung up at the register. Watching the morning rush (observation) shows baristas scribbling mobile-order names on cups that never reach the register — a data gap no interview revealed.</div>
<div class="trap"><b>Common trap.</b> Treating scope as “everything the business does.” Payroll or building maintenance may matter to the organization, but if they don't support the decisions this system is for, they are out of scope (or out for now).</div>`,
      gens: ["k201-ch6-elicit"],
    },
    {
      title: "The noun/verb technique and its pitfalls",
      lo: "Use requirements narratives and the noun/verb technique to find entities, attributes and relationships.",
      html: `<p>Write (or collect) a short narrative of how the business works, then read it twice: <b>nouns</b> are candidate entities or attributes; <b>verbs</b> that connect nouns are candidate relationships. Then filter the nouns:</p>
<ol>
<li><b>Merge synonyms</b> — “fitness classes” and “class” are one entity.</li>
<li><b>Merge roles</b> — members who are students and members who are staff are all Members.</li>
<li><b>Drop out-of-scope nouns</b> — the organization running the system, the place where work happens (front desk), the old tool being replaced.</li>
<li><b>Demote descriptions to attributes</b> — scheduled time describes a Class; registration date describes a Registration.</li>
<li><b>Promote business events</b> — if “registering” has its own details (date, fee paid), Registration becomes an entity even though it started as a verb.</li>
</ol>
<p><b>Campus Recreation Center walkthrough.</b> Candidate nouns include recreation center, fitness classes, class, instructors, members, students, staff, membership, room, scheduled time, front desk, registration date and class fee. After filtering, the entities are <b>Member, Membership, Class, Instructor, Room</b> and <b>Registration</b>. Relationships come from the verbs: Instructor <em>teaches</em> Class; Class <em>is held in</em> Room; Member <em>purchases</em> Membership; Member <em>registers for</em> Class (recorded through Registration).</p>
<div class="keyidea"><b>Key idea.</b> Nouns → entities or attributes; verbs → relationships; then merge, drop, demote and promote until every entity is a thing the business tracks many instances of.</div>
<div class="example"><b>Example.</b> “A <u>patron</u> checks out <u>books</u> at the <u>circulation desk</u>; each <u>loan</u> has a <u>due date</u>.” Patron, Book and Loan are entities; due date is an attribute of Loan; the circulation desk is just where the action happens (out of scope); “checks out” becomes the relationship recorded by Loan.</div>
<div class="trap"><b>Common traps.</b> (1) Treating an attribute value as an entity (“Gold Member”). (2) Keeping duplicate entities for synonyms (“client” and “customer” — confirm, then merge). (3) Turning a role into a new entity (“the manager” is usually an Employee). (4) Modeling a one-time detail as an entity (a single delivery note is an attribute).</div>`,
      gens: ["k201-ch6-nounverb"],
    },
    {
      title: "Business rules: structural vs. operative",
      lo: "Identify and classify business rules and connect them to modeling decisions.",
      html: `<p>A <b>business rule</b> is a statement that defines or constrains how the business operates. Rules are the raw material of a data model, and they come in two kinds:</p>
<ul>
<li><b>Structural rules</b> state facts about how the business is organized and how data connects: “A customer can place many orders; an order belongs to exactly one customer.” They shape the model directly — which entities exist, which relationships link them, and the cardinality.</li>
<li><b>Operative (action) rules</b> constrain what may or may not be done: “An order cannot ship until it is paid in full.” They describe a condition the future system, the process, or a responsible employee must enforce.</li>
</ul>
<p>Quick test: does the rule describe <em>what exists and how it's connected</em> (structural), or <em>whether an action is allowed right now</em> (operative)? Words like “cannot … until,” “must be approved,” “only if,” “is blocked when” usually signal an operative rule.</p>
<div class="keyidea"><b>Key idea.</b> Structural rules draw the boxes, lines and crow's feet. Operative rules become checks that run when someone tries to do something.</div>
<div class="example"><b>Example.</b> At a hospital clinic: “Each appointment is with exactly one doctor” is structural (it sets the Doctor–Appointment cardinality). “A prescription cannot be refilled without the prescribing doctor's approval” is operative (it controls an action).</div>
<div class="trap"><b>Common trap.</b> Calling every sentence with “must” operative. “Every order must belong to exactly one customer” uses “must,” but it describes how data connects — it is structural.</div>`,
      gens: ["k201-ch6-rules"],
    },
    {
      title: "Cardinality and simplified crow's foot ERDs",
      lo: "Read and construct a basic conceptual ERD with 1:1, 1:N and M:N relationships in simplified crow's foot notation.",
      html: `<p><b>Cardinality</b> says how many instances of one entity can be linked to an instance of another. Always read the business rule in <b>both directions</b>:</p>
<ul>
<li><b>1:1</b> — one employee has one employee profile, and each profile belongs to one employee.</li>
<li><b>1:N</b> — one customer can place many orders, but each order belongs to one customer.</li>
<li><b>M:N</b> — an order can contain many products, and a product (say, a 12-oz bag of house blend) can appear on many orders.</li>
</ul>
<p>1:N and M:N are by far the most common. An <b>ERD</b> (entity-relationship diagram) maps entities and their relationships; a conceptual ERD shows entity names and relationships with few or no attributes, while a logical ERD lists every attribute. In <b>crow's foot</b> notation (used by Lucidchart, draw.io and MySQL Workbench), the symbol at each end of a line shows cardinality. In the simplified version used here, the <b>crow's foot marks the side where many instances can occur</b>; a single bar means one.</p>
${erd("Supplier", "Product", false, true, "provides")}
<p>Supplier–Product is <b>1:N</b>: the foot sits at Product because one supplier provides many products.</p>
${erd("Student", "Class", true, true, "enrolls in")}
<p>Student–Class is <b>M:N</b>: feet at both ends.</p>
<div class="keyidea"><b>Key idea.</b> Ask “one A → how many B?” and “one B → how many A?” Many in both answers → M:N, feet at both ends. Many in one answer → 1:N, foot at the many side. Many in neither → 1:1.</div>
<div class="example"><b>Example (Global Grains &amp; Coffee).</b> Customer–Order is 1:N (foot at Order); Order–Product is M:N; Store Location–Product is M:N (stores sell many products, products are sold in many stores); Store Location–Employee is 1:N because each employee has exactly one home store.</div>
<div class="trap"><b>Common trap.</b> Reading only one direction. “One instructor teaches many classes” alone does not tell you whether the link is 1:N or M:N — you must also ask how many instructors one class can have. And the foot goes on the <em>many</em> side, not next to the entity that “has” many.</div>`,
      gens: ["k201-ch6-cardinality", "k201-ch6-crowsfoot"],
    },
    {
      title: "Business rules and data integrity",
      lo: "Explain how conceptual business rules support data integrity and connect to later controls.",
      html: `<p><b>Data integrity</b> is the accuracy, consistency and reliability of business data as it is collected, stored and used. Each integrity requirement you write at the conceptual stage tells the system what to protect, and later becomes a concrete control:</p>
<table class="tbl"><thead><tr><th>Business requirement</th><th>What it protects</th><th>Later control</th></tr></thead><tbody>
<tr><td>Every customer has a unique identifier</td><td>Every record can be told apart</td><td>Primary key / identifier</td></tr>
<tr><td>Every order belongs to an existing customer</td><td>Relationships stay valid</td><td>Relationship (foreign key) constraint</td></tr>
<tr><td>Product price must be greater than 0</td><td>Stored values obey validity rules</td><td>Validation rule</td></tr>
<tr><td>A suspended customer cannot place a new order</td><td>A business condition is checked before an action</td><td>Operative-rule check</td></tr>
</tbody></table>
<div class="keyidea"><b>Key idea.</b> Technology can enforce only the rules the organization has identified and defined correctly. Managers stay responsible for deciding which rules matter, handling exceptions and checking that the data is right.</div>
<div class="example"><b>Example.</b> A café's system accepts an order for “Customer 0” because no one wrote the rule “every order must belong to an existing customer.” The software did exactly what it was told — the gap was in the requirements.</div>
<div class="trap"><b>Common trap.</b> Mixing up a validity rule and a condition check. “Price &gt; 0” tests a single stored value; “a suspended customer cannot order” checks the state of the business before allowing an action.</div>`,
      gens: ["k201-ch6-integrity", "k201-ch6-rules"],
    },
  ];

  /* ============================================================
   * FLASHCARDS
   * ============================================================ */
  const flashcards = [
    { id: "k201-ch6-c-datamodel", tag: "Definition", front: "What is a <em>data model</em>?", back: "A blueprint for how a system's data is organized, structured and related: what is stored, how the pieces connect, and which rules govern the data." },
    { id: "k201-ch6-c-advantages", tag: "List", front: "Name the five advantages of a good data model.", back: "<b>Consistency</b> (same meaning for everyone), <b>Efficiency</b> (store once, reuse), <b>Accuracy</b> (rules prevent errors), <b>Scalability</b> (grows with the business), <b>Communication</b> (shared language between business and IT)." },
    { id: "k201-ch6-c-threemodels", tag: "Distinction", front: "Conceptual vs. logical vs. physical model: what does each show, and for whom?", back: "<b>Conceptual</b>: main things and connections, for business stakeholders. <b>Logical</b>: all entities, attributes, relationships, normalized, technology-independent, for analysts. <b>Physical</b>: tables, data types, indexes, constraints in one DBMS, for DBAs." },
    { id: "k201-ch6-c-architect", tag: "Example", front: "Match the architect analogy to the three model levels.", back: "Bubble sketch with the client (“kitchen near dining room”) = <b>conceptual</b>; dimensioned floor plan = <b>logical</b>; construction blueprints with materials and wiring = <b>physical</b>." },
    { id: "k201-ch6-c-businessfirst", tag: "Why", front: "Why start with the business rather than opening a database tool?", back: "An error found in a conceptual sketch costs a conversation; found after the database holds production data, it costs weeks of rework, data migration and lost trust. A conceptual model also lets non-technical people confirm “yes, that's how we work.”" },
    { id: "k201-ch6-c-cdmquestions", tag: "List", front: "What three questions does a conceptual data model answer?", back: "What are the important “things”? How do they connect? What rules govern those connections?" },
    { id: "k201-ch6-c-entity", tag: "Definition", front: "What is an <em>entity</em>? Give a tangible and an event example.", back: "A person, place, object, event or concept the business needs to track. Tangible: Customer, Product. Event: Order, Reservation, Service Call." },
    { id: "k201-ch6-c-attrvalue", tag: "Distinction", front: "Attribute vs. attribute value — what's the difference?", back: "An <b>attribute</b> is a named characteristic of an entity (Email). An <b>attribute value</b> is the data for one instance (<code>ana@example.com</code>)." },
    { id: "k201-ch6-c-relationship", tag: "Definition", front: "What is a <em>relationship</em>? Give two examples.", back: "How two entities are associated, usually a verb: Customer <em>places</em> Order; Supplier <em>provides</em> Product." },
    { id: "k201-ch6-c-cardinality", tag: "Definition", front: "What is <em>cardinality</em>, and what are the three types?", back: "How many instances of one entity can be associated with instances of another: one-to-one (1:1), one-to-many (1:N), many-to-many (M:N). 1:N and M:N are most common." },
    { id: "k201-ch6-c-bothways", tag: "Why", front: "Why must you read a business rule in both directions?", back: "One direction alone can't separate 1:N from M:N. “One student takes many classes” fits both; you also need “one class has many students” (→ M:N) or “one class has one student” (→ 1:N)." },
    { id: "k201-ch6-c-crowsfoot", tag: "Principle", front: "In simplified crow's foot notation, where does the crow's foot go?", back: "On the side where <b>many</b> instances can occur. Supplier–Product (1:N): foot at Product. Student–Class (M:N): feet at both ends." },
    { id: "k201-ch6-c-erd", tag: "Distinction", front: "Conceptual ERD vs. logical ERD?", back: "Conceptual: entity names and relationships, perhaps a few key attributes, uncluttered for business people. Logical: every attribute of every entity." },
    { id: "k201-ch6-c-businessrule", tag: "Definition", front: "What is a <em>business rule</em>?", back: "A statement that defines or constrains some aspect of how the business operates — the raw material of data modeling." },
    { id: "k201-ch6-c-structop", tag: "Distinction", front: "Structural vs. operative rule — define each with an example.", back: "<b>Structural</b>: how the business is organized and data connects (“an order belongs to exactly one customer”) → shapes entities, relationships, cardinality. <b>Operative</b>: what actions are allowed (“an order can't ship until paid”) → a condition the system, process or employee must enforce." },
    { id: "k201-ch6-c-nounverb", tag: "Principle", front: "What is the noun/verb technique?", back: "Read a requirements narrative: nouns are candidate entities or attributes; verbs connecting nouns are candidate relationships. Then filter (merge synonyms/roles, drop out-of-scope, demote descriptions to attributes)." },
    { id: "k201-ch6-c-pitfalls", tag: "List", front: "Name four common noun/verb modeling pitfalls.", back: "(1) Attribute value as entity (“Gold Member”). (2) Duplicate entities for synonyms (client/customer). (3) A role as a new entity (“the manager” is an Employee). (4) A one-time detail as an entity (a single delivery note)." },
    { id: "k201-ch6-c-eventent", tag: "Why", front: "Why did <em>Registration</em> become an entity in the Campus Recreation Center example?", back: "Registering is a business event with its own details (registration date, fee-paid status). Entities can come from events, not only from nouns." },
    { id: "k201-ch6-c-techniques", tag: "List", front: "Name the four requirements-gathering techniques and when each fits.", back: "<b>Interviews</b> (early; goals and pain points), <b>document analysis</b> (any time; what's really recorded), <b>observation</b> (when stated procedure may differ from practice), <b>JAD sessions</b> (when several departments' needs must be reconciled)." },
    { id: "k201-ch6-c-jad", tag: "Definition", front: "What is a JAD session?", back: "Joint Application Design: a structured, facilitated group workshop with multiple stakeholders, used to reconcile the needs of several departments." },
    { id: "k201-ch6-c-traceability", tag: "Principle", front: "What is traceability, and what do you do if a rule can't be traced?", back: "Every entity, attribute, relationship and rule should trace to a stakeholder need or business document. If no one can explain why a rule exists, return to the stakeholders." },
    { id: "k201-ch6-c-scope", tag: "Principle", front: "What guiding question helps define scope and prevent scope creep?", back: "“What decision will this data support?” Items that don't serve that decision (e.g., payroll for a class-registration system) are out of scope." },
    { id: "k201-ch6-c-validate", tag: "Example", front: "Give two scenario questions for validating the Campus Rec model.", back: "Can someone register without an active membership? Can a class run without an instructor or room? Can one instructor teach several classes? What happens when a class hits maximum capacity?" },
    { id: "k201-ch6-c-integrity", tag: "Definition", front: "What is <em>data integrity</em>?", back: "The accuracy, consistency and reliability of business data as it is collected, stored and used." },
    { id: "k201-ch6-c-controls", tag: "List", front: "Match four integrity requirements to later controls.", back: "Unique identifier → primary key; order belongs to existing customer → relationship (foreign key) constraint; price &gt; 0 → validation rule; suspended customer can't order → operative-rule condition check." },
    { id: "k201-ch6-c-managers", tag: "Why", front: "If software enforces rules, why are managers still responsible for data integrity?", back: "Technology enforces only the rules the organization identifies and defines correctly. Managers decide which rules matter, resolve exceptions and validate that data is right." },
    { id: "k201-ch6-c-ggc", tag: "Example", front: "Global Grains &amp; Coffee: give the cardinality of Customer–Order, Order–Product, Store–Product and Store–Employee.", back: "Customer–Order 1:N; Order–Product M:N; Store–Product M:N; Store–Employee 1:N (each employee has exactly one home store)." },
    { id: "k201-ch6-c-structured", tag: "Distinction", front: "What kind of data does the ER approach suit best?", back: "Structured data organized in fields and records. Unstructured data (emails, videos, comments, documents) is handled differently later." },
  ];

  /* ============================================================
   * CUE TABLE
   * ============================================================ */
  const cues = [
    { when: "A noun that names something with many instances and its own details", think: "Entity", why: "The business needs a record for each one (Customer, Product, Order)." },
    { when: "A noun that describes something else (date, price, size, email)", think: "Attribute", why: "It is a characteristic of an entity, not a thing with its own instances." },
    { when: "A specific label like “Gold,” “VIP,” “Senior,” “Under Repair”", think: "Attribute value", why: "It is the content of an attribute for one instance — don't make it an entity." },
    { when: "Two different words for the same thing (client / customer)", think: "Synonym → merge", why: "Confirm with stakeholders, then keep one entity." },
    { when: "“the manager,” “head chef,” “trainer,” “student members”", think: "Role → merge", why: "An existing entity playing a part; use an attribute or relationship, not a new entity." },
    { when: "A verb linking two entities (places, teaches, is held in)", think: "Relationship", why: "Verbs connecting nouns are candidate relationships." },
    { when: "“…can have many…” in one direction only", think: "Check the other direction", why: "One direction can't tell 1:N from M:N." },
    { when: "“many” both ways", think: "M:N, crow's feet at both ends", why: "Each side can relate to many of the other." },
    { when: "“cannot … until,” “must be approved,” “is blocked when”", think: "Operative rule", why: "It constrains an action; the system or an employee enforces it." },
    { when: "“each X belongs to exactly one Y,” “can contain many”", think: "Structural rule", why: "It describes how data connects and sets cardinality." },
    { when: "Needs from several departments conflict", think: "JAD session", why: "A facilitated group workshop reconciles them." },
    { when: "“That's how we're supposed to do it…”", think: "Observation", why: "Watch the real work; stated procedure may differ from practice." },
    { when: "Old forms, invoices, spreadsheets on hand", think: "Document analysis", why: "They show the data people actually record." },
    { when: "“Every record must be distinguishable”", think: "Unique identifier → primary key", why: "Each instance needs an identifier no other shares." },
    { when: "“…must refer to an existing customer / class / store”", think: "Valid relationship → foreign key constraint", why: "Links must point to real records." },
    { when: "Scope keeps growing", think: "“What decision will this data support?”", why: "The guiding question keeps unrelated data out." },
  ];

  /* ============================================================
   * TOPIC 1 · Data models and the three levels
   * ============================================================ */
  const MODEL_BANK = [
    { t: "A one-page sketch with boxes for Customer, Order and Product, reviewed with the shop owner", cat: "Conceptual", why: "Just the major things and their links, for a business audience." },
    { t: "A diagram that deliberately leaves out data types, keys and storage choices", cat: "Conceptual", why: "Leaving out technical detail is the defining feature of the conceptual level." },
    { t: "The “bubble diagram” stage — “the kitchen should sit next to the dining room,” no measurements", cat: "Conceptual", why: "The architect's first sketch with the client maps to the conceptual model." },
    { t: "A model whose main audience is business stakeholders and managers", cat: "Conceptual", why: "Conceptual models are built so non-technical people can confirm them." },
    { t: "A picture that lets the owner say “no, one customer can have several accounts” before any code exists", cat: "Conceptual", why: "Catching business misunderstandings early is the job of the conceptual model." },
    { t: "A model that answers “what are the important things and how do they connect?”", cat: "Conceptual", why: "Those are the guiding questions of a conceptual model." },
    { t: "A complete ERD listing every attribute of every entity, not tied to any database product", cat: "Logical", why: "Full detail but still technology-independent is the logical level." },
    { t: "Redundancy removed through normalization", cat: "Logical", why: "Normalization is done in the logical model." },
    { t: "A model whose main audience is business analysts", cat: "Logical", why: "Analysts work with the detailed, technology-independent logical model." },
    { t: "The dimensioned floor plan in the architect analogy", cat: "Logical", why: "Exact rooms and measurements, but not yet materials — the logical level." },
    { t: "Specifies that Customer has First Name, Last Name, Email and Phone, without saying how they'll be stored", cat: "Logical", why: "All attributes named, but no data types or storage — logical." },
    { t: "Detailed and complete, yet would work equally well in SQL Server or MySQL", cat: "Logical", why: "Being technology-independent while fully detailed marks the logical model." },
    { t: "CREATE TABLE statements with column types like VARCHAR(50) and DECIMAL(8,2)", cat: "Physical", why: "Exact data types in a specific database system are physical." },
    { t: "An index added so lookups by email address run faster", cat: "Physical", why: "Indexes are an implementation choice in the physical model." },
    { t: "A model whose main audience is database administrators", cat: "Physical", why: "DBAs build and tune the physical implementation." },
    { t: "The construction blueprints, with materials and wiring", cat: "Physical", why: "The most detailed, build-ready stage maps to the physical model." },
    { t: "A design written specifically for the company's SQL Server database", cat: "Physical", why: "Tied to one database product, so it is physical." },
    { t: "NOT NULL and CHECK constraints declared on real table columns", cat: "Physical", why: "Constraints on actual columns are part of the physical implementation." },
  ];
  const MODEL_DEFS = { Conceptual: "major business things and connections, no technical detail; for business stakeholders", Logical: "all entities, attributes and relationships, normalized, technology-independent; for analysts", Physical: "tables, data types, indexes and constraints in one database system; for DBAs" };
  const ADV = [
    { s: "Marketing, finance and the store managers all count a “customer” the same way, so their reports finally agree.", a: "Consistency" },
    { s: "The barista and the accountant used to define “an order” differently; now one definition is used everywhere.", a: "Consistency" },
    { s: "A customer's address is stored once and reused by billing, shipping and the loyalty app.", a: "Efficiency" },
    { s: "New reports pull from the same product list instead of each report keeping its own copy.", a: "Efficiency" },
    { s: "The system refuses an order that isn't linked to a real customer, so orphan orders disappear.", a: "Accuracy" },
    { s: "A rule that every price must be positive stops a $0.00 latte from being saved by mistake.", a: "Accuracy" },
    { s: "When the shop opens a second and third location, the same structure absorbs the new stores without a redesign.", a: "Scalability" },
    { s: "Adding an online channel just means more Order records, not a new set of notebooks.", a: "Scalability" },
    { s: "The owner and the IT contractor point at the same diagram and agree on what “membership” means.", a: "Communication" },
    { s: "A shared ERD gives non-technical managers and developers one vocabulary for planning meetings.", a: "Communication" },
  ];
  const ADVS = ["Consistency", "Efficiency", "Accuracy", "Scalability", "Communication"];
  const ADV_DEF = { Consistency: "everyone interprets the data the same way", Efficiency: "data is stored once and reused", Accuracy: "relationships and rules prevent errors", Scalability: "the structure grows with the business", Communication: "a shared language for technical and non-technical people" };
  const ARCH = [
    { stage: "the architect sits with the client and sketches bubbles: “bedrooms upstairs, kitchen next to the dining room”", m: "Conceptual" },
    { stage: "the architect produces a floor plan with every room's dimensions marked", m: "Logical" },
    { stage: "the builder receives blueprints listing materials, wiring and plumbing runs", m: "Physical" },
  ];
  const AUD = [
    { who: "the coffee-shop owner, who has never used a database", m: "Conceptual" },
    { who: "a business analyst checking that no fact is stored twice", m: "Logical" },
    { who: "a database administrator choosing data types and indexes", m: "Physical" },
  ];
  const genModels = STUDY.makeGenerator({
    id: "k201-ch6-models",
    name: "Data models: purpose and the three levels",
    blurb: "Why businesses model data, and how conceptual, logical and physical models differ in detail and audience.",
    variants: [
      ...K.sortVariants({ key: "k201-ch6-models", bank: MODEL_BANK, cats: ["Conceptual", "Logical", "Physical"], defs: MODEL_DEFS, ask: "description", hint: "Ask how much technical detail is present and who the model is for: business people, analysts or DBAs." }),
      {
        name: "Architect analogy and audience",
        make() {
          const useArch = Math.random() < 0.5;
          const it = useArch ? U.pick(ARCH) : U.pick(AUD);
          const q = useArch ? `<p>In the architect analogy for data models, ${it.stage}. Which data model does this stage correspond to?</p>`
            : `<p>A modeling team needs to review a model with ${it.who}. Which level of data model is pitched at this audience?</p>`;
          const W = { Conceptual: "Conceptual is the no-measurements sketch for business stakeholders.", Logical: "Logical is the detailed, technology-independent plan for analysts.", Physical: "Physical is the build-ready implementation for DBAs." };
          return Q.mc({
            q, right: it.m, rightWhy: W[it.m],
            wrong: ["Conceptual", "Logical", "Physical", "Operational"].filter(x => x !== it.m).map(x => ({ t: x, why: x === "Operational" ? "“Operational” is not one of the three model levels (conceptual, logical, physical)." : W[x] + " That does not match this description." })),
            keepOrder: ["Conceptual", "Logical", "Physical", "Operational"],
            sol: S("The levels add detail in order: sketch (conceptual) → dimensioned plan (logical) → construction blueprint (physical).", `Here the answer is <b>${it.m}</b>: ${W[it.m]}`),
          });
        },
      },
      {
        name: "Which advantage is this?",
        make() {
          const it = U.pick(ADV);
          return Q.mc({
            q: `<p>After The Daily Grind adopts a data model:</p>${quote(it.s)}<p>Which advantage of data modeling does this illustrate best?</p>`,
            right: it.a, rightWhy: `${it.a}: ${ADV_DEF[it.a]}.`,
            wrong: ADVS.filter(a => a !== it.a).map(a => ({ t: a, why: `${a} means ${ADV_DEF[a]} — not the main point of this scenario.` })),
            keepOrder: ADVS,
            sol: S("Match the scenario to one of the five benefits: consistency, efficiency, accuracy, scalability, communication.", `The core of the scenario is that ${ADV_DEF[it.a]}, so it is <b>${it.a}</b>.`),
          });
        },
      },
      K.conceptVariant("Start with the business", "k201-ch6-bizfirst", [
        {
          q: "A new IT hire wants to open the database tool on day one and start creating tables for The Daily Grind. What is the strongest reason to build a conceptual model first?",
          right: "Fixing a misunderstanding on a sketch is cheap; fixing it after real data is loaded means rework and migration",
          wrong: [
            { t: "Database tools cannot create tables without a conceptual model file", why: "Tools will happily create tables; the risk is building the wrong ones." },
            { t: "Conceptual models specify the exact data types the tables need", why: "Data types belong to the physical model, not the conceptual one." },
            { t: "It removes the need to talk to stakeholders later", why: "The opposite — the conceptual model is what stakeholders review and correct, iteratively." },
          ],
          sol: ["Think about when errors are cheapest to fix.", "A sketch error costs a conversation; a production-database error costs weeks of rework, migration and trust."],
        },
        {
          q: "Why is a conceptual model the right thing to show a non-technical store owner?",
          right: "It shows only the business things and how they connect, so she can confirm or correct it",
          wrong: [
            { t: "It contains every attribute so she can check each column", why: "Listing every attribute is the logical model; it would bury her in detail." },
            { t: "It shows the indexes that will make her reports fast", why: "Indexes are physical design, meaningless to most owners." },
            { t: "It is written in SQL, which is easy to read", why: "SQL is the physical implementation, not the conceptual model." },
          ],
          sol: ["Match the model's level of detail to its audience.", "Conceptual = uncluttered picture of things and connections, built for business stakeholders to validate."],
        },
        {
          q: "Which statement about a conceptual data model is accurate?",
          right: "It is technology-independent and leaves out data types, keys and storage details",
          wrong: [
            { t: "It is the version tuned for a specific database product", why: "That is the physical model." },
            { t: "It is produced after the physical tables are built", why: "It comes first; it guides everything after it." },
            { t: "It removes redundancy through normalization", why: "Normalization is a logical-model activity." },
          ],
          sol: ["Recall what the conceptual level deliberately leaves out.", "No data types, no key design, no storage — just what the business tracks and how it relates."],
        },
        {
          q: "The Daily Grind's owner says, “Every order lists the customer's name — that's all we need to know about customers.” Which modeling benefit is she most at risk of losing if nobody models Customer properly?",
          right: "Accuracy — without a defined Customer entity, the same person can be recorded many inconsistent ways",
          wrong: [
            { t: "Scalability — names take up too much storage", why: "Storage size is not the issue; the problem is inconsistent, unreliable data about who the customer is." },
            { t: "Communication — names are hard to pronounce", why: "This is about reliable data, not vocabulary." },
            { t: "Efficiency — typing names is slow", why: "Speed of typing isn't the modeling benefit at stake; correctness of the data is." },
          ],
          sol: ["Ask what goes wrong when the same customer is written down differently each time.", "Without a Customer entity, “J. Smith,” “Jen Smith” and “Jennifer S.” look like three people — an accuracy (and consistency) problem."],
        },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 2 · Entities, attributes, values, relationships
   * ============================================================ */
  const COMP_BANK = [
    { t: "Customer — in a coffee shop's system", cat: "Entity", why: "A person the business tracks many of, each with its own details." },
    { t: "Product — in a grocery store's system", cat: "Entity", why: "An object the business tracks, with ID, name, size and price." },
    { t: "Reservation — in a restaurant's system", cat: "Entity", why: "A business event with its own date, time and party size." },
    { t: "Service Call — in an HVAC company's system", cat: "Entity", why: "Business events can be entities; each call has its own date, technician and problem." },
    { t: "Supplier — in a bakery's system", cat: "Entity", why: "An organization the bakery tracks, each with contact details and products." },
    { t: "Employee — in a hardware store's system", cat: "Entity", why: "People the business must track, each with an ID, name and wage." },
    { t: "Classroom — in a school's scheduling system", cat: "Entity", why: "A place the school tracks; many classes are assigned to it." },
    { t: "Email Address — for a customer", cat: "Attribute", why: "A named characteristic that describes each customer." },
    { t: "Unit Price — for a product", cat: "Attribute", why: "A characteristic describing each product." },
    { t: "Hire Date — for an employee", cat: "Attribute", why: "Describes each employee; every employee has one." },
    { t: "Order Date — for an order", cat: "Attribute", why: "Describes when each order was placed." },
    { t: "Square Footage — for a store location", cat: "Attribute", why: "Describes the size of each store." },
    { t: "Membership Type — for a gym member", cat: "Attribute", why: "A characteristic of each member; its values might be Gold, Silver, Basic." },
    { t: "Hourly Wage — for an employee", cat: "Attribute", why: "A characteristic describing each employee." },
    { t: "“student@example.com” in the Email field", cat: "Attribute value", why: "Specific data for one customer's Email attribute." },
    { t: "“Gold” for one member's Membership Type", cat: "Attribute value", why: "One instance's value of the Membership Type attribute." },
    { t: "“$4.25” stored as a latte's price", cat: "Attribute value", why: "The data for one product's Unit Price attribute." },
    { t: "“Bloomington” for one store's City", cat: "Attribute value", why: "One store's value of the City attribute." },
    { t: "“Barista” as one employee's Role", cat: "Attribute value", why: "A value of the Role attribute, not a separate entity." },
    { t: "“12 oz” as a cup's Size", cat: "Attribute value", why: "A value of the Size attribute for one product." },
    { t: "Customer places Order", cat: "Relationship", why: "A verb linking two entities." },
    { t: "Supplier provides Product", cat: "Relationship", why: "Shows how two entities are associated." },
    { t: "Student enrolls in Class", cat: "Relationship", why: "A connection between two entities." },
    { t: "Employee processes Transaction", cat: "Relationship", why: "Links an Employee entity to a Transaction entity." },
    { t: "Instructor teaches Class", cat: "Relationship", why: "A verb associating Instructor with Class." },
    { t: "Store employs Employee", cat: "Relationship", why: "Associates Store with Employee." },
  ];
  const COMP_DEFS = { "Entity": "a person, place, object, event or concept the business tracks", "Attribute": "a named characteristic describing an entity", "Attribute value": "the specific data for one instance", "Relationship": "how two entities are associated" };
  const TRIPLES = [
    { e: "Customer", a: "Email Address", v: "maria.k@example.com" },
    { e: "Product", a: "Size", v: "16 oz" },
    { e: "Member", a: "Membership Type", v: "Gold" },
    { e: "Employee", a: "Role", v: "Shift Lead" },
    { e: "Store Location", a: "City", v: "Indianapolis" },
    { e: "Bike", a: "Status", v: "Under Repair" },
    { e: "Student", a: "Class Year", v: "Sophomore" },
    { e: "Order", a: "Order Status", v: "Shipped" },
    { e: "Room", a: "Building", v: "Wells Hall" },
    { e: "Pet", a: "Breed", v: "Beagle" },
  ];
  const PITFALLS = [
    { s: "A gym's draft model has entities Member, Gold Member and Silver Member.", p: "value" },
    { s: "A hotel's draft model has separate Guest and Visitor entities; staff use both words for people who book rooms.", p: "synonym" },
    { s: "A retailer's draft model has entities Employee and Store Manager; every manager is an employee.", p: "role" },
    { s: "A florist's draft model has a Delivery Instruction entity created because one customer once asked, “Leave it with the neighbor.”", p: "onetime" },
    { s: "A library's draft model has entities Patron, Book, Loan and “Overdue Book.”", p: "value" },
    { s: "A food truck's draft model has both Client and Customer entities holding the same people.", p: "synonym" },
    { s: "A hospital's draft model has Doctor and Attending Physician entities; an attending physician is a doctor assigned to a patient's stay.", p: "role" },
    { s: "A bakery's draft model has a Birthday Message entity because one cake order requested “Happy 30th, Sam.”", p: "onetime" },
    { s: "A car-rental draft model has entities Car, Economy Car and SUV.", p: "value" },
    { s: "A university draft model has entities Student, Teaching Assistant and Grader, though TAs and graders are just students in jobs.", p: "role" },
  ];
  const PITS4 = ["value", "synonym", "role", "onetime"];
  const genComponents = STUDY.makeGenerator({
    id: "k201-ch6-components",
    name: "Entities, attributes, values and relationships",
    blurb: "Tell the kind of thing (entity) from its characteristics (attributes), one instance's data (values) and the links between things (relationships).",
    variants: [
      ...K.sortVariants({ key: "k201-ch6-components", bank: COMP_BANK, cats: ["Entity", "Attribute", "Attribute value", "Relationship"], defs: COMP_DEFS, ask: "item", hint: "Ask: is it a kind of thing with many instances, a characteristic of one, the actual data for one instance, or a link between two things?" }),
      {
        name: "Entity → attribute → value chain",
        make() {
          const t = U.pick(TRIPLES);
          const roles = { Entity: t.e, Attribute: t.a, "Attribute value": `“${t.v}”` };
          const askRole = U.pick(Object.keys(roles));
          const right = roles[askRole];
          const wrongs = Object.keys(roles).filter(r => r !== askRole).map(r => ({ t: roles[r], why: `${roles[r]} is the <b>${r.toLowerCase()}</b> here, not the ${askRole.toLowerCase()}.` }));
          wrongs.push({ t: U.pick(COMP_BANK.filter(x => x.cat === "Relationship")).t, why: "That is a relationship between two entities, not part of this entity–attribute–value chain." });
          return Q.mc({
            q: `<p>A record in a database says the ${t.a} of one ${t.e} is “${t.v}.” In this sentence, which item is the <b>${askRole.toLowerCase()}</b>?</p>`,
            right, rightWhy: `${right} is the ${askRole.toLowerCase()}: ${COMP_DEFS[askRole]}.`,
            wrong: wrongs,
            sol: S("Entity = the kind of thing; attribute = the named characteristic; value = what is stored for this one instance.", `Here: entity <b>${t.e}</b>, attribute <b>${t.a}</b>, value <b>“${t.v}”</b>.`),
          });
        },
      },
      {
        name: "Diagnose the modeling mistake",
        make() {
          const it = U.pick(PITFALLS);
          return Q.mc({
            q: `<p>${it.s}</p><p>What is the modeling mistake?</p>`,
            right: PIT[it.p], rightWhy: PITWHY[it.p],
            wrong: PITS4.filter(p => p !== it.p).map(p => ({ t: PIT[p], why: `That pitfall is about something else: ${PITWHY[p]}` })),
            sol: S("Check the extra entity: is it a value of an attribute, a second name for the same thing, a role someone plays, or a one-off detail?", `${PIT[it.p]}. ${PITWHY[it.p]}`),
          });
        },
      },
      K.tfVariant("True or false: building blocks", "k201-ch6-comptf", [
        { s: "An order, a reservation and a service call can all be entities, even though none is a physical object.", truth: true, why: "Entities include business events, not only tangible things.", hint: "Recall the five kinds of things an entity can be." },
        { s: "“Gold Member” should be modeled as its own entity because gold members get different perks.", truth: false, why: "“Gold” is a value of a Membership Type attribute on Member; different perks can key off that value.", hint: "Is “Gold” a kind of thing or a value?" },
        { s: "An attribute value is the specific data stored for one instance, such as one customer's email address.", truth: true, why: "That is exactly the definition of an attribute value." },
        { s: "A relationship is a characteristic that describes a single entity, such as its price or color.", truth: false, why: "That is an attribute. A relationship links two entities (Supplier provides Product)." },
        { s: "The entity-relationship approach is designed mainly for structured data stored in fields and records.", truth: true, why: "Unstructured data such as emails and videos is handled differently later." },
        { s: "If the business only ever needs to know a customer's city, City should be its own entity.", truth: false, why: "A single descriptive fact with no details of its own is an attribute of Customer." },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 3 · Requirements gathering, scope, validation
   * ============================================================ */
  const ELICIT_BANK = [
    { t: "Meeting one-on-one with the owner in the first week to learn her goals and biggest frustrations", cat: "Stakeholder interview", why: "A one-on-one conversation early in the project about goals and pain points." },
    { t: "Asking the head barista, “Walk me through an order from start to finish”", cat: "Stakeholder interview", why: "A classic interview prompt asked of one stakeholder." },
    { t: "Sitting down privately with the finance manager to ask what information she wishes she had", cat: "Stakeholder interview", why: "One-on-one questioning about needs." },
    { t: "Asking the front-desk lead what has gone wrong because information was missing", cat: "Stakeholder interview", why: "A direct conversation probing pain points." },
    { t: "Asking a regional manager which decisions the new system should help her make", cat: "Stakeholder interview", why: "An individual conversation about goals." },
    { t: "Reading through the owner's spiral notebooks and sticky notes to see what is actually recorded", cat: "Document analysis", why: "Existing records reveal the data really tracked by hand." },
    { t: "Studying last year's invoices and order forms", cat: "Document analysis", why: "Business documents show what fields are captured." },
    { t: "Going through the spreadsheet the manager uses to track inventory", cat: "Document analysis", why: "Analyzing an existing spreadsheet is document analysis." },
    { t: "Reviewing the paper sign-up sheets for fitness classes to list the fields they capture", cat: "Document analysis", why: "Existing forms are documents to analyze." },
    { t: "Examining the monthly sales reports managers rely on", cat: "Document analysis", why: "Reports show what totals and data the business uses." },
    { t: "Standing behind the counter during the morning rush to watch how orders are really taken", cat: "Observation", why: "Watching actual work as it happens." },
    { t: "Watching front-desk staff check members in because the written procedure looks out of date", cat: "Observation", why: "Used when stated procedure may not match practice." },
    { t: "Shadowing warehouse workers to see how they actually log deliveries", cat: "Observation", why: "Seeing the real process firsthand." },
    { t: "Spending a shift in the kitchen to see whether staff follow the official prep checklist", cat: "Observation", why: "Checks practice against the official procedure." },
    { t: "Noticing, while watching a shift, that staff keep a private tally on a whiteboard", cat: "Observation", why: "A discovery only possible by watching the work." },
    { t: "A facilitated workshop where sales, warehouse and accounting agree on what counts as an “order”", cat: "JAD session", why: "A structured group session reconciling several departments." },
    { t: "Bringing marketing, front desk and finance together to settle what “active member” means", cat: "JAD session", why: "Multiple stakeholders reconciling a shared definition." },
    { t: "A structured group session with several department heads to resolve conflicting requirements", cat: "JAD session", why: "Joint Application Design is built for this." },
    { t: "A two-day workshop where every store manager and the HR lead agree on employee data needs", cat: "JAD session", why: "A facilitated multi-stakeholder workshop." },
    { t: "A facilitator leads several stakeholders through jointly reviewing and correcting a draft model", cat: "JAD session", why: "Joint, structured, facilitated — the marks of JAD." },
  ];
  const ELICIT_CATS = ["Stakeholder interview", "Document analysis", "Observation", "JAD session"];
  const ELICIT_DEFS = { "Stakeholder interview": "one-on-one, early, goals and pain points", "Document analysis": "existing forms, spreadsheets, invoices, reports; any time", "Observation": "watch the actual work; when procedure may differ from practice", "JAD session": "structured group workshop reconciling several departments" };
  const SCOPES = [
    {
      sys: "a class-registration system for a campus recreation center", dec: "Which classes are filling up, and who is registered for each?",
      inS: ["Members", "Classes", "Registrations", "Instructors assigned to classes"],
      outS: [["Employee payroll", "Payroll is a separate HR process and doesn't help decide class enrollment."], ["Facility maintenance records", "Maintenance is outside this system's decision, at least for now."], ["Vending-machine sales", "Snack sales don't support decisions about class registration."]],
    },
    {
      sys: "an ordering system for a campus coffee shop", dec: "What are customers ordering, and who are the best customers?",
      inS: ["Customers", "Orders", "Products on each order", "Order dates"],
      outS: [["Barista payroll and tax withholding", "Payroll belongs to a separate HR/finance process."], ["The building's lease terms", "The lease doesn't support decisions about orders and customers."], ["Espresso-machine repair history", "Equipment maintenance is a different decision area."]],
    },
    {
      sys: "a bike-share rental system", dec: "Which stations need more bikes, and which bikes are available?",
      inS: ["Bikes", "Stations", "Rentals with start and end times", "Bike status"],
      outS: [["Campus parking-ticket records", "Parking tickets are a different system and decision."], ["Staff vacation requests", "HR scheduling doesn't support bike-availability decisions."], ["Marketing email open rates", "Campaign analytics are outside this system's purpose."]],
    },
    {
      sys: "an appointment system for a pet salon", dec: "Which groomer is booked when, and for which pet?",
      inS: ["Pets", "Owners", "Appointments", "Groomers"],
      outS: [["Shampoo supplier invoices", "Purchasing supplies is a separate process."], ["The salon's utility bills", "Utilities don't support appointment decisions."], ["Groomer retirement-plan elections", "Benefits belong to HR, not scheduling."]],
    },
  ];
  const VALID = [
    { rule: "Every member who registers for a class must hold an active membership.", good: "Can someone register for a class without an active membership?", bad: [["How many classes should the center offer next year?", "A planning question, not a test of the registration rule."], ["What color should the registration form be?", "A design detail, unrelated to the data rule."], ["How long has the center been open?", "Background trivia; it doesn't test any rule in the model."]] },
    { rule: "Every class is taught by an instructor and held in a room.", good: "Can a class be offered without an instructor or without a room?", bad: [["Should instructors be paid hourly or per class?", "Payroll is out of scope and doesn't test the Class–Instructor link."], ["Which room has the best lighting?", "An opinion, not a test of the relationship."], ["How many members are seniors?", "A report question, not a rule check."]] },
    { rule: "One instructor teaches exactly one class.", good: "Can one instructor teach more than one class?", bad: [["Do instructors like teaching mornings?", "A preference, not a cardinality test."], ["What certifications do instructors need?", "A real question, but it doesn't test how many classes an instructor teaches."], ["Can a member register for two classes?", "That tests a different relationship (Member–Class)."]] },
    { rule: "A class accepts registrations until it is full.", good: "What happens when a class reaches its maximum capacity?", bad: [["Who designed the class schedule?", "Doesn't test the capacity rule."], ["How much does the center spend on equipment?", "Out of scope for the registration model."], ["Can a room hold more than one class at different times?", "Tests the Room–Class link, not capacity."]] },
    { rule: "Each order belongs to exactly one customer.", good: "Could two customers ever share a single order, such as a split group order?", bad: [["What is the most popular drink?", "A report question, not a test of the rule."], ["Should we add oat milk?", "A menu decision, unrelated to the data rule."], ["How many baristas work on Saturday?", "Staffing, not the Customer–Order rule."]] },
  ];
  const genElicit = STUDY.makeGenerator({
    id: "k201-ch6-elicit",
    name: "Requirements gathering, scope and validation",
    blurb: "Choose the right elicitation technique, decide what's in scope, and test a model with stakeholder scenarios.",
    variants: [
      ...K.sortVariants({ key: "k201-ch6-elicit", bank: ELICIT_BANK, cats: ELICIT_CATS, defs: ELICIT_DEFS, ask: "activity", hint: "Ask: is the analyst talking one-on-one, reading existing records, watching work happen, or running a group workshop?" }),
      {
        name: "Draw the scope boundary",
        make() {
          const sc = U.pick(SCOPES);
          const k = U.randInt(1, 3);
          const ins = U.sample(sc.inS, k).map(t => ({ t, ok: true, why: "It directly supports the decision this system is for." }));
          const outs = U.sample(sc.outS, 5 - k > 3 ? 3 : 5 - k).map(([t, why]) => ({ t, ok: false, why }));
          const opts = ins.concat(outs);
          return Q.multi({
            q: `<p>A team is modeling ${sc.sys}. The guiding question is: <b>“${sc.dec}”</b></p><p>Select <b>every</b> item that belongs <b>in scope</b>.</p>`,
            options: opts,
            sol: S("Use the guiding question “What decision will this data support?” as the filter.", `In scope: ${ins.map(i => i.t).join(", ")}. Out: ${outs.map(o => o.t).join(", ")} — each serves some other decision or process.`),
          });
        },
      },
      {
        name: "Pick the validation scenario",
        make() {
          const v = U.pick(VALID);
          return Q.mc({
            q: `<p>A draft model includes this rule:</p>${quote(v.rule)}<p>Which question to stakeholders would best <b>test</b> whether the rule is right?</p>`,
            right: v.good, rightWhy: "It is a concrete scenario that directly probes the rule; stakeholders' answer will confirm or change the model.",
            wrong: v.bad.map(([t, why]) => ({ t, why })),
            sol: S("Good validation questions are concrete “can this happen?” scenarios aimed at one rule.", `Ask: “${v.good}” If the answer contradicts the rule, revise the model — conceptual modeling is iterative.`),
          });
        },
      },
      K.conceptVariant("Interview, traceability and iteration", "k201-ch6-elicitcv", [
        {
          q: "Which interview question is most likely to surface data the business tracks informally today?",
          right: "“What do you write down on paper or in a spreadsheet?”",
          wrong: [
            { t: "“Which database product should we buy?”", why: "Stakeholders are experts on the business, not on database products; this skips straight to technology." },
            { t: "“Do you like the current system?”", why: "A yes/no opinion reveals little about what data exists." },
            { t: "“Can you approve this SQL script?”", why: "Business stakeholders can't validate physical code; that comes much later." },
          ],
          sol: ["Good elicitation questions ask about real work and real records.", "Asking what people jot down reveals data the system must capture."],
        },
        {
          q: "During review, no one on the modeling team can explain why the draft model says “each customer may have at most two addresses.” What should they do?",
          right: "Go back to the stakeholders to confirm the rule's source or drop it",
          wrong: [
            { t: "Keep it — rules in a draft are assumed correct", why: "Every rule should trace to a stakeholder need or document; untraceable rules are suspect." },
            { t: "Change it to “unlimited addresses” to be safe", why: "Guessing in the other direction is still guessing; ask the business." },
            { t: "Ask the database administrator to decide", why: "The DBA implements rules; the business defines them." },
          ],
          sol: ["Think traceability: every rule should point back to a need or document.", "If you can't trace it, return to the stakeholders."],
        },
        {
          q: "A stakeholder answers a validation scenario with “Actually, one customer can have several loyalty accounts.” What does this tell you about conceptual modeling?",
          right: "It is iterative — the model is revised as stakeholder answers reveal new rules",
          wrong: [
            { t: "The stakeholder is wrong because the model was already drawn", why: "The stakeholder is the authority on how the business works." },
            { t: "The project has failed and should restart from scratch", why: "Finding this now is the cheap, intended outcome of validation." },
            { t: "The physical model should be built first next time", why: "The opposite: catching this early is why we start conceptually." },
          ],
          sol: ["Validation exists to catch exactly this.", "Update the model and validate again — conceptual modeling is iterative."],
        },
        {
          q: "A modeler suspects the official returns procedure in the policy binder isn't how clerks really handle returns. Which technique should she use?",
          right: "Observation",
          wrong: [
            { t: "Document analysis of the policy binder", why: "The binder is the stated procedure — the very thing she doubts." },
            { t: "A JAD session with department heads", why: "JAD reconciles departments' needs; it won't show what clerks actually do." },
            { t: "Asking the IT department", why: "IT can't report how front-line work is really done." },
          ],
          sol: ["Which technique sees practice rather than stated procedure?", "Observation: watch the actual work."],
        },
      ]),
    ],
  });

  /* ============================================================
   * TOPIC 4 · Noun/verb technique on narratives (+ Campus Rec)
   * ============================================================ */
  const REC_NOUNS = [
    { n: "class", cat: "Entity", why: "Classes are scheduled, taught, held in rooms and registered for — Class is an entity." },
    { n: "instructors", cat: "Entity", why: "The center tracks who teaches each class; Instructor is an entity." },
    { n: "members", cat: "Entity", why: "Members register and buy memberships; Member is an entity." },
    { n: "membership", cat: "Entity", why: "A membership is purchased and has its own details, so it is an entity." },
    { n: "room", cat: "Entity", why: "Rooms are assigned to many classes and reused, so Room is an entity." },
    { n: "registration", cat: "Entity", why: "Registering is a business event with its own details (date, fee paid) — it becomes an entity." },
    { n: "scheduled time", cat: "Attribute", why: "Scheduled time describes a Class." },
    { n: "registration date", cat: "Attribute", why: "Describes a Registration." },
    { n: "fee-paid status", cat: "Attribute", why: "Describes a Registration." },
    { n: "fitness classes", cat: "Merge into another entity", why: "A synonym for class — merge into Class." },
    { n: "students", cat: "Merge into another entity", why: "Students who join are Members in the same role — merge into Member." },
    { n: "staff (who join classes)", cat: "Merge into another entity", why: "Staff who join classes are also Members — merge." },
    { n: "recreation center", cat: "Out of scope", why: "The organization running the system, not a tracked record." },
    { n: "front desk", cat: "Out of scope", why: "Where the action happens, not data the system tracks." },
  ];
  const REC_CATS = ["Entity", "Attribute", "Merge into another entity", "Out of scope"];
  const REC_STEPS = [
    "List every candidate noun in the narrative",
    "Filter the nouns: merge synonyms and roles, drop out-of-scope nouns, demote descriptions to attributes",
    "Settle the candidate entities (including event entities like Registration)",
    "Find relationships from the verbs",
    "Determine cardinality from business rules, reading both directions",
    "Define scope and boundaries",
    "Validate with stakeholders using scenario questions",
    "Draw the ERD",
  ];
  const nounsOf = (N, pred) => N.nouns.filter(pred);
  const genNounVerb = STUDY.makeGenerator({
    id: "k201-ch6-nounverb",
    name: "Noun/verb technique on business narratives",
    blurb: "Read a requirements narrative and decide which nouns are entities, attributes, values, synonyms, roles or out of scope — and which verbs are relationships.",
    variants: [
      {
        name: "Select the entities",
        make() {
          const N = U.pick(NARR);
          const entN = nounsOf(N, x => x.cat === "Entity");
          const non = nounsOf(N, x => x.cat !== "Entity");
          const k = U.randInt(1, Math.min(4, entN.length));
          const opts = U.sample(entN, k).map(x => ({ t: x.n, ok: true, why: x.why }))
            .concat(U.sample(non, 6 - k).map(x => ({ t: x.n, ok: false, why: `${x.cat}: ${x.why}` })));
          return Q.multi({
            q: `<p>Read the narrative for ${N.biz}:</p>${quote(N.text)}<p>Select <b>every</b> noun below that should become <b>its own entity</b> in the conceptual model (after merging synonyms and roles and dropping out-of-scope nouns).</p>`,
            options: opts,
            sol: S("An entity is a thing the business tracks many instances of, each with its own details. Merge synonyms and roles; drop the organization itself and where work happens; values and descriptions are not entities.", `The entities in this narrative are: <b>${N.ents.join(", ")}</b>.`),
          });
        },
      },
      {
        name: "Sort the nouns",
        make() {
          const N = U.pick(NARR);
          const byCat = NCATS.map(c => N.nouns.filter(x => x.cat === c)).filter(a => a.length);
          let items = U.sample(byCat, Math.min(3, byCat.length)).map(a => U.pick(a));
          const rest = U.shuffle(N.nouns.filter(x => !items.includes(x)));
          items = items.concat(rest.slice(0, 5 - items.length));
          return Q.classify({
            q: `<p>Narrative for ${N.biz}:</p>${quote(N.text)}<p>Decide what each noun becomes in the conceptual model.</p>`,
            cats: NCATS,
            items: items.map(x => ({ t: x.n, cat: x.cat, why: x.why })),
            sol: S("For each noun ask: Is it a tracked thing (entity)? A description of one (attribute)? A specific value? Another name or role for an existing entity? Or outside the system?", `Entities here: ${N.ents.join(", ")}. Everything else either describes them, is a value, merges into them, or is out of scope.`),
          });
        },
      },
      {
        name: "Spot the relationship (verbs)",
        make() {
          const N = U.pick(NARR);
          const r = U.pick(N.rels);
          return Q.mc({
            q: `<p>Narrative for ${N.biz}:</p>${quote(N.text)}<p>Using the verbs, which of these is a candidate <b>relationship</b> for the conceptual model?</p>`,
            right: `${r[0]} — ${r[1]} — ${r[2]}`, rightWhy: `The verb “${r[1]}” connects two entities, ${r[0]} and ${r[2]}.`,
            wrong: U.sample(N.notRels, 3),
            sol: S("A relationship is a verb that links <em>two entities</em>. If one end is an attribute, a value, a synonym or something out of scope, it isn't a relationship.", `“${r[0]} ${r[1]} ${r[2]}” links two entities. Relationships in this narrative: ${N.rels.map(x => x.join(" ")).join("; ")}.`),
          });
        },
      },
      {
        name: "Count the entities",
        make() {
          const N = U.pick(NARR);
          const list = U.shuffle(N.nouns).map(x => x.n);
          const ans = N.ents.length;
          const merge = N.nouns.filter(x => x.cat === "Entity" || x.cat === "Merge into another entity").length;
          const kept = N.nouns.filter(x => x.cat !== "Out of scope").length;
          const traps = [];
          const add = (v, why) => { if (v !== ans && !traps.some(t => t.value === v)) traps.push({ value: v, why }); };
          add(N.nouns.length, "That keeps every noun — some are attributes, values, synonyms or out of scope.");
          add(merge, "That counts synonyms and roles as separate entities instead of merging them.");
          add(kept, "That only removed out-of-scope nouns; attributes and values still need to be demoted.");
          return Q.num({
            kind: "count",
            q: `<p>Narrative for ${N.biz}:</p>${quote(N.text)}<p>An analyst listed these candidate nouns: <i>${list.join("; ")}</i>.</p><p>After filtering, how many <b>entities</b> should the conceptual model have?</p>`,
            answer: ans, traps,
            sol: S("Filter: merge synonyms and roles, drop out-of-scope nouns, demote descriptions to attributes and specific labels to values.", `What remains: <b>${N.ents.join(", ")}</b> — ${ans} entities.`),
          });
        },
      },
      {
        name: "Which entity does it describe?",
        make() {
          const N = U.pick(NARR);
          const a = U.pick(N.nouns.filter(x => x.cat === "Attribute" && x.of));
          const wrong = U.sample(N.ents.filter(e => e !== a.of), 3).map(e => ({ t: e, why: `“${a.n}” isn't a characteristic of ${e}: ${a.why}` }));
          return Q.mc({
            q: `<p>Narrative for ${N.biz}:</p>${quote(N.text)}<p>“<b>${a.n}</b>” is an attribute. Which entity does it describe?</p>`,
            right: a.of, rightWhy: a.why, wrong,
            sol: S("Ask: “The ___ of <em>what</em>?” — the attribute belongs to the entity it describes.", `${a.why} So it belongs to <b>${a.of}</b>.`),
          });
        },
      },
      {
        name: "Find the event entity",
        make() {
          const N = U.pick(NARR.filter(n => n.ents.length - n.events.length >= 3));
          const ev = U.pick(N.events);
          const wrong = U.sample(N.ents.filter(e => !N.events.includes(e)), 3).map(e => ({ t: e, why: `${e} is a tangible person, place or object the business tracks, not an occurrence.` }));
          return Q.mc({
            q: `<p>Narrative for ${N.biz}:</p>${quote(N.text)}<p>Which entity represents a <b>business event</b> (something that happens) rather than a person, place or object?</p>`,
            right: ev, rightWhy: `${ev} is something that happens, with its own details (when, who, what) — events become entities too.`, wrong,
            sol: S("Entities can be events: orders, reservations, registrations, visits. Look for the noun that names an occurrence with a date or time.", `<b>${ev}</b> is the event entity.`),
          });
        },
      },
      {
        name: "Why isn't that an entity?",
        make() {
          const N = U.pick(NARR);
          const x = U.pick(N.nouns.filter(n => n.pit));
          return Q.mc({
            q: `<p>Narrative for ${N.biz}:</p>${quote(N.text)}<p>A teammate proposes making “<b>${x.n}</b>” its own entity. What's wrong with that?</p>`,
            right: PIT[x.pit], rightWhy: x.why,
            wrong: Object.keys(PIT).filter(p => p !== x.pit).map(p => ({ t: PIT[p], why: `Not this time. ${PITWHY[p]} Here: ${x.why}` })),
            sol: S("Run the noun through the pitfall checklist: value? synonym? role? one-time detail? outside the system?", `${PIT[x.pit]}. ${x.why}`),
          });
        },
      },
      {
        name: "Campus Rec: noun decisions",
        make() {
          const byCat = REC_CATS.map(c => REC_NOUNS.filter(x => x.cat === c));
          let items = U.sample(byCat, 3).map(a => U.pick(a));
          items = items.concat(U.shuffle(REC_NOUNS.filter(x => !items.includes(x))).slice(0, 5 - items.length));
          return Q.classify({
            q: `<p><b>Campus Recreation Center.</b> The center offers fitness classes taught by instructors. Students and staff who join become members by purchasing a membership. Each class meets in a room at a scheduled time. Members sign up at the front desk; each registration records the registration date and whether the class fee has been paid.</p><p>Decide what each noun becomes.</p>`,
            cats: REC_CATS,
            items: items.map(x => ({ t: x.n, cat: x.cat, why: x.why })),
            sol: S("Merge synonyms (fitness classes = class) and roles (students, staff = member); drop the organization and the place; descriptions become attributes.", "Final entities: Member, Membership, Class, Instructor, Room, Registration."),
          });
        },
      },
      {
        name: "Campus Rec: what comes next?",
        make() {
          const i = U.randInt(0, REC_STEPS.length - 2);
          const right = REC_STEPS[i + 1];
          const wrong = U.sample(REC_STEPS.filter((_, j) => j !== i + 1 && j !== i), 3).map(t => ({ t, why: `In the worked process this is step ${REC_STEPS.indexOf(t) + 1}, not step ${i + 2}.` }));
          return Q.mc({
            q: `<p>In the eight-step Campus Recreation Center walkthrough, the team has just finished: <b>“${REC_STEPS[i]}.”</b> What should they do <b>next</b>?</p>`,
            right, rightWhy: `It is step ${i + 2}; it builds on what step ${i + 1} produced.`, wrong,
            sol: S("The process flows from words (nouns, verbs) to structure (entities, relationships, cardinality) to boundaries and checks (scope, validation) to the picture (ERD).", `Order: ${REC_STEPS.map((s, j) => `${j + 1}. ${s}`).join("; ")}.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 5 · Structural vs. operative rules
   * ============================================================ */
  const RULE_BANK = [
    { t: "A customer can place many orders; an order belongs to exactly one customer.", cat: "Structural", why: "Describes how Customer and Order connect — it sets cardinality." },
    { t: "Every class is taught by one instructor.", cat: "Structural", why: "States how Class relates to Instructor." },
    { t: "A product may appear on many orders.", cat: "Structural", why: "Describes how data connects (Order–Product)." },
    { t: "Each employee is assigned to exactly one home store.", cat: "Structural", why: "Sets the Store–Employee relationship and its cardinality." },
    { t: "A patient can see more than one doctor.", cat: "Structural", why: "Describes the Patient–Doctor connection." },
    { t: "Each appointment is with exactly one doctor.", cat: "Structural", why: "Fixes cardinality between Appointment and Doctor." },
    { t: "Every order must belong to exactly one customer.", cat: "Structural", why: "Despite “must,” it describes how data connects, not whether an action is allowed." },
    { t: "A supplier can provide many products.", cat: "Structural", why: "Describes the Supplier–Product link." },
    { t: "Each registration links one member to one class.", cat: "Structural", why: "Describes how Registration connects Member and Class." },
    { t: "A store can sell many products, and a product can be sold in many stores.", cat: "Structural", why: "Describes an M:N connection." },
    { t: "An order cannot ship until it has been paid in full.", cat: "Operative", why: "Constrains an action (shipping) until a condition is met." },
    { t: "A student can't graduate until every required course is complete.", cat: "Operative", why: "Blocks an action until a condition holds." },
    { t: "A member without an active membership may not register for a class.", cat: "Operative", why: "Controls whether an action is allowed." },
    { t: "A suspended customer cannot place a new order.", cat: "Operative", why: "Checks a business condition before allowing an action." },
    { t: "Refunds over $100 require a manager's approval.", cat: "Operative", why: "Constrains an action (refunding) with an approval condition." },
    { t: "Registration closes once a class reaches maximum capacity.", cat: "Operative", why: "Stops an action when a condition is reached." },
    { t: "Equipment marked “Out of Service” cannot be reserved.", cat: "Operative", why: "Blocks an action based on a condition." },
    { t: "A late fee is charged when a rental is returned more than a day late.", cat: "Operative", why: "Triggers an action when a condition occurs." },
    { t: "A prescription refill must be approved by the prescribing doctor.", cat: "Operative", why: "Requires an approval before the action proceeds." },
  ];
  const RULE_DEFS = { Structural: "a fact about how the business is organized and how data connects; shapes entities, relationships, cardinality", Operative: "a constraint on which actions are or aren't allowed; enforced by the system, process or an employee" };
  const QUOTES = [
    { q: "“Each patient can see more than one doctor, but every appointment is with exactly one doctor.”", c: "Structural", why: "It describes how Patient, Doctor and Appointment connect, setting cardinalities." },
    { q: "“A student can't graduate until every required course is complete.”", c: "Operative", why: "It controls an action (graduating) until a condition is met." },
    { q: "“Every instructor can teach several classes, but each class has one instructor.”", c: "Structural", why: "It sets the Instructor–Class cardinality (1:N)." },
    { q: "“We never let anyone check out a laptop if they owe library fines.”", c: "Operative", why: "It blocks an action based on a condition (owing fines)." },
    { q: "“A vendor can supply many of our ingredients, but each ingredient comes from a single vendor.”", c: "Structural", why: "It describes how Vendor and Ingredient connect." },
    { q: "“Orders over $500 need the owner's sign-off before they're placed.”", c: "Operative", why: "It requires approval before an action." },
  ];
  const genRules = STUDY.makeGenerator({
    id: "k201-ch6-rules",
    name: "Business rules: structural vs. operative",
    blurb: "Classify business rules, and connect each kind to what it does in the model or in the future system.",
    variants: [
      ...K.sortVariants({ key: "k201-ch6-rules", bank: RULE_BANK, cats: ["Structural", "Operative"], defs: RULE_DEFS, ask: "rule", hint: "Does the rule say how things are organized and connected, or whether an action may happen right now?" }),
      {
        name: "What does this rule drive?",
        make() {
          const it = U.pick(RULE_BANK);
          const S1 = "It shapes the model's entities, relationships and cardinality";
          const O1 = "It becomes a condition the system, process or a responsible employee must enforce";
          const right = it.cat === "Structural" ? S1 : O1;
          return Q.mc({
            q: `<p>Business rule:</p>${quote(it.t)}<p>What will this rule mainly do as the system is designed?</p>`,
            right, rightWhy: `It is ${it.cat.toLowerCase()}: ${it.why}`,
            wrong: [
              { t: it.cat === "Structural" ? O1 : S1, why: `That is what ${it.cat === "Structural" ? "an operative" : "a structural"} rule does. ${it.why}` },
              { t: "It decides the data types for the database columns", why: "Data types are physical-model details; business rules are stated in business terms." },
              { t: "Nothing — business rules are documentation only", why: "Rules are the raw material of the model and the source of later controls." },
            ],
            sol: S("Classify the rule first: structural (how data connects) or operative (whether an action is allowed).", `This rule is <b>${it.cat}</b>, so: ${right.toLowerCase()}.`),
          });
        },
      },
      {
        name: "Stakeholder quote → rule type",
        make() {
          const it = U.pick(QUOTES);
          const opts = ["Structural rule", "Operative rule", "Not a business rule — a data type", "Not a business rule — an attribute value"];
          const right = it.c + " rule";
          const W = {
            "Structural rule": "Structural rules describe how data connects.",
            "Operative rule": "Operative rules constrain actions.",
            "Not a business rule — a data type": "A data type (e.g., VARCHAR) is a physical detail; this is a statement about how the business operates.",
            "Not a business rule — an attribute value": "An attribute value is a single piece of data; this sentence defines or constrains the business.",
          };
          return Q.mc({
            q: `<p>During an interview a stakeholder says:</p>${quote(it.q)}<p>How should the modeler record this?</p>`,
            right, rightWhy: it.why,
            wrong: opts.filter(o => o !== right).map(o => ({ t: o, why: W[o] + " " + it.why })),
            keepOrder: opts,
            sol: S("Stakeholders state rules in plain language; the modeler classifies them.", `${it.why} → <b>${right}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 6 · Cardinality from business rules (+ GG&C)
   * ============================================================ */
  const GGC = [
    { pair: "Customer – Order", card: "1:N", why: "A customer can place many orders; each order is placed by exactly one customer.", rules: "Customers place many orders; every order comes from exactly one customer." },
    { pair: "Order – Product", card: "M:N", why: "An order contains many products, and a product appears on many orders.", rules: "Each order can include many products; each product can be on many orders." },
    { pair: "Store Location – Product", card: "M:N", why: "Each store sells many products, and each product is sold in many stores.", rules: "Stores carry many products; products are stocked at many stores." },
    { pair: "Store Location – Employee", card: "1:N", why: "A store employs many employees; each employee has exactly one home store.", rules: "A store employs many employees; each employee is assigned to exactly one home store." },
  ];
  const cardMC = (e, fm, bm, q, extraSol) => {
    const c = cardOf(fm, bm);
    return Q.mc({
      q, right: CL[c], rightWhy: whyCard(e, fm, bm),
      wrong: CARDS.filter(x => x !== c).map(x => ({ t: CL[x], why: x === "M:N" ? "M:N needs “many” in <em>both</em> directions. " + whyCard(e, fm, bm) : x === "1:1" ? "1:1 needs “one” in both directions. " + whyCard(e, fm, bm) : "1:N needs “many” in exactly one direction. " + whyCard(e, fm, bm) })),
      keepOrder: CL_ORDER,
      sol: S("Read the rule both ways: one A → how many B? one B → how many A?", whyCard(e, fm, bm) + (extraSol || "")),
    });
  };
  const genCard = STUDY.makeGenerator({
    id: "k201-ch6-cardinality",
    name: "Cardinality from business rules",
    blurb: "Read business rules in both directions to decide 1:1, 1:N or M:N — and predict what changes when a rule changes.",
    variants: [
      {
        name: "Read both directions",
        make() {
          const e = U.pick(REL); const { fm, bm } = flags(e.card);
          return cardMC(e, fm, bm, `<p>A stakeholder confirms two rules:</p>${rulesBox(e, fm, bm)}<p>What is the cardinality of the ${tc(e.a)}–${tc(e.b)} relationship?</p>`);
        },
      },
      {
        name: "Complete the rule pair",
        make() {
          const e = U.pick(REL.filter(r => r.card !== "1:1"));
          const target = U.pick(["1:N", "M:N"]);
          const rightS = back(e, target === "M:N");
          return Q.mc({
            q: `<p>Rule 1 is known: <b>${fwd(e, true)}</b></p><p>Which second rule would make the ${tc(e.a)}–${tc(e.b)} relationship <b>${CL[target]}</b>?</p>`,
            right: rightS, rightWhy: `With Rule 1 giving “many” from the ${e.a} side, the ${e.b} side must say ${target === "M:N" ? "“many” too" : "“exactly one”"} for ${target}.`,
            wrong: [
              { t: back(e, target !== "M:N"), why: `This gives ${target === "M:N" ? "1:N" : "M:N"}, not ${target}.` },
              { t: fwd(e, false), why: "This restates the first direction (from the " + e.a + " side) — and contradicts Rule 1. You need the rule read from the " + e.b + " side." },
              { t: `Each ${e.b} has a name and an ID.`, why: "That lists attributes; it says nothing about how many " + e.aPl + " one " + e.b + " relates to." },
            ],
            sol: S("Cardinality needs both directions. Rule 1 already covers the " + e.a + " side; the missing rule must start from the " + e.b + " side.", `“${rightS}” completes the pair for ${target}.`),
          });
        },
      },
      {
        name: "Predict after a rule change",
        make() {
          const e = U.pick(REL); let { fm, bm } = flags(e.card);
          const flipF = Math.random() < 0.5;
          const nf = flipF ? !fm : fm, nb = flipF ? bm : !bm;
          const changed = flipF ? fwd(e, nf) : back(e, nb);
          return cardMC(e, nf, nb, `<p>Today the rules are:</p>${rulesBox(e, fm, bm)}<p>Management changes one rule. It now reads: <b>${changed}</b> The other rule stays the same.</p><p>What is the cardinality <b>now</b>?</p>`,
            ` (Before the change it was ${CL[e.card]}.)`);
        },
      },
      {
        name: "Sort relationships by cardinality",
        make() {
          const picks = [];
          CARDS.forEach(c => picks.push(U.pick(REL.filter(r => r.card === c))));
          const restPool = U.shuffle(REL.filter(r => !picks.includes(r) && !picks.some(p => p.a === r.a && p.b === r.b)));
          const items = picks.concat(restPool.slice(0, 2));
          return Q.classify({
            q: "<p>Each line gives a rule pair (both directions). Classify each relationship.</p>",
            cats: CL_ORDER,
            items: items.map(e => { const { fm, bm } = flags(e.card); return { t: pair(e, fm, bm), cat: CL[e.card], why: whyCard(e, fm, bm) }; }),
            sol: S("For each pair, count how many directions say “many”: zero → 1:1, one → 1:N, two → M:N.", "Watch for “exactly one” versus “can … many” in each half."),
          });
        },
      },
      {
        name: "Select all of one type",
        make() {
          const target = U.pick(CARDS);
          const tPool = REL.filter(r => r.card === target);
          const k = U.randInt(1, 3);
          const yes = U.sample(tPool, k);
          const no = U.sample(REL.filter(r => r.card !== target), 5 - k);
          const opts = yes.map(e => { const { fm, bm } = flags(e.card); return { t: pair(e, fm, bm), ok: true, why: whyCard(e, fm, bm) }; })
            .concat(no.map(e => { const { fm, bm } = flags(e.card); return { t: pair(e, fm, bm), ok: false, why: whyCard(e, fm, bm) }; }));
          return Q.multi({
            q: `<p>Select <b>every</b> rule pair that describes a <b>${CL[target]}</b> relationship.</p>`, options: opts,
            sol: S("Look at each half separately: “exactly one” or “many”?", `${target} means ${target === "M:N" ? "many in both directions" : target === "1:N" ? "many in exactly one direction" : "one in both directions"}.`),
          });
        },
      },
      {
        name: "Which side is “many”?",
        make() {
          const e = U.pick(REL.filter(r => r.card === "1:N"));
          const A = tc(e.a), B = tc(e.b);
          return Q.mc({
            q: `<p>Rules:</p>${rulesBox(e, true, false)}<p>This is a 1:N relationship. On which side can <b>many</b> instances occur (where the crow's foot will go)?</p>`,
            right: `The ${B} side`, rightWhy: `One ${e.a} relates to many ${e.bPl}, so ${B} is the many side.`,
            wrong: [
              { t: `The ${A} side`, why: `${A} is the “one” side — each ${e.b} relates to exactly one ${e.a}. The entity that “has many” is not where the foot goes.` },
              { t: "Both sides", why: "Both sides would be M:N, but Rule 2 says “exactly one.”" },
              { t: "Neither side", why: "Neither side would be 1:1, but Rule 1 says “many.”" },
            ],
            sol: S("Ask “one ___ relates to many of which entity?”", `One ${e.a} → many ${e.bPl}: the many side is <b>${B}</b>.`),
          });
        },
      },
      {
        name: "Global Grains & Coffee cardinality",
        make() {
          const g = U.pick(GGC);
          const W = { "1:1": "1:1 would mean one on each side; the case says “many” at least once.", "1:N": "1:N needs “many” in only one direction.", "M:N": "M:N needs “many” in both directions." };
          return Q.mc({
            q: `<p><b>Global Grains &amp; Coffee Co.</b> — homework case.</p>${quote(g.rules)}<p>What is the cardinality of <b>${g.pair}</b>?</p>`,
            right: CL[g.card], rightWhy: g.why,
            wrong: CARDS.filter(c => c !== g.card).map(c => ({ t: CL[c], why: W[c] + " " + g.why })),
            keepOrder: CL_ORDER,
            sol: S("Read the case rule both ways.", `${g.why} → <b>${g.card}</b>.`),
          });
        },
      },
      {
        name: "Count the many-to-many links",
        make() {
          const set = U.sample(REL, 5);
          const ans = set.filter(e => e.card === "M:N").length;
          const anyMany = set.filter(e => e.card !== "1:1").length;
          const traps = [];
          if (anyMany !== ans) traps.push({ value: anyMany, why: "That counts every relationship with “many” anywhere — 1:N ones have “many” in only one direction." });
          const one = set.filter(e => e.card === "1:N").length;
          if (one !== ans && one !== anyMany) traps.push({ value: one, why: "That counts the 1:N relationships instead of the M:N ones." });
          return Q.num({
            kind: "count",
            q: `<p>A modeler gathered these rule pairs:</p>${ul(set.map(e => { const { fm, bm } = flags(e.card); return pair(e, fm, bm); }))}<p>How many of the five relationships are <b>many-to-many</b>?</p>`,
            answer: ans, traps,
            sol: S("M:N needs “many” in BOTH halves of the pair.", `M:N here: ${set.filter(e => e.card === "M:N").map(e => tc(e.a) + "–" + tc(e.b)).join(", ") || "none"} → <b>${ans}</b>.`),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 7 · Reading simplified crow's foot ERDs
   * ============================================================ */
  const COMBOS = [[false, false], [true, false], [false, true], [true, true]];
  const genCrow = STUDY.makeGenerator({
    id: "k201-ch6-crowsfoot",
    name: "Reading crow's foot ERDs",
    blurb: "Read simplified crow's foot diagrams, match them to business rules, and place the crow's foot correctly.",
    variants: [
      {
        name: "Read the diagram",
        make() {
          const e = U.pick(REL); const { fm, bm } = flags(e.card);
          return cardMC(e, fm, bm, `<p>Read this conceptual ERD (a crow's foot marks the side where many instances can occur; a single bar means one):</p>${draw(e, fm, bm, Math.random() < 0.5)}<p>What cardinality does it show?</p>`);
        },
      },
      {
        name: "Diagram → business rules",
        make() {
          const e = U.pick(REL); const { fm, bm } = flags(e.card);
          const others = COMBOS.filter(([f, b]) => !(f === fm && b === bm));
          return Q.mc({
            q: `<p>Which pair of business rules does this diagram represent?</p>${draw(e, fm, bm, Math.random() < 0.5)}`,
            right: pair(e, fm, bm), rightWhy: whyCard(e, fm, bm),
            wrong: others.map(([f, b]) => ({ t: pair(e, f, b), why: `Those rules would put the crow's foot ${lc1(footPlace(e, f, b))}, i.e. ${CL[cardOf(f, b)]}.` })),
            sol: S("A crow's foot next to an entity means “many of this entity” for one instance on the other side.", whyCard(e, fm, bm)),
          });
        },
      },
      {
        name: "Rules → pick the diagram",
        make() {
          const e = U.pick(REL); const { fm, bm } = flags(e.card);
          const swap = Math.random() < 0.5;
          const order = U.shuffle(COMBOS);
          const L = ["A", "B", "C", "D"];
          const idx = order.findIndex(([f, b]) => f === fm && b === bm);
          const pics = order.map(([f, b], i) => `<p><b>Diagram ${L[i]}</b></p>${draw(e, f, b, swap)}`).join("");
          return Q.mc({
            q: `<p>Business rules:</p>${rulesBox(e, fm, bm)}<p>Which diagram matches?</p>${pics}`,
            right: `Diagram ${L[idx]}`, rightWhy: `It puts the crow's foot ${lc1(footPlace(e, fm, bm))}. ${whyCard(e, fm, bm)}`,
            wrong: order.map(([f, b], i) => i === idx ? null : { t: `Diagram ${L[i]}`, why: `Diagram ${L[i]} has the crow's foot ${lc1(footPlace(e, f, b))} — that is ${CL[cardOf(f, b)]}.` }).filter(Boolean),
            keepOrder: L.map(x => `Diagram ${x}`),
            sol: S("Decide where the feet belong before looking at the pictures: a foot goes next to each entity that can occur “many” times.", `Feet: ${lc1(footPlace(e, fm, bm))} → Diagram ${L[idx]}.`),
          });
        },
      },
      {
        name: "Where does the crow's foot go?",
        make() {
          const e = U.pick(REL); const { fm, bm } = flags(e.card);
          const right = footPlace(e, fm, bm);
          const opts = COMBOS.map(([f, b]) => footPlace(e, f, b));
          return Q.mc({
            q: `<p>You are drawing a simplified crow's foot ERD for these rules:</p>${rulesBox(e, fm, bm)}<p>Where should the crow's foot (or feet) go?</p>`,
            right, rightWhy: whyCard(e, fm, bm),
            wrong: opts.filter(o => o !== right).map(o => ({ t: o, why: `That drawing would mean ${CL[cardOf(...COMBOS[opts.indexOf(o)])]}. ${whyCard(e, fm, bm)}` })),
            keepOrder: opts,
            sol: S("The foot marks the many side. Check each rule: which entity appears with “many”?", `${right}.`),
          });
        },
      },
      {
        name: "Check the drawing",
        make() {
          const e = U.pick(REL); const { fm, bm } = flags(e.card);
          const correct = Math.random() < 0.35;
          const drawn = correct ? [fm, bm] : U.pick(COMBOS.filter(([f, b]) => !(f === fm && b === bm)));
          const right = correct ? "The diagram is correct as drawn" : `Wrong — the crow's foot belongs ${lc1(footPlace(e, fm, bm))}`;
          const alts = COMBOS.filter(([f, b]) => !(f === fm && b === bm)).map(([f, b]) => `Wrong — the crow's foot belongs ${lc1(footPlace(e, f, b))}`);
          const wrongs = correct ? U.sample(alts, 3).map(t => ({ t, why: "The drawing already matches both rules. " + whyCard(e, fm, bm) }))
            : [{ t: "The diagram is correct as drawn", why: `It shows feet ${lc1(footPlace(e, drawn[0], drawn[1]))}, which is ${CL[cardOf(drawn[0], drawn[1])]}, but the rules give ${CL[e.card]}.` }]
              .concat(U.sample(alts.filter(a => a !== `Wrong — the crow's foot belongs ${lc1(footPlace(e, drawn[0], drawn[1]))}`), 2).map(t => ({ t, why: "That placement doesn't match the rules either. " + whyCard(e, fm, bm) })));
          return Q.mc({
            q: `<p>The rules are:</p>${rulesBox(e, fm, bm)}<p>A teammate drew:</p>${draw(e, drawn[0], drawn[1], Math.random() < 0.5)}<p>Is the drawing right?</p>`,
            right, rightWhy: whyCard(e, fm, bm), wrong: wrongs,
            sol: S("Work out the correct placement from the rules first, then compare with the drawing.", `Correct placement: ${lc1(footPlace(e, fm, bm))}. ${whyCard(e, fm, bm)}`),
          });
        },
      },
      {
        name: "True statements about an ERD",
        make() {
          const e = U.pick(REL); const { fm, bm } = flags(e.card);
          const opts = [];
          const tf1 = Math.random() < 0.5, tf2 = Math.random() < 0.5;
          opts.push({ t: fwd(e, tf1), ok: tf1 === fm, why: whyCard(e, fm, bm) });
          opts.push({ t: back(e, tf2), ok: tf2 === bm, why: whyCard(e, fm, bm) });
          opts.push({ t: `The relationship is ${CL[e.card]}`, ok: true, why: whyCard(e, fm, bm) });
          const wrongC = U.pick(CARDS.filter(c => c !== e.card));
          opts.push({ t: `The relationship is ${CL[wrongC]}`, ok: false, why: whyCard(e, fm, bm) });
          opts.push(U.pick([
            { t: "The diagram shows the data type of each attribute", ok: false, why: "A conceptual ERD shows entities and relationships, not data types." },
            { t: "A crow's foot marks the side where many instances can occur", ok: true, why: "That is the simplified crow's foot convention." },
            { t: "The crow's foot is drawn next to the entity that “has” many of the other", ok: false, why: "It is drawn at the many side — next to the entity that occurs many times." },
          ]));
          return Q.multi({
            q: `<p>Look at this ERD:</p>${draw(e, fm, bm, Math.random() < 0.5)}<p>Select <b>every</b> statement that is true.</p>`,
            options: opts,
            sol: S("Translate each end of the line into words: a foot next to an entity = “many of these”; a bar = “exactly one of these.”", whyCard(e, fm, bm)),
          });
        },
      },
      {
        name: "Count M:N in a set of diagrams",
        make() {
          const set = U.sample(REL, 4);
          const ans = set.filter(e => e.card === "M:N").length;
          const feet = set.filter(e => e.card !== "1:1").length;
          const traps = feet !== ans ? [{ value: feet, why: "That counts every diagram with any crow's foot; M:N needs feet at BOTH ends." }] : [];
          const pics = set.map((e, i) => { const { fm, bm } = flags(e.card); return `<p><b>${i + 1}.</b></p>${draw(e, fm, bm, Math.random() < 0.5)}`; }).join("");
          return Q.num({
            kind: "count",
            q: `<p>How many of these four diagrams show a <b>many-to-many</b> relationship?</p>${pics}`,
            answer: ans, traps,
            sol: S("An M:N diagram has a crow's foot at both ends of the line.", `Feet at both ends: ${set.filter(e => e.card === "M:N").map(e => tc(e.a) + "–" + tc(e.b)).join(", ") || "none"} → <b>${ans}</b>.`),
          });
        },
      },
      {
        name: "Global Grains & Coffee ERD",
        make() {
          const mode = U.pick(["both", "one", "none"]);
          const desc = { both: "a crow's foot at <b>both</b> ends", one: "a crow's foot at <b>exactly one</b> end", none: "<b>no</b> crow's foot at either end" };
          const items = [
            ...GGC.map(g => ({ t: g.pair, mode: g.card === "M:N" ? "both" : "one", why: g.why })),
            { t: "Customer – Employee (not a relationship in the case)", mode: "none", why: "The case never links customers and employees, so no line is drawn at all." },
          ];
          const opts = items.map(i => ({ t: i.t, ok: i.mode === mode, why: i.why + (i.mode === "both" ? " → feet at both ends." : i.mode === "one" ? " → one foot, at the many side." : "") }));
          return Q.multi({
            q: `<p><b>Global Grains &amp; Coffee Co.</b> Customers place orders (each order by one customer); orders contain many products and products appear on many orders; each store location sells many products and each product is sold at many stores; each store employs many employees and each employee has exactly one home store.</p><p>In the conceptual ERD, which lines should have ${desc[mode]}? Select all that apply.</p>`,
            options: opts,
            sol: S("Work out each relationship's cardinality, then place feet at every many side.", "Customer–Order 1:N, Order–Product M:N, Store–Product M:N, Store–Employee 1:N."),
          });
        },
      },
    ],
  });

  /* ============================================================
   * TOPIC 8 · Data integrity → later controls
   * ============================================================ */
  const INT_BANK = [
    { t: "Every customer must have a customer ID that no other customer shares.", cat: "Unique identifier", why: "Makes each record distinguishable → later a primary key." },
    { t: "No two employees may have the same employee number.", cat: "Unique identifier", why: "Guarantees each employee record can be told apart." },
    { t: "Each product needs an ID so two products with the same name can be told apart.", cat: "Unique identifier", why: "Distinguishes records even when names match." },
    { t: "Every store location must be distinguishable by its Store ID.", cat: "Unique identifier", why: "One identifier per store → primary key." },
    { t: "Each registration must have its own identifier.", cat: "Unique identifier", why: "Makes every registration record distinct." },
    { t: "Every order must belong to a customer who already exists in the system.", cat: "Valid relationship", why: "Keeps relationships valid → later a foreign key constraint." },
    { t: "A class can only be assigned to a room that exists in the Room list.", cat: "Valid relationship", why: "The link must point to a real Room record." },
    { t: "An employee's home store must be one of the company's actual stores.", cat: "Valid relationship", why: "Prevents links to stores that don't exist." },
    { t: "A registration must point to an existing member and an existing class.", cat: "Valid relationship", why: "Both ends of the link must be real records." },
    { t: "Order lines may reference only products that are in the catalog.", cat: "Valid relationship", why: "The relationship must stay valid." },
    { t: "A product's price must be greater than zero.", cat: "Validity rule", why: "A stored value must fall in an allowed range → validation rule." },
    { t: "Hourly wage cannot be negative.", cat: "Validity rule", why: "Checks a single stored value." },
    { t: "An email address must contain an “@” sign.", cat: "Validity rule", why: "A format rule on a stored value." },
    { t: "Quantity in stock must be a whole number, zero or more.", cat: "Validity rule", why: "Restricts the values the attribute may hold." },
    { t: "Class capacity must be between 1 and 40.", cat: "Validity rule", why: "A range check on a stored value." },
    { t: "Square footage must be a positive number.", cat: "Validity rule", why: "Values must meet a validity rule." },
    { t: "A suspended customer cannot place a new order.", cat: "Condition check", why: "Checks a business condition before allowing an action (operative rule)." },
    { t: "A member without an active membership cannot register for a class.", cat: "Condition check", why: "Checks the member's status before allowing registration." },
    { t: "An order cannot ship until it has been paid in full.", cat: "Condition check", why: "Checks payment before allowing shipment." },
    { t: "Registration is blocked once a class is full.", cat: "Condition check", why: "Checks a condition (capacity) before the action." },
    { t: "Equipment flagged “Out of Service” cannot be reserved.", cat: "Condition check", why: "Checks equipment status before allowing the reservation." },
  ];
  const INT_CATS = ["Unique identifier", "Valid relationship", "Validity rule", "Condition check"];
  const INT_DEFS = { "Unique identifier": "each record distinguishable (later a primary key)", "Valid relationship": "links point to real records (later a foreign key / relationship constraint)", "Validity rule": "stored values meet allowed ranges or formats (validation rule)", "Condition check": "a business condition is checked before an action (operative rule)" };
  const CONTROL = { "Unique identifier": "A primary key (identifier)", "Valid relationship": "A relationship (foreign key) constraint", "Validity rule": "A validation rule on the stored value", "Condition check": "An operative-rule check before the action is allowed" };
  const DAMAGE = { "Unique identifier": "Two records that can't be told apart, such as two “Jordan Lee” customers merged or double-counted", "Valid relationship": "Orphan records, such as an order pointing to a customer who doesn't exist", "Validity rule": "Impossible values, such as a $0.00 or negative price", "Condition check": "Forbidden actions slipping through, such as a suspended customer placing an order" };
  const genIntegrity = STUDY.makeGenerator({
    id: "k201-ch6-integrity",
    name: "Data integrity requirements and later controls",
    blurb: "Connect each business requirement to what it protects and the control that will later enforce it.",
    variants: [
      ...K.sortVariants({ key: "k201-ch6-integrity", bank: INT_BANK, cats: INT_CATS, defs: INT_DEFS, ask: "requirement", hint: "Ask what the requirement protects: telling records apart, keeping links valid, keeping single values sensible, or checking a condition before an action." }),
      {
        name: "Requirement → later control",
        make() {
          const it = U.pick(INT_BANK);
          return Q.mc({
            q: `<p>Integrity requirement:</p>${quote(it.t)}<p>Which control will most likely enforce it once the database is built?</p>`,
            right: CONTROL[it.cat], rightWhy: `This is a ${it.cat.toLowerCase()} requirement: ${it.why}`,
            wrong: INT_CATS.filter(c => c !== it.cat).map(c => ({ t: CONTROL[c], why: `That control enforces a ${c.toLowerCase()} requirement (${INT_DEFS[c]}), not this one.` })),
            sol: S("First decide what the requirement protects.", `It protects: ${INT_DEFS[it.cat]} → <b>${CONTROL[it.cat]}</b>.`),
          });
        },
      },
      {
        name: "Predict the damage",
        make() {
          const c = U.pick(INT_CATS);
          const ex = U.pick(INT_BANK.filter(x => x.cat === c));
          return Q.mc({
            q: `<p>The Daily Grind's new system was built <b>without</b> this requirement:</p>${quote(ex.t)}<p>Which problem is most likely to appear in the data?</p>`,
            right: DAMAGE[c], rightWhy: `Without a ${c.toLowerCase()} requirement, nothing stops this.`,
            wrong: INT_CATS.filter(x => x !== c).map(x => ({ t: DAMAGE[x], why: `That comes from missing a ${x.toLowerCase()} requirement, not this one.` })),
            sol: S("Ask what this requirement would have protected.", `It protects: ${INT_DEFS[c]}. Without it: ${DAMAGE[c].toLowerCase()}.`),
          });
        },
      },
      K.conceptVariant("Who owns integrity?", "k201-ch6-intcv", [
        {
          q: "The new ordering system lets staff record an order for a customer who doesn't exist. The vendor says the software works as designed. What is the most accurate diagnosis?",
          right: "The business never defined the rule “every order belongs to an existing customer,” so nothing enforced it",
          wrong: [
            { t: "The database software is defective", why: "Software enforces the rules it is given; this rule was never specified." },
            { t: "The staff need more training on typing", why: "Training helps, but the root cause is a missing requirement the system could have enforced." },
            { t: "Orders should not be linked to customers at all", why: "The link is exactly what makes top-customer reports possible; it just needs a valid-relationship rule." },
          ],
          sol: ["Technology enforces only the rules the organization identifies and defines.", "The gap is in the requirements, so the fix starts with the business rule."],
        },
        {
          q: "Who is ultimately responsible for deciding which integrity rules matter and resolving exceptions?",
          right: "Managers and business stakeholders",
          wrong: [
            { t: "The database software", why: "Software enforces rules but doesn't decide which ones matter." },
            { t: "Only the database administrator", why: "The DBA implements controls; the business decides which rules are right." },
            { t: "Customers", why: "Customers supply data, but don't set the business's integrity rules." },
          ],
          sol: ["Separate deciding rules from enforcing them.", "Managers decide which rules matter, resolve exceptions and validate the data; technology enforces."],
        },
        {
          q: "Which statement best defines data integrity?",
          right: "The accuracy, consistency and reliability of business data as it is collected, stored and used",
          wrong: [
            { t: "Keeping data secret from unauthorized users", why: "That is confidentiality/security, a different goal." },
            { t: "Storing as much data as possible", why: "Volume is not integrity; bad data in bulk is still bad." },
            { t: "Making the database run fast", why: "Performance is a physical-design concern, not integrity." },
          ],
          sol: ["Integrity is about whether you can trust the data.", "Accurate, consistent, reliable — across collection, storage and use."],
        },
        {
          q: "“Product price must be greater than 0” and “a suspended customer cannot place an order” — what's the key difference?",
          right: "The first checks a single stored value; the second checks a business condition before allowing an action",
          wrong: [
            { t: "The first is operative and the second is structural", why: "Neither is structural; the second is operative, the first is a validity rule." },
            { t: "Both are unique-identifier requirements", why: "Neither is about telling records apart." },
            { t: "There is no difference; both are foreign keys", why: "Neither concerns a link to another table's record." },
          ],
          sol: ["Ask: is it testing a value, or deciding whether an action may happen?", "Price &gt; 0 is a validity rule; blocking suspended customers is an operative condition check."],
        },
      ]),
    ],
  });

  const generators = [genModels, genComponents, genElicit, genNounVerb, genRules, genCard, genCrow, genIntegrity];

  STUDY.registerUnit(C, {
    id: "ch6", order: 6,
    title: "Chapter 6 · Business Data Foundations: Entities, Relationships, and Rules",
    short: "Ch 6 · Data Foundations",
    description: "Conceptual data modeling: entities, attributes and relationships from business narratives, structural vs. operative rules, cardinality, crow's foot ERDs and data integrity.",
    notes, flashcards, cues, generators,
  });
})();
