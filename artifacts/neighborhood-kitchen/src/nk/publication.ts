import { CUSTOMER_REMINDER, PREPARATION_VERSION, validatePublish } from "./domain";
import type { Cook, Offer, OfferRevision } from "./types";

/** Capture only fictional offer content, never orders, customers or notifications. */
export function reviseOffer(previous: Offer | undefined, next: Offer, now: number): Offer {
  const { revisions: _ignored, ...snapshot } = previous ?? next;
  return {
    ...structuredClone(next),
    version: previous ? previous.version + 1 : next.status === "draft" ? 0 : 1,
    updatedAt: new Date(now).toISOString(),
    revisions: previous ? [...structuredClone(previous.revisions ?? []), structuredClone(snapshot as OfferRevision)] : [],
  };
}

export function prepareOfferSave(input: Offer, previous: Offer | undefined, cook: Cook | undefined, now: number, confirmed: boolean) {
  // Current moderation is authoritative even if an editor was opened before suspension.
  let offer = reviseOffer(previous, { ...input, moderated: previous?.moderated ?? input.moderated }, now);
  if (offer.status === "published") {
    offer = {
      ...offer, commitment: confirmed, preparationConfirmation: confirmed ? {
        statementVersion: PREPARATION_VERSION, confirmedAt: new Date(now).toISOString(),
        pickupDate: offer.pickupDate, offerVersion: offer.version,
      } : undefined,
    };
    const errors = validatePublish(offer, cook, now, previous?.status === "published");
    if (errors.length) return { errors, offer: undefined };
  }
  return { errors: [], offer };
}

export function withdrawOfferConsent(previous: Offer, now: number): Offer {
  return reviseOffer(previous, { ...previous, contactConsent: false }, now);
}

export const publicationMessage = (message: string) => message + " " + CUSTOMER_REMINDER;
