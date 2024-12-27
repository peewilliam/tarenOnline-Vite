import * as THREE from 'three';
import Renderer from './Renderer.js';
import SocketManager from '../network/SocketManager.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Hud from '../ui/Hud.js'; // Importação correta pela estrutura de pastas
import Camera from './Camera.js';
import Minimap from '../ui/Minimap.js';
import Map from './Map.js';
import AdvancedDebug from '../ui/AdvancedDebug.js';
import WeatherStation from './WeatherStation.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';


class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.lastFrameTime = performance.now();
        window.game = this;
        // Criação do CSS2DRenderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        document.body.appendChild(this.labelRenderer.domElement);
       
    

        this.init();
    }

    async init() {
        this.score = 0
        this.enemies = []
        this.socket = SocketManager;

        this.map = new Map(this.scene);
        this.limits = this.map.getLimits();
        this.physicsWorld = this.map.getPhysicsWorld();

        // Instancia o jogador e aguarda o carregamento do modelo
        this.player = new Player(this.map.getLimits(), this.physicsWorld);
        
        await this.player.loadModel(); // Aguarda o carregamento do modelo
     
        this.camera = new Camera(this.player, this.limits);
        this.rendererInstance = new Renderer(this.scene, this.camera.camera);
        this.renderer = this.rendererInstance.getRenderer();
        this.weatherStation = new WeatherStation(this.scene, this.renderer, this.player, 1800);
        this.debug = new AdvancedDebug(this.renderer, this.scene);
        this.minimap = new Minimap(this.scene, this.player, this.renderer);
        this.hud = new Hud();

        

        this.camera.camera.position.z = 5;

        // Lista de objetos clicáveis
        this.clickables = [this.map.ground, this.player.model];

  
        // Cria Celecinaveis
        this.createCollectibles();
        // this.enemies = [];
        // for (let i = 0; i < 5; i++) { // Adiciona 5 inimigos iniciais
        //     const enemy = new Enemy(this.player, this.map, this.physicsWorld, this.enemies); // Passa a lista de inimigos
        //     this.enemies.push(enemy);
    
        //     this.scene.add(enemy.model);
        // }

        const totalEnemies = 5;
        this.enemies = [];
        for (let i = 0; i < totalEnemies; i++) {
            const enemy = new Enemy(this.player, this.map, this.physicsWorld, i, totalEnemies);
            this.enemies.push(enemy);
        }

        // adicionar inimigos
        // this.enemies.forEach(enemy => this.scene.add(enemy.model));


        this.goal = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        );
        this.goal.position.set(5, 0, -5);
        this.scene.add(this.goal);

        // Obtém os limites do chão dinamicamente
        const halfWidth = window.game.map.ground.geometry.parameters.width;
        const halfHeight = window.game.map.ground.geometry.parameters.height;
        const gridHelper = new THREE.GridHelper(halfWidth, halfHeight, 0x00ff00, 0x000000); // Grade de 20x20
        // this.scene.add(gridHelper);

        window.addEventListener('resize', this.onResize.bind(this));

        this.animate();
    }

    checkGoal() {
        const distance = this.goal.position.distanceTo(this.player.position);
        if (distance < 1) {
            console.log("You win!");
            this.nextLevel();
            // Reinicie o jogo ou exiba uma mensagem de vitória
        }
    }



    createCollectibles() {
        this.collectibles = [];
        for (let i = 0; i < 5; i++) {
            const collectible = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshStandardMaterial({ color: 0xffff00 })
            );
            collectible.position.set(
                Math.random() * 10 - 5,
                0,
                Math.random() * 10 - 5
            );
            this.collectibles.push(collectible);
            this.scene.add(collectible);
        }
    }

    checkCollectibles() {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const distance = collectible.position.distanceTo(this.player.position);
            if (distance < 1) {
                console.log("Item coletado!");
                this.score += 5; // Incrementa a pontuação
                this.scene.remove(collectible);
                this.collectibles.splice(i, 1);
            }
        }
    }

    nextLevel() {
        console.log("Next level!");

        this.player.level += 1;

        // Aumenta o número de inimigos
        const newEnemy = new Enemy(this.player);
        this.enemies.push(newEnemy);
        this.scene.add(newEnemy.model);



        this.goal.position.set(
            Math.random() * 10 - 5,
            0,
            Math.random() * 10 - 5
        );


    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.camera.aspect = window.innerWidth / window.innerHeight;
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight); // Atualiza o tamanho do CSS2DRenderer
        this.camera.camera.updateProjectionMatrix();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const now = performance.now();
        const deltaTime = (now - (this.lastFrameTime || now)) / 1000;

        // if (deltaTime < 1 / 60) return; 

        this.lastFrameTime = now;

        // Atualize o clima
        this.weatherStation.update(1 / 60);

        this.debug.update(); // Atualiza o depurador a cada frame
        // this.debugInfo.begin(); // Inicia a medição de desempenho

        // Atualiza física do Cannon.js
        this.map.getPhysicsWorld().step(1 / 60);

        // Atualiza a posição dos objetos com base no mundo físico
        this.map.obstacles.forEach((obstacle) => {
            const body = obstacle.body; // Supondo que cada obstáculo tenha um corpo físico associado
            if (body) {
                obstacle.position.copy(body.position); // Sincroniza posição
            }
        });

        this.player.update(deltaTime);
        this.camera.update(); // Atualiza a câmera no loop de animação

        this.map.checkCollisions(this.player); // Chama a verificação de colisões no mapa

        this.checkGoal();
        this.checkCollectibles();

        // Envie a posição do jogador
        this.socket.sendMove(this.player.position);

        // Atualiza os inimigos
        this.enemies.forEach(enemy => enemy.update(deltaTime));


        // atualiza a hud
        this.hud.update(this.player.life, this.score); // Atualiza a HUD

        // Atualize o minimapa sem interferir nos obstáculos
        this.minimap.update();



        this.renderer.render(this.scene, this.camera.camera); // Use this.camera.camera

        // Renderiza a cena e as labels

        this.labelRenderer.render(this.scene, this.camera.camera); // Renderiza as labels

        // this.debugInfo.end(); // Finaliza a medição de desempenho
    }
}

export default Game;
