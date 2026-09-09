const BACKGROUNDS = [
  "0f172a",
  "1e1b4b",
  "134e4a",
  "7c2d12",
  "111827",
  "3b0764",
  "1a2e05",
  "4a044e",
  "1e3a8a",
  "422006",
] as const;

export const PNG_COUNT = 30;
export const PNG_SIZE = 5000;

export const PNG_SOURCES = Array.from({ length: PNG_COUNT }, (_, index) => {
  const n = String(index + 1).padStart(2, "0");
  const backgroundColor = BACKGROUNDS[index % BACKGROUNDS.length];
  return {
    label: `Asset ${n}`,
    url: `https://api.dicebear.com/9.x/shapes/png?seed=job-poc-${n}&size=${PNG_SIZE}&backgroundColor=${backgroundColor}`,
  };
});
