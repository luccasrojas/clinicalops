"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface UserStats {
  totalNotes: number;
  thisMonth: number;
  avgDuration: number;
}

export const UserProfileDialog = () => {
  const { user } = useUser();
  const auth = useAuth();

  // ✅ Fetch profile + notes at top level
  const profileData = useQuery(
    api.profiles.getByUserId,
    user ? { userId: user.id } : "skip"
  );

  // const notesData = useQuery(
  //   api.clinical_notes.getByUserId,
  //   user ? { userId: user.id } : "skip"
  // );

  const notesStatsData = useQuery(
    api.meetings.getMeetingsWithClinicalNotesStats
  );

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  // ✅ Compute stats directly
  const stats: UserStats = (() => {
    if (!notesStatsData) return { totalNotes: 0, thisMonth: 0, avgDuration: 0 };

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // const totalNotes = notesStatsData.length;
    // const thisMonth = notesData.filter(
    //   (note) => new Date(note.created_at) >= thisMonthStart
    // ).length;

    // const avgDuration =
    //   notesData.reduce((acc, n) => acc + (n.audio_duration ?? 0), 0) /
    //   (totalNotes || 1);

    const totalNotes = notesStatsData.totalNotes;
    const thisMonth = notesStatsData.thisMonth;
    const avgDurationMs = notesStatsData.avgDurationMs;

    return {
      totalNotes,
      thisMonth,
      avgDuration: Math.round(avgDurationMs / 1000),
    };
  })();

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/";
  };

  const getDisplayName = () => {
    // return user?.fullName ?? "Usuario";
    // if (profileData?.first_name && profileData?.last_name) {
    //   return `Dr. ${profileData.first_name} ${profileData.last_name}`;
    // }
    // if (profileData?.first_name) {
    //   return `Dr. ${profileData.first_name}`;
    // }
    // return "Dr. Usuario";
    // use clerk
    return `Dr. ${user?.fullName ?? "Usuario"}`;
    // ... style is already taken care of btw
  };

  const getSpecialty = () => profileData?.specialty ?? "Médico general";

  const loading = profileData === undefined;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-medical-hover transition-colors">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
            {user?.imageUrl ? (
              <Avatar>
                <AvatarImage src={user.imageUrl} />
              </Avatar>
            ) : (
              <span className="material-icons text-sm text-accent">person</span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium truncate">
              {getDisplayName()}
            </div>
            <div className="text-xs text-muted-foreground">
              {getSpecialty()}
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="material-icons mr-2 text-accent">person</span>
            Perfil de usuario
          </DialogTitle>
          <DialogDescription>
            Información de tu cuenta y estadísticas de uso
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">Cargando...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  {/* <span className="material-icons text-accent">person</span> */}
                  {user?.imageUrl && (
                    <Avatar className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                      <AvatarImage src={user.imageUrl} />
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{getDisplayName()}</h3>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {profileData?.specialty && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Especialidad:
                    </span>
                    <Badge variant="secondary">{profileData.specialty}</Badge>
                  </div>
                )}

                {profileData?.medical_license && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Licencia:
                    </span>
                    <span className="text-sm font-mono">
                      {profileData.medical_license}
                    </span>
                  </div>
                )}

                {profileData?.institution && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Institución:
                    </span>
                    <span className="text-sm">{profileData.institution}</span>
                  </div>
                )}

                {profileData?.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Miembro desde:
                    </span>
                    <span className="text-sm">
                      {format(new Date(profileData.created_at), "MMM yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {stats.totalNotes}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Notas totales
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {stats.thisMonth}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Este mes
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {/* {stats.avgDuration}s */}
                      {/* Render in minutes and seconds */}
                      {Math.floor(stats.avgDuration / 60)}m{" "}
                      {stats.avgDuration % 60}s
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Duración prom.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <span className="material-icons mr-2 text-sm">logout</span>
                Cerrar sesión
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
