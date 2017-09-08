ZIPNAME = js13k-lost.zip
BUILD_DIR = build
MIN_JS = game.min.js

.PHONY: build

build:
	mkdir -p ${BUILD_DIR}
	closure-compiler ga/ga.js plug.js index.js > ${BUILD_DIR}/${MIN_JS}
	zip -9 ${BUILD_DIR}/${ZIPNAME} ${BUILD_DIR}/index.html ${BUILD_DIR}/${MIN_JS}
