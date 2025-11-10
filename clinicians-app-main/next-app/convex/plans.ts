import { query } from "./_generated/server";

// This is not used anywhere not even in the original example repo I took it from
// Plans are read from polar itself via sdk with:
/**  const { result } = await polar.products.list({
    organizationId: process.env.POLAR_ORGANIZATION_ID,
  }); */
export const getPlans = query({
  handler: async (ctx) => {
    const plans = await ctx.db.query("plans").collect();

    return plans;
  },
});
