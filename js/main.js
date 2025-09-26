/**
 * Aplicación principal del sistema de visualización de grafos
 */
class GraphApp {
    constructor() {
        // Componentes principales
        this.graph = new Graph();
        this.visualization = null;
        this.algorithms = null;
        this.exporter = null;
        this.history = new GraphHistory();
        
        // Estado de la aplicación
        this.currentTool = 'addNode';
        this.selectedNodes = [];
        this.tempEdgeSource = null;
        this.lastAlgorithmResults = null;
        this.currentAlgorithm = null; // Track del algoritmo activo
        this.currentAlgorithmParams = null; // Parámetros del último algoritmo
        this.autoRecalculate = true; // Flag para recalculación automática
        
        // Referencias DOM
        this.elements = {};
        
        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        this.initializeElements();
        this.initializeVisualization();
        this.initializeComponents();
        this.setupEventListeners();
        this.updateUI();
        
        // Generar grafo de ejemplo
        this.generateSampleGraph();
    }

    /**
     * Inicializa las referencias a elementos DOM
     */
    initializeElements() {
        this.elements = {
            // Botones de herramientas
            addNodeBtn: document.getElementById('addNodeBtn'),
            addEdgeBtn: document.getElementById('addEdgeBtn'),
            deleteBtn: document.getElementById('deleteBtn'),
            selectBtn: document.getElementById('selectBtn'),
            
            // Configuración del grafo
            isDirected: document.getElementById('isDirected'),
            isWeighted: document.getElementById('isWeighted'),
            autoRecalculate: document.getElementById('autoRecalculate'),
            
            // Algoritmos
            dfsBtn: document.getElementById('dfsBtn'),
            bfsBtn: document.getElementById('bfsBtn'),
            kruskalBtn: document.getElementById('kruskalBtn'),
            primBtn: document.getElementById('primBtn'),
            
            // Selección de nodos
            startNode: document.getElementById('startNode'),
            endNode: document.getElementById('endNode'),
            
            // Exportación
            exportJsonBtn: document.getElementById('exportJsonBtn'),
            exportCsvBtn: document.getElementById('exportCsvBtn'),
            exportImageBtn: document.getElementById('exportImageBtn'),
            
            // Controles del header
            newGraphBtn: document.getElementById('newGraphBtn'),
            saveGraphBtn: document.getElementById('saveGraphBtn'),
            loadGraphBtn: document.getElementById('loadGraphBtn'),
            historyBtn: document.getElementById('historyBtn'),
            
            // Controles del canvas
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            resetZoomBtn: document.getElementById('resetZoomBtn'),
            centerBtn: document.getElementById('centerBtn'),
            
            // Resultados
            algorithmResults: document.getElementById('algorithmResults'),
            algorithmOutput: document.getElementById('algorithmOutput'),
            pathResults: document.getElementById('pathResults'),
            pathOutput: document.getElementById('pathOutput'),
            mstResults: document.getElementById('mstResults'),
            mstOutput: document.getElementById('mstOutput'),
            mstComparison: document.getElementById('mstComparison'),
            comparisonOutput: document.getElementById('comparisonOutput'),
            clearResultsBtn: document.getElementById('clearResultsBtn'),
            
            // Estadísticas
            nodeCount: document.getElementById('nodeCount'),
            edgeCount: document.getElementById('edgeCount'),
            graphDensity: document.getElementById('graphDensity'),
            
            // Modales
            nodeModal: document.getElementById('nodeModal'),
            edgeModal: document.getElementById('edgeModal'),
            historyModal: document.getElementById('historyModal'),
            
            // Canvas
            graphCanvas: document.getElementById('graphCanvas'),
            mstCanvas: document.getElementById('mstCanvas'),
            
            // Spinner de carga
            loadingSpinner: document.getElementById('loadingSpinner')
        };
    }

    /**
     * Inicializa la visualización
     */
    initializeVisualization() {
        const container = this.elements.graphCanvas;
        const rect = container.getBoundingClientRect();
        
        this.visualization = new GraphVisualization(
            'graphCanvas',
            rect.width || 800,
            rect.height || 600
        );
        
        // Configurar callback de cambios en el grafo
        this.visualization.onGraphChange = () => {
            this.updateUI();
            this.recalculateAlgorithmIfNeeded();
            this.saveToHistory('Modificación manual del grafo');
        };
    }

    /**
     * Inicializa componentes auxiliares
     */
    initializeComponents() {
        this.algorithms = new GraphAlgorithms(this.graph);
        this.exporter = new GraphExporter(this.graph, this.visualization);
    }

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Herramientas
        this.elements.addNodeBtn?.addEventListener('click', () => this.setTool('addNode'));
        this.elements.addEdgeBtn?.addEventListener('click', () => this.setTool('addEdge'));
        this.elements.deleteBtn?.addEventListener('click', () => this.setTool('delete'));
        this.elements.selectBtn?.addEventListener('click', () => this.setTool('select'));
        
        // Configuración del grafo
        this.elements.isDirected?.addEventListener('change', (e) => {
            this.graph.setGraphType(e.target.checked, this.graph.isWeighted);
            this.updateVisualization();
            this.saveToHistory('Cambio de tipo de grafo');
        });
        
        this.elements.isWeighted?.addEventListener('change', (e) => {
            const wasWeighted = this.graph.isWeighted;
            const isNowWeighted = e.target.checked;
            
            this.graph.setGraphType(this.graph.isDirected, isNowWeighted);
            
            // Si cambió de no ponderado a ponderado, actualizar etiquetas de aristas
            if (!wasWeighted && isNowWeighted) {
                // Mostrar pesos en las aristas existentes
                for (const edge of this.graph.getEdges()) {
                    if (!edge.label || edge.label === '') {
                        this.graph.updateEdge(edge.id, { label: edge.weight.toString() });
                    }
                }
            } else if (wasWeighted && !isNowWeighted) {
                // Ocultar etiquetas de peso cuando se vuelve no ponderado
                for (const edge of this.graph.getEdges()) {
                    this.graph.updateEdge(edge.id, { label: '' });
                }
            }
            
            this.visualization.updateGraph(this.graph);
            this.updateUI();
            this.saveToHistory(`Cambio de tipo de grafo: ${isNowWeighted ? 'Ponderado' : 'No ponderado'}`);
        });

        // Configuración de recalculación automática
        this.elements.autoRecalculate?.addEventListener('change', (e) => {
            this.autoRecalculate = e.target.checked;
            console.log(`🔄 Recalculación automática ${this.autoRecalculate ? 'activada' : 'desactivada'}`);
        });
        
        // Algoritmos
        this.elements.dfsBtn?.addEventListener('click', () => this.runDFS());
        this.elements.bfsBtn?.addEventListener('click', () => this.runBFS());
        this.elements.kruskalBtn?.addEventListener('click', () => this.runKruskal());
        this.elements.primBtn?.addEventListener('click', () => this.runPrim());
        
        // Exportación
        this.elements.exportJsonBtn?.addEventListener('click', () => this.exportJSON());
        this.elements.exportCsvBtn?.addEventListener('click', () => this.exportCSV());
        this.elements.exportImageBtn?.addEventListener('click', () => this.exportImage());
        
        // Controles del header
        this.elements.newGraphBtn?.addEventListener('click', () => this.newGraph());
        this.elements.saveGraphBtn?.addEventListener('click', () => this.saveGraph());
        this.elements.loadGraphBtn?.addEventListener('click', () => this.loadGraph());
        this.elements.historyBtn?.addEventListener('click', () => this.showHistory());
        
        // Controles del canvas
        this.elements.zoomInBtn?.addEventListener('click', () => this.zoomIn());
        this.elements.zoomOutBtn?.addEventListener('click', () => this.zoomOut());
        this.elements.resetZoomBtn?.addEventListener('click', () => this.resetZoom());
        this.elements.centerBtn?.addEventListener('click', () => this.centerView());
        
        // Resultados
        this.elements.clearResultsBtn?.addEventListener('click', () => this.clearResults());
        
        // Modales
        this.setupModalEventListeners();
        
        // Redimensionamiento de ventana
        window.addEventListener('resize', () => this.handleResize());
        
        // Atajos de teclado
        this.setupKeyboardShortcuts();
    }

    /**
     * Configura los event listeners de los modales
     */
    setupModalEventListeners() {
        // Cerrar modales
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
        // Cerrar modales con click fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        });
    }

    /**
     * Configura atajos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.newGraph();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveGraph();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.loadGraph();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportJSON();
                        break;
                }
            } else {
                switch (e.key) {
                    case '1':
                        this.setTool('addNode');
                        break;
                    case '2':
                        this.setTool('addEdge');
                        break;
                    case '3':
                        this.setTool('select');
                        break;
                    case 'Delete':
                    case 'Backspace':
                        if (this.currentTool === 'select') {
                            this.visualization.deleteSelected();
                        }
                        break;
                }
            }
        });
    }

    /**
     * Establece la herramienta actual
     */
    setTool(tool) {
        this.currentTool = tool;
        this.tempEdgeSource = null;
        
        // Actualizar UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Actualizar visualización
        this.visualization.setTool(tool);
    }

    /**
     * Ejecuta DFS
     */
    async runDFS() {
        const startNode = this.elements.startNode.value;
        const endNode = this.elements.endNode.value;
        
        if (!startNode) {
            alert('Seleccione un nodo inicial');
            return;
        }

        // Guardar parámetros del algoritmo para recalculación
        this.currentAlgorithm = 'dfs';
        this.currentAlgorithmParams = { startNode, endNode: endNode || null };
        
        // Limpiar resultados anteriores
        this.elements.pathResults.classList.add('hidden');
        
        this.showLoading(true);
        
        try {
            const result = this.algorithms.dfs(startNode, endNode || null);
            this.displayAlgorithmResult(result);
            this.lastAlgorithmResults = result;
            
            // Animar el algoritmo
            await this.animateDFS(result);
            
            this.saveToHistory(`DFS desde ${startNode}${endNode ? ` hasta ${endNode}` : ' (recorrido completo)'}`);
        } catch (error) {
            alert(`Error en DFS: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Ejecuta BFS
     */
    async runBFS() {
        const startNode = this.elements.startNode.value;
        const endNode = this.elements.endNode.value;
        
        if (!startNode) {
            alert('Seleccione un nodo inicial');
            return;
        }

        // Guardar parámetros del algoritmo para recalculación
        this.currentAlgorithm = 'bfs';
        this.currentAlgorithmParams = { startNode, endNode: endNode || null };
        
        // Limpiar resultados anteriores
        this.elements.pathResults.classList.add('hidden');
        
        this.showLoading(true);
        
        try {
            const result = this.algorithms.bfs(startNode, endNode || null);
            this.displayAlgorithmResult(result);
            this.lastAlgorithmResults = result;
            
            // Animar el algoritmo
            await this.animateBFS(result);
            
            this.saveToHistory(`BFS desde ${startNode}${endNode ? ` hasta ${endNode}` : ' (recorrido completo)'}`);
        } catch (error) {
            alert(`Error en BFS: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Ejecuta Kruskal
     */
    async runKruskal() {
        if (!this.graph.isWeighted) {
            alert('El algoritmo de Kruskal requiere un grafo ponderado');
            return;
        }

        // Guardar parámetros del algoritmo para recalculación
        this.currentAlgorithm = 'kruskal';
        this.currentAlgorithmParams = {};
        
        this.showLoading(true);
        
        try {
            const result = this.algorithms.kruskal();
            this.displayMSTResult(result);
            this.lastAlgorithmResults = result;
            
            // Mostrar MST en canvas separado
            this.showMSTVisualization(result);
            
            this.saveToHistory('Algoritmo de Kruskal');
        } catch (error) {
            alert(`Error en Kruskal: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Ejecuta Prim
     */
    async runPrim() {
        if (!this.graph.isWeighted) {
            alert('El algoritmo de Prim requiere un grafo ponderado');
            return;
        }
        
        const startNode = this.elements.startNode.value;

        // Guardar parámetros del algoritmo para recalculación
        this.currentAlgorithm = 'prim';
        this.currentAlgorithmParams = { startNode: startNode || null };
        
        this.showLoading(true);
        
        try {
            const result = this.algorithms.prim(startNode || null);
            this.displayMSTResult(result);
            this.lastAlgorithmResults = result;
            
            // Mostrar MST en canvas separado
            this.showMSTVisualization(result);
            
            this.saveToHistory(`Algoritmo de Prim${startNode ? ` desde ${startNode}` : ''}`);
        } catch (error) {
            alert(`Error en Prim: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Anima la ejecución de DFS
     */
    async animateDFS(result) {
        const steps = result.visitOrder.map((nodeId, index) => ({
            highlightNodes: [nodeId],
            callback: (i, step) => {
                // Actualizar información en tiempo real
            }
        }));
        
        await this.visualization.animateAlgorithm(steps, 800);
    }

    /**
     * Anima la ejecución de BFS
     */
    async animateBFS(result) {
        const steps = result.visitOrder.map((nodeId, index) => ({
            highlightNodes: [nodeId],
            callback: (i, step) => {
                // Actualizar información en tiempo real
            }
        }));
        
        await this.visualization.animateAlgorithm(steps, 800);
    }

    /**
     * Muestra la visualización del MST
     */
    showMSTVisualization(result) {
        // Crear grafo MST
        const mstGraph = new Graph();
        mstGraph.setGraphType(this.graph.isDirected, this.graph.isWeighted);
        
        // Agregar nodos del grafo original
        for (const node of this.graph.getNodes()) {
            mstGraph.addNode(node.id, node.label, node.x, node.y);
        }
        
        // Agregar solo las aristas del MST
        for (const edge of result.mstEdges) {
            mstGraph.addEdge(edge.source, edge.target, edge.weight, edge.label);
        }
        
        // Mostrar canvas MST
        this.elements.mstCanvas.classList.remove('hidden');
        
        // Crear nueva visualización para MST
        const mstViz = new GraphVisualization('mstCanvas', 
            this.visualization.width, this.visualization.height);
        mstViz.updateGraph(mstGraph);
        mstViz.centerView();
    }

    /**
     * Muestra/oculta el spinner de carga
     */
    showLoading(show) {
        if (this.elements.loadingSpinner) {
            if (show) {
                this.elements.loadingSpinner.classList.remove('hidden');
            } else {
                this.elements.loadingSpinner.classList.add('hidden');
            }
        }
    }

    /**
     * Muestra el resultado de un algoritmo
     */
    displayAlgorithmResult(result) {
        this.elements.algorithmResults.classList.remove('hidden');
        
        let html = `<h5>${result.algorithm}</h5>`;
        html += `<p><strong>Nodo inicial:</strong> ${result.startNode}</p>`;
        
        // Solo mostrar información de búsqueda si hay nodo objetivo
        if (result.targetNode) {
            html += `<p><strong>Nodo objetivo:</strong> ${result.targetNode}</p>`;
            html += `<p><strong>Encontrado:</strong> ${result.found ? 'Sí' : 'No'}</p>`;
            if (result.found && result.distance !== -1) {
                html += `<p><strong>Distancia:</strong> ${result.distance} saltos</p>`;
            }
        } else {
            // Para recorrido completo
            html += `<p><strong>Tipo:</strong> Recorrido completo del grafo</p>`;
            html += `<p><strong>Nodos alcanzados:</strong> ${result.visitOrder.length} de ${result.statistics.totalNodes}</p>`;
        }
        
        html += `<p><strong>Orden de visita:</strong> ${result.visitOrder.join(' → ')}</p>`;
        
        this.elements.algorithmOutput.innerHTML = html;
        
        // Solo mostrar panel de ruta si hay nodo objetivo y se encontró una ruta específica
        if (result.targetNode && result.found && result.path && result.path.length > 0) {
            this.elements.pathResults.classList.remove('hidden');
            this.elements.pathOutput.innerHTML = `
                <p><strong>Ruta encontrada:</strong> ${result.path.join(' → ')}</p>
                <p><strong>Longitud:</strong> ${result.path.length - 1} aristas</p>
            `;
        } else {
            // Ocultar panel de ruta si no hay nodo objetivo o no se encontró
            this.elements.pathResults.classList.add('hidden');
        }
    }

    /**
     * Muestra el resultado de un algoritmo MST
     */
    displayMSTResult(result) {
        this.elements.mstResults.classList.remove('hidden');
        
        let html = `<h5>${result.algorithm}</h5>`;
        html += `<p><strong>Peso total:</strong> ${result.totalWeight}</p>`;
        html += `<p><strong>Aristas en MST:</strong> ${result.mstEdges.length}</p>`;
        
        html += '<h6>Aristas del MST:</h6><ul>';
        for (const edge of result.mstEdges) {
            html += `<li>${edge.source} → ${edge.target} (peso: ${edge.weight})</li>`;
        }
        html += '</ul>';
        
        this.elements.mstOutput.innerHTML = html;
        
        // Mostrar comparación si tenemos resultados de ambos algoritmos
        this.checkMSTComparison();
    }

    /**
     * Verifica si se puede mostrar comparación de MST
     */
    checkMSTComparison() {
        if (this.graph.isWeighted) {
            try {
                const comparison = this.algorithms.compareMST();
                this.elements.mstComparison.classList.remove('hidden');
                
                let html = '<h6>Comparación Kruskal vs Prim</h6>';
                html += `<p><strong>Peso Kruskal:</strong> ${comparison.comparison.kruskalWeight}</p>`;
                html += `<p><strong>Peso Prim:</strong> ${comparison.comparison.primWeight}</p>`;
                html += `<p><strong>Mismo peso:</strong> ${comparison.comparison.sameWeight ? 'Sí' : 'No'}</p>`;
                html += `<p><strong>MSTs idénticos:</strong> ${comparison.comparison.identical ? 'Sí' : 'No'}</p>`;
                
                this.elements.comparisonOutput.innerHTML = html;
            } catch (error) {
                console.warn('No se pudo realizar la comparación:', error);
            }
        }
    }

    /**
     * Actualiza la interfaz de usuario
     */
    updateUI() {
        this.updateNodeSelectors();
        this.updateStatistics();
        this.algorithms = new GraphAlgorithms(this.graph);
        this.exporter = new GraphExporter(this.graph, this.visualization);
    }

    /**
     * Actualiza los selectores de nodos
     */
    updateNodeSelectors() {
        const nodes = this.graph.getNodes();
        const startSelect = this.elements.startNode;
        const endSelect = this.elements.endNode;
        
        if (startSelect && endSelect) {
            const currentStart = startSelect.value;
            const currentEnd = endSelect.value;
            
            startSelect.innerHTML = '<option value="">Seleccionar nodo</option>';
            endSelect.innerHTML = '<option value="">Seleccionar nodo</option>';
            
            for (const node of nodes) {
                const option1 = new Option(node.label, node.id);
                const option2 = new Option(node.label, node.id);
                
                startSelect.appendChild(option1);
                endSelect.appendChild(option2);
            }
            
            // Restaurar selección anterior si existe
            if (currentStart && nodes.some(n => n.id === currentStart)) {
                startSelect.value = currentStart;
            }
            if (currentEnd && nodes.some(n => n.id === currentEnd)) {
                endSelect.value = currentEnd;
            }
        }
    }

    /**
     * Actualiza las estadísticas del grafo
     */
    updateStatistics() {
        const stats = this.graph.getStatistics();
        
        if (this.elements.nodeCount) {
            this.elements.nodeCount.textContent = stats.nodeCount;
        }
        if (this.elements.edgeCount) {
            this.elements.edgeCount.textContent = stats.edgeCount;
        }
        if (this.elements.graphDensity) {
            this.elements.graphDensity.textContent = `${stats.density}%`;
        }
    }

    /**
     * Actualiza la visualización
     */
    updateVisualization() {
        this.visualization.updateGraph(this.graph);
    }

    /**
     * Crea un nuevo grafo
     */
    newGraph() {
        if (confirm('¿Está seguro de crear un nuevo grafo? Se perderán los cambios no guardados.')) {
            this.graph.clear();
            this.updateVisualization();
            this.updateUI();
            this.clearResults();
            this.saveToHistory('Nuevo grafo creado');
        }
    }

    /**
     * Genera un grafo de ejemplo
     */
    generateSampleGraph() {
        // Generar grafo no dirigido y no ponderado por defecto
        this.graph.generateRandom(6, 0.4, false, false);
        this.updateVisualization();
        this.updateUI();
        this.saveToHistory('Grafo de ejemplo generado');
    }

    /**
     * Guarda el grafo actual
     */
    saveGraph() {
        try {
            this.exporter.exportToJSON(true, this.lastAlgorithmResults);
        } catch (error) {
            alert(`Error al guardar: ${error.message}`);
        }
    }

    /**
     * Carga un grafo desde archivo
     */
    loadGraph() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.graph.fromJSON(data.graph || data);
                        this.updateVisualization();
                        this.updateUI();
                        this.saveToHistory('Grafo cargado desde archivo');
                    } catch (error) {
                        alert(`Error al cargar archivo: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    /**
     * Exporta el grafo en formato JSON
     */
    exportJSON() {
        try {
            this.exporter.exportToJSON(true, this.lastAlgorithmResults);
        } catch (error) {
            alert(`Error al exportar JSON: ${error.message}`);
        }
    }

    /**
     * Exporta el grafo en formato CSV
     */
    exportCSV() {
        try {
            const type = prompt(
                'Seleccione el tipo de CSV:\n' +
                '1. Lista de aristas (edges)\n' +
                '2. Lista de nodos (nodes)\n' +
                '3. Matriz de adyacencia (adjacency)',
                'edges'
            );
            
            if (type) {
                this.exporter.exportToCSV(type);
            }
        } catch (error) {
            alert(`Error al exportar CSV: ${error.message}`);
        }
    }

    /**
     * Exporta el grafo como imagen
     */
    exportImage() {
        try {
            this.visualization.exportAsImage();
        } catch (error) {
            alert(`Error al exportar imagen: ${error.message}`);
        }
    }

    /**
     * Muestra el historial
     */
    showHistory() {
        this.elements.historyModal.classList.remove('hidden');
        this.loadHistoryContent();
    }

    /**
     * Carga el contenido del historial
     */
    async loadHistoryContent() {
        const historyContent = document.getElementById('historyContent');
        const states = this.history.getAllStates();
        
        if (states.length === 0) {
            historyContent.innerHTML = '<p>No hay elementos en el historial</p>';
            return;
        }
        
        let html = '';
        for (const state of states.reverse()) {
            // Generar miniatura si no existe
            if (!state.image) {
                const tempGraph = new Graph();
                tempGraph.fromJSON(state.graph);
                const tempViz = new GraphVisualization('temp', 200, 150);
                tempViz.updateGraph(tempGraph);
                state.image = await this.history.generateThumbnail(tempViz);
            }
            
            html += `
                <div class="history-item" onclick="app.loadHistoryState('${state.id}')">
                    ${state.image ? `<img src="${state.image}" alt="Grafo">` : '<div style="height:100px;background:#f0f0f0;"></div>'}
                    <h4>${state.description}</h4>
                    <p>${this.history.formatDate(state.timestamp)}</p>
                    <p>${state.graph.nodes.length} nodos, ${state.graph.edges.length} aristas</p>
                </div>
            `;
        }
        
        historyContent.innerHTML = html;
    }

    /**
     * Carga un estado del historial
     */
    loadHistoryState(stateId) {
        const state = this.history.getState(stateId);
        if (state) {
            this.graph.fromJSON(state.graph);
            this.updateVisualization();
            this.updateUI();
            this.elements.historyModal.classList.add('hidden');
        }
    }

    /**
     * Guarda el estado actual en el historial
     */
    saveToHistory(description) {
        this.history.saveState(this.graph, this.lastAlgorithmResults, description);
    }

    /**
     * Deshacer última acción
     */
    undo() {
        const state = this.history.getPreviousState();
        if (state) {
            this.graph.fromJSON(state.graph);
            this.updateVisualization();
            this.updateUI();
        }
    }

    /**
     * Rehacer acción
     */
    redo() {
        const state = this.history.getNextState();
        if (state) {
            this.graph.fromJSON(state.graph);
            this.updateVisualization();
            this.updateUI();
        }
    }

    /**
     * Limpia los resultados
     */
    clearResults() {
        this.elements.algorithmResults.classList.add('hidden');
        this.elements.pathResults.classList.add('hidden');
        this.elements.mstResults.classList.add('hidden');
        this.elements.mstComparison.classList.add('hidden');
        this.elements.mstCanvas.classList.add('hidden');
        
        this.visualization.clearHighlights();
        this.lastAlgorithmResults = null;
    }

    /**
     * Controles de zoom
     */
    zoomIn() {
        // Implementar zoom in
    }

    zoomOut() {
        // Implementar zoom out
    }

    resetZoom() {
        // Implementar reset zoom
    }

    centerView() {
        this.visualization.centerView();
    }

    /**
     * Recalcula automáticamente el algoritmo activo si es necesario
     */
    async recalculateAlgorithmIfNeeded() {
        if (!this.autoRecalculate || !this.currentAlgorithm || !this.currentAlgorithmParams) {
            return;
        }

        console.log(`🔄 Recalculando algoritmo ${this.currentAlgorithm}...`);

        try {
            // Verificar si los nodos necesarios aún existen
            if (this.currentAlgorithm === 'dfs' || this.currentAlgorithm === 'bfs') {
                const { startNode, endNode } = this.currentAlgorithmParams;
                
                // Verificar que el nodo inicial existe
                if (!this.graph.getNode(startNode)) {
                    console.log(`❌ Nodo inicial ${startNode} ya no existe. Cancelando recalculación.`);
                    this.clearAlgorithmState();
                    return;
                }
                
                // Verificar que el nodo final existe (si se especificó)
                if (endNode && !this.graph.getNode(endNode)) {
                    console.log(`❌ Nodo final ${endNode} ya no existe. Recalculando sin nodo destino.`);
                    this.currentAlgorithmParams.endNode = null;
                }
                
                // Actualizar los campos de entrada
                this.elements.startNode.value = startNode;
                this.elements.endNode.value = this.currentAlgorithmParams.endNode || '';
            } else if (this.currentAlgorithm === 'prim') {
                const { startNode } = this.currentAlgorithmParams;
                
                // Si se especificó un nodo inicial, verificar que existe
                if (startNode && !this.graph.getNode(startNode)) {
                    console.log(`❌ Nodo inicial ${startNode} ya no existe. Usando nodo automático.`);
                    this.currentAlgorithmParams.startNode = null;
                    this.elements.startNode.value = '';
                }
            }

            // Recalcular el algoritmo
            this.showLoading(true);
            
            switch (this.currentAlgorithm) {
                case 'dfs':
                    const dfsResult = this.algorithms.dfs(
                        this.currentAlgorithmParams.startNode, 
                        this.currentAlgorithmParams.endNode
                    );
                    this.displayAlgorithmResult(dfsResult);
                    this.lastAlgorithmResults = dfsResult;
                    await this.animateDFS(dfsResult);
                    break;
                    
                case 'bfs':
                    const bfsResult = this.algorithms.bfs(
                        this.currentAlgorithmParams.startNode, 
                        this.currentAlgorithmParams.endNode
                    );
                    this.displayAlgorithmResult(bfsResult);
                    this.lastAlgorithmResults = bfsResult;
                    await this.animateBFS(bfsResult);
                    break;
                    
                case 'kruskal':
                    if (!this.graph.isWeighted) {
                        console.log('❌ El grafo ya no es ponderado. Cancelando Kruskal.');
                        this.clearAlgorithmState();
                        break;
                    }
                    const kruskalResult = this.algorithms.kruskal();
                    this.displayMSTResult(kruskalResult);
                    this.lastAlgorithmResults = kruskalResult;
                    this.showMSTVisualization(kruskalResult);
                    break;
                    
                case 'prim':
                    if (!this.graph.isWeighted) {
                        console.log('❌ El grafo ya no es ponderado. Cancelando Prim.');
                        this.clearAlgorithmState();
                        break;
                    }
                    const primResult = this.algorithms.prim(this.currentAlgorithmParams.startNode);
                    this.displayMSTResult(primResult);
                    this.lastAlgorithmResults = primResult;
                    this.showMSTVisualization(primResult);
                    break;
            }
            
            console.log(`✅ Algoritmo ${this.currentAlgorithm} recalculado exitosamente`);
            
        } catch (error) {
            console.log(`❌ Error al recalcular algoritmo: ${error.message}`);
            this.clearAlgorithmState();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Limpia el estado del algoritmo activo
     */
    clearAlgorithmState() {
        this.currentAlgorithm = null;
        this.currentAlgorithmParams = null;
        this.lastAlgorithmResults = null;
        
        // Limpiar visualización
        this.visualization.clearHighlights();
        
        // Ocultar paneles de resultados
        this.elements.algorithmResults.classList.add('hidden');
        this.elements.pathResults.classList.add('hidden');
        this.elements.mstResults.classList.add('hidden');
        this.elements.mstComparison.classList.add('hidden');
    }

    /**
     * Maneja el redimensionamiento de la ventana
     */
    handleResize() {
        // Actualizar tamaño de la visualización
        const container = this.elements.graphCanvas;
        const rect = container.getBoundingClientRect();
        
        this.visualization.width = rect.width;
        this.visualization.height = rect.height;
        
        // Actualizar SVG
        this.visualization.svg
            .attr('viewBox', `0 0 ${rect.width} ${rect.height}`);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GraphApp();
});