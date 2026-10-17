import { Memory } from '../models/Memory.js';
import { extractDomain, normalizeTags } from '@web-memory/shared';

export async function createMemory(req, res, next) {
  try {
    const { title, url, type, selectedText, note, tags } = req.validated.body;

    // Enforce server-derived values
    const userId = req.user.id;
    const domain = extractDomain(url);
    const cleanTags = normalizeTags(tags);

    const memory = await Memory.create({
      userId,
      title,
      url,
      domain,
      type: type || 'page',
      selectedText: selectedText || '',
      note: note || '',
      tags: cleanTags,
    });

    return res.status(201).json({
      data: memory,
      message: 'Memory created',
    });
  } catch (err) {
    next(err);
  }
}

export async function listMemories(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      sort = 'newest',
      type,
      tag,
      domain,
      q,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query scoped strictly to authenticated user
    const query = { userId };

    if (type) {
      query.type = type;
    }

    if (tag) {
      query.tags = tag.toLowerCase().trim();
    }

    if (domain) {
      query.domain = domain.toLowerCase().trim();
    }

    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { title: searchRegex },
        { note: searchRegex },
        { selectedText: searchRegex },
        { tags: searchRegex },
        { domain: searchRegex },
      ];
    }

    const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [memories, total] = await Promise.all([
      Memory.find(query).sort(sortOrder).skip(skip).limit(limitNum).lean(),
      Memory.countDocuments(query),
    ]);

    return res.status(200).json({
      data: memories,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMemoryById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Strict ownership query
    const memory = await Memory.findOne({ _id: id, userId });
    if (!memory) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Memory not found.',
        },
      });
    }

    return res.status(200).json({
      data: memory,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMemory(req, res, next) {
  try {
    const { id } = req.validated.params;
    const userId = req.user.id;
    const updates = req.validated.body;

    // If URL is updated, re-derive domain server-side
    if (updates.url) {
      updates.domain = extractDomain(updates.url);
    }

    // If tags are updated, normalize
    if (updates.tags !== undefined) {
      updates.tags = normalizeTags(updates.tags);
    }

    const memory = await Memory.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!memory) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Memory not found or you do not have permission to edit it.',
        },
      });
    }

    return res.status(200).json({
      data: memory,
      message: 'Memory updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMemory(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const memory = await Memory.findOneAndDelete({ _id: id, userId });
    if (!memory) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Memory not found or you do not have permission to delete it.',
        },
      });
    }

    return res.status(200).json({
      message: 'Memory deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function searchMemories(req, res, next) {
  try {
    const userId = req.user.id;
    const q = req.query.q || '';

    if (!q.trim()) {
      return res.status(200).json({
        data: [],
        total: 0,
      });
    }

    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');

    const memories = await Memory.find({
      userId,
      $or: [
        { title: searchRegex },
        { note: searchRegex },
        { selectedText: searchRegex },
        { tags: searchRegex },
        { domain: searchRegex },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      data: memories,
      total: memories.length,
    });
  } catch (err) {
    next(err);
  }
}
