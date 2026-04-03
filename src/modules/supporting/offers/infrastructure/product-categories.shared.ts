import { Prisma } from '@platform/database/prisma';

type ParentCategoryRecord = {
  name: string;
};

type CategoryRecord = {
  name: string;
  parent: ParentCategoryRecord | null;
};

export function buildStructuredCategoryLabel(category: CategoryRecord): string {
  return category.parent ? `${category.parent.name} / ${category.name}` : category.name;
}

export function isMissingProductCategorySchemaError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' || error.code === 'P2022';
  }

  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes('categoryId') ||
    message.includes('off_product_categories') ||
    message.includes('ProductCategory') ||
    message.includes('categoryNode')
  );
}
