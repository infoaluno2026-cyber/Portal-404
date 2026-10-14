export type StoryTrigger =
  | { type: 'distance'; meters: number }
  | { type: 'event'; eventId: string };

export interface DialogueLine {
  speakerId: string;
  text: string;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  role: 'hero' | 'villain' | 'companion';
  health: number;
  portrait?: string;
  animations: Partial<Record<CharacterAnimationState, SpriteAnimation>>;
}

export type CharacterAnimationState = 'idle' | 'run' | 'jump' | 'slide' | 'attack' | 'defend' | 'hit' | 'special';

export interface SpriteAnimation {
  file: string;
  frames: number;
  framesPerSecond: number;
  flip?: boolean;
}

export interface BattleRules {
  playerHealth: number;
  opponentHealth: number;
  attackDamage: number;
  opponentDamage: number;
  guardReduction: number;
  special: {
    name: string;
    description: string;
    damage: number;
    uses: number;
  } | null;
}

export interface EncounterDefinition {
  id: string;
  trigger: StoryTrigger;
  heroId: string;
  companionId?: string;
  opponentId: string;
  arena?: string;
  dialogue: DialogueLine[];
  postBattleDialogue?: DialogueLine[];
  battle: BattleRules;
  afterVictory: 'continue' | 'ending';
}

export const characters: Record<string, CharacterDefinition> = {
  lira: {
    id: 'lira',
    name: 'Lira',
    role: 'hero',
    health: 100,
    portrait: 'characters/lira.png',
    animations: {
      idle: { file: 'characters/lira.png', frames: 1, framesPerSecond: 1 },
      run: { file: 'characters/lira.png', frames: 1, framesPerSecond: 1 },
    },
  },
  virus: {
    id: 'virus',
    name: 'Vírus',
    role: 'villain',
    health: 100,
    portrait: 'characters/virus-walk.png',
    animations: {
      idle: { file: 'characters/virus-walk.png', frames: 7, framesPerSecond: 7 },
    },
  },
  pet: {
    id: 'pet',
    name: 'Pet da Lira',
    role: 'companion',
    health: 100,
    animations: {
      run: { file: 'characters/pet-walk.png', frames: 8, framesPerSecond: 8 },
      idle: { file: 'characters/pet-walk.png', frames: 8, framesPerSecond: 8 },
    },
  },
};

export const encounters: EncounterDefinition[] = [
  {
    id: 'encounter-01',
    trigger: { type: 'distance', meters: 350 },
    heroId: 'lira',
    companionId: 'pet',
    opponentId: 'virus',
    arena: 'backgrounds/arena.png',
    dialogue: [],
    battle: {
      playerHealth: 100,
      opponentHealth: 100,
      attackDamage: 20,
      opponentDamage: 16,
      guardReduction: 0.85,
      special: null,
    },
    afterVictory: 'continue',
  },
];

export const runnerSettings = {
  metersPerSecond: 19,
  baseObstacleInterval: 1.3,
  minimumObstacleInterval: 0.62,
  speedGainPer1000Meters: 0.035,
  maximumSpeedMultiplier: 1.45,
};

export class StoryProgress {
  private encounterIndex = 0;

  get currentEncounter(): EncounterDefinition | undefined {
    return encounters[this.encounterIndex];
  }

  get nextDistance(): number | undefined {
    const trigger = this.currentEncounter?.trigger;
    return trigger?.type === 'distance' ? trigger.meters : undefined;
  }

  checkDistance(distance: number): EncounterDefinition | undefined {
    const encounter = this.currentEncounter;
    if (encounter?.trigger.type === 'distance' && distance >= encounter.trigger.meters) return encounter;
    return undefined;
  }

  checkEvent(eventId: string): EncounterDefinition | undefined {
    const encounter = this.currentEncounter;
    if (encounter?.trigger.type === 'event' && encounter.trigger.eventId === eventId) return encounter;
    return undefined;
  }

  completeEncounter(): EncounterDefinition['afterVictory'] | undefined {
    const completed = this.currentEncounter;
    if (!completed) return undefined;
    this.encounterIndex += 1;
    return completed.afterVictory;
  }

  reset(): void {
    this.encounterIndex = 0;
  }
}
