import { Memory } from '../models/Memory.js';
import { aiService } from '../services/aiService.js';

export async function askMemory(req, res, next) {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Question is required.',
        },
      });
    }

    const userId = req.user.id;

    // Retrieve relevant candidate memories for this user
    // Split query terms for keyword retrieval
    const terms = question.trim().split(/\s+/).filter(t => t.length > 2);
    let query = { userId };

    if (terms.length > 0) {
      const regexes = terms.map(term => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      query.$or = [
        { title: { $in: regexes } },
        { tags: { $in: regexes } },
        { selectedText: { $in: regexes } },
        { note: { $in: regexes } },
      ];
    }

    const candidateMemories = await Memory.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const result = await aiService.answerFromMemories(question, candidateMemories);

    // Resolve source IDs to actual database records owned by the user
    const sourceIds = (result.sources || []).map(s => s.memoryId);
    const verifiedDbRecords = await Memory.find({
      _id: { $in: sourceIds },
      userId,
    }).lean();

    const recordMap = new Map(verifiedDbRecords.map(r => [r._id.toString(), r]));

    const cleanSources = (result.sources || [])
      .map(s => {
        const record = recordMap.get(s.memoryId);
        if (!record) return null;
        return {
          memoryId: record._id.toString(),
          title: record.title,
          url: record.url,
          domain: record.domain,
          reason: s.reason,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      data: {
        answer: result.answer,
        sources: cleanSources,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function summarizeExcerpt(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Text excerpt is required for summarization.',
        },
      });
    }

    const [summary, suggestedTags] = await Promise.all([
      aiService.generateSummary(text),
      aiService.suggestTags(text),
    ]);

    return res.status(200).json({
      data: {
        summary,
        suggestedTags,
      },
    });
  } catch (err) {
    next(err);
  }
}
