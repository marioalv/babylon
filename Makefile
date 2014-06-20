##
# Copyright (c) 2008 Glaxstar Ltd. All rights reserved.
##

# The name of the extension.
extension_name := babylonWordSearch

# The UUID of the extension.
extension_uuid := a27007d0-bec0-4df7-abf8-54ae0b833ce8

# The name of the profile dir where the extension can be installed.
profile_dir := DevProfile

# The zip application to be used.
ZIP := zip

# The target location of the build and build files.
bin_dir := ../bin

# The XPI version, from install.rdf
xpi_version = \
  $(shell sed -n 's_.*<em:version>\(.*\)<\/em:version>_\1_ p' < install.rdf)

client_name := $(CLIENT_NAME)

# The target XPI files.
xpi_file := $(bin_dir)/$(extension_name)$(client_name)-$(xpi_version).xpi
xpi_file_uuid := $(bin_dir)/{$(extension_uuid)}.xpi

# The type of operating system this make command is running on.
os_type := $(patsubst darwin%,darwin,$(shell echo $(OSTYPE)))

# The location of the extension profile.
ifeq ($(os_type), darwin)
  profile_location := \
    ~/Library/Application\ Support/Firefox/Profiles/$(profile_dir)/extensions/
else
  ifeq ($(os_type), linux-gnu)
    profile_location :=  ~/.mozilla/firefox/$(profile_dir)/extensions/
  else
    profile_location := \
      "$(subst \,\\,$(APPDATA))\\Mozilla\\Firefox\\Profiles\\$(profile_dir)\\extensions\"
  endif
endif

# The temporary location where the extension tree will be copied and built.
build_dir := $(bin_dir)/build

# The install.rdf file.
install_rdf := install.rdf

# The chrome.manifest file.
chrome_manifest := chrome.manifest

# The chrome dir.
chrome_dir := chrome

# The resources dir.
resources_dir := modules

# The defaults dir.
defaults_dir := defaults

# The platform dir.
platform_dir := platform

# The preferences dir.
preferences_dir := $(defaults_dir)/preferences

# This builds the extension XPI file.
.PHONY: all
all: $(xpi_file)
	@echo
	@echo "Build finished successfully."
	@echo

# This cleans all temporary files and directories created by 'make'.
.PHONY: clean
clean:
	@rm -rf $(build_dir)
	@rm -f $(xpi_file)
	@rm -f $(xpi_file_uuid)
	@echo "Cleanup is done."

# The includes are added after the targets because we want this file to contain
# the default (first) target.
include chrome/Makefile.in

# The sources for the XPI file. Uses variables defined in the included
# Makefiles.
# includes the client-specific template database when the variable is set
xpi_built := $(build_dir)/$(install_rdf) \
             $(build_dir)/$(chrome_manifest) \
             $(addprefix $(build_dir)/,$(chrome_sources)) \
             $(addprefix $(build_dir)/,$(resources_sources)) \
             $(addprefix $(build_dir)/,$(components_js_sources)) \
             $(xpt_files) \
             $(platform_files) \
             $(build_dir)/$(preferences_dir)/defaults.js \
             $(addprefix $(build_dir)/,$(preferences_dir)) \

xpi_built_no_dir := $(subst $(build_dir)/,,$(xpi_built))

# This builds everything except for the actual XPI, and then it copies it to the
# specified profile directory, allowing a quick update that requires no install.
.PHONY: install3
install3: $(build_dir) $(xpi_built)
	@echo "Installing in profile folder of Fx3: $(profile_location)\{$(extension_uuid)\}"
	@cp -Rf $(build_dir)/* $(profile_location)\{$(extension_uuid)\}
	@echo "Installing in profile folder. Done!"
	@echo

.PHONY: install4
install4: $(build_dir) $(xpi_built)
	@echo "Installing in profile folder of Fx4: $(profile_location)"
	@cp -Rf $(xpi_file_uuid) $(profile_location)
	@echo "Installing in profile folder. Done!"
	@echo

$(xpi_file): $(build_dir) $(xpi_built)
	@echo "Creating XPI file."
	@cd $(build_dir); $(ZIP) ../$(xpi_file) $(xpi_built_no_dir)
	@cp -f $(xpi_file) $(xpi_file_uuid)
	@echo "Creating XPI file. Done!"

$(build_dir)/$(chrome_dir)/%: $(chrome_dir)/% $(build_dir)/$(chrome_dir)
	@if [ ! -x $(dir $@) ]; \
  then \
    mkdir -p $(dir $@); \
  fi
	@cp -f $< $@

$(build_dir)/$(resources_dir)/%: $(resources_dir)/% $(build_dir)/$(resources_dir)
	@if [ ! -x $(dir $@) ]; \
  then \
    mkdir -p $(dir $@); \
  fi
	@cp -f $< $@

$(build_dir)/$(defaults_dir)/%: $(defaults_dir)/% $(build_dir)/$(defaults_dir)
	@if [ ! -x $(dir $@) ]; \
  then \
    mkdir -p $(dir $@); \
  fi
# This line helps removing the client name from the database template file name
	@cp -f $< $(subst $(client_name),"",$@)

$(build_dir)/$(preferences_dir)/%: $(preferences_dir)/% $(build_dir)/$(preferences_dir)
	@cp -f $< $@

$(build_dir)/%: %
	@cp -f $< $@

$(build_dir):
	@if [ ! -x $(build_dir) ]; \
  then \
    mkdir -p $(build_dir); \
  fi

$(build_dir)/$(chrome_dir):
	@if [ ! -x $(build_dir)/$(chrome_dir) ]; \
  then \
    mkdir -p $(build_dir)/$(chrome_dir); \
  fi

$(build_dir)/$(resources_dir):
	@if [ ! -x $(build_dir)/$(resources_dir) ]; \
  then \
    mkdir -p $(build_dir)/$(resources_dir); \
  fi

$(build_dir)/$(defaults_dir):
	@if [ ! -x $(build_dir)/$(defaults_dir) ]; \
  then \
    mkdir -p $(build_dir)/$(defaults_dir); \
  fi

$(build_dir)/$(preferences_dir):
	@if [ ! -x $(build_dir)/$(preferences_dir) ]; \
  then \
    mkdir -p $(build_dir)/$(preferences_dir); \
  fi
