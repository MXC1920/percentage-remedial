export interface Character {
  name: string;
  item: string;
  quantity: number;
  sharePercentage?: string;
}

export interface ScreenContent {
  screenId: string;
  title: string;
  content?: string[];
  animationSteps?: string[];
  studentTask?: string | string[];
  results?: string[];
  question?: any; // MCQ or blanks
  hints?: string[];
}

export interface Story {
  storyId: string;
  storyTitle: string;
  storyType: string;
  status: string;
  characters: Character[];
  screens: ScreenContent[];
  takeaway: string;
}

export interface GameData {
  moduleId: string;
  moduleTitle: string;
  learningObjective: string;
  stories: Story[];
  progression: any;
}
