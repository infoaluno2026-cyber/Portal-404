import { characters, type DialogueLine } from './story';

const element = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Elemento ausente: ${id}`);
  return found as T;
};

export class DialogueView {
  private lines: DialogueLine[] = [];
  private index = 0;
  private onComplete: (() => void) | undefined;

  open(lines: DialogueLine[], onComplete: () => void): void {
    this.lines = lines;
    this.index = 0;
    this.onComplete = onComplete;
    this.render();
  }

  advance(): void {
    if (!this.onComplete) return;
    if (this.index + 1 < this.lines.length) {
      this.index += 1;
      this.render();
      return;
    }
    const complete = this.onComplete;
    this.onComplete = undefined;
    complete();
  }

  private render(): void {
    const line = this.lines[this.index];
    const speaker = line ? characters[line.speakerId]?.name ?? line.speakerId : 'DIÁLOGO PENDENTE';
    element<HTMLElement>('overlayEyebrow').textContent = speaker;
    element<HTMLElement>('overlayTitle').textContent = line ? `Encontro ${this.index + 1}` : 'História ainda não cadastrada';
    element<HTMLElement>('overlayCopy').textContent = line?.text || 'As falas deste encontro serão adicionadas com a história.';
    element<HTMLElement>('primaryButton').querySelector('span')!.textContent = this.lines.length > this.index + 1
      ? 'CONTINUAR'
      : 'SEGUIR PARA O DUELO';
    element<HTMLElement>('overlayHint').textContent = 'ENTER OU CLIQUE PARA AVANÇAR';
  }
}
