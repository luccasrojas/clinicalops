import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from "convex/server";

/** Generic, fully-typed, no-any/unknown. Mirrors Convex’s own types. */
export function useApiMutation<M extends FunctionReference<"mutation">>(fn: M) {
  const [pending, setPending] = useState(false);
  const base = useMutation(fn); // ReactMutation<M>

  // same call shape as Convex’s ReactMutation: (...args: OptionalRestArgs<M>)
  const mutate = (
    ...args: OptionalRestArgs<M>
  ): Promise<FunctionReturnType<M>> => {
    setPending(true);
    return base(...args).finally(() => setPending(false));
  };

  // you still get optimistic updates if you want them later
  const withOptimisticUpdate = base.withOptimisticUpdate;

  return { mutate, pending, withOptimisticUpdate };
}

/** Economical, strongly-typed convenience exports (one-liners) */
export const useProfilesUpsertMutation = () =>
  useApiMutation(api.profiles.upsertProfile);

export const useAgentsCreateMutation = () => useApiMutation(api.agents.create);
export const useAgentsUpdateMutation = () => useApiMutation(api.agents.update);
export const useAgentsRemoveMutation = () => useApiMutation(api.agents.remove);

export const useMeetingsCreateMutation = () =>
  useApiMutation(api.meetings.create);
export const useMeetingsUpdateMutation = () =>
  useApiMutation(api.meetings.update);
export const useMeetingsRemoveMutation = () =>
  useApiMutation(api.meetings.remove);

export const useTemplatesCreateMutation = () =>
  useApiMutation(api.prartis.templates.create);
export const useTemplatesUpdateMutation = () =>
  useApiMutation(api.prartis.templates.update);
