/* capi.cc - Implementation of the Fourst C API
 *
 * @author: Anonymous for publication
 */

#include <stdio.h>
#include "fourst.hh"
#include "codegen.hh"

namespace fourst {

void fourst_init() {
    printf("libfourst initialized!\nClick\"Generate Code\" to begin.\n");
}

int fourst_gencode(double* arr) {
    _gencode(arr);

    return 0;
}

}
