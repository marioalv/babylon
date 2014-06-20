if ("undefined" == typeof(BabylonWordSearch))
{
  var BabylonWordSearch = {};
};

BabylonWordSearch.Utils = {

  stringBundle: {},
  menuList: {},
  serviceURL: "http://info.babylon.com/onlinebox.cgi",
  languageIdentifierPrefix: "babylon-word-search-languages-",
  preferencesDialogURL: 'chrome://babylonWordSearch/content/preferences.xul',
  preferencesDialgoName: 'preferencesDialog',
  preferencesDialogParameters: 'chrome,titlebar,centerscreen,toolbar',
  defaultSearchLanguage: 'en',
  prefManager: Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefBranch),

  /**
   * result: trims a string
   */
  trimString: function(str) {
    if (str) {
      return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
    else {
      return "";
    }
  },

  /**
   * result: checks if a string begins with a given string
   */
  startsWith: function(str, matchStr) {
    return (str.match("^"+matchStr)==matchStr);
  },

  /**
   * result: encodes the parameters string to send to Babylon's online definition service
   */
  serializeParams: function(params)
  {
    var str = '';
    for (var key in params) {
      str += key + '=' + encodeURIComponent(params[key]) + '&';
    }
    return str.slice(0, -1);
  },

  /**
   * result: opens the preferences window for the add-on
   */
  showPreferencesWindow: function()
  {
    var openedDialog =
      window.openDialog(this.preferencesDialogURL,
                        this.preferencesDialogName,
                        this.preferencesDialogParameters);
    openedDialog.focus();
  },

  /**
   * result: generates a valid URL to search in Babylon's online definition service
   */
  getSearchURL: function(translationLanguage, stringToSearch)
  {
    var params = {
      'rt':       'ol',
      'tid':      'pop',
      'cid':      'CD1',
      'tl':       translationLanguage,
      'term':     stringToSearch
    };

    params = BabylonWordSearch.Utils.serializeParams(params);
    return this.serviceURL+"?"+params;
  },

  /**
   * result: gets the language set in the user's browser
   */
  getBrowserLanguage: function()
  {
    var browserLanguage = navigator.language;
    if (browserLanguage) {
      if (browserLanguage.indexOf('-') > 0) {
        return browserLanguage.substring(0, browserLanguage.indexOf('-'));
      }
      else {
        return browserLanguage;
      }
    }
    else {
      return this.defaultSearchLanguage;
    }
  },

  /**
   * result: function to compare strings and sort alphabetically the languages names
   */
  sorter: function (a, b) {
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    return 0;
  },

  /**
   * result: creates a menulist with the names of the languages in which you can search for words,
   * using Babylon's online definition service
   */
  createLanguagesMenulist: function(menuList, stringBundle)
  {
    if(!menuList || menuList == null) {
      menuList = document.getElementById('babylon-word-search-languages-list');
    }

    if(!stringBundle || stringBundle == null) {
      stringBundle = document.getElementById('babylon-word-search-strings');
    }

    var languageNamesArray = new Array();
    var languageDataArray = new Array();

    var enumerator = stringBundle.strings;
    while (enumerator.hasMoreElements()) {
      var property = enumerator.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);
      //use only properties that begin with "babylon-word-search-languages-"
      if (this.startsWith(property.key, this.languageIdentifierPrefix)) {
        //order by language names, like "English, German, Spanish"
        languageNamesArray.push(property.value);
        /**
         * create an array with the language name and the language code
         * the array key is the language name, e.g. "English" and
         * the value is the language code, e.g. "babylon-word-search-languages-en"
         */
        languageDataArray[property.value] = property.key;
      }
    }
    //sort by the array keys (the language names)
    languageNamesArray.sort(this.sorter);

    for (var i = 0; i < languageNamesArray.length; i++) {
        var menuItem =
          menuList.appendItem(languageNamesArray[i],
                              languageDataArray[languageNamesArray[i]]
                                .substring(this.languageIdentifierPrefix.length));
        menuItem.setAttribute('id', languageDataArray[languageNamesArray[i]]);
    }

    menuList.selectedItem =
      document.getElementById(
        this.languageIdentifierPrefix
        + this.prefManager.getCharPref("babylonWordSearch.defaultSearchLanguage"));
  },

  /**
   * result: validates the shortcut combination pressed by the user
   */
  validateShortcutCombination: function(event)
  {
    var validKeyCodes = this.getValidKeyCodes();

    if ( [0,16,17,18,224].indexOf(event.keyCode) != -1 ) {
      //user didn't press any modifier key
      return BABYLON_WORD_SEARCH_ERROR_CODES_NO_MODIFIERS;
    }
    if ( !event.altKey && !event.ctrlKey && !event.metaKey ) {
      //user is required to press at least the ALT, CTRL or META key
      return BABYLON_WORD_SEARCH_ERROR_CODES_REQUIRED_MODIFIER_NOT_PRESENT;
    }
    if ( validKeyCodes.indexOf(event.keyCode) == -1 ) {
      //user didn't press a valid key
      return BABYLON_WORD_SEARCH_ERROR_CODES_KEYSTROKE_NOT_ALLOWED;
    }

    //user pressed a valid shortcut
    return BABYLON_WORD_SEARCH_ERROR_CODES_EVERYTHING_OK;
  },

  /**
   * result: generates a string representation of the keyboard shortcut, like alt-Y
   */
  processValidShortcutInput: function(event)
  {
    var shortcutArray = Array();

    if (event.altKey){
      shortcutArray.push("alt");
    }
    if (event.ctrlKey) {
      shortcutArray.push("control");
    }
    if (event.metaKey) {
      shortcutArray.push("meta");
    }
    if (event.shiftKey) {
      shortcutArray.push("shift");
    }
    if (event.keyCode) {
      shortcutArray.push(String.fromCharCode(event.keyCode));
    }

    return shortcutArray.join("-");
  },

  /**
   * result: for the add-on shortcut, only alphanumeric keys are allowed.
   * This method generates a list of valid keyCodes representing the alphanumeric keyboard keys.
   * For example, the lowercase 'a' has a keyCode of 65, 'b' has a keyCode of 66 and so on.
   */
  getValidKeyCodes: function()
  {
    var keyCodesArray = Array();
    for (var i=48; i<=57; i++) {
      keyCodesArray.push(i);
    }
    for (var i=65; i<=90; i++) {
      keyCodesArray.push(i);
    }
    return keyCodesArray;
  }

}
