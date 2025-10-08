import { NextResponse } from 'next/server';

// The client you created from the Server-Side Auth instructions
import { createClient } from '@/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure required metadata exists (username, email, picture, name)
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const existingMeta = (user.user_metadata as Record<string, any>) || {};

        // Log what Google OAuth actually provides
        // console.log('=== Google OAuth Metadata ===');
        // console.log('user.email:', user.email);
        // console.log('user.user_metadata:', JSON.stringify(user.user_metadata, null, 2));
        // console.log('user.app_metadata:', JSON.stringify(user.app_metadata, null, 2));
        // console.log('============================');

        const email = user.email ?? existingMeta.email;
        const name = existingMeta.name || existingMeta.full_name || user.user_metadata?.name;
        const picture =
          existingMeta.picture || existingMeta.avatar_url || user.user_metadata?.avatar_url;

        // Only update image_url if user doesn't already have one
        const { data: existingProfile, error: existingProfileError } = await supabase
          .from('profile')
          .select('image_url, name, email')
          .eq('id', user.id)
          .single();

        if (existingProfileError) {
          console.error('existingProfileError', { existingProfileError });
        }

        if (existingProfile) {
          let error;

          if (!existingProfile?.image_url && picture && existingProfile.image_url !== picture) {
            error = await supabase.from('profile').update({ image_url: picture }).eq('id', user.id);
          }
          if (!existingProfile?.name && name && existingProfile.name !== name) {
            error = await supabase.from('profile').update({ name }).eq('id', user.id);
          }
          if (!existingProfile?.email && email && existingProfile.email !== email) {
            error = await supabase.from('profile').update({ email }).eq('id', user.id);
          }
          if (error) {
            console.error('error', { error });
          }
        }

        const hasUsername =
          typeof existingMeta.username === 'string' && existingMeta.username.length > 0;

        const generateUsername = (): string | undefined => {
          if (!email && !name) return undefined;
          const baseSource = (email ? email.split('@')[0] : String(name)).toLowerCase();
          const base = baseSource
            .replace(/[^a-z0-9_\-\.]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 18);
          const suffix = user.id?.slice(0, 6) ?? Math.random().toString(36).slice(2, 8);
          return `${base || 'user'}-${suffix}`;
        };

        const nextUsername = hasUsername ? existingMeta.username : generateUsername();

        const dataToUpdate: Record<string, any> = {};
        if (!hasUsername && nextUsername) dataToUpdate.username = nextUsername;
        if (email && existingMeta.email !== email) dataToUpdate.email = email;
        if (picture && existingMeta.picture !== picture) dataToUpdate.picture = picture;
        if (name && existingMeta.name !== name) dataToUpdate.name = name;

        if (Object.keys(dataToUpdate).length > 0) {
          try {
            await supabase.auth.updateUser({
              data: dataToUpdate
            });
          } catch (e) {
            // best-effort; failures here shouldn't block login
          }
        }
      }
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host

        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
