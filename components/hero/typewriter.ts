export interface TypewriterState {
  charCount: number;
  isDeleting: boolean;
}

export function getTypewriterDelay(
  state: TypewriterState,
  wordLength: number,
): number {
  if (!state.isDeleting && state.charCount === wordLength) return 2000;
  return state.isDeleting ? 50 : 100;
}

export function stepTypewriter(
  state: TypewriterState,
  wordLength: number,
): TypewriterState {
  if (!state.isDeleting) {
    return state.charCount < wordLength
      ? { charCount: state.charCount + 1, isDeleting: false }
      : { charCount: wordLength, isDeleting: true };
  }
  return state.charCount > 0
    ? { charCount: state.charCount - 1, isDeleting: true }
    : { charCount: 0, isDeleting: false };
}

// Runnable self-check: `node components/hero/typewriter.ts`
if (
  typeof window === "undefined" &&
  typeof process !== "undefined" &&
  process.argv?.[1]?.endsWith("typewriter.ts")
) {
  let s: TypewriterState = { charCount: 0, isDeleting: false };
  const len = 3;
  const delays: number[] = [];
  for (let i = 0; i < 8; i++) {
    delays.push(getTypewriterDelay(s, len));
    s = stepTypewriter(s, len);
  }
  const expected = [100, 100, 100, 2000, 50, 50, 50, 50];
  if (
    delays.join(",") !== expected.join(",") ||
    s.charCount !== 0 ||
    s.isDeleting !== false
  ) {
    throw new Error(`Typewriter self-check failed: ${delays.join(",")}`);
  }
}
