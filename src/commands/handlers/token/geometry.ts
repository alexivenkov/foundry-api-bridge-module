export interface TokenLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate Chebyshev grid-distance in scene units between an origin pixel point
 * and a token's bounding box. Returns 0 if origin is inside the token footprint.
 *
 * Uses Chebyshev metric (max axis distance) which matches D&D 5e square-grid rules.
 */
export function chebyshevDistanceFromPoint(
  originX: number,
  originY: number,
  token: TokenLike,
  gridSize: number,
  gridDistance: number
): number {
  const tokenLeft = token.x;
  const tokenTop = token.y;
  const tokenRight = token.x + token.width * gridSize;
  const tokenBottom = token.y + token.height * gridSize;

  const closestX = Math.max(tokenLeft, Math.min(originX, tokenRight));
  const closestY = Math.max(tokenTop, Math.min(originY, tokenBottom));

  const dx = Math.abs(originX - closestX);
  const dy = Math.abs(originY - closestY);

  const pixelDistance = Math.max(dx, dy);
  const cellDistance = pixelDistance / gridSize;
  return cellDistance * gridDistance;
}
