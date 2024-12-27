import * as THREE from 'three';

class Camera {
    constructor(player) {
        this.player = player; // Referência ao jogador para seguir
        this.camera = new THREE.PerspectiveCamera(
            75, // Campo de visão
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Distância mínima de renderização
            1000 // Distância máxima de renderização
        );

        // Posição inicial
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(this.player.position);

        // Adiciona controles de zoom e rotação
        this.initZoom();
        this.initRotation();
    }

    // Atualiza a posição da câmera para seguir o jogador
    followPlayer() {
        this.camera.position.x = this.player.position.x;
        this.camera.position.z = this.player.position.z + 3; // Distância atrás do jogador
        this.camera.position.y = 10; // Altura fixa
        this.camera.lookAt(this.player.position);
    }

    // Controle de zoom usando o scroll do mouse
    initZoom() {
        window.addEventListener('wheel', (event) => {
            const delta = Math.sign(event.deltaY); // Direção do scroll
            this.camera.fov += delta * 2; // Ajusta o zoom
            // this.camera.fov = Math.max(20, Math.min(75, this.camera.fov)); // Limites
            this.camera.updateProjectionMatrix(); // Atualiza a matriz da câmera
        });
    }

    // Controle de rotação com o mouse
    initRotation() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        window.addEventListener('mousedown', () => (isDragging = true));
        window.addEventListener('mouseup', () => (isDragging = false));
        window.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaMove = {
                    x: event.offsetX - previousMousePosition.x,
                    y: event.offsetY - previousMousePosition.y
                };

                const rotationSpeed = 0.005; // Ajuste conforme necessário
                this.camera.position.x -= deltaMove.x * rotationSpeed;
                this.camera.position.z -= deltaMove.y * rotationSpeed;
                this.camera.lookAt(this.player.position);
            }
            previousMousePosition = {
                x: event.offsetX,
                y: event.offsetY
            };
        });
    }

    // Atualiza a câmera no loop de animação
    update() {
        this.followPlayer();
    }
}

export default Camera;
