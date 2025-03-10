import { MessageSquareIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "../components/ui/button";

export default async function Home() {
  return (
    <div className="flex flex-col min-h-screen max-w-screen-xl mx-auto">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center bg-gradient-to-b from-background to-background/80">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          The Network for
          <span className="text-primary"> Civilized Debate</span>
        </h1>
        <p className="max-w-[700px] mt-6 text-lg text-muted-foreground md:text-xl">
          Engage in thoughtful discussions, share perspectives, and explore
          ideas in a space designed for meaningful dialogue.
        </p>
        <div className="flex gap-4 mt-8">
          <Link href="/join">
            <Button size="lg" className="text-lg">
              Join the Conversation
            </Button>
          </Link>
          <Link href="/explore">
            <Button size="lg" variant="outline" className="text-lg">
              Explore Discussions
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-24">
        <div className="grid gap-12 px-4 md:grid-cols-3">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <MessageSquareIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Structured Discussions</h3>
            <p className="text-muted-foreground">
              Engage in well-organized debates with clear context and threading
              for better understanding.
            </p>
          </div>
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Civil Environment</h3>
            <p className="text-muted-foreground">
              A community committed to respectful dialogue and intellectual
              discourse.
            </p>
          </div>
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <UsersIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Diverse Perspectives</h3>
            <p className="text-muted-foreground">
              Connect with thinkers from various backgrounds and expand your
              understanding.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-24 space-y-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            How Conjecture Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A platform designed to elevate online discourse
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative p-6 border rounded-lg">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              1
            </div>
            <h3 className="mt-4 text-xl font-semibold">Start a Discussion</h3>
            <p className="mt-2 text-muted-foreground">
              Share your thoughts or questions on any topic that matters to you.
            </p>
          </div>
          <div className="relative p-6 border rounded-lg">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              2
            </div>
            <h3 className="mt-4 text-xl font-semibold">Engage & Respond</h3>
            <p className="mt-2 text-muted-foreground">
              Participate in discussions with thoughtful responses and
              counter-arguments.
            </p>
          </div>
          <div className="relative p-6 border rounded-lg">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              3
            </div>
            <h3 className="mt-4 text-xl font-semibold">Learn & Grow</h3>
            <p className="mt-2 text-muted-foreground">
              Develop deeper understanding through civil discourse and diverse
              perspectives.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Ready to Join the Conversation?
          </h2>
          <p className="max-w-[600px] mx-auto mt-4 text-lg text-muted-foreground">
            Be part of a community that values thoughtful discussion and mutual
            understanding.
          </p>
          <Link href="/join" className="inline-block mt-8">
            <Button size="lg" className="text-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
