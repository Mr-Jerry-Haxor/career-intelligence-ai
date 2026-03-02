import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

@Injectable({
  providedIn: 'root'
})
export class FileParserService {

  async parseFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return this.parsePdf(file);
      case 'docx':
        return this.parseDocx(file);
      case 'txt':
        return this.parseTxt(file);
      default:
        throw new Error(`Unsupported file type: .${extension}`);
    }
  }

  private async parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    return this.cleanText(textParts.join('\n'));
  }

  private async parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return this.cleanText(result.value);
  }

  private async parseTxt(file: File): Promise<string> {
    return this.cleanText(await file.text());
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
