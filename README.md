# Sistema de Visualización y Resolución de Grafos

Un sistema completo e interactivo para visualizar y resolver grafos utilizando los algoritmos DFS, BFS, Kruskal y Prim. Desarrollado con JavaScript, HTML5, CSS3 y D3.js.

## 🌟 Características Principales

### Algoritmos Implementados
- **DFS (Búsqueda en Profundidad)**: Exploración completa con orden de recorrido
- **BFS (Búsqueda en Amplitud)**: Búsqueda por niveles y distancias mínimas
- **Kruskal**: Árbol de Expansión Mínima con Union-Find
- **Prim**: Árbol de Expansión Mínima con selección incremental

### Funcionalidades
✅ **Visualización Interactiva**
- Creación y edición de grafos mediante interfaz gráfica
- Soporte para grafos dirigidos y no dirigidos
- Soporte para grafos ponderados y no ponderados
- Animaciones en tiempo real de algoritmos

✅ **Análisis de Grafos**
- Verificación de conectividad entre nodos
- Cálculo de distancias mínimas en número de saltos
- Detección de rutas y caminos
- Estadísticas completas del grafo

✅ **Árbol de Expansión Mínima**
- Generación de MST con Kruskal y Prim
- Visualización separada del MST
- Comparación automática entre ambos algoritmos
- Análisis de eficiencia y costos

✅ **Exportación e Importación**
- Exportación en formato JSON y CSV
- Exportación de imágenes PNG
- Matrices de adyacencia e incidencia
- Reportes completos con resultados

✅ **Historial y Gestión**
- Historial completo de estados del grafo
- Funciones deshacer/rehacer
- Guardar y cargar grafos
- Comparación entre estados

## 🚀 Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para librerías CDN)

### Instalación
1. Clona o descarga este repositorio
2. Abre `index.html` en tu navegador web
3. ¡Listo! No se requiere servidor web local

### Uso Básico

#### Crear un Grafo
1. **Agregar Nodos**: Selecciona la herramienta "Agregar Nodo" y haz clic en el canvas
2. **Agregar Aristas**: Selecciona "Agregar Arista" y haz clic en dos nodos para conectarlos
3. **Configurar Tipo**: Marca las casillas para grafo dirigido/ponderado según necesites

#### Ejecutar Algoritmos
1. **Seleccionar Nodos**: Usa los desplegables para elegir nodo inicial y final
2. **Ejecutar**: Haz clic en el botón del algoritmo deseado (DFS, BFS, Kruskal, Prim)
3. **Ver Resultados**: Los resultados aparecen en el panel derecho con animaciones

#### Exportar Resultados
- **JSON**: Exporta el grafo completo con metadatos
- **CSV**: Exporta listas de nodos, aristas o matriz de adyacencia
- **Imagen**: Descarga una imagen PNG del grafo actual

## 📊 Funcionalidades Avanzadas

### Algoritmos de Búsqueda (DFS/BFS)
- Muestra el **orden de recorrido** paso a paso
- Verifica **existencia de caminos** entre dos nodos
- Calcula **distancias mínimas** en número de saltos
- Encuentra y resalta **la ruta específica** encontrada
- Animación visual del proceso de búsqueda

### Algoritmos MST (Kruskal/Prim)
- Genera el **Árbol de Expansión Mínima** completo
- Muestra el MST en un **canvas separado** del grafo original
- **Compara automáticamente** resultados de ambos algoritmos
- Exporta comparaciones en JSON/CSV
- Análisis de eficiencia y costos totales

### Gestión de Grafos
- **Edición en tiempo real**: Agregar/eliminar nodos y aristas
- **Recálculo automático**: Los algoritmos se ajustan a cambios
- **Historial completo**: Cada acción se guarda automáticamente
- **Miniaturás visuales**: El historial incluye imágenes de cada estado

## 🛠️ Estructura del Proyecto

```
proyecto-grafos/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos CSS modernos
└── js/
    ├── graph.js            # Clase principal de grafos
    ├── algorithms.js       # Implementación de algoritmos
    ├── visualization.js    # Visualización con D3.js
    ├── export.js          # Sistema de exportación
    ├── history.js         # Gestión de historial
    └── main.js            # Aplicación principal
```

### Componentes Principales

#### `Graph` (graph.js)
- Estructura de datos del grafo
- Operaciones CRUD de nodos y aristas
- Validaciones y estadísticas
- Serialización JSON

#### `GraphAlgorithms` (algorithms.js)
- Implementación de DFS, BFS, Kruskal, Prim
- Union-Find para Kruskal
- Comparación de algoritmos MST
- Análisis de conectividad

#### `GraphVisualization` (visualization.js)
- Renderizado con D3.js
- Interacciones de usuario
- Animaciones de algoritmos
- Controles de zoom y pan

#### `GraphExporter` (export.js)
- Exportación JSON/CSV/PNG
- Matrices de adyacencia
- Reportes completos
- Validación de formatos

#### `GraphHistory` (history.js)
- Gestión de estados
- Funciones undo/redo
- Almacenamiento local
- Comparación de estados

## 🎮 Controles y Atajos

### Herramientas
- **1**: Agregar Nodo
- **2**: Agregar Arista  
- **3**: Seleccionar
- **Delete/Backspace**: Eliminar seleccionados

### Atajos de Teclado
- **Ctrl+N**: Nuevo grafo
- **Ctrl+S**: Guardar grafo
- **Ctrl+O**: Abrir grafo
- **Ctrl+E**: Exportar JSON
- **Ctrl+Z**: Deshacer
- **Ctrl+Shift+Z**: Rehacer
- **ESC**: Cerrar modales

### Interacciones del Mouse
- **Click**: Seleccionar elemento
- **Doble Click**: Editar propiedades
- **Arrastrar**: Mover nodos
- **Rueda**: Zoom in/out

## 📈 Ejemplos de Uso

### Caso 1: Encontrar Ruta Más Corta
1. Crea un grafo con varios nodos conectados
2. Selecciona nodo inicial y final
3. Ejecuta BFS para obtener la ruta más corta
4. Ve la animación y el número de saltos

### Caso 2: Comparar Algoritmos MST
1. Crea un grafo ponderado (marca "Grafo Ponderado")
2. Ejecuta Kruskal
3. Ejecuta Prim
4. Ve la comparación automática en el panel de resultados
5. Exporta la comparación en CSV

### Caso 3: Análisis de Conectividad
1. Crea un grafo con componentes separados
2. Ejecuta DFS desde diferentes nodos
3. Observa qué nodos son alcanzables
4. Ve las estadísticas de conectividad

## 🔧 Personalización

### Modificar Colores
Edita las variables CSS en `styles.css`:
```css
:root {
    --primary-color: #3b82f6;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    /* ... más colores */
}
```

### Agregar Nuevos Algoritmos
1. Implementa el algoritmo en `algorithms.js`
2. Agrega el botón en `index.html`
3. Conecta el evento en `main.js`
4. Agrega la visualización si es necesario

### Modificar Exportación
Extiende `GraphExporter` en `export.js` para:
- Nuevos formatos de archivo
- Diferentes tipos de CSV
- Reportes personalizados

## 🐛 Solución de Problemas

### El grafo no se muestra
- Verifica que todas las librerías CDN se carguen correctamente
- Abre las herramientas de desarrollador para ver errores
- Asegúrate de usar un navegador moderno

### Los algoritmos no funcionan
- Verifica que el grafo tenga nodos conectados
- Para MST, asegúrate de que el grafo sea ponderado
- Revisa que los nodos inicial/final estén seleccionados

### Problemas de rendimiento
- El sistema está optimizado para grafos de hasta 100 nodos
- Para grafos más grandes, considera desactivar animaciones
- Usa las herramientas de profiling del navegador

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo `LICENSE` para detalles.

## 🙏 Reconocimientos

- **D3.js** por la excelente librería de visualización
- **Inter Font** por la tipografía moderna
- **Font Awesome** por los iconos
- Comunidad de desarrolladores por algoritmos de referencia

## 📞 Soporte

Si encuentras problemas o tienes preguntas:
1. Revisa la documentación anterior
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles específicos
4. Incluye capturas de pantalla si es posible

---

## 🎯 Próximas Características

- [ ] Algoritmo de Dijkstra para caminos más cortos ponderados
- [ ] Algoritmo de Floyd-Warshall para todos los pares
- [ ] Detección de ciclos avanzada
- [ ] Exportación a formatos Graphviz/GEXF
- [ ] Modo colaborativo en tiempo real
- [ ] Templates de grafos predefinidos
- [ ] Análisis de centralidad de nodos
- [ ] Soporte para grafos dirigidos acíclicos (DAG)

**¡Disfruta explorando el fascinante mundo de los grafos!** 🎉