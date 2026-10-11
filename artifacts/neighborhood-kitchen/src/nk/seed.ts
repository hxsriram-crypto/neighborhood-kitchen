import { ALLERGENS, type Application, type Data, type Ingredient, type Offer, type Organic } from "./types";
import { PREPARATION_VERSION } from "./domain";

const ing = (name: string, source = "", organic: Organic = "unknown"): Ingredient => ({ name, source, organic });
const al = (present: string[] = [], absent: string[] = []) => Object.fromEntries(ALLERGENS.map((a) => [a, present.includes(a) ? "present" : absent.includes(a) ? "absent" : "unknown"])) as Offer["allergens"];

export function makeSeed(now: number): Data {
  const base = Math.floor(now / 864e5) * 864e5;
  const day = (n: number) => new Date(base + n * 864e5).toISOString().slice(0, 10);
  const iso = new Date(now).toISOString();
  const common = { moderated: false, version: 1, updatedAt: iso, contactConsent: true, crossContactNote: "" };
  const offers: Offer[] = [
    { ...common, id: "soup", cookId: "mara", title: "Sunday tomato & lentil soup", description: "Slow-simmered tomatoes, green lentils and garden herbs, with a little lemon at the end.", price: "12", cuisine: "Mediterranean", portion: "One generous 16 oz jar", ingredients: [ing("Tomatoes", "Maplewood market"), ing("Green lentils", "", "not stated"), ing("Yellow onion", "", "cook-reported organic"), ing("Olive oil"), ing("Garlic"), ing("Lemon"), ing("Parsley")], allergens: al(), crossContact: "unknown", condition: "Chilled", handling: "Keep chilled after pickup. Reheat gently on the stovetop until steaming; instructions are cook-provided.", tags: ["Vegetarian", "Dairy-free"], pickupDate: day(4), pickupStart: "17:00", pickupEnd: "19:00", deadlineDate: day(2), deadlineTime: "18:00", commitment: true, status: "published", art: "peach" },
    { ...common, id: "pie", cookId: "theo", title: "Spinach, feta & dill hand pies", description: "Flaky small-batch pastry filled with spinach, feta and fresh dill.", price: "9", cuisine: "Greek-inspired", portion: "Two hand pies", ingredients: [ing("Wheat flour"), ing("Spinach", "local farm"), ing("Feta", "", "not stated"), ing("Dill"), ing("Olive oil"), ing("Egg wash", "", "not stated")], allergens: al(["Wheat", "Milk", "Egg"]), crossContact: "known", crossContactNote: "Shared home kitchen; details unknown.", condition: "Hot", handling: "Best enjoyed warm on pickup day. Cool promptly and refrigerate leftovers; cook-provided guidance.", tags: ["Vegetarian"], pickupDate: day(5), pickupStart: "16:30", pickupEnd: "18:30", deadlineDate: day(4), deadlineTime: "12:00", commitment: true, status: "published", art: "sage" },
    { ...common, id: "rice", cookId: "nina", title: "Ginger sesame rice bowls", description: "Brown rice, crisp cabbage and roasted squash with a ginger-sesame dressing.", price: "14", cuisine: "East Asian-inspired", portion: "One 20 oz bowl", ingredients: [ing("Brown rice"), ing("Cabbage", "neighborhood garden"), ing("Butternut squash", "", "cook-reported organic"), ing("Sesame"), ing("Ginger"), ing("Tamari (soy)")], allergens: al(["Sesame", "Soybeans"]), crossContact: "unknown", condition: "Chilled", handling: "Keep chilled after pickup. Reheat until hot throughout; cook-provided guidance.", tags: ["Vegan", "Gluten-aware"], pickupDate: day(6), pickupStart: "12:00", pickupEnd: "14:00", deadlineDate: day(5), deadlineTime: "10:00", commitment: true, status: "published", art: "blue" },
    { ...common, id: "flatbread", cookId: "me", title: "Garden herb flatbread", description: "Soft yeasted flatbread brushed with olive oil and torn garden herbs.", price: "8", cuisine: "Mediterranean", portion: "One 10-inch flatbread", ingredients: [ing("Wheat flour"), ing("Olive oil"), ing("Basil", "my garden", "cook-reported organic"), ing("Yeast")], allergens: al(["Wheat"]), crossContact: "unknown", condition: "Hot", handling: "Best warm. Wrap loosely once cool; cook-provided.", tags: ["Vegan"], pickupDate: day(9), pickupStart: "11:00", pickupEnd: "13:00", deadlineDate: day(8), deadlineTime: "20:00", commitment: true, status: "published", art: "sage" },
    { ...common, id: "squash", cookId: "me", title: "Roasted squash & rice", description: "", price: "", cuisine: "", portion: "", ingredients: [ing("Butternut squash"), ing("Rice")], allergens: al(), crossContact: "unknown", condition: "Chilled", handling: "", tags: [], pickupDate: day(7), pickupStart: "17:00", pickupEnd: "19:00", deadlineDate: "", deadlineTime: "", commitment: false, contactConsent: false, status: "draft", art: "blue", version: 0 },
    { ...common, id: "oldloaf", cookId: "me", title: "Lemon cardamom loaf", description: "A tender loaf with lemon zest and cardamom.", price: "7.50", cuisine: "Baking", portion: "Half loaf, about 8 slices", ingredients: [ing("Wheat flour"), ing("Butter"), ing("Eggs"), ing("Lemon")], allergens: al(["Wheat", "Milk", "Egg"]), crossContact: "unknown", condition: "Chilled", handling: "Keep wrapped at room temperature for a day; cook-provided.", tags: ["Vegetarian"], pickupDate: day(1), pickupStart: "17:00", pickupEnd: "19:00", deadlineDate: day(-1), deadlineTime: "18:00", commitment: true, status: "published", art: "peach" },
  ];
  const app = (name: string, extra: Partial<Application> = {}): Application => ({ name, neighborhood: "Maplewood", setting: "My own residential kitchen", permitAgency: "", permitNumber: "", permitExpiry: "", evidenceSample: false, residential: true, jurisdiction: true, disclosures: true, updatedAt: iso, ...extra });
  for (const offer of offers) {
    // This is sample creation time, not a claim of historical publication.
    if (offer.status === "published") offer.publishedAt = iso;
    offer.otherAllergens = "";
    offer.revisions = [];
    if (offer.commitment) offer.preparationConfirmation = {
      statementVersion: PREPARATION_VERSION, confirmedAt: iso, pickupDate: offer.pickupDate, offerVersion: offer.version,
    };
  }
  return {
    version: 1, signedIn: false, operator: false, phoneConsent: false, offers,
    cooks: [
      { id: "me", name: "Alex Larkin", initials: "AL", bio: "Demo identity: a neighbor who also cooks. Sample profile; nothing here is a real person.", status: "approved" },
      { id: "mara", name: "Mara Ellis", initials: "ME", bio: "I make the kind of hearty soup that makes a weeknight feel a little slower.", status: "approved" },
      { id: "theo", name: "Theo Park", initials: "TP", bio: "Small-batch pastry on weekends, usually something with herbs from the windowsill.", status: "approved" },
      { id: "nina", name: "Nina Brooks", initials: "NB", bio: "Bowls built around whatever the neighborhood garden is producing.", status: "approved" },
      { id: "talia", name: "Talia Mercer", initials: "TM", bio: "Applicant awaiting review (fictional).", status: "pending" },
    ],
    applications: {
      me: app("Alex Larkin", { permitAgency: "Fictional County Health Office", permitNumber: "SAMPLE-0001", evidenceSample: true, submittedAt: iso }),
      mara: app("Mara Ellis", { submittedAt: iso }), theo: app("Theo Park", { submittedAt: iso }), nina: app("Nina Brooks", { submittedAt: iso }),
      talia: app("Talia Mercer", { evidenceSample: true, submittedAt: iso }),
    },
    reports: [{ id: "r_seed", targetType: "offer", targetId: "soup", targetLabel: "Sunday tomato & lentil soup", reason: "Inaccurate allergen information", context: "Fictional sample report: allergens look unlisted.", createdAt: iso, status: "open" }],
    audit: [{ id: "a_seed", at: iso, actor: "System (demo)", action: "Sample data loaded", target: "Prototype", note: "Fictional Maplewood records created in this browser." }],
  };
}
