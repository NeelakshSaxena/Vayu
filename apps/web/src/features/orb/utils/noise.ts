// A simple noise function for procedural organic movement
export const noise1D = (x: number) => {
  return Math.sin(x) * Math.sin(x * 1.5) * Math.sin(x * 2.3);
};

// Generates a random value within a range
export const randomRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};
