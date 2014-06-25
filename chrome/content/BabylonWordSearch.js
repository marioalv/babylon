if ("undefined" == typeof(BabylonWordSearch)) {
  var BabylonWordSearch = {};
};

BabylonWordSearch = {

  stringBundle: {},
  statusBarIcon: {},
  toolsPanel: {},
  babylonShortcutKeyset: {},
  babylonShortcutKey: {},
  babylonPrefs: {},
  searchResultsDialogURL: 'chrome://babylonWordSearch/content/results.xul',
  searchResultsDialogName: 'resultsDialog',
  searchResultsDialogParameters:
    'chrome,extra-chrome,statusbar,dialog,resizable,centerscreen,width=455px,height=500px',
  prefManager: Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefBranch),

  /**
   *
   */
  init: function() {
    this.stringBundle = document.getElementById('babylon-word-search-strings');
    this.statusBarIcon =
      document.getElementById('babylon-word-search-status-bar-panel');
    if (this.statusBarIcon) {
      this.statusBarIcon.setAttribute('tooltiptext',
        this.stringBundle.getString('babylonWordSearch.statusBar.tooltip'));
    }
    this.toolsPanel = document.getElementById('babylon-word-search-tools-panel');

    //hook up Firefox's context menu
    var contentAreaContextMenu =
      document.getElementById("contentAreaContextMenu");
    if (contentAreaContextMenu != null) {
      contentAreaContextMenu.addEventListener("popupshowing",
        function () { BabylonWordSearch.showContextMenu() }, false);
    }

    //hook up Thunderbird's reading message context menu
    var mailContext = document.getElementById("mailContext");
    if (mailContext != null) {
      mailContext.addEventListener("popupshowing",
        function () { BabylonWordSearch.showContextMenu() }, false);
    }

    //hook up Thunderbird's compose/reply mail context menu
    var mailComposeContext = document.getElementById("msgComposeContext");
    if (mailComposeContext != null) {
      mailComposeContext.addEventListener("popupshowing",
        function () { BabylonWordSearch.showContextMenu() }, false);
    }

    //check if there is a default language as a preference
    //if there isn't a preference default language, use the user browser's language
    if (!this.prefManager.getPrefType("babylonWordSearch.defaultSearchLanguage") ||
      this.prefManager.getCharPref("babylonWordSearch.defaultSearchLanguage") ==
        BABYLON_WORD_SEARCH_EMPTY_STRING) {
      this.prefManager.setCharPref("babylonWordSearch.defaultSearchLanguage",
        BabylonWordSearch.Utils.getBrowserLanguage());
    }

    //set the application's shortcut
    this.setKeyShortcutFromPreference();

    //add and observer to watch for the shortcut preference change
    this.babylonPrefs = Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService)
      .getBranch("babylonWordSearch.");
    this.babylonPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this.babylonPrefs.addObserver("", this, false);

    // initializes the babylon button.
    this._installToolbarButton();
  },

  /**
   * Installs the toolbar button on the first run.
   */
  _installToolbarButton: function() {
    var buttonInstalled = false;

    //first check if the preference exists
    if(this.prefManager.getPrefType("babylonWordSearch.buttonAddedToFF4")) {
      buttonInstalled =
        this.prefManager.getBoolPref("babylonWordSearch.buttonAddedToFF4");
    }

    if (!buttonInstalled) {
      var id = "babylon-toolbar-item";

      if (!document.getElementById(id)) {
        var toolbar = document.getElementById("nav-bar");

        // If no afterId is given, then append the item to the toolbar
        var before = null;
        var elem = document.getElementById("urlbar-container");
        if (elem && elem.parentNode == toolbar)
          before = elem;

        //XXX: let's add the button at the end of the toolbar
        toolbar.insertItem(id, null, null, null);
        toolbar.setAttribute("currentset", toolbar.currentSet);
        document.persist(toolbar.id, "currentset");
      }
      this.prefManager.setBoolPref("babylonWordSearch.buttonAddedToFF4", true);
    }

    try {
      BrowserToolboxCustomizeDone(true);
    } catch (e) { }
  },

  /**
   * result: shows / hides the Babylon status bar icon depending on the user's
   * preference set
   */
  toggleStatusBarIcon : function() {
    //check if the status bar icon should be displayed
    var statusBarIcon =
      document.getElementById("babylon-word-search-status-bar-panel");
    if (statusBarIcon) {
      if (this.prefManager.getBoolPref("babylonWordSearch.showStatusBarIcon")) {
        statusBarIcon.setAttribute("collapsed", false);
      } else {
        statusBarIcon.setAttribute("collapsed", true);
      }
    }
  },

  /**
   * result: returns the selected text.
   * There are many alternatives:
   * First:
   * Check if there is text selected inside a textbox. If there is, return that text
   * Otherwise:
   * For Firefox, we need to get the selected text with the global function named
   * getBrowserSelection(), located in browser.js.
   * The function content.getSelection() doesn't work in gmail
   * For Thunderbird, we need to get the selected text with the function named
   * content.getSelection(), because getBrowserSelection() is not defined as a global function in Thunderbird
   */
  getSelectedText: function() {
    //check if the user is searching for a word located inside a textbox
    var focusedElement = document.commandDispatcher.focusedElement;

    if (focusedElement != null && focusedElement.value != null) {
      var selectionStart = focusedElement.selectionStart;
      var selectionEnd   = focusedElement.selectionEnd;
      var selectedText =
        BabylonWordSearch.Utils.trimString(
          focusedElement.value.substr(selectionStart, selectionEnd));

      if (selectedText != null &&
        selectedText != BABYLON_WORD_SEARCH_EMPTY_STRING) {
        return selectedText;
      }
    }

    //check if the user is searching for a word located inside the webpage (not inside a textbox)
    if (typeof getBrowserSelection == 'function') {
      return getBrowserSelection();
    }
    else {
      if (typeof content.getSelection == 'function') {
        return BabylonWordSearch.Utils.trimString(content.getSelection().toString());
      }
      else {
        return BABYLON_WORD_SEARCH_EMPTY_STRING;
      }
    }
  },

  /**
   * result: overwrties the "Search in Babylon" option in the Tools menu
   * If there is a selected word, "Search [selectedWord] in Babylon" option will be displayed
   * Otherwise, "Search in Babylon" option will be displayed
   */
  overwriteBabylonToolsMenu: function() {
    var stringToSearch = this.getSelectedText();
    var babylonWordSearchToolsPanel =
      document.getElementById('babylon-word-search-tools-panel');

    if (!(stringToSearch == BABYLON_WORD_SEARCH_EMPTY_STRING)) {
      this.rebuildToolbarMenu(
        this.stringBundle.getFormattedString("babylonWordSearch.search",
          [stringToSearch])
      );
    }
    else {
      this.rebuildToolbarMenu(
        this.stringBundle.getString("babylonWordSearch.emptySearch"));
    }
  },

  /**
   * result: determines if the "Search in Babylon" option should be added to the context menu
   */
  showContextMenu: function() {
    var stringToSearch = this.getSelectedText();
    var babylonWordSearchContextMenu =
      document.getElementById('babylon-word-search-context-menu');

    if (!(stringToSearch == BABYLON_WORD_SEARCH_EMPTY_STRING)) {
      babylonWordSearchContextMenu.hidden = false;
      babylonWordSearchContextMenu.label =
        this.stringBundle.getFormattedString("babylonWordSearch.search",
          [stringToSearch]);
    }
    else {
      babylonWordSearchContextMenu.hidden = true;
    }
  },

  /**
   * result: handles the event when the user double clicks over a word to search
   */
  handleDoubleClick: function() {
    if (!(this.getSelectedText() == BABYLON_WORD_SEARCH_EMPTY_STRING) &&
        this.prefManager.getBoolPref("babylonWordSearch.isDoubleClickSearch")) {

      this.searchWordInBabylon();
    }
  },

  /**
   * result: searches in Babylon for the word selected by the user
   */
  searchWordInBabylon: function() {
    var stringToSearch = this.getSelectedText();
    var searchURL =
      BabylonWordSearch.Utils.getSearchURL(
        this.prefManager.getCharPref("babylonWordSearch.defaultSearchLanguage"),
          stringToSearch);

    var openedDialog =
      window.openDialog(this.searchResultsDialogURL,
        this.getSearchResultsDialogName(),
        this.searchResultsDialogParameters,
        searchURL,
        stringToSearch);
    openedDialog.focus();
    return true;
  },

  /**
   * result: opens an empty search dialog to search for a word in Babylon
   */
  openBabylonSearchDialog: function() {
    var openedDialog =
      window.openDialog(this.searchResultsDialogURL,
        this.getSearchResultsDialogName(),
        this.searchResultsDialogParameters);
    openedDialog.focus();
  },

  /**
   * result: returns the results dialog name, in case the user wants to open
   * only one window to show the results.
   * If the results window has the same name everytime it's opened,
   * all the results will be shown in the same opened window
   */
  getSearchResultsDialogName: function() {
    var dialogName = BABYLON_WORD_SEARCH_EMPTY_STRING;

    if (this.prefManager.getBoolPref(
      "babylonWordSearch.openResultsInSameWindow")) {
      dialogName = this.searchResultsDialogName;
    }

    return dialogName;
  },

  /**
   * result: process the event of clicking in the status bar
   * left click: search for word definition
   * right click: open the preferences dialog
   */
  processStatusbarClick: function(event) {
    if (event.button == 0) {
      //left click
      this.searchWordInBabylon();
    }
    else {
      if (event.button == 2) {
        // right-click
        BabylonWordSearch.Utils.showPreferencesWindow();
      }
    }
  },

  /**
   * result: listens for the shortcut preference change
   */
  observe: function(subject, topic, data){

    if (topic != "nsPref:changed"){
      return;
    }
    else {
      switch(data) {
        case "keyboardShortcut":
          //babylonWordSearch.keyboardShortcut
        case "useShortcut":
          //babylonWordSearch.useShortcut
          this.setKeyShortcutFromPreference();
          break;
        case "showStatusBarIcon":
          this.toggleStatusBarIcon();
          break;
      }
    }
  },

  /**
   * result: when the shortcut preference is changed,
   * we need to rebuild the keyset element and the toolbar menu to display the new shortcut
   */
  setKeyShortcutFromPreference: function() {
    this.toogleShortcutKeysListener();
    this.rebuildToolbarMenu(null);
  },

  /**
  * result: everytime the shortcut preference is set, we need to rebuild the keyset,
  * in order to re-capture the new shortcut
  */
  toogleShortcutKeysListener: function () {
    var modifiersString = BABYLON_WORD_SEARCH_EMPTY_STRING;
    var keyString = BABYLON_WORD_SEARCH_EMPTY_STRING;
    var shortcutString =
      this.prefManager.getCharPref('babylonWordSearch.keyboardShortcut');
    var shortcutTokensArray = shortcutString.split('-');

    for(var i = 0; i < shortcutTokensArray.length; i++){
      if( ["alt","control","meta","shift"].indexOf(shortcutTokensArray[i]) != -1 ) {
        modifiersString += shortcutTokensArray[i] + " ";
      }
      else {
        keyString = shortcutTokensArray[i];
      }
    }

    this.babylonShortcutKeyset = document.getElementById('babylon-word-search-keyset');
    if (this.babylonShortcutKeyset != null) {
      var keysetParent = this.babylonShortcutKeyset.parentNode;
      this.babylonShortcutKeyset.parentNode.removeChild(
        this.babylonShortcutKeyset);

      var keysetElement = document.createElement('keyset');
      keysetElement.id = 'babylon-word-search-keyset';
      var keyElement = document.createElement('key');
      keyElement.setAttribute('id', 'babylon-word-search-key');
      keyElement.setAttribute('oncommand',
        'BabylonWordSearch.searchWordInBabylon();');

      if (this.prefManager.getBoolPref('babylonWordSearch.useShortcut') == true) {
        keyElement.setAttribute('key', keyString);
        keyElement.setAttribute('modifiers', modifiersString);
      }
      else {
        //if we are not listening to the shortcut, leave the keyset shortcut "blank"
        keyElement.setAttribute('key', BABYLON_WORD_SEARCH_EMPTY_STRING);
        keyElement.setAttribute('modifiers', BABYLON_WORD_SEARCH_EMPTY_STRING);
      }

      keysetElement.appendChild(keyElement);
      keysetParent.appendChild(keysetElement);
    }
  },

  /**
   * result: everytime the shortcut preference is set, we need to rebuild the toolbar menu element,
   * in order to set the new shortcut in the element's description
   */
  rebuildToolbarMenu: function(newLabel) {
    this.toolsPanel =
      document.getElementById('babylon-word-search-tools-panel');
    var babylonToolsPanel = document.createElement('menuitem');
    babylonToolsPanel.setAttribute('id', this.toolsPanel.id);
    babylonToolsPanel.setAttribute('image',
      this.toolsPanel.getAttribute('image'));
    babylonToolsPanel.setAttribute('class',
      this.toolsPanel.getAttribute('class'));
    babylonToolsPanel.setAttribute('accesskey',
      this.toolsPanel.getAttribute('accesskey'));
    babylonToolsPanel.setAttribute('insertafter', 'devToolsSeparator');
    babylonToolsPanel.setAttribute('oncommand',
      'BabylonWordSearch.searchWordInBabylon();');
    babylonToolsPanel.setAttribute('key', 'babylon-word-search-key');

    if (newLabel != null && !(newLabel == BABYLON_WORD_SEARCH_EMPTY_STRING)) {
      babylonToolsPanel.setAttribute('label', newLabel);
    }
    else {
      babylonToolsPanel.setAttribute('label', this.toolsPanel.getAttribute('label'));
    }

    this.toolsPanel.parentNode.insertBefore(babylonToolsPanel, this.toolsPanel);
    this.toolsPanel.parentNode.removeChild(this.toolsPanel);
  },

  /**
   *
   */
  unload: function() {
    this.babylonPrefs.removeObserver("", this, false);

    window.removeEventListener("load",
      function () { BabylonWordSearch.init() },
      false);

    window.removeEventListener("dblclick",
      function() { BabylonWordSearch.handleDoubleClick() } ,
      false);
  }

};

window.addEventListener("load",
  function () { BabylonWordSearch.init() }, false);

window.addEventListener("unload",
  function() { BabylonWordSearch.unload() }, false);

window.addEventListener("dblclick",
  function() { BabylonWordSearch.handleDoubleClick() } , false);
