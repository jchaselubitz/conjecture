export const nestObject = (
 objects: Partial<{ id: string; parentId: string | null | undefined }>[],
 rootParentId = null,
): Partial<
 { id: string; parentId: string | null | undefined; children: any[] }
>[] => {
 const objectMap = new Map();
 objects.forEach((object: any) => {
  objectMap.set(object.id, { ...object, children: [] });
 });

 const rootItems: Partial<
  { id: string; parentId: string | null | undefined; children: any[] }
 >[] = [];
 objectMap.forEach((object: any) => {
  if (object.parentId === rootParentId) {
   rootItems.push(object);
  } else if (objectMap.has(object.parentId)) {
   const parent = objectMap.get(object.parentId);
   parent.children.push(object);
  } else {
   // Parent doesn't exist in our data, treat as root
   rootItems.push(object);
  }
 });
 return rootItems;
};
