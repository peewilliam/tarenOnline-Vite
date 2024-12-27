import { io } from 'socket.io-client';

class SocketManager {
    constructor() {
        this.socket = io('http://localhost:3000');
        this.players = {};
        this.setupListeners();
    }

    setupListeners() {

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('playerUpdate', (data) => {
            console.log('Player data:', data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on("playerMoved", (data) => {
            if (!this.players[data.id]) {
                this.players[data.id] = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial({ color: 0xff0000 })
                );
                scene.add(this.players[data.id]);
            }
            this.players[data.id].position.set(data.position.x, data.position.y, data.position.z);
        });

        this.socket.on("playerDisconnected", (id) => {
            if (this.players[id]) {
                scene.remove(this.players[id]);
                delete this.players[id];
            }
        });
    }

    send(event, data) {
        this.socket.emit(event, data);
    }

    sendMove(position) {
        this.socket.emit("move", position);
    }
}

export default new SocketManager();
