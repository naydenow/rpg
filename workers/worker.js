function Worker() {
    this.ready = false;
    this.listener = {};
    this.on('loadScript', function (data) {
        this.include(data.script, data.class);
    }.bind(this));
}

Worker.prototype.include = function (s, c) {
    importScripts(s);
    if (typeof self[c] === "function")
        self['_' + c] = new self[c](this);
};

/* Вешаем обработчик события */
Worker.prototype.on = function (name, callback) {
    if (typeof name === "function") {
        callback = name;
        name = "message";
    }
    if (this.listener[name] === undefined)
        this.listener[name] = [];
    this.listener[name].push({"fn": callback});
};

Worker.prototype.message = function (event) {
    var name = event.data.n === undefined ? "message" : event.data.n;
    if (this.listener[name] === undefined) return;
    this.listener[name].forEach(function (cb) {
        cb.fn(event.data.m);
    });
};

Worker.prototype.emit = function (name, message) {
    if (message === undefined) {
        message = name;
        name = "message";
    }
    postMessage({"n": name, "m": message});
};

Worker.prototype.load = function load(url, callback) {
    return fetch(url,{
        method:'GET',
        mode: 'cors'
    }).then(res => res.text())
        .then(text => callback(text));

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = ensureReadiness;



    function ensureReadiness() {
        if (xhr.readyState < 4) {
            return;
        }
        if (xhr.status !== 200) {
            return;
        }
        if (xhr.readyState === 4) {
            callback(xhr.responseText);
        }
    }

    xhr.open('GET', url, true);
    xhr.send('');
};


self.worker = new Worker();

self.onmessage = function (e) {
    worker.message(e);
};