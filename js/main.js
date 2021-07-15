let s_dim     = undefined;
let s_mat     = undefined;
let m_cont    = undefined;
let t_out     = undefined;
let c_method  = undefined;
let m_sel     = undefined;

let kernel_input = undefined;

let libfourst = undefined;

let editor    = undefined;

let dim       = undefined;

const METHOD_KEY = {
    "matrix": genStencilMat,
    "kernel": genKernelInput,
};

const ACCEPTABLE_VARS = "ijklmnopqrstuvwxyz";

function genStencilMat(dim) {
    kernel_input.hide();

    const elm = m_cont;
    elm.show();
    if (dim.length == 0) {
        errOut("Empty -- please indicate the dimensions of the stencil matrix", elm);
        return;
    }
    if (dim.length == 1) {
        dim.push(0);
    }

    let out = "<table class='table-bordered coeff-mat'>";
    for (let i = 0; i < dim[1] * 2 + 1; i++) {
        out += "<tr>";
        for (let j = 0; j < dim[0] * 2 + 1; j++) {
            let c = "";
            if (i == dim[1]) {
                if (j == dim[0]) {
                    c = "center";
                }
                else {
                    c = "v-mid";
                }
            }
            else if (j == dim[0]) {
                c = "h-mid";
            }
            out += `<td id="m_${i}-${j}" class="cm_cell ${c}"><input class="cm_input" placeholder="0" type="number"></td>`;
        }
        out += "</td>";
    }
    out += "</table>";

    elm[0].innerHTML = out;

    for (let i = 0; i < dim[1] * 2 + 1; i++) {
        for (let j = 0; j < dim[0] * 2 + 1; j++) {
            tippy(`#m_${i}-${j}`, {
                content: `(${j},${i})`,
            });
        }
    }
}

function genKernelInput(dim) {
    m_cont.hide();

    elm = kernel_input;
    elm.show();

    // redraw the editor
    editor.resize();
    editor.renderer.updateFull();
    
    // first, we need to generate the keys
    const dKey = 
        (dim.length < ACCEPTABLE_VARS.length) ? 
        ACCEPTABLE_VARS.slice(0, dim.length) : 
        [...Array(dim.length).keys()].map(x=>{return `d${x}`});

    /*out = "<table class='table-bordered kernel-desc'><tr>";
    for (let i = 0; i < dim.length; i++) {
        out += `<td>${dKey[i]}: 0->${dim[i] * 2 + 1}</td>`;
    }
    out += "</tr></table>";*/

    //out += `<textarea id="form10" class="md-textarea form-control" rows="3">`;
    
    for (let i = 0; i < dim.length; i++) {
        for (let j = 0; i < j; j++) {
            out += `  `;
        }
        out += `for (int ${dKey[i]} = 0; ${dKey[i]} < ${dim[i] * 2 + 1}; ${dKey[i]}++) {\n`;
    }

    //out += `</textarea>`;

    elm[0].innerHTML = out;
}

function grabMatrix() {
    elm = m_cont;

    if (dim.length < 1) alert("can't grab nothing!");

    let out = Array();

    for (let i = 0; i < dim[0] * 2 + 1; i++) {
        const lim = (dim.length > 1) ? dim[1] * 2 + 1 : 1; 
        for (let j = 0; j < lim; j++) {
            const t = $(`#m_${i}-${j}`).find(":input").val();
            let v;
            if (t.length > 0) {
                v = parseFloat(t);
                if (v.toString().length != t.length && v.toString().replace('0.', '.').length != t.length) {
                    alert(`yo ${i},${j} is wack`);
                }
            } else v = 0.0;            

            out.push(v);
        }
    }

    return out;
}

function errOut(msg, elm) {
    elm[0].innerHTML = `<p class="text-muted p-2">${msg}</p>`;
}

function output(msg) {
    t_out[0].innerHTML += msg + '\n';
}

function flush_out() {
    t_out[0].innerHTML = "";
}

function genRes() {
    if (c_method.val() == "matrix") {
        const arr = grabMatrix();
        for (let i = 1; i <= dim.length; i++) {
            arr.unshift(dim[dim.length - i]);
        }
        arr.unshift(dim.length);

        let floatData = Float64Array.from(arr);

        console.log(floatData);

        // Get data byte size, allocate memory on Emscripten heap, and get pointer
        const nDataBytes = floatData.length * floatData.BYTES_PER_ELEMENT;
        const dataPtr = libfourst._malloc(nDataBytes);

        var dataHeap = new Uint8Array(libfourst.HEAPU8.buffer, dataPtr, nDataBytes);
        dataHeap.set(new Uint8Array(floatData.buffer));

        flush_out();
        if (libfourst._fourst_gencode(dataHeap.byteOffset)) {
            output("someone made an oopsie...");
        }

        libfourst._free(dataHeap.byteOffset);
    }
}

function updateEntry() {
    dim = s_dim.val().replace(/\s/g, '').split(",").map(x=>+x).filter(x=>x!=0);

    if (dim.length > 2) {
        if (c_method.val() == "matrix") {
            c_method.val("kernel");
            c_method.change();
            return;
        }
        m_sel.prop("disabled", true);
    }
    else m_sel.prop("disabled", false);

    console.log(c_method.val());
    METHOD_KEY[c_method.val()](dim, m_cont);
}

function main() {
    // initialize element vars
    s_dim        = $("#stencil-dim");
    m_cont       = $("#matrix-input");
    kernel_input = $("#kernel-input");
    t_out        = $("#text-out");
    c_method     = $("#comp-method");
    m_sel        = $("#mat-select");

    s_dim.change(updateEntry);
    c_method.change(updateEntry);

    s_dim.change();

    // load libfourst
    loadlibfourst().then((_libfourst) => {
        libfourst = _libfourst;
    
        libfourst._write_stdout.push((text) => {console.log(`stdout: ${text}`);});
        libfourst._write_stdout.push(output);
        libfourst._write_stderr.push((text) => {console.log(`stderr: ${text}`);});
    
        libfourst._fourst_init();
    });

    // indicate loading done
    console.log("Core loaded");
}