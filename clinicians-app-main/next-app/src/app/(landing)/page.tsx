import { Header } from "@/app/(landing)/_components/header";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tighter">
              {"Diseñando la"}{" "}
              <span className="underline decoration-4 decoration-accent">
                {"próxima frontera"}
              </span>{" "}
              {"en la atención clínica"}
            </h1>
          </div>

          <div className="hidden md:flex justify-center items-center">
            <div className="w-full max-w-md h-96 bg-gradient-to-br from-accent/20 to-primary/10 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-accent/30 rounded-full flex items-center justify-center">
                  <span className="material-icons text-4xl text-accent">
                    psychology
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {/* AI-Powered Clinical Documentation */}
                  {"Documentación clínica impulsada por IA"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="medical-card p-8 rounded-lg">
            <p className="text-sm font-semibold text-muted">
              {"NOTAS CLÍNICAS"}
            </p>
            <h2 className="text-2xl font-bold mt-2">
              Conoce las Notas Clínicas impulsadas por IA
            </h2>
            <p className="mt-2 text-muted-foreground">
              {
                "Nuestra primera herramienta impulsada por IA para optimizar la documentación clínica y reducir la carga administrativa"
              }
              .
            </p>
            <SignInButton>
              <Button
                variant={"accent"}
                // className="mt-6 w-full md:w-auto hover:bg-primary/90 transition-colors"
                className="mt-6 w-full md:w-auto hover:bg-accent/90 transition-colors"
              >
                {/* Explore ClinicalNotes */}
                {"Explora Notas Clínicas"}
              </Button>
            </SignInButton>
          </div>

          <div className="medical-card p-8 rounded-lg">
            <p className="text-sm font-semibold text-muted">API</p>
            <h2 className="text-2xl font-bold mt-2">
              {/* {"Build with Prartis"} */}
              {"Hecha con Prartis"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {/* {
                "Create HIPAA-compliant applications and custom experiences using our secure healthcare API."
              } */}
              {
                "Construye aplicaciones compatibles con HIPAA y experiencias personalizadas utilizando nuestra API segura para el sector salud."
              }
            </p>
            <SignInButton>
              <Button
                variant="secondary"
                className="mt-6 w-full md:w-auto border border-medical-border hover:bg-medical-hover transition-colors"
              >
                {/* Learn more */}
                {"Aprende más"}
              </Button>
            </SignInButton>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
