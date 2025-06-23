import { copycat } from '@snaplet/copycat';
import { createSeedClient } from '@snaplet/seed';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';

const content = [
  {
    title: 'How We Got Here',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `“The Jewish people have an exclusive and indisputable right to all areas of the Land of Israel. The government will promote and develop settlement in all parts of the Land of Israel in the Galilee, the Negev, the Golan, Judea and Samaria.” So reads the first among the list of guiding principles Israel's governing coalition formally announced upon taking power in late 2022 (source, translation).

This conviction that Jews have an exclusive claim to all the land between the Mediterranean Sea and the Jordan River is not new. It is both the cause and culmination of Israel's decades-long settlement movement and the accompanying military occupation, which has left Palestinians, who comprise half of the land's population, largely without rights. Palestinians have resisted this reality, but instead of recognizing this resistance as a result of its fundamental political contradiction—the desire to be both democratic and predominantly Jewish—Israel, a country with a liberal self-image, historical trauma, and diplomatic considerations, chose to frame it as a security problem.

By accepting this security framing, the international community mistakenly believed that Israel would naturally gravitate towards peace if only given sufficient security guarantees. In reality, any meaningful peace agreement would have threatened Israel's greater priority: expanding settlements. Had the world recognized this dynamic, it could have forced Israel to cease construction and created the conditions under which sustainable peace might be possible. Failing to do so not only prevented the success of the peace process, but led inexorably to calamity.`
  },
  {
    title: 'International Perspectives on Peace',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: While Israel's government asserts exclusive rights, many in the international community and among Israelis themselves believe that a just and lasting peace requires recognizing Palestinian rights and aspirations. The ongoing settlement expansion undermines prospects for a two-state solution and perpetuates conflict.`
  },
  {
    title: 'Security vs. Grievance: The Palestinian View',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: The framing of resistance as merely a security issue ignores the legitimate grievances and aspirations of Palestinians. Sustainable peace will only be possible when both peoples' rights and histories are acknowledged and addressed in good faith negotiations.`
  },
  {
    title: 'Democracy, Security, and Expansion',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: Some argue that the current approach prioritizes territorial expansion over democratic values, risking Israel's international standing and long-term security. Others maintain that security concerns are paramount given the region's history of violence.`
  },
  {
    title: 'Historical Context: Settlement Movement',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.`
  },
  {
    title: 'Societal Impacts of the Conflict',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.`
  },
  {
    title: 'Expansion vs. Security: Ongoing Debate',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: Some argue that the current approach prioritizes territorial expansion over democratic values, risking Israel's international standing and long-term security. Others maintain that security concerns are paramount given the region's history of violence.`
  },
  {
    title: 'Acknowledging Both Histories',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: The framing of resistance as merely a security issue ignores the legitimate grievances and aspirations of Palestinians. Sustainable peace will only be possible when both peoples' rights and histories are acknowledged and addressed in good faith negotiations.`
  },
  {
    title: 'International Standing at Risk?',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: Some argue that the current approach prioritizes territorial expansion over democratic values, risking Israel's international standing and long-term security. Others maintain that security concerns are paramount given the region's history of violence.`
  },
  {
    title: 'Security Concerns in Historical Context',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: Some argue that the current approach prioritizes territorial expansion over democratic values, risking Israel's international standing and long-term security. Others maintain that security concerns are paramount given the region's history of violence.`
  },
  {
    title: 'Balancing Values and Security',
    subtitle:
      "The history of how the settlement movement dominated Israel's priorities, torpedoed peace, and drove the cycle of violence.",
    text: `Response: Some argue that the current approach prioritizes territorial expansion over democratic values, risking Israel's international standing and long-term security. Others maintain that security concerns are paramount given the region's history of violence.`
  }
] as { title: string; subtitle: string; text: string }[];

async function main() {
  const seed = await createSeedClient({ dryRun: true });

  const jakePassword = 'bqz2bme.edk5dtz8JBW';
  const plainPassword = '12345678*';
  const jakeHashedPassword = await hash(jakePassword, 10);
  const plainHashedPassword = await hash(plainPassword, 10);

  const now = new Date();

  // --- Generate users (auth.users) ---
  const fixedUsers = await seed.users([
    {
      instance_id: '00000000-0000-0000-0000-000000000000',
      email: 'jake@c.com',
      encrypted_password: jakeHashedPassword,
      role: 'authenticated',
      aud: 'authenticated',
      is_super_admin: false,
      raw_app_meta_data: { provider: 'email', providers: ['email'] },
      raw_user_meta_data: {
        name: 'Jake',
        email: 'jake@c.com',
        username: 'jchaselubitz'
      }
    },
    {
      instance_id: '00000000-0000-0000-0000-000000000000',
      email: 'tina@c.com',
      encrypted_password: plainHashedPassword,
      role: 'authenticated',
      aud: 'authenticated',
      is_super_admin: false,
      raw_app_meta_data: { provider: 'email', providers: ['email'] },
      raw_user_meta_data: {
        name: 'Tina',
        email: 'tina@c.com',
        username: 'tina'
      }
    },
    {
      instance_id: '00000000-0000-0000-0000-000000000000',
      email: 'lucas@c.com',
      encrypted_password: plainHashedPassword,
      role: 'authenticated',
      aud: 'authenticated',
      is_super_admin: false,
      raw_app_meta_data: { provider: 'email', providers: ['email'] },
      raw_user_meta_data: {
        name: 'Lucas',
        email: 'lucas@c.com',
        username: 'lucas'
      }
    },
    {
      instance_id: '00000000-0000-0000-0000-000000000000',
      email: 'simas@c.com',
      encrypted_password: plainHashedPassword,
      role: 'authenticated',
      aud: 'authenticated',
      is_super_admin: false,
      raw_app_meta_data: { provider: 'email', providers: ['email'] },
      raw_user_meta_data: {
        name: 'Simas',
        email: 'simas@c.com',
        username: 'simas'
      }
    }
  ]);
  const generatedUsers = await seed.users(
    Array.from({ length: 6 }).map((_, i) => {
      const seedStr = `user-${i}`;
      const email = copycat.email(seedStr, { domain: 'acme.org' });
      return {
        instance_id: '00000000-0000-0000-0000-000000000000',
        email,
        encrypted_password: plainHashedPassword,
        role: 'authenticated',
        aud: 'authenticated',
        is_super_admin: false,
        raw_app_meta_data: { provider: 'email', providers: ['email'] },
        raw_user_meta_data: {
          name: email.split('@')[0],
          email,
          username: email.split('@')[0]
        }
      };
    })
  );
  const users = [...fixedUsers.users, ...generatedUsers.users];

  // --- Generate follows ---
  const fixedFollow = await seed.follow([
    {
      followed: fixedUsers.users[0].id,
      follower: fixedUsers.users[1].id,
      created_at: new Date().toISOString()
    },
    {
      followed: fixedUsers.users[0].id,
      follower: fixedUsers.users[2].id,
      created_at: new Date().toISOString()
    },
    {
      followed: fixedUsers.users[0].id,
      follower: fixedUsers.users[3].id,
      created_at: new Date().toISOString()
    }
  ]);

  const fixedSubscriptions = await seed.public_subscription([
    {
      author_id: fixedUsers.users[0].id,
      recipient_id: fixedUsers.users[1].id,
      email: fixedUsers.users[1].email ?? undefined,
      medium: 'email',
      created_at: new Date().toISOString()
    },
    {
      author_id: fixedUsers.users[0].id,
      recipient_id: fixedUsers.users[2].id,
      email: fixedUsers.users[2].email ?? undefined,
      medium: 'email',
      created_at: new Date().toISOString()
    },
    {
      author_id: fixedUsers.users[0].id,
      recipient_id: fixedUsers.users[3].id,
      email: fixedUsers.users[3].email ?? undefined,
      medium: 'email',
      created_at: new Date().toISOString()
    }
  ]);

  // --- Generate draft ---
  const statementIds = Array.from({ length: 10 }).map((_, i) => {
    return nanoid();
  });

  const fixedStatements = await seed.statement([
    {
      slug: statementIds[0],
      statement_id: statementIds[0],
      parent_statement_id: null,
      header_img:
        'https://conject.io/_next/image?url=https%3A%2F%2Fbewgymyresxixvkkqbzl.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fstatement-images%2Fb66e1e24-0fbf-4b51-95cc-5093d7f2a04c%2Fe857d479be%2Fconflict.png&w=3840&q=75',
      title: content[0].title,
      subtitle: content[0].subtitle,
      creator_id: fixedUsers.users[0].id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thread_id: '1'
    },
    {
      slug: statementIds[1],
      statement_id: statementIds[1],
      parent_statement_id: statementIds[0],
      title: content[1].title,
      subtitle: content[1].subtitle,
      header_img:
        'https://conject.io/_next/image?url=https%3A%2F%2Fbewgymyresxixvkkqbzl.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fstatement-images%2Fb66e1e24-0fbf-4b51-95cc-5093d7f2a04c%2Fe857d479be%2Fconflict.png&w=3840&q=75',
      creator_id: fixedUsers.users[1].id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thread_id: '1'
    },
    {
      slug: statementIds[2],
      statement_id: statementIds[2],
      parent_statement_id: statementIds[1],
      title: content[2].title,
      subtitle: content[2].subtitle,
      header_img:
        'https://conject.io/_next/image?url=https%3A%2F%2Fbewgymyresxixvkkqbzl.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fstatement-images%2Fb66e1e24-0fbf-4b51-95cc-5093d7f2a04c%2Fe857d479be%2Fconflict.png&w=3840&q=75',
      creator_id: fixedUsers.users[2].id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thread_id: '2'
    },
    {
      slug: statementIds[3],
      statement_id: statementIds[3],
      parent_statement_id: statementIds[2],
      title: content[3].title,
      subtitle: content[3].subtitle,
      header_img:
        'https://conject.io/_next/image?url=https%3A%2F%2Fbewgymyresxixvkkqbzl.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fstatement-images%2Fb66e1e24-0fbf-4b51-95cc-5093d7f2a04c%2Fe857d479be%2Fconflict.png&w=3840&q=75',
      creator_id: fixedUsers.users[3].id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thread_id: '3'
    }
  ]);

  // const statement = await seed.statement(
  //   Array.from({ length: 6 }).map((_, i) => {
  //     const id = statementIds[i + 4];
  //     return {
  //       slug: id,
  //       statement_id: id,
  //       parent_statement_id: null,
  //       title: content[i + 4].title,
  //       subtitle: content[i + 4].subtitle,
  //       header_img:
  //         "https://conject.io/_next/image?url=https%3A%2F%2Fbewgymyresxixvkkqbzl.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fstatement-images%2Fb66e1e24-0fbf-4b51-95cc-5093d7f2a04c%2Fe857d479be%2Fconflict.png&w=3840&q=75",
  //       creator_id: generatedUsers.users[i].id,
  //       created_at: new Date().toISOString(),
  //       updated_at: new Date().toISOString(),
  //       thread_id: null,
  //     };
  //   }),
  // );

  // const statements = [...fixedStatements.statement, ...statement.statement];

  const fixedCollaborators = await seed.collaborator([
    {
      statement_id: statementIds[0],
      user_id: fixedUsers.users[0].id,
      role: 'leadAuthor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      statement_id: statementIds[0],
      user_id: fixedUsers.users[3].id,
      role: 'author',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      statement_id: statementIds[1],
      user_id: fixedUsers.users[1].id,
      role: 'leadAuthor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      statement_id: statementIds[2],
      user_id: fixedUsers.users[2].id,
      role: 'author',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      statement_id: statementIds[3],
      user_id: fixedUsers.users[3].id,
      role: 'author',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // const collaborators = await seed.collaborator(
  //   Array.from({ length: 8 }).map((_, i) => {
  //     const count = i + 2;
  //     return {
  //       statement_id: statementIds[count],
  //       user_id: users[i].id,
  //       role: "leadAuthor",
  //       created_at: new Date().toISOString(),
  //       updated_at: new Date().toISOString(),
  //     };
  //   }),
  // );

  const fixedDrafts = await seed.draft([
    {
      id: 1, // identity column, so just use 1-based index
      content: content[1].text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      statement_id: statementIds[1],
      version_number: 1,
      published_at: new Date().toISOString(),
      creator_id: fixedUsers.users[0].id
    },
    {
      id: 2, // identity column, so just use 1-based index
      content: content[0].text,
      created_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      updated_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      statement_id: statementIds[0],
      version_number: 1,
      published_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      creator_id: fixedUsers.users[0].id
    },
    {
      id: 3, // identity column, so just use 1-based index
      content: content[0].text,
      created_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      updated_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      statement_id: statementIds[0],
      version_number: 2,
      published_at: null,
      creator_id: fixedUsers.users[0].id
    },
    {
      id: 4, // identity column, so just use 1+based index
      content: content[2].text,
      created_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      updated_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      statement_id: statementIds[2],
      version_number: 1,
      published_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      creator_id: fixedUsers.users[2].id
    },
    {
      id: 5, // identity column, so just use 1-based index
      content: content[3].text,
      created_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).toISOString(),
      updated_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).toISOString(),
      statement_id: statementIds[3],
      version_number: 1,
      published_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).toISOString(),
      creator_id: fixedUsers.users[3].id
    },
    {
      id: 6, // identity column, so just use 1-based index
      content: content[3].text,
      created_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).toISOString(),
      updated_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).toISOString(),
      statement_id: statementIds[3],
      version_number: 2,
      published_at: null,
      creator_id: fixedUsers.users[2].id
    }
  ]);

  // const generatedDrafts = await seed.draft(
  //   Array.from({ length: 6 }).map((_, i) => {
  //     const count = i + 4;
  //     return {
  //       id: count + 1, // identity column, so just use 1-based index
  //       content: content[count].text,
  //       created_at: new Date().toISOString(),
  //       updated_at: new Date().toISOString(),
  //       statement_id: statementIds[count],
  //       version_number: 1,
  //       published_at: new Date().toISOString(),
  //       creator_id: generatedUsers.users[i].id,
  //     };
  //   }),
  // );
  const drafts = [...fixedDrafts.draft];

  // --- Generate annotation ---
  const { annotation } = await seed.annotation(
    Array.from({ length: 20 }).map((_, i) => {
      const seedStr = `annotation-${i}`;

      return {
        id: copycat.uuid(seedStr),
        user_id: users[Math.floor(Math.random() * users.length)].id,
        draft_id: drafts[Math.floor(Math.random() * drafts.length)].id,
        start: copycat.int(`${seedStr}-start`, { min: 0, max: 10 }),
        end: copycat.int(`${seedStr}-end`, { min: 11, max: 20 }),
        text: copycat.sentence(seedStr),
        tag: copycat.word(seedStr),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: copycat.bool(seedStr)
      };
    })
  );

  // --- Generate comments ---
  const comments = await seed.comment(
    Array.from({ length: 20 }).map((_, i) => {
      const seedStr = `comment-${i}`;
      return {
        id: copycat.uuid(seedStr),
        user_id: users[Math.floor(Math.random() * users.length)].id,
        annotation_id: annotation[Math.floor(Math.random() * annotation.length)].id,
        content: copycat.sentence(seedStr),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    })
  );

  // --- Generate statement images ---
  const statementImages = await seed.statement_image(
    Array.from({ length: 10 }).map((_, i) => {
      const seedStr = `statement_image-${i}`;
      return {
        id: copycat.uuid(seedStr),
        statement_id: statementIds[0],
        src: 'https://conject.io/_next/image?url=https%3A%2F%2Fbewgymyresxixvkkqbzl.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fstatement-images%2Fb66e1e24-0fbf-4b51-95cc-5093d7f2a04c%2Fe857d479be%2Fconflict.png&w=3840&q=75',
        alt: copycat.words(seedStr),
        caption: copycat.sentence(seedStr),
        created_at: new Date().toISOString()
      };
    })
  );

  // --- Generate statement citations ---
  const statementCitations = await seed.statement_citation(
    Array.from({ length: 10 }).map((_, i) => {
      const seedStr = `statement_citation-${i}`;

      return {
        id: copycat.uuid(seedStr),
        statement_id: statementIds[0],
        author_names: copycat.fullName(seedStr),
        year: copycat.int(`${seedStr}-year`, { min: 1900, max: 2025 }),
        month: copycat.int(`${seedStr}-month`, { min: 1, max: 12 }),
        day: null,
        title: copycat.words(seedStr),
        title_publication: copycat.words(seedStr),
        publisher: copycat.word(seedStr),
        volume: copycat.word(seedStr),
        issue: copycat.int(`${seedStr}-issue`, { min: 1, max: 10 }),
        page_start: copycat.int(`${seedStr}-page_start`, { min: 1, max: 100 }),
        page_end: copycat.int(`${seedStr}-page_end`, { min: 101, max: 200 }),
        url: copycat.url(seedStr),
        created_at: new Date().toISOString(),
        page_type: copycat.word(seedStr)
      };
    })
  );

  process.exit();
}

main();
