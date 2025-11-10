goog.provide('webfont.modules.google.FontApiUrlBuilder');

/**
 * @constructor
 */
webfont.modules.google.FontApiUrlBuilder = function(apiUrl, text) {
  if (apiUrl) {
    this.apiUrl_ = apiUrl;
  } else {
    this.apiUrl_ = webfont.modules.google.FontApiUrlBuilder.DEFAULT_API_URL;
  }
  this.fontFamilies_ = [];
  this.subsets_ = [];
  this.text_ = text || '';
};


webfont.modules.google.FontApiUrlBuilder.DEFAULT_API_URL = 'https://fonts.googleapis.com/css2';

goog.scope(function () {
  var FontApiUrlBuilder = webfont.modules.google.FontApiUrlBuilder;

  FontApiUrlBuilder.prototype.setFontFamilies = function(fontFamilies) {
    this.parseFontFamilies_(fontFamilies);
  };


  FontApiUrlBuilder.prototype.parseFontFamilies_ =
      function(fontFamilies) {
    var length = fontFamilies.length;

    for (var i = 0; i < length; i++) {
      var elements = fontFamilies[i].split(':');

      if (elements.length == 3) {
        this.subsets_.push(elements.pop());
      }
      var joinCharacter = '';
      if (elements.length == 2 && elements[1] != ''){
        joinCharacter = ':';
      }
      this.fontFamilies_.push(elements.join(joinCharacter));
    }
  };


  FontApiUrlBuilder.prototype.webSafe = function(string) {
    return string.replace(/ /g, '+');
  };

  /**
   * Convert old format variants to API v2 format
   * Examples:
   * - "regular,700" -> "wght@400;700"
   * - "regular,italic,700" -> "ital,wght@0,400;0,700;1,400"
   */
  FontApiUrlBuilder.prototype.convertVariantsToV2 = function(variants) {
    // If already in v2 format (contains @), return as-is
    if (variants.indexOf('@') !== -1) {
      return variants;
    }

    var variantList = variants.split(',');
    var weights = [];
    var italicWeights = [];

    for (var i = 0; i < variantList.length; i++) {
      var variant = variantList[i].trim();

      if (variant === 'regular') {
        weights.push('400');
      } else if (variant === 'italic') {
        italicWeights.push('400');
      } else if (variant.indexOf('italic') !== -1) {
        var weight = variant.replace('italic', '');
        italicWeights.push(weight);
      } else if (!isNaN(variant)) {
        weights.push(variant);
      }
    }

    // Build API v2 format
    if (italicWeights.length > 0) {
      var parts = [];
      for (var j = 0; j < weights.length; j++) {
        parts.push('0,' + weights[j]);
      }
      for (var k = 0; k < italicWeights.length; k++) {
        parts.push('1,' + italicWeights[k]);
      }
      return 'ital,wght@' + parts.join(';');
    } else {
      return 'wght@' + weights.join(';');
    }
  };

  FontApiUrlBuilder.prototype.build = function() {
    if (this.fontFamilies_.length == 0) {
      throw new Error('No fonts to load!');
    }
    if (this.apiUrl_.indexOf("kit=") != -1) {
      return this.apiUrl_;
    }
    var length = this.fontFamilies_.length;

    // Build URL for Google Fonts API v2
    // Use &family= for each font instead of | separator
    var url = this.apiUrl_ + '?';

    for (var i = 0; i < length; i++) {
      var fontString = this.fontFamilies_[i];

      // Convert old format to v2 if needed
      if (fontString.indexOf(':') !== -1) {
        var parts = fontString.split(':');
        var family = parts[0];
        var variants = parts[1];

        // Convert variants to v2 format
        variants = this.convertVariantsToV2(variants);
        fontString = family + ':' + variants;
      }

      url += 'family=' + this.webSafe(fontString) + '&';
    }

    if (this.subsets_.length > 0) {
      url += 'subset=' + this.subsets_.join(',') + '&';
    }

    if (this.text_.length > 0) {
      url += 'text=' + encodeURIComponent(this.text_) + '&';
    }
    
    return url;
  };
});
