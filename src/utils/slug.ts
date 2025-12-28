export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateUniqueSlug = async (
  baseSlug: string,
  model: any,
  storeId?: string,
  excludeId?: string
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  const query: any = { slug, isDeleted: false };
  if (storeId) {
    query.storeId = storeId;
  }
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  while (await model.findOne(query)) {
    slug = `${baseSlug}-${counter}`;
    query.slug = slug;
    counter++;
  }

  return slug;
};

