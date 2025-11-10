import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm, MeetingsFormPRARTIS } from "./meeting-form";
import { useRouter } from "next/navigation";

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewMeetingDialog = ({
  open,
  onOpenChange,
}: NewMeetingDialogProps) => {
  const router = useRouter();
  return (
    <ResponsiveDialog
      title="Nueva simulación"
      description="Crea una nueva simulación."
      open={open}
      onOpenChange={onOpenChange}
    >
      <MeetingForm
        onSuccess={(id) => {
          onOpenChange(false);
          router.push(`/dashboard/simulations/${id}`);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};

export const NewMeetingDialogPRARTIS = () => {
  const router = useRouter();

  return (
    <MeetingsFormPRARTIS
      onSuccess={(id) => {
        // TODO: Should perhaps show a transition state here...
        // or maybe inside the component
        // switch to sessions later
        // router.push(`/dashboard/simulations/${id}`);
        router.push(`/dashboard/c/${id}`);
      }}
    />
  );
};
