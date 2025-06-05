export const getPanelSizeNumber = (target: string) => {
  const savedSize = localStorage.getItem(target);
  const savedSizeNumber = savedSize ? parseInt(JSON.parse(savedSize), 10) : null;
  return savedSizeNumber;
};
