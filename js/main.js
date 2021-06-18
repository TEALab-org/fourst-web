let s_dim  = undefined;
let s_mat  = undefined;
let m_cont = undefined;

function genStencilMat(dim, elm) {
    if (dim.length == 1 && dim[0] == "") {
        elm[0].innerHTML = `<p class="text-muted">Empty -- please indicate the dimensions of the stencil matrix</p>`;
        return;
    } if (dim.length > 2) {
        elm[0].innerHTML = `<p class="text-muted">Currently, only two dimensions are supported</p>`;
        return;
    }

    
    
}

function genRes() {
    alert("Not implemented!");
}

function main() {
    // initialize element vars
    s_dim  = $("#stencil-dim");
    m_cont = $("#mat-cont");

    s_dim.change(() => {
        genStencilMat(s_dim.val().replace(/\s/g, '').split(",").map(x=>+x), m_cont);
    });

    s_dim.change();

    // indicate loading done
    console.log("Core loaded");
}

main();