# Downloads: assets externos (Kenney)

Seleção inicial de 8 ladrilhos reais extraídos diretamente dos arquivos enviados pelo usuário:

- **Kenney RPG Base**: `kenney_rpg-base.zip`, PNG/rpgTile003.png (grama), PNG/rpgTile008.png (terra), PNG/rpgTile013.png (água), PNG/rpgTile056.png (pedra).
- **Kenney Roguelike RPG Pack**: `kenney_roguelike-rpg-pack.zip`, Spritesheet/roguelikeSheet_transparent.png, índices (coluna,linha) (5,2), (6,2), (7,2), (0,6), considerando tiles 16×16 pixels e intervalo de 1 pixel.

Os ladrilhos foram organizados em uma mini-atlas PNG interno de 128×64 no arquivo `js/download-assets.js`, com a imagem incorporada como data URI para funcionar offline. Os materiais são separados da biblioteca original e têm prefixo `kenney_`.

**Licenças dos dois pacotes: Creative Commons Zero (CC0)**, conforme `license.txt` / `License.txt` presentes nos ZIPs. Atribuição opcional: Kenney, https://kenney.nl/.

Esta é uma seleção inicial, não a importação integral dos dois packs.

## Seleção 2: objetos RPG Base

Foram incorporadas mais doze miniaturas de sprites do pack `kenney_rpg-base.zip`:
`rpgTile155`, `rpgTile175`, `rpgTile197`, `rpgTile159`, `rpgTile189`, `rpgTile185`, `rpgTile163`, `rpgTile183`, `rpgTile161`, `rpgTile194`, `rpgTile217`, `rpgTile201` (arquivos PNG do pack).

Esses recursos foram reduzidos para 32×32 com amostragem nearest-neighbor e armazenados na mini-atlas local em `js/download-objects.js`, sob licença CC0.

**Nota de funcionamento:** porta, janela, arco e escada de mão desta coleção são, por enquanto, **elementos gráficos decorativos**, não substituem as portas/escadas/janelas funcionais de **Elementos de construção**. Os demais objetos sólidos bloqueiam o movimento. A biblioteca Downloads é independente da coleção arquitetônica selecionada.

## Seleção 3: objetos Roguelike RPG Pack

Oito sprites extraídos de `kenney_roguelike-rpg-pack.zip` → `Spritesheet/roguelikeSheet_transparent.png`, em células de 16×16 px separadas por margem de 1 px:

- Árvore (13,11), pinheiro (16,11), arbusto (13,9)
- Tocha (17,8), fogueira (14,8), pedra (9,17), flores (0,9), escadaria decorativa (15,20)

Coordenadas no formato (coluna, linha), zero-indexadas. Os sprites estão compactados numa mini-atlas local `js/download-roguelike-objects.js`. Escadaria decorativa não muda de andar. Licença CC0.
