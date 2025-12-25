export interface DictionaryEntry {
  id: string;
  akha: string;
  akhaPronunciation: string;
  thai: string;
  english: string;
  category: string;
  tags: string[];
  exampleSentence?: {
    akha: string;
    thai: string;
    english: string;
  };
}

export enum TabView {
  SEARCH = 'SEARCH',
  BOOKMARKS = 'BOOKMARKS',
  ROADMAP = 'ROADMAP'
}

export interface AppSettings {
  fontFamily: 'Sarabun' | 'Inter' | 'sans-serif';
  sizeScale: 'small' | 'medium' | 'large';
  themeColor: 'red' | 'blue' | 'green' | 'slate';
}

export interface RoadmapStep {
  phase: string;
  title: string;
  description: string;
  details: string[];
  status: 'completed' | 'current' | 'future';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}