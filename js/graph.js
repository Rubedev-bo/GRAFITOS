/**
 * Clase principal para representar y manipular grafos
 */
class Graph {
    constructor() {
        this.nodes = new Map(); // Map<id, {id, label, x, y, data}>
        this.edges = new Map(); // Map<id, {id, source, target, weight, label, directed}>
        this.isDirected = false;
        this.isWeighted = false;
        this.nodeIdCounter = 1;
        this.edgeIdCounter = 1;
    }

    /**
     * Configura el tipo de grafo
     */
    setGraphType(directed = false, weighted = false) {
        this.isDirected = directed;
        this.isWeighted = weighted;
    }

    /**
     * Añade un nodo al grafo
     */
    addNode(id = null, label = '', x = 0, y = 0, data = {}) {
        if (!id) {
            id = `node_${this.nodeIdCounter++}`;
        }
        
        if (this.nodes.has(id)) {
            throw new Error(`El nodo con ID '${id}' ya existe`);
        }

        const node = {
            id,
            label: label || id,
            x,
            y,
            data: { ...data }
        };

        this.nodes.set(id, node);
        return node;
    }

    /**
     * Elimina un nodo del grafo
     */
    removeNode(nodeId) {
        if (!this.nodes.has(nodeId)) {
            return false;
        }

        // Eliminar todas las aristas conectadas a este nodo
        const edgesToRemove = [];
        for (const [edgeId, edge] of this.edges) {
            if (edge.source === nodeId || edge.target === nodeId) {
                edgesToRemove.push(edgeId);
            }
        }

        edgesToRemove.forEach(edgeId => this.edges.delete(edgeId));
        this.nodes.delete(nodeId);
        return true;
    }

    /**
     * Añade una arista al grafo
     */
    addEdge(sourceId, targetId, weight = 1, label = '', id = null) {
        if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
            throw new Error('Los nodos fuente y destino deben existir');
        }

        if (!id) {
            id = `edge_${this.edgeIdCounter++}`;
        }

        // Verificar si ya existe una arista entre estos nodos
        if (!this.isDirected) {
            for (const [existingId, edge] of this.edges) {
                if ((edge.source === sourceId && edge.target === targetId) ||
                    (edge.source === targetId && edge.target === sourceId)) {
                    throw new Error('Ya existe una arista entre estos nodos');
                }
            }
        } else {
            for (const [existingId, edge] of this.edges) {
                if (edge.source === sourceId && edge.target === targetId) {
                    throw new Error('Ya existe una arista dirigida entre estos nodos');
                }
            }
        }

        const edge = {
            id,
            source: sourceId,
            target: targetId,
            weight: this.isWeighted ? weight : 1,
            label: label || (this.isWeighted ? weight.toString() : ''),
            directed: this.isDirected
        };

        this.edges.set(id, edge);
        return edge;
    }

    /**
     * Elimina una arista del grafo
     */
    removeEdge(edgeId) {
        return this.edges.delete(edgeId);
    }

    /**
     * Obtiene los vecinos de un nodo
     */
    getNeighbors(nodeId) {
        const neighbors = new Set();
        
        for (const edge of this.edges.values()) {
            if (edge.source === nodeId) {
                neighbors.add(edge.target);
            } else if (!this.isDirected && edge.target === nodeId) {
                neighbors.add(edge.source);
            }
        }
        
        return Array.from(neighbors);
    }

    /**
     * Obtiene las aristas conectadas a un nodo
     */
    getNodeEdges(nodeId) {
        const nodeEdges = [];
        
        for (const edge of this.edges.values()) {
            if (edge.source === nodeId || (!this.isDirected && edge.target === nodeId)) {
                nodeEdges.push(edge);
            }
        }
        
        return nodeEdges;
    }

    /**
     * Obtiene el peso de una arista entre dos nodos
     */
    getEdgeWeight(sourceId, targetId) {
        for (const edge of this.edges.values()) {
            if ((edge.source === sourceId && edge.target === targetId) ||
                (!this.isDirected && edge.source === targetId && edge.target === sourceId)) {
                return edge.weight;
            }
        }
        return Infinity;
    }

    /**
     * Verifica si existe una arista entre dos nodos
     */
    hasEdge(sourceId, targetId) {
        for (const edge of this.edges.values()) {
            if ((edge.source === sourceId && edge.target === targetId) ||
                (!this.isDirected && edge.source === targetId && edge.target === sourceId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Obtiene todos los nodos como array
     */
    getNodes() {
        return Array.from(this.nodes.values());
    }

    /**
     * Obtiene todas las aristas como array
     */
    getEdges() {
        return Array.from(this.edges.values());
    }

    /**
     * Obtiene un nodo por su ID
     */
    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    /**
     * Obtiene una arista por su ID
     */
    getEdge(edgeId) {
        return this.edges.get(edgeId);
    }

    /**
     * Actualiza la posición de un nodo
     */
    updateNodePosition(nodeId, x, y) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.x = x;
            node.y = y;
        }
    }

    /**
     * Actualiza las propiedades de un nodo
     */
    updateNode(nodeId, properties) {
        const node = this.nodes.get(nodeId);
        if (node) {
            Object.assign(node, properties);
        }
    }

    /**
     * Actualiza las propiedades de una arista
     */
    updateEdge(edgeId, properties) {
        const edge = this.edges.get(edgeId);
        if (edge) {
            Object.assign(edge, properties);
        }
    }

    /**
     * Limpia el grafo
     */
    clear() {
        this.nodes.clear();
        this.edges.clear();
        this.nodeIdCounter = 1;
        this.edgeIdCounter = 1;
    }

    /**
     * Crea una copia del grafo
     */
    clone() {
        const newGraph = new Graph();
        newGraph.setGraphType(this.isDirected, this.isWeighted);
        
        // Copiar nodos
        for (const node of this.nodes.values()) {
            newGraph.addNode(node.id, node.label, node.x, node.y, { ...node.data });
        }
        
        // Copiar aristas
        for (const edge of this.edges.values()) {
            newGraph.addEdge(edge.source, edge.target, edge.weight, edge.label, edge.id);
        }
        
        newGraph.nodeIdCounter = this.nodeIdCounter;
        newGraph.edgeIdCounter = this.edgeIdCounter;
        
        return newGraph;
    }

    /**
     * Exporta el grafo a formato JSON
     */
    toJSON() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.edges.values()),
            isDirected: this.isDirected,
            isWeighted: this.isWeighted,
            nodeIdCounter: this.nodeIdCounter,
            edgeIdCounter: this.edgeIdCounter
        };
    }

    /**
     * Importa un grafo desde formato JSON
     */
    fromJSON(json) {
        this.clear();
        
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        
        this.isDirected = data.isDirected || false;
        this.isWeighted = data.isWeighted || false;
        this.nodeIdCounter = data.nodeIdCounter || 1;
        this.edgeIdCounter = data.edgeIdCounter || 1;
        
        // Importar nodos
        if (data.nodes) {
            for (const node of data.nodes) {
                this.nodes.set(node.id, { ...node });
            }
        }
        
        // Importar aristas
        if (data.edges) {
            for (const edge of data.edges) {
                this.edges.set(edge.id, { ...edge });
            }
        }
    }

    /**
     * Calcula estadísticas del grafo
     */
    getStatistics() {
        const nodeCount = this.nodes.size;
        const edgeCount = this.edges.size;
        const maxPossibleEdges = this.isDirected 
            ? nodeCount * (nodeCount - 1) 
            : (nodeCount * (nodeCount - 1)) / 2;
        
        const density = nodeCount > 1 ? (edgeCount / maxPossibleEdges) * 100 : 0;
        
        // Calcular grados de los nodos
        const degrees = new Map();
        for (const nodeId of this.nodes.keys()) {
            degrees.set(nodeId, 0);
        }
        
        for (const edge of this.edges.values()) {
            degrees.set(edge.source, degrees.get(edge.source) + 1);
            if (!this.isDirected) {
                degrees.set(edge.target, degrees.get(edge.target) + 1);
            }
        }
        
        const degreeValues = Array.from(degrees.values());
        const avgDegree = degreeValues.length > 0 
            ? degreeValues.reduce((sum, degree) => sum + degree, 0) / degreeValues.length 
            : 0;
        
        return {
            nodeCount,
            edgeCount,
            density: Math.round(density * 100) / 100,
            averageDegree: Math.round(avgDegree * 100) / 100,
            maxDegree: Math.max(...degreeValues, 0),
            minDegree: Math.min(...degreeValues, Infinity) === Infinity ? 0 : Math.min(...degreeValues),
            isConnected: this.isConnected(),
            hasCycles: this.hasCycles()
        };
    }

    /**
     * Verifica si el grafo es conexo
     */
    isConnected() {
        if (this.nodes.size <= 1) return true;
        
        const visited = new Set();
        const stack = [this.nodes.keys().next().value];
        
        while (stack.length > 0) {
            const nodeId = stack.pop();
            if (visited.has(nodeId)) continue;
            
            visited.add(nodeId);
            const neighbors = this.getNeighbors(nodeId);
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    stack.push(neighbor);
                }
            }
        }
        
        return visited.size === this.nodes.size;
    }

    /**
     * Verifica si el grafo tiene ciclos
     */
    hasCycles() {
        if (this.nodes.size <= 2) return false;
        
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycleDFS = (nodeId, parent = null) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            const neighbors = this.getNeighbors(nodeId);
            
            for (const neighbor of neighbors) {
                if (!this.isDirected && neighbor === parent) continue;
                
                if (!visited.has(neighbor)) {
                    if (hasCycleDFS(neighbor, nodeId)) {
                        return true;
                    }
                } else if (recursionStack.has(neighbor)) {
                    return true;
                }
            }
            
            recursionStack.delete(nodeId);
            return false;
        };
        
        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                if (hasCycleDFS(nodeId)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Genera un grafo aleatorio para pruebas
     */
    generateRandom(nodeCount = 5, edgeProbability = 0.3, weighted = false, directed = false) {
        this.clear();
        this.setGraphType(directed, weighted);
        
        // Generar nodos
        for (let i = 0; i < nodeCount; i++) {
            const id = String.fromCharCode(65 + i); // A, B, C, etc.
            this.addNode(id, id, 
                Math.random() * 400 + 50, 
                Math.random() * 300 + 50
            );
        }
        
        // Generar aristas
        const nodeIds = Array.from(this.nodes.keys());
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = directed ? 0 : i + 1; j < nodeIds.length; j++) {
                if (i !== j && Math.random() < edgeProbability) {
                    try {
                        const weight = weighted ? Math.floor(Math.random() * 10) + 1 : 1;
                        this.addEdge(nodeIds[i], nodeIds[j], weight);
                    } catch (e) {
                        // Ignorar si la arista ya existe
                    }
                }
            }
        }
    }
}