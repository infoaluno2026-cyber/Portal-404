# Artes do jogo

Coloque os arquivos PNG nas subpastas abaixo. Caminhos transparentes funcionam normalmente.

- `title-screen.png`: imagem de abertura do jogo. O botão “Iniciar jogo” da arte fica clicável; Enter também inicia a corrida.
- `characters/lira.png`: sprite da Lira em pose estática. `characters/lira-run-back.png`: spritesheet da corrida de costas da Lira, com 12 quadros em 6 colunas e 2 linhas. `characters/lira-attack.png`: spritesheet horizontal de ataque da Lira, com 3 quadros. Para cada personagem, cadastre spritesheets em `animations` dentro de `src/story.ts`; estados suportados: `idle`, `run`, `jump`, `slide`, `attack`, `defend`, `hit` e `special`. Cada estado define `file`, `frames`, `framesPerSecond`, e opcionalmente `columns` (quadros por linha, padrão: todos em uma linha) e `flip`.
- `characters/virus.png`: sprite estático do Vírus. Para animá-lo, cadastre uma spritesheet em `animations` dentro de `src/story.ts`.
- `characters/pet-walk.png`: spritesheet horizontal do pet com 8 quadros de largura igual.
- `backgrounds/arena.png`: cenário do duelo. A imagem enviada já inclui HUD; o protótipo recorta aproximadamente 14% do topo para esconder barras e retratos estáticos e desenhar a interface dinâmica por cima.
- `backgrounds/`: crie mais imagens de cenário e aponte o caminho no encounter correspondente em `src/story.ts`.
- `effects/` e `audio/`: reservados para efeitos visuais e sons futuros.

As artes são opcionais no protótipo. Sem um arquivo, um placeholder identificado é desenhado no canvas. Mantenha a ordem dos quadros da esquerda para a direita. O caminho no código é relativo à pasta `public/assets/`.
