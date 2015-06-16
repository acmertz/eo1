let breakpoints = [];
let position = 0;

let lastTime = 0;
let offsetTime = 0;
let startTime = 0;

let interval = null;

function startTimer () {
    startTime = Date.now();
    interval = setInterval(processTime, 16);
    //postMessage({ type: "newIndexPosition", contents: position });
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
            contents: {
                friendly: msToTime(breakpoints[breakpoints.length - 1]),
                ms: breakpoints[breakpoints.length - 1]
            }
        });
        postMessage({ type: "endOfPlayback" });
    }
    else {
        postMessage({
            type: "time",
            contents: {
                friendly: msToTime(lastTime),
                ms: lastTime
            }
        });
        checkBreakpoints();
    }
}

function checkBreakpoints() {
    /// <summary>Checks to see if the rendering/playback breakpoint has changed.</summary>
    let oldPosition = position;
    if (lastTime > 0) {
        for (let i = breakpoints.length - 1; i > -1; i--) {
            if (lastTime > breakpoints[i]) {
                // i is the current position in the index
                if (i != position) {
                    // switching to a new position.
                    position = i;
                }
                break;
            }
        }
    }
    else position = 0;

    if (position != oldPosition) {
        console.log("New position: " + position + ", time: " + lastTime);
        postMessage({ type: "newIndexPosition", contents: position });
    }
}

function msToTime(s) {

    function addZms(n) {
        if (n < 10) return "00" + n;
        else if (n < 100) return "0" + n;
        else return n;
    }

    function addZ(n) {
        return (n < 10 ? '0' : '') + n;
    }

    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + addZ(ms);
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
        case "seeked":
            offsetTime = message.data.contents;
            lastTime = message.data.contents;
            checkBreakpoints();
            postMessage({
                type: "time",
                contents: {
                    friendly: msToTime(offsetTime),
                    ms: offsetTime
                }
            });
            break;
        default:
            console.log("Timer received a message: " + message.data.contents);
            break;
    }
});