/**
 * Clase para exportar datos y resultados del grafo
 */
class GraphExporter {
    constructor(graph, visualization) {
        this.graph = graph;
        this.visualization = visualization;
    }

    /**
     * Exporta el grafo en formato JSON
     */
    exportToJSON(includeResults = false, algorithmResults = null) {
        const graphData = this.graph.toJSON();
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                type: 'graph'
            },
            graph: graphData,
            statistics: this.graph.getStatistics()
        };

        if (includeResults && algorithmResults) {
            exportData.algorithmResults = algorithmResults;
        }

        const dataStr = JSON.stringify(exportData, null, 2);
        this.downloadFile(dataStr, `grafo_${this.getTimestamp()}.json`, 'application/json');
        
        return exportData;
    }

    /**
     * Exporta el grafo en formato CSV
     */
    exportToCSV(type = 'adjacency') {
        let csvContent = '';
        
        switch (type) {
            case 'adjacency':
                csvContent = this.generateAdjacencyCSV();
                break;
            case 'edges':
                csvContent = this.generateEdgeListCSV();
                break;
            case 'nodes':
                csvContent = this.generateNodeListCSV();
                break;
            default:
                throw new Error('Tipo de CSV no válido');
        }

        this.downloadFile(csvContent, `grafo_${type}_${this.getTimestamp()}.csv`, 'text/csv');
        return csvContent;
    }

    /**
     * Genera matriz de adyacencia en formato CSV
     */
    generateAdjacencyCSV() {
        const nodes = this.graph.getNodes();
        const nodeIds = nodes.map(n => n.id);
        
        // Encabezado
        let csv = ',' + nodeIds.join(',') + '\n';
        
        // Filas de la matriz
        for (const sourceId of nodeIds) {
            let row = sourceId + ',';
            const rowValues = [];
            
            for (const targetId of nodeIds) {
                if (sourceId === targetId) {
                    rowValues.push('0');
                } else {
                    const weight = this.graph.getEdgeWeight(sourceId, targetId);
                    rowValues.push(weight === Infinity ? '0' : weight.toString());
                }
            }
            
            csv += rowValues.join(',') + '\n';
        }
        
        return csv;
    }

    /**
     * Genera lista de aristas en formato CSV
     */
    generateEdgeListCSV() {
        const edges = this.graph.getEdges();
        
        let csv = this.graph.isWeighted 
            ? 'Source,Target,Weight,Label\n'
            : 'Source,Target,Label\n';
        
        for (const edge of edges) {
            const row = this.graph.isWeighted
                ? `${edge.source},${edge.target},${edge.weight},"${edge.label || ''}"`
                : `${edge.source},${edge.target},"${edge.label || ''}"`;
            csv += row + '\n';
        }
        
        return csv;
    }

    /**
     * Genera lista de nodos en formato CSV
     */
    generateNodeListCSV() {
        const nodes = this.graph.getNodes();
        
        let csv = 'ID,Label,X,Y,Degree\n';
        
        for (const node of nodes) {
            const degree = this.graph.getNeighbors(node.id).length;
            csv += `${node.id},"${node.label}",${node.x},${node.y},${degree}\n`;
        }
        
        return csv;
    }

    /**
     * Exporta resultados de algoritmos
     */
    exportAlgorithmResults(results, format = 'json') {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                algorithm: results.algorithm,
                graphType: {
                    isDirected: this.graph.isDirected,
                    isWeighted: this.graph.isWeighted,
                    nodeCount: this.graph.nodes.size,
                    edgeCount: this.graph.edges.size
                }
            },
            results: results
        };

        if (format === 'json') {
            const dataStr = JSON.stringify(exportData, null, 2);
            this.downloadFile(
                dataStr, 
                `algoritmo_${results.algorithm}_${this.getTimestamp()}.json`, 
                'application/json'
            );
        } else if (format === 'csv') {
            const csvContent = this.algorithmResultsToCSV(results);
            this.downloadFile(
                csvContent, 
                `algoritmo_${results.algorithm}_${this.getTimestamp()}.csv`, 
                'text/csv'
            );
        }

        return exportData;
    }

    /**
     * Convierte resultados de algoritmos a CSV
     */
    algorithmResultsToCSV(results) {
        let csv = '';
        
        switch (results.algorithm) {
            case 'DFS':
            case 'BFS':
                csv = this.searchAlgorithmToCSV(results);
                break;
            case 'Kruskal':
            case 'Prim':
                csv = this.mstAlgorithmToCSV(results);
                break;
            default:
                csv = this.genericResultsToCSV(results);
        }
        
        return csv;
    }

    /**
     * Convierte resultados de búsqueda a CSV
     */
    searchAlgorithmToCSV(results) {
        let csv = `Algoritmo,${results.algorithm}\n`;
        csv += `Nodo Inicial,${results.startNode}\n`;
        csv += `Nodo Objetivo,${results.targetNode || 'N/A'}\n`;
        csv += `Encontrado,${results.found ? 'Sí' : 'No'}\n`;
        csv += `Distancia,${results.distance}\n\n`;
        
        csv += 'Orden de Visita\n';
        csv += 'Posición,Nodo\n';
        results.visitOrder.forEach((node, index) => {
            csv += `${index + 1},${node}\n`;
        });
        
        if (results.path && results.path.length > 0) {
            csv += '\nRuta Encontrada\n';
            csv += 'Posición,Nodo\n';
            results.path.forEach((node, index) => {
                csv += `${index + 1},${node}\n`;
            });
        }
        
        return csv;
    }

    /**
     * Convierte resultados de MST a CSV
     */
    mstAlgorithmToCSV(results) {
        let csv = `Algoritmo,${results.algorithm}\n`;
        csv += `Peso Total,${results.totalWeight}\n`;
        csv += `Número de Aristas MST,${results.mstEdges.length}\n\n`;
        
        csv += 'Aristas del MST\n';
        csv += 'Source,Target,Weight\n';
        results.mstEdges.forEach(edge => {
            csv += `${edge.source},${edge.target},${edge.weight}\n`;
        });
        
        if (results.steps) {
            csv += '\nPasos del Algoritmo\n';
            csv += 'Paso,Arista,Acción,Peso\n';
            results.steps.forEach((step, index) => {
                csv += `${index + 1},${step.edge.source}-${step.edge.target},${step.action},${step.edge.weight}\n`;
            });
        }
        
        return csv;
    }

    /**
     * Convierte resultados genéricos a CSV
     */
    genericResultsToCSV(results) {
        let csv = 'Propiedad,Valor\n';
        
        const flattenObject = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    flattenObject(value, newKey);
                } else if (Array.isArray(value)) {
                    csv += `${newKey},"${value.join(', ')}"\n`;
                } else {
                    csv += `${newKey},${value}\n`;
                }
            }
        };
        
        flattenObject(results);
        return csv;
    }

    /**
     * Exporta comparación de MST
     */
    exportMSTComparison(comparison) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                type: 'mst_comparison',
                graphType: {
                    isDirected: this.graph.isDirected,
                    isWeighted: this.graph.isWeighted,
                    nodeCount: this.graph.nodes.size,
                    edgeCount: this.graph.edges.size
                }
            },
            comparison: comparison
        };

        // JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        this.downloadFile(
            jsonData, 
            `comparacion_mst_${this.getTimestamp()}.json`, 
            'application/json'
        );

        // CSV
        let csv = 'Comparación de Algoritmos MST\n\n';
        csv += 'Algoritmo,Peso Total,Número de Aristas,Eficiencia\n';
        csv += `Kruskal,${comparison.comparison.kruskalWeight},${comparison.comparison.kruskalEdges},${comparison.results.kruskal.statistics.efficiency}%\n`;
        csv += `Prim,${comparison.comparison.primWeight},${comparison.comparison.primEdges},${comparison.results.prim.statistics.efficiency}%\n\n`;
        
        csv += 'Resultados\n';
        csv += `Mismo Peso Total,${comparison.comparison.sameWeight ? 'Sí' : 'No'}\n`;
        csv += `MSTs Idénticos,${comparison.comparison.identical ? 'Sí' : 'No'}\n\n`;
        
        // Aristas de Kruskal
        csv += 'Aristas MST - Kruskal\n';
        csv += 'Source,Target,Weight\n';
        comparison.results.kruskal.mstEdges.forEach(edge => {
            csv += `${edge.source},${edge.target},${edge.weight}\n`;
        });
        
        csv += '\nAristas MST - Prim\n';
        csv += 'Source,Target,Weight\n';
        comparison.results.prim.mstEdges.forEach(edge => {
            csv += `${edge.source},${edge.target},${edge.weight}\n`;
        });

        this.downloadFile(
            csv, 
            `comparacion_mst_${this.getTimestamp()}.csv`, 
            'text/csv'
        );

        return exportData;
    }

    /**
     * Exporta imagen del grafo
     */
    async exportImage(format = 'png', includeBackground = true) {
        try {
            const svgElement = this.visualization.svg.node();
            const svgData = new XMLSerializer().serializeToString(svgElement);
            
            // Crear canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.visualization.width;
            canvas.height = this.visualization.height;
            
            // Fondo blanco si se solicita
            if (includeBackground) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Convertir SVG a imagen
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            return new Promise((resolve) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    // Descargar imagen
                    const link = document.createElement('a');
                    link.download = `grafo_${this.getTimestamp()}.${format}`;
                    link.href = canvas.toDataURL(`image/${format}`);
                    link.click();
                    
                    resolve(canvas.toDataURL(`image/${format}`));
                };
                
                img.src = url;
            });
        } catch (error) {
            console.error('Error al exportar imagen:', error);
            throw error;
        }
    }

    /**
     * Exporta reporte completo del grafo
     */
    exportCompleteReport(algorithmResults = {}) {
        const report = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                type: 'complete_report'
            },
            graph: {
                data: this.graph.toJSON(),
                statistics: this.graph.getStatistics(),
                properties: {
                    isDirected: this.graph.isDirected,
                    isWeighted: this.graph.isWeighted,
                    nodeCount: this.graph.nodes.size,
                    edgeCount: this.graph.edges.size
                }
            },
            algorithms: algorithmResults,
            matrices: {
                adjacency: this.generateAdjacencyMatrix(),
                incidence: this.generateIncidenceMatrix()
            }
        };

        const reportStr = JSON.stringify(report, null, 2);
        this.downloadFile(
            reportStr, 
            `reporte_completo_${this.getTimestamp()}.json`, 
            'application/json'
        );

        return report;
    }

    /**
     * Genera matriz de adyacencia
     */
    generateAdjacencyMatrix() {
        const nodes = this.graph.getNodes();
        const nodeIds = nodes.map(n => n.id);
        const matrix = {};
        
        // Inicializar matriz
        for (const sourceId of nodeIds) {
            matrix[sourceId] = {};
            for (const targetId of nodeIds) {
                matrix[sourceId][targetId] = 0;
            }
        }
        
        // Llenar con pesos de aristas
        for (const edge of this.graph.getEdges()) {
            matrix[edge.source][edge.target] = edge.weight;
            if (!this.graph.isDirected) {
                matrix[edge.target][edge.source] = edge.weight;
            }
        }
        
        return {
            nodes: nodeIds,
            matrix: matrix
        };
    }

    /**
     * Genera matriz de incidencia
     */
    generateIncidenceMatrix() {
        const nodes = this.graph.getNodes();
        const edges = this.graph.getEdges();
        const nodeIds = nodes.map(n => n.id);
        const matrix = {};
        
        // Inicializar matriz
        for (const nodeId of nodeIds) {
            matrix[nodeId] = {};
            for (const edge of edges) {
                matrix[nodeId][edge.id] = 0;
            }
        }
        
        // Llenar matriz de incidencia
        for (const edge of edges) {
            if (this.graph.isDirected) {
                matrix[edge.source][edge.id] = 1;  // Saliente
                matrix[edge.target][edge.id] = -1; // Entrante
            } else {
                matrix[edge.source][edge.id] = 1;
                matrix[edge.target][edge.id] = 1;
            }
        }
        
        return {
            nodes: nodeIds,
            edges: edges.map(e => e.id),
            matrix: matrix
        };
    }

    /**
     * Importa grafo desde JSON
     */
    importFromJSON(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (data.graph) {
                this.graph.fromJSON(data.graph);
                return {
                    success: true,
                    metadata: data.metadata,
                    algorithmResults: data.algorithmResults
                };
            } else {
                // Formato directo del grafo
                this.graph.fromJSON(data);
                return { success: true };
            }
        } catch (error) {
            throw new Error(`Error al importar JSON: ${error.message}`);
        }
    }

    /**
     * Descarga un archivo
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
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
     * Obtiene timestamp para nombres de archivo
     */
    getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    }

    /**
     * Valida formato de archivo antes de importar
     */
    validateImportFormat(content, expectedFormat) {
        switch (expectedFormat) {
            case 'json':
                try {
                    JSON.parse(content);
                    return true;
                } catch {
                    return false;
                }
            case 'csv':
                return typeof content === 'string' && content.includes(',');
            default:
                return false;
        }
    }
}