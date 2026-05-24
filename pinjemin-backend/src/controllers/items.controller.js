const prisma = require('../config/prisma');

exports.getItems = async (req, res, next) => {
  try {
    const { category, condition, search } = req.query;
    
    let where = {};
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (search) {
      where.title = { contains: search };
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, trustScore: true, trustLevel: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, trustScore: true, trustLevel: true, avatarUrl: true }
        }
      }
    });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Increment view count — fire-and-forget (no await) to avoid blocking the response
    prisma.item.update({ where: { id: item.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    const { title, description, category, condition, depositAmount, neighborhood, tags, usageGuidelines, images } = req.body;
    
    const newItem = await prisma.item.create({
      data: {
        title,
        description,
        category,
        condition,
        depositAmount: parseInt(depositAmount) || 0,
        neighborhood: neighborhood || req.user.neighborhood || 'Unknown',
        tags: tags || '',
        usageGuidelines,
        images: images || '',
        ownerId: req.user.id
      }
    });
    
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    // Only owner can update (basic check)
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.item.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.item.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
