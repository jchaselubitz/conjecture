// export const UserStatementRoles = [
//   { name: 'Viewer', value: 'viewer' },
//   { name: 'Reviewer', value: 'reviewer' },
//   { name: 'Moderator', value: 'moderator' },
//   { name: 'Author', value: 'author' },
//   { name: 'LeadAuthor', value: 'leadAuthor' }
// ] as const;

export enum UserStatementRoles {
  Viewer = 'viewer',
  Reviewer = 'reviewer',
  Moderator = 'moderator',
  Author = 'author',
  LeadAuthor = 'leadAuthor',
  SuperAdmin = 'super_admin'
}

type UserRole = `${UserStatementRoles}`;
type UserRoleKey = keyof typeof UserStatementRoles;
type UserAccess = 'author' | 'manager' | 'reader';

export enum StatementPermissions {
  ViewPublished = 'viewPublished',
  ViewDraft = 'viewDraft',
  Edit = 'edit',
  Delete = 'delete',
  ChangeRole = 'changeRole',
  Moderate = 'moderate',
  Publish = 'publish',
  ChangeTitle = 'changeTitle'
}

const viewer = [StatementPermissions.ViewPublished];
const reviewer = [...viewer, StatementPermissions.ViewDraft];
const moderator = [...viewer, StatementPermissions.ChangeRole];
const author = [...reviewer, moderator, StatementPermissions.Edit];
const leadAuthor = [
  ...author,
  StatementPermissions.ChangeRole,
  StatementPermissions.ChangeTitle,
  StatementPermissions.Publish,
  StatementPermissions.Delete
];

export const UserStatementPermissions = {
  viewer,
  reviewer,
  moderator,
  author,
  leadAuthor
};

export const AuthorGroup = [UserStatementRoles.Author, UserStatementRoles.LeadAuthor];

export const ManagerGroup = [UserStatementRoles.Moderator, UserStatementRoles.Moderator];

export const userAccess = (userRole: UserRole): UserAccess => {
  if (AuthorGroup.includes(userRole as UserStatementRoles)) {
    return 'author';
  }
  if (ManagerGroup.includes(userRole as UserStatementRoles)) {
    return 'manager';
  }
  return 'reader';
};
