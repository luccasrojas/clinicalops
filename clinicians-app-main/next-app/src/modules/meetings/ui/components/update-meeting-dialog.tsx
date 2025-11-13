import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./meeting-form";
import { MeetingGetOne } from "../../types";

interface UpdateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: MeetingGetOne;
  isSimulation?: boolean;
}

export const UpdateMeetingDialog = ({
  open,
  onOpenChange,
  initialValues,
  isSimulation = true,
}: UpdateMeetingDialogProps) => {
  return (
    <ResponsiveDialog
      title={`Actualizar ${isSimulation ? "simulación" : "sesión"}`}
      description={`Actualiza los detalles de la ${
        isSimulation ? "simulación" : "sesión"
      }.`}
      open={open}
      onOpenChange={onOpenChange}
    >
      <MeetingForm
        initialValues={initialValues}
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        isSimulation={isSimulation}
      />
    </ResponsiveDialog>
  );
};
