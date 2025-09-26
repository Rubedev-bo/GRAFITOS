/**
 * Clase para la visualización interactiva de grafos usando D3.js
 */
class GraphVisualization {
    constructor(containerId, width = 800, height = 600) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.graph = null;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        
        // Elementos SVG
        this.nodeGroup = null;
        this.linkGroup = null;
        this.labelGroup = null;
        
        // Estado de la visualización
        this.selectedNodes = new Set();
        this.selectedEdges = new Set();
        this.currentTool = 'select';
        this.isAnimating = false;
        this.highlightedElements = new Set();
        this.tempEdgeSource = null;
        
        // Configuración visual
        this.nodeRadius = 25;
        this.colors = {
            node: '#3b82f6',
            nodeSelected: '#f59e0b',
            nodeHighlighted: '#ef4444',
            edge: '#6b7280',
            edgeSelected: '#3b82f6',
            edgeHighlighted: '#ef4444',
            edgeMST: '#10b981'
        };
        
        this.initVisualization();
        this.setupEventListeners();
    }

    /**
     * Inicializa la visualización SVG
     */
    initVisualization() {
        const container = d3.select(`#${this.containerId}`);
        container.selectAll('*').remove();

        this.svg = container
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .style('background', 'transparent');

        // Definir marcadores para flechas (grafos dirigidos)
        const defs = this.svg.append('defs');
        
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', this.colors.edge);

        defs.append('marker')
            .attr('id', 'arrowhead-selected')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', this.colors.edgeSelected);

        defs.append('marker')
            .attr('id', 'arrowhead-highlighted')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', this.colors.edgeHighlighted);

        // Grupos para diferentes elementos
        this.linkGroup = this.svg.append('g').attr('class', 'links');
        this.nodeGroup = this.svg.append('g').attr('class', 'nodes');
        this.labelGroup = this.svg.append('g').attr('class', 'labels');

        // Configurar zoom y pan
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                const { transform } = event;
                this.nodeGroup.attr('transform', transform);
                this.linkGroup.attr('transform', transform);
                this.labelGroup.attr('transform', transform);
            });

        this.svg.call(zoom);

        // Configurar simulación de fuerzas
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(100).strength(0.5))
            .force('charge', d3.forceManyBody().strength(-300).distanceMax(400))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(this.nodeRadius + 10).strength(0.8))
            .alphaDecay(0.01); // Hacer que la simulación se estabilice más lentamente
    }

    /**
     * Muestra una notificación temporal menos intrusiva que alert()
     */
    showNotification(message, type = 'warning') {
        // Crear o reutilizar el contenedor de notificaciones
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        // Crear la notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#ffa502'};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease, opacity 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        
        // Agregar al contenedor
        container.appendChild(notification);
        
        // Animar la entrada
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Remover automáticamente después de 4 segundos
        const removeNotification = () => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        // Remover al hacer clic
        notification.addEventListener('click', removeNotification);
        
        // Auto-remover
        setTimeout(removeNotification, 4000);
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Click en el fondo para agregar nodos
        this.svg.on('click', (event) => {
            if (event.target === this.svg.node() && this.currentTool === 'addNode') {
                // Obtener coordenadas ajustadas por zoom/pan
                const transform = d3.zoomTransform(this.svg.node());
                const [mouseX, mouseY] = d3.pointer(event);
                const x = (mouseX - transform.x) / transform.k;
                const y = (mouseY - transform.y) / transform.k;
                
                this.addNodeAtPosition(x, y);
            }
        });
    }

    /**
     * Actualiza la visualización con un nuevo grafo
     */
    updateGraph(graph) {
        this.graph = graph;
        this.prepareData();
        this.renderNodes();
        this.renderLinks();
        this.updateSimulation();
        this.updateToolVisualFeedback();
    }

    /**
     * Actualiza el feedback visual según la herramienta activa
     */
    updateToolVisualFeedback() {
        if (!this.nodeElements || !this.linkElements) return;

        // Limpiar clases anteriores
        this.nodeElements.classed('deletable', false);
        this.linkElements.classed('deletable', false);

        // Aplicar estilos según la herramienta activa
        if (this.currentTool === 'delete') {
            this.nodeElements.classed('deletable', true);
            this.linkElements.classed('deletable', true);
        }
    }

    /**
     * Prepara los datos para D3.js
     */
    prepareData() {
        this.nodes = this.graph.getNodes().map(node => ({
            ...node,
            x: node.x || Math.random() * this.width,
            y: node.y || Math.random() * this.height
        }));

        this.links = this.graph.getEdges().map(edge => ({
            ...edge,
            source: edge.source,
            target: edge.target
        }));
    }

    /**
     * Renderiza los nodos
     */
    renderNodes() {
        const nodeUpdate = this.nodeGroup
            .selectAll('.node')
            .data(this.nodes, d => d.id);

        // Eliminar nodos que ya no existen
        nodeUpdate.exit().remove();

        // Crear nuevos nodos
        const nodeEnter = nodeUpdate.enter()
            .append('g')
            .attr('class', 'node')
            .call(this.setupNodeInteractions.bind(this));

        nodeEnter.append('circle')
            .attr('r', this.nodeRadius)
            .style('fill', this.colors.node)
            .style('stroke', '#fff')
            .style('stroke-width', 2)
            .style('transition', 'none'); // Desactivar transiciones CSS en elementos SVG

        nodeEnter.append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .style('pointer-events', 'none')
            .text(d => d.label);

        // Actualizar nodos existentes
        const nodeMerge = nodeEnter.merge(nodeUpdate);
        
        nodeMerge.select('circle')
            .style('fill', d => {
                if (this.selectedNodes.has(d.id)) return this.colors.nodeSelected;
                if (this.highlightedElements.has(d.id)) return this.colors.nodeHighlighted;
                return this.colors.node;
            });

        nodeMerge.select('text')
            .text(d => d.label);

        this.nodeElements = nodeMerge;
    }

    /**
     * Renderiza las aristas
     */
    renderLinks() {
        const linkUpdate = this.linkGroup
            .selectAll('.link')
            .data(this.links, d => d.id);

        // Eliminar aristas que ya no existen
        linkUpdate.exit().remove();

        // Crear nuevas aristas
        const linkEnter = linkUpdate.enter()
            .append('g')
            .attr('class', 'link')
            .call(this.setupLinkInteractions.bind(this));

        linkEnter.append('line')
            .style('stroke', this.colors.edge)
            .style('stroke-width', 2)
            .style('transition', 'none'); // Desactivar transiciones CSS

        // Etiquetas de peso para aristas ponderadas
        const labelGroup = linkEnter.append('g')
            .attr('class', 'edge-label-group')
            .style('display', this.graph.isWeighted ? 'block' : 'none');

        // Fondo para la etiqueta (rectángulo blanco)
        labelGroup.append('rect')
            .attr('class', 'edge-label-bg')
            .style('fill', 'white')
            .style('stroke', '#ddd')
            .style('stroke-width', 1)
            .style('rx', 3)
            .style('ry', 3);

        // Texto de la etiqueta
        labelGroup.append('text')
            .attr('class', 'edge-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('fill', '#333')
            .style('pointer-events', 'none')
            .text(d => this.graph.isWeighted ? (d.label || d.weight) : '');

        // Actualizar aristas existentes
        const linkMerge = linkEnter.merge(linkUpdate);
        
        linkMerge.select('line')
            .style('stroke', d => {
                if (this.selectedEdges.has(d.id)) return this.colors.edgeSelected;
                if (this.highlightedElements.has(d.id)) return this.colors.edgeHighlighted;
                return this.colors.edge;
            })
            .style('marker-end', d => {
                if (!this.graph.isDirected) return 'none';
                if (this.selectedEdges.has(d.id)) return 'url(#arrowhead-selected)';
                if (this.highlightedElements.has(d.id)) return 'url(#arrowhead-highlighted)';
                return 'url(#arrowhead)';
            });

        // Actualizar visibilidad y contenido de las etiquetas
        linkMerge.select('.edge-label-group')
            .style('display', this.graph.isWeighted ? 'block' : 'none');

        linkMerge.select('.edge-label')
            .text(d => this.graph.isWeighted ? (d.label || d.weight) : '');

        // Actualizar el tamaño del fondo de las etiquetas existentes
        linkMerge.select('.edge-label-bg')
            .attr('width', d => {
                if (!this.graph.isWeighted) return 0;
                const text = (d.label || d.weight || '').toString();
                return Math.max(20, text.length * 8 + 8);
            })
            .attr('height', this.graph.isWeighted ? 18 : 0)
            .attr('x', d => {
                if (!this.graph.isWeighted) return 0;
                const text = (d.label || d.weight || '').toString();
                return -Math.max(10, text.length * 4 + 4);
            })
            .attr('y', this.graph.isWeighted ? -9 : 0);

        this.linkElements = linkMerge;
    }

    /**
     * Configura las interacciones de los nodos
     */
    setupNodeInteractions(selection) {
        selection
            .on('click', (event, d) => {
                event.stopPropagation();
                this.handleNodeClick(d, event);
            })
            .on('dblclick', (event, d) => {
                event.stopPropagation();
                this.handleNodeDoubleClick(d);
            })
            .call(d3.drag()
                .on('start', this.dragStarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragEnded.bind(this)));
    }

    /**
     * Configura las interacciones de las aristas
     */
    setupLinkInteractions(selection) {
        selection
            .on('click', (event, d) => {
                event.stopPropagation();
                this.handleLinkClick(d, event);
            })
            .on('dblclick', (event, d) => {
                event.stopPropagation();
                this.handleLinkDoubleClick(d);
            });
    }

    /**
     * Maneja el click en un nodo
     */
    handleNodeClick(node, event) {
        switch (this.currentTool) {
            case 'select':
                this.toggleNodeSelection(node.id);
                break;
            case 'addEdge':
                this.handleEdgeCreation(node.id);
                break;
            case 'delete':
                this.deleteNode(node.id);
                break;
        }
    }

    /**
     * Maneja la creación de aristas
     */
    handleEdgeCreation(nodeId) {
        if (!this.tempEdgeSource) {
            // Primer nodo seleccionado
            this.tempEdgeSource = nodeId;
            this.highlightElements([nodeId], []);
            
            // Mostrar feedback visual
            const nodeElement = this.nodeElements.filter(d => d.id === nodeId);
            nodeElement.select('circle')
                .style('stroke', this.colors.edgeSelected)
                .style('stroke-width', 3);
        } else {
            // Segundo nodo seleccionado - crear arista
            const targetId = nodeId;
            const sourceId = this.tempEdgeSource;
            
            if (sourceId !== targetId) {
                try {
                    let weight = 1;
                    let label = '';
                    
                    // Solo pedir peso si el grafo está configurado como ponderado
                    if (this.graph.isWeighted) {
                        const weightInput = prompt('Ingrese el peso de la arista (número entero):', '1');
                        if (weightInput === null) {
                            // Usuario canceló
                            this.resetEdgeCreation();
                            return;
                        }
                        const parsedWeight = parseInt(weightInput);
                        if (isNaN(parsedWeight) || parsedWeight < 1 || !Number.isInteger(parsedWeight)) {
                            this.showNotification('Por favor ingrese un peso válido (número entero positivo)', 'error');
                            this.resetEdgeCreation();
                            return;
                        }
                        weight = parsedWeight;
                        label = weight.toString(); // Auto-completar etiqueta con el peso
                    } else {
                        // Para grafos no ponderados, usar peso 1 y sin etiqueta
                        weight = 1;
                        label = '';
                    }
                    
                    this.graph.addEdge(sourceId, targetId, weight, label);
                    this.updateGraph(this.graph);
                    this.onGraphChange?.();
                } catch (error) {
                    this.showNotification(error.message, 'error');
                }
            } else {
                this.showNotification('No se puede crear una arista hacia el mismo nodo', 'error');
            }
            
            this.resetEdgeCreation();
        }
    }

    /**
     * Resetea el estado de creación de aristas
     */
    resetEdgeCreation() {
        this.tempEdgeSource = null;
        this.clearHighlights();
        this.updateNodeStyles();
    }

    /**
     * Maneja el doble click en un nodo
     */
    handleNodeDoubleClick(node) {
        this.showNodeModal(node);
    }

    /**
     * Maneja el click en una arista
     */
    handleLinkClick(link, event) {
        switch (this.currentTool) {
            case 'select':
                this.toggleEdgeSelection(link.id);
                break;
            case 'delete':
                this.deleteEdge(link.id);
                break;
        }
    }

    /**
     * Maneja el doble click en una arista
     */
    handleLinkDoubleClick(link) {
        this.showEdgeModal(link);
    }

    /**
     * Muestra el modal de propiedades del nodo
     */
    showNodeModal(node) {
        const modal = document.getElementById('nodeModal');
        const nodeIdInput = document.getElementById('nodeId');
        const nodeLabelInput = document.getElementById('nodeLabel');
        
        if (modal && nodeIdInput && nodeLabelInput) {
            nodeIdInput.value = node.id;
            nodeLabelInput.value = node.label || node.id;
            
            // La auto-completación se maneja en el script del DOM
            
            modal.classList.remove('hidden');
            
            // Configurar botones del modal
            const saveBtn = document.getElementById('saveNodeBtn');
            const cancelBtn = document.getElementById('cancelNodeBtn');
            
            const saveHandler = () => {
                const newId = nodeIdInput.value.trim();
                const newLabel = nodeLabelInput.value.trim() || newId;
                
                if (newId && newId !== node.id) {
                    // Verificar que el nuevo ID no exista
                    if (!this.graph.getNode(newId)) {
                        // Actualizar nodo
                        this.graph.updateNode(node.id, { label: newLabel });
                        
                        // Si el ID cambió, necesitamos recrear el nodo
                        if (newId !== node.id) {
                            const nodeData = this.graph.getNode(node.id);
                            this.graph.removeNode(node.id);
                            this.graph.addNode(newId, newLabel, nodeData.x, nodeData.y);
                        }
                        
                        this.updateGraph(this.graph);
                        this.onGraphChange?.();
                    } else {
                        this.showNotification('Ya existe un nodo con ese ID', 'error');
                        return;
                    }
                } else if (newLabel !== node.label) {
                    this.graph.updateNode(node.id, { label: newLabel });
                    this.updateGraph(this.graph);
                    this.onGraphChange?.();
                }
                
                modal.classList.add('hidden');
                cleanup();
            };
            
            const cancelHandler = () => {
                modal.classList.add('hidden');
                cleanup();
            };
            
            const cleanup = () => {
                saveBtn?.removeEventListener('click', saveHandler);
                cancelBtn?.removeEventListener('click', cancelHandler);
            };
            
            saveBtn?.addEventListener('click', saveHandler);
            cancelBtn?.addEventListener('click', cancelHandler);
        }
    }

    /**
     * Muestra el modal de propiedades de la arista
     */
    showEdgeModal(edge) {
        const modal = document.getElementById('edgeModal');
        const edgeWeightInput = document.getElementById('edgeWeight');
        const edgeLabelInput = document.getElementById('edgeLabel');
        
        if (modal && edgeWeightInput && edgeLabelInput) {
            edgeWeightInput.value = edge.weight || 1;
            edgeLabelInput.value = edge.label || (this.graph.isWeighted ? (edge.weight || 1).toString() : '');
            
            // Los atributos del input ya están configurados en el HTML
            // La auto-completación se maneja en el script del DOM
            
            // Mostrar/ocultar campo de peso según si el grafo es ponderado
            const weightContainer = document.getElementById('edgeWeightContainer');
            if (weightContainer) {
                weightContainer.style.display = this.graph.isWeighted ? 'block' : 'none';
            }
            
            modal.classList.remove('hidden');
            
            // Configurar botones del modal
            const saveBtn = document.getElementById('saveEdgeBtn');
            const cancelBtn = document.getElementById('cancelEdgeBtn');
            
            const saveHandler = () => {
                let newWeight = parseInt(edgeWeightInput.value);
                
                // Validar que el peso sea un entero positivo
                if (isNaN(newWeight) || newWeight < 1) {
                    this.showNotification('El peso debe ser un número entero positivo', 'error');
                    return;
                }
                
                const newLabel = edgeLabelInput.value.trim() || (this.graph.isWeighted ? newWeight.toString() : '');
                
                this.graph.updateEdge(edge.id, { 
                    weight: newWeight, 
                    label: newLabel
                });
                
                this.updateGraph(this.graph);
                this.onGraphChange?.();
                
                modal.classList.add('hidden');
                cleanup();
            };
            
            const cancelHandler = () => {
                modal.classList.add('hidden');
                cleanup();
            };
            
            const cleanup = () => {
                saveBtn?.removeEventListener('click', saveHandler);
                cancelBtn?.removeEventListener('click', cancelHandler);
            };
            
            saveBtn?.addEventListener('click', saveHandler);
            cancelBtn?.addEventListener('click', cancelHandler);
        }
    }

    /**
     * Actualiza la simulación de fuerzas
     */
    updateSimulation() {
        this.simulation
            .nodes(this.nodes)
            .on('tick', this.ticked.bind(this));

        this.simulation.force('link')
            .links(this.links);

        this.simulation.alpha(1).restart();
    }

    /**
     * Función llamada en cada tick de la simulación
     */
    ticked() {
        if (this.linkElements) {
            this.linkElements.select('line')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            // Posicionar etiquetas de peso con offset para mejor legibilidad
            this.linkElements.select('.edge-label-group')
                .attr('transform', d => {
                    const midX = (d.source.x + d.target.x) / 2;
                    const midY = (d.source.y + d.target.y) / 2;
                    
                    // Calcular vector perpendicular para offset
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    
                    if (length > 0) {
                        // Vector perpendicular normalizado
                        const perpX = -dy / length;
                        const perpY = dx / length;
                        
                        // Offset de 15 pixeles perpendicular a la línea
                        const offsetX = perpX * 15;
                        const offsetY = perpY * 15;
                        
                        return `translate(${midX + offsetX}, ${midY + offsetY})`;
                    }
                    
                    return `translate(${midX}, ${midY})`;
                });

            // Ajustar el tamaño del fondo de la etiqueta
            this.linkElements.select('.edge-label-bg')
                .attr('width', d => {
                    const text = this.graph.isWeighted ? (d.label || d.weight || '').toString() : '';
                    return Math.max(20, text.length * 8 + 8);
                })
                .attr('height', 18)
                .attr('x', d => {
                    const text = this.graph.isWeighted ? (d.label || d.weight || '').toString() : '';
                    return -Math.max(10, text.length * 4 + 4);
                })
                .attr('y', -9);
        }

        if (this.nodeElements) {
            this.nodeElements
                .attr('transform', d => `translate(${d.x},${d.y})`);
        }
    }

    /**
     * Funciones de arrastre
     */
    dragStarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
        // Añadir clase para indicar que se está arrastrando
        d3.select(event.sourceEvent.target.parentNode)
            .classed('dragging', true);
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
        
        // Actualizar posición en el grafo
        if (this.graph) {
            this.graph.updateNodePosition(d.id, event.x, event.y);
        }
    }

    dragEnded(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        
        // Remover clase de arrastre
        d3.select(event.sourceEvent.target.parentNode)
            .classed('dragging', false);
    }

    /**
     * Agrega un nodo en una posición específica
     */
    addNodeAtPosition(x, y) {
        // Mostrar modal para configurar el nodo
        const modal = document.getElementById('nodeModal');
        const nodeIdInput = document.getElementById('nodeId');
        const nodeLabelInput = document.getElementById('nodeLabel');
        
        if (modal && nodeIdInput && nodeLabelInput) {
            // Generar ID automático
            const autoId = `Node${this.graph.nodes.size + 1}`;
            nodeIdInput.value = autoId;
            nodeLabelInput.value = autoId;
            
            // La auto-completación se maneja en el script del DOM
            
            modal.classList.remove('hidden');
            
            const saveHandler = () => {
                const nodeId = nodeIdInput.value.trim();
                const nodeLabel = nodeLabelInput.value.trim() || nodeId;
                
                if (nodeId) {
                    try {
                        this.graph.addNode(nodeId, nodeLabel, x, y);
                        this.updateGraph(this.graph);
                        this.onGraphChange?.();
                        this.showNotification(`✓ Nodo "${nodeId}" creado exitosamente`, 'success');
                    } catch (error) {
                        this.showNotification(error.message, 'error');
                        return;
                    }
                }
                
                modal.classList.add('hidden');
                cleanup();
            };
            
            const cancelHandler = () => {
                modal.classList.add('hidden');
                cleanup();
            };
            
            const cleanup = () => {
                const saveBtn = document.getElementById('saveNodeBtn');
                const cancelBtn = document.getElementById('cancelNodeBtn');
                saveBtn?.removeEventListener('click', saveHandler);
                cancelBtn?.removeEventListener('click', cancelHandler);
            };
            
            const saveBtn = document.getElementById('saveNodeBtn');
            const cancelBtn = document.getElementById('cancelNodeBtn');
            saveBtn?.addEventListener('click', saveHandler);
            cancelBtn?.addEventListener('click', cancelHandler);
        }
    }

    /**
     * Selección de nodos
     */
    toggleNodeSelection(nodeId) {
        if (this.selectedNodes.has(nodeId)) {
            this.selectedNodes.delete(nodeId);
        } else {
            this.selectedNodes.add(nodeId);
        }
        this.updateNodeStyles();
    }

    /**
     * Selección de aristas
     */
    toggleEdgeSelection(edgeId) {
        if (this.selectedEdges.has(edgeId)) {
            this.selectedEdges.delete(edgeId);
        } else {
            this.selectedEdges.add(edgeId);
        }
        this.updateLinkStyles();
    }

    /**
     * Actualiza los estilos de los nodos
     */
    updateNodeStyles() {
        if (this.nodeElements) {
            this.nodeElements.select('circle')
                .style('fill', d => {
                    if (this.selectedNodes.has(d.id)) return this.colors.nodeSelected;
                    if (this.highlightedElements.has(d.id)) return this.colors.nodeHighlighted;
                    return this.colors.node;
                });
        }
    }

    /**
     * Actualiza los estilos de las aristas
     */
    updateLinkStyles() {
        if (this.linkElements) {
            this.linkElements.select('line')
                .style('stroke', d => {
                    if (this.selectedEdges.has(d.id)) return this.colors.edgeSelected;
                    if (this.highlightedElements.has(d.id)) return this.colors.edgeHighlighted;
                    return this.colors.edge;
                })
                .style('marker-end', d => {
                    if (!this.graph.isDirected) return 'none';
                    if (this.selectedEdges.has(d.id)) return 'url(#arrowhead-selected)';
                    if (this.highlightedElements.has(d.id)) return 'url(#arrowhead-highlighted)';
                    return 'url(#arrowhead)';
                });
        }
    }

    /**
     * Resalta elementos (para animaciones de algoritmos)
     */
    highlightElements(nodeIds = [], edgeIds = []) {
        this.highlightedElements.clear();
        nodeIds.forEach(id => this.highlightedElements.add(id));
        edgeIds.forEach(id => this.highlightedElements.add(id));
        
        this.updateNodeStyles();
        this.updateLinkStyles();
    }

    /**
     * Limpia todos los resaltados
     */
    clearHighlights() {
        this.highlightedElements.clear();
        this.updateNodeStyles();
        this.updateLinkStyles();
    }

    /**
     * Anima un algoritmo paso a paso
     */
    async animateAlgorithm(steps, delay = 1000) {
        this.isAnimating = true;
        this.clearHighlights();

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            if (step.highlightNodes) {
                this.highlightElements(step.highlightNodes, step.highlightEdges || []);
            }
            
            if (step.callback) {
                step.callback(i, step);
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.isAnimating = false;
        this.clearHighlights();
    }

    /**
     * Centra la vista en el grafo
     */
    centerView() {
        if (this.nodes.length === 0) return;

        const bounds = this.getBounds();
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        
        const scale = Math.min(
            this.width / (width + 100),
            this.height / (height + 100),
            1
        );
        
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        const transform = d3.zoomIdentity
            .translate(this.width / 2 - centerX * scale, this.height / 2 - centerY * scale)
            .scale(scale);
        
        this.svg.transition()
            .duration(750)
            .call(d3.zoom().transform, transform);
    }

    /**
     * Obtiene los límites del grafo
     */
    getBounds() {
        if (this.nodes.length === 0) {
            return { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
        }

        const bounds = {
            minX: Math.min(...this.nodes.map(n => n.x)) - this.nodeRadius,
            maxX: Math.max(...this.nodes.map(n => n.x)) + this.nodeRadius,
            minY: Math.min(...this.nodes.map(n => n.y)) - this.nodeRadius,
            maxY: Math.max(...this.nodes.map(n => n.y)) + this.nodeRadius
        };

        return bounds;
    }

    /**
     * Exporta la visualización como imagen
     */
    exportAsImage() {
        const svgNode = this.svg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        canvas.width = this.width;
        canvas.height = this.height;
        
        img.onload = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = `grafo_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        };
        
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        img.src = url;
    }

    /**
     * Configura la herramienta actual
     */
    setTool(tool) {
        this.currentTool = tool;
        this.resetEdgeCreation();
        this.selectedNodes.clear();
        this.selectedEdges.clear();
        this.updateNodeStyles();
        this.updateLinkStyles();
        
        // Cambiar cursor según la herramienta
        if (tool === 'delete') {
            this.svg.style('cursor', 'crosshair');
        } else {
            this.svg.style('cursor', 'default');
        }
        
        // Actualizar feedback visual
        this.updateToolVisualFeedback();
        
        console.log(`Herramienta activa: ${tool}`);
    }

    /**
     * Elimina un nodo
     */
    deleteNode(nodeId) {
        const node = this.graph.getNode(nodeId);
        if (node && confirm(`¿Está seguro de eliminar el nodo "${nodeId}"?\n\nEsto también eliminará todas las aristas conectadas a este nodo.`)) {
            this.graph.removeNode(nodeId);
            this.selectedNodes.delete(nodeId);
            this.updateGraph(this.graph);
            this.onGraphChange?.();
            
            // Mostrar mensaje informativo
            console.log(`🗑️ Nodo "${nodeId}" eliminado exitosamente`);
        }
    }

    /**
     * Elimina una arista
     */
    deleteEdge(edgeId) {
        const edge = this.graph.getEdge(edgeId);
        if (edge && confirm(`¿Está seguro de eliminar la arista entre "${edge.source}" y "${edge.target}"?${edge.weight !== 1 ? `\n\nPeso: ${edge.weight}` : ''}`)) {
            this.graph.removeEdge(edgeId);
            this.selectedEdges.delete(edgeId);
            this.updateGraph(this.graph);
            this.onGraphChange?.();
            
            // Mostrar mensaje informativo
            console.log(`🗑️ Arista "${edge.source}-${edge.target}" eliminada exitosamente`);
        }
    }

    /**
     * Elimina elementos seleccionados
     */
    deleteSelected() {
        let deleted = false;
        
        // Eliminar nodos seleccionados
        for (const nodeId of this.selectedNodes) {
            if (confirm(`¿Está seguro de eliminar el nodo ${nodeId}?`)) {
                this.graph.removeNode(nodeId);
                deleted = true;
            }
        }
        
        // Eliminar aristas seleccionadas
        for (const edgeId of this.selectedEdges) {
            const edge = this.graph.getEdge(edgeId);
            if (edge && confirm(`¿Está seguro de eliminar la arista ${edge.source}-${edge.target}?`)) {
                this.graph.removeEdge(edgeId);
                deleted = true;
            }
        }
        
        if (deleted) {
            this.selectedNodes.clear();
            this.selectedEdges.clear();
            this.updateGraph(this.graph);
            this.onGraphChange?.();
        }
    }

    /**
     * Callback que se ejecuta cuando el grafo cambia
     */
    onGraphChange = null;
}