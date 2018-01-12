const gridController = (() => {

    let canvas = null,
        context = null,
        config = null,
        gridData = null,
        tileTypeEnums = null,
        gridSize = null,
        mouse = {
            isDown: false,
            currentPosition: {
                x: 0,
                y: 0
            },
            previousPosition: {
                x: 0,
                y: 0
            },
            recordedGridPosition: {
                x: null,
                y: null
            }
        };

    getCurrentGridPositionAsArray = () => (
        [mouse.recordedGridPosition.x, mouse.recordedGridPosition.y]
    );

    initGridData = () => {
        let { height, width } = getGridSize();
        gridData = new Array(width);
        for (let i=0; i < width; i++){
            gridData[i] = new Array(height).fill(tileTypeEnums.EMPTY);
        }
    };

    tileColorPicker = (type) => {
        switch(type){
            case tileTypeEnums.CANDIDATE_NEW:
                return 'orange';
            case tileTypeEnums.CANDIDATE_OLD:
                return 'yellow';
            case tileTypeEnums.DESTINATION:
                return 'purple';
            case tileTypeEnums.EMPTY:
                return 'white';
            case tileTypeEnums.START:
                return 'blue';
            case tileTypeEnums.PATH:
                return 'green';
            case tileTypeEnums.WALL:
                return 'black';
            default:
                throw 'INVALID TILE TYPE';
        }
    };

    removeUniqueFromGrid = (type) => {
        let coordinates = null;
        gridData.some((column, columnIndex) => {
            column.some((element, rowIndex) => {
                if (gridData[columnIndex][rowIndex] === type) {
                    gridData[columnIndex][rowIndex] = tileTypeEnums.EMPTY;
                    coordinates = {
                        x: columnIndex,
                        y: rowIndex,
                    };
                    return true;
                }
                return false;
            })
        });
        return coordinates;
    };

    updateGridData = (x, y, type) => {
        if (gridData[x][y] !== type || type === tileTypeEnums.WALL) {
            switch(type){
                case tileTypeEnums.WALL:
                    gridData[x][y] = type;
                    fillGridCell(x, y, type);
                    if (x > 0 && y > 0) {
                        gridData[x-1][y-1] = type;
                        gridData[x-1][y] = type;
                        gridData[x][y-1] = type;
                        fillGridCell(x-1, y-1, type);
                        fillGridCell(x-1, y, type);
                        fillGridCell(x, y-1, type);
                    }
                    break;
                case tileTypeEnums.EMPTY:
                case tileTypeEnums.CANDIDATE_NEW:
                case tileTypeEnums.CANDIDATE_OLD:
                case tileTypeEnums.PATH:
                    gridData[x][y] = type;
                    fillGridCell(x, y, type);
                    break;
                case tileTypeEnums.START:
                case tileTypeEnums.DESTINATION:
                    const coordinates = removeUniqueFromGrid(type);
                    if (coordinates) {
                        fillGridCell(coordinates.x, coordinates.y, tileTypeEnums.EMPTY);
                    }
                    gridData[x][y] = type;
                    fillGridCell(x, y, type);
                    break;
                default:
                    throw('Invalid input type!');
            }
        }
    };

    findCanvas = (canvasClass) => {
        canvas = $('canvas.' + canvasClass)[0];
        context = canvas.getContext('2d');
        context.translate(0.5, 0.5);
    };

    checkPositionOnCanvas = (event) => [
        Math.floor((event.pageX - event.target.offsetLeft)),
        Math.floor((event.pageY - event.target.offsetTop))
    ];

    setCoordinates = (coords, event) => {
        [coords.x, coords.y] = checkPositionOnCanvas(event);
    };

    drawLine = (x1, y1, x2, y2, brushColor, brushSize) => {
        brushColor = setDefault(brushColor, '#eee');
        brushSize = setDefault(brushSize, 1);
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.strokeStyle = brushColor;
        context.lineWidth = brushSize;
        context.stroke();
    };

    drawGrid = (cellSize) => {
        // context.beginPath();
        // for(let i = cellSize, canvasSize = canvas.width; i < canvasSize; i += cellSize){
        //     drawLine(0, i, canvasSize, i);
        //     drawLine(i, 0, i, canvasSize);
        // }
        // context.closePath();
    };

    render = () => {
        clearCanvas();
        drawGrid(config.cellSize);
        gridData.forEach((column, columnIndex) => {
            column.forEach((cell, rowIndex) => {
                fillGridCell(columnIndex, rowIndex, cell);
            });
        });
    };

    fillGridCell = (cellX, cellY, type) => {
        fillColor = tileColorPicker(type);
        context.fillStyle = setDefault(fillColor, 'black');
        context.fillRect(
            cellX * config.cellSize - 0.5,
            cellY * config.cellSize - 0.5,
            config.cellSize,
            config.cellSize
        );
        // if (type === tileTypeEnums.EMPTY) {
        //     context.strokeStyle = '#eee';
        //     context.lineWidth = 1;
        //     context.stroke();
        // }
    };

    handleMouseUp = () => {
        mouse.isDown = false;
        mouse.currentPosition.x = null;
    };

    currentGridPosition = () => [
        Math.floor(mouse.currentPosition.x / config.cellSize),
        Math.floor(mouse.currentPosition.y / config.cellSize)
    ];

    setCurrentGridPosition = () => {
        [mouse.recordedGridPosition.x, mouse.recordedGridPosition.y] = currentGridPosition();
    };

    handlePositionGap = (oldGridPos, currGridPos, posDiff) => {
        const eqSlope = (currGridPos[1] - oldGridPos[1]) / (currGridPos[0] - oldGridPos[0]);
        const eqLineY = (x) => // equation for y with respect to x
            eqSlope * x - eqSlope * oldGridPos[0] + oldGridPos[1];
        const eqLineX = (y) => // equation for x with respect to y
            (y - oldGridPos[1]) / eqSlope + oldGridPos[0];
        const tilesToFill = [];
        if (posDiff.x > 1) {
            const smallerX = oldGridPos[0] < currGridPos[0] ? oldGridPos[0] : currGridPos[0];
            for (let i = 1; i < posDiff.x; i++) {
                let tileCandidate = {
                    x: smallerX + i,
                    y: Math.round(eqLineY(smallerX + i)),
                };
                if (!tilesToFill.some(tile => (tile.x === tileCandidate.x && tile.y === tileCandidate.y))) {
                    tilesToFill.push(tileCandidate);
                }
            }
        }
        if (posDiff.y > 1) {
            const smallerY = oldGridPos[1] < currGridPos[1] ? oldGridPos[1] : currGridPos[1];
            for (let i = 1; i < posDiff.y; i++) {
                let tileCandidate = {
                    x: Math.round(eqLineX(smallerY + i)),
                    y: smallerY + i,
                };
                if (!tilesToFill.some(tile => (tile.x === tileCandidate.x && tile.y === tileCandidate.y))) {
                    tilesToFill.push(tileCandidate);
                }
            }
        }
        tilesToFill.map((tile) => {
            updateGridData(tile.x, tile.y, getInputType());
        });
    };

    let gridMouseHandlers = {
        mouseDown: (event) => {
            mouse.isDown = true;
            setCoordinates(mouse.currentPosition, event);
            setCurrentGridPosition();
            updateGridData(...currentGridPosition(), getInputType());
        },
        mouseMove: (event) => {
            if (mouse.isDown) {
                setCoordinates(mouse.currentPosition, event);
                let oldGridPos = [mouse.recordedGridPosition.x, mouse.recordedGridPosition.y];
                let currGridPos = currentGridPosition();
                const posDiff = {
                    x: Math.abs(oldGridPos[0] - currGridPos[0]),
                    y: Math.abs(oldGridPos[1] - currGridPos[1]),
                };
                if (!(posDiff.x === 0 && posDiff.y === 0)){
                    if (posDiff.x > 1 || posDiff.y > 1){
                        handlePositionGap(oldGridPos, currGridPos, posDiff);
                        gridMouseHandlers.mouseDown(event);
                    } else {
                        gridMouseHandlers.mouseDown(event);
                    }
                }
            }
        }
    };

    mountMouseEvents = (handlers) => {
        canvas.addEventListener('mousedown', handlers.mouseDown);
        canvas.addEventListener('mousemove', handlers.mouseMove);
    };

    unMountMouseEvents = () => {
        canvas.removeEventListener('mousedown', pixelMouseHandlers.mouseDown);
        canvas.removeEventListener('mousemove', pixelMouseHandlers.mouseMove);
        canvas.removeEventListener('mousedown', gridMouseHandlers.mouseDown);
        canvas.removeEventListener('mousemove', gridMouseHandlers.mouseMove);
    };

    initialize = (configObj) => {
        config = configObj;
        tileTypeEnums = configObj.tileTypeEnums;
        findCanvas(config.canvasClass);
        initGridData();
        gridSize = getGridSize();
        render();
        window.addEventListener('mouseup', handleMouseUp);
        mountMouseEvents(gridMouseHandlers);
    };

    clearCanvas = () => {
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.restore();
    };

    clearGridData = () => {
        gridData.forEach((column) => {
            column.fill(tileTypeEnums.EMPTY);
        });
    };

    clear = () => {
        clearCanvas();
        clearGridData();
        render();
    };

    getGridSize = () => ({
        width: Math.ceil(canvas.width / config.cellSize),
        height: Math.ceil(canvas.height / config.cellSize),
    });

    getGrid = () => gridData;

    return {
        clear,
        deactivateMouse: unMountMouseEvents,
        getGridSize,
        getGrid,
        updateGridData,
        init: initialize,
        forceRender: render,
    };

})();