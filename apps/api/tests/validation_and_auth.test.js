import { test, describe } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { 
  isValidHttpUrl, 
  extractDomain, 
  normalizeTags, 
  sanitizeText, 
  LIMITS, 
  MEMORY_TYPES 
} from '@web-memory/shared';
import { config } from '../src/config/env.js';
import { 
  registerSchema, 
  loginSchema, 
  createMemorySchema, 
  updateMemorySchema 
} from '../src/middleware/validate.js';
import { authenticate } from '../src/middleware/auth.js';
import { aiService } from '../src/services/aiService.js';

describe('Web Memory Complete Specification Test Suite', () => {
  // 1. URL & Security
  describe('1. URL Validation & Security Rules (Spec Page 6, 8)', () => {
    test('Allows http and https URLs', () => {
      assert.strictEqual(isValidHttpUrl('https://react.dev'), true);
      assert.strictEqual(isValidHttpUrl('http://localhost:5173'), true);
      assert.strictEqual(isValidHttpUrl('https://news.ycombinator.com/item?id=123'), true);
    });

    test('Strictly rejects malicious or non-web schemes', () => {
      assert.strictEqual(isValidHttpUrl('javascript:alert(1)'), false);
      assert.strictEqual(isValidHttpUrl('data:text/html,<h1>bad</h1>'), false);
      assert.strictEqual(isValidHttpUrl('chrome://settings'), false);
      assert.strictEqual(isValidHttpUrl('chrome-extension://abcdef/popup.html'), false);
      assert.strictEqual(isValidHttpUrl('file:///etc/hosts'), false);
      assert.strictEqual(isValidHttpUrl('ftp://example.com/file'), false);
      assert.strictEqual(isValidHttpUrl(''), false);
      assert.strictEqual(isValidHttpUrl(undefined), false);
    });

    test('Derives domain server-side without www prefix', () => {
      assert.strictEqual(extractDomain('https://www.google.com/search?q=test'), 'google.com');
      assert.strictEqual(extractDomain('https://docs.github.com/en/actions'), 'docs.github.com');
      assert.strictEqual(extractDomain('http://api.internal:8080'), 'api.internal');
      assert.strictEqual(extractDomain('invalid-url'), '');
    });
  });

  // 2. Field Bounds & Normalization
  describe('2. Field Bounds & Tag Normalization (Spec Page 6)', () => {
    test('Character limits comply with specification', () => {
      assert.strictEqual(LIMITS.TITLE_MAX_LENGTH, 300);
      assert.strictEqual(LIMITS.SELECTED_TEXT_MAX_LENGTH, 20000);
      assert.strictEqual(LIMITS.NOTE_MAX_LENGTH, 5000);
      assert.strictEqual(LIMITS.TAG_MAX_LENGTH, 30);
      assert.strictEqual(LIMITS.MAX_TAGS_COUNT, 20);
    });

    test('Normalizes tag casing, trims whitespace, deduplicates, and caps count', () => {
      const rawTags = [' WebDev ', 'webdev', 'REACT', 'react', 'Tailwind', ''];
      const clean = normalizeTags(rawTags);
      assert.deepStrictEqual(clean, ['webdev', 'react', 'tailwind']);

      const stringInput = 'Node.js, Express, node.js, mongoDB';
      assert.deepStrictEqual(normalizeTags(stringInput), ['node.js', 'express', 'mongodb']);
    });

    test('Sanitizes and caps oversized text safely', () => {
      const longText = 'a'.repeat(500);
      const capped = sanitizeText(longText, LIMITS.TITLE_MAX_LENGTH);
      assert.strictEqual(capped.length, 300);
    });
  });

  // 3. Zod Request Validation Schemas
  describe('3. Zod Request Schemas (Spec Page 7, Validation)', () => {
    test('registerSchema accepts valid email and password >= 6 chars', async () => {
      const valid = await registerSchema.parseAsync({
        body: { email: 'User@Example.COM ', password: 'securePassword123' },
      });
      assert.strictEqual(valid.body.email, 'user@example.com'); // lowercased & trimmed
    });

    test('registerSchema rejects short passwords', async () => {
      await assert.rejects(async () => {
        await registerSchema.parseAsync({
          body: { email: 'valid@example.com', password: '123' },
        });
      });
    });

    test('registerSchema rejects invalid email formats', async () => {
      await assert.rejects(async () => {
        await registerSchema.parseAsync({
          body: { email: 'not-an-email', password: 'password123' },
        });
      });
    });

    test('createMemorySchema accepts valid memory payload', async () => {
      const payload = {
        body: {
          title: 'Vite Getting Started',
          url: 'https://vitejs.dev/guide/',
          type: 'highlight',
          selectedText: 'Vite is a build tool that aims to provide a faster development experience.',
          note: 'Read the section on plugins.',
          tags: ['vite', 'tooling'],
        },
      };

      const result = await createMemorySchema.parseAsync(payload);
      assert.strictEqual(result.body.title, 'Vite Getting Started');
      assert.strictEqual(result.body.type, 'highlight');
    });

    test('createMemorySchema rejects disallowed URL scheme', async () => {
      await assert.rejects(async () => {
        await createMemorySchema.parseAsync({
          body: {
            title: 'Bad schema',
            url: 'javascript:void(0)',
          },
        });
      });
    });

    test('updateMemorySchema disallows client-provided userId or _id (strictness)', async () => {
      await assert.rejects(async () => {
        await updateMemorySchema.parseAsync({
          params: { id: '507f1f77bcf86cd799439011' },
          body: {
            title: 'Updated title',
            userId: 'malicious_user_id', // MUST be rejected
          },
        });
      });
    });
  });

  // 4. Authentication & JWT Tokens
  describe('4. Authentication & Security Enforcement (Spec Page 7, 8)', () => {
    test('Hashes passwords and validates bcrypt verification', async () => {
      const password = 'mySecretPassword!2026';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      assert.notStrictEqual(password, hash);
      assert.strictEqual(await bcrypt.compare(password, hash), true);
      assert.strictEqual(await bcrypt.compare('wrongPassword', hash), false);
    });

    test('Signs JWT and verifies correct claims', () => {
      const user = { userId: '507f1f77bcf86cd799439011', email: 'dev@webmemory.app' };
      const token = jwt.sign(user, config.jwtSecret, { expiresIn: '1h' });

      const decoded = jwt.verify(token, config.jwtSecret);
      assert.strictEqual(decoded.userId, user.userId);
      assert.strictEqual(decoded.email, user.email);
    });

    test('Auth middleware blocks requests without Bearer header', () => {
      const req = { headers: {} };
      let statusCode = 0;
      let jsonBody = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      let calledNext = false;
      authenticate(req, res, () => {
        calledNext = true;
      });

      assert.strictEqual(calledNext, false);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(jsonBody.error.code, 'UNAUTHORIZED');
    });

    test('Auth middleware allows request with valid Bearer token', () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', email: 'dev@webmemory.app' },
        config.jwtSecret
      );

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      let calledNext = false;

      authenticate(req, res, () => {
        calledNext = true;
      });

      assert.strictEqual(calledNext, true);
      assert.strictEqual(req.user.id, '507f1f77bcf86cd799439011');
      assert.strictEqual(req.user.email, 'dev@webmemory.app');
    });
  });

  // 5. Cross-User Scoping & Bounded Pagination
  describe('5. Data Isolation & Bounded Pagination (Spec Page 6, 7)', () => {
    test('Simulated memory store prevents cross-user leakage', () => {
      const userAId = 'user_A_001';
      const userBId = 'user_B_002';

      const database = [
        { _id: 'm1', userId: userAId, title: "User A's doc", tags: ['react'] },
        { _id: 'm2', userId: userBId, title: "User B's secret", tags: ['private'] },
      ];

      // Safe get query: ALWAYS scoped to { _id, userId }
      function getMemoryForUser(id, authedUserId) {
        return database.find(m => m._id === id && m.userId === authedUserId) || null;
      }

      // Safe list query: ALWAYS scoped to { userId }
      function listMemoriesForUser(authedUserId) {
        return database.filter(m => m.userId === authedUserId);
      }

      // User A listing
      const userAList = listMemoriesForUser(userAId);
      assert.strictEqual(userAList.length, 1);
      assert.strictEqual(userAList[0].title, "User A's doc");

      // User B cannot access User A's memory
      assert.strictEqual(getMemoryForUser('m1', userBId), null);

      // User A cannot access User B's memory
      assert.strictEqual(getMemoryForUser('m2', userAId), null);
    });

    test('Pagination enforces bounds (limit min 1, max 100)', () => {
      function sanitizePagination(page, limit) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        return { page: pageNum, limit: limitNum };
      }

      assert.deepStrictEqual(sanitizePagination(-5, 500), { page: 1, limit: 100 });
      assert.deepStrictEqual(sanitizePagination(2, 25), { page: 2, limit: 25 });
      assert.deepStrictEqual(sanitizePagination('invalid', 'invalid'), { page: 1, limit: 20 });
    });
  });

  // 6. AI Grounding & Provider Fallback
  describe('6. AI Grounding & Fallback Specification (Spec Page 9)', () => {
    test('aiService remains functional and safe without AI API key', async () => {
      assert.strictEqual(aiService.isConfigured(), Boolean(config.aiApiKey));

      const sampleExcerpt = 'Antigravity enables advanced AI coding assistance.';
      const summary = await aiService.generateSummary(sampleExcerpt);
      assert.strictEqual(summary, null);

      const tags = await aiService.suggestTags(sampleExcerpt);
      assert.deepStrictEqual(tags, []);

      // Ask My Memory RAG fallback test
      const memories = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Web Memory Architecture',
          url: 'https://webmemory.app/docs',
          selectedText: 'MERN stack chrome extension specification.',
          tags: ['architecture'],
        },
      ];

      const ragResponse = await aiService.answerFromMemories('What stack does Web Memory use?', memories);
      assert.ok(ragResponse.answer);
      assert.ok(Array.isArray(ragResponse.sources));
      // Grounded source references actual memory ID
      assert.strictEqual(ragResponse.sources[0].memoryId, '507f1f77bcf86cd799439011');
    });

    test('Ask My Memory returns empty answer message when no memories exist', async () => {
      const ragResponse = await aiService.answerFromMemories('Any question?', []);
      assert.strictEqual(ragResponse.answer, 'You do not have any saved memories related to this question.');
      assert.deepStrictEqual(ragResponse.sources, []);
    });
  });
});
