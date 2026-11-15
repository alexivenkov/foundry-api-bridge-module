import {
  isFaceUp,
  type Card,
  type CardChanges,
  type CardDraft,
  type CardFace,
  type CardFaceChanges
} from '@/core/cards/domain';
import type { FoundryCardDocument, FoundryCardFaceSource } from './foundryCardTypes';

function toCardFace(face: FoundryCardFaceSource): CardFace {
  return { name: face.name ?? null, text: face.text ?? '', img: face.img ?? null };
}

export function toCard(document: FoundryCardDocument): Card {
  const source = document._source;
  const faces = source.faces.map(toCardFace);
  const face = source.face ?? null;
  return {
    id: document.id,
    name: source.name,
    description: source.description ?? '',
    type: source.type,
    suit: source.suit ?? '',
    value: source.value ?? null,
    faces,
    face,
    faceUp: isFaceUp(face, faces.length),
    back: toCardFace(source.back),
    img: document.img,
    drawn: source.drawn,
    originId: document.origin?.id ?? null,
    sort: source.sort,
    system: source.system ?? {},
    flags: source.flags ?? {}
  };
}

/** Only the fields that are set; a cleared text is stored as an empty string, a cleared name or image as null. */
function toFoundryFaceData(face: CardFaceChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (face.name !== undefined) {
    data['name'] = face.name;
  }
  if (face.text !== undefined) {
    data['text'] = face.text ?? '';
  }
  if (face.img !== undefined) {
    data['img'] = face.img;
  }
  return data;
}

/** Only the attributes that are set become document fields, so an update stays a partial update. */
export function toFoundryCardData(changes: CardChanges | CardDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  if ('type' in changes && changes.type !== undefined) {
    data['type'] = changes.type;
  }
  if (changes.description !== undefined) {
    data['description'] = changes.description ?? '';
  }
  if (changes.suit !== undefined) {
    data['suit'] = changes.suit ?? '';
  }
  if (changes.value !== undefined) {
    data['value'] = changes.value;
  }
  if (changes.faces !== undefined) {
    data['faces'] = changes.faces.map(toFoundryFaceData);
  }
  if (changes.face !== undefined) {
    data['face'] = changes.face;
  }
  if (changes.back !== undefined) {
    data['back'] = toFoundryFaceData(changes.back);
  }
  if (changes.sort !== undefined) {
    data['sort'] = changes.sort;
  }
  if (changes.system !== undefined) {
    data['system'] = changes.system;
  }
  if (changes.flags !== undefined) {
    data['flags'] = changes.flags;
  }

  return data;
}
