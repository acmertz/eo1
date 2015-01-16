let breakpoints = [];
let position = 0;

let offsetTime = 0;
let startTime = 0;

let interval = null;

function startTimer () {
    startTime = Date.now();
    interval = setInterval(processTime, 16);
    postMessage({ type: "newIndexPosition", contents: position });
}

function stopTimer () {
    clearInterval(interval);
}

function processTime () {
    let thisTime = Date.now() - startTime;

    if (thisTime > breakpoints[breakpoints.length - 1]) {
        postMessage({
            type: "time",
            contents: breakpoints[breakpoints.length - 1]
        });
        postMessage({ type: "endOfPlayback" });
    }
    else {
        postMessage({
            type: "time",
            contents: thisTime
        });
        for (let i = breakpoints.length - 1; i > -1; i--) {
            if (thisTime > breakpoints[i]) {
                // i is the current position in the index
                if (i != position) {
                    // switching to a new position.
                    position = i;
                    console.log("New position: " + position);
                    postMessage({ type: "newIndexPosition", contents: position });
                }
            }
        }
    }

    
}


this.addEventListener("message", function (message) {
    switch (message.data.type) {
        case "setBreakpoints":
            breakpoints = message.data.contents;
            break;
        case "startTimer":
            startTimer();
            break;
        case "stopTimer":
            stopTimer();
            break;
        default:
            console.log("Timer received a message: " + message.data.contents);
            break;
    }
});