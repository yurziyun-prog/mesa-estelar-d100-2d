const SITE_ZH = new Map(`
Mesa RPG 2D — Arquiteto, Mestre & Jogador|2D 跑团桌 · 建筑师、主持人和玩家
MESA RPG 2D|2D 跑团桌
Arquiteto|建筑师
Mestre|主持人
Jogador|玩家
Andar:|楼层
Térreo|一楼
Centralizar mapa|地图居中
Centralizar personagem|角色居中
Mover mapa|移动地图
Arraste para mover a câmera|拖动鼠标平移镜头
Cria outro mapa vazio e mantém o mapa atual.|另建一张空地图，保留当前地图。
Altera apenas o terreno base e suas dimensões. Construções, pinturas, objetos e personagens ficam onde estão.|仅调整基础地形及其尺寸。建筑、笔刷地形、物件和角色都留在原位。
Centralizar o mapa na área de jogo|将地图移到游戏区中央
Importar|导入
Nuvem|云存档
Banco na nuvem|云端场景库
Banco de Cenários|场景库
Nome do novo cenário...|新场景名称…
Criar|创建
Configurar novo cenário|设置新场景
Duplicar|复制
Trocar Cenário|切换场景
Colocar|放置
Personagens disponíveis (marque e clique em Colocar):|可用角色（勾选后点击放置）
Coleção de construção|建筑风格
Normal|普通
Retro-futurista|复古未来
Arábia|阿拉伯风格
Define a aparência dos próximos elementos. Misture livremente no mesmo mapa. O terreno não muda.|设置接下来放置的物件风格。同一地图可以混搭，地形保持原样。
Construção & Ajuste|建造与调整
Expandir Mapa|扩大地图
Cor da água|水面主色
Profundidade da água|水深
Água profunda|深水
Natação|游泳
Defina a perícia Natação na ficha para entrar em água profunda.|请先在人物卡上设置游泳技能，才能进入深水。
Travessia a nado bem-sucedida.|游泳检定成功。
Falha na travessia a nado.|游泳检定失败。
Velocidade da corrente|水流速度
Intensidade das ondas|波浪强度
Lago|湖泊
Editar mapa|修改地图
Nome do mapa|地图名称
Período do dia|时段
Edite o nome, o solo base ou as dimensões. O conteúdo do mapa fica no lugar.|可修改地图名称、基础地面和尺寸，地图内容留在原位。
Lareira de tijolos|砖砌壁炉
Fogão a lenha|铸铁柴炉
Editar chão do mapa|修改地图地面
Editar terreno base|修改当前地图地面
Terreno base|基础地形
Terreno|地形
Ponte coberta|廊桥
Trazer superfície para frente|表面移到最上层
Enviar superfície para trás|表面移到最下层
Largura (m)|宽度（米）
Comprimento (m)|长度（米）
Deserto|沙漠
Terreno rochoso|岩石地
Floresta|森林
Espaço sideral|外太空
Sem terreno|无地形
Aplicar|应用
Selecionar / Arrastar|选择／拖动
Alinhar|对齐
Apagar|擦除
Pincel|画笔
Parede selecionada:|已选墙段
Alinhar 90°|对齐到直角
Encaixar Vizinha|与相邻墙段连接
Biblioteca de construção|建造素材库
Terrenos|地形
Móveis|家具
Árvores e natureza|树木与自然
Elementos de construção|建筑构件
Personagens e NPCs|角色与 NPC
Decoração e objetos|装饰与物件
Objetos e decoração|物件与装饰
Packs baixados|素材包
Porta / Baú|门／宝箱
Ao colocar uma porta ou baú, você pode escolher tranca e destino da chave.|放置门或宝箱时，可以设置锁和钥匙的位置。
Loot:|战利品
Estatísticas da sessão|本局统计
Tab: selecionar · Enter: controlar · Esc: liberar · Del: retirar do cenário|Tab 选择 · Enter 接管 · Esc 释放 · Del 移出场景
Remover selecionado do cenário|将所选角色移出场景
Ambiente & Horário|环境与时间
Hora do mapa|地图时间
Tempo automático|时间自动推进
Amanhecer|黎明
Dia Claro|白天
Entardecer|黄昏
Noite (Lanternas)|夜晚（可用灯笼）
Balão de Fala|对话气泡
Fala do personagem selecionado...|输入所选角色的台词…
Dados|骰子
Registro da Sessão|本局记录
Personagem Ativo (Teste)|当前角色（测试）
Comandos|操作
WASD / Setas:|WASD／方向键
Caminhar|走路
Correr ·|奔跑 ·
Espaço:|空格键
Pular|跳跃
Arrastar tronco:|拖动原木
Aproximar-se e mover com o mouse|靠近后用鼠标拖动
E ou Clique próximo:|按 E 或点击附近的物件
Portas, baús, escadas|门、宝箱和楼梯
Botão Direito:|鼠标右键
Mover câmera|移动镜头
Scroll:|滚轮
Zoom|缩放
Selecione uma categoria.|请选择分类。
Pincel adaptado da Oficina de Mapas do Mesa Estelar.|使用画笔绘制地图地形。
Redondo|圆形
Quadrado|方形
Spray|喷绘
Irregular|不规则
Tamanho:|大小
Sólida|实心
Pontilhada|点状
Giz|粉笔
Ranhura|条纹
Grama|草地
Areia|沙地
Terra|泥土
Água|水域
Neve|雪地
Pedra|石材
Madeira|木材
Remover terreno|移除地形
Clique e arraste para pintar. Ctrl+Z desfaz a pincelada inteira.|点击并拖动绘制。Ctrl+Z 可撤销整笔绘制。
Ladrilho · acabamento e decoração|瓷砖 · 饰面与图案
Cerâmica|陶瓷
Mármore|大理石
Alvenaria|砌体
Metal|金属
Parquê de madeira|木质拼花
Decorado|装饰
Quadriculado|方格
Liso|纯色
Diagonal|斜纹
Losangos|菱形
Rosetas|花饰
Espinha de peixe|鱼骨纹
Tamanho do módulo:|单块尺寸
Paleta de cerâmica|陶瓷配色
Cor base|主色
Cor secundária|辅色
Bordas alinhadas a 32 unidades. Segure Shift durante o desenho para precisão livre.|边缘以 32 单位对齐。按住 Shift 可自由绘制。
屋顶结构 · Cobertura|屋顶结构
双坡屋顶 / Duas águas|双坡屋顶
四坡屋顶 / Quatro águas|四坡屋顶
平屋顶 / Plano|平屋顶
Opções de construção|建筑设置
Tijolo|砖
Pedras de castelo|城堡石材
Pedra de castelo|城堡石材
Metal enferrujado|锈蚀金属
Arenito|砂岩
Espessura:|厚度
Reta / normal|直梯
Espiral|螺旋楼梯
Vazada (frestas)|镂空楼梯
Contínua · vários andares|连续楼梯 · 跨多层
Cor do objeto|物件颜色
Cor dos próximos objetos|接下来放置的物件颜色
Copiar cor|复制颜色
Mais cores|更多颜色
Também pode digitar qualquer código #RRGGBB acima.|也可以在上方输入任意 #RRGGBB 色号。
Área reservada à futura criação de móveis, personagens, NPCs e monstros. Por enquanto, use os itens existentes da biblioteca.|目前可在素材库中选择家具、角色和怪物。
Personagens|角色
Criaturas|生物
Construções|建筑
Escolha um item para colocar no mapa.|选择要放到地图上的物件。
Controle do Mestre|主持人操作
Tab escolhe · Enter controla · Esc libera|Tab 选择 · Enter 接管 · Esc 释放
Ficha do Selecionado|所选角色卡
PJ|玩家角色
Vitalidade (HP)|生命值（HP）
Saciedade (Fome)|饱食度
-Fome|减少饥饿
Amigabilidade:|态度
Aliado|友好
Neutro|中立
Hostil|敌对
Atributos d100 (FOR · CON · TAM · DES · INT · POD · CAR)|D100 属性（力量 · 体质 · 体型 · 敏捷 · 智力 · 意志 · 魅力）
Editar atributos d100|编辑 D100 属性
Perícias d100 · Base + Treino = Total|D100 技能 · 基础＋训练＝总值
Esqueleto autônomo (preparação)|自主骷髅（准备中）
Vigiar|警戒
Ativar / Desativar IA|开启／关闭 AI
Detecta e se aproxima de PJs. Ainda não ataca nem calcula dano.|发现并靠近玩家角色。目前尚无攻击与伤害计算。
Equipamento & Mochila|装备与背包
Controles do personagem|角色操作
WASD / Setas: andar · Shift: correr · Espaço: pular · E: interagir · Tab: escolher · Enter: controlar · Esc: liberar|WASD／方向键移动 · Shift 奔跑 · 空格跳跃 · E 互动 · Tab 选择 · Enter 接管 · Esc 释放
Configurar tranca|设置锁
Este objeto pode ficar sem tranca.|这个物件可以不上锁。
Ativar tranca|启用锁
Tipo de tranca|锁的类型
Sem tranca|无锁
Chave física|实体钥匙
Senha / palavra mágica|密码／魔法口令
Chave ou código|钥匙或密码
Onde deixar a chave?|钥匙放在哪里？
No mapa: clique depois onde deseja colocar a chave.|在地图上点击钥匙的放置位置。
Confirmar|确认
Editar objeto selecionado|编辑所选物件
Estilo visual|外观风格
Material|材质
Usar cor personalizada|使用自定义颜色
Largura (unidades)|宽度（地图单位）
Movimento|运动方式
Dobradiça|铰链
Deslizar / retrair|滑动／收缩
Esquerda|左侧
Direita|右侧
Abertura|开启方向
Para dentro|向内
Para fora|向外
Tranca|锁
Nenhuma|无
Chave|钥匙
Código / nome da chave|密码／钥匙名称
Cancelar|取消
Salvar alterações|保存修改
Editar propriedades|编辑属性
Estender parede +3 m|墙体向上延伸 3 米
Agrupar|编组
Desagrupar|取消编组
Pesquisar...|搜索…
Código|密码
Ex.: Lua azul ou 4821|例如：蓝月或 4821
Cores adequadas ao material|材质配色
Clique em outro objeto para copiar a cor|点击另一个物件复制颜色
Vermelho|红色
Azul|蓝色
Verde|绿色
Bege|米色
Violeta|紫罗兰色
Branco|白色
Grafite|石墨灰
Marrom|棕色
Ocre|赭色
Amarelo|黄色
Laranja|橙色
Rosa|粉色
Roxo|紫色
Azul claro|浅蓝色
Azul escuro|深蓝色
Verde escuro|深绿色
Terrenos naturais|自然地形
Chão de caverna|洞穴地面
Lama|泥地
Pincel e texturas|画笔与纹理
Criar (futuro)|创建（准备中）
Pinte diretamente no mapa com formatos e texturas diferentes.|用不同形状和纹理在地图上绘制。
Um espaço preparado para editores futuros.|自定义编辑器准备中。
Texturas reais dos pacotes Kenney RPG Base e Kenney Roguelike RPG. Licença CC0.|Kenney RPG Base 与 Roguelike RPG 素材（CC0）。
Terrenos naturais: grama, água, areia, lama e solo de cavernas. Pisos de construção ficam em Elementos de construção.|这里可以选草地、水域、沙地、泥地和洞穴地面。室内地板请在「建筑构件」中选择。
Selecione um modelo e clique no mapa para colocá-lo.|选择一个模板，然后点击地图放置。
Os novos itens seguem a coleção de construção selecionada, sem modificar os anteriores.|新放置的物件使用当前建筑风格，原有物件保持原样。
Tapete de área|地毯区域
Tapete decorativo|装饰地毯
Mesa|桌子
Cadeira|椅子
Cama de solteiro|单人床
Cama de casal|双人床
Saco de dormir|睡袋
Cápsula de sono|睡眠舱
Escada de mão móvel|移动梯
Escada dobrável portátil|便携折叠梯
Estante|书架
Lareira|壁炉
Barril|木桶
Banco|长凳
Armário|柜子
Escrivaninha|书桌
Sofá (cor personalizável)|沙发（可自定义颜色）
Mesa baixa|矮桌
Console|控制台
Luminária|灯具
Carvalho|橡树
Pinheiro|松树
Frutífera|果树
Arbusto|灌木
Rocha|岩石
Palmeira|棕榈树
Árvore de deserto|沙漠树
Cacto|仙人掌
Flores|花
Juncos|芦苇
Cristal|水晶
Tenda|帐篷
Lâmpada de óleo|油灯
Almofadas|靠垫
Tronco móvel|可移动原木
Ânfora|双耳陶罐
Caixote|木箱
Biombo|屏风
Fonte|喷泉
Tocha|火把
Ladrilho|瓷砖
Piso de pedra|石地板
Calçamento|铺石路面
Piso metálico|金属地板
Mosaico|马赛克
Piso de ponte|桥面
Parede|墙
Porta|门
Janela|窗
Escada|楼梯
Telhado · telhas|瓦屋顶
Cobertura · concreto / terraço|混凝土屋顶／露台
Telhado · metal|金属屋顶
Telhado · palha|茅草屋顶
天窗 / Claraboia|天窗
阁楼出口 / Alçapão|阁楼活板门
Ponte|桥
Baú|宝箱
Baú futurista|未来风格宝箱
Guerreiro|战士
Maga|法师
Arqueira|弓箭手
Aldeão|村民
Guarda|卫兵
Mercadora|商人
Goblin|哥布林
Esqueleto|骷髅
Lobo|狼
Dragão|龙
Fechar|关闭
Abrir da nuvem|从云端打开
Salvar na nuvem|保存到云端
O banco na nuvem é inválido.|云端存档格式无效。
Abrir este banco no lugar do banco atual? Você pode desfazer com Ctrl+Z.|用此存档替换当前场景库？可按 Ctrl+Z 撤销。
Abertura cancelada.|已取消打开。
Banco aberto da nuvem.|已打开云端存档。
Banco salvo na nuvem.|已保存到云端。
A versão na nuvem mudou. Abra o banco da nuvem antes de sobrescrevê-lo.|云端版本已变更。覆盖前请先打开云端存档。
Modo Arquiteto • Paredes retas alinhadas • Porta/Janela abre vão na parede • R: Rotacionar|建筑师模式 · 墙体自动对齐 · 门窗在墙上开洞 · R 旋转
Modo Mestre • Escolha personagens prontos ou marque existentes e clique em Colocar • Arraste no mapa|主持人模式 · 勾选角色并点击放置 · 在地图上拖动角色
Modo Jogador • WASD/Setas: Mover • E ou Clique próximo: Portas, baús e escadas|玩家模式 · WASD／方向键移动 · 按 E 或点击附近的门、宝箱和楼梯
Mochila vazia|背包为空
Aqui|这里
Reserva|候补
Outro|其他场景
Banco salvo na nuvem. A cópia local não pôde ser salva.|云端存档已保存，但本地副本保存失败。
Cenários salvos neste navegador.|场景已保存到当前浏览器。
Clique e arraste para pintar.|点击并拖动绘制。
Editando objeto selecionado|正在编辑所选物件
Parede · material e espessura|墙体 · 材质与厚度
Escada · material e formato|楼梯 · 材质与形状
Construção · material|建筑 · 材质
Paleta de madeira|木材配色
Paleta de metal|金属配色
Paleta de mármore|大理石配色
Paleta de pedra|石材配色
Paleta de decoração|装饰配色
Autonomia desligada|自主行动已关闭
Clique em um objeto colorido no mapa. Esc cancela.|点击地图上有颜色的物件。Esc 取消。
Terra arenosa|沙质地
Pedra clara|浅色石材
Pedra cinza|灰色石材
Árvore verde|绿树
Conífera|针叶树
Árvore outonal|秋树
Arco decorativo|装饰拱门
Janela decorativa|装饰窗
Escada de mão decorativa|装饰梯
Porta decorativa|装饰门
Vaso de pedra|石罐
Cerca|围栏
Árvore|树
Fogueira|篝火
Escadaria decorativa|装饰楼梯

Salvar mapa|保存地图
Salvo no site|已保存到网站
Entre com o mesmo e-mail e senha do Mesa Estelar D100.|请使用 Mesa Estelar D100 的邮箱和密码登录。
E-mail|邮箱
Senha|密码
Entrar|登录
Sair|退出账号
Conectando ao Mesa Estelar…|正在连接 Mesa Estelar…
Não foi possível conectar ao Firebase.|无法连接 Firebase。
E-mail ou senha incorretos.|邮箱或密码错误。
Informe um e-mail válido.|请输入有效的邮箱地址。
Esta conta está desativada.|此账号已停用。
Muitas tentativas. Tente novamente mais tarde.|尝试次数过多，请稍后重试。
O Firebase recusou o acesso ao banco desta conta.|Firebase 拒绝访问此账号的场景库。
O Firebase está indisponível. Tente novamente.|Firebase 暂不可用，请重试。
Não foi possível concluir a operação no Firebase.|Firebase 操作未能完成。
Entrando…|正在登录…
Conta conectada. Agora você pode salvar ou abrir seu banco.|已登录，可以保存或打开云端场景库。
Conta desconectada.|已退出账号。
Abra sua conta no Mesa Estelar principal antes de salvar aqui.|请先在 Mesa Estelar 主站开通账号，再回来保存。
Salvando no site…|正在保存到网站…
Buscando o banco salvo…|正在读取已保存的场景库…
Entre com sua conta do Mesa Estelar.|请登录你的 Mesa Estelar 账号。
O banco excede o limite de 800 KB.|场景库存档超过 800 KB 上限。
Ainda não há banco salvo para esta conta.|此账号还没有云端存档。
Não foi possível abrir o banco na nuvem.|无法打开云端场景库。
Cópia local salva. Entre para salvar no site.|已保存本地副本。登录后可以保存到网站。
Edificação / Sala|整间建筑／房间
Configurar edificação|建筑设置
Tijolos|砖
Cor Livre|自定义颜色
Canto:|圆角
Incluir piso|铺设地板
Madeira (Tábuas)|木板
Tapete|地毯
Terra Batida|夯土
Incluir teto|添加屋顶
Base p/ Andar Superior (Padrão)|上层楼板（默认）
Telhado de Telhas|瓦屋顶
Telhado de Palha|茅草屋顶
Laje de Pedra|石板屋顶
Mostrar tetos translúcidos|显示半透明屋顶
Pincel de terreno|地形画笔
Modo do pincel|画笔模式
Pincel Redondo|圆形画笔
Pincel Quadrado|方形画笔
Área Retangular|矩形填充
Spray / Mistura|喷涂／混合
Solo Base do Mapa|整层基础地形
Borda:|边缘
Suave|柔和
Nítida|清晰
Difusa|弥散
Campos e florestas|草地与森林
Climas extremos|极端地形
Subsolo e líquidos|地下与液体
Solos alienígenas|外星地表
Grama Campestre|原野草地
Grama Densa|茂密草地
Savana|稀树草原
Areia do Deserto|沙漠沙地
Neve Profunda|深雪
Gelo Glacial|冰川冰面
Cascalho|碎石地
Basalto|玄武岩
Lava|熔岩
Água Cristalina|清澈水域
Água Pantanosa|沼泽水域
Micélio Violáceo|紫色菌丝
Solo Cristalino|晶体地表
Solo Carmesim|赤红地表
Solo Corrompido|腐化地表
Escolha um trecho reto e livre da parede.|请选择一段空闲的直墙。
Caverna|洞穴
Solo interno|洞内地形
Tamanho da árvore|树木尺寸
Pequena|小树
Média|中树
Grande|大树
Cortina de janela|窗帘
Clique em uma janela para instalar a cortina. Shift+clique para remover.|点击窗户安装窗帘，按住 Shift 点击可拆除。
Cortina aberta.|窗帘已打开。
Cortina fechada.|窗帘已关闭。
Material aplicado às paredes selecionadas.|已更改所选墙体的材质。
Forma da parede|墙体形状
Parede reta|直墙
Parede curva|弧形墙
Rampa natural de caverna|洞穴岩坡
Girar 90°|旋转 90 度
Ações no cenário|地图互动
Inspecionar|查看硬度与 PV
Disparar pistola|用手枪射击
Limpar vegetação|清除草丛
Escavar|挖掘
Dureza|硬度
PV máximos|最大 PV
Valores de dureza ou PV inválidos.|硬度或 PV 数值无效。
Nenhum objeto neste ponto.|这里没有可检查的物件。
É preciso ter uma pistola no inventário.|背包里需要有一把手枪。
Alvo fora de alcance.|目标超出射程。
Uma parede bloqueia o alvo.|墙壁挡住了目标。
A dureza absorveu o dano.|硬度抵消了这次伤害。
Objeto destruído.|目标已被破坏。
Aproxime-se para cavar.|靠近后再挖掘。
Este ponto não pode ser escavado.|这里无法挖掘。
Abertura para a caverna. Use E para descer.|已挖通洞穴。按 E 下去。
Solo escavado.|已挖开地面。
Vegetação removida.|已清除草丛。
A passagem está bloqueada.|通道被挡住了。
Pistola recolhida.|已拾取手枪。
Relevo em metros|米制地形
Altura (m)|高度（米）
Plataforma elevada|高台
Rampa|斜坡
Degraus no mesmo andar|同层台阶
Equipamentos futuristas|未来风设备
Paradas (níveis; térreo = 0)|停靠楼层（地面层 = 0）
Produtos e preços (nome:preço por linha)|商品与价格（每行填写名称:价格）
Escolha níveis existentes.|请选择已有的楼层。
Use nome:preço, um produto por linha.|每行填写一种商品，格式为名称:价格。
Escolha o andar do elevador:|输入目标楼层的序号
Comprar produto|购买商品
Créditos insuficientes.|余额不足。
Refrigerante|汽水
Cerveja|啤酒
Comida|食物
Excluir mapa|删除地图
Excluir este mapa? Seus personagens irão para a reserva.|删除这张地图？地图里的角色会移到待放置列表。
Rocha de Caverna|洞穴岩石
Parede de Caverna|洞穴墙壁
Caverna de Cogumelos|蘑菇洞穴
Caverna Cristalina|水晶洞穴
Terra Batida|夯土地面
Estatísticas da sessão|本局统计
Ambiente & Horário|环境与时间
Vento na vegetação|植物受风
Brisa|微风
Sem vento|无风
Vento forte|强风
Clique para selecionar e arraste personagens ou NPCs pelo mapa.|点击选中角色或 NPC，然后在地图上拖动。
Personagens disponíveis (marque e clique em Colocar):|勾选角色，点击「放置」，再点击地图。
Colocar|放置
Aqui|当前场景
Reserva|未放置
Texto da placa|招牌文字
Escala do objeto (%)|物件比例（%）
Escala entre 20% e 400%.|请输入 20% 到 400% 的比例。
Entrar na barraca e dormir?|进入帐篷睡觉？
Cobertura externa|洞顶岩层
Sem cobertura|无洞顶
Entrada|入口
Sul|南
Leste|东
Norte|北
Oeste|西
Sem entrada|无入口
Níveis da caverna|洞穴层数
Direção dos níveis|楼层延伸方向
Para baixo|向下
Para cima|向上
Tipo de construção|建筑类型
Sala|房间
Ferramenta da caverna|洞穴工具
Pincel redondo de caverna|圆形洞穴画笔
Adicionar / mover porta|添加／移动洞口门
Adicionar / mover janela|添加／移动洞窗
Selar abertura|封闭洞口
Raio do pincel|画笔半径
Largura da abertura|开口宽度
A entrada fica na borda do primeiro ponto do traço. Arraste uma abertura para movê-la.|入口位于第一笔起点的外缘。拖动开口即可移动。
`.trim().split('\n').map(line=>line.split('|')).filter(([source, translation])=>source && translation));

let siteLanguage = localStorage.getItem('mesa-site-language')==='zh-CN'?'zh-CN':'pt-BR';
const siteOriginalText = new WeakMap();
const siteOriginalAttributes = new WeakMap();
const siteAttributes = ['title','placeholder','aria-label','label'];
const siteUserText = '#sceneSelect, #activeSceneTag, #gmSceneTag, #charHeader, [data-user-text]';

function translateSiteText(value) {
  if(siteLanguage!=='zh-CN')return value;
  const text=value.trim();
  if(!text)return value;
  const prefix=text.match(/^[^\p{L}\p{N}]+\s*/u)?.[0]||'';
  const key=text.slice(prefix.length);
  const floor=key.match(/^(\d+)º (Andar|Subterrâneo)$/);
  const part=key.match(/^(RPG Base|Roguelike|Kenney) · (.+)$/);
  const selection=key.match(/^Selecionado: (.+) • Clique no mapa para colocar\.$/);
  const stats=key.match(/^Personagens: (\d+) · NPCs\/criaturas: (\d+) · Total no banco: (\d+) · Cenário: (.+)$/);
  const label=SITE_ZH.get(key);
  const translated=SITE_ZH.get(text) || (label?prefix+label:null)
    || (floor?(floor[2]==='Andar'?floor[1]+'楼':'地下'+floor[1]+'层'):null)
    || (part&&SITE_ZH.has(part[2])?part[1]+' · '+SITE_ZH.get(part[2]):null)
    || (selection?'已选：'+translateSiteText(selection[1])+' · 点击地图放置。':null)
    || (stats?`角色：${stats[1]} · NPC／生物：${stats[2]} · 库中总数：${stats[3]} · 场景：${stats[4]}`:null);
  return translated ? value.replace(text,()=>translated) : value;
}

function translateSiteNode(node) {
  if(node.nodeType===Node.TEXT_NODE){
    const parent=node.parentElement;
    if(!parent || parent.closest('script,style,'+siteUserText))return;
    let saved=siteOriginalText.get(node);
    if(!saved || node.data!==saved.rendered) saved={original:node.data};
    saved.rendered=translateSiteText(saved.original);
    siteOriginalText.set(node,saved);
    if(node.data!==saved.rendered)node.data=saved.rendered;
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE || node.matches('script,style'))return;
  const attributes=siteOriginalAttributes.get(node)||{};
  for(const name of siteAttributes){
    const value=node.getAttribute(name);
    if(value===null)continue;
    const original=value===attributes[name]?.rendered?attributes[name].original:value;
    const rendered=translateSiteText(original);
    attributes[name]={original,rendered};
    if(value!==rendered)node.setAttribute(name,rendered);
  }
  siteOriginalAttributes.set(node,attributes);
  node.childNodes.forEach(translateSiteNode);
}

function setSiteLanguage(language) {
  siteLanguage=language==='zh-CN'?'zh-CN':'pt-BR';
  localStorage.setItem('mesa-site-language',siteLanguage);
  document.documentElement.lang=siteLanguage;
  document.getElementById('siteLanguage').value=siteLanguage;
  translateSiteNode(document.head);
  translateSiteNode(document.body);
}

setSiteLanguage(siteLanguage);
new MutationObserver(records=>{
  for(const record of records){
    if(record.type==='characterData')translateSiteNode(record.target);
    else record.addedNodes.forEach(translateSiteNode);
  }
}).observe(document.body,{subtree:true,childList:true,characterData:true});
