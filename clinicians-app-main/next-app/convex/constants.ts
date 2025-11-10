import { ProductTier } from "../shared/types";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// HOBBY
export const HOBBY_MONTHLY_PRODUCT_ID_DEV =
  "3e74610b-f5fa-4259-aa4f-c1b077aafea9";
export const HOBBY_MONTHLY_PRODUCT_ID_PROD =
  "db90e4be-ce7a-4338-be14-edf19b304f1b";

export const HOBBY_YEARLY_PRODUCT_ID_DEV =
  "d5fb4803-9004-4f05-bf61-f49ecbbac4f5";
export const HOBBY_YEARLY_PRODUCT_ID_PROD =
  "abc626f6-e8ac-4315-ad73-a8433f4ea4e3";

// PLUS
export const PLUS_MONTHLY_PRODUCT_ID_DEV =
  "9aca33aa-ac34-4604-8fc6-2b2fca429d4f";
export const PLUS_MONTHlY_PRODUCT_ID_PROD =
  "ec54e59a-d45c-4f5b-86b8-8f3b916a664b";

export const PLUS_YEARLY_PRODUCT_ID_DEV =
  "9c6a425e-9c6a-4be9-b182-ab56a1ac6c35";
export const PLUS_YEARLY_PRODUCT_ID_PROD =
  "bae7033c-ab27-453c-8d70-c731269b26da";

// PRO
export const PRO_MONTHLY_PRODUCT_ID_DEV =
  "a1e4420f-a309-48ed-b94a-1524db7e4e5e";
export const PRO_MONTHlY_PRODUCT_ID_PROD =
  "ece30a4b-6bc1-470b-b8e6-ece1639caaf4";

export const PRO_YEARLY_PRODUCT_ID_DEV = "c28b5072-551c-4193-bf9b-51c2742e4b0a";
export const PRO_YEARLY_PRODUCT_ID_PROD =
  "185f9e55-f3da-4b0f-9d0f-a39795748c91";

export const PAYASYOUGO_PRODUCT_ID_DEV = "53451b15-8ff9-411d-adff-c45e9f304295";
export const PAYASYOUGO_PRODUCT_ID_PROD =
  "30e87d9a-ca19-49d7-959c-3691a51aef72";

export function getProductTierFromProductId(productId: string): ProductTier {
  const allHobbyProductIds = [
    HOBBY_MONTHLY_PRODUCT_ID_DEV,
    HOBBY_MONTHLY_PRODUCT_ID_PROD,
    HOBBY_YEARLY_PRODUCT_ID_DEV,
    HOBBY_YEARLY_PRODUCT_ID_PROD,
  ];

  const allPlusProductIds = [
    PLUS_MONTHLY_PRODUCT_ID_DEV,
    PLUS_MONTHlY_PRODUCT_ID_PROD,
    PLUS_YEARLY_PRODUCT_ID_DEV,
    PLUS_YEARLY_PRODUCT_ID_PROD,
  ];

  const allProProductIds = [
    PRO_MONTHLY_PRODUCT_ID_DEV,
    PRO_MONTHlY_PRODUCT_ID_PROD,
    PRO_YEARLY_PRODUCT_ID_DEV,
    PRO_YEARLY_PRODUCT_ID_PROD,
  ];

  const allPayAsYouGoProductIds = [
    PAYASYOUGO_PRODUCT_ID_DEV,
    PAYASYOUGO_PRODUCT_ID_PROD,
  ];

  if (allHobbyProductIds.includes(productId)) {
    return ProductTier.HOBBY;
  } else if (allPlusProductIds.includes(productId)) {
    return ProductTier.PLUS;
  } else if (allProProductIds.includes(productId)) {
    return ProductTier.PRO;
  } else if (allPayAsYouGoProductIds.includes(productId)) {
    return ProductTier.PAY_AS_YOU_GO;
  } else {
    return ProductTier.UNKNOWN;
  }
}
