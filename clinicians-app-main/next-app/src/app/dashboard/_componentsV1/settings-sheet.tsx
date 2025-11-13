import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";

interface UserProfile {
  first_name: string;
  last_name: string;
  specialty: string;
  medical_license: string;
  institution: string;
}

export const SettingsSheet = () => {
  const { user } = useUser();

  // ✅ fetch directly with useQuery
  const profileData = useQuery(
    api.profiles.getByUserId,
    user ? { userId: user.id } : "skip"
  );

  const [profile, setProfile] = useState<UserProfile>({
    first_name: "",
    last_name: "",
    specialty: "",
    medical_license: "",
    institution: "",
  });

  const { mutate: upsertProfile, pending } = useApiMutation(
    api.profiles.upsertProfile
  );

  // ✅ update state whenever profileData changes
  useEffect(() => {
    if (profileData) {
      setProfile({
        first_name: profileData.first_name ?? "",
        last_name: profileData.last_name ?? "",
        specialty: profileData.specialty ?? "",
        medical_license: profileData.medical_license ?? "",
        institution: profileData.institution ?? "",
      });
    }
  }, [profileData]);

  const saveProfile = async () => {
    if (!user) return;
    try {
      await upsertProfile({
        userId: user.id,
        firstName: profile.first_name || undefined,
        lastName: profile.last_name || undefined,
        specialty: profile.specialty || undefined,
        medicalLicense: profile.medical_license || undefined,
        institution: profile.institution || undefined,
      });

      toast("Perfil actualizado.");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast("No se pudo guardar el perfil", {
        style: { background: "red" },
      });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const loading = profileData === undefined;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline2"
          size="sm"
          // className="border-medical-border hover:bg-medical-hover"
        >
          <span className="material-icons text-sm">settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px">
        <SheetHeader
        // style={{ borderBottom: "1px solid blue" }}
        >
          <SheetTitle className="flex items-center">
            <span className="material-icons mr-2 text-accent">settings</span>
            Configuraciones
          </SheetTitle>
          <SheetDescription>
            Administra tu perfil y preferencias de la aplicación
          </SheetDescription>
        </SheetHeader>

        <div
          className="mt-6 px-3"
          //   style={{
          //     border: "1px solid red",
          //   }}
        >
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombre</Label>
                      <Input
                        id="first_name"
                        value={profile.first_name}
                        onChange={(e) =>
                          handleInputChange("first_name", e.target.value)
                        }
                        placeholder="Tu nombre"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellidos</Label>
                      <Input
                        id="last_name"
                        value={profile.last_name}
                        onChange={(e) =>
                          handleInputChange("last_name", e.target.value)
                        }
                        placeholder="Tus apellidos"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad</Label>
                    <Input
                      id="specialty"
                      value={profile.specialty}
                      onChange={(e) =>
                        handleInputChange("specialty", e.target.value)
                      }
                      placeholder="Tu especialidad médica"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical_license">Licencia Médica</Label>
                    <Input
                      id="medical_license"
                      value={profile.medical_license}
                      onChange={(e) =>
                        handleInputChange("medical_license", e.target.value)
                      }
                      placeholder="Número de licencia médica"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution">Institución</Label>
                    <Input
                      id="institution"
                      value={profile.institution}
                      onChange={(e) =>
                        handleInputChange("institution", e.target.value)
                      }
                      placeholder="Hospital o clínica"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    onClick={saveProfile}
                    disabled={pending || loading}
                    className="w-full"
                    variant={"accent"}
                  >
                    {pending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Preferencias de Aplicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Idioma de la interfaz</Label>
                    <Input value="Español" disabled />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Formato de notas por defecto</Label>
                    <Input value="SOAP" disabled />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Autosave de transcripciones</Label>
                    <Input value="Habilitado" disabled />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Estas configuraciones estarán disponibles en futuras
                    versiones.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};
