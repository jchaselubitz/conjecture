export const nestObject = <
 T extends { id: string; parentId: string | null | undefined },
>(
 objects: T[],
 rootParentId = null,
): (T & { children: (T & { children: any[] })[] })[] => {
 const objectMap = new Map<string, T & { children: any[] }>();
 objects.forEach((object) => {
  objectMap.set(object.id, { ...object, children: [] });
 });

 const rootItems: (T & { children: any[] })[] = [];
 objectMap.forEach((object) => {
  if (object.parentId === rootParentId) {
   rootItems.push(object);
  } else if (object.parentId && objectMap.has(object.parentId)) {
   const parent = objectMap.get(object.parentId);
   if (parent) {
    parent.children.push(object);
   }
  } else {
   // Parent doesn't exist in our data or parentId is null/undefined, treat as root
   rootItems.push(object);
  }
 });
 return rootItems;
};
