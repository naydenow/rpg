window.ThreadId = 0;
window.ThreadWorker = "workers/worker.js";

export default function Thread(url, className) {
    this.id = window.ThreadId++;
    this.ready = false;
    this.worker = new Worker(window.ThreadWorker);
    this.listener = {};

    this.worker.onmessage = function (event) {
        var name = event.data.n === undefined ? "message" : event.data.n;
        if (this.listener[name] === undefined) return;
        this.listener[name].forEach(function (cb, i) {
            cb.fn(event.data.m);
            if (cb.fn.t === 0)
                this.listener[name].splice(i, 1);
        }.bind(this));
    }.bind(this);

    this.once("started", function (data) {
        this.ready = true;
    }.bind(this));

    if (className === undefined)
        className = "ChildThread";
    if (url !== undefined)
        this.includeScript(url, className);
}

Thread.prototype.includeScript = function (url, className) {
    if (className === undefined)
        className = "ChildThread";
    this.emit("loadScript", {"script": url, "class": className});
};

Thread.prototype.on = function (name, callback, t) {
    if (typeof name === "function") {
        callback = name;
        name = "message";
    }
    if (t === undefined) {
        t = 1;
    }

    if (this.listener[name] === undefined)
        this.listener[name] = [];
    this.listener[name].push({"fn": callback, "t": 1});
};

Thread.prototype.once = function (name, callback) {
    this.on(name, callback, 0);
};


Thread.prototype.emit = function (name, message) {
    if (message === undefined) {
        message = name;
        name = "message";
    }
    this.worker.postMessage({"n": name, "m": message});
};


/* in include script
 function ClassName(main){
 main.on("event",function(data){}) //message event in (child) thread
 main.emit("event","data"); //send message in main thread
 }
 */