if ("undefined" == typeof(BabylonWordSearch)) {
  var BabylonWordSearch = {};
};

BabylonWordSearch.Preferences = {

  stringBundle: {},
  menuList: {},
  keyboardShortcutButton: {},
  keyboardShortcutTextbox: {},
  keyboardShortcutMessage: {},
  keyboardShortcutCheckbox: {},
  prefManager: Components.classes["@mozilla.org/preferences-service;1"]
              .getService(Components.interfaces.nsIPrefBranch),

  /**
   *
   */
  init: function() {
    this.stringBundle = document.getElementById('babylon-word-search-strings');
    this.menuList =
      document.getElementById('babylon-word-search-languages-list');

    this.keyboardShortcutButton =
      document.getElementById('babylon-word-search-keyboard-shortcut-button');
    this.keyboardShortcutButton.label =
      this.stringBundle.getString("babylonWordSearch.setShortcut");

    this.keyboardShortcutTextbox =
      document.getElementById('babylon-word-search-keyboard-shortcut-textbox');
    this.keyboardShortcutTextbox.value =
      this.prefManager.getCharPref("babylonWordSearch.keyboardShortcut");

    this.keyboardShortcutCheckbox =
      document.getElementById('babylon-word-search-use-shortcut-checkbox');

    this.keyboardShortcutMessageTitle =
      document.getElementById(
        'babylon-word-search-keyboard-shortcut-title-message');

    this.keyboardShortcutMessage =
      document.getElementById('babylon-word-search-keyboard-shortcut-message');
    this.keyboardShortcutMessage.value =
      this.stringBundle.getString(
        "babylonWordSearch.messages.shortcutInfoMessage");

    BabylonWordSearch.Utils.createLanguagesMenulist(
      this.menuList, this.stringBundle);

    this.toggleShortcutUsage();
  },

  /**
   * result: handles the shortcut change.
   * Disables the "Set shortcut button"
   * Listens for a valid shortcut combination to set as the new shortcut
   */
  handleShortcutSet: function(event) {
    this.keyboardShortcutButton.disabled = true;

    this.keyboardShortcutTextbox.focus();
    this.keyboardShortcutTextbox.value = BABYLON_WORD_SEARCH_EMPTY_STRING;

    this.keyboardShortcutMessageTitle.value = BABYLON_WORD_SEARCH_EMPTY_STRING;

    this.keyboardShortcutMessage.removeAttribute('style');
    this.keyboardShortcutMessage.value =
      this.stringBundle.getString("babylonWordSearch.messages.settingShortcut");

    window.addEventListener("keyup",
      BabylonWordSearch.Preferences.handleKeyupEvent, true);
  },

  /**
   * result: when the user is setting the new shortcut, handles the event of the user releasing the keyboard keys.
   * Validates the new shortcut.
   *   If the new shortcut is valid, re-enables the "Set shortcut button" and removes the keyup event listener
   *   Otherwise, it keeps listening until a valid shortcut is set
   */
  handleKeyupEvent: function(event) {
    event.preventDefault();
    event.stopPropagation();

    switch(BabylonWordSearch.Utils.validateShortcutCombination(event)) {
      case BABYLON_WORD_SEARCH_ERROR_CODES_NO_MODIFIERS:
        return;

      case BABYLON_WORD_SEARCH_ERROR_CODES_REQUIRED_MODIFIER_NOT_PRESENT:
        BabylonWordSearch.Preferences.setShortcutValidationMessage(
          BABYLON_WORD_SEARCH_ERROR_CODES_REQUIRED_MODIFIER_NOT_PRESENT,
          BabylonWordSearch.Preferences.stringBundle.getString(
            'babylonWordSearch.messages.requiredModifierNotPresent'));
        return;

      case BABYLON_WORD_SEARCH_ERROR_CODES_KEYSTROKE_NOT_ALLOWED:
        BabylonWordSearch.Preferences.setShortcutValidationMessage(
          BABYLON_WORD_SEARCH_ERROR_CODES_KEYSTROKE_NOT_ALLOWED,
          BabylonWordSearch.Preferences.stringBundle.getString(
            'babylonWordSearch.messages.keystrokeNotAllowed'));
        return;
    }

    //setting new shortcut was OK
    BabylonWordSearch.Preferences.setShortcutValidationMessage(
      BABYLON_WORD_SEARCH_ERROR_CODES_EVERYTHING_OK,
      BabylonWordSearch.Preferences.stringBundle.getString(
        'babylonWordSearch.messages.everythingOK'));

    BabylonWordSearch.Preferences.keyboardShortcutButton.disabled = false;
    BabylonWordSearch.Preferences.keyboardShortcutButton.label =
      BabylonWordSearch.Preferences.stringBundle.getString(
        'babylonWordSearch.setShortcut');

    BabylonWordSearch.Preferences.keyboardShortcutMessageTitle.value =
      BABYLON_WORD_SEARCH_EMPTY_STRING;

    var newShortcutString =
      BabylonWordSearch.Utils.processValidShortcutInput(event);
    BabylonWordSearch.Preferences.keyboardShortcutTextbox.value =
      newShortcutString;
    BabylonWordSearch.Preferences.prefManager.setCharPref(
      'babylonWordSearch.keyboardShortcut', newShortcutString);

    window.removeEventListener("keyup",
      BabylonWordSearch.Preferences.handleKeyupEvent, true);
  },

  /**
   * result: tells the user if the shortcut is valid or not, by setting a
   * message in a textbox below the shortcut set textbox
   */
  setShortcutValidationMessage: function(errorType, message) {
    if (errorType != BABYLON_WORD_SEARCH_ERROR_CODES_EVERYTHING_OK) {
      this.keyboardShortcutMessage.setAttribute(
        'style','color:red;font-weight:bold;');
    }
    else {
      this.keyboardShortcutMessage.setAttribute(
        'style','color:black;font-weight:bold;');
    }
    this.keyboardShortcutMessage.value = message;
  },

  /**
   * result: enables / disables the "Set shortcut" controls, depending on the user choice
   */
  toggleShortcutUsage: function() {
    if (this.keyboardShortcutCheckbox.checked) {
      this.keyboardShortcutButton.disabled = false;
      this.keyboardShortcutTextbox.disabled = false;
      this.keyboardShortcutMessage.disabled = false;
      this.keyboardShortcutMessageTitle.disabled = false;
    }
    else {
      this.keyboardShortcutButton.disabled = true;
      this.keyboardShortcutTextbox.disabled = true;
      this.keyboardShortcutMessage.disabled = true;
      this.keyboardShortcutMessageTitle.disabled = true;
    }
  }

}

window.addEventListener("load",
  function () { BabylonWordSearch.Preferences.init() }, false);
