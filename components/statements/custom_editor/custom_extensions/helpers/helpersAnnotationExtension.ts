export const generateColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate a pastel color
  const h = Math.abs(hash) % 360;
  const s = 50 + (Math.abs(hash) % 30); // 50-80%
  const l = 65 + (Math.abs(hash) % 15); // 65-80%

  // Calculate border and hover colors
  const borderL = l - 20; // Darker for border
  const hoverL = l - 20; // Slightly darker for hover

  return {
    backgroundColor: `hsla(${h}, ${s}%, ${l}%, 0.3)`,
    borderColor: `hsl(${h}, ${s}%, ${borderL}%)`,
    hoverBackgroundColor: `hsla(${h}, ${s}%, ${hoverL}%, 0.4)`,
  };
};
