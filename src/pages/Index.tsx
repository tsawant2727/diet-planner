import { DietPlanForm } from "@/components/DietPlanForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="border-b border-primary/30 bg-gradient-to-r from-background via-card to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-primary text-glow tracking-tight">
              G-FORCE
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-semibold">
              Diet Plan Generator
            </p>
          
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <DietPlanForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/30 mt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            Powered by <span className="text-primary font-bold">G-FORCE</span> | Fuel Your Power 
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            gforcefitness.in 
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
