export const springs = {
  responsive: { damping: 20, stiffness: 300, mass: 0.5 },
  heavy: { damping: 40, stiffness: 200, mass: 2 },
  // Laggy spring for cursor tracking to feel like it's observing rather than sticking
  observant: { damping: 35, stiffness: 120, mass: 1.5 },
  bouncy: { damping: 10, stiffness: 400, mass: 0.5 },
  // Extremely heavy and slow spring for breathing
  breathing: { damping: 60, stiffness: 40, mass: 4 },
  // Smooth transitions between states
  stateTransition: { damping: 25, stiffness: 150, mass: 1 },
};
