import {
  CamelCasePlugin,
  Insertable,
  Kysely,
  PostgresDialect,
  Selectable,
  Updateable,
} from "kysely";
import { DB, Draft, Profile } from "kysely-codegen";
import { Pool } from "pg";

const db = new Kysely<DB>({
  plugins: [new CamelCasePlugin()],
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }),
  }),
});

declare module "kysely-codegen" {
  export type RevalidationPath = {
    path: string;
    type?: "page" | "layout" | undefined;
  };

  export type BaseProfile = Selectable<Profile>;
  export type NewProfile = Insertable<Profile>;
  export type EditedProfile = Updateable<Profile>;

  export type BaseDraft = Selectable<Draft>;
  export type NewDraft = Insertable<Draft>;
  export type EditedDraft = Updateable<Draft>;

  export type Statement = {
    statementId: string;
    drafts: BaseDraft[];
  };
}
export default db;
