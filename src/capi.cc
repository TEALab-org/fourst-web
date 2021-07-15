/* capi.cc - Implementation of the Fourst C API
 *
 * @author: Gregory Croisdale <gcroisda@vols.utk.edu>
 */

#include <stdio.h>
#include "fourst.hh"
#include "codegen.hh"

namespace fourst {

void fourst_init() {
    printf("libfourst initialized\n");
}

int fourst_gencode(double* in) {
    int n = (int) in[0];
    int* size = new int[n];

    printf("Got %d dimensions (", n);
    for (int i = 0; i < n; i++) {
        size[i] = in[i + 1];
        printf((i == n - 1) ? "%d" : "%d, ", size[i]);
    }
    printf(")\n");

    gencode();

    return 0;
}

}
