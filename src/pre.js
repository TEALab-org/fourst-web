/* pre.js - preamble for compiled Emscripten module
 * 
 * @author: Anonymous for publication
 */

var Module = {

    '_write_stdout': [],
    '_write_stderr': [],

    'print': function(text) {Module._write_stdout.forEach((e) => {e(text);});},
    'printErr': function(text) {Module._write_stderr.forEach((e) => {e(text);});},

};