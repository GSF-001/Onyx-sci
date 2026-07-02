import { db } from '@workspace/db';
import { citationFormats, exportHistories } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

interface PaperMetadata {
  title: string;
  authors: string[];
  year: number;
  doi?: string;
  url?: string;
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: string;
}

class CitationFormatter {
  formatAPA(paper: PaperMetadata): string {
    const authors = paper.authors.slice(0, 3).join(', ');
    const etAl = paper.authors.length > 3 ? ', et al.' : '';
    const title = paper.title;
    const journal = paper.journal || 'Journal';
    const volume = paper.volume ? `, ${paper.volume}` : '';
    const issue = paper.issue ? `(${paper.issue})` : '';
    const pages = paper.pages ? `, ${paper.pages}` : '';
    const doi = paper.doi ? `. https://doi.org/${paper.doi}` : '';

    return `${authors}${etAl} (${paper.year}). ${title}. ${journal}${volume}${issue}${pages}${doi}`;
  }

  formatMLA(paper: PaperMetadata): string {
    const authors = paper.authors.slice(0, 3).join(', and ');
    const etAl = paper.authors.length > 3 ? ', et al.' : '';
    const title = paper.title;
    const journal = paper.journal || 'Journal';
    const volume = paper.volume || '';
    const issue = paper.issue ? `, no. ${paper.issue}` : '';
    const pages = paper.pages ? `, pp. ${paper.pages}` : '';
    const doi = paper.doi ? `, https://doi.org/${paper.doi}` : '';
    const date = new Date().getFullYear();

    return `${authors}${etAl}. "${title}." ${journal}, vol. ${volume}${issue}${pages}, ${date}${doi}.`;
  }

  formatBibTeX(paper: PaperMetadata): string {
    const key = paper.authors[0]?.replace(/\s/g, '') || 'paper';
    const title = paper.title;
    const authors = paper.authors.join(' and ');
    const year = paper.year;
    const journal = paper.journal || 'Journal';
    const volume = paper.volume ? `\n  volume = {${paper.volume}},` : '';
    const issue = paper.issue ? `\n  number = {${paper.issue}},` : '';
    const pages = paper.pages ? `\n  pages = {${paper.pages}},` : '';
    const doi = paper.doi ? `\n  doi = {${paper.doi}},` : '';
    const url = paper.url ? `\n  url = {${paper.url}},` : '';

    return `@article{${key}${year},\n  title = {${title}},\n  author = {${authors}},\n  year = {${year}},\n  journal = {${journal}}${volume}${issue}${pages}${doi}${url}\n}`;
  }

  formatChicago(paper: PaperMetadata): string {
    const authors = paper.authors.join(', ');
    const title = paper.title;
    const journal = paper.journal || 'Journal';
    const volume = paper.volume || '';
    const issue = paper.issue ? `, no. ${paper.issue}` : '';
    const pages = paper.pages ? `, ${paper.pages}` : '';
    const doi = paper.doi ? `, https://doi.org/${paper.doi}` : '';

    return `${authors}. "${title}." ${journal} ${volume}${issue} (${paper.year})${pages}${doi}.`;
  }

  formatHarvard(paper: PaperMetadata): string {
    const authors = paper.authors.slice(0, 3).join(', ');
    const etAl = paper.authors.length > 3 ? ' et al.' : '';
    const title = paper.title;
    const journal = paper.journal || 'Journal';
    const volume = paper.volume ? `, ${paper.volume}` : '';
    const issue = paper.issue ? `(${paper.issue})` : '';
    const pages = paper.pages ? `: ${paper.pages}` : '';
    const doi = paper.doi ? `. Available at: https://doi.org/${paper.doi}` : '';

    return `${authors}${etAl}, ${paper.year}. ${title}. ${journal}${volume}${issue}${pages}${doi}.`;
  }

  formatIEEE(paper: PaperMetadata): string {
    const authors = paper.authors
      .map((a) => {
        const parts = a.split(' ');
        const initial = parts[parts.length - 1].charAt(0);
        return `${parts.slice(0, -1).join(' ')} ${initial}.`;
      })
      .join(', ');

    const title = paper.title;
    const journal = paper.journal || 'Journal';
    const volume = paper.volume ? `, vol. ${paper.volume}` : '';
    const issue = paper.issue ? `, no. ${paper.issue}` : '';
    const pages = paper.pages ? `, pp. ${paper.pages}` : '';
    const month = new Date().toLocaleDateString('en-US', { month: 'short' });
    const doi = paper.doi ? `, doi: ${paper.doi}` : '';

    return `[${paper.year}] ${authors}, "${title}," ${journal}${volume}${issue}${pages}, ${month} ${paper.year}${doi}.`;
  }
}

export class ExportService {
  private formatter = new CitationFormatter();

  async generateCitations(paperId: string, paperData: PaperMetadata) {
    const existing = await db.query.citationFormats.findFirst({
      where: eq(citationFormats.paperId, paperId),
    });

    if (existing) {
      return existing;
    }

    const citations = {
      paperId,
      apa: this.formatter.formatAPA(paperData),
      mla: this.formatter.formatMLA(paperData),
      bibtex: this.formatter.formatBibTeX(paperData),
      chicago: this.formatter.formatChicago(paperData),
      harvard: this.formatter.formatHarvard(paperData),
      ieee: this.formatter.formatIEEE(paperData),
    };

    const [result] = await db
      .insert(citationFormats)
      .values(citations)
      .returning();

    return result;
  }

  async getCitations(paperId: string) {
    return db.query.citationFormats.findFirst({
      where: eq(citationFormats.paperId, paperId),
    });
  }

  async trackExport(
    userId: string,
    paperId: string,
    format: string,
    fileName?: string,
    fileSize?: number
  ) {
    await db.insert(exportHistories).values({
      userId,
      paperId,
      format,
      exportType: 'single',
      fileName,
      fileSize,
    });
  }

  async generateBibliography(
    userId: string,
    collectionId: string,
    format: 'bibtex' | 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee',
    papers: PaperMetadata[]
  ): Promise<string> {
    const citations = papers.map((paper) => {
      switch (format) {
        case 'bibtex':
          return this.formatter.formatBibTeX(paper);
        case 'apa':
          return this.formatter.formatAPA(paper);
        case 'mla':
          return this.formatter.formatMLA(paper);
        case 'chicago':
          return this.formatter.formatChicago(paper);
        case 'harvard':
          return this.formatter.formatHarvard(paper);
        case 'ieee':
          return this.formatter.formatIEEE(paper);
        default:
          return '';
      }
    });

    const bibliography = citations.join('\n\n');

    // Track export
    await db.insert(exportHistories).values({
      userId,
      paperId: papers[0] ? (papers[0].title as string) : '',
      format,
      exportType: 'bibliography',
      collectionId,
      fileSize: bibliography.length,
    });

    return bibliography;
  }

  async generateLaTeXBibliography(
    papers: PaperMetadata[],
    style: 'plain' | 'alpha' | 'abbrv' | 'unsrt' = 'plain'
  ): Promise<string> {
    const bibtexEntries = papers
      .map((paper) => this.formatter.formatBibTeX(paper))
      .join('\n');

    return `% LaTeX Bibliography\n\\documentclass{article}\n\\usepackage{filecontents}\n\n\\begin{filecontents}{references.bib}\n${bibtexEntries}\n\\end{filecontents}\n\n\\bibliographystyle{${style}}\n\\bibliography{references}\n`;
  }

  async getExportHistory(userId: string, limit: number = 50) {
    return db.query.exportHistories.findMany({
      where: eq(exportHistories.userId, userId),
      orderBy: [exportHistories.createdAt],
      limit,
    });
  }
}

export const exportService = new ExportService();
