import { MdExpandMore } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { SignedIn, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";

export const Header = async () => {
  const clerkAuth = await auth();

  return (
    <header>
      <div className="flex justify-center items-center py-3 bg-primary text-white text-sm gap-3">
        <p className="text-white/60 hidden md:block">
          {"Utiliza el código "} <strong>{"VIVACOLOMBIA"}</strong>
          {
            " durante octubre para un 50% de descuento en tu primer pago en cualquiera de nuestros planes."
          }
        </p>
        {/* If signed out,sign in */}
        {clerkAuth.userId === null && (
          <Link href={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL!}>
            <div className="cursor-pointer inline-flex gap-1 items-center">
              <button>{"Iniciar sesión"}</button>
              {/* <p>Join waitlist</p> */}
              {/* https://stackoverflow.com/questions/55175445/cant-import-svg-into-next-js */}
              {/* <Image src={ArrowRight} alt="Arrow Right" width={20} height={20} /> */}
              <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
            </div>
          </Link>
        )}
        {/* If signed in, go to console */}
        <SignedIn>
          <Link href="/dashboard">
            <div className="inline-flex gap-1 items-center">
              <p>Ir a mi consola</p>
              {/* <p>Join waitlist</p> */}
              {/* https://stackoverflow.com/questions/55175445/cant-import-svg-into-next-js */}
              {/* <Image src={ArrowRight} alt="Arrow Right" width={20} height={20} /> */}
              <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
            </div>
          </Link>
        </SignedIn>
      </div>
      <div className="py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-4xl font-bold tracking-tighter text-accent">
            Prartis
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {false && (
            <>
              <a
                className="flex items-center hover:text-muted transition-colors"
                href="#"
              >
                Productos
                <span className="material-icons text-base ml-1">
                  <MdExpandMore />
                </span>
              </a>
              <a
                className="flex items-center hover:text-muted transition-colors"
                href="#"
              >
                Acerca de
                <span className="material-icons text-base ml-1">
                  <MdExpandMore />
                </span>
              </a>
              <a
                className="flex items-center hover:text-muted transition-colors"
                href="#"
              >
                {"Investigación"}
                <span className="material-icons text-base ml-1">
                  <MdExpandMore />
                </span>
              </a>
              <a
                className="flex items-center hover:text-muted transition-colors"
                href="#"
              >
                {"Compromisos"}
                <span className="material-icons text-base ml-1">
                  <MdExpandMore />
                </span>
              </a>
              <a
                className="flex items-center hover:text-muted transition-colors"
                href="#"
              >
                {"Aprender"}
                <span className="material-icons text-base ml-1">
                  <MdExpandMore />
                </span>
              </a>
              <a className="hover:text-muted transition-colors" href="#">
                {"Noticias"}
              </a>
            </>
          )}
        </nav>
        <SignInButton>
          <Button
            // onClick={() => navigate("/login")}
            // className="hover:bg-primary/90 transition-colors"
            // className="hover:bg-accent transition-colors"
            variant={"accent"}
            className="hover:bg-accent/90 transition-colors font-semibold"
            size={"lg"}
          >
            {/* Try Prartis */}
            {/* Spanish: */}
            {"Prueba Prartis"}
          </Button>
        </SignInButton>
      </div>
    </header>
  );
};
