# Documentação do Projeto Taren Online

## **Visão Geral**
Taren Online é um MMORPG top-down desenvolvido com foco em experiência multijogador, utilizando tecnologias modernas como **Three.js** para renderização 3D, **Socket.IO** para comunicação em tempo real, e **Vite** para gerenciamento do projeto. Este documento explica a estrutura do projeto, funcionalidades implementadas e como contribuir para seu desenvolvimento.

---

## **Estrutura do Projeto**

### **Árvore de Arquivos**
```
TarenOnline/
├── public/
│   ├── index.html
│   ├── main.js
│   ├── style.css
├── src/
│   ├── core/
│   │   ├── Camera.js
│   │   ├── Game.js
│   ├── entities/
│   │   ├── Player.js
│   │   ├── Enemy.js
│   ├── network/
│   │   ├── SocketManager.js
│   ├── ui/
│   │   ├── Hud.js
├── vite.config.js
├── package.json
```

### **Descrição das Pastas**

- **`public/`**: Contém arquivos estáticos servidos ao navegador, como o ponto de entrada `index.html`, o script principal `main.js`, e o estilo `style.css`.
- **`src/core/`**: Lógica central do jogo, incluindo o sistema de câmera (`Camera.js`) e a mecânica principal (`Game.js`).
- **`src/entities/`**: Define os elementos dinâmicos do jogo, como o jogador (`Player.js`) e os inimigos (`Enemy.js`).
- **`src/network/`**: Gerencia a comunicação em tempo real utilizando Socket.IO.
- **`src/ui/`**: Gerencia elementos de interface do usuário, como o HUD (`Hud.js`).

---

## **Configuração do Projeto**

### **Dependências**
As dependências do projeto são gerenciadas pelo `npm` e especificadas no arquivo `package.json`.

```json
"dependencies": {
    "socket.io-client": "^4.8.1",
    "three": "^0.171.0",
    "vite": "^6.0.5"
}
```

### **Scripts Disponíveis**
- **`npm run dev`**: Inicia o servidor de desenvolvimento.
- **`npm run build`**: Compila o projeto para produção.
- **`npm run preview`**: Previsualiza a versão compilada.

### **Configuração do Vite**
O arquivo `vite.config.js` define:
- A pasta raiz como `public/`.
- Alias para referência simplificada ao código em `src/`.
- Configurações de build para saída em `dist/`.

---

## **Componentes Principais**

### **1. Game.js**
Responsável pela inicialização do jogo, renderização e ciclo de animação.

#### Principais Funcionalidades:
- **Cena (`scene`)**: Gerencia todos os objetos renderizados.
- **Renderizador (`renderer`)**: Renderiza a cena no navegador.
- **Jogador (`player`)**: Instância do Player gerenciada pela cena.
- **Câmera (`camera`)**: Instância do Camera.js que segue o jogador.
- **HUD (`hud`)**: Exibe informações como vida e pontuação.
- **Ciclo de animação**: Atualiza todos os elementos do jogo no método `animate()`.

#### Exemplo de Uso:
```javascript
const game = new Game();
game.animate();
```

---

### **2. Camera.js**
Controla a perspectiva e o comportamento da câmera.

#### Principais Funcionalidades:
- **Seguir o Jogador**: Atualiza a posição para acompanhar o jogador.
- **Zoom**: Ajusta o campo de visão com o scroll do mouse.
- **Rotacionar com o Mouse**: Permite que o usuário gire a câmera ao clicar e arrastar.

#### Exemplo de Uso:
```javascript
const camera = new Camera(player);
camera.update();
```

---

### **3. Player.js**
Define o jogador e sua movimentação.

#### Principais Funcionalidades:
- **Movimentação com Clique**: O jogador se move até o ponto clicado no cenário.
- **Habilidades (`QWERT`)**: Ativa habilidades ao pressionar teclas designadas.
- **Indicador de Destino**: Mostra um marcador azul no ponto clicado.

#### Exemplo de Uso:
```javascript
const player = new Player();
player.update();
```

---

### **4. Enemy.js**
Define os inimigos e sua inteligência artificial.

#### Principais Funcionalidades:
- **Seguir o Jogador**: Movem-se em direção ao jogador.
- **Ataque**: Causam dano ao jogador ao se aproximar.

#### Exemplo de Uso:
```javascript
const enemy = new Enemy(player);
enemy.update();
```

---

### **5. Hud.js**
Responsável por exibir informações como vida e pontuação do jogador.

#### Principais Funcionalidades:
- **Exibição de Informações**: Mostra a vida e a pontuação em tempo real.
- **Atualização Dinâmica**: Altera os valores exibidos conforme eventos no jogo.

#### Exemplo de Uso:
```javascript
const hud = new Hud();
hud.update(player.life, game.score);
```

---

### **6. SocketManager.js**
Gerencia a comunicação em tempo real com o servidor.

#### Principais Funcionalidades:
- **Conexão ao Servidor**: Conecta-se ao servidor via Socket.IO.
- **Atualização de Jogadores**: Sincroniza a posição dos jogadores.
- **Eventos Personalizados**: Envia e recebe eventos, como movimentações e desconexões.

#### Exemplo de Uso:
```javascript
SocketManager.sendMove(player.position);
```

---

## **Fluxo de Execução do Jogo**
1. **Inicialização:** O jogo é iniciado no arquivo `main.js`.
   ```javascript
   import Game from '@/core/Game.js';
   const game = new Game();
   ```
2. **Renderização:** O `Game.js` gerencia a cena, câmera, jogador, e inimigos.
3. **Interação do Jogador:**
   - Movimento: Clique no cenário para definir o destino.
   - Habilidades: Pressione teclas `Q`, `W`, `E`, `R`, `T` para ativar.
4. **Ciclo de Atualização:** O método `animate` atualiza a cena continuamente.

---

## **Próximos Passos**
1. **Implementar Sistema de Partículas:** Adicionar efeitos visuais para habilidades e ataques.
2. **Adicionar Pathfinding:** Impedir que o jogador e inimigos atravessem obstáculos.
3. **Melhorar Interface:** Expandir o HUD para exibir mais informações.
4. **Sistema Multijogador Completo:** Sincronizar inimigos e eventos entre vários jogadores.

---

Essa documentação reflete o estado atual do projeto Taren Online e serve como guia para desenvolvedores e colaboradores.

