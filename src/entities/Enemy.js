import * as THREE from 'three';
import { Body, Box, Vec3, Material, ContactMaterial } from 'cannon-es';

class Enemy {
    constructor(player, map, physicsWorld, enemyIndex, totalEnemies) {
        this.player = player;
        this.map = map;
        this.physicsWorld = physicsWorld;
        this.enemyIndex = enemyIndex;
        this.totalEnemies = totalEnemies;

        this.detectionRadius = 15; // Distância em que o inimigo detecta o player
        this.fovAngle = Math.PI / 4; // Ângulo do campo de visão (45 graus)
        this.patrolRadius = 10; // Distância máxima de patrulha
        this.speed = 0.8; // Velocidade do inimigo
        this.mass = 1; // Massa do inimigo
        this.modelSize = 1; // Tamanho do modelo
        this.friction = 0.8; // Atrito do corpo físico
        this.restitution = 0.1; // Redução de quicada
        this.orbitRadius = 2; // Distância desejada ao redor do player
        this.orbitAngleOffset = (Math.PI * 2 / totalEnemies) * enemyIndex;
        this.state = 'PATROLLING'; // Estado inicial: patrulha
        this.spawnPosition = new THREE.Vector3(
            Math.random() * 10 - 5,
            0.5,
            Math.random() * 10 - 5
        ); // Ponto de origem
        this.targetPatrolPosition = this.getRandomPatrolPoint();
        this.position = this.spawnPosition.clone();

        // Criação do modelo visual do inimigo
        this.model = new THREE.Mesh(
            new THREE.BoxGeometry(this.modelSize, this.modelSize, this.modelSize),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        this.model.position.copy(this.position);
        this.scene = map.scene;
        this.scene.add(this.model);

        // Material físico do inimigo
        this.enemyMaterial = new Material("enemyMaterial");
        this.groundMaterial = physicsWorld.defaultContactMaterial;
        const contactMaterial = new ContactMaterial(this.enemyMaterial, this.groundMaterial, {
            friction: this.friction,
            restitution: this.restitution,
        });
        physicsWorld.addContactMaterial(contactMaterial);

        // Criação do corpo físico do inimigo
        this.body = new Body({
            mass: this.mass,
            position: new Vec3(this.position.x, this.position.y, this.position.z),
            shape: new Box(new Vec3(this.modelSize / 2, this.modelSize / 2, this.modelSize / 2)),
            material: this.enemyMaterial,
        });
        this.body.linearDamping = 0.2;
        this.body.angularDamping = 0.2;
        physicsWorld.addBody(this.body);

        // Visualizações de debug
        this.createOrbitVisualization();
        this.pathLine = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0x00ff00 })
        );
        this.scene.add(this.pathLine);
        this.createFieldOfViewVisualization();

        // Referência aos checkboxes
const orbitCheckbox = document.getElementById('toggle-orbit');
const patrolCheckbox = document.getElementById('toggle-patrol');
const fovCheckbox = document.getElementById('toggle-fov');

// Função para atualizar todos os inimigos
function updateEnemyDebug(type, visible) {
    game.enemies.forEach(enemy => enemy.setDebugVisibility(type, visible));
}

// Eventos para os checkboxes
orbitCheckbox.addEventListener('change', (event) => {
    updateEnemyDebug('orbit', event.target.checked);
});

patrolCheckbox.addEventListener('change', (event) => {
    updateEnemyDebug('patrol', event.target.checked);
});

fovCheckbox.addEventListener('change', (event) => {
    updateEnemyDebug('fov', event.target.checked);
});
    }

    createOrbitVisualization() {
        const orbitGeometry = new THREE.CircleGeometry(this.orbitRadius, 32);
        orbitGeometry.rotateX(-Math.PI / 2); // Ajustar a orientação
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        this.orbitVisualization = new THREE.LineLoop(orbitGeometry, orbitMaterial);
        this.scene.add(this.orbitVisualization);
    }

    createFieldOfViewVisualization() {
        const coneGeometry = new THREE.ConeGeometry(this.detectionRadius, this.detectionRadius, 32, 1, true);
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.2,
            wireframe: true,
        });
        this.fieldOfViewCone = new THREE.Mesh(coneGeometry, coneMaterial);
        this.fieldOfViewCone.position.set(this.position.x, this.position.y, this.position.z);
        this.fieldOfViewCone.rotation.x = -Math.PI / 2; // Ajustar a orientação
        this.scene.add(this.fieldOfViewCone);
    }

    update(deltaTime) {
        const distanceToPlayer = this.position.distanceTo(this.player.position);

        if (distanceToPlayer <= this.detectionRadius) {
            this.state = 'CHASING';
            this.updateOrbitVisualization();
        } else if (this.state === 'CHASING' && distanceToPlayer > this.detectionRadius) {
            this.state = 'RETURNING'; // Retorna ao ponto de origem
        } else if (this.state === 'RETURNING' && this.position.distanceTo(this.spawnPosition) < 0.5) {
            this.state = 'PATROLLING'; // Retoma a patrulha ao chegar ao ponto de origem
            this.targetPatrolPosition = this.getRandomPatrolPoint();
        }

        if (this.state === 'CHASING') {
            this.orbitPlayer(deltaTime);
        } else if (this.state === 'PATROLLING') {
            this.patrol(deltaTime);
        } else if (this.state === 'RETURNING') {
            this.returnToSpawn(deltaTime);
        }
       // Sincronizar o modelo visual com o corpo físico
       this.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
       this.model.position.copy(this.position);

       // Atualiza visualizações
       this.updatePatrolVisualization();
       this.updateFieldOfViewVisualization();
    }

    patrol(deltaTime) {
        if (this.position.distanceTo(this.targetPatrolPosition) < 0.5) {
            this.targetPatrolPosition = this.getRandomPatrolPoint();
        }

        const direction = new THREE.Vector3()
            .subVectors(this.targetPatrolPosition, this.position)
            .normalize();

        const forceMagnitude = this.speed * 0.5;
        const force = new Vec3(
            direction.x * forceMagnitude,
            0,
            direction.z * forceMagnitude
        );

        this.body.velocity.set(force.x, 0, force.z);
    }

    returnToSpawn(deltaTime) {
        const direction = new THREE.Vector3()
            .subVectors(this.spawnPosition, this.position)
            .normalize();

        const forceMagnitude = this.speed;
        const force = new Vec3(
            direction.x * forceMagnitude,
            0,
            direction.z * forceMagnitude
        );

        this.body.velocity.set(force.x, 0, force.z);
    }

    orbitPlayer(deltaTime) {
        const angle = performance.now() * 0.001 + this.orbitAngleOffset;
        const targetPosition = new THREE.Vector3(
            this.player.position.x + Math.cos(angle) * this.orbitRadius,
            this.player.position.y,
            this.player.position.z + Math.sin(angle) * this.orbitRadius
        );

        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.position)
            .normalize();

        const forceMagnitude = this.speed;
        const force = new Vec3(
            direction.x * forceMagnitude,
            0,
            direction.z * forceMagnitude
        );

        this.body.velocity.set(force.x, 0, force.z);
    }

    getRandomPatrolPoint() {
        const origin = this.spawnPosition;

        const randomAngle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;

        return new THREE.Vector3(
            origin.x + Math.cos(randomAngle) * distance,
            origin.y,
            origin.z + Math.sin(randomAngle) * distance
        );
    }

    updateOrbitVisualization() {
        this.orbitVisualization.position.set(
            this.player.position.x,
            this.player.position.y,
            this.player.position.z
        );
    }

    updatePatrolVisualization() {
        if (!this.targetPatrolPosition) return;

        const positions = [
            this.position.x, this.position.y, this.position.z,
            this.targetPatrolPosition.x, this.targetPatrolPosition.y, this.targetPatrolPosition.z
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        this.pathLine.geometry.dispose();
        this.pathLine.geometry = geometry;
    }

    setDebugVisibility(type, visible) {
        switch (type) {
            case 'orbit':
                if (this.orbitVisualization) {
                    this.orbitVisualization.visible = visible;
                }
                break;
            case 'patrol':
                if (this.pathLine) {
                    this.pathLine.visible = visible;
                }
                break;
            case 'fov':
                if (this.fieldOfViewCone) {
                    this.fieldOfViewCone.visible = visible;
                }
                break;
            default:
                console.warn(`Debug type "${type}" not recognized.`);
        }
    }
    

    updateFieldOfViewVisualization() {
        this.fieldOfViewCone.position.copy(this.position);
        const direction = new THREE.Vector3()
            .subVectors(this.player.position, this.position)
            .normalize();

        const angle = Math.atan2(direction.x, direction.z);
        this.fieldOfViewCone.rotation.y = -angle;
    }
}

export default Enemy;
