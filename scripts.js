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

    getInputType = () =>
        Object.keys(tileTypeEnums).filter(type =>
            type === document.querySelector(`input[name="${config.radioInputName}"]:checked`).value
        )[0];

    getGrid = () => gridData;

    return {
        clear,
        deactivateMouse: unMountMouseEvents,
        getGridSize,
        getGrid,
        updateGridData,
        init: initialize,
    };

})();

const aStar = (() => {

    let height = 0,
        width = 0,
        tileTypeEnums,
        gridData = null,
        candidates = [],
        oldCandidates = [],
        updateGridData = null,
        keepGoing = true;

    initialize = (config, data, enums, gridUpdate) => {
        height = config.height;
        width = config.width;
        tileTypeEnums = enums;
        gridData = data;
        updateGridData = gridUpdate;
    };

    candidateConstructor = (x, y, baseCost, totalCost, ancestor) => ({
        x,
        y,
        baseCost,
        totalCost,
        ancestor,
    });

    costFunction = (prevCost) => prevCost + 1;

    heuristic = () => 0;

    endFound = (ancestor) => {
        keepGoing = false;
        updateGridData(ancestor.x, ancestor.y, tileTypeEnums.WALL);
        let tempAncestor = ancestor;
        while(tempAncestor.ancestor !== null) {
            updateGridData(tempAncestor.x, tempAncestor.y, tileTypeEnums.PATH);
            tempAncestor = tempAncestor.ancestor;
        }
    };

    isCandidateValid = (x,y) => {
        return (
            (x < width)
            && (x >= 0)
            && (y < height)
            && (y >= 0)
            && (
                (gridData[x][y] === tileTypeEnums.EMPTY)
                || (gridData[x][y] === tileTypeEnums.DESTINATION)
            )
        );
    };

    isCandidateTheEnd = (x,y) => gridData[x][y] === tileTypeEnums.DESTINATION;

    processCandidate = (x, y, ancestor, nextCandidates) => {
        if (isCandidateValid(x, y)) {
            if (isCandidateTheEnd(x,y)) {
                endFound(ancestor);
            } else {
                nextCandidates.push(
                    candidateConstructor(
                        x,
                        y,
                        costFunction(ancestor.baseCost),
                        costFunction(ancestor.baseCost) + heuristic(x, y),
                        ancestor,
                    )
                )
            }
        }
    };

    getNextCandidates = (ancestor) => {
        let nextCandidates = [];
        processCandidate(ancestor.x, ancestor.y-1, ancestor, nextCandidates);
        processCandidate(ancestor.x-1, ancestor.y, ancestor, nextCandidates);
        processCandidate(ancestor.x, ancestor.y+1, ancestor, nextCandidates);
        processCandidate(ancestor.x+1, ancestor.y, ancestor, nextCandidates);
        return nextCandidates;
    };

    isCandidateInList = (x, y, list) =>
        list.findIndex(checked =>
            ((checked.x === x) && (checked.y === y))
        ) >= 0;

    chooseNextCandidate = () => {
        if (candidates.length > 0) {
            const nextCandidates = getNextCandidates(
                candidates[0]
            );
            if (!keepGoing) { return; }
            if (gridData[candidates[0].x][candidates[0].y] !== tileTypeEnums.START) {
                updateGridData(candidates[0].x, candidates[0].y, tileTypeEnums.CANDIDATE_OLD);
            }
            oldCandidates.push(candidates.shift());
            nextCandidates.map((nextCandidate) => {
                if (isCandidateInList(nextCandidate.x, nextCandidate.y, oldCandidates)) { return; }
                if (isCandidateInList(nextCandidate.x, nextCandidate.y, candidates)) {
                    const indexToRemove = candidates.findIndex((candidate) =>
                        ((candidate.x === nextCandidate.x) && (candidate.y === nextCandidate.y))
                    );
                    oldCandidates.push(candidates.splice(indexToRemove, 1));
                }
                const index = candidates.findIndex((candidate) =>
                    candidate.totalCost >= nextCandidate.totalCost
                );
                candidates.splice((index >= 0 ? index : candidates.length - 1), 0, nextCandidate);
                updateGridData(nextCandidate.x, nextCandidate.y, tileTypeEnums.CANDIDATE_NEW);
            });
            setTimeout(chooseNextCandidate, 10);
        }
    };

    findSpecial = (type) => {
        for (let column = 0; column < width; column++){
            for (let row = 0; row < height; row++) {
                if (gridData[column][row] === type) {
                    return {x: column, y:row};
                }
            }
        }
        return null;
    };

    findStart = () => findSpecial(tileTypeEnums.START);

    findEnd = () => findSpecial(tileTypeEnums.DESTINATION);

    resetData = () => {
        candidates = [];
        oldCandidates = [];
        keepGoing = true;
    };

    startSearching = () => {
        resetData();
        const start = findStart();
        const end = findEnd();
        if (!start || !end) {
            console.error('No start and/or end point defined!');
        } else {
            candidates.push(
                candidateConstructor(
                    start.x,
                    start.y,
                    0,
                    heuristic(start.x, start.y),
                    null
                )
            );
            chooseNextCandidate();
        }
    };

    stop = () => {
        keepGoing = false;
    };

    return {
        init: initialize,
        start: startSearching,
        stop,
    };

})();

$('document').ready(function(){
    const canvas = gridController;
    $('button.clear').click(() => {canvas.clear(); aStar.stop();});
    $('button.start').click(aStar.start);
    canvas.init(config);
    aStar.init(
        canvas.getGridSize(),
        canvas.getGrid(),
        config.tileTypeEnums,
        canvas.updateGridData
    );
});
