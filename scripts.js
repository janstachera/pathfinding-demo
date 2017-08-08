const config = {
    canvasClass: 'drawArea',
    cellSize: 20,
    radioInputName: 'gridInput',
    tileTypeEnums: {
        CANDIDATE_NEW: 'CANDIDATE_NEW',
        CANDIDATE_OLD: 'CANDIDATE_OLD',
        DESTINATION: 'DESTINATION',
        EMPTY: 'EMPTY',
        START: 'START',
        PATH: 'PATH',
        WALL: 'WALL',
    },
};

setDefault = (argument, defaultValue) =>
    typeof argument === 'undefined'
        ? defaultValue
        : argument;

const gridController = (() => {

    let canvas = null,
        context = null,
        config = null,
        gridData = null,
        tileTypeEnums = null,
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
            currentGridPosition: {
                x: null,
                y: null
            }
        };

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
        gridData.map((column, columnIndex) => {
            column.map((element, rowIndex) => {
                if (gridData[columnIndex][rowIndex] === type) {
                    gridData[columnIndex][rowIndex] = tileTypeEnums.EMPTY;
                }
            })
        });
    };

    updateGridData = (x, y, type) => {
        if (gridData[x][y] !== type) {
            switch(type){
                case tileTypeEnums.WALL:
                case tileTypeEnums.EMPTY:
                case tileTypeEnums.CANDIDATE_NEW:
                case tileTypeEnums.CANDIDATE_OLD:
                case tileTypeEnums.PATH:
                    gridData[x][y] = type;
                    break;
                case tileTypeEnums.START:
                case tileTypeEnums.DESTINATION:
                    removeUniqueFromGrid(type);
                    gridData[x][y] = type;
                    break;
                default:
                    throw('Invalid input type!');
            }
            render();
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
        brushColor = setDefault(brushColor, 'lightgrey');
        brushSize = setDefault(brushSize, 1);
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.strokeStyle = brushColor;
        context.lineWidth = brushSize;
        context.stroke();
        context.closePath();
    };

    drawGrid = (cellSize) => {
        for(let i = cellSize, canvasSize = canvas.width; i < canvasSize; i += cellSize){
            drawLine(0, i, canvasSize, i);
            drawLine(i, 0, i, canvasSize);
        }
    };

    render = () => {
        clearCanvas();
        drawGrid(config.cellSize);
        gridData.forEach((column, columnIndex) => {
            column.forEach((cell, rowIndex) => {
                fillGridCell(columnIndex, rowIndex, tileColorPicker(cell));
            });
        });
    };

    fillGridCell = (cellX, cellY, fillColor) => {
        context.fillStyle = setDefault(fillColor, 'black');
        context.fillRect(
            cellX * config.cellSize,
            cellY * config.cellSize,
            config.cellSize,
            config.cellSize
        );
    };

    handleMouseUp = () => {
        mouse.isDown = false;
        mouse.currentPosition.x = null;
    };

    currentGridPosition = () => [
        Math.floor(mouse.currentPosition.x / config.cellSize),
        Math.floor(mouse.currentPosition.y / config.cellSize)
    ];

    // let pixelMouseHandlers = {
    //     mouseDown: (event) => {
    //         mouse.isDown = true;
    //         setCoordinates(mouse.currentPosition, event);
    //         let current = mouse.currentPosition;
    //         context.fillRect(current.x, current.y, 1, 1);
    //     },
    //     mouseMove: (event) => {
    //         if (mouse.isDown) {
    //             mouse.previousPosition.x = mouse.currentPosition.x;
    //             mouse.previousPosition.y = mouse.currentPosition.y;
    //             setCoordinates(mouse.currentPosition, event);
    //             drawLine(
    //                 mouse.previousPosition.x,
    //                 mouse.previousPosition.y,
    //                 mouse.currentPosition.x,
    //                 mouse.currentPosition.y,
    //                 'black',
    //                 2
    //             );
    //         }
    //     },
    // };

    let gridMouseHandlers = {
        mouseDown: (event) => {
            mouse.isDown = true;
            setCoordinates(mouse.currentPosition, event);
            updateGridData(...currentGridPosition(), getInputType());
        },
        mouseMove: (event) => {
            if (mouse.isDown) {
                let oldGridPos = [mouse.currentGridPosition.x, mouse.currentGridPosition.y];
                let currentGridPos = currentGridPosition();
                if (!((oldGridPos[0] === currentGridPos[0]) && (oldGridPos[1] === currentGridPos[1]))){
                    gridMouseHandlers.mouseDown(event);
                }
            }
        }
    };

    activateMouseControls = (gridBased) => {
        if (gridBased){
            mountMouseEvents(gridMouseHandlers);
        } else {
            mountMouseEvents(pixelMouseHandlers);
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
        render();
        window.addEventListener('mouseup', handleMouseUp);
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

    getInputType = () =>
        Object.keys(tileTypeEnums).filter(type =>
            type === document.querySelector(`input[name="${config.radioInputName}"]:checked`).value
        )[0];



    return {
        activateMouse: activateMouseControls,
        clear,
        deactivateMouse: unMountMouseEvents,
        getGridSize,
        gridData,
        init: initialize,
    };

})();


const aStar = (() => {

    let height = 0,
        width = 0,
        tileTypeEnums,
        grid = null;

    initialize = (config, data) => {
        height = config.height;
        width = config.width;
        tileTypeEnums = config.tileTypeEnums;
        grid = data;
    };

    isCandidateValid = (x,y) => {
        return (
            (
                (grid[x][y] === tileTypeEnums.EMPTY)
                || (grid[x][y] === tileTypeEnums.DESTINATION)
            )
            && (x+1 < width)
            && (x-1 >= 0)
            && (y+1 < height)
            && (y-1 >= 0)
        );
    };

    getNextCandidates = (x, y) => {
        let nextCandidates = [];
        if (isCandidateValid(x, y-1)) nextCandidates.push({
            x,
            y: y-1,
            cost: null,
        });
        if (isCandidateValid(x-1, y)) nextCandidates.push({
            x: x-1,
            y,
            cost: null,
        });
        if (isCandidateValid(x, y+1)) nextCandidates.push({
            x,
            y: y+1,
            cost: null,
        });
        if (isCandidateValid(x+1, y)) nextCandidates.push({
            x: x+1,
            y,
            cost: null,
        });
        return nextCandidates;
    };

})();

$('document').ready(function(){
    let canvas = gridController;
    $('button.clear').click(() => {canvas.clear()});
    canvas.init(config);
    canvas.activateMouse(true);
});
