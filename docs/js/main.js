let s_dim    = undefined;
let s_mat    = undefined;
let m_cont   = undefined;
let t_out    = undefined;
let c_method = undefined;
let m_sel    = undefined;

let libfourst = null;

const METHOD_KEY = {
    "matrix": genStencilMat,
    "kernel": genKernelInput,
};

const ACCEPTABLE_VARS = "ijklmnopqrstuvwxyz";

function genStencilMat(dim, elm) {
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

function genKernelInput(dim, elm) {
    // first, we need to generate the keys
    const dKey = 
        (dim.length < ACCEPTABLE_VARS.length) ? 
        ACCEPTABLE_VARS.slice(0, dim.length) : 
        [...Array(dim.length).keys()].map(x=>{return `d${x}`});

    out = "<table class='table-bordered kernel-desc'><tr>";
    for (let i = 0; i < dim.length; i++) {
        out += `<td>${dKey[i]}: 0->${dim[i] * 2 + 1}</td>`;
    }
    out += "</tr></table>";

    out += `<textarea id="form10" class="md-textarea form-control" rows="3"></textarea>`;

    elm[0].innerHTML = out;
}

function errOut(msg, elm) {
    elm[0].innerHTML = `<p class="text-muted p-2">${msg}</p>`;
}

function output(msg) {
    t_out.val(msg);
}

function genRes() {
    output("Not implemented!");
}

function updateEntry() {
    const d = s_dim.val().replace(/\s/g, '').split(",").map(x=>+x).filter(x=>x!=0);
    /*if (d.length > 2) {
        m_sel.prop("disabled", true);
        c_method.val("kernel");
        c_method.change();
    }
    else m_sel.prop("disabled", true);*/
    METHOD_KEY[c_method.val()](d, m_cont);
}

function main() {
    // initialize element vars
    s_dim    = $("#stencil-dim");
    m_cont   = $("#mat-cont");
    t_out    = $("#text-out");
    c_method = $("#comp-method");
    m_sel    = $("#mat-select");

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