import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
// IMPORT THE MODE TOGGLE WE CREATED
import { ModeToggle } from "@/components/mode-toggle"; 
import {
  ListTodo,
  Zap,
  Users,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await getSession();
    if (data?.session) {
      redirect({ to: "/dashboard", throw: true });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
              <ListTodo className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle Added Here */}
            <ModeToggle /> 
            
            <div className="hidden md:flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                    Sign In
                </Link>
                <Button asChild size="sm">
                    <Link to="/sign-up">Get Started</Link>
                </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
            <span className="flex size-2 rounded-full bg-green-500 animate-pulse" />
            <span>v2.0 is now live</span>
          </div>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Master your workflow <br className="hidden sm:block" />
            <span className="text-primary">without the chaos.</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            The all-in-one platform for engineering teams. Track tasks, collaborate in real-time, and ship faster—all in one place.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20" asChild>
              <Link to="/sign-up">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link to="/login">Existing User</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Lightning Fast"
              description="Built on the Edge. Experience zero latency task management."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Team Sync"
              description="Real-time collaboration with comments, mentions, and live updates."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Analytics"
              description="Gain insights into your team's velocity and completion rates."
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t py-12 bg-background">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TaskFlow Inc. Built with React & Hono.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}