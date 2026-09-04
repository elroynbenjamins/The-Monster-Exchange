/** Contain the complete frame, never stretch or cover/cut off its borders. */
export function cardLayout(bounds: readonly [number, number, number, number], sheet: readonly [number, number], width: number, height: number) {
  const [x, y, right, bottom] = bounds;
  if (width <= 0 || height <= 0 || right <= x || bottom <= y || x < 0 || y < 0 || right > sheet[0] || bottom > sheet[1]) throw new Error('Invalid card layout');
  const scale = Math.min(width / (right-x), height / (bottom-y));
  return { width: (right-x)*scale, height: (bottom-y)*scale, imageWidth: sheet[0]*scale, imageHeight: sheet[1]*scale, left: -x*scale, top: -y*scale };
}
