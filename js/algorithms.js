/**
 * Clase que implementa los algoritmos de grafos
 */
class GraphAlgorithms {
    constructor(graph) {
        this.graph = graph;
    }

    /**
     * Búsqueda en Profundidad (DFS)
     */
    dfs(startNodeId, targetNodeId = null) {
        // Verificar que el nodo inicial existe
        if (!this.graph.getNode(startNodeId)) {
            throw new Error(`El nodo inicial '${startNodeId}' no existe`);
        }

        // Verificar que el nodo objetivo existe si se especifica
        if (targetNodeId && !this.graph.getNode(targetNodeId)) {
            throw new Error(`El nodo objetivo '${targetNodeId}' no existe`);
        }

        const visited = new Set();
        const visitOrder = [];
        const parent = new Map();
        let found = false;

        // Función DFS iterativa optimizada para orden consistente
        const dfsIterative = () => {
            const stack = [startNodeId];
            parent.set(startNodeId, null);

            while (stack.length > 0) {
                const currentNode = stack.pop();
                
                if (visited.has(currentNode)) {
                    continue;
                }

                visited.add(currentNode);
                visitOrder.push(currentNode);

                // Si estamos buscando un nodo específico y lo encontramos
                if (targetNodeId && currentNode === targetNodeId) {
                    found = true;
                    break;
                }

                // Obtener vecinos y ordenarlos para DFS consistente
                const neighbors = this.graph.getNeighbors(currentNode);
                // Para DFS: ordenamiento por ID numérico, luego reverse para stack
                neighbors.sort((a, b) => {
                    // Extraer el número completo del ID (ej: "S10" -> 10, "Node5" -> 5)
                    const getNum = (id) => {
                        const match = id.match(/(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    };
                    
                    const numA = getNum(a);
                    const numB = getNum(b);
                    
                    if (numA !== numB) {
                        return numA - numB; // Orden ascendente por número
                    }
                    return a.localeCompare(b); // Fallback alfabético
                });
                
                // Para DFS con stack, agregamos en orden reverso para mantener el orden correcto
                for (let i = neighbors.length - 1; i >= 0; i--) {
                    const neighbor = neighbors[i];
                    if (!visited.has(neighbor)) {
                        stack.push(neighbor);
                        // Solo establecer parent si no está ya establecido
                        if (!parent.has(neighbor)) {
                            parent.set(neighbor, currentNode);
                        }
                    }
                }
            }
        };

        // Ejecutar DFS
        dfsIterative();

        // Construir la ruta si se encontró el nodo objetivo
        let finalPath = [];
        let distance = -1;

        if (targetNodeId) {
            if (found) {
                finalPath = this.reconstructPath(parent, startNodeId, targetNodeId);
                distance = finalPath.length > 0 ? finalPath.length - 1 : -1;
            }
        } else {
            // Para DFS completo sin objetivo, la "ruta" es el orden de visita
            finalPath = [...visitOrder];
            distance = finalPath.length > 0 ? finalPath.length - 1 : 0;
        }

        return {
            algorithm: 'DFS',
            startNode: startNodeId,
            targetNode: targetNodeId,
            visitOrder: visitOrder,
            path: finalPath,
            found: targetNodeId ? found : true,
            distance: distance,
            isComplete: !targetNodeId, // Indica si es un recorrido completo
            statistics: {
                nodesVisited: visited.size,
                totalNodes: this.graph.nodes.size,
                pathLength: finalPath.length,
                searchType: targetNodeId ? 'targeted' : 'complete'
            }
        };
    }

    /**
     * Búsqueda en Amplitud (BFS)
     */
    bfs(startNodeId, targetNodeId = null) {
        const visited = new Set();
        const queue = [startNodeId];
        const visitOrder = [];
        const parent = new Map();
        const distance = new Map();

        visited.add(startNodeId);
        distance.set(startNodeId, 0);
        parent.set(startNodeId, null);

        let found = false;

        while (queue.length > 0) {
            const currentNode = queue.shift();
            visitOrder.push(currentNode);

            if (targetNodeId && currentNode === targetNodeId) {
                found = true;
                break;
            }

            const neighbors = this.graph.getNeighbors(currentNode);
            // Para BFS: ordenamiento por ID numérico ascendente
            neighbors.sort((a, b) => {
                // Extraer el número completo del ID (ej: "S10" -> 10, "Node5" -> 5)
                const getNum = (id) => {
                    const match = id.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                };
                
                const numA = getNum(a);
                const numB = getNum(b);
                
                if (numA !== numB) {
                    return numA - numB; // Orden ascendente por número
                }
                return a.localeCompare(b); // Fallback alfabético
            });

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    parent.set(neighbor, currentNode);
                    distance.set(neighbor, distance.get(currentNode) + 1);
                    queue.push(neighbor);
                }
            }
        }

        // Construir la ruta si se encontró el nodo objetivo
        let finalPath = [];
        let shortestDistance = -1;

        if (targetNodeId && found) {
            finalPath = this.reconstructPath(parent, startNodeId, targetNodeId);
            shortestDistance = distance.get(targetNodeId);
        } else if (!targetNodeId) {
            finalPath = visitOrder; // Para BFS completo, devolver orden de visita
        }

        return {
            algorithm: 'BFS',
            startNode: startNodeId,
            targetNode: targetNodeId,
            visitOrder: visitOrder,
            path: finalPath,
            found: targetNodeId ? found : true,
            distance: shortestDistance,
            distances: Object.fromEntries(distance),
            statistics: {
                nodesVisited: visited.size,
                totalNodes: this.graph.nodes.size,
                pathLength: finalPath.length
            }
        };
    }

    /**
     * Algoritmo de Kruskal para Árbol de Expansión Mínima
     */
    kruskal() {
        if (!this.graph.isWeighted) {
            throw new Error('El algoritmo de Kruskal requiere un grafo ponderado');
        }

        // Obtener todas las aristas y ordenarlas por peso
        const edges = this.graph.getEdges()
            .map(edge => ({
                ...edge,
                weight: parseFloat(edge.weight)
            }))
            .sort((a, b) => a.weight - b.weight);

        const mstEdges = [];
        const unionFind = new UnionFind(Array.from(this.graph.nodes.keys()));
        const steps = [];
        let totalWeight = 0;

        for (const edge of edges) {
            const step = {
                edge: edge,
                action: 'considering',
                currentMST: [...mstEdges]
            };

            if (!unionFind.connected(edge.source, edge.target)) {
                unionFind.union(edge.source, edge.target);
                mstEdges.push(edge);
                totalWeight += edge.weight;
                step.action = 'added';
                step.reason = 'No forma ciclo';
            } else {
                step.action = 'rejected';
                step.reason = 'Formaría un ciclo';
            }

            step.currentMST = [...mstEdges];
            steps.push(step);

            // Si tenemos n-1 aristas, hemos terminado
            if (mstEdges.length === this.graph.nodes.size - 1) {
                break;
            }
        }

        return {
            algorithm: 'Kruskal',
            mstEdges: mstEdges,
            totalWeight: totalWeight,
            steps: steps,
            statistics: {
                originalEdges: edges.length,
                mstEdges: mstEdges.length,
                totalNodes: this.graph.nodes.size,
                efficiency: this.graph.nodes.size > 1 ? 
                    (mstEdges.length / (this.graph.nodes.size - 1)) * 100 : 0
            }
        };
    }

    /**
     * Algoritmo de Prim para Árbol de Expansión Mínima
     */
    prim(startNodeId = null) {
        if (!this.graph.isWeighted) {
            throw new Error('El algoritmo de Prim requiere un grafo ponderado');
        }

        const nodes = Array.from(this.graph.nodes.keys());
        if (nodes.length === 0) {
            return { mstEdges: [], totalWeight: 0, steps: [] };
        }

        if (!startNodeId) {
            startNodeId = nodes[0];
        }

        const inMST = new Set([startNodeId]);
        const mstEdges = [];
        const steps = [];
        let totalWeight = 0;

        while (inMST.size < nodes.length) {
            let minEdge = null;
            let minWeight = Infinity;

            // Encontrar la arista de menor peso que conecte el MST con un nodo fuera del MST
            for (const nodeInMST of inMST) {
                const neighbors = this.graph.getNeighbors(nodeInMST);
                
                for (const neighbor of neighbors) {
                    if (!inMST.has(neighbor)) {
                        const weight = this.graph.getEdgeWeight(nodeInMST, neighbor);
                        if (weight < minWeight) {
                            minWeight = weight;
                            
                            // Encontrar la arista correspondiente
                            for (const edge of this.graph.getEdges()) {
                                if ((edge.source === nodeInMST && edge.target === neighbor) ||
                                    (!this.graph.isDirected && edge.source === neighbor && edge.target === nodeInMST)) {
                                    minEdge = edge;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            if (minEdge) {
                mstEdges.push(minEdge);
                totalWeight += minWeight;
                
                const newNode = inMST.has(minEdge.source) ? minEdge.target : minEdge.source;
                inMST.add(newNode);

                steps.push({
                    edge: minEdge,
                    action: 'added',
                    newNode: newNode,
                    currentMST: [...mstEdges],
                    nodesInMST: [...inMST]
                });
            } else {
                // No se puede continuar (grafo no conexo)
                break;
            }
        }

        return {
            algorithm: 'Prim',
            startNode: startNodeId,
            mstEdges: mstEdges,
            totalWeight: totalWeight,
            steps: steps,
            statistics: {
                totalNodes: this.graph.nodes.size,
                mstEdges: mstEdges.length,
                nodesReached: inMST.size,
                isComplete: inMST.size === nodes.length,
                efficiency: this.graph.nodes.size > 1 ? 
                    (mstEdges.length / (this.graph.nodes.size - 1)) * 100 : 0
            }
        };
    }

    /**
     * Encuentra el camino más corto entre dos nodos usando BFS
     */
    shortestPath(startNodeId, targetNodeId) {
        const bfsResult = this.bfs(startNodeId, targetNodeId);
        
        return {
            algorithm: 'Shortest Path (BFS)',
            startNode: startNodeId,
            targetNode: targetNodeId,
            path: bfsResult.path,
            distance: bfsResult.distance,
            found: bfsResult.found,
            hops: bfsResult.distance
        };
    }

    /**
     * Verifica si existe un camino entre dos nodos
     */
    hasPath(startNodeId, targetNodeId) {
        const bfsResult = this.bfs(startNodeId, targetNodeId);
        return {
            hasPath: bfsResult.found,
            path: bfsResult.path,
            distance: bfsResult.distance
        };
    }

    /**
     * Calcula las distancias mínimas desde un nodo a todos los demás
     */
    shortestDistances(startNodeId) {
        const bfsResult = this.bfs(startNodeId);
        return {
            startNode: startNodeId,
            distances: bfsResult.distances,
            reachableNodes: Object.keys(bfsResult.distances).length
        };
    }

    /**
     * Compara los resultados de Kruskal y Prim
     */
    compareMST() {
        try {
            const kruskalResult = this.kruskal();
            const primResult = this.prim();

            const comparison = {
                algorithms: ['Kruskal', 'Prim'],
                results: {
                    kruskal: kruskalResult,
                    prim: primResult
                },
                comparison: {
                    sameWeight: Math.abs(kruskalResult.totalWeight - primResult.totalWeight) < 0.001,
                    kruskalWeight: kruskalResult.totalWeight,
                    primWeight: primResult.totalWeight,
                    kruskalEdges: kruskalResult.mstEdges.length,
                    primEdges: primResult.mstEdges.length,
                    identical: this.areMSTsIdentical(kruskalResult.mstEdges, primResult.mstEdges)
                }
            };

            return comparison;
        } catch (error) {
            throw new Error(`Error al comparar MST: ${error.message}`);
        }
    }

    /**
     * Verifica si dos MSTs son idénticos
     */
    areMSTsIdentical(edges1, edges2) {
        if (edges1.length !== edges2.length) {
            return false;
        }

        const normalize = (edge) => {
            return `${Math.min(edge.source, edge.target)}-${Math.max(edge.source, edge.target)}-${edge.weight}`;
        };

        const set1 = new Set(edges1.map(normalize));
        const set2 = new Set(edges2.map(normalize));

        if (set1.size !== set2.size) {
            return false;
        }

        for (const edge of set1) {
            if (!set2.has(edge)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Reconstruye un camino desde el mapa de padres
     */
    reconstructPath(parent, start, end) {
        const path = [];
        let current = end;

        while (current !== null) {
            path.unshift(current);
            current = parent.get(current);
        }

        return path[0] === start ? path : [];
    }

    /**
     * Detecta todos los ciclos en el grafo
     */
    detectCycles() {
        const visited = new Set();
        const cycles = [];
        
        const dfsForCycles = (node, path, parent) => {
            visited.add(node);
            path.push(node);
            
            const neighbors = this.graph.getNeighbors(node);
            
            for (const neighbor of neighbors) {
                if (neighbor === parent && !this.graph.isDirected) {
                    continue; // Evitar volver al padre en grafos no dirigidos
                }
                
                const pathIndex = path.indexOf(neighbor);
                if (pathIndex !== -1) {
                    // Encontramos un ciclo
                    const cycle = path.slice(pathIndex);
                    cycle.push(neighbor); // Cerrar el ciclo
                    cycles.push(cycle);
                } else if (!visited.has(neighbor)) {
                    dfsForCycles(neighbor, [...path], node);
                }
            }
        };
        
        for (const nodeId of this.graph.nodes.keys()) {
            if (!visited.has(nodeId)) {
                dfsForCycles(nodeId, [], null);
            }
        }
        
        return cycles;
    }

    /**
     * Análisis de conectividad del grafo
     */
    connectivityAnalysis() {
        const components = [];
        const visited = new Set();
        
        for (const nodeId of this.graph.nodes.keys()) {
            if (!visited.has(nodeId)) {
                const component = [];
                const stack = [nodeId];
                
                while (stack.length > 0) {
                    const current = stack.pop();
                    if (visited.has(current)) continue;
                    
                    visited.add(current);
                    component.push(current);
                    
                    const neighbors = this.graph.getNeighbors(current);
                    for (const neighbor of neighbors) {
                        if (!visited.has(neighbor)) {
                            stack.push(neighbor);
                        }
                    }
                }
                
                components.push(component);
            }
        }
        
        return {
            isConnected: components.length <= 1,
            componentCount: components.length,
            components: components,
            largestComponent: components.reduce((largest, current) => 
                current.length > largest.length ? current : largest, [])
        };
    }
}

/**
 * Estructura de datos Union-Find para el algoritmo de Kruskal
 */
class UnionFind {
    constructor(elements) {
        this.parent = new Map();
        this.rank = new Map();
        
        for (const element of elements) {
            this.parent.set(element, element);
            this.rank.set(element, 0);
        }
    }
    
    find(element) {
        if (this.parent.get(element) !== element) {
            this.parent.set(element, this.find(this.parent.get(element)));
        }
        return this.parent.get(element);
    }
    
    union(element1, element2) {
        const root1 = this.find(element1);
        const root2 = this.find(element2);
        
        if (root1 === root2) return;
        
        const rank1 = this.rank.get(root1);
        const rank2 = this.rank.get(root2);
        
        if (rank1 < rank2) {
            this.parent.set(root1, root2);
        } else if (rank1 > rank2) {
            this.parent.set(root2, root1);
        } else {
            this.parent.set(root2, root1);
            this.rank.set(root1, rank1 + 1);
        }
    }
    
    connected(element1, element2) {
        return this.find(element1) === this.find(element2);
    }
}