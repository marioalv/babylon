if ("undefined" == typeof(BabylonWordSearch))
{
  var BabylonWordSearch = {};
};

BabylonWordSearch.Results = {

  stringBundle: {},
  resultsWindow: {},
  resultsFrame: {},
  languagesList: {},
  searchText: {},
  loadingImageGif: "chrome://babylonWordSearch/skin/throbber.gif",
  prefManager: Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefBranch),

  /**
   *
   */
  init: function()
  {
    this.stringBundle = document.getElementById('babylon-word-search-strings');
    this.resultsWindow = document.getElementById('babylon-word-search-results-window');
    this.resultsFrame = document.getElementById('babylon-word-search-results-frame');
    this.languagesList = document.getElementById('babylon-word-search-languages-list');
    this.searchText = document.getElementById('babylon-word-search-text');
    this.loadingImage = document.getElementById('babylon-word-search-loading-image');

    //window.arguments[1] is the searched word
    if (window.arguments[1] != BABYLON_WORD_SEARCH_EMPTY_STRING) {
      this.loadingImage.src = this.loadingImageGif;
      this.setSearchedWord(window.arguments[1]);
      //window.arguments[0] is the URL to send to Babylon and wait for results
      this.resultsFrame.setAttribute('src', window.arguments[0]);
    }
    else {
      this.setSearchedWord(BABYLON_WORD_SEARCH_EMPTY_STRING);
      this.resultsFrame.setAttribute('src', "about:blank");
    }

    BabylonWordSearch.Utils.createLanguagesMenulist(this.languagesList, this.stringBundle);

    this.resultsFrame.addEventListener("load",
                                  function()
                                  {
                                    //after getting the results, we need to clean up a little the resulting HTML
                                    BabylonWordSearch.Results.cleanHTMLCode();
                                  },
                                  true);
  },

  /**
   * result: cleans the results from the Babylon website (removes images and unnecessary divs)
   */
  cleanHTMLCode: function()
  {
    var bannersArray = this.resultsFrame.contentDocument
                                        .getElementsByClassName('OT_BannerDiv');
    if (bannersArray) {
      for (var i=0; i<bannersArray.length; i++) {
        bannersArray[i].parentNode.removeChild(bannersArray[i]);
      }
    }

    var imagesArray = this.resultsFrame.contentDocument
                                       .getElementsByClassName('OT_OnlineImageArea');
    if (imagesArray) {
      for (var j=0; j<imagesArray.length; j++) {
        imagesArray[j].parentNode.removeChild(imagesArray[j]);
      }
    }

    var containerDiv = this.resultsFrame.contentWindow
                                        .document.getElementById('container');
    if (containerDiv) {
      var resultsColDiv =
        this.resultsFrame.contentWindow.document.getElementById('results-col');
      this.resultsFrame.contentWindow.document.body.insertBefore(resultsColDiv,
                                                                 containerDiv);
      this.resultsFrame.contentWindow.document.body.removeChild(containerDiv);
    }

    var title = this.resultsFrame.contentWindow.document
                                               .getElementsByTagName('title')[0];
    if (title) {
      var newTitle = title.innerHTML.replace("&amp;", "&");
      newTitle = decodeURIComponent(newTitle);
      this.resultsWindow.setAttribute('title', newTitle);
    }

    this.loadingImage.src = "";
    this.searchText.focus();
  },

  /**
   * result: sets the searched word in the search textbox in the results window
   */
  setSearchedWord: function(searchedWord)
  {
    this.searchText.value = searchedWord;
    this.searchText.focus();
  },

  /**
   * result: for every queried word, we need to generate a search URL and set the
   * results iframe src attribute to the generated search URL
   */
  generateSearchLink: function()
  {
    var babylonWordSearchText = BabylonWordSearch.Utils.trimString(this.searchText.value);
    if (babylonWordSearchText != "") {
      this.loadingImage.src = this.loadingImageGif;
      var definitionLanguage = this.languagesList.value;
      //create a search URL to query Babylon's online dictionary
      var searchURL = BabylonWordSearch.Utils.getSearchURL(definitionLanguage,
                                                           babylonWordSearchText);
      this.resultsFrame.setAttribute('src', "about:blank");
      this.resultsFrame.setAttribute('src', searchURL);
    }
    this.searchText.focus();
  }

}

window.addEventListener("load",
                        function () { BabylonWordSearch.Results.init() },
                        false);
