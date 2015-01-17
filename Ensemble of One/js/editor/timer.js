let breakpoints = [];
let position = 0;

let lastTime = 0;
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
    offsetTime = lastTime;
}

function processTime () {
    lastTime = (Date.now() - startTime) + offsetTime;

    if (lastTime > breakpoints[breakpoints.length - 1]) {
        postMessage({
            type: "time",
            contents: msToTime(breakpoints[breakpoints.length - 1])
        });
        postMessage({ type: "endOfPlayback" });
    }
    else {
        postMessage({
            type: "time",
            contents: msToTime(lastTime)
        });
        for (let i = breakpoints.length - 1; i > -1; i--) {
            if (lastTime > breakpoints[i]) {
                // i is the current position in the index
                if (i != position) {
                    // switching to a new position.
                    position = i;
                    console.log("New position: " + position + ", time: " + lastTime);
                    postMessage({ type: "newIndexPosition", contents: position });
                }
                break;
            }
        }
    }

    
}

function msToTime(s) {

    function addZ(n) {
        return (n < 10 ? '0' : '') + n;
    }

    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
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