import { MessageSquareIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import SiteNav from '@/components/navigation/site_nav';

import { Button } from '../components/ui/button';

export default async function Home() {
  return (
    <>
      <SiteNav />
      <div className="flex flex-col min-h-screen max-w-screen-xl mx-auto ">
        {/* Hero Section with Background Image */}
        <section className=" flex flex-col items-center justify-center min-h-[500px] px-4 sm:px-6 lg:px-8 py-24 md:pt-40 text-center overflow-hidden">
          <div className="absolute inset-0 w-full h-full -z-10">
            <div className="relative w-full h-full">
              <Image
                src="/hero-bg.png"
                alt="Decorative background"
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                className="opacity-[0.15] mix-blend-multiply"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
          </div>

          {/* Logo */}
          <div className="relative mb-6">
            <Image
              src="/conject-icon.png"
              alt="Conjecture logo"
              width={96}
              height={96}
              priority
              className="rounded-md"
            />
          </div>

          <h1 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter text-[#2D1810]">
            The Network for
            <span className="block sm:inline text-[#C26033]"> Civilized Debate</span>
          </h1>
          <p className="relative max-w-[700px] mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-[#2D1810] px-4">
            Engage in thoughtful discussions, share perspectives, and explore ideas in a space
            designed for meaningful dialogue.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-4 mt-6 sm:mt-8 w-full sm:w-auto px-4">
            <Link href="/feed" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg bg-[#C26033] hover:bg-[#A74D29] text-white"
              >
                Explore Discussions
              </Button>
            </Link>
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg border-[#C26033] text-[#C26033] hover:bg-[#FDF6EC] hover:text-[#A74D29]"
              >
                Join the Conversation
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid - Now with subtle background */}
        <section className="relative container py-20 md:py-24 mx-auto overflow-hidden ">
          {/* <div className="absolute inset-0 w-full h-full -z-10">
          <Image
            src="/hero-bg.png"
            alt="Decorative background"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            className="opacity-[0.07] mix-blend-multiply rotate-180"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white" />
        </div> */}
          <div className="grid gap-8 sm:gap-12 px-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-4 bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#C26033]">
                <MessageSquareIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#2D1810]">Substantive Ideas</h3>
              <p className="text-[#4A4A4A]">
                Engage with thoughtful essays and deep discussions that go beyond surface-level
                debate.
              </p>
            </div>
            <div className="space-y-4 bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#C26033]">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#2D1810]">Civil Environment</h3>
              <p className="text-[#4A4A4A]">
                A community committed to respectful dialogue and intellectual discourse.
              </p>
            </div>
            <div className="space-y-4 bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#C26033]">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#2D1810]">Diverse Perspectives</h3>
              <p className="text-[#4A4A4A]">
                Connect with thinkers from various backgrounds and expand your understanding.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container py-20 md:py-24 space-y-12 sm:space-y-16 mx-auto">
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-[#2D1810]">
              How Conjecture Works
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#4A4A4A]">
              A platform designed to elevate online discourse
            </p>
          </div>
          <div className="grid gap-6 sm:gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative p-4 sm:p-6 border rounded-lg bg-white">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#C26033] text-white flex items-center justify-center font-semibold">
                1
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#2D1810]">Write an Essay</h3>
              <p className="mt-2 text-[#4A4A4A]">
                Craft your thoughts into a well-structured essay on any topic that interests you.
              </p>
            </div>
            <div className="relative p-4 sm:p-6 border rounded-lg bg-white">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#C26033] text-white flex items-center justify-center font-semibold">
                2
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#2D1810]">
                Share with the Community
              </h3>
              <p className="mt-2 text-[#4A4A4A]">
                Post your essay to our community of engaged thinkers and intellectuals.
              </p>
            </div>
            <div className="relative p-4 sm:p-6 border rounded-lg bg-white">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#C26033] text-white flex items-center justify-center font-semibold">
                3
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#2D1810]">
                Get Substantive Feedback
              </h3>
              <p className="mt-2 text-[#4A4A4A]">
                Receive thoughtful critiques and engage in meaningful discussions about your ideas.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 md:py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 w-full h-full -z-10">
            <Image
              src="/hero-bg.png"
              alt="Decorative background"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              className="opacity-[0.1] mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white" />
          </div>
          <div className="container px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-[#2D1810]">
              Ready to Join the Conversation?
            </h2>
            <p className="max-w-[600px] mx-auto mt-3 sm:mt-4 text-base sm:text-lg text-[#4A4A4A]">
              Be part of a community that values thoughtful discussion and mutual understanding.
            </p>
            <Link href="/sign-up" className="inline-block mt-6 sm:mt-8 w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg bg-[#C26033] hover:bg-[#A74D29] text-white"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#4A4A4A]">
              © {new Date().getFullYear()} Conjecture. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-sm text-[#4A4A4A] hover:text-[#C26033] transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-[#4A4A4A] hover:text-[#C26033] transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
