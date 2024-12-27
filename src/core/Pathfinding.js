import PF from 'pathfinding';

class Pathfinding {
    constructor(gridSize = { width: 100, height: 100 }) {
        this.grid = new PF.Grid(gridSize.width, gridSize.height); // Cria a grade com as dimensões especificadas
        this.finder = new PF.AStarFinder();
    }

    findPath(start, end) {
        // Verifica e ajusta os limites das coordenadas
        const isWithinBounds = (point) =>
            point.x >= 0 && point.x < this.grid.width &&
            point.z >= 0 && point.z < this.grid.height;
    
        if (!isWithinBounds(start) || !isWithinBounds(end)) {
            console.error(`Coordenadas fora dos limites: start(${start.x}, ${start.z}), end(${end.x}, ${end.z})`);
            return [];
        }
    
        // Calcula o caminho
        const path = this.finder.findPath(start.x, start.z, end.x, end.z, this.grid.clone());
    
        if (path.length === 0) {
            console.warn(`Nenhum caminho encontrado entre start(${start.x}, ${start.z}) e end(${end.x}, ${end.z})`);
        }
    
        return path; // Mantém as coordenadas no formato da grade
    }

    convertWorldToGrid(position) {
        return {
            x: Math.floor(position.x + this.grid.width / 2),
            z: Math.floor(position.z + this.grid.height / 2)
        };
    }
    
    convertGridToWorld(gridPosition) {
        return new THREE.Vector3(
            gridPosition.x - this.grid.width / 2,
            0,
            gridPosition.z - this.grid.height / 2
        );
    }
    

    setObstacle(x, z) {
        const gridX = x + 10; // Ajuste para alinhar com a grade
        const gridZ = z + 10;
    
        // Verifica se as coordenadas estão dentro dos limites
        if (gridX >= 0 && gridX < this.grid.width && gridZ >= 0 && gridZ < this.grid.height) {
            this.grid.setWalkableAt(gridX, gridZ, false);
        } else {
            console.error(`Coordenadas fora do limite da grade: (${gridX}, ${gridZ})`);
        }
    }

    resetGrid(gridSize) {
        this.grid = new PF.Grid(gridSize.width, gridSize.height);
    }
}

export default Pathfinding;
