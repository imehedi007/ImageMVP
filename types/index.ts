export type RideEnvironment = string;

export type BehaviorChoice = string;
export type CompanionMode = "friend" | "solo";

export interface BasicInfo {
  name: string;
  dateOfBirth: string;
  ageRange: string;
  phone: string;
  vibe: string;
}

export interface RideFormData extends BasicInfo {
  bikeType: string;
  environment: RideEnvironment;
  favoriteColor: string;
  behavior: BehaviorChoice;
  photoDataUrl?: string;
  photoName?: string;
}

export interface DerivedRideProfile {
  personalityTraits: string[];
  emotionalTone: string;
  socialDynamic: string;
  sceneDirection: string;
}

export interface RidePromptBundle extends DerivedRideProfile {
  imagePrompt: string;
  storyPrompt: string;
  summarySeed: string;
  captionSeed: string;
}

export interface RideGenerationResponse {
  imageUrl: string;
  summary: string;
  caption: string;
  prompt: string;
  profile: DerivedRideProfile;
  providerError?: string | null;
}

export interface BikeOption {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface SelectOption {
  id: string;
  label: string;
  description: string;
  image?: string;
}

export interface EnvironmentOption extends SelectOption {
  sceneDirection: string;
}

export interface BehaviorOption extends SelectOption {
  traits: string[];
  emotionalTone: string;
  socialDynamicFriend: string;
  socialDynamicSolo: string;
}

export interface ExperienceContent {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
    viralityTitle: string;
    viralityDescription: string;
  };
  settings: {
    companionMode: CompanionMode;
    defaultAgeRange: string;
    defaultVibe: string;
    defaultFavoriteColor: string;
    helmetRequired: boolean;
    poseDirection: string;
    cameraFrame: string;
    poseVariants: string[];
    wardrobeDirection: string;
    realismDirection: string;
  };
  bikes: BikeOption[];
  environments: EnvironmentOption[];
  colors: string[];
  behaviorQuestion: {
    title: string;
    description: string;
    options: BehaviorOption[];
  };
}
