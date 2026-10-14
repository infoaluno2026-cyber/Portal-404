import './style.css';
import { BattleController, type BattleAction, type BattleResult } from './battle';
import { assets } from './assets';
import { DialogueView } from './dialogue';
import { GameRenderer } from './renderer';
import { RunnerSimulation } from './runner';
import { characters, encounters, StoryProgress, type EncounterDefinition } from './story';

type Phase = 'title' | 'run' | 'dialogue' | 'duel' | 'result' | 'gameover' | 'ending';
const element = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Elemento ausente: ${id}`);
  return found as T;
};

const canvas = element<HTMLCanvasElement>('gameCanvas');
const context = canvas.getContext('2d');
if (!context) throw new Error('Canvas 2D indisponível neste navegador.');

const overlay = element<HTMLDivElement>('overlay');
const primaryButton = element<HTMLButtonElement>('primaryButton');
const runnerControls = element<HTMLDivElement>('runnerControls');
const duelControls = element<HTMLDivElement>('duelControls');
const specialButton = element<HTMLButtonElement>('specialButton');
const duelLog = element<HTMLDivElement>('duelLog');
const statusMessage = element<HTMLSpanElement>('statusMessage');
const runner = new RunnerSimulation();
const story = new StoryProgress();
const dialogue = new DialogueView();
const renderer = new GameRenderer(context);

let phase: Phase = 'title';
let currentEncounter: EncounterDefinition | undefined;
let battle: BattleController | undefined;
let lastFrame = 0;
let elapsed = 0;

function setStatus(message: string): void {
  statusMessage.textContent = message.toUpperCase();
}

function setOverlay(eyebrow: string, title: string, copy: string, button: string, hint: string): void {
  element<HTMLElement>('overlayEyebrow').textContent = eyebrow;
  element<HTMLElement>('overlayTitle').textContent = title;
  element<HTMLElement>('overlayCopy').textContent = copy;
  primaryButton.querySelector('span')!.textContent = button;
  element<HTMLElement>('overlayHint').textContent = hint;
  overlay.classList.remove('is-hidden');
}

function setPortrait(selector: string, characterId: string | undefined): void {
  const portrait = document.querySelector<HTMLElement>(selector);
  const character = characterId ? characters[characterId] : undefined;
  const image = character?.portrait ? assets.url(character.portrait) : undefined;
  portrait?.classList.toggle('has-image', Boolean(image));
  if (portrait) portrait.style.backgroundImage = image ? `url("${image}")` : '';
  const fallback = portrait?.querySelector('span');
  if (fallback) fallback.textContent = character?.name.slice(0, 1).toUpperCase() ?? '?';
}

function updateHud(): void {
  element<HTMLElement>('distanceValue').textContent = Math.floor(runner.distance).toString().padStart(3, '0');
  const nextDistance = story.nextDistance;
  element<HTMLElement>('targetDistance').textContent = nextDistance === undefined ? 'EVENTO' : `${Math.floor(nextDistance)} M`;
  element<HTMLElement>('distanceBar').style.width = nextDistance === undefined
    ? '0%'
    : `${Math.min(100, (runner.distance / nextDistance) * 100)}%`;

  const hearts = element<HTMLElement>('runnerHearts');
  hearts.textContent = `${'♥ '.repeat(runner.lives)}${'♡ '.repeat(runner.maximumLives - runner.lives)}`.trim();
  hearts.setAttribute('aria-label', `${runner.lives} de ${runner.maximumLives} vidas`);

  const hero = currentEncounter ? characters[currentEncounter.heroId] : characters.lira;
  const opponent = currentEncounter ? characters[currentEncounter.opponentId] : characters.virus;
  const opponentName = opponent?.name ?? currentEncounter?.opponentId ?? 'OPONENTE';
  element<HTMLElement>('liraName').textContent = hero?.name.toUpperCase() ?? 'HERÓI';
  element<HTMLElement>('virusName').textContent = opponentName.toUpperCase();
  element<HTMLElement>('liraHealthBar').style.width = `${battle
    ? (battle.playerHealth / currentEncounter!.battle.playerHealth) * 100
    : (runner.lives / runner.maximumLives) * 100}%`;
  element<HTMLElement>('virusHealthBar').style.width = `${battle
    ? (battle.opponentHealth / currentEncounter!.battle.opponentHealth) * 100
    : 100}%`;
  element<HTMLElement>('virusCaption').textContent = battle
    ? `${Math.ceil((battle.opponentHealth / currentEncounter!.battle.opponentHealth) * 100)}% INTEGRIDADE`
    : currentEncounter ? 'ENCONTRO PENDENTE' : 'HISTÓRIA A CONFIGURAR';

  const special = currentEncounter?.battle.special;
  specialButton.disabled = !battle || !special || !battle.specialAvailable || battle.busy || phase !== 'duel';
  specialButton.querySelector('b')!.textContent = special?.name.toUpperCase() ?? 'HABILIDADE PENDENTE';
  specialButton.querySelector('small')!.textContent = special && battle
    ? `${special.description} · ${battle.specialUsesRemaining}/${special.uses} usos`
    : special?.description ?? 'Aguardando história';

  setPortrait('.portrait-lira', hero?.id);
  setPortrait('.portrait-virus', opponent?.id);
}

function setPhase(next: Phase): void {
  phase = next;
  const labels: Record<Phase, string> = {
    title: 'SIMULAÇÃO PRONTA',
    run: 'CORRIDA EM ANDAMENTO',
    dialogue: 'ENCONTRO NARRATIVO',
    duel: 'DUELO EM ANDAMENTO',
    result: 'RESULTADO DA BATALHA',
    gameover: 'FIM DE JOGO',
    ending: 'CAPÍTULO CONCLUÍDO',
  };
  element<HTMLSpanElement>('phaseLabel').textContent = labels[next];
  element<HTMLDivElement>('phaseChip').classList.toggle('is-duel', next === 'duel' || next === 'result');
  runnerControls.hidden = next !== 'run';
  duelControls.hidden = next !== 'duel';
  const battleScene = next === 'duel' || next === 'result'
    || ((next === 'gameover' || next === 'dialogue') && Boolean(battle));
  overlay.classList.toggle('is-hidden', next === 'run' || next === 'duel');
  element<HTMLDivElement>('gameHud').classList.toggle('duel-mode', battleScene);
  duelLog.classList.toggle('is-visible', battleScene);
  updateHud();
}

function startFreshRun(): void {
  story.reset();
  runner.reset();
  currentEncounter = undefined;
  battle = undefined;
  duelLog.textContent = '';
  setStatus('Corrida iniciada');
  setPhase('run');
}

function beginEncounter(encounter: EncounterDefinition): void {
  currentEncounter = encounter;
  battle = undefined;
  setPhase('dialogue');
  setStatus('Encontro iniciado');
  dialogue.open(encounter.dialogue, startBattle);
}

function startBattle(): void {
  if (!currentEncounter) return;
  battle = new BattleController(currentEncounter.battle);
  duelLog.textContent = 'Duelo iniciado. Escolha uma ação.';
  setPhase('duel');
  setStatus('Duelo iniciado');
}

function finishBattle(result: Exclude<BattleResult, undefined>): void {
  if (result === 'defeat') {
    setPhase('gameover');
    setOverlay('RESULTADO DO DUELO', 'Batalha perdida', 'A partida terminou em derrota. Reinicie para tentar novamente.', 'TENTAR NOVAMENTE', 'ENTER OU CLIQUE PARA RECOMEÇAR');
    setStatus('Derrota');
    return;
  }

  setPhase('result');
  const afterVictory = currentEncounter?.afterVictory;
  setOverlay(
    'RESULTADO DO DUELO',
    'Batalha vencida',
    'O encontro foi concluído. A próxima etapa depende da configuração da história.',
    afterVictory === 'ending' ? 'CONCLUIR CAPÍTULO' : 'CONTINUAR CORRIDA',
    'RESULTADO CONFIGURADO NOS DADOS DO ENCONTRO',
  );
  setStatus('Vitória');
}

function continueAfterVictory(): void {
  const afterVictory = story.completeEncounter();
  currentEncounter = undefined;
  battle = undefined;
  if (afterVictory === 'ending') {
    setPhase('ending');
    setOverlay('RESULTADO DO CAPÍTULO', 'Capítulo concluído', 'O próximo destino será definido pela história.', 'VOLTAR AO INÍCIO', 'A HISTÓRIA AINDA SERÁ ADICIONADA');
    return;
  }
  runner.obstacles.length = 0;
  setStatus('Corrida retomada');
  setPhase('run');
}

function performBattleAction(action: BattleAction): void {
  if (phase !== 'duel' || !battle || !currentEncounter || battle.busy) return;
  if (action === 'special' && !battle.specialAvailable) return;

  const opponentHealthBefore = battle.opponentHealth;
  let result: ReturnType<BattleController['attack']>;
  if (action === 'attack') result = battle.attack();
  else if (action === 'defend') result = battle.defend();
  else result = battle.useSpecial();
  if (battle.animation === undefined) return;

  const damage = opponentHealthBefore - battle.opponentHealth;
  const actionName = action === 'attack' ? 'Ataque' : action === 'defend' ? 'Defesa' : currentEncounter.battle.special?.name ?? 'Habilidade';
  duelLog.textContent = `${actionName}: ${damage} de dano.`;
  updateHud();

  window.setTimeout(() => {
    if (phase !== 'duel' || !battle) return;
    if (result?.result === 'victory') {
      finishBattle('victory');
      return;
    }

    const response = battle.resolveOpponentTurn(action === 'defend' ? 'defend' : 'attack');
    duelLog.textContent = response.message;
    updateHud();
    if (response.result) finishBattle(response.result);
    else window.setTimeout(() => {
      if (battle?.animation === 'hit') battle.animation = undefined;
    }, 220);
  }, 360);
}

function advancePrimary(): void {
  if (phase === 'dialogue') {
    dialogue.advance();
    return;
  }
  if (phase === 'title' || phase === 'gameover') {
    startFreshRun();
    return;
  }
  if (phase === 'result') {
    const postBattleLines = currentEncounter?.postBattleDialogue ?? [];
    if (postBattleLines.length > 0) {
      setPhase('dialogue');
      dialogue.open(postBattleLines, continueAfterVictory);
      return;
    }
    continueAfterVictory();
    return;
  }
  if (phase === 'ending') {
    setPhase('title');
    setOverlay('PORTAL 404', 'Pronto para começar?', 'A história deste capítulo ainda será adicionada.', 'INICIAR CORRIDA', 'SETAS OU A / D PARA MOVER · W PULA · S DESLIZA');
  }
}

function handleRunner(delta: number): void {
  const tick = runner.update(delta);
  if (tick.collision) setStatus('Colisão: vida perdida');
  if (tick.gameOver) {
    setPhase('gameover');
    setOverlay('CORRIDA INTERROMPIDA', 'Fim de jogo', 'A Lira perdeu todas as vidas. Reinicie a corrida para tentar novamente.', 'TENTAR NOVAMENTE', 'ENTER OU CLIQUE PARA RECOMEÇAR');
    return;
  }
  const encounter = story.checkDistance(runner.distance);
  if (encounter) beginEncounter(encounter);
  updateHud();
}

function resizeCanvas(): void {
  const bounds = canvas.getBoundingClientRect();
  const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(bounds.width * scale);
  canvas.height = Math.round(bounds.height * scale);
  context!.setTransform(canvas.width / 960, 0, 0, canvas.height / 540, 0, 0);
  context!.imageSmoothingEnabled = false;
}

function frame(timestamp: number): void {
  const delta = lastFrame === 0 ? 0 : Math.min((timestamp - lastFrame) / 1000, 0.05);
  lastFrame = timestamp;
  elapsed = timestamp / 1000;
  if (phase === 'run') handleRunner(delta);
  const renderPhase = phase === 'ending' || (phase !== 'run' && phase !== 'title' && battle) ? 'result' : phase;
  renderer.draw(renderPhase, runner, battle, elapsed, currentEncounter);
  window.requestAnimationFrame(frame);
}

primaryButton.addEventListener('click', advancePrimary);
element<HTMLButtonElement>('restartButton').addEventListener('click', () => {
  story.reset();
  runner.reset();
  currentEncounter = undefined;
  battle = undefined;
  setPhase('title');
  setOverlay('PORTAL 404', 'Simulação pronta', 'Inicie a corrida quando estiver pronto.', 'INICIAR CORRIDA', 'SETAS OU A / D PARA MOVER · W PULA · S DESLIZA');
  setStatus('Simulação reiniciada');
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action]')) {
  button.addEventListener('click', () => {
    if (phase !== 'run') return;
    const action = button.dataset.action;
    if (action === 'left') runner.moveLane(-1);
    else if (action === 'right') runner.moveLane(1);
    else if (action === 'jump') runner.jump();
    else if (action === 'slide') runner.slide();
  });
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-duel]')) {
  button.addEventListener('click', () => {
    const action = button.dataset.duel as BattleAction | undefined;
    if (action) performBattleAction(action);
  });
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
  if (phase === 'dialogue' && (event.key === 'Enter' || event.key === ' ')) {
    dialogue.advance();
    return;
  }
  if (phase === 'duel') {
    if (event.key === '1') performBattleAction('attack');
    if (event.key === '2') performBattleAction('defend');
    if (event.key === '3') performBattleAction('special');
    return;
  }
  if (phase !== 'run') return;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') runner.moveLane(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') runner.moveLane(1);
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') runner.jump();
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') runner.slide();
});

window.addEventListener('portal404:story-event', (event) => {
  const customEvent = event as CustomEvent<{ eventId?: string }>;
  const eventId = customEvent.detail?.eventId;
  const encounter = eventId ? story.checkEvent(eventId) : undefined;
  if (phase === 'run' && encounter) beginEncounter(encounter);
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
setPhase('title');
setOverlay('PORTAL 404', 'A cidade está fora do ar.', 'Corra pelas pistas, desvie dos bloqueios e alcance o próximo encontro.', 'INICIAR CORRIDA', 'SETAS OU A / D PARA MOVER · W PULA · S DESLIZA');
window.requestAnimationFrame(frame);

if (encounters.length === 0) console.info('Nenhum encontro narrativo foi configurado.');