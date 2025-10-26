export type Role = 'teacher' | 'student';

export interface Classroom {
  code: string;
  teacherEmail: string;
}

export interface User {
  name: string;
  email: string;
  role: Role;
  classCode?: string;
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  topic: string;
  questions: Question[];
  classCode: string;
}

export interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
}

export interface Submission {
  quizId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  classCode: string;
}

export type SharedContentType = 'text' | 'file' | 'image';

export interface SharedContent {
  id: string;
  type: SharedContentType;
  title: string;
  description: string;
  content?: string;
  fileData?: string;
  fileName?: string;
  mimeType?: string;
  classCode: string;
}

export interface LectureSlide {
  title: string;
  points: string[];
}

export interface GeneratedLecture {
  id: string;
  topic: string;
  slides: LectureSlide[];
  classCode: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  introduction: string;
  problem: string;
  solution: string;
  conclusion: string;
  classCode: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface AttendanceRecord {
  studentName: string;
  timestamp: string;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  isActive: boolean;
  records: AttendanceRecord[];
  classCode: string;
}
