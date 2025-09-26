/**
 * Clase para gestionar el historial de grafos y resultados
 */
class GraphHistory {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        this.storageKey = 'graph_history';
        
        this.loadFromStorage();
    }

    /**
     * Guarda el estado actual del grafo en el historial
     */
    saveState(graph, algorithmResults = null, description = '') {
        const state = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            description: description || `Estado ${this.history.length + 1}`,
            graph: graph.toJSON(),
            algorithmResults: algorithmResults,
            statistics: graph.getStatistics(),
            image: null // Se generará cuando sea necesario
        };

        // Si no estamos al final del historial, eliminar estados futuros
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Agregar nuevo estado
        this.history.push(state);
        this.currentIndex = this.history.length - 1;

        // Mantener tamaño máximo del historial
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.saveToStorage();
        return state;
    }

    /**
     * Obtiene el estado anterior en el historial
     */
    getPreviousState() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.history[this.currentIndex];
        }
        return null;
    }

    /**
     * Obtiene el siguiente estado en el historial
     */
    getNextState() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return this.history[this.currentIndex];
        }
        return null;
    }

    /**
     * Obtiene un estado específico por ID
     */
    getState(id) {
        return this.history.find(state => state.id === id);
    }

    /**
     * Obtiene el estado actual
     */
    getCurrentState() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex];
        }
        return null;
    }

    /**
     * Obtiene todos los estados del historial
     */
    getAllStates() {
        return [...this.history];
    }

    /**
     * Elimina un estado específico del historial
     */
    removeState(id) {
        const index = this.history.findIndex(state => state.id === id);
        if (index !== -1) {
            this.history.splice(index, 1);
            
            // Ajustar el índice actual
            if (this.currentIndex >= index) {
                this.currentIndex = Math.max(0, this.currentIndex - 1);
            }
            
            this.saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Limpia todo el historial
     */
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveToStorage();
    }

    /**
     * Verifica si se puede deshacer
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Verifica si se puede rehacer
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Genera una imagen en miniatura del grafo para el historial
     */
    async generateThumbnail(visualization, width = 200, height = 150) {
        try {
            const svgElement = visualization.svg.node();
            const svgData = new XMLSerializer().serializeToString(svgElement);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            
            // Fondo blanco
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            return new Promise((resolve) => {
                img.onload = () => {
                    // Calcular escala para ajustar la imagen
                    const scale = Math.min(width / visualization.width, height / visualization.height);
                    const scaledWidth = visualization.width * scale;
                    const scaledHeight = visualization.height * scale;
                    const x = (width - scaledWidth) / 2;
                    const y = (height - scaledHeight) / 2;
                    
                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                    URL.revokeObjectURL(url);
                    
                    const thumbnail = canvas.toDataURL('image/png');
                    resolve(thumbnail);
                };
                
                img.src = url;
            });
        } catch (error) {
            console.error('Error al generar miniatura:', error);
            return null;
        }
    }

    /**
     * Actualiza la imagen de un estado en el historial
     */
    async updateStateImage(stateId, visualization) {
        const state = this.getState(stateId);
        if (state) {
            const thumbnail = await this.generateThumbnail(visualization);
            state.image = thumbnail;
            this.saveToStorage();
            return thumbnail;
        }
        return null;
    }

    /**
     * Busca estados en el historial
     */
    searchStates(query) {
        const searchTerm = query.toLowerCase();
        return this.history.filter(state => 
            state.description.toLowerCase().includes(searchTerm) ||
            state.timestamp.includes(searchTerm) ||
            (state.algorithmResults && state.algorithmResults.algorithm && 
             state.algorithmResults.algorithm.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * Filtra estados por algoritmo
     */
    filterByAlgorithm(algorithm) {
        return this.history.filter(state => 
            state.algorithmResults && 
            state.algorithmResults.algorithm === algorithm
        );
    }

    /**
     * Filtra estados por rango de fechas
     */
    filterByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.history.filter(state => {
            const stateDate = new Date(state.timestamp);
            return stateDate >= start && stateDate <= end;
        });
    }

    /**
     * Obtiene estadísticas del historial
     */
    getHistoryStatistics() {
        const algorithms = {};
        let totalStates = this.history.length;
        let statesWithResults = 0;
        
        this.history.forEach(state => {
            if (state.algorithmResults) {
                statesWithResults++;
                const algorithm = state.algorithmResults.algorithm;
                algorithms[algorithm] = (algorithms[algorithm] || 0) + 1;
            }
        });
        
        const oldestState = this.history.length > 0 ? this.history[0] : null;
        const newestState = this.history.length > 0 ? this.history[this.history.length - 1] : null;
        
        return {
            totalStates,
            statesWithResults,
            algorithms,
            oldestState: oldestState ? {
                timestamp: oldestState.timestamp,
                description: oldestState.description
            } : null,
            newestState: newestState ? {
                timestamp: newestState.timestamp,
                description: newestState.description
            } : null,
            currentIndex: this.currentIndex
        };
    }

    /**
     * Exporta el historial completo
     */
    exportHistory() {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                type: 'graph_history',
                totalStates: this.history.length
            },
            statistics: this.getHistoryStatistics(),
            history: this.history
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        this.downloadFile(dataStr, `historial_grafos_${this.getTimestamp()}.json`);
        
        return exportData;
    }

    /**
     * Importa historial desde archivo
     */
    importHistory(jsonData, replaceExisting = false) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (data.type !== 'graph_history') {
                throw new Error('El archivo no contiene un historial válido');
            }
            
            if (replaceExisting) {
                this.history = data.history || [];
                this.currentIndex = Math.min(this.currentIndex, this.history.length - 1);
            } else {
                // Agregar al historial existente
                const importedStates = data.history || [];
                importedStates.forEach(state => {
                    // Regenerar ID para evitar conflictos
                    state.id = this.generateId();
                });
                
                this.history = [...this.history, ...importedStates];
                
                // Mantener tamaño máximo
                if (this.history.length > this.maxHistorySize) {
                    const excess = this.history.length - this.maxHistorySize;
                    this.history = this.history.slice(excess);
                    this.currentIndex = Math.max(0, this.currentIndex - excess);
                }
            }
            
            this.saveToStorage();
            return {
                success: true,
                importedStates: data.history?.length || 0,
                totalStates: this.history.length
            };
        } catch (error) {
            throw new Error(`Error al importar historial: ${error.message}`);
        }
    }

    /**
     * Crea una rama del historial a partir del estado actual
     */
    createBranch(description = '') {
        const currentState = this.getCurrentState();
        if (!currentState) return null;
        
        // Crear una copia del estado actual con nueva descripción
        const branchState = {
            ...currentState,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            description: description || `Rama de ${currentState.description}`,
            parent: currentState.id
        };
        
        this.history.push(branchState);
        this.currentIndex = this.history.length - 1;
        this.saveToStorage();
        
        return branchState;
    }

    /**
     * Compara dos estados del historial
     */
    compareStates(stateId1, stateId2) {
        const state1 = this.getState(stateId1);
        const state2 = this.getState(stateId2);
        
        if (!state1 || !state2) {
            throw new Error('Estados no encontrados');
        }
        
        const comparison = {
            states: {
                state1: {
                    id: state1.id,
                    description: state1.description,
                    timestamp: state1.timestamp
                },
                state2: {
                    id: state2.id,
                    description: state2.description,
                    timestamp: state2.timestamp
                }
            },
            differences: {
                nodes: this.compareArrays(state1.graph.nodes, state2.graph.nodes, 'id'),
                edges: this.compareArrays(state1.graph.edges, state2.graph.edges, 'id'),
                statistics: this.compareObjects(state1.statistics, state2.statistics)
            }
        };
        
        return comparison;
    }

    /**
     * Compara dos arrays de objetos
     */
    compareArrays(arr1, arr2, keyField) {
        const map1 = new Map(arr1.map(item => [item[keyField], item]));
        const map2 = new Map(arr2.map(item => [item[keyField], item]));
        
        const added = [];
        const removed = [];
        const modified = [];
        
        // Elementos en arr2 pero no en arr1 (añadidos)
        for (const [key, item] of map2) {
            if (!map1.has(key)) {
                added.push(item);
            } else {
                // Verificar si el elemento fue modificado
                const original = map1.get(key);
                if (JSON.stringify(original) !== JSON.stringify(item)) {
                    modified.push({ original, current: item });
                }
            }
        }
        
        // Elementos en arr1 pero no en arr2 (eliminados)
        for (const [key, item] of map1) {
            if (!map2.has(key)) {
                removed.push(item);
            }
        }
        
        return { added, removed, modified };
    }

    /**
     * Compara dos objetos
     */
    compareObjects(obj1, obj2) {
        const differences = {};
        
        const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        
        for (const key of allKeys) {
            if (!(key in obj1)) {
                differences[key] = { type: 'added', value: obj2[key] };
            } else if (!(key in obj2)) {
                differences[key] = { type: 'removed', value: obj1[key] };
            } else if (obj1[key] !== obj2[key]) {
                differences[key] = { 
                    type: 'modified', 
                    oldValue: obj1[key], 
                    newValue: obj2[key] 
                };
            }
        }
        
        return differences;
    }

    /**
     * Guarda el historial en localStorage
     */
    saveToStorage() {
        try {
            const data = {
                history: this.history,
                currentIndex: this.currentIndex,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Error al guardar historial en localStorage:', error);
        }
    }

    /**
     * Carga el historial desde localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.history = parsed.history || [];
                this.currentIndex = parsed.currentIndex || -1;
            }
        } catch (error) {
            console.warn('Error al cargar historial desde localStorage:', error);
            this.history = [];
            this.currentIndex = -1;
        }
    }

    /**
     * Genera un ID único para los estados
     */
    generateId() {
        return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtiene timestamp formateado
     */
    getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    }

    /**
     * Descarga un archivo
     */
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Formatea fecha para mostrar
     */
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Obtiene descripción amigable del tiempo transcurrido
     */
    getRelativeTime(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return `hace ${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
}