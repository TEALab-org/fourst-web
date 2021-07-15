/*
g++ -std=c++11 -o exec codegen.cpp datatypes.cpp -I.
./exec
vi test.cpp

*/

#include <iostream>
#include <vector>
#include <algorithm>
#include <cstring>
#include <complex.h>
#include <string>
#include <cstdlib>
#include <cmath>
#include <cstdio>

// #include <omp.h>
#include "datatypes.hh"


using namespace std;

options global_options;

void generate_fft_forward(FILE *outfp, datatypes &input_buffer, datatypes &output_buffer){
	string stride = "";
	fprintf(outfp, "void mkl_fft_forward(");
	fprintf(outfp, "%s %c%s, %s %c%s", input_buffer.ms_type, input_buffer.mc_argument_ptr, input_buffer.ms_name,
						output_buffer.ms_type, output_buffer.mc_argument_ptr, output_buffer.ms_name);
	if (input_buffer.mn_dim == 1){
		fprintf(outfp, ", int n){\n");
	}
	else{
		for (int i = 0; i < input_buffer.mn_dim; i++)
			fprintf(outfp, ", int n%d", i);
		fprintf(outfp, "){\n");
	}
	stride += "\t";

	if (global_options.parallel){
		fprintf(outfp, "%s#pragma omp parallel for\n", stride.c_str());
	}
	fprintf(outfp, "%sfor (int i = 0; i < ", stride.c_str());
	if (input_buffer.mn_dim == 1)
		fprintf(outfp, "n; i++)\n");
	else{
		fprintf(outfp, "n0");
		for (int i = 1; i < input_buffer.mn_dim; i++)
			fprintf(outfp, "*n%d", i);
		fprintf(outfp, "; i++))\n");
	}
	fprintf(outfp, "%soutput_buffer.ms_name[i] = 0.0\n\n", stride.c_str());

	fprintf(outfp, "%sDftiComputeForward(my_desc1_handle, %s, %s);\n", stride.c_str(), input_buffer.ms_name, output_buffer.ms_name);

	fprintf(outfp, "}\n\n");
}

void generate_fft_backward(FILE *outfp, datatypes &input_buffer, datatypes &output_buffer){
	string stride = "";
	fprintf(outfp, "void mkl_fft_backward(");
	fprintf(outfp, "%s %c%s, %s %c%s", input_buffer.ms_type, input_buffer.mc_argument_ptr, input_buffer.ms_name,
						output_buffer.ms_type, output_buffer.mc_argument_ptr, output_buffer.ms_name);
	if (input_buffer.mn_dim == 1){
		fprintf(outfp, ", int n){\n");
	}
	else{
		for (int i = 0; i < input_buffer.mn_dim; i++)
			fprintf(outfp, ", int n%d", i);
		fprintf(outfp, "){\n");
	}
	stride += "\t";

	if (global_options.parallel){
		fprintf(outfp, "%s#pragma omp parallel for\n", stride.c_str());
	}
	fprintf(outfp, "%sfor (int i = 0; i < ", stride.c_str());
	if (input_buffer.mn_dim == 1)
		fprintf(outfp, "n; i++)\n");
	else{
		fprintf(outfp, "n0");
		for (int i = 1; i < input_buffer.mn_dim; i++)
			fprintf(outfp, "*n%d", i);
		fprintf(outfp, ")\n");
	}
	fprintf(outfp, "%soutput_buffer.ms_name[i] = 0.0\n\n", stride.c_str());

	fprintf(outfp, "%sDftiComputeBackward(my_desc2_handle, %s, %s);\n", stride.c_str(), input_buffer.ms_name, output_buffer.ms_name);

	fprintf(outfp, "}\n\n");
}

void generate_fft_conv(FILE *outfp, datatypes &real, datatypes &input, datatypes &result){
	
	datatypes odd_mults("odd_mults", "double complex", '*', real.mn_dim);
	datatypes a_complex("a_complex", "double complex", '*', real.mn_dim);
	datatypes input_complex("input_complex", "double complex", '*', real.mn_dim);

	fprintf(outfp, "void convolution_fft(%s %c%s, %s %c%s, %s %c%s){\n", 
					real.ms_type, real.mc_argument_ptr, real.ms_name,
					input.ms_type, input.mc_argument_ptr, input.ms_name,
					result.ms_type, result.mc_argument_ptr, result.ms_name);
	string stride = "\t";
	fprintf(outfp, "%sif (T == 0) return ;\n", stride.c_str());
	fprintf(outfp, "%smkl_fft_forward(%s, %s, N);\n", stride.c_str(), real.ms_name, result.ms_name);

	fprintf(outfp, "%sbool is_initialized = false;\n", stride.c_str());
	fprintf(outfp, "%sint t = T;\n", stride.c_str());
	fprintf(outfp, "%swhile (t > 1){\n", stride.c_str());
	stride += "\t";
	fprintf(outfp, "%sif (t & 1){\n", stride.c_str());
	stride += "\t";
	fprintf(outfp, "%sif (is_initialized == false){\n", stride.c_str());
	stride += "\t";

	if (global_options.parallel){
		fprintf(outfp, "%s#pragma omp parallel for\n", stride.c_str());
	}
	fprintf(outfp, "%sfor (int i = 0; i < ", stride.c_str());
	fprintf(outfp, "N");
	for (int i = 1; i < input.mn_dim; i++)
		fprintf(outfp, "*N");
	fprintf(outfp, "; i++)\n");
	stride += "\t";
	fprintf(outfp, "%s%s[i] = %s[i];\n", stride.c_str(), odd_mults.ms_name, a_complex.ms_name);
	stride.pop_back();
	fprintf(outfp, "%sis_initialized = true;\n", stride.c_str());
	stride.pop_back();
	fprintf(outfp, "%s} else {\n", stride.c_str());
	stride += "\t";

	if (global_options.parallel){
		fprintf(outfp, "%s#pragma omp parallel for\n", stride.c_str());
	}
	fprintf(outfp, "%sfor (int i = 0; i < ", stride.c_str());
	fprintf(outfp, "N");
	for (int i = 1; i < input.mn_dim; i++)
		fprintf(outfp, "*N");
	fprintf(outfp, "; i++)\n");
	stride += "\t";
	fprintf(outfp, "%s%s[i] = %s[i] * %s[i];\n", stride.c_str(), odd_mults.ms_name, odd_mults.ms_name, a_complex.ms_name);
	stride.pop_back();
	stride.pop_back();
	fprintf(outfp, "%s}\n", stride.c_str());
	stride.pop_back();
	fprintf(outfp, "%s}\n", stride.c_str());

	if (global_options.parallel){
		fprintf(outfp, "%s#pragma omp parallel for\n", stride.c_str());
	}
	fprintf(outfp, "%sfor (int i = 0; i < ", stride.c_str());
	fprintf(outfp, "N");
	for (int i = 1; i < input.mn_dim; i++)
		fprintf(outfp, "*N");
	fprintf(outfp, "; i++)\n");
	stride += "\t";
	fprintf(outfp, "%s%s[i] = %s[i] * %s[i];\n", stride.c_str(), a_complex.ms_name, a_complex.ms_name, a_complex.ms_name);
	stride.pop_back();
	fprintf(outfp, "%st /= 2;\n", stride.c_str());
	stride.pop_back();
	fprintf(outfp, "%s}\n", stride.c_str());


	fprintf(outfp, "%sif (is_initialized){\n", stride.c_str());
	stride += "\t";
	if (global_options.parallel){
		fprintf(outfp, "%s#pragma omp parallel for\n", stride.c_str());
	}
	fprintf(outfp, "%sfor (int i = 0; i < ", stride.c_str());
	fprintf(outfp, "N");
	for (int i = 1; i < input.mn_dim; i++)
		fprintf(outfp, "*N");
	fprintf(outfp, "; i++)\n");
	stride += "\t";
	fprintf(outfp, "%s%s[i] = %s[i] * %s[i];\n", stride.c_str(), a_complex.ms_name, a_complex.ms_name, odd_mults.ms_name);
	stride.pop_back();
	stride.pop_back();
	fprintf(outfp, "%s}\n\n", stride.c_str());


	fprintf(outfp, "%smkl_fft_forward(%s, %s, N);\n", stride.c_str(), input.ms_name, input_complex.ms_name);

	if (global_options.parallel){
		fprintf(outfp, "%s#pragma omp parallel for\n", stride.c_str());
	}
	fprintf(outfp, "%sfor (int i = 0; i < ", stride.c_str());
	fprintf(outfp, "N");
	for (int i = 1; i < input.mn_dim; i++)
		fprintf(outfp, "*N");
	fprintf(outfp, "; i++)\n");
	stride += "\t";
	fprintf(outfp, "%s%s[i] = %s[i] * %s[i];\n", stride.c_str(), a_complex.ms_name, a_complex.ms_name, odd_mults.ms_name);


	fprintf(outfp, "}\n");


}

void gencode(FILE* outfp=stdout){
	if (!outfp) {
		// print error code
	}

	global_options.parallel = true;

	datatypes input_buffer_forward("input_buffer", "double", '*', 1), output_buffer_forward("output_buffer", "double complex", '*', 1);
	generate_fft_forward(outfp, input_buffer_forward, output_buffer_forward);

	datatypes input_buffer_backward("input_buffer", "double complex", '*', 1), output_buffer_backward("output_buffer", "double", '*', 1);
	generate_fft_backward(outfp, input_buffer_backward, output_buffer_backward);


	datatypes real_conv("real", "double", '&', 1), 
				input_conv("input", "double", '&', 1), 
				result_conv("result", "double", '&', 1);
	generate_fft_conv(outfp, real_conv, input_conv, result_conv);
}
