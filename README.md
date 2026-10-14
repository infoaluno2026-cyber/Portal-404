# Portal-404

Jogo 2D de corrida e duelos em Canvas, preparado para publicação estática no GitHub Pages. O projeto usa TypeScript, compilado para JavaScript pelo Vite.

## Executar

```sh
npm install
npm run dev
```

## Mecânicas atuais

- Corrida automática em três pistas, com troca de pista, pulo e deslize.
- Obstáculos causam colisões e consomem vidas; velocidade e frequência dos obstáculos aumentam gradualmente.
- Distância e encontros estão configurados em `src/story.ts`; encontros também podem ser disparados por evento narrativo.
- Diálogos, duelos, resultados, game over e continuação são estados separados.
- Ataque, defesa, vida, habilidade especial e usos são regras configuráveis por encontro.

O encontro a 350 m é apenas um valor inicial editável. Nenhuma fala nem poder especial foi definido; os diálogos começam vazios e a habilidade fica indisponível até ser configurada com a história.

## Organização

- `src/main.ts`: coordena os estados e eventos de entrada.
- `src/runner.ts`: movimento, obstáculos, colisões e dificuldade gradual.
- `src/dialogue.ts`: apresentação e avanço das falas.
- `src/battle.ts`: regras e estado do duelo.
- `src/story.ts`: personagens, imagens, encontros, diálogos e atributos.
- `src/assets.ts`: carrega imagens e quadros de spritesheets.
- `src/renderer.ts`: desenha as cenas no Canvas.

Em `src/story.ts`, cada encontro aceita `trigger` por distância ou evento, `heroId`, `companionId`, `opponentId`, `arena`, `dialogue`, `postBattleDialogue`, regras de `battle` e `afterVictory`. Para iniciar um encontro por evento, dispare `window.dispatchEvent(new CustomEvent('portal404:story-event', { detail: { eventId: 'nome-do-evento' } }))` quando o jogo estiver na corrida.

## Artes

Adicione os arquivos opcionais em `public/assets/`. Os nomes esperados e o formato das animações estão descritos em `public/assets/README.md`.

## GitHub Pages

O workflow em `.github/workflows/deploy.yml` compila e publica o jogo ao enviar alterações para `main`. No GitHub, abra **Settings > Pages** e escolha **GitHub Actions** como origem de publicação. A base do Vite usa automaticamente o nome do repositório.
