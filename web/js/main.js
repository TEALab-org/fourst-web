// various elements to be populated once DOM is initialized
let s_dim        = undefined;
let s_mat        = undefined;
let t_out        = undefined;
let c_method     = undefined;
let m_sel        = undefined;
let submit       = undefined;

const inputs       = {
    "matrix": undefined,
    "kernel": undefined,
    "manual": undefined,
}

// emscripten module
let libfourst = undefined;

// ace editor
let editor    = undefined;

// dimensions
let dim       = undefined;
let d_vars    = undefined;

// coefficients
let coeffs    = undefined;
let coeffRef  = undefined;

// current output
let outstr    = undefined;

// tippy instances
let copy_msg  = undefined;

// number of input rows
let r_n       = undefined;

// method to generate coefficients
const METHOD_KEY = {
    "matrix": genStencilMat,
    "kernel": genKernelInput,
    "manual": genManualInput,
};

const ACCEPTABLE_VARS = "ijklmnopqrstuvwxyz";

function genStencilMat(dim) {
    // hide all input methods
    Object.values(inputs).forEach((e)=>{e.hide();});

    const elm = inputs["matrix"];
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
            out += `<td id="m_${i}-${j}" class="cm_cell ${c}"><input data-loc="${i},${j}" class="cm_input" placeholder="0" type="number" value="${getElm([i, j])}"></td>`;
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

function getElm(loc) {
    return (loc.toString() in coeffRef) ? coeffRef[loc].val : "";
}

function updateCoeff(loc, val) {
    if (loc.toString() in coeffRef) {
        coeffRef[loc].val = parseFloat(val);
    } else {
        const c = new Coeff(parseFloat(val), loc);
        coeffs.push(c);
        coeffRef[loc] = c;
    }
}


function genKernelInput(dim) {
    // hide all input methods
    Object.values(inputs).forEach((e)=>{e.hide();});

    elm = inputs["kernel"];
    elm.show();

    let top = "";
    let bottom = "";
    
    let tab;

    if (dim.length) {
        for (let i = 0; i < dim.length; i++) {
            tab = `  `.repeat(i);
            top += tab + `for (int ${d_vars[i]} = 0; ${d_vars[i]} < ${d_vars[i] * 2 + 1}; ${d_vars[i]}++) {\n`;
            bottom = tab + '}\n' + bottom;
        }
    
        elm[0].innerHTML = top + `${tab}  arr[${dKey.join('][')}] =\n${tab}    // put coefficients here\n` + bottom;
    } else {
        elm[0].innerHTML = `Empty -- please indicate the dimensions of the stencil matrix`
    }
}

function genManRow(loc=undefined, val=undefined) {
    let e = document.createElement('div');
    let out = "<div>";

    if (loc === undefined) {
        for (let i = 0; i < d_vars.length; i++) {
            out += ` ${d_vars[i]}: &nbsp;<input type="number" id="r${r_n}dim_${i}" class="man_dim r${r_n}" placeholder="0" data-row="${r_n}">`;
        }
    } else {
        for (let i = 0; i < d_vars.length; i++) {
            out += ` ${d_vars[i]}: &nbsp;<input type="number" id="r${r_n}dim_${i}" class="man_dim r${r_n}" value="${loc[i]}" data-row="${r_n}">`;
        }
    }


    out += ` value: &nbsp;<input type="number" id="r${r_n}_val" class="man_val r${r_n}" placeholder="0" value="${(val === undefined) ? undefined : val}" data-row="${r_n}">`;

    e.innerHTML = out + `</div>`;

    setTimeout(() => {
        $(`.r${r_n}`).change((e) => {
            const loc = new Array(dim.length);
            const row = parseInt(e.target.getAttribute("data-row"));
            let valid = true;
            let val = 0;

            for (let i = 0; i < dim.length; i++) {
                const v = parseInt($(`#r${row}dim_${i}`).val());
                if (v === undefined || v < 0 || v > dim[i] * 2 || isNaN(v)) {console.log(`invalid dim for row ${row}`); valid = false;}
                loc[i] = v;
            }

            val = $(`#r${row}_val`).val();
            if (val === undefined || val < 0 || isNaN(val)) {console.log(`invalid val for row ${row}`); valid = false;}

            if (valid) updateCoeff(loc, val);
        });
        r_n++;
    }, 0);

    return e;
}

function genManualInput() {
    // hide all input methods
    Object.values(inputs).forEach((e)=>{e.hide();});

    elm = inputs["manual"];
    rows = $("#manual-rows")[0];
    rows.innerHTML = "";

    r_n = 0;

    let i;
    for (i = 0; i < coeffs.length; i++) {
        rows.appendChild(genManRow(coeffs[i].loc, coeffs[i].val)); 
    }
    if (!i) {
        rows.appendChild(genManRow()); 
    }

    elm.show();
}

function errOut(msg, elm) {
    elm[0].innerHTML = `<p class="text-muted p-2">${msg}</p>`;
}

function output(msg) {
    t_out[0].innerHTML += msg.replace('<', '&lt').replace('>', '&gt') + '\n';
    setTimeout(()=>{
        Prism.highlightElement(t_out[0]);
        console.log("highlighting??");
    }, 0);
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

function genRes() {
    t_out.css("background-color", "white");

    const arr = toDense(coeffs, dim);//grabMatrix();
    for (let i = 1; i <= dim.length; i++) {
        arr.unshift(dim[dim.length - i]);
    }
    arr.unshift(dim.length);

    codegen(arr);
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
        output("ERROR IN LIBFOURST");
    }

    libfourst._free(dataHeap.byteOffset);
}

function updateDim() {
    dim = s_dim.val().replace(/\s/g, '').split(",").map(x=>+x).filter(x=>x!=0);

    // generate variables for each dimension
    d_vars = 
    (dim.length < ACCEPTABLE_VARS.length) ? 
    ACCEPTABLE_VARS.slice(0, dim.length).split('') : 
    [...Array(dim.length).keys()].map(x=>{return `d${x}`});

    coeffs   = new Array();
    coeffRef = {};

    submit.prop("disabled", !(dim.length > 0));

    if (dim.length > 2) {
        if (c_method.val() == "matrix") {
            c_method.val("manual");
            c_method.change();
        }
        $("#mat-select")[0].disabled = true;
        return;
    }
    else $("#mat-select")[0].disabled = false;

    updateEntry();
}

function updateEntry() {
    METHOD_KEY[c_method.val()](dim);
}

function main() {
    // initialize element vars
    s_dim        = $("#stencil-dim");
    inputs["matrix"] = $("#matrix-input");
    inputs["kernel"] = $("#kernel-input");
    inputs["manual"] = $("#manual-input");
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