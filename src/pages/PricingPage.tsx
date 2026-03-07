import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  { name: "Free", price: "$0", period: "/month", features: ["5 generations/day", "3 projects", "Basic templates", "720p export"], cta: "Get Started" },
  { name: "Pro", price: "$19", period: "/month", features: ["Unlimited generations", "Unlimited projects", "All templates", "4K export", "Priority support", "Full version history"], cta: "Start Free Trial", popular: true },
  { name: "Team", price: "$49", period: "/month", features: ["Everything in Pro", "Team workspace", "API access", "Custom templates", "SSO", "Dedicated support"], cta: "Contact Sales" },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-14 gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display text-sm font-bold gradient-text">PromptScene</span>
        </div>
      </nav>

      <div className="container max-w-4xl py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold font-display mb-3">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-sm">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-xl border p-6 ${p.popular ? "border-primary shadow-lg ring-1 ring-primary/20 relative" : "bg-card"}`}>
              {p.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-semibold text-lg mb-1">{p.name}</h3>
              <div className="mb-5">
                <span className="text-3xl font-bold font-display">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${p.popular ? "gradient-primary text-primary-foreground" : ""}`}
                variant={p.popular ? "default" : "outline"}
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
