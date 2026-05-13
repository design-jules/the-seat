"use client";

import { useState } from "react";
import Image from "next/image";

const cats = [
  {
    id: "skeptic",
    name: "The Skeptic",
    quote: "Is this worth my time?",
    image: "/skeptic.png",
    headerBg: "#2a3d30",
    blendMode: "screen" as React.CSSProperties["mixBlendMode"],
  },
  {
    id: "hype",
    name: "The Hype",
    quote: "Wow that was such a fun class, but no idea what to do now.",
    image: "/hype.png",
    headerBg: "#F5E8F3",
    blendMode: "multiply" as React.CSSProperties["mixBlendMode"],
  },
  {
    id: "maybe",
    name: "The Maybe",
    quote: "I can see why this matters... just not sure it matters to me.",
    image: "/maybe.png",
    headerBg: "#E2F3F0",
    blendMode: "multiply" as React.CSSProperties["mixBlendMode"],
  },
];

const personas = [
  {
    id: "skeptic",
    headerBg: "#2a3d30",
    tagClass: "bg-white/20 text-white",
    nameClass: "text-cream",
    tag: "Hard to win",
    name: "The Skeptic",
    quote: "Is this worth my time?",
  },
  {
    id: "hype",
    headerBg: "#F5E8F3",
    tagClass: "bg-[#2a3d30]/10 text-[#2a3d30]",
    nameClass: "text-[#2a3d30]",
    tag: "False positive",
    name: "The Hype",
    quote: "Wow that was such a fun class, but no idea what to do now.",
  },
  {
    id: "maybe",
    headerBg: "#E2F3F0",
    tagClass: "bg-[#2a3d30]/10 text-[#2a3d30]",
    nameClass: "text-[#2a3d30]",
    tag: "Easy to lose",
    name: "The Maybe",
    quote: "I can see why this matters... just not sure it matters to me.",
  },
];

const steps = [
  {
    number: "01",
    title: "Pick a seat",
    description:
      "Choose which learner persona you want to pressure test your training against.",
  },
  {
    number: "02",
    title: "Upload your content",
    description:
      "Drop in your slides, outline, or session plan. The Seat will read it.",
  },
  {
    number: "03",
    title: "Get interrogated",
    description:
      "Your chosen learner will push back, ask hard questions, and tell you what is not landing.",
  },
  {
    number: "04",
    title: "Get your punch list",
    description:
      "Walk away with specific, actionable changes to make before you go live.",
  },
];

export default function Home() {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  return (
    <main className="font-[family-name:var(--font-geist-sans)]">

      {/* Nav */}
      <nav className="bg-evergreen px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1.5">
            <span className="text-cream font-medium text-lg tracking-tight">
              The Seat
            </span>
            <span className="w-2 h-2 rounded-full bg-jungle inline-block" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-cream/70 hover:text-cream text-sm transition-colors">
              Home
            </a>
            <a href="#how-it-works" className="text-cream/70 hover:text-cream text-sm transition-colors">
              How it works
            </a>
            <a href="#method" className="text-cream/70 hover:text-cream text-sm transition-colors">
              The Method
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-cream/70 hover:text-cream text-sm transition-colors hidden sm:inline">
            My Sessions
          </a>
          <button className="bg-cream text-evergreen text-sm px-4 py-2 rounded-full font-medium hover:bg-cream/90 transition-colors whitespace-nowrap">
            Sign in with Google
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-evergreen flex flex-col lg:flex-row min-h-[600px]">
        <div className="lg:w-1/2 min-h-[360px] lg:min-h-[600px] relative">
          <Image
            src="/hero.png"
            alt="Person sitting in a chair, seen from behind"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="lg:w-1/2 px-8 py-16 lg:px-16 xl:px-20 flex flex-col justify-center">
          <p className="text-jungle text-xs font-medium tracking-widest uppercase mb-5">
            Design from the Seat
          </p>
          <h1 className="text-4xl lg:text-5xl font-medium text-white leading-tight mb-6">
            What is your learner
            <br />
            <span className="text-jungle">actually thinking?</span>
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-md leading-relaxed">
            Upload your training. Pick a seat. Hear the unfiltered truth before
            you ever step in the room.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-jungle text-white px-6 py-3 rounded-full font-medium hover:bg-jungle/90 transition-colors">
              Start a session
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* Cats Strip */}
      <section className="bg-evergreen py-16 px-6 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {cats.map((cat) => (
            <div key={cat.id} className="rounded-2xl overflow-hidden flex flex-col shadow-lg">
              <div
                className="relative overflow-hidden"
                style={{ backgroundColor: cat.headerBg, height: "300px" }}
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-contain object-bottom"
                  style={{
                    mixBlendMode: cat.blendMode,
                    transform: "scale(1.1)",
                    transformOrigin: "bottom center",
                  }}
                />
              </div>
              <div className="bg-white px-5 py-5">
                <h3 className="text-[#1a2920] font-medium text-lg mb-1">
                  {cat.name}
                </h3>
                <p className="text-[#1a2920]/50 text-sm italic leading-relaxed">
                  &ldquo;{cat.quote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto */}
      <section id="method" className="bg-white py-20 px-6">
        <div className="max-w-[680px] mx-auto">
          <p className="text-jungle text-xs font-medium tracking-widest uppercase mb-5">
            Why The Seat exists
          </p>
          <h2 className="text-3xl lg:text-4xl font-medium text-evergreen leading-snug mb-7">
            Most training is designed from the front of the room. We are going
            to help put you in the learner&apos;s seat.
          </h2>
          <p className="text-evergreen/60 text-lg leading-relaxed mb-10">
            You can spend hours refining the perfect learning experience. But
            how do you pressure test it before you take it live? The Seat puts
            you into the real learner&apos;s chair, whether that&apos;s a
            Skeptic who checked out before you even started, a Hype who loved
            every minute and changed nothing by Monday, or a Maybe who&apos;s
            still deciding if any of this is actually for them. Backed by 20
            years of L&amp;D experience, The Seat gives you the honest
            conversation you can&apos;t get from a colleague review or a
            post-survey.
          </p>

          <blockquote className="border-l-2 border-jungle pl-6 py-1 mb-14">
            <p className="text-evergreen text-xl font-medium leading-snug">
              &ldquo;One sticky thing beats ten forgettable things. The Seat
              helps you find the one.&rdquo;
            </p>
          </blockquote>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-mist rounded-2xl p-6">
              <p className="text-jungle text-[10px] font-medium tracking-widest uppercase mb-3">
                Principle 01
              </p>
              <h3 className="text-evergreen font-medium text-base mb-3">
                Pick one sticky thing.
              </h3>
              <p className="text-evergreen/60 text-sm leading-relaxed">
                Not 22. Not a framework, not a model. One thing your learner can
                actually do differently on Thursday. Design backwards from that.
              </p>
            </div>
            <div className="bg-lavender rounded-2xl p-6">
              <p className="text-jungle text-[10px] font-medium tracking-widest uppercase mb-3">
                Principle 02
              </p>
              <h3 className="text-evergreen font-medium text-base mb-3">
                Change behavior, not just minds.
              </h3>
              <p className="text-evergreen/60 text-sm leading-relaxed">
                A learner can leave inspired and still do nothing differently.
                The goal is not a great session. It&apos;s a different Monday.
              </p>
            </div>
            <div className="bg-amber rounded-2xl p-6">
              <p className="text-jungle text-[10px] font-medium tracking-widest uppercase mb-3">
                Principle 03
              </p>
              <h3 className="text-evergreen font-medium text-base mb-3">
                Tailor from the first moment.
              </h3>
              <p className="text-evergreen/60 text-sm leading-relaxed">
                The second a learner walks in, they&apos;re already asking is
                this for me? Your job is to answer that question before they
                even think to ask it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Persona Cards */}
      <section className="bg-cream py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-jungle text-xs font-medium tracking-widest uppercase mb-4 text-center">
            Choose your learner
          </p>
          <h2 className="text-3xl lg:text-4xl font-medium text-evergreen mb-4 text-center max-w-2xl mx-auto leading-snug">
            You&apos;ve got a room full of learners. Who do you want to focus
            on?
          </h2>
          <p className="text-evergreen/50 text-base text-center mb-12">
            Pick one. You&apos;re locked in for this session.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() =>
                  setSelectedPersona(
                    selectedPersona === persona.id ? null : persona.id
                  )
                }
                className={`text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle ${
                  selectedPersona === persona.id
                    ? "border-jungle shadow-lg -translate-y-1"
                    : "border-transparent hover:-translate-y-1 hover:shadow-md"
                }`}
              >
                <div className="p-6" style={{ backgroundColor: persona.headerBg }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${persona.tagClass}`}>
                      {persona.tag}
                    </span>
                    {selectedPersona === persona.id && (
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-jungle text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <h3 className={`font-medium text-2xl mt-5 ${persona.nameClass}`}>
                    {persona.name}
                  </h3>
                </div>
                <div className="bg-white p-6">
                  <p className="text-evergreen/70 text-sm italic leading-relaxed">
                    &ldquo;{persona.quote}&rdquo;
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              disabled={!selectedPersona}
              className={`px-8 py-4 rounded-full font-medium text-base bg-evergreen text-white transition-all duration-200 ${
                selectedPersona
                  ? "opacity-100 cursor-pointer hover:bg-evergreen/90 shadow-md hover:shadow-lg"
                  : "opacity-20 cursor-not-allowed"
              }`}
            >
              Take this seat
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-lavender py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-medium text-evergreen mb-16 text-center">
            Four steps. One honest conversation.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col">
                <span className="text-jungle text-5xl font-medium mb-4 leading-none">
                  {step.number}
                </span>
                <h3 className="text-evergreen font-medium text-lg mb-3">
                  {step.title}
                </h3>
                <p className="text-evergreen/60 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
