let s_dim    = undefined;
let s_mat    = undefined;
let m_cont   = undefined;
let t_out    = undefined;
let c_method = undefined;

function genStencilMat(dim, elm) {
    if (dim.length == 0) {
        errOut("Empty -- please indicate the dimensions of the stencil matrix", elm);
        return;
    } if (dim.length > 2) {
        c_method.val("kernel");
        c_method.change();
        //errOut(`Currently, only two dimensions are supported (got ${dim.length})`, elm);
        return;
    } if (dim.length == 1) {
        dim.push(0);
    }

    out = "<table class='table-bordered coeff-mat'>";
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
            out += `<td class="${c}">${i}, ${j}</td>`;
        }
        out += "</td>";
    }
    out += "</table>";

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
    console.log(c_method.val());
    if (c_method.val() == "matrix") {
        genStencilMat(d, m_cont);
    } else {
        errOut("Not implemented", m_cont);
    }
}

function main() {
    // initialize element vars
    s_dim    = $("#stencil-dim");
    m_cont   = $("#mat-cont");
    t_out    = $("#text-out");
    c_method = $("#comp-method");

    s_dim.change(updateEntry);
    c_method.change(updateEntry);

    s_dim.change();

    // indicate loading done
    console.log("Core loaded");
}

main();