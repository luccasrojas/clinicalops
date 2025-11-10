import { EmptyState } from "@/components/empty-state";

const CancelledState = () => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center">
      <EmptyState
        image="/cancelled.svg"
        title="La simulación está cancelada"
        description="La simulación ha sido cancelada."
      />
    </div>
  );
};

export default CancelledState;
