self.importScripts('workers/../UPNG.js');
self.importScripts('workers/../three.js');

function Map(main) {
    this.main = main;

    this.tempObject = {};
    this.worldCache = {};
    this.region = null;
    this.surroundRegion = [];
    this.map = 'test';
    this.worldserver = 'https://ww.sunnygames.net/terrain/';
    this.activeEventPoint = [];
    this.region = '9999=9999';
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.position = new THREE.Vector3();

    this.registerWorkerEvent();
}

Map.prototype.distavceTo3Array = function (v1, v2) {
    var dx = v1[0] - v2[0];
    var dy = v1[1] - v2[1];
    var dz = v1[2] - v2[2];

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};


Map.prototype.registerWorkerEvent = function () {
    var then = this;

    this.main.on('centerPosition', function (data) {
        const region = calcRegion(data);
        const oldRegion = then.region;


        if (then.region !== region) {
            this.main.emit('regionChanged',{
                old:oldRegion,
                region:region
            });

            then.region = region;
            this.nearRegion = calcNearRegion(then.region, 2);

            this.loadWorld(oldRegion, function (data, newRegions, removeRegion, resizeRegion) {
                newRegions.forEach(r => then.parseTerrain(r, data[r]));
                removeRegion.forEach(r => then.main.emit('removeRegion', r));
            });
        }
    }.bind(this));
};

Map.prototype.parseTerrain = function (region, options) {
    const tileURL = this.worldserver + 'world/' + this.map + '/' + region + '/hm.png';
    const cube = region.split('=');

    return fetchPNG(tileURL)
        .then(t => png2heightmap(t))
        .then(t => makeBufferGeometry(t))
        .then(geometry => {
            crackFix(geometry);


            const positions = geometry.attributes.position.array.buffer;
            const normals = geometry.attributes.normal.array.buffer;
            const indices = geometry.index.array.buffer;
            const uvs = geometry.attributes.uv.array.buffer;

            this.main.emit('newGeometry', {
                geometry: {
                    positions,
                    normals,
                    indices,
                    uvs
                },
                map: this.map,
                region,
                bpe: {
                    positions: geometry.attributes.position.array.BYTES_PER_ELEMENT,
                    normals: geometry.attributes.normal.array.BYTES_PER_ELEMENT,
                    indices: geometry.index.array.BYTES_PER_ELEMENT
                },
                options,
                position: {
                    x: parseFloat(cube[0]) * 2000,
                    y: 0,
                    z: parseFloat(cube[1]) * 2000
                }
            })
        })
        .catch(() => {
        })
};

Map.prototype.loadWorld = function (_oldRegion, cb) {
    var oldRegion = calcNearRegion(_oldRegion, 2);
    var needRegion = [];
    var result = [];
    var then = this;
    var newRegions = [];
    var removeRegion = [];
    var resizeRegion = [];
    var cRegion = this.region.split('=');

    this.nearRegion.forEach(function (region) {
        if (oldRegion.indexOf(region) === -1) {
            newRegions.push(region);
            if (then.worldCache[region]) {
                result[region] = then.worldCache[region];
                result[region].E.forEach(function (event) {
                    event.region = region;
                    this.activeEventPoint.push(event);
                }.bind(this));
            } else
                needRegion.push(region);
        } else {
            var cr = region.split('=');
            var vecX = cr[0] - cRegion[0];
            var vecY = cr[1] - cRegion[1];
            var dist = ~~(Math.sqrt(vecX * vecX + vecY * vecY) + 0.5);
            resizeRegion.push({[region]: dist});
        }
    }.bind(this));

    oldRegion.forEach(function (region) {
        if (this.nearRegion.indexOf(region) === -1) {
            removeRegion.push(region);
        }
    }.bind(this));

    if (needRegion.length === 0) {
        return cb(result, newRegions, removeRegion, resizeRegion);
    }

    var url = this.worldserver + '/php/script/load.php';

    url += '?map=' + this.map;
    url += '&action=getmap';
    url += '&array=' + JSON.stringify(needRegion);

    this.main.load(decodeURI(url), function (responce) {
        var res = JSON.parse(responce);
        cb(Object.assign(result, res), newRegions, removeRegion, resizeRegion);
        then.saveInCache(res)
    });

};

Map.prototype.saveInCache = function (data) {
    for (var r in data) {
        this.worldCache[r] = data[r];
    }
};

var fetchPNG = function (url) {
    return fetch(url)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => new Uint8Array(arrayBuffer))
        .catch(() => new Uint8Array())
};

var calcRegion = function (positionArr) {
    return ~~(((positionArr[0] > 0 ? 1000 : -1000) + positionArr[0]) / 2000) + "=" + ~~(((positionArr[2] > 0 ? 1000 : -1000) + positionArr[2]) / 2000);
};

var calcNearRegion = function (region, length = 3) {
    var _r = region.split('=').map(function (r) {
        return +r;
    });

    var all = length;
    var res = [];
    var h = all * -1;
    var i = 0;

    while (h <= all) {
        var w = all * -1;

        while (w <= all) {
            res.push([_r[0] + w, _r[1] + h].join('='));
            w++;
        }
        h++;
    }

    return res;
};

var png2heightmap = (encodedPng) => {
    const png = new Uint8Array(UPNG.toRGBA8(UPNG.decode(encodedPng))[0]);
    const heightmap = new Float32Array(128 * 128);
    for (let i = 0; i < 128; i++) {
        for (let j = 0; j < 128; j++) {
            const ij = i + 128 * j;
            const rgba = ij * 4;
            heightmap[ij] = png[rgba] * 128.0 + png[rgba + 1] + png[rgba + 2] / 128.0 - (32768.0 / 2)
        }
    }
    return heightmap
};

var makeBufferGeometry = function (heightmap, size = 2000, segments = 128) {
    const geometry = new THREE.PlaneBufferGeometry(size, size, segments + 2, segments + 2);
    const nPosition = Math.sqrt(geometry.attributes.position.count);
    const nHeightmap = Math.sqrt(heightmap.length);
    const ratio = nHeightmap / (nPosition);

    var x, y;

    for (let i = nPosition; i < geometry.attributes.position.count - nPosition; i++) {
        if (
            i % (nPosition) === 0 ||
            i % (nPosition) === nPosition - 1
        ) continue;
        x = Math.floor(i / (nPosition));
        y = i % (nPosition);
        geometry.attributes.position.setZ(
            i,
            heightmap[Math.round(Math.round(x * ratio) * nHeightmap + y * ratio)] * 0.06
        )
    }

    return geometry;
};


const crackFix = (geometry) => {
    // Takes a THREE.PlaneBufferGeometry and apply 'skirts' to the plane by moving the external vertices
    const w = geometry.parameters.widthSegments + 1;
    const h = geometry.parameters.heightSegments + 1;

    if (w < 4 || h < 4) return;

    const zOffset = Math.sqrt(geometry.parameters.width * geometry.parameters.height) * 0.1 * 255 / Math.sqrt(w * h);

    //console.time('crackFix');
    for (let i = 1; i < w - 1; i++) {
        geometry.attributes.position.setZ(
            i,
            geometry.attributes.position.getZ(w + i)
        )
    }
    for (let i = 1; i < w - 1; i++) {
        geometry.attributes.position.setZ(
            (h - 1) * w + i,
            geometry.attributes.position.getZ((h - 2) * w + i)
        )
    }
    let i = 0;
    for (let j = 0; j < h; j++) {
        geometry.attributes.position.setZ(
            j * w,
            geometry.attributes.position.getZ(1 + j * w)
        )
    }
    i = w;
    for (let j = 0; j < h; j++) {
        geometry.attributes.position.setZ(
            j * w + i - 1,
            geometry.attributes.position.getZ(j * w + i - 2)
        )
    }

    geometry.computeVertexNormals();

    for (let i = 1; i < w - 1; i++) {
        geometry.attributes.position.setXYZ(
            i,
            geometry.attributes.position.getX(w + i),
            geometry.attributes.position.getY(w + i),
            geometry.attributes.position.getZ(w + i) - zOffset
        )
    }
    for (let i = 1; i < w - 1; i++) {
        geometry.attributes.position.setXYZ(
            (h - 1) * w + i,
            geometry.attributes.position.getX((h - 2) * w + i),
            geometry.attributes.position.getY((h - 2) * w + i),
            geometry.attributes.position.getZ((h - 2) * w + i) - zOffset
        )
    }
    i = 0
    for (let j = 0; j < h; j++) {
        geometry.attributes.position.setXYZ(
            j * w,
            geometry.attributes.position.getX(1 + j * w),
            geometry.attributes.position.getY(1 + j * w),
            geometry.attributes.position.getZ(1 + j * w) - zOffset
        )
    }
    i = w
    for (let j = 0; j < h; j++) {
        geometry.attributes.position.setXYZ(
            j * w + i - 1,
            geometry.attributes.position.getX(j * w + i - 2),
            geometry.attributes.position.getY(j * w + i - 2),
            geometry.attributes.position.getZ(j * w + i - 2) - zOffset
        )
    }

    geometry.scale((w - 1) / (w - 3), (h - 1) / (h - 3), 1)
    //console.timeEnd('crackFix')
};
