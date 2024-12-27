import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { World, Body, Box, Sphere, Vec3 } from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import Pathfinding from './Pathfinding.js'; // Certifique-se do caminho correto

class Map {
    constructor(scene) {
        this.scene = scene;
        this.pathfinding = new Pathfinding({ width: 100, height: 100 }); // Ajuste o tamanho da grade conforme necessário
        this.obstacles = [];
        this.physicsWorld = new World(); // Mundo de física Cannon.js
        this.physicsWorld.gravity.set(0, -9.82, 0); // Configura gravidade

        // Cria o debugger para Cannon.js
        this.cannonDebugger = new CannonDebugger(this.scene, this.physicsWorld, {
            color: 0xff0000, // Cor dos shapes
        });

        // Ajuste o tamanho do plano
        const planeSize = 100;

        const textureLoader = new THREE.TextureLoader();

        // Carregando as texturas
        const diffuseTexture = textureLoader.load(
            '/assets/world/textures/creaked/cracked_concrete_diff_1k.jpg',
            (texture) => console.log('Diffuse texture loaded:', texture),
            undefined,
            (error) => console.error('Error loading diffuse texture:', error)
        );

        const armTexture = textureLoader.load(
            '/assets/world/textures/creaked/cracked_concrete_arm_1k.jpg',
            (texture) => console.log('ARM texture loaded:', texture),
            undefined,
            (error) => console.error('Error loading ARM texture:', error)
        );

        const normalTexture = textureLoader.load(
            '/assets/world/textures/creaked/cracked_concrete_nor_gl_1k.jpg',
            (texture) => console.log('Normal texture loaded:', texture),
            undefined,
            (error) => console.error('Error loading normal texture:', error)
        );

        // Ajustando repetição das texturas
        [diffuseTexture, armTexture, normalTexture].forEach((texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(15, 15); // Ajuste o valor para controlar a densidade
        });


        // Define o chão com texturas PBR
        this.ground = new THREE.Mesh(
            new THREE.PlaneGeometry(planeSize, planeSize, 1, 1),
            new THREE.MeshStandardMaterial({
                map: diffuseTexture,         // Textura base
                roughnessMap: armTexture,    // Mapa de rugosidade
                metalnessMap: armTexture,    // Mapa de metalicidade
                normalMap: normalTexture,    // Mapa de normais
                roughness: 0.9, // Ajuste adicional de rugosidade
                metalness: 0.0, // Sem metalicidade
            })
        );
        this.ground.rotation.x = -Math.PI / 2; // Deitar o plano
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Corpo físico para o chão
        const groundBody = new Body({
            mass: 0, // Estático
            shape: new Box(new Vec3(planeSize / 2, 0.1, planeSize / 2)), // Tamanho do chão
        });
        groundBody.position.set(0, 0, 0);
        this.physicsWorld.addBody(groundBody);

        // Calcula os limites com base no tamanho do chão
        this.limits = {
            minX: -planeSize / 2,
            maxX: planeSize / 2,
            minZ: -planeSize / 2,
            maxZ: planeSize / 2,
        };

        // Cria os elementos da vila
        this.createPaths();
        this.createHouses();
        this.createTrees();
        this.createFences();
    }

    loadTexture(loader, path, type) {
        if (path.endsWith('.exr')) {
            const exrLoader = new EXRLoader();
            try {
                return exrLoader.load(
                    path,
                    (texture) => {
                        console.log(`${type} texture loaded successfully:`, path);
                    },
                    undefined,
                    (error) => {
                        console.error(`Error loading ${type} texture:`, path, error);
                    }
                );
            } catch (error) {
                console.error(`Critical error loading ${type} texture:`, path, error);
            }
        } else {
            return loader.load(
                path,
                (texture) => {
                    console.log(`${type} texture loaded successfully:`, path);
                },
                undefined,
                (error) => {
                    console.error(`Error loading ${type} texture:`, path, error);
                }
            );
        }
    }


    createPaths() {
        // Cria caminhos de pedra pela vila
        const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

        const paths = [
            { size: [2, 40, 0.1], position: [0, 0.01, 0] }, // Caminho principal
            { size: [2, 10, 0.1], position: [-10, 0.01, 15] }, // Caminho lateral esquerdo
            { size: [2, 10, 0.1], position: [10, 0.01, -15] }, // Caminho lateral direito
        ];

        paths.forEach(({ size, position }) => {
            const path = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[2], size[1]), pathMaterial);
            path.rotation.x = -Math.PI / 2;
            path.position.set(position[0], position[1], position[2]);
            this.scene.add(path);
        });
    }

    createHouses() {
        const houseMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

        const houses = [
            { size: [6, 4, 6], position: [-12, 2, 12] }, // Casa 1
            { size: [6, 4, 6], position: [12, 2, -12] }, // Casa 2
        ];

        houses.forEach(({ size, position }) => {
            const house = new THREE.Mesh(new THREE.BoxGeometry(...size), houseMaterial);
            house.castShadow = true;
            house.position.set(...position);
            this.scene.add(house);

            // Adiciona corpo físico para a casa
            const houseBody = new Body({
                mass: 0, // Estático
                position: new Vec3(...position),
                shape: new Box(new Vec3(size[0] / 2, size[1] / 2, size[2] / 2)), // Tamanho da casa
            });
            this.physicsWorld.addBody(houseBody);
            this.obstacles.push(houseBody); // Adiciona à lista de obstáculos

            const roof = new THREE.Mesh(
                new THREE.ConeGeometry(4, 3, 4),
                new THREE.MeshStandardMaterial({ color: 0x8b0000 })
            );
            roof.position.set(position[0], position[1] + 3, position[2]);
            roof.castShadow = true;
            this.scene.add(roof);
        });
    }

    createTrees() {
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });

        for (let i = 0; i < 10; i++) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6), trunkMaterial);
            trunk.position.set(Math.random() * 40 - 20, 1, Math.random() * 40 - 20);
            trunk.castShadow = true;
            this.scene.add(trunk);

             // Adiciona corpo físico para o tronco
              // Adiciona corpo físico para o tronco
            const trunkBody = new Body({
                mass: 0, // Estático
                position: new Vec3(trunk.position.x, trunk.position.y + 3, trunk.position.z),
                shape: new Box(new Vec3(0.5, 3, 0.5)), // Tamanho do tronco
            });
            this.physicsWorld.addBody(trunkBody);
            this.obstacles.push(trunkBody); // Adiciona à lista de obstáculos

            const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), foliageMaterial);
            foliage.position.set(trunk.position.x, trunk.position.y + 3, trunk.position.z);
            foliage.castShadow = true;
            this.scene.add(foliage);
        }
    }

    convertWorldToGrid(position) {
        const gridX = Math.floor((position.x + this.limits.maxX) / (this.limits.maxX * 2) * this.pathfinding.grid.width);
        const gridZ = Math.floor((position.z + this.limits.maxZ) / (this.limits.maxZ * 2) * this.pathfinding.grid.height);
        return { x: gridX, z: gridZ };
    }
    
    convertGridToWorld(gridPosition) {
        const worldX = (gridPosition.x / this.pathfinding.grid.width) * (this.limits.maxX * 2) - this.limits.maxX;
        const worldZ = (gridPosition.z / this.pathfinding.grid.height) * (this.limits.maxZ * 2) - this.limits.maxZ;
        return new THREE.Vector3(worldX, 0, worldZ);
    }

    createFences() {
        const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 });

        for (let i = -20; i <= 20; i += 2) {
            const fencePost = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1), fenceMaterial);
            fencePost.position.set(i, 0.5, -20);
            this.scene.add(fencePost);

            // Adiciona corpo físico para o poste da cerca
            const fencePostBody = new Body({
                mass: 0, // Estático
                position: new Vec3(i, 0.5, -20),
                shape: new Box(new Vec3(0.2, 0.5, 0.2)), // Tamanho do poste
            });
            this.physicsWorld.addBody(fencePostBody);
            this.obstacles.push(fencePostBody); // Adiciona à lista de obstáculos

            const fencePostZ = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1), fenceMaterial);
            fencePostZ.position.set(-20, 0.5, i);
            this.scene.add(fencePostZ);

            // Adiciona corpo físico para o poste da cerca na direção Z
            const fencePostZBody = new Body({
                mass: 0, // Estático
                position: new Vec3(-20, 0.5, i),
                shape: new Box(new Vec3(0.2, 0.5, 0.2)), // Tamanho do poste
            });
            this.physicsWorld.addBody(fencePostZBody);
            this.obstacles.push(fencePostZBody); // Adiciona à lista de obstáculos
        }
    }

    checkCollisions(player) {
        for (const obstacle of this.obstacles) {
            const distance = obstacle.position.distanceTo(player.position);

            if (distance < 1) {
                // console.log("Collision detected!");
            }
        }
    }

    getLimits() {
        return {
            minX: -this.ground.geometry.parameters.width / 2,
            maxX: this.ground.geometry.parameters.width / 2,
            minZ: -this.ground.geometry.parameters.height / 2,
            maxZ: this.ground.geometry.parameters.height / 2,
        };
    }

    getPhysicsWorld() {
        // Atualiza o debugger
        this.cannonDebugger.update();
        return this.physicsWorld;
    }
}

export default Map;
