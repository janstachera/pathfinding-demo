const aStar = (() => {

    let height = 0,
        width = 0,
        tileTypeEnums,
        gridData = null,
        candidates = [],
        oldCandidates = [],
        updateGridData = null,
        endCoords = null,
        heuristic = null,
        gridDataBackup = [],
        forceRender = null,
        animateFlag = null,
        keepGoing = true,
        stepCounter = 0;

    initialize = (config, data, enums, gridUpdate, render) => {
        height = config.height;
        width = config.width;
        tileTypeEnums = enums;
        gridData = data;
        gridDataBackup = gridData.map((column, index) => gridDataBackup[index] = column.slice());
        updateGridData = gridUpdate;
        forceRender = render;
    };

    candidateConstructor = (x, y, baseCost, totalCost, ancestor) => ({
        x,
        y,
        baseCost,
        totalCost,
        ancestor,
    });

    costFunction = (prevCost, diagonal) => diagonal ? prevCost + 1.41 : prevCost + 1;

    heuristicPicker = (heuristicType) => {
        switch (heuristicType) {
            case 'EUCLIDEAN':
                return (x,y) => {
                    let abs_x = Math.abs(endCoords.x - x);
                    let abs_y = Math.abs(endCoords.y - y);
                    return Math.sqrt(abs_x * abs_x + abs_y * abs_y);
                };
            case 'MANHATTAN':
                return (x,y) => Math.abs(x-endCoords.x) + Math.abs(y-endCoords.y);
            case 'NONE':
            default:
                return () => 0;
        }
    };

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

    processCandidate = (x, y, ancestor, nextCandidates, diagonal) => {
        if (isCandidateValid(x, y)) {
            if (isCandidateTheEnd(x,y)) {
                endFound(ancestor);
            } else {
                const newCost = costFunction(ancestor.baseCost, diagonal);
                nextCandidates.push(
                    candidateConstructor(
                        x,
                        y,
                        newCost,
                        newCost + heuristic(x, y),
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
        processCandidate(ancestor.x-1, ancestor.y-1, ancestor, nextCandidates, true);
        processCandidate(ancestor.x+1, ancestor.y-1, ancestor, nextCandidates, true);
        processCandidate(ancestor.x+1, ancestor.y+1, ancestor, nextCandidates, true);
        processCandidate(ancestor.x-1, ancestor.y+1, ancestor, nextCandidates, true);
        return nextCandidates;
    };

    isCandidateInList = (x, y, list) =>
        list.findIndex(checked =>
            ((checked.x === x) && (checked.y === y))
        ) >= 0;

    preserveStartingNode = () => {
        if (gridData[candidates[0].x][candidates[0].y] !== tileTypeEnums.START) {
            updateGridData(candidates[0].x, candidates[0].y, tileTypeEnums.CANDIDATE_OLD);
        }
    };

    chooseNextCandidate = () => {
        if (candidates.length > 0) {
            const nextCandidates = getNextCandidates(candidates[0]);
            if (!keepGoing) {
                return;
            }
            preserveStartingNode();
            oldCandidates.push(candidates.shift());
            nextCandidates.map((nextCandidate) => {
                if (isCandidateInList(nextCandidate.x, nextCandidate.y, oldCandidates)) {
                    return;
                }
                if (isCandidateInList(nextCandidate.x, nextCandidate.y, candidates)) {
                    const indexToRemove = candidates.findIndex((candidate) =>
                        ((candidate.x === nextCandidate.x) && (candidate.y === nextCandidate.y))
                    );
                    oldCandidates.push(candidates.splice(indexToRemove, 1));
                }
                const index = candidates.findIndex((candidate) => {
                    return candidate.totalCost > nextCandidate.totalCost
                });
                if (index >= 0) {
                    candidates.splice(index, 0, nextCandidate);
                } else {
                    candidates.push(nextCandidate);
                }
                updateGridData(nextCandidate.x, nextCandidate.y, tileTypeEnums.CANDIDATE_NEW);
            });
            stepCounter++;
            if (animateFlag) {
                if (stepCounter % (candidates.length >> 2) === 0) {
                    setTimeout(chooseNextCandidate, 0);
                } else {
                    chooseNextCandidate();
                }
            }
        } else {
            keepGoing = false;
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
        animateFlag = getAnimateFlag();
        heuristic = heuristicPicker(getHeuristicType());
        gridDataBackup = gridData.map((column, index) => gridDataBackup[index] = column.slice());
        resetData();
        const start = findStart();
        const end = findEnd();
        if (!start || !end) {
            enableStart();
            console.error('No start and/or end point defined!');
        } else {
            endCoords = end;
            candidates.push(
                candidateConstructor(
                    start.x,
                    start.y,
                    0,
                    heuristic(start.x, start.y),
                    null
                )
            );
            if (animateFlag) {
                chooseNextCandidate();
            } else {
                while (keepGoing) {
                    chooseNextCandidate()
                }
            }
        }
    };

    stop = () => {
        keepGoing = false;
    };

    restore = () => {
        stop();
        gridData.map((column, index) => {
            gridData[index] = gridDataBackup[index];
        });
        forceRender();
    };

    return {
        init: initialize,
        start: startSearching,
        stop,
        restore,
    };

})();