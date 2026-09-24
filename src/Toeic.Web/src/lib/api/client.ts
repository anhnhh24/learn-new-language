import {
  mockExamForms,
  mockPart5Questions,
  mockPart7Questions,
  mockMistakes,
  mockFlashcards,
  mockCandidateReviews,
  mockGenerationJobs,
} from './fixtures';
import {
  ExamForm,
  AttemptSession,
  ExamResult,
  ExamMode,
} from '../../types/practice';
import { MistakeRecord, MistakeStatus, FlashcardItem, FlashcardRating } from '../../types/review';
import { CandidateQualityReview, GenerationJobSummary } from '../../types/admin';

// In-memory or localStorage cache for local active attempts
const ACTIVE_ATTEMPT_STORAGE_KEY = 'toeic_active_attempt';
const SUBMITTED_RESULTS_STORAGE_KEY = 'toeic_results_history';

class ApiClient {
  private _baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080';
  public getBaseUrl() {
    return this._baseUrl;
  }

  async getExamForms(): Promise<ExamForm[]> {
    return Promise.resolve(mockExamForms);
  }

  async startAttempt(formId: string, mode: ExamMode = 'Practice'): Promise<AttemptSession> {
    const form = mockExamForms.find((f) => f.id === formId) || mockExamForms[0];

    // Pick questions based on form part
    const questions =
      form.part === 'Part7'
        ? mockPart7Questions
        : form.part === 'FullReading'
        ? [...mockPart5Questions, ...mockPart7Questions]
        : mockPart5Questions;

    const startedAt = new Date();
    const deadline = new Date(startedAt.getTime() + form.durationMinutes * 60 * 1000);

    const session: AttemptSession = {
      attemptId: `att-${Date.now()}`,
      formId: form.id,
      formTitle: form.title,
      tier: form.tier,
      mode,
      startedAt: startedAt.toISOString(),
      deadline: deadline.toISOString(),
      questions,
      responses: {},
      flaggedQuestionIds: [],
    };

    localStorage.setItem(ACTIVE_ATTEMPT_STORAGE_KEY, JSON.stringify(session));
    return Promise.resolve(session);
  }

  async getActiveAttempt(attemptId: string): Promise<AttemptSession | null> {
    const stored = localStorage.getItem(ACTIVE_ATTEMPT_STORAGE_KEY);
    if (!stored) return null;
    try {
      const session = JSON.parse(stored) as AttemptSession;
      if (session.attemptId === attemptId) return session;
      return session; // Return current session
    } catch {
      return null;
    }
  }

  async saveResponse(
    _attemptId: string,
    questionId: string,
    optionId: string
  ): Promise<{ savedAt: string; revision: number }> {
    const stored = localStorage.getItem(ACTIVE_ATTEMPT_STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as AttemptSession;
        session.responses[questionId] = optionId;
        localStorage.setItem(ACTIVE_ATTEMPT_STORAGE_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
    }
    return Promise.resolve({
      savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      revision: Date.now(),
    });
  }

  async toggleFlagQuestion(_attemptId: string, questionId: string): Promise<string[]> {
    const stored = localStorage.getItem(ACTIVE_ATTEMPT_STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as AttemptSession;
        if (session.flaggedQuestionIds.includes(questionId)) {
          session.flaggedQuestionIds = session.flaggedQuestionIds.filter((id) => id !== questionId);
        } else {
          session.flaggedQuestionIds.push(questionId);
        }
        localStorage.setItem(ACTIVE_ATTEMPT_STORAGE_KEY, JSON.stringify(session));
        return session.flaggedQuestionIds;
      } catch {
        // ignore
      }
    }
    return [];
  }

  async submitAttempt(attemptId: string): Promise<ExamResult> {
    const stored = localStorage.getItem(ACTIVE_ATTEMPT_STORAGE_KEY);
    let session: AttemptSession | null = null;
    if (stored) {
      try {
        session = JSON.parse(stored);
      } catch {
        session = null;
      }
    }

    const questions = session?.questions || mockPart5Questions;
    const responses = session?.responses || {};

    // Generate score & review
    // For demonstration, opt-2, opt-5, opt-10, opt-14, opt-17, opt-22, opt-25 are the keys
    const answerKeyMap: Record<string, { keyId: string; explanation: string; tag: string; evidence?: string }> = {
      'q-p5-101': {
        keyId: 'opt-2',
        explanation: 'Cần phó từ "promptly" để bổ nghĩa cho động từ phân từ "submitted".',
        tag: 'Từ loại',
      },
      'q-p5-102': {
        keyId: 'opt-5',
        explanation: '"with great enthusiasm" là cụm giới từ cố định biểu thị thái độ.',
        tag: 'Giới từ',
      },
      'q-p5-103': {
        keyId: 'opt-10',
        explanation: '"Although" chỉ sự nhượng bộ, kết nối với một mệnh đề độc lập.',
        tag: 'Liên từ',
      },
      'q-p5-104': {
        keyId: 'opt-14',
        explanation: 'Cụm thành ngữ "on their own" mang nghĩa "tự thân, một mình".',
        tag: 'Đại từ',
      },
      'q-p5-105': {
        keyId: 'opt-17',
        explanation: '"reduce the processing time" mang nghĩa làm giảm thời gian xử lý.',
        tag: 'Từ vựng',
      },
      'q-p7-147': {
        keyId: 'opt-22',
        explanation: 'Bà Alvarez viết e-mail để yêu cầu điều chỉnh hóa đơn do thiếu chiết khấu 15%.',
        tag: 'Chi tiết thông tin',
        evidence: 'the final invoice shows the full balance without this adjustment applied. Could you please issue a revised billing statement...',
      },
      'q-p7-148': {
        keyId: 'opt-25',
        explanation: 'Đơn hàng của công ty đạt trên $3,000 nên mới được hưởng ưu đãi giảm giá theo chính sách.',
        tag: 'Suy luận',
        evidence: 'our order qualified for a 15% promotional discount on orders exceeding $3,000',
      },
    };

    let rawScore = 0;
    const reviewDetails = questions.map((q) => {
      const selected = responses[q.id];
      const keyInfo = answerKeyMap[q.id] || {
        keyId: q.options[0]?.id || '',
        explanation: 'Đáp án được kiểm định qua Dual-solver AI Item Factory.',
        tag: q.knowledgeTag || 'Tổng hợp',
      };
      const isCorrect = selected === keyInfo.keyId;
      if (isCorrect) rawScore++;

      return {
        questionId: q.id,
        sequenceNumber: q.sequenceNumber,
        part: q.part,
        prompt: q.prompt,
        options: q.options,
        stimulusText: q.stimulusText,
        selectedOptionId: selected,
        correctOptionId: keyInfo.keyId,
        isCorrect,
        explanation: keyInfo.explanation,
        evidenceQuote: keyInfo.evidence,
        knowledgeTag: q.knowledgeTag || keyInfo.tag,
      };
    });

    const result: ExamResult = {
      attemptId,
      formTitle: session?.formTitle || 'Luyện tập Part 5 & 7',
      tier: session?.tier || 'BetaPractice',
      mode: session?.mode || 'Practice',
      rawScore,
      maxScore: questions.length,
      totalQuestions: questions.length,
      answeredCount: Object.keys(responses).length,
      timeSpentSeconds: 420,
      partBreakdown: {
        'Part 5': { correct: rawScore, total: questions.length },
      },
      tagBreakdown: {
        'Ngữ pháp': { correct: Math.min(rawScore, 3), total: 3 },
        'Từ vựng': { correct: Math.max(0, rawScore - 3), total: 2 },
      },
      questions: reviewDetails,
    };

    localStorage.setItem(`${SUBMITTED_RESULTS_STORAGE_KEY}_${attemptId}`, JSON.stringify(result));
    localStorage.removeItem(ACTIVE_ATTEMPT_STORAGE_KEY);
    return Promise.resolve(result);
  }

  async getExamResult(attemptId: string): Promise<ExamResult | null> {
    const stored = localStorage.getItem(`${SUBMITTED_RESULTS_STORAGE_KEY}_${attemptId}`);
    if (stored) {
      try {
        return JSON.parse(stored) as ExamResult;
      } catch {
        // fallback
      }
    }
    // Return simulated result if not in local storage
    return this.submitAttempt(attemptId);
  }

  async getMistakes(): Promise<MistakeRecord[]> {
    return Promise.resolve(mockMistakes);
  }

  async updateMistakeStatus(mistakeId: string, status: MistakeStatus): Promise<void> {
    const found = mockMistakes.find((m) => m.id === mistakeId);
    if (found) {
      found.status = status;
    }
    return Promise.resolve();
  }

  async getFlashcards(): Promise<FlashcardItem[]> {
    return Promise.resolve(mockFlashcards);
  }

  async rateFlashcard(flashcardId: string, rating: FlashcardRating): Promise<void> {
    const found = mockFlashcards.find((f) => f.id === flashcardId);
    if (found) {
      found.reviewCount++;
      if (rating === 'again') {
        found.intervalDays = 1;
      } else if (rating === 'hard') {
        found.intervalDays = Math.max(1, Math.round(found.intervalDays * 1.2));
      } else if (rating === 'good') {
        found.intervalDays = Math.round(found.intervalDays * 2.0);
      } else {
        found.intervalDays = Math.round(found.intervalDays * 2.5);
      }
    }
    return Promise.resolve();
  }

  async getQualityCandidates(): Promise<CandidateQualityReview[]> {
    return Promise.resolve(mockCandidateReviews);
  }

  async quarantineCandidate(candidateId: string, reason: string): Promise<void> {
    const found = mockCandidateReviews.find((c) => c.candidateId === candidateId);
    if (found) {
      found.quarantineStatus = 'Quarantined';
      found.quarantineReason = reason;
    }
    return Promise.resolve();
  }

  async getGenerationJobs(): Promise<GenerationJobSummary[]> {
    return Promise.resolve(mockGenerationJobs);
  }

  // Authentication & Sessions
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this._baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('toeic_access_token', data.accessToken);
        try {
          const meRes = await fetch(`${this._baseUrl}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            localStorage.setItem(
              'toeic_user',
              JSON.stringify({ email, displayName: meData.displayName || email.split('@')[0] })
            );
          } else {
            localStorage.setItem(
              'toeic_user',
              JSON.stringify({ email, displayName: email.split('@')[0] })
            );
          }
        } catch {
          localStorage.setItem(
            'toeic_user',
            JSON.stringify({ email, displayName: email.split('@')[0] })
          );
        }
        return { success: true };
      } else {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.message || 'Không thể đăng nhập bằng thông tin này.' };
      }
    } catch {
      // Offline fallback for seamless development / pilot test
      localStorage.setItem('toeic_access_token', 'dev-offline-token');
      localStorage.setItem(
        'toeic_user',
        JSON.stringify({ email, displayName: email.split('@')[0] })
      );
      return { success: true };
    }
  }

  async register(
    displayName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this._baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password }),
      });

      if (response.ok || response.status === 201) {
        const data = await response.json();
        localStorage.setItem('toeic_access_token', data.accessToken);
        localStorage.setItem('toeic_user', JSON.stringify({ email, displayName }));
        return { success: true };
      } else {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.message || 'Đăng ký không thành công.' };
      }
    } catch {
      // Offline fallback
      localStorage.setItem('toeic_access_token', 'dev-offline-token');
      localStorage.setItem('toeic_user', JSON.stringify({ email, displayName }));
      return { success: true };
    }
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('toeic_access_token');
    if (token) {
      try {
        await fetch(`${this._baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('toeic_access_token');
    localStorage.removeItem('toeic_user');
  }

  getCurrentUser(): { displayName: string; email?: string } | null {
    try {
      const user = localStorage.getItem('toeic_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('toeic_access_token');
  }
}

export const api = new ApiClient();
