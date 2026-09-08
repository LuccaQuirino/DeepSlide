export type SectionContentType = 'paragraph' | 'bullets' | 'numbered' | 'callout' | 'terms';

export interface CardSection {
  id: string;
  title: string;
  type: SectionContentType;
  content: string; // Markdown supported
}

export interface SlideContent {
  id: string;
  slideNumber: number;
  title: string;
  shortDescription?: string;
  keyPoints: string[];
  notes?: string;
  detailedTopic?: string;
  fullExplanation: string;
  practicalExamples: string[];
  keyTerms?: { term: string; definition: string }[];
  sections?: CardSection[];
}

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number; // 0, 1, 2, 3
  explanation: string;
  reinforcementTip: string;
}

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  text: string;
  createdAt: string;
}

export interface SectionComment {
  id: string;
  section: 'slides' | 'explanation' | 'quiz';
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorEmail?: string;
  text: string;
  createdAt: string;
  reply?: CommentReply;
}

export interface CollaboratorInfo {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  addedAt: string;
  role: 'editor' | 'viewer';
}

export interface FolderData {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  updatedAt?: string;
  isPublic?: boolean;
  color?: string;
}

export interface PresentationData {
  id: string;
  title: string;
  subject: string;
  presenters: string[];
  icon?: string; // Identifier or emoji for custom logo/icon
  googleSlidesEmbedUrl?: string;
  folderId?: string;
  folderName?: string;
  slides: SlideContent[];
  quiz: QuizQuestion[];
  comments?: SectionComment[];
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  isPublic?: boolean;
  collaborators?: CollaboratorInfo[];
  collaboratorIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role?: string;
  favoriteIds?: string[];
  favoriteFolderIds?: string[];
  savedSharedIds?: string[];
}

export type ActiveTab = 'slides' | 'explanation' | 'quiz';
export type AppView = 'dashboard' | 'presentation';

export interface AppNotification {
  id: string;
  recipientId: string;
  presentationId: string;
  presentationTitle: string;
  section: 'slides' | 'explanation' | 'quiz';
  sectionLabel: string;
  commentId: string;
  commentText: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: string;
  read: boolean;
}

