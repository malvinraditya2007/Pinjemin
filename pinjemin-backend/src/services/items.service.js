const prisma = require('../config/prisma');

exports.getAllItems = async ({ category, condition, search }) => {
  let where = {};
  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const items = await prisma.item.findMany({
    where,
    include: {
      owner: {
        select: { id: true, fullName: true, username: true, trustScore: true, trustLevel: true, avatarUrl: true, createdAt: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return items;
};

exports.getItemById = async (id) => {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, fullName: true, username: true, trustScore: true, trustLevel: true, avatarUrl: true, createdAt: true }
      }
    }
  });

  if (!item) {
    const error = new Error('Item not found');
    error.status = 404;
    throw error;
  }

  // Increment view count — fire-and-forget (no await) to avoid blocking the response
  prisma.item.update({ where: { id: item.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return item;
};

exports.createItem = async (ownerId, itemData) => {
  const { title, description, category, condition, depositAmount, neighborhood, lat, lng, tags, usageGuidelines, images } = itemData;
  
  // Parse images: frontend sends JSON.stringify([...base64]), schema expects Json (JSONB)
  let parsedImages = [];
  if (images) {
    try { parsedImages = typeof images === 'string' ? JSON.parse(images) : images; }
    catch { parsedImages = []; }
  }

  // Parse tags: frontend sends "bor, listrik, bosch", schema expects String[]
  const parsedTags = tags
    ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags)
    : [];

  const newItem = await prisma.item.create({
    data: {
      title,
      description,
      category,
      condition,
      depositAmount: parseInt(depositAmount) || 0,
      neighborhood: neighborhood || 'Unknown',
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      tags: parsedTags,
      usageGuidelines,
      images: parsedImages,
      ownerId
    }
  });
  
  return newItem;
};

exports.updateItem = async (userId, itemId, itemData) => {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    const error = new Error('Item not found');
    error.status = 404;
    throw error;
  }
  if (item.ownerId !== userId) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  const { title, description, category, condition, depositAmount, neighborhood, lat, lng, tags, usageGuidelines, images, isAvailable } = itemData;
  const allowedData = {};
  if (title !== undefined) allowedData.title = title;
  if (description !== undefined) allowedData.description = description;
  if (category !== undefined) allowedData.category = category;
  if (condition !== undefined) allowedData.condition = condition;
  if (depositAmount !== undefined) allowedData.depositAmount = parseInt(depositAmount) || 0;
  if (neighborhood !== undefined) allowedData.neighborhood = neighborhood;
  if (lat !== undefined) allowedData.lat = parseFloat(lat);
  if (lng !== undefined) allowedData.lng = parseFloat(lng);
  if (tags !== undefined) {
    allowedData.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags;
  }
  if (usageGuidelines !== undefined) allowedData.usageGuidelines = usageGuidelines;
  if (images !== undefined) {
    if (typeof images === 'string') {
      try { allowedData.images = JSON.parse(images); } catch { allowedData.images = []; }
    } else {
      allowedData.images = images;
    }
  }
  if (isAvailable !== undefined) allowedData.isAvailable = Boolean(isAvailable);

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: allowedData,
  });

  return updated;
};

exports.deleteItem = async (userId, itemId) => {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    const error = new Error('Item not found');
    error.status = 404;
    throw error;
  }
  if (item.ownerId !== userId) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  await prisma.item.delete({ where: { id: itemId } });
};
