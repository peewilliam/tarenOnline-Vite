import * as THREE from 'three';
import Pathfinding from '@/core/Pathfinding.js';
import { Body, Sphere, Vec3 } from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { AnimationMixer } from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

class Player {
  constructor(limits, physicsWorld) {
    this.limits = limits;
    this.physicsWorld = physicsWorld;
    this.model = null;
    this.position = new THREE.Vector3(0, 0.5, 0);
    this.speed = 2;
    this.life = 200;
    this.alive = true;
    this.targetPosition = new THREE.Vector3();
    this.moving = false;
    this.mousePressed = false;
    this.mixer = null; // Para animações
    this.animations = {}; // Para armazenar as animações
    this.currentAnimation = 'idle'; // Animação atual

    
  }

  async loadModel() {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    try {
      const gltf = await loader.loadAsync('/assets/player/human-man/human-man.glb');
      this.model = gltf.scene;
      this.model.scale.set(0.1, 0.1, 0.1); // Ajuste da escala
      this.model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
        }
      });
      window.game.scene.add(this.model);
      this.model.position.copy(this.position);
      this.initPlayerPhysics();
      this.initMouseInput();
      this.initKeyboardInput();

      // Inicializa o AnimationMixer
      this.mixer = new AnimationMixer(this.model);
      gltf.animations.forEach((clip) => {
        this.animations[clip.name] = this.mixer.clipAction(clip); // Armazena a animação
      });

      // Inicia com a animação idle
      this.playAnimation('idle');

      // Criação do nome do jogador
      const nameDiv = document.createElement('div');
      nameDiv.className = 'player-name';
      nameDiv.textContent = 'IndexJS'; // Nome do jogador
      nameDiv.style.color = 'white'; // Cor do texto
      nameDiv.style.fontSize = '12px'; // Tamanho da fonte
      nameDiv.style.fontFamily = 'Arial, sans-serif'; // Fonte
      const nameLabel = new CSS2DObject(nameDiv);
      nameLabel.position.set(0, 25, 0); // Ajuste a posição acima da cabeça do jogador
      this.model.add(nameLabel); // Adiciona o nome ao modelo do jogador

      // Chat Bubble
      const chatDiv = document.createElement('div');
      chatDiv.className = 'chat-bubble';
      chatDiv.style.display = 'block';
      const chatBubble = new CSS2DObject(chatDiv);
      chatBubble.position.set(0, 30, 0);
      this.model.add(chatBubble);
     
    } catch (error) {
      console.error('Erro ao carregar o modelo GLB:', error);
    }
  }

  playAnimation(state) {
    if (this.currentAnimation === state) return;

    const prevAction = this.animations[this.currentAnimation];
    const nextAction = this.animations[state];

    if (prevAction) {
      prevAction.fadeOut(0.2); // Transição suave
    }

    if (nextAction) {
      nextAction.reset().fadeIn(0.2).play();
      this.currentAnimation = state; // Atualiza a animação atual
    }
  }

  initPlayerPhysics() {
    this.body = new Body({
      mass: 1, // Dinâmico
      position: new Vec3(0, 0.5, 0), // Posição inicial
      shape: new Sphere(0.5), // Forma do corpo
    });
    this.physicsWorld.addBody(this.body);
  }

  loseLife(damage = 10) {
    this.life -= damage;
    if (this.life <= 0) {
      console.log("Game Over!");
    }
  }

  initMouseInput() {
    window.addEventListener('contextmenu', (event) => event.preventDefault());

    window.addEventListener('mousedown', (event) => {
      if (event.button === 2) {
        this.mousePressed = true;
        this.updateTargetPosition(event);
      }
    });

    window.addEventListener('mousemove', (event) => {
      if (this.mousePressed) {
        this.updateTargetPosition(event);
      }
    });

    window.addEventListener('mouseup', (event) => {
      if (event.button === 2) {
        this.mousePressed = false;
      }
    });
  }

  updateTargetPosition(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, window .game.camera.camera);

    const intersects = raycaster.intersectObjects(window.game.clickables, true);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const ground = window.game.map.ground; 
      const halfWidth = ground.geometry.parameters.width / 2;
      const halfHeight = ground.geometry.parameters.height / 2;

      if (point.x >= -halfWidth && point.x <= halfWidth && point.z >= -halfHeight && point.z <= halfHeight) {
        this.setDestination(point);
      } else {
        console.warn('Clique fora dos limites do chão!');
      }
    }
  }

  initKeyboardInput() {
    window.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'q':
          this.useSkill('Skill 1');
          break;
        case 'w':
          this.useSkill('Skill 2');
          break;
        case 'e':
          this.useSkill('Skill 3');
          break;
        case 'r':
          this.useSkill('Skill 4');
          break;
        case 't':
          this.useSkill('Skill 5');
          break;
        default:
          break;
      }
    });
  }

  useSkill(skillName) {
    console.log(`${skillName} ativada!`);
  }

  setDestination(destination) {
    this.targetPosition.copy(destination);
    this.moving = true;
  }

  update(deltaTime) {
    if (this.moving) {
      const direction = new THREE.Vector3()
        .subVectors(this.targetPosition, this.position)
        .normalize();

      const targetAngle = Math.atan2(direction.x, direction.z);
      const currentAngle = THREE.MathUtils.euclideanModulo(this.model.rotation.y + Math.PI, 2 * Math.PI) - Math.PI;

      let angleDifference = targetAngle - currentAngle;
      if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
      if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

      const lerpedAngle = currentAngle + angleDifference * 0.1;
      this.model.rotation.y = lerpedAngle;

      const distance = this.position.distanceTo(this.targetPosition);

      if (distance > 0.63) {
        const force = new Vec3(
          direction.x * this.speed,
          0,
          direction.z * this.speed
        );
        this.body.velocity.set(force.x, force.y, force.z);
        this.playAnimation('run'); // Toca a animação de correr
      } else {
        this.body.velocity.set(0, 0, 0);
        this.moving = false;
        this.playAnimation('idle'); // Retorna para a animação idle
      }
    } else {
      this.body.velocity.set(0, 0, 0);
      this.playAnimation('idle'); // Garante que a animação idle esteja tocando
    }

    this.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
    this.model.position.copy(this.position);
    this.mixer.update(deltaTime); // Atualiza o mixer de animação
  }
}

export default Player;