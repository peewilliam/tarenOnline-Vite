import * as THREE from 'three';

class Renderer {
    constructor(scene, camera) {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance", // Prioriza o uso da GPU
            alpha: false, // Desativa transparência para melhor desempenho
            precision: "highp", // Alta precisão para shaders
            logarithmicDepthBuffer: true, // Melhor precisão de profundidade em grandes escalas
        });

        

        // Configura o tamanho do renderizador para a janela
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Ativa o mapeamento de sombras
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombra de alta qualidade

        // Adiciona o canvas à página
        document.body.appendChild(this.renderer.domElement);

        // Configura o evento de redimensionamento
        window.addEventListener('resize', () => {
            this.onWindowResize(camera);
        });
    }

    onWindowResize(camera) {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    getRenderer() {
        return this.renderer;
    }
}

export default Renderer;
