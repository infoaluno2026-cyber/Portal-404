import type { BattleRules } from './story';

export type BattleAction = 'attack' | 'defend' | 'special';
export type BattleResult = 'victory' | 'defeat' | undefined;

export interface BattleTurnResult {
  message: string;
  opponentDamage: number;
  playerDamage: number;
  animation: BattleAction | 'hit';
  result: BattleResult;
}

export class BattleController {
  playerHealth: number;
  opponentHealth: number;
  specialUsesRemaining: number;
  busy = false;
  animation: BattleAction | 'hit' | undefined;
  private readonly rules: BattleRules;

  constructor(rules: BattleRules) {
    this.rules = rules;
    this.playerHealth = rules.playerHealth;
    this.opponentHealth = rules.opponentHealth;
    this.specialUsesRemaining = rules.special?.uses ?? 0;
  }

  get specialAvailable(): boolean {
    return this.rules.special !== null && this.specialUsesRemaining > 0;
  }

  get specialName(): string {
    return this.rules.special?.name ?? 'HABILIDADE ESPECIAL';
  }

  reset(): void {
    this.playerHealth = this.rules.playerHealth;
    this.opponentHealth = this.rules.opponentHealth;
    this.specialUsesRemaining = this.rules.special?.uses ?? 0;
    this.busy = false;
    this.animation = undefined;
  }

  attack(): BattleTurnResult | undefined {
    if (this.busy || this.opponentHealth <= 0 || this.playerHealth <= 0) return undefined;
    this.busy = true;
    this.animation = 'attack';
    this.opponentHealth = Math.max(0, this.opponentHealth - this.rules.attackDamage);

    if (this.opponentHealth === 0) {
      return {
        message: 'O oponente foi derrotado.',
        opponentDamage: this.rules.attackDamage,
        playerDamage: 0,
        animation: 'attack',
        result: 'victory',
      };
    }

    return undefined;
  }

  resolveOpponentTurn(action: 'attack' | 'defend'): BattleTurnResult {
    const reduction = action === 'defend' ? this.rules.guardReduction : 0;
    const damage = Math.max(0, Math.ceil(this.rules.opponentDamage * (1 - reduction)));
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.busy = false;
    this.animation = damage > 0 ? 'hit' : 'defend';
    return {
      message: damage > 0 ? `Dano recebido: ${damage}.` : 'Defesa realizada.',
      opponentDamage: 0,
      playerDamage: damage,
      animation: this.animation,
      result: this.playerHealth === 0 ? 'defeat' : undefined,
    };
  }

  defend(): BattleTurnResult | undefined {
    if (this.busy || this.opponentHealth <= 0 || this.playerHealth <= 0) return undefined;
    this.busy = true;
    this.animation = 'defend';
    return undefined;
  }

  useSpecial(): BattleTurnResult | undefined {
    if (!this.rules.special || !this.specialAvailable || this.busy) return undefined;
    this.busy = true;
    this.animation = 'special';
    this.specialUsesRemaining -= 1;
    const damage = this.rules.special.damage;
    this.opponentHealth = Math.max(0, this.opponentHealth - damage);
    return {
      message: `${this.rules.special.name} utilizada.`,
      opponentDamage: damage,
      playerDamage: 0,
      animation: 'special',
      result: this.opponentHealth === 0 ? 'victory' : undefined,
    };
  }
}
