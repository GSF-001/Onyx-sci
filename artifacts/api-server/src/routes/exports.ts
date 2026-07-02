import { Router } from 'express';
import { exportService } from '../services/exportService';
import { requireAuth } from '../middlewares/auth';
import { errorHandler } from '../lib/errorHandler';
import { z } from 'zod';

const router = Router();

const ExportSchema = z.object({
  format: z.enum(['apa', 'mla', 'bibtex', 'chicago', 'harvard', 'ieee']),
});

const GenerateBibliographySchema = z.object({
  collectionId: z.string().uuid(),
  format: z.enum(['apa', 'mla', 'bibtex', 'chicago', 'harvard', 'ieee']),
  papers: z.array(
    z.object({
      title: z.string(),
      authors: z.array(z.string()),
      year: z.number(),
      doi: z.string().optional(),
      url: z.string().optional(),
      journal: z.string().optional(),
      volume: z.number().optional(),
      issue: z.number().optional(),
      pages: z.string().optional(),
    })
  ),
});

// Get citations for a paper
router.get('/citations/:paperId', errorHandler(async (req, res) => {
  const { paperId } = req.params;

  const citations = await exportService.getCitations(paperId);

  if (!citations) {
    return res.status(404).json({
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: 'Citations not found for this paper',
      },
    });
  }

  res.json({
    status: 'success',
    data: citations,
  });
}));

// Generate citations for a paper
router.post('/citations/:paperId/generate', requireAuth, errorHandler(async (req, res) => {
  const { paperId } = req.params;
  const { paperData } = req.body;

  const citations = await exportService.generateCitations(paperId, paperData);

  res.json({
    status: 'success',
    data: citations,
  });
}));

// Generate bibliography from papers
router.post('/bibliography', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const validated = GenerateBibliographySchema.parse(req.body);

  const bibliography = await exportService.generateBibliography(
    userId,
    validated.collectionId,
    validated.format,
    validated.papers
  );

  res.json({
    status: 'success',
    data: {
      format: validated.format,
      content: bibliography,
      count: validated.papers.length,
    },
  });
}));

// Generate LaTeX bibliography
router.post('/latex-bibliography', requireAuth, errorHandler(async (req, res) => {
  const { papers, style } = req.body;

  const latexBib = await exportService.generateLaTeXBibliography(
    papers,
    style || 'plain'
  );

  res.json({
    status: 'success',
    data: {
      format: 'latex',
      content: latexBib,
    },
  });
}));

// Get export history
router.get('/history', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const limit = parseInt(req.query.limit as string) || 50;

  const history = await exportService.getExportHistory(userId, limit);

  res.json({
    status: 'success',
    data: history,
  });
}));

export default router;
