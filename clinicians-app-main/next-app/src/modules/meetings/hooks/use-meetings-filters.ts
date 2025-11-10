import {
  parseAsInteger,
  parseAsString,
  useQueryStates,
  parseAsStringEnum,
} from "nuqs";
import { DEFAULT_PAGE } from "../../../../convex/constants";

import { MeetingStatusEnum } from "../types";

export const useMeetingsFilters = () => {
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault("").withOptions({
      clearOnDefault: true,
    }),
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({
      clearOnDefault: true,
    }),
    status: parseAsStringEnum(
      Object.values({
        ...MeetingStatusEnum,
        Undefined: "undefined",
      })
    )
      .withDefault("undefined")
      .withOptions({
        clearOnDefault: true,
      }),
    agentNanoId: parseAsString.withDefault("").withOptions({
      clearOnDefault: true,
    }),
  });

  return [filters, setFilters] as const;
};
