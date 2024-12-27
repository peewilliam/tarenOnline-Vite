import * as THREE from 'three';
import { Body, Box, Vec3 } from 'cannon-es';
import * as CANNON from 'cannon-es';
import Pathfinding from '@/core/Pathfinding.js';

class Enemy {
    constructor(player, map, physicsWorld, enemies) {
        this.player = player;
        this.map = map;
        this.physicsWorld = physicsWorld;
        this.enemies = enemies; // Lista de todos os inimigos
        this.pathfinding = new Pathfinding({ width: 100, height: 100 });
        this.state = 'IDLE'; // Estados: IDLE, PATROLLING, CHASING
        this.patrolRadius = 20;
        this.detectionRadius = 15;
        this.fov = Math.PI / 4; // Campo de visão de 45 graus
        this.alertRadius = 10; // Raio para alertar outros inimigos
        this.path = [];
        this.currentPathIndex = 0;
        this.speed = 2;
        this.reactionDelay = 0.1; // Tempo de reação em segundos
        this.reactionTimer = 0;

        // Criação do modelo do inimigo
        this.model = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        this.position = new THREE.Vector3(
            Math.random() * 10 - 5,
            0.5, // Elevação para evitar interseção com o chão
            Math.random() * 10 - 5
        );
        this.model.position.copy(this.position);
        this.scene = map.scene;
        this.scene.add(this.model);

        this.body = new Body({
            mass: 1, // Define a massa do corpo
            position: new Vec3(this.position.x, this.position.y, this.position.z),
            shape: new Box(new Vec3(0.5, 0.5, 0.5)), // Proporcional ao modelo 3D
            material: new CANNON.Material({
                friction: 0.3, // Ajuste de atrito
                restitution: 0.2, // Ajuste de elasticidade
            }),
        });
        this.body.linearDamping = 0.1; // Reduz a desaceleração linear
        this.body.angularDamping = 0.5; // Evita rotação excessiva
        this.physicsWorld.addBody(this.body);

        this.detectionSphere = new THREE.Mesh(
            new THREE.SphereGeometry(this.detectionRadius, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.01,
                wireframe: true
            })
        );
        this.scene.add(this.detectionSphere);

        this.patrolTarget = this.getRandomPatrolPoint();

        // Configurar obstáculos no Pathfinding
        this.map.obstacles.forEach((obstacle) => {
            const gridPosition = this.map.convertWorldToGrid(obstacle.position);
            this.pathfinding.grid.setWalkableAt(gridPosition.x, gridPosition.z, false);
        });

        this.adjustGridForEnemySize(this.pathfinding.grid, Math.ceil(this.model.scale.x / this.map.cellSize));
    }

    drawPath() {
        if (!this.path || this.path.length === 0) return;

        const pathPoints = this.path.map(([x, z]) => this.map.convertGridToWorld({ x, z }));
        const positions = pathPoints.flatMap((point) => [point.x, point.y, point.z]);

        const pathGeometry = new THREE.BufferGeometry();
        pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        if (!this.pathLine) {
            this.pathLine = new THREE.Line(
                pathGeometry,
                new THREE.LineBasicMaterial({ color: 0x00ff00 })
            );
            this.scene.add(this.pathLine);
        } else {
            this.pathLine.geometry.dispose();
            this.pathLine.geometry = pathGeometry;
        }
    }

    debugInfo() {
        console.log(`Enemy State: ${this.state}`);
        console.log(`Path Length: ${this.path.length}`);
        console.log(`Current Path Index: ${this.currentPathIndex}`);
        console.log(`Position: ${this.position.x}, ${this.position.y}, ${this.position.z}`);
        console.log(`Velocity: ${this.body.velocity.x}, ${this.body.velocity.y}, ${this.body.velocity.z}`);
    }

    update(deltaTime) {
        this.reactionTimer += deltaTime;

        // Debugging
        this.debugInfo();

        // Atualiza o estado com base no campo de visão e distância do player
        if (this.isPlayerInFieldOfView() && this.reactionTimer >= this.reactionDelay) {
            this.state = 'CHASING';
            this.alertNearbyEnemies();
            this.reactionTimer = 0; // Reseta o timer
        }

        if (this.state === 'CHASING') {
            this.chasePlayer(deltaTime);
        } else if (this.state === 'PATROLLING') {
            this.patrol(deltaTime);
        } else {
            this.state = 'PATROLLING';
        }

        // Sincroniza a posição do modelo 3D com o corpo físico
        this.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
        this.model.position.copy(this.position);

        // Atualiza a posição da esfera de detecção
        this.detectionSphere.position.copy(this.position);

        // Atualiza o desenho do caminho
        this.drawPath();
        this.drawDirection();
    }

    patrol(deltaTime) {
        if (!this.targetPatrolPosition) {
            this.targetPatrolPosition = this.getRandomPatrolPoint();
        }

        const direction = new THREE.Vector3()
            .subVectors(this.targetPatrolPosition, this.position)
            .normalize();

        const force = new Vec3(
            direction.x * this.speed + (Math.random() * 0.1 - 0.05),
            0,
            direction.z * this.speed + (Math.random() * 0.1 - 0.05)
        );

        this.body.velocity.set(force.x, force.y, force.z);

        if (this.position.distanceTo(this.targetPatrolPosition) < 0.5) {
            this.targetPatrolPosition = null; // Escolher um novo ponto
        }
    }

    chasePlayer(deltaTime) {
        if (!this.path || this.path.length === 0 || this.currentPathIndex >= this.path.length) {
            this.findPathToPlayer();
            return; // Certifique-se de que o inimigo recalcula o caminho se necessário
        }
    
        const nextPoint = this.path[this.currentPathIndex];
        const targetPosition = this.map.convertGridToWorld({ x: nextPoint[0], z: nextPoint[1] });
    
        const direction = new THREE.Vector3().subVectors(targetPosition, this.position);
        const distance = direction.length();

        if (distance < 0.3) {
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length) {
                this.body.velocity.set(0, 0, 0);
                return;
            }
        }

        direction.normalize();
        const forceMagnitude = 10; // Ajuste conforme necessário
        const force = new Vec3(
            direction.x * forceMagnitude,
            0,
            direction.z * forceMagnitude
        );
        this.body.applyForce(force, this.body.position);

    }
    
    

    isPlayerInFieldOfView() {
        const directionToPlayer = new THREE.Vector3()
            .subVectors(this.player.position, this.position)
            .normalize();

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion);
        const angle = forward.angleTo(directionToPlayer);

        return angle < this.fov && this.position.distanceTo(this.player.position) <= this.detectionRadius;
    }

    alertNearbyEnemies() {
        this.enemies.forEach((enemy) => {
            if (enemy !== this && this.position.distanceTo(enemy.position) <= this.alertRadius) {
                enemy.state = 'CHASING';
            }
        });
    }

    drawDirection() {
        const direction = new THREE.ArrowHelper(
            new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z).normalize(),
            this.model.position,
            1,
            0xffff00
        );
        this.scene.add(direction);
    
        // Remover após 1 segundo para evitar acumulação
        setTimeout(() => this.scene.remove(direction), 1000);
    }
    

    findPathToPlayer() {
        const start = this.map.convertWorldToGrid(this.body.position);
        const end = this.map.convertWorldToGrid(this.player.position);
    
        if (!this.pathfinding.grid.isInside(start.x, start.z) ||
            !this.pathfinding.grid.isInside(end.x, end.z) ||
            !this.pathfinding.grid.isWalkableAt(end.x, end.z)) {
            console.warn(`Ponto inválido ou não transitável: start(${start.x}, ${start.z}), end(${end.x}, ${end.z})`);
            this.state = 'PATROLLING';
            return;
        }
    
        this.path = this.pathfinding.findPath(start, end);
    
        if (!this.path || this.path.length === 0) {
            console.warn('Nenhum caminho encontrado para o jogador!');
            this.state = 'PATROLLING';
            return;
        }
    
        this.currentPathIndex = 0;
        console.log(`Novo caminho encontrado: ${JSON.stringify(this.path)}`); // Log adicional
    }
    

    getRandomPatrolPoint() {
        const randomAngle = Math.random() * Math.PI * 2;
        return new THREE.Vector3(
            this.position.x + Math.cos(randomAngle) * this.patrolRadius,
            0,
            this.position.z + Math.sin(randomAngle) * this.patrolRadius
        );
    }

    adjustGridForEnemySize(grid, enemySize) {
        for (let x = 0; x < grid.width; x++) {
            for (let z = 0; z < grid.height; z++) {
                if (!grid.isWalkableAt(x, z)) {
                    for (let dx = -enemySize; dx <= enemySize; dx++) {
                        for (let dz = -enemySize; dz <= enemySize; dz++) {
                            const nx = x + dx;
                            const nz = z + dz;
                            if (grid.isInside(nx, nz)) {
                                grid.setWalkableAt(nx, nz, false);
                            }
                        }
                    }
                }
            }
        }
    }
}

export default Enemy;
