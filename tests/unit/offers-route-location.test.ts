import { describe, expect, it } from 'vitest';

import {
  companyLocation,
  offerLocation,
  productCategoryLocation,
  productLocation,
  templateLocation,
} from '@modules/supporting/offers/api/handlers/resource-location';

describe('offer route location helpers', () => {
  it('returns v1 offer locations', () => {
    expect(offerLocation('offer_1')).toBe('/api/v1/offers/offer_1');
  });

  it('returns v1 company locations', () => {
    expect(companyLocation('company_1')).toBe('/api/v1/companies/company_1');
  });

  it('returns v1 product locations', () => {
    expect(productLocation('product_1')).toBe('/api/v1/offers/products/product_1');
  });

  it('returns v1 product category locations', () => {
    expect(productCategoryLocation('category_1')).toBe('/api/v1/offers/products/categories/category_1');
  });

  it('returns v1 template locations', () => {
    expect(templateLocation('template_1')).toBe('/api/v1/templates/template_1');
  });
});
