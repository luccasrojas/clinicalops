import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { DEFAULT_PAGE } from "../../../../convex/constants";

export const useAgentsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({
      clearOnDefault: true,
    }),
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({
      clearOnDefault: true,
    }),
  });
};
