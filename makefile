# makefile - build system for emcc source
#
# Common targets:
#
#   * `make`: Builds 
#
# @author: Anonymous for publication


# -*- Programs -*-

# Emscripten compiler, assumes you have loaded the Emscripten SDK through
#   your dotfiles, or via `source /path/to/emsdk/emsdk_env.sh`
EMCC         := emcc


# -*- Checks -*-

# Check for Emscripten (EMCC)
ifneq ($(shell $(EMCC) --version > /dev/null; echo $$?),0)
  $(error Emscripten is not installed or loaded ($$(EMCC)=$(EMCC)). Try loading the environment variables, or setting `EMCC` to the Emscripten compiler)
endif


# -*- Options -*-

# Emscripten compiler flags
EMCC_CFLAGS  := -sASSERTIONS=1 -sSAFE_HEAP=1 -sDEMANGLE_SUPPORT=1 -sNO_EXIT_RUNTIME=0

# Emscripten linker flags (for final compilation)
EMCC_LDFLAGS := -sWASM=1 -sFORCE_FILESYSTEM=1 \
				-sEXTRA_EXPORTED_RUNTIME_METHODS=[\"ccall\",\"cwrap\",\"stringToUTF8\",\"UTF8ToString\"] \
				-sEXPORTED_FUNCTIONS=[\"_malloc\",\"_free\"]

CXXFLAGS += -g

# -*- Files -*-

src_CC       := $(sort $(wildcard src/*.cc) $(wildcard src/impl/*.cc))
src_HH       := $(wildcard src/*.hh)

src_O        := $(patsubst %.cc,build/%.o,$(src_CC))
src_EMCCO    := $(patsubst %.cc,build/%.emcco,$(src_CC))

out_LIB_JS   := web/js/lib/libfourst.js


# -*- Rules -*-

.PHONY: default all clean lib bin update

default: lib bin

update: lib bin

all: lib bin

clean:
	rm -rf $(wildcard $(src_O) $(src_EMCCO) $(out_LIB_JS) $(out_CLI))

lib: $(out_LIB_JS)

bin: $(out_CLI)


# Generated files (n/a right now)
#src/insts.cc: tools/geninsts.py tools/riscvdata.py
#	$< > $@

$(out_LIB_JS): $(src_EMCCO) src/pre.js
	@mkdir -p $(dir $@)
	$(EMCC) \
		$(EMCC_LDFLAGS) \
		-sMODULARIZE=1 -sEXPORT_NAME='loadlibfourst' \
		$(src_EMCCO) \
		--pre-js src/pre.js \
		-o $@
		

build/%.o: %.cc $(src_H)
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) -Isrc $< -c -fPIC -o $@

build/%.emcco: %.cc $(src_H)
	@mkdir -p $(dir $@)
	$(EMCC) $(EMCC_CFLAGS) -Isrc $< -c -fPIC -o $@

