class AdvancedDebug {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;

        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '170px';
        this.container.style.right = '10px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.fontSize = '12px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.display = 'none'; // Esconde inicialmente
        document.body.appendChild(this.container);

        this.statsVisible = false;

        // Inicializa variáveis para o cálculo do FPS
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.fpsHistory = []; // Para armazenar os FPS
        this.fpsHistoryLength = 60; // Número de frames para calcular a média

        // Ativa/desativa o depurador com F8
        window.addEventListener('keydown', (event) => {
            if (event.key === 'F8') {
                this.toggle();
            }
        });

        this.toggle();
    }

    toggle() {
        this.statsVisible = !this.statsVisible;
        this.container.style.display = this.statsVisible ? 'block' : 'none';
    }

    update() {
        if (!this.statsVisible) return;

        const now = performance.now();
        this.frameCount++;

        // Calcule o FPS com base no tempo decorrido
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Calcule o FPS atual
        const currentFPS = 1000 / deltaTime;

        // Armazene o FPS atual na história
        this.fpsHistory.push(currentFPS);
        if (this.fpsHistory.length > this.fpsHistoryLength) {
            this.fpsHistory.shift(); // Remove o FPS mais antigo
        }

        // Calcule a média do FPS
        this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        const info = this.renderer.info;

        const memory = performance.memory || {};
        const usedMemory = memory.usedJSHeapSize / 1024 / 1024 || 0;
        const totalMemory = memory.totalJSHeapSize / 1024 / 1024 || 0;

        const sceneStats = this.getSceneStats(this.scene);

        this.container.innerHTML = `
            <b>Renderer Info:</b><br>
            - FPS: ${Math.round(this.fps)}<br>
            - Draw Calls: ${info.render.calls}<br>
            - Triangles: ${info.render.triangles}<br>
            - Vertices: ${info.render.vertices}<br>
            - Textures: ${info.memory.textures}<br>
            - Geometries: ${info.memory.geometries}<br>
            <br>
            <b>Memory Usage:</b><br>
            - Used: ${usedMemory.toFixed(2)} MB<br>
            - Total: ${totalMemory.toFixed(2)} MB<br>
            <br>
            <b>Scene Stats:</b><br>
            - Objects: ${sceneStats.objects}<br>
            - Lights: ${sceneStats.lights}<br>
        `;
    }

    getSceneStats(scene) {
        let objects = 0;
        let lights = 0;

        scene.traverse((object) => {
            if (object.isLight) lights++;
            objects++;
        });

        return { objects, lights };
    }
}

export default AdvancedDebug;