const config = {
    canvasClass: 'drawArea',
    cellSize: 4,
    radioInputName: 'gridInput',
    heuristicRadioName: 'heuristics',
    tileTypeEnums: {
        CANDIDATE_NEW: 'CANDIDATE_NEW',
        CANDIDATE_OLD: 'CANDIDATE_OLD',
        DESTINATION: 'DESTINATION',
        EMPTY: 'EMPTY',
        START: 'START',
        PATH: 'PATH',
        WALL: 'WALL',
    },
    heuristicEnums: {
        EUCLIDEAN: 'EUCLIDEAN',
        MANHATTAN: 'MANHATTAN',
        NONE: 'NONE',
    },
};

setDefault = (argument, defaultValue) =>
    typeof argument === 'undefined'
        ? defaultValue
        : argument;

getInputType = () =>
    Object.keys(config.tileTypeEnums).filter(type =>
        type === document.querySelector(`input[name="${config.radioInputName}"]:checked`).value
    )[0];

getHeuristicType = () =>
    Object.keys(config.heuristicEnums).filter(type =>
        type === document.querySelector(`input[name="${config.heuristicRadioName}"]:checked`).value
    )[0];

getAnimateFlag = () => document.querySelector('input[name="animate"]').checked;

const disableStart = () => {
    $('button.start').attr("disabled", true);
};

const enableStart = () => {
    $('button.start').attr("disabled", false);
};

const clickClear = () => {
    gridController.clear();
    aStar.stop();
    enableStart();
};

const clickStart = () => {
    $('button.restore').attr("disabled", false);
    disableStart();
    aStar.start();
};

const clickRestore = () => {
    aStar.restore();
    enableStart();
};

$('document').ready(function(){
    $('button.clear').click(clickClear);
    $('button.start').click(clickStart);
    $('button.restore').click(clickRestore);
    gridController.init(config);
    aStar.init(
        gridController.getGridSize(),
        gridController.getGrid(),
        config.tileTypeEnums,
        gridController.updateGridData,
        gridController.forceRender,
    );
});
