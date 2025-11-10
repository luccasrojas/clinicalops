import {
  HOBBY_MAX_USAGE_SESSIONS,
  HOBBY_MAX_USAGE_SIMULATIONS,
  HOBBY_MAX_USAGE_AGENTS,
  PLUS_MAX_USAGE_SESSIONS,
  PLUS_MAX_USAGE_SIMULATIONS,
  PLUS_MAX_USAGE_AGENTS,
  PRO_MAX_USAGE_SESSIONS,
  PRO_MAX_USAGE_SIMULATIONS,
  PRO_MAX_USAGE_AGENTS,
  MAX_FREE_SESSIONS,
  MAX_FREE_SIMULATIONS,
  MAX_FREE_AGENTS,
  PAY_AS_YOU_GO_MAX_USAGE_SESSIONS,
  PAY_AS_YOU_GO_MAX_USAGE_SIMULATIONS,
  PAY_AS_YOU_GO_MAX_USAGE_AGENTS,
} from "./constants";
import { ProductTier } from "./types";

// util to get max usage based on product tier
export function getMaxUsageByTier(tier: ProductTier) {
  switch (tier) {
    case ProductTier.HOBBY:
      return {
        sessions: HOBBY_MAX_USAGE_SESSIONS,
        simulations: HOBBY_MAX_USAGE_SIMULATIONS,
        agents: HOBBY_MAX_USAGE_AGENTS,
      };
    case ProductTier.PLUS:
      return {
        sessions: PLUS_MAX_USAGE_SESSIONS,
        simulations: PLUS_MAX_USAGE_SIMULATIONS,
        agents: PLUS_MAX_USAGE_AGENTS,
      };
    case ProductTier.PRO:
      return {
        sessions: PRO_MAX_USAGE_SESSIONS,
        simulations: PRO_MAX_USAGE_SIMULATIONS,
        agents: PRO_MAX_USAGE_AGENTS,
      };
    case ProductTier.PAY_AS_YOU_GO:
      return {
        sessions: PAY_AS_YOU_GO_MAX_USAGE_SESSIONS,
        simulations: PAY_AS_YOU_GO_MAX_USAGE_SIMULATIONS,
        agents: PAY_AS_YOU_GO_MAX_USAGE_AGENTS,
      };
    default:
      return {
        sessions: MAX_FREE_SESSIONS,
        simulations: MAX_FREE_SIMULATIONS,
        agents: MAX_FREE_AGENTS,
      };
  }
}
