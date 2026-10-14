import { runnerSettings } from './story';

export type ObstacleKind = 'barrier' | 'drone' | 'gap';
export interface Obstacle {
  lane: number;
  progress: number;
  kind: ObstacleKind;
}

export interface RunnerTick {
  collision: boolean;
  gameOver: boolean;
}

export class RunnerSimulation {
  distance = 0;
  lane = 1;
  lives = 3;
  readonly maximumLives = 3;
  readonly obstacles: Obstacle[] = [];
  jumpTimer = 0;
  slideTimer = 0;
  flashTimer = 0;
  shakeTimer = 0;
  speedMultiplier = 1;
  private spawnTimer = 0.65;

  reset(): void {
    this.distance = 0;
    this.lane = 1;
    this.lives = this.maximumLives;
    this.obstacles.length = 0;
    this.jumpTimer = 0;
    this.slideTimer = 0;
    this.flashTimer = 0;
    this.shakeTimer = 0;
    this.speedMultiplier = 1;
    this.spawnTimer = 0.65;
  }

  moveLane(direction: number): void {
    this.lane = Math.max(0, Math.min(2, this.lane + direction));
  }

  jump(): void {
    if (this.slideTimer <= 0) this.jumpTimer = 0.58;
  }

  slide(): void {
    if (this.jumpTimer <= 0) this.slideTimer = 0.52;
  }

  update(delta: number): RunnerTick {
    this.speedMultiplier = Math.min(
      runnerSettings.maximumSpeedMultiplier,
      1 + (this.distance / 1000) * runnerSettings.speedGainPer1000Meters,
    );
    this.distance += delta * runnerSettings.metersPerSecond * this.speedMultiplier;
    this.spawnTimer -= delta;
    this.jumpTimer = Math.max(0, this.jumpTimer - delta);
    this.slideTimer = Math.max(0, this.slideTimer - delta);
    this.flashTimer = Math.max(0, this.flashTimer - delta);
    this.shakeTimer = Math.max(0, this.shakeTimer - delta);

    if (this.spawnTimer <= 0) {
      const kinds: ObstacleKind[] = ['barrier', 'drone', 'gap'];
      this.obstacles.push({
        lane: Math.floor(Math.random() * 3),
        progress: 0,
        kind: kinds[Math.floor(Math.random() * kinds.length)],
      });
      const difficulty = Math.min(1, this.distance / 5000);
      const interval = runnerSettings.baseObstacleInterval
        - difficulty * (runnerSettings.baseObstacleInterval - runnerSettings.minimumObstacleInterval);
      this.spawnTimer = interval + Math.random() * 0.35;
    }

    for (const obstacle of this.obstacles) {
      obstacle.progress += delta * (0.27 + Math.min(this.distance / 7000, 0.09)) * this.speedMultiplier;
    }

    const approaching = this.obstacles.find((obstacle) =>
      obstacle.progress >= 0.83 && obstacle.progress <= 0.94 && obstacle.lane === this.lane,
    );
    let collision = false;
    if (approaching) {
      const avoided = approaching.kind === 'drone' ? this.slideTimer > 0 : this.jumpTimer > 0;
      this.obstacles.splice(this.obstacles.indexOf(approaching), 1);
      if (!avoided) {
        collision = true;
        this.lives = Math.max(0, this.lives - 1);
        this.flashTimer = 0.32;
        this.shakeTimer = 0.18;
      }
    }

    for (let index = this.obstacles.length - 1; index >= 0; index -= 1) {
      if (this.obstacles[index].progress >= 1.06) this.obstacles.splice(index, 1);
    }

    return { collision, gameOver: this.lives === 0 };
  }
}
