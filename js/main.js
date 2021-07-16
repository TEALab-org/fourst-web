// various elements to be populated once DOM is initialized
let s_dim        = undefined;
let s_mat        = undefined;
let m_cont       = undefined;
let t_out        = undefined;
let c_method     = undefined;
let m_sel        = undefined;
let kernel_input = undefined;
let submit       = undefined;

// emscripten module
let libfourst = undefined;

// ace editor
let editor    = undefined;

// dimensions
let dim       = undefined;

// coefficients
let coeffs    = [];

// current output
let outstr    = undefined;

// tippy instances
let copy_msg  = undefined;

// method to generate coefficients
const METHOD_KEY = {
    "matrix": genStencilMat,
    "kernel": genKernelInput,
};

const ACCEPTABLE_VARS = "ijklmnopqrstuvwxyz";

function genStencilMat(dim) {
    // do necessary showing / hiding
    kernel_input.hide();
    const elm = m_cont;
    elm.show();

    // throw out 0 dimensions and make 1d into 2d
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
            out += `<td id="m_${i}-${j}" class="cm_cell ${c}"><input data-loc="${i},${j}" class="cm_input" placeholder="0" type="number" value="${coeffs[flattenIdx([i, j])]}"></td>`;
        }
        out += "</td>";
    }
    out += "</table>";

    // wait for dom to update and then give change events to cells
    setTimeout(() => {
        $(".cm_input").on('change', (e) => updateCoeff(e.target.getAttribute("data-loc").split(",").map(x=>+x), e.target.value));
    }, 0);

    elm[0].innerHTML = out;

    for (let i = 0; i < dim[1] * 2 + 1; i++) {
        for (let j = 0; j < dim[0] * 2 + 1; j++) {
            tippy(`#m_${i}-${j}`, {
                content: `(${i},${j})`,
            });
        }
    }
}

function flattenIdx(loc) {
    let index = 0;
    let offset = 1;
    for (let i = dim.length - 1; i >= 0; i--) {
        index += loc[i] * offset;
        offset *= (dim[i] * 2 + 1);
    }

    return index
}

function updateCoeff(loc, val) {
    coeffs[flattenIdx(loc)] = val;
}

function applicationCCode() {
    
}

function genKernelInput(dim) {
    m_cont.hide();

    elm = kernel_input;

    let top = "";
    let bottom = "";
    
    // first, we need to generate the keys
    let dKey = 
        (dim.length < ACCEPTABLE_VARS.length) ? 
        ACCEPTABLE_VARS.slice(0, dim.length).split('') : 
        [...Array(dim.length).keys()].map(x=>{return `d${x}`});
    
    let tab;

    for (let i = 0; i < dim.length; i++) {
        tab = `  `.repeat(i);
        top += tab + `for (int ${dKey[i]} = 0; ${dKey[i]} < ${dim[i] * 2 + 1}; ${dKey[i]}++) {\n`;
        bottom = tab + '}\n' + bottom;
    }

    elm[0].innerHTML = top + `${tab}  arr[${dKey.join('][')}] =\n${tab}    // put coefficients here\n` + bottom;

    elm.show();
}

function grabMatrix() {
    return Array.from(coeffs, v => v || 0);
}

function errOut(msg, elm) {
    elm[0].innerHTML = `<p class="text-muted p-2">${msg}</p>`;
}

function output(msg) {
    t_out[0].innerHTML += msg.replace('<', '&lt').replace('>', '&gt') + '\n';
    outstr += msg + '\n';
}

// https://stackoverflow.com/questions/51805395/navigator-clipboard-is-undefined
function copyToClipboard(textToCopy) {
    // navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        // navigator clipboard api method'
        return navigator.clipboard.writeText(textToCopy);
    } else {
        // text area method
        let textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        // make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            // here the magic happens
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}

function flush_out() {
    t_out[0].innerHTML = "";
    outstr = "";
}

function genRes(arr = undefined) {
    t_out.css("background-color", "white");
    if (c_method.val() == "matrix") {
        const arr = grabMatrix();
        for (let i = 1; i <= dim.length; i++) {
            arr.unshift(dim[dim.length - i]);
        }
        arr.unshift(dim.length);

        codegen(arr);
    }
}

function codegen(arr) { 
    let floatData = Float64Array.from(arr);

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

function updateDim() {
    dim = s_dim.val().replace(/\s/g, '').split(",").map(x=>+x).filter(x=>x!=0);
    
    if (dim.length) {
        const c = dim[0];
        dim[0] = 2 * dim[0] + 1;
        coeffs = new Array(dim.reduce( (a, b) => a * (2 * b + 1) ));
        dim[0] = c;
    }

    submit.prop("disabled", !(dim.length > 0));

    if (dim.length > 2) {
        if (c_method.val() == "matrix") {
            c_method.val("kernel");
            c_method.change();
            return;
        }
        m_sel.prop("disabled", true);
    }
    else m_sel.prop("disabled", false);

    updateEntry();
}

function updateEntry() {
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
    submit       = $("#submit");

    s_dim.change(updateDim);
    c_method.change(updateEntry);

    s_dim.change();
    c_method.change();

    flush_out();

    // load libfourst
    loadlibfourst().then((_libfourst) => {
        libfourst = _libfourst;
    
        //libfourst._write_stdout.push((text) => {console.log(`stdout: ${text}`);});
        libfourst._write_stdout.push(output);
        libfourst._write_stderr.push((text) => {console.log(`stderr: ${text}`);});
    
        libfourst._fourst_init();
    });

    t_out.on('click', ()=>{copyToClipboard(outstr).then(()=>{copy_msg.setContent("Copied!"); setTimeout(()=>{copy_msg.setContent("Click to copy")}, 1000);});});

    copy_msg = tippy(t_out[0], {
        content: `Click to copy`,
        hideOnClick: false,
    });

    // indicate loading done
    console.log("Core loaded");
}