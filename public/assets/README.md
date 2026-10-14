# Artes do jogo

Coloque os arquivos PNG nas subpastas abaixo. Caminhos transparentes funcionam normalmente.

- `characters/lira.png`: sprite da Lira em pose estática. Para cada personagem, cadastre spritesheets em `animations` dentro de `src/story.ts`; estados suportados: `idle`, `run`, `jump`, `slide`, `attack`, `defend`, `hit` e `special`. Cada estado define `file`, `frames`, `framesPerSecond` e, opcionalmente, `flip`.
- `characters/virus-walk.png`: spritesheet horizontal do Vírus com 7 quadros de largura igual.
- `characters/pet-walk.png`: spritesheet horizontal do pet com 8 quadros de largura igual.
- `backgrounds/arena.png`: cenário do duelo. A imagem enviada já inclui HUD; o protótipo recorta aproximadamente 14% do topo para esconder barras e retratos estáticos e desenhar a interface dinâmica por cima.
- `backgrounds/`: crie mais imagens de cenário e aponte o caminho no encounter correspondente em `src/story.ts`.
- `effects/` e `audio/`: reservados para efeitos visuais e sons futuros.

As artes são opcionais no protótipo. Sem um arquivo, um placeholder identificado é desenhado no canvas. Mantenha a ordem dos quadros da esquerda para a direita. O caminho no código é relativo à pasta `public/assets/`.
