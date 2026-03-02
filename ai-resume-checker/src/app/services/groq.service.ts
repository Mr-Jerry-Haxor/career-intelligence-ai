import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AnalysisResult {
  content: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroqService {

  private readonly WORKER_URL = environment.workerUrl;

  async analyzeResume(resumeText: string): Promise<AnalysisResult> {
    try {
      const response = await fetch(this.WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      return { content: data.content };
    } catch (error: any) {
      return {
        content: '',
        error: error.message || 'Failed to analyze resume. Please try again.'
      };
    }
  }
}
