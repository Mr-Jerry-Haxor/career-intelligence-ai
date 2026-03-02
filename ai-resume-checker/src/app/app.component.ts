import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileParserService } from './services/file-parser.service';
import { GroqService } from './services/groq.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  state: 'idle' | 'parsing' | 'analyzing' | 'done' | 'error' = 'idle';
  fileName = '';
  errorMessage = '';
  analysisResult = '';
  isDragging = false;
  loadingMessage = '';
  private loadingInterval: any;

  readonly acceptedTypes = '.pdf,.docx,.txt';

  readonly loadingMessages = [
    'Uploading your experience to the future...',
    'Reading between the lines of your career...',
    'Checking against 2026 hiring trends...',
    'Simulating an AI coworker replacing you...',
    'Scanning for automation patterns...',
    'Measuring human vs machine value...',
    'Comparing you with global talent pool...',
    'Running layoff survival probability...',
    'Evaluating skill half-life...',
    'Estimating your career expiry date...',
    'Finding your unfair advantage...',
    'Building your upgrade roadmap...',
  ];

  constructor(
    private fileParser: FileParserService,
    private groqService: GroqService
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  private async processFile(file: File): Promise<void> {
    const validExtensions = ['pdf', 'docx', 'txt'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !validExtensions.includes(ext)) {
      this.state = 'error';
      this.errorMessage = 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.state = 'error';
      this.errorMessage = 'File too large. Maximum size is 10MB.';
      return;
    }

    this.fileName = file.name;
    this.state = 'parsing';
    this.errorMessage = '';
    this.analysisResult = '';

    try {
      const resumeText = await this.fileParser.parseFile(file);

      if (!resumeText || resumeText.trim().length < 50) {
        this.state = 'analyzing';
        this.startLoadingMessages();

        const result = await this.groqService.analyzeResume(
          '[MINIMAL CONTENT EXTRACTED]\n\nThe uploaded resume appears to be mostly empty or unreadable. File name: ' + file.name
        );

        this.stopLoadingMessages();

        if (result.error) {
          this.state = 'error';
          this.errorMessage = result.error;
        } else {
          this.state = 'done';
          this.analysisResult = result.content;
        }
        return;
      }

      this.state = 'analyzing';
      this.startLoadingMessages();

      const result = await this.groqService.analyzeResume(resumeText);

      this.stopLoadingMessages();

      if (result.error) {
        this.state = 'error';
        this.errorMessage = result.error;
      } else {
        this.state = 'done';
        this.analysisResult = result.content;
      }
    } catch (err: any) {
      this.stopLoadingMessages();
      this.state = 'error';
      this.errorMessage = err.message || 'Failed to process file.';
    }
  }

  private startLoadingMessages(): void {
    let index = 0;
    this.loadingMessage = this.loadingMessages[0];
    this.loadingInterval = setInterval(() => {
      index = (index + 1) % this.loadingMessages.length;
      this.loadingMessage = this.loadingMessages[index];
    }, 3000);
  }

  private stopLoadingMessages(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
  }

  resetAnalysis(): void {
    this.state = 'idle';
    this.fileName = '';
    this.errorMessage = '';
    this.analysisResult = '';
    this.loadingMessage = '';
    this.stopLoadingMessages();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /** Parse markdown-like analysis text into styled HTML */
  get formattedResult(): string {
    if (!this.analysisResult) return '';

    let html = this.analysisResult;

    // Escape HTML
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Headers with emojis (section headers)
    html = html.replace(/^([\u{1F600}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}].*?)$/gmu, '<h2 class="section-header">$1</h2>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Table detection (simple pipes)
    html = html.replace(/^(\|.+\|)$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim() !== '');
      const isHeader = cells.some(c => /^[\s-]+$/.test(c));
      if (isHeader) return '';
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table class="analysis-table">$&</table>');

    // Bullet points
    html = html.replace(/^[-\u2022]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Numbered lists
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');

    // Line breaks for remaining lines
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    return `<div class="analysis-content"><p>${html}</p></div>`;
  }
}
