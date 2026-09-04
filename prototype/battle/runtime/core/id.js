                                                

export function createId(prefix        , rng              )         {
  const value = Math.floor(rng.float() * Number.MAX_SAFE_INTEGER).toString(36).padStart(10, "0");
  return `${prefix}_${value}`;
}
