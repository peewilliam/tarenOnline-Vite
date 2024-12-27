import Stats from 'stats.js';

class DebugInfo {
    constructor() {
        this.stats = new Stats();
        this.stats.showPanel(0); // Painel 0: FPS
        this.enabled = false;

        // Adiciona o stats ao DOM, mas começa oculto
        this.stats.dom.style.position = 'absolute';
        this.stats.dom.style.top = '0px';
        this.stats.dom.style.left = '0px';
        this.stats.dom.style.display = 'none'; // Esconde inicialmente
        document.body.appendChild(this.stats.dom);

        // Configurar o evento para ativar/desativar com F8
        window.addEventListener('keydown', (event) => {
            if (event.key === 'F8') {
                this.toggle();
            }
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        this.stats.dom.style.display = this.enabled ? 'block' : 'none';
    }

    begin() {
        if (this.enabled) this.stats.begin();
    }

    end() {
        if (this.enabled) this.stats.end();
    }

    showMemoryUsage() {
        if (!this.enabled) return;

        // Obtém informações de memória (apenas Chrome)
        if (performance && performance.memory) {
            const memoryInfo = performance.memory;
            const usedMB = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2);
            const totalMB = (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2);
            console.log(`Memory Usage: ${usedMB} MB / ${totalMB} MB`);
        } else {
            console.warn('Memory API not supported in this browser.');
        }
    }
}

export default DebugInfo;
