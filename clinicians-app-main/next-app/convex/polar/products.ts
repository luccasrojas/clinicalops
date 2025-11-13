import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import schema from "../schema";
import { PolarCore } from "@polar-sh/sdk/core";
import { convertToDatabaseProduct, omitSystemFields } from "./utils";
import { asyncMap } from "convex-helpers";
import { productsList } from "@polar-sh/sdk/funcs/productsList.js";
import { api } from "../_generated/api";

export const getProduct = query({
  args: {
    id: v.string(),
  },
  returns: v.union(schema.tables.products.validator, v.null()),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("id", (q) => q.eq("id", args.id))
      .unique();
    // looks fancy but
    // basically just takes out _id and _creationTime from Convex document lol
    return omitSystemFields(product);
  },
});

export const createProduct = mutation({
  args: {
    product: schema.tables.products.validator,
  },
  handler: async (ctx, args) => {
    const existingProduct = await ctx.db
      .query("products")
      .withIndex("id", (q) => q.eq("id", args.product.id))
      .unique();
    if (existingProduct) {
      throw new Error(`Product already exists: ${args.product.id}`);
    }
    await ctx.db.insert("products", {
      ...args.product,
      metadata: args.product.metadata,
      raw: JSON.stringify(args.product),
    });
  },
});

export const updateProduct = mutation({
  args: {
    product: schema.tables.products.validator,
  },
  handler: async (ctx, args) => {
    const existingProduct = await ctx.db
      .query("products")
      .withIndex("id", (q) => q.eq("id", args.product.id))
      .unique();
    if (!existingProduct) {
      throw new Error(`Product not found: ${args.product.id}`);
    }
    await ctx.db.patch(existingProduct._id, {
      ...args.product,
      metadata: args.product.metadata,
      raw: JSON.stringify(args.product),
    });
  },
});

export const updateProducts = mutation({
  args: {
    polarAccessToken: v.string(),
    products: v.array(schema.tables.products.validator),
  },
  handler: async (ctx, args) => {
    await asyncMap(args.products, async (product) => {
      const existingProduct = await ctx.db
        .query("products")
        .withIndex("id", (q) => q.eq("id", product.id))
        .unique();
      if (existingProduct) {
        await ctx.db.patch(existingProduct._id, product);
        return;
      }
      await ctx.db.insert("products", product);
    });
  },
});

// ACTIONS

export const _syncProducts = action({
  args: {
    polarAccessToken: v.string(),
    server: v.union(v.literal("sandbox"), v.literal("production")),
  },
  handler: async (ctx, args) => {
    const polar = new PolarCore({
      accessToken: args.polarAccessToken,
      server: args.server,
    });
    let page = 1;
    let maxPage;
    do {
      const products = await productsList(polar, {
        page,
        limit: 100,
      });
      if (!products.value) {
        throw new Error("Failed to get products");
      }
      page = page + 1;
      maxPage = products.value.result.pagination.maxPage;
      await ctx.runMutation(api.polar.products.updateProducts, {
        polarAccessToken: args.polarAccessToken,
        products: products.value.result.items.map(convertToDatabaseProduct),
      });
    } while (maxPage >= page);
  },
});

export const syncProducts = action({
  handler: async (ctx) => {
    await ctx.runAction(api.polar.products._syncProducts, {
      polarAccessToken: process.env.POLAR_ACCESS_TOKEN!,
      server:
        process.env.POLAR_SERVER == "production" ? "production" : "sandbox",
    });
  },
});
