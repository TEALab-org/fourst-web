class Coeff {
    'use strict';
    constructor(val, loc) {
        this.val = val;
        this.loc = loc;
    }
}

function coeffArrCollapse(arr) {
    'use strict';
    if (arr.length == 0) return Array();

    const sz = arr[0].loc.length + 1;
    let out = new Array(arr.length * sz);
    for (let i = 0; i < arr.length; i++) {
        let j;
        for (j = 0; j < arr[0].loc.length; j++) {
            out[i  * sz + j] = arr[i].loc[j];
        }
        out[i  * sz + j] = arr[i].val;
    }

    return out;
}

function dimDepth(dim) {
    let l = 1;
    for (let i = 0; i < dim.length; i++) l *= dim[i] * 2 + 1;
    return new Array(l);
}

function toDense(arr, dim) {
    'use strict';
    const out = dimDepth(dim);

    for (let i = 0; i < arr.length; i++) {
        out[flattenIdx(arr[i].loc, dim)] = arr[i].val;
    }

    return out;
}

function flattenIdx(loc, dim) {
    let index = 0;
    let offset = 1;
    for (let i = dim.length - 1; i >= 0; i--) {
        index += loc[i] * offset;
        offset *= (dim[i] * 2 + 1);
    }

    return index
}

function expandIdx(loc, dim) {
    let index = Array(dim.length);
    let offset = coeffs.length / (dim[dim.length - 1] * 2 + 1);
    for (let i = dim.length - 1; i >= 0; i--) {
        index[dim.length - 1 - i] = (loc / offset) | 0;
        loc = loc % offset;
        offset /= (dim[i - 1] * 2 + 1);
    }

    return index
}