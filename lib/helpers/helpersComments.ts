import { CommentWithStatement } from 'kysely-codegen';

import { CommentWithReplies } from '@/components/statements/comment';

export const nestComments = (
  objects: CommentWithStatement[],
  rootParentId = null
): CommentWithReplies[] => {
  const objectMap = new Map<string, CommentWithStatement & { children: any[] }>();
  objects.forEach(object => {
    objectMap.set(object.id, { ...object, children: [] });
  });

  const rootItems: (CommentWithStatement & { children: any[] })[] = [];
  objectMap.forEach(object => {
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
