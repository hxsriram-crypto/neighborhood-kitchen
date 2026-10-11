export type Screen = "Discover" | "Offer detail" | "Profile" | "Cook application" | "My cooking" | "Offer editor" | "Assistant" | "Operator review" | "Report queue";
export const ALLERGENS = ["Milk", "Egg", "Fish", "Crustacean shellfish", "Tree nuts", "Peanuts", "Wheat", "Soybeans", "Sesame"] as const;
export const DIETARY_TAGS = ["Vegetarian", "Vegan", "Dairy-free", "Gluten-aware"] as const;
export type AllergenDecl = "unknown" | "present" | "absent";
export type Organic = "unknown" | "not stated" | "cook-reported organic" | "not organic";
export interface Ingredient { name: string; source: string; organic: Organic }
export type OfferStatus = "draft" | "published" | "closed";
export interface PreparationConfirmation {
  statementVersion: "same-day-v1"; confirmedAt: string; pickupDate: string; offerVersion: number;
}
export type OfferRevision = Omit<Offer, "revisions">;
export interface Offer {
  id: string; cookId: string; title: string; description: string; price: string; cuisine: string; portion: string;
  ingredients: Ingredient[]; allergens: Record<string, AllergenDecl>;
  crossContact: "unknown" | "known" | "none"; crossContactNote: string;
  condition: "Hot" | "Chilled"; handling: string; tags: string[];
  pickupDate: string; pickupStart: string; pickupEnd: string; deadlineDate: string; deadlineTime: string;
  commitment: boolean; contactConsent: boolean; status: OfferStatus; moderated: boolean;
  version: number; updatedAt: string; art: "peach" | "sage" | "blue";
  otherAllergens?: string;
  preparationConfirmation?: PreparationConfirmation;
  revisions?: OfferRevision[];
}
export type CookStatus = "none" | "draft" | "pending" | "approved" | "rejected" | "suspended";
export interface Cook { id: string; name: string; initials: string; bio: string; status: CookStatus }
export interface Application {
  name: string; neighborhood: string; setting: string; permitAgency: string; permitNumber: string; permitExpiry: string;
  evidenceSample: boolean; residential: boolean; jurisdiction: boolean; disclosures: boolean; updatedAt: string; submittedAt?: string;
}
export interface Report { id: string; targetType: "offer" | "cook"; targetId: string; targetLabel: string; reason: string; context: string; createdAt: string; status: "open" | "resolved"; resolution?: string; resolvedAt?: string }
export interface AuditEntry { id: string; at: string; actor: string; action: string; target: string; note: string }
export interface Data {
  version: 1; signedIn: boolean; operator: boolean; phoneConsent: boolean;
  cooks: Cook[]; applications: Record<string, Application>; offers: Offer[]; reports: Report[]; audit: AuditEntry[];
}
export const ME = "me";
