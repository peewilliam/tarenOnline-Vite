import * as THREE from 'three';

class Minimap {
    constructor(scene, player, renderer) {
        this.scene = scene;
        this.player = player;
        this.renderer = renderer;

        // Cria a câmera do minimapa
        const aspect = 1; // Mantém uma proporção quadrada
        this.camera = new THREE.OrthographicCamera(
            -10, 10, 10, -10, 0.1, 100 // Limites do frustum
        );

        // Posiciona a câmera acima da cena
        this.camera.position.set(0, 20, 0); // Vista de cima
        this.camera.lookAt(0, 0, 0); // Aponta para o centro da cena

        // Configura o render target
        this.minimapRenderTarget = new THREE.WebGLRenderTarget(200, 200);

        // Adiciona um canvas para o minimapa
        const minimapCanvas = this.renderer.domElement.cloneNode();
        minimapCanvas.style.position = 'absolute';
        minimapCanvas.style.top = '10px';
        minimapCanvas.style.right = '10px';
        minimapCanvas.style.width = '150px';
        minimapCanvas.style.height = '150px';
        minimapCanvas.style.border = '2px solid white';
        document.body.appendChild(minimapCanvas);

        this.minimapRenderer = new THREE.WebGLRenderer({
            canvas: minimapCanvas,
            antialias: true,
        });
        this.minimapRenderer.setSize(150, 150);
    }

    update() {
        // Centraliza a câmera do minimapa no jogador
        this.camera.position.x = this.player.position.x;
        this.camera.position.z = this.player.position.z;
        this.camera.updateProjectionMatrix();

        // Renderiza a cena no canvas do minimapa
        this.minimapRenderer.render(this.scene, this.camera);
    }
}

export default Minimap;
