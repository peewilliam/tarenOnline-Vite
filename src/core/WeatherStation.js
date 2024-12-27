import * as THREE from 'three';

class WeatherStation {
    constructor(scene, renderer, player, totalCycleDuration) {
        this.scene = scene;
        this.renderer = renderer;
        this.player = player;

        // Configurações de ciclo dia/noite
        this.totalCycleDuration = totalCycleDuration;

        // Inicializa o relógio do jogo
        this.currentTime = 0;
        this.currentHour = 6; // Hora inicial no ciclo
        this.clockElement = this.createClockHUD();

        // Configuração inicial do Sol
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 300;
        this.scene.add(this.sunLight);

        // Luz de lua para a noite
        this.moonLight = new THREE.DirectionalLight(0x113355, 0.3); // Azul escuro fraco
        this.scene.add(this.moonLight);

        // Luz ambiente dinâmica
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Luz ambiente inicial
        this.scene.add(this.ambientLight);

        // Luz de foco no jogador
        this.spotLight = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 6, 0.5);
        this.spotLight.castShadow = true;
        this.scene.add(this.spotLight);
        this.scene.add(this.spotLight.target);

        // Plano de fundo dinâmico
        this.backgroundColorDay = new THREE.Color(0x87ceeb); // Céu azul claro
        this.backgroundColorNight = new THREE.Color(0x0b1d36); // Céu noturno azul escuro
        this.renderer.setClearColor(this.backgroundColorDay);

        // Variáveis de controle do sol
        this.sunSpeed = (Math.PI * 2) / this.totalCycleDuration;
        this.sunRadius = 100; // Raio da órbita do sol
        this.sunHeight = 50; // Altura máxima do sol

        // Configuração inicial da luminosidade por hora
        this.hourlyLuminosity = Array(24).fill(0);
        this.setDayNightRatio(70, 30); // Define 50% dia e 50% noite por padrão

        // Criar botões de controle para testes
        this.createWeatherControls();
        this.createClouds()
    }

    createRain() {
        const rainGeometry = new THREE.BufferGeometry();
        const rainCount = 1000;
        const positions = [];
        const velocities = [];
    
        for (let i = 0; i < rainCount; i++) {
            positions.push(
                Math.random() * 200 - 100, // X: dentro de um quadrado 200x200
                Math.random() * 100 + 50, // Y: altura inicial (acima do jogador)
                Math.random() * 200 - 100 // Z
            );
            velocities.push(Math.random() * 0.5 + 0.2); // Velocidade de cada partícula
        }
    
        rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        rainGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));
    
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.2,
            transparent: true,
            opacity: 0.6,
        });
    
        this.rainParticles = new THREE.Points(rainGeometry, rainMaterial);
        this.scene.add(this.rainParticles);
    }
    
    updateRain() {
        if (!this.rainParticles) return;
    
        const positions = this.rainParticles.geometry.attributes.position.array;
        const velocities = this.rainParticles.geometry.attributes.velocity.array;
    
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= velocities[i / 3]; // Move Y para baixo
    
            // Reinicia a posição da partícula se ela sair do campo de visão
            if (positions[i + 1] < 0) {
                positions[i + 1] = Math.random() * 100 + 50;
                positions[i] = Math.random() * 200 - 100;
                positions[i + 2] = Math.random() * 200 - 100;
            }
        }
    
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    enableRain() {
        if (!this.rainParticles) {
            this.createRain();
        }
        // this.setRainyGround();
    }
    
    disableRain() {
        if (this.rainParticles) {
            this.scene.remove(this.rainParticles);
            this.rainParticles.geometry.dispose();
            this.rainParticles.material.dispose();
            this.rainParticles = null;
        }
        this.restoreGround();
    }
    

    setDayNightRatio(dayPercentage, nightPercentage) {
        const totalHours = 24;
        const dayHours = Math.round((dayPercentage / 100) * totalHours);
        const nightHours = totalHours - dayHours;

        this.hourlyLuminosity = Array(24).fill(0);

        // Preenche as horas do dia com luminosidade crescente e decrescente
        for (let i = 0; i < dayHours / 2; i++) {
            this.hourlyLuminosity[i] = i / (dayHours / 2);
            this.hourlyLuminosity[23 - i] = i / (dayHours / 2);
        }

        // Preenche as horas centrais do dia com luminosidade máxima
        for (let i = Math.floor(dayHours / 2); i < totalHours - Math.floor(nightHours / 2); i++) {
            this.hourlyLuminosity[i] = 1;
        }

        // Atualiza a luminosidade para as horas noturnas
        for (let i = 0; i < nightHours / 2; i++) {
            const index = (dayHours / 2 + i) % 24;
            this.hourlyLuminosity[index] = 1 - (i / (nightHours / 2));
            this.hourlyLuminosity[(index + nightHours) % 24] = 1 - (i / (nightHours / 2));
        }

        // Atualiza a exibição das porcentagens
        this.updateDayNightDisplay(dayPercentage, nightPercentage);
    }

    update(deltaTime) {
        // Atualiza o tempo do ciclo
        this.currentTime += deltaTime;

        if (this.currentTime > this.totalCycleDuration) {
            this.currentTime = 0; // Reinicia o ciclo
        }

        // Calcula o horário atual do jogo
        const gameTime = this.currentTime / this.totalCycleDuration * 24;
        this.currentHour = Math.floor(gameTime);
        this.updateClockHUD();

        this.updateClouds()

        // Define a intensidade da luz com base na hora atual
        const luminosity = this.hourlyLuminosity[this.currentHour];
        this.updateLighting(luminosity);

        // Calcula a posição do sol com base no tempo
        const angle = (this.currentTime / this.totalCycleDuration) * Math.PI * 2;
        const sunY = Math.sin(angle) * this.sunHeight;
        const sunX = Math.cos(angle) * this.sunRadius;
        const sunZ = Math.sin(angle) * this.sunRadius;

        this.sunLight.position.set(sunX, sunY, sunZ);
        this.sunLight.target.position.set(0, 0, 0);
        this.sunLight.target.updateMatrixWorld();

        // Ajusta a iluminação e o fundo com base na luminosidade
        this.sunLight.intensity = luminosity;
        this.ambientLight.intensity = luminosity * 0.5;
        this.moonLight.intensity = 1 - luminosity; // Complementar ao sol

        this.renderer.setClearColor(
            this.backgroundColorDay.clone().lerp(this.backgroundColorNight, 1 - luminosity)
        );

         // Atualiza a chuva
        this.updateRain();
    }

    setRainyGround() {
        if (!this.originalGroundMaterial) {
            this.originalGroundMaterial = this.scene.getObjectByName('ground').material.clone();
        }
    
        const wetMaterial = this.originalGroundMaterial.clone();
        wetMaterial.envMapIntensity = 1.5; // Aumenta reflexos
        wetMaterial.roughness = 0.3; // Chão mais liso
        wetMaterial.metalness = 0.6;
    
        this.scene.getObjectByName('ground').material = wetMaterial;
    }
    
    restoreGround() {
        if (this.originalGroundMaterial) {
            this.scene.getObjectByName('ground').material = this.originalGroundMaterial;
        }
    }

    createClouds() {
        const textureLoader = new THREE.TextureLoader();
        const cloudTexture = textureLoader.load(
            '/assets/world/textures/cloud/cloud.png',
            (texture) => console.log('cloud texture loaded:', texture),
            undefined,
            (error) => console.error('Error loading cloud texture:', error)
        );
        const cloudMaterial = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: 0.8 });
        this.clouds = [];
    
        for (let i = 0; i < 10; i++) {
            const cloud = new THREE.Sprite(cloudMaterial);
            cloud.position.set(
                Math.random() * 400 - 200,
                Math.random() * 100 + 50,
                Math.random() * 400 - 200
            );
            cloud.scale.set(50, 50, 1);
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }

    
    }
    
    updateClouds(deltaTime) {
        if (!this.clouds) return;
    
        this.clouds.forEach(cloud => {
            cloud.position.x += deltaTime * 5;
            if (cloud.position.x > 200) {
                cloud.position.x = -200;
            }
        });
    }

    updateLighting(luminosity) {
        const targetSunIntensity = luminosity;
        const targetMoonIntensity = 1 - luminosity;
    
        // Interpolação suave
        this.sunLight.intensity += (targetSunIntensity - this.sunLight.intensity) * 0.1;
        this.moonLight.intensity += (targetMoonIntensity - this.moonLight.intensity) * 0.1;
        this.ambientLight.intensity += (luminosity * 0.5 - this.ambientLight.intensity) * 0.1;
    }
    

    createClockHUD() {
        const clockContainer = document.createElement('div');
        clockContainer.style.position = 'absolute';
        clockContainer.style.top = '10px';
        clockContainer.style.left = '50%';
        clockContainer.style.transform = 'translateX(-50%)';
        clockContainer.style.color = 'white';
        clockContainer.style.fontFamily = 'Arial, sans-serif';
        clockContainer.style.fontSize = '15px';
        clockContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        clockContainer.style.padding = '5px 10px';
        clockContainer.style.borderRadius = '5px';
        document.body.appendChild(clockContainer);

        clockContainer.innerHTML = `
            <div id="game-clock">06:00 AM</div>
            <div id="weather-controls" style="margin-top: 10px;">
            <button id="enable-rain">Chuva</button>
                <button id="disable-rain">Sem Chuva</button>
                <input type="range" id="time-slider" min="0" max="24" value="0" step="0.1" style="width: 50%; margin-top: 10px;">
                
            </div>
            <div id="day-night-info" style="margin-top: 10px;">
                <span id="day-percentage">Dia: 50%</span>
                <span id="night-percentage" style="margin-left: 10px;">Noite: 50%</span>
            </div>
        `;

        const slider = clockContainer.querySelector('#time-slider');
        slider.addEventListener('input', (event) => {
            const selectedTime = parseFloat(event.target.value);
            this.currentTime = (selectedTime / 24) * this.totalCycleDuration;
        });

        this.clockElement = clockContainer.querySelector('#game-clock');
        return this.clockElement;
    }

    updateDayNightDisplay(dayPercentage, nightPercentage) {
        const dayElement = document.getElementById('day-percentage');
        const nightElement = document.getElementById('night-percentage');
    
        const daySeconds = Math.round((dayPercentage / 100) * this.totalCycleDuration);
        const nightSeconds = this.totalCycleDuration - daySeconds;
    
        if (dayElement && nightElement) {
            dayElement.textContent = `Dia:  ${daySeconds/60}m`;
            nightElement.textContent = `Noite: ${nightSeconds/60}m`;
        }
    }
    

    createWeatherControls() {
        document.getElementById('enable-rain').addEventListener('click', () => {
            this.enableRain();
        });

        document.getElementById('disable-rain').addEventListener('click', () => {
            this.disableRain();
        });
    }

    updateClockHUD() {
        const hours = this.currentHour.toString().padStart(2, '0');
        const minutes = Math.floor((this.currentTime % (this.totalCycleDuration / 24)) * 60 / (this.totalCycleDuration / 24)).toString().padStart(2, '0');
        const period = this.currentHour < 12 ? 'AM' : 'PM';
        this.clockElement.innerHTML = `${hours}:${minutes} ${period}`;
    }
}

export default WeatherStation;
