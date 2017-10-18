'use strict';
/**
 * Video.js Resolution Selector
 *
 * This plugin for Video.js adds a resolution selector option
 * to the toolbar. Usage:
 *
 * <video>
 * 	<source data-res="480" src="..." />
 * 	<source data-res="240" src="..." />
 * </video>
 */

(function(VideoJS) {

  /***********************************************************************************
   * Define some helper functions
   ***********************************************************************************/
  var methods = {

    /**
     * In a future version, this can be made more intelligent,
     * but for now, we'll just add a "p" at the end if we are passed
     * numbers.
     *
     * @param	(string)	res	The resolution to make a label for
     *
     * @returns	(string)	The label text string
     */
    resolutionLabel: function(res) {

      return (/^\d+$/.test(res)) ? res + 'p' : res;
    }
  };

  /***********************************************************************************
   * Setup our resolution menu items
   ***********************************************************************************/
  VideoJS.ResolutionMenuItem = VideoJS.MenuItem.extend({

    /** @constructor */
    init: function(player, options) {

      var self = this;
      // Modify options for parent MenuItem class's init.
      options.label = methods.resolutionLabel(options.res);
      options.selected = (options.res.toString() === player.getCurrentRes().toString());

      // Call the parent constructor
      VideoJS.MenuItem.call(self, player, options);

      // Store the resolution as a property
      self.resolution = options.res;

      // Register our click and tap handlers
      self.on(['click', 'tap'], self.onSelect);

      // Toggle the selected class whenever the resolution changes
      player.on('changeRes', VideoJS.bind(self, function() {
        if (self.resolution === player.getCurrentRes()) {
          self.selected(true);
        } else {
          self.selected(false);
        }
      }));
    }
  });

  VideoJS.ResolutionMenuItem.prototype.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle clicks on the menu items
  VideoJS.ResolutionMenuItem.prototype.onSelect = function(e) {
    e.preventDefault();
    e.stopPropagation();
    // Call the player.changeRes method
    this.player().changeRes(this.resolution);
  };

  /***********************************************************************************
   * Setup our resolution menu title item
   ***********************************************************************************/
  VideoJS.ResolutionTitleMenuItem = VideoJS.MenuItem.extend({
    init: function(player, options) {
      // Call the parent constructor
      VideoJS.MenuItem.call(this, player, options);
      // No click handler for the menu title
      this.off('click');
    }
  });

  /***********************************************************************************
   * Define our resolution selector button
   ***********************************************************************************/
  VideoJS.ResolutionSelector = VideoJS.MenuButton.extend({

    /** @constructor */
    init: function(player, options) {
      // Add our list of available resolutions to the player object
      player.availableRes = options.availableRes;
      player.hideMenuTitle = options.hideMenuTitle;

      // Call the parent constructor
      VideoJS.MenuButton.call(this, player, options);

      // Set the button text based on the option provided
      this.el().firstChild.firstChild.innerHTML = options.buttonText;

      this.on(['click', 'tap'], this.switch);
    }
  });

  // Set class for resolution selector button
  VideoJS.ResolutionSelector.prototype.className = 'vjs-res-button';

  // Create a menu item for each available resolution
  VideoJS.ResolutionSelector.prototype.createItems = function() {

    var player = this.player(),
      items = [],
      currentRes;

    if (!player.hideMenuTitle) {
      // Add the menu title item
      items.push(new VideoJS.ResolutionTitleMenuItem(player, {
        el: VideoJS.Component.prototype.createEl('li', {
          className: 'vjs-menu-title vjs-res-menu-title',
          innerHTML: player.localize('Quality')
        })
      }));
    }

    // Add an item for each available resolution
    for (currentRes in player.availableRes) {

      // Don't add an item for the length attribute
      if ('length' === currentRes) {
        continue;
      }

      items.push(new VideoJS.ResolutionMenuItem(player, {
        res: currentRes
      }));
    }

    // Sort the available resolutions in descending order
    items.sort(function(a, b) {
      if (typeof a.resolution === 'undefined') {
        return -1;
      } else {
        return parseInt(b.resolution) - parseInt(a.resolution);
      }
    });

    return items;
  };

  VideoJS.ResolutionSelector.prototype.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  VideoJS.ResolutionSelector.prototype.switch = function(e) {
    // select the next resolution

    var player = this.player(),
      currentIndex = 0,
      i = 0,
      orderRes = [],
      key;

    e.preventDefault();
    e.stopPropagation();

    for (key in player.availableRes) {
      if (key !== 'length') {
        orderRes.push(key);
        if (key === player.currentRes) {
          currentIndex = i;
        }
        i++;
      }
    }

    if (currentIndex >= orderRes.length - 1) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }

    this.player().changeRes(orderRes[currentIndex]);
  };

  /***********************************************************************************
   * Register the plugin with videojs, main plugin function
   ***********************************************************************************/
  VideoJS.plugin('resolutionSelector', function(options) {

    // Only enable the plugin on HTML5 videos
    if (!this.el().firstChild.canPlayType) {
      return;
    }

    /*******************************************************************
     * Setup variables, parse settings
     *******************************************************************/
    var resolutionSelector;

    function getResolutionFromSources(player, availableRes) {
      var sources = player.options().sources,
        i = sources.length,
        currentRes;

      if (availableRes.length) {
        return availableRes;
      }
      // Get all of the available resolutions
      while (i > 0) {
        i--;
        // Skip sources that don't have data-res attributes
        if (!sources[i]['data-res']) {
          continue;
        }
        currentRes = sources[i]['data-res'];
        if (typeof availableRes[currentRes] !== 'object') {
          availableRes[currentRes] = [];
          availableRes.length++;
        }
        availableRes[currentRes].unshift(sources[i]);
      }
      return availableRes;
    }

    function checkForcedTypes(forceTypes, availableRes) {
      var i, j, foundTypes, currentRes;
      // Check for forced types
      if (forceTypes) {
        // Loop through all available reosultions
        for (currentRes in availableRes) {
          // Don't count the length property as a resolution
          if ('length' === currentRes) {
            continue;
          }
          i = forceTypes.length;
          foundTypes = 0;

          // Loop through all required types
          while (i > 0) {
            i--;
            j = availableRes[currentRes].length;

            // Loop through all available sources in current resolution
            while (j > 0) {
              j--;
              // Check if the current source matches the current type we're checking
              if (forceTypes[i] === availableRes[currentRes][j].type) {
                foundTypes++;
                break;
              }
            }
          }

          // If we didn't find sources for all of the required types in the current res, remove it
          if (foundTypes < forceTypes.length) {
            delete availableRes[currentRes];
            availableRes.length--;
          }
        }
      }
      return availableRes
    }

    function setDefaultResolution(player, defaultResolutions, availableRes) {
      // Loop through the choosen default resolutions if there were any
      for (var i = 0; i < defaultResolutions.length; i++) {
        // Set the video to start out with the first available default res
        if (availableRes[defaultResolutions[i]]) {
          player.src(availableRes[defaultResolutions[i]]);
          player.currentRes = defaultResolutions[i];
          break;
        }
      }
    }

    /*******************************************************************
     * Add methods to player object
     *******************************************************************/

    // Make sure we have player.localize() if it's not defined by Video.js
    if (typeof this.localize !== 'function') {
      this.localize = function(string) {
        return string;
      };
    }

    // Helper function to get the current resolution
    this.getCurrentRes = function() {
      if (typeof this.currentRes !== 'undefined') {
        return this.currentRes;
      } else {
        try {
          return res = this.options().sources[0]['data-res'];
        } catch (e) {
          return '';
        }
      }
    };

    // Define the change res method
    this.changeRes = function(targetResolution) {

      var videoElement = this.el().firstChild,
        isPaused = this.paused(),
        currentTime = this.currentTime(),
        buttonNodes,
        buttonNodeCount;

      // Do nothing if we aren't changing resolutions or if the resolution isn't defined
      if (this.getCurrentRes() === targetResolution ||
        !this.availableRes ||
        !this.availableRes[targetResolution]) {
        return;
      }

      // Make sure the loadedmetadata event will fire
      if ('none' === videoElement.preload) {
        videoElement.preload = 'metadata';
      }

      // Change the source and make sure we don't start the video over
      this.src(this.availableRes[targetResolution]).one('loadedmetadata', function() {

        this.currentTime(currentTime);

        // If the video was paused, don't show the poster image again
        this.addClass('vjs-has-started');

        if (!isPaused) {
          this.play();
        }
      });

      // Save the newly selected resolution in our this options property
      this.currentRes = targetResolution;

      // Make sure the button has been added to the control bar
      if (this.controlBar.resolutionSelector) {

        buttonNodes = this.controlBar.resolutionSelector.el().firstChild.children;
        buttonNodeCount = buttonNodes.length;

        // Update the button text
        while (buttonNodeCount > 0) {

          buttonNodeCount--;

          if ('vjs-control-text' === buttonNodes[buttonNodeCount].className) {

            buttonNodes[buttonNodeCount].innerHTML = methods.resolutionLabel(targetResolution);
            break;
          }
        }
      }

      // Update the classes to reflect the currently selected resolution
      this.trigger('changeRes');
    };

    // Define the change res method
    this.setResOptions = function(options) {
      // Override default options with those provided
      var settings = VideoJS.util.mergeOptions({
        default_res: '', // (string)	The resolution that should be selected by default ( '480' or  '480,1080,240' )
        force_types: false, // (array)	List of media types. If passed, we need to have source for each type in each resolution or that resolution will not be an option
        hide_menu_title: false,
        available_res: {}, // (array)
      }, options || {});

      var availableRes = getResolutionFromSources(this, settings.available_res);
      availableRes = checkForcedTypes(settings.force_types, availableRes);

      availableRes.length = 0;
      for (var key in availableRes) {
        if (availableRes.hasOwnProperty(key) && key !== 'length') {
          availableRes.length++;
        }
      }

      // Make sure we have at least 2 available resolutions before we add the button
      if (availableRes.length < 2) {
        return;
      }

      var defaultResolutions = (settings.default_res && typeof settings.default_res === 'string') ? settings.default_res.split(',') : [];
      setDefaultResolution(this, defaultResolutions, availableRes);

      /*******************************************************************
       * Add the resolution selector button
       *******************************************************************/

      // Get the starting resolution
      var currentRes = this.getCurrentRes();

      if (currentRes) {
        currentRes = methods.resolutionLabel(currentRes);
      }

      this.controlBar.removeChild(resolutionSelector);
      // Add the resolution selector button
      resolutionSelector = new VideoJS.ResolutionSelector(this, {
        buttonText: this.localize(currentRes || 'Quality'),
        availableRes: availableRes,
        hideMenuTitle: settings.hide_menu_title,
      });

      // Add the button to the control bar object and the DOM
      this.controlBar.resolutionSelector = this.controlBar.addChild(resolutionSelector);
    };

    this.setResOptions(options);

  });

})(videojs);
