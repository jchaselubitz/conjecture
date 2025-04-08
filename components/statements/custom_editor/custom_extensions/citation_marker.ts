export const createCitationMarker = (
  count: number,
): [string, Record<string, any>, string] => {
  return [
    "span",
    { class: "citation-number" },
    `${count} &nbsp;`,
  ];
};
