import { assets } from './assets';
import {
  characters,
  type CharacterAnimationState,
  type CharacterDefinition,
  type EncounterDefinition,
} from './story';
import type { BattleController } from './battle';
import type { RunnerSimulation } from './runner';

type Scene = 'title' | 'run' | 'dialogue' | 'duel' | 'result' | 'gameover';

const WIDTH = 960;
const HEIGHT = 540;

export class GameRenderer {
  constructor(private readonly context: CanvasRenderingContext2D) {}

  draw(
    scene: Scene,
    runner: RunnerSimulation,
    battle: BattleController | undefined,
    time: number,
    encounter?: EncounterDefinition,
  ): void {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
    if (scene === 'duel' || scene === 'result') this.drawDuel(battle, time, encounter);
    else this.drawRunner(runner, time);
  }

  private drawRunner(runner: RunnerSimulation, time: number): void {
    const context = this.context;
    this.drawCity(time);
    context.save();
    context.beginPath();
    context.moveTo(355, 285);
    context.lineTo(605, 285);
    context.lineTo(885, HEIGHT);
    context.lineTo(75, HEIGHT);
    context.closePath();
    context.fillStyle = '#11102a';
    context.fill();
    for (let line = 0; line <= 3; line += 1) {
      const topX = 355 + line * (250 / 3);
      const bottomX = 75 + line * 270;
      context.strokeStyle = line === 0 || line === 3 ? 'rgba(47, 143, 255, .45)' : 'rgba(197, 106, 255, .25)';
      context.beginPath();
      context.moveTo(topX, 285);
      context.lineTo(bottomX, HEIGHT);
      context.stroke();
    }
    const offset = (time * 105) % 64;
    for (let row = 0; row < 7; row += 1) {
      const progress = ((row / 7) + offset / 448) % 1;
      const y = 285 + progress * 255;
      const half = 125 + progress * 280;
      context.strokeStyle = `rgba(133, 76, 255, ${0.12 + progress * 0.16})`;
      context.beginPath();
      context.moveTo(480 - half, y);
      context.lineTo(480 + half, y);
      context.stroke();
    }
    context.restore();

    for (const obstacle of runner.obstacles) this.drawObstacle(obstacle.lane, obstacle.progress, obstacle.kind);
    const shakeX = runner.shakeTimer > 0 ? Math.sin(time * 95) * runner.shakeTimer * 11 : 0;
    const playerX = 480 + (runner.lane - 1) * 190 + shakeX;
    const jumping = runner.jumpTimer > 0;
    const sliding = runner.slideTimer > 0;
    const playerY = jumping ? 430 - Math.sin((0.58 - runner.jumpTimer) / 0.58 * Math.PI) * 62 : 448;
    if (runner.flashTimer > 0) {
      context.fillStyle = `rgba(255, 42, 79, ${runner.flashTimer * 0.22})`;
      context.fillRect(0, 0, WIDTH, HEIGHT);
    }
    context.globalAlpha = sliding ? 0.62 : 1;
    const lira = characters.lira;
    const pet = characters.pet;
    const runnerState: CharacterAnimationState = jumping ? 'jump' : sliding ? 'slide' : 'run';
    if (!this.drawCharacter(lira, runnerState, time, playerX - 48, playerY - 150, 96, 150)) {
      this.drawPlaceholderHero(playerX, playerY, time);
    }
    if (!this.drawCharacter(pet, 'run', time, playerX + 53, playerY - 44, 43, 43)) {
      this.drawPlaceholderPet(playerX + 75, playerY + 3);
    }
    context.globalAlpha = 1;
  }

  private drawCity(time: number, danger = false): void {
    const context = this.context;
    const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, danger ? '#100917' : '#0b0b27');
    sky.addColorStop(0.58, danger ? '#32102b' : '#241066');
    sky.addColorStop(1, '#090816');
    context.fillStyle = sky;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    for (let index = 0; index < 28; index += 1) {
      const x = index * 39 - 12;
      const height = 55 + ((index * 47 + 31) % 150);
      const width = 24 + ((index * 17) % 20);
      const y = 286 - height;
      context.fillStyle = index % 3 === 0 ? '#171746' : '#111333';
      context.fillRect(x, y, width, height);
      context.fillStyle = index % 4 === 0 ? '#f137d1' : '#3e9cff';
      for (let row = 0; row < Math.floor(height / 20); row += 1) {
        if (Math.sin(time * 2 + index * 4 + row) > -0.2) context.fillRect(x + 5, y + 8 + row * 20, 3, 6);
      }
    }
    context.fillStyle = danger ? 'rgba(255, 26, 62, .25)' : 'rgba(43, 119, 255, .23)';
    context.fillRect(0, 284, WIDTH, 3);
    context.fillStyle = '#080817';
    context.fillRect(0, 290, WIDTH, HEIGHT - 290);
  }

  private drawDuel(battle: BattleController | undefined, time: number, encounter?: EncounterDefinition): void {
    const context = this.context;
    const arenaImage = assets.image(encounter?.arena);
    if (arenaImage?.complete && arenaImage.naturalWidth > 0) {
      const hudHeight = arenaImage.naturalHeight * 0.14;
      context.drawImage(arenaImage, 0, hudHeight, arenaImage.naturalWidth, arenaImage.naturalHeight - hudHeight, 0, 0, WIDTH, HEIGHT);
    } else {
      this.drawCity(time, true);
      context.fillStyle = 'rgba(13, 8, 25, .32)';
      context.fillRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = '#171127';
      context.fillRect(0, 376, WIDTH, 164);
      context.strokeStyle = 'rgba(182, 41, 255, .7)';
      context.beginPath();
      context.moveTo(0, 382);
      context.lineTo(WIDTH, 382);
      context.stroke();
    }

    const hero = characters[encounter?.heroId ?? 'lira'] ?? characters.lira;
    const opponent = characters[encounter?.opponentId ?? 'virus'] ?? characters.virus;
    const companion = encounter?.companionId ? characters[encounter.companionId] : undefined;
    const movement = battle?.animation === 'attack' || battle?.animation === 'special' ? Math.sin(time * 32) * 18 : 0;
    const heroState = battle?.animation ?? 'idle';
    if (!this.drawCharacter(hero, heroState, time, 214 + movement, 222, 132, 205)) {
      this.drawPlaceholderHero(280 + movement, 432, time);
    }
    if (companion && !this.drawCharacter(companion, battle?.animation === 'special' ? 'special' : 'idle', time, 337, 356, 76, 76)) {
      this.drawPlaceholderPet(375, 432);
    }
    const opponentState: CharacterAnimationState = battle?.animation === 'attack' || battle?.animation === 'special' ? 'hit' : 'idle';
    if (!this.drawCharacter(opponent, opponentState, time, 626, 142, 212, 292, true)) {
      this.drawPlaceholderVirus(730, 424, time);
    }
    if (battle?.animation === 'hit') {
      context.fillStyle = `rgba(255, 38, 76, ${0.13 + Math.sin(time * 32) * 0.08})`;
      context.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  private drawCharacter(
    character: CharacterDefinition,
    state: CharacterAnimationState,
    time: number,
    x: number,
    y: number,
    width: number,
    height: number,
    flip = false,
  ): boolean {
    const animation = character.animations[state]
      ?? character.animations.idle
      ?? character.animations.run;
    if (!animation) return false;
    return assets.drawFrame(
      this.context,
      animation.file,
      animation.frames,
      Math.floor(time * animation.framesPerSecond),
      x,
      y,
      width,
      height,
      flip || Boolean(animation.flip),
    );
  }

  private drawObstacle(lane: number, progress: number, kind: string): void {
    const context = this.context;
    const y = 284 + progress * 255;
    const x = 480 + (lane - 1) * (42 + progress * 225);
    const scale = 0.35 + progress * 0.85;
    const color = kind === 'drone' ? '#ff3d72' : kind === 'gap' ? '#33ceff' : '#ffb23f';
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    context.shadowColor = color;
    context.shadowBlur = 20;
    if (kind === 'drone') {
      context.fillStyle = '#211d3c';
      context.fillRect(-29, -20, 58, 23);
      context.fillStyle = color;
      context.fillRect(-36, -11, 14, 4);
      context.fillRect(22, -11, 14, 4);
    } else if (kind === 'gap') {
      context.strokeStyle = color;
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(-38, 0);
      context.lineTo(-24, -20);
      context.lineTo(0, -25);
      context.lineTo(24, -20);
      context.lineTo(38, 0);
      context.stroke();
    } else {
      context.fillStyle = '#282035';
      context.fillRect(-26, -44, 52, 44);
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(-26, -44, 52, 44);
      context.fillStyle = color;
      context.fillRect(-5, -33, 10, 23);
    }
    context.restore();
  }

  private drawPlaceholderHero(x: number, y: number, time: number): void {
    const context = this.context;
    context.save();
    context.translate(x, y + Math.sin(time * 9) * 2);
    context.shadowColor = '#b321ff';
    context.shadowBlur = 18;
    context.fillStyle = '#171629';
    context.fillRect(-18, -76, 36, 49);
    context.fillStyle = '#312154';
    context.fillRect(-22, -91, 44, 36);
    context.fillStyle = '#1e1a32';
    context.fillRect(-17, -30, 14, 28);
    context.fillRect(4, -30, 14, 28);
    context.fillStyle = '#a84cff';
    context.fillRect(-12, -84, 25, 4);
    context.fillStyle = '#f6b9a7';
    context.fillRect(-10, -111, 20, 20);
    context.fillStyle = '#17111f';
    context.fillRect(-12, -116, 24, 9);
    context.fillRect(-15, -111, 7, 21);
    context.fillStyle = '#61ddff';
    context.fillRect(2, -102, 5, 2);
    context.restore();
  }

  private drawPlaceholderPet(x: number, y: number): void {
    const context = this.context;
    context.save();
    context.shadowColor = '#29dfff';
    context.shadowBlur = 14;
    context.fillStyle = '#cfd5e5';
    context.fillRect(x - 13, y - 34, 26, 25);
    context.fillRect(x - 17, y - 15, 34, 15);
    context.fillStyle = '#161827';
    context.fillRect(x - 7, y - 29, 14, 10);
    context.fillStyle = '#38e1ff';
    context.fillRect(x + 1, y - 27, 4, 6);
    context.restore();
  }

  private drawPlaceholderVirus(x: number, y: number, time: number): void {
    const context = this.context;
    context.save();
    context.translate(x, y + Math.sin(time * 3) * 3);
    context.scale(1.45, 1.45);
    context.shadowColor = '#ff1c4b';
    context.shadowBlur = 26;
    context.fillStyle = '#130f1b';
    context.beginPath();
    context.ellipse(0, -103, 46, 58, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#d71946';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-34, -147);
    context.lineTo(-44, -169);
    context.lineTo(-25, -154);
    context.moveTo(0, -159);
    context.lineTo(1, -181);
    context.lineTo(12, -157);
    context.moveTo(31, -148);
    context.lineTo(46, -170);
    context.lineTo(42, -143);
    context.stroke();
    context.fillStyle = '#ff234f';
    context.fillRect(-24, -113, 12, 6);
    context.fillRect(12, -113, 12, 6);
    context.fillStyle = '#251027';
    context.fillRect(-30, -49, 60, 66);
    context.fillStyle = '#1a101e';
    context.fillRect(-50, -39, 18, 57);
    context.fillRect(32, -39, 18, 57);
    context.fillRect(-23, 13, 16, 58);
    context.fillRect(7, 13, 16, 58);
    context.restore();
  }
}
