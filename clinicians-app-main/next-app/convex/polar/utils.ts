import type { Product } from "@polar-sh/sdk/models/components/product.js";
import { WithoutSystemFields } from "convex/server";
import { Doc } from "../_generated/dataModel";

export const omitSystemFields = <
  T extends { _id: string; _creationTime: number } | null | undefined
>(
  doc: T
) => {
  if (!doc) {
    return doc;
  }
  const { _id, _creationTime, ...rest } = doc;
  return rest;
};

export const convertToDatabaseProduct = (
  product: Product
): WithoutSystemFields<Doc<"products">> => {
  try {
    return {
      id: product.id,
      organizationId: product.organizationId,
      name: product.name,
      description: product.description,
      isRecurring: product.isRecurring,
      isArchived: product.isArchived,
      createdAt: product.createdAt?.toISOString(),
      modifiedAt: product.modifiedAt?.toISOString() ?? null,
      recurringInterval: product.recurringInterval,
      metadata: product.metadata,
      prices: product.prices.map((price) => ({
        id: price.id,
        productId: price.productId,
        amountType: price.amountType,
        isArchived: price.isArchived,
        createdAt: price.createdAt.toISOString(),
        modifiedAt: price.modifiedAt?.toISOString() ?? null,
        recurringInterval:
          price.type === "recurring"
            ? price.recurringInterval ?? undefined
            : undefined,
        priceAmount:
          price.amountType === "fixed" ? price.priceAmount : undefined,
        priceCurrency:
          price.amountType === "fixed" || price.amountType === "custom"
            ? price.priceCurrency
            : undefined,
        minimumAmount:
          price.amountType === "custom" ? price.minimumAmount : undefined,
        maximumAmount:
          price.amountType === "custom" ? price.maximumAmount : undefined,
        presetAmount:
          price.amountType === "custom" ? price.presetAmount : undefined,
        type: price.type,
      })),
      medias: product.medias.map((media) => ({
        id: media.id,
        organizationId: media.organizationId,
        name: media.name,
        path: media.path,
        mimeType: media.mimeType,
        size: media.size,
        storageVersion: media.storageVersion,
        checksumEtag: media.checksumEtag,
        checksumSha256Base64: media.checksumSha256Base64,
        checksumSha256Hex: media.checksumSha256Hex,
        createdAt: media.createdAt.toISOString(),
        lastModifiedAt: media.lastModifiedAt?.toISOString() ?? null,
        version: media.version,
        isUploaded: media.isUploaded,
        sizeReadable: media.sizeReadable,
        publicUrl: media.publicUrl,
      })),
      raw: JSON.stringify(product),
    };
  } catch (error) {
    console.warn("Product data:", JSON.stringify(product, null, 2));
    console.error("Error converting product to database format:", error);
    console.log("Product data:", JSON.stringify(product, null, 2));
    throw error;
  }
};
