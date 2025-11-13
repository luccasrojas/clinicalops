// I think this was meant as the equivalent of the hook,
// but for server-side loading of params
// but I dont think I will care about server-side loading of params
import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { DEFAULT_PAGE } from "../../../convex/constants";
import { MeetingStatusEnum } from "./types";

export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
  }),
  page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({
    clearOnDefault: true,
  }),
  status: parseAsStringEnum(Object.values(MeetingStatusEnum)),
  agentNanoId: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
  }),
};

export const loadSearchParams = createLoader(filtersSearchParams);
