class Hud {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.left = '10px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.fontSize = '16px';
        this.container.innerHTML = 'Vida: 200 | Pontuação: 0';
        document.body.appendChild(this.container);
    }

    update(life, score) {
        this.container.innerHTML = `Vida: ${life} | Pontuação: ${score}`;
    }
}

export default Hud;
