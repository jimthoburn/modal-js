
(function() {

  function getArray(list) {
    var a = [];
    for (var index = 0; index < list.length; index++) {
      a.push(list[index]);
    }
    return a;
  };
  function addListener(element, eventName, handler, useCapture) {
    if (element.addEventListener) {
      element.addEventListener(eventName, handler, useCapture || false);
    } else {
      element.attachEvent("on" + eventName, handler);
    }
  };
  function preventDefault(e) {
    if (e.preventDefault) e.preventDefault();
    e.returnValue = false; // For IE
  };

  function available(element) {
    // If the next element has loaded, or if the parent of this
    // element is available, then we know this element is available.
    return (element && (domLoaded || element.nextSibling || available(element.parentNode)));
  };

  function getAllElementsByClassName(contextElement, className) {

    // getElementsByClassName
    if (contextElement.getElementsByClassName) {
      return getArray(contextElement.getElementsByClassName(className));
    }

    // For browsers that don't suport getElementsByClassName
    var elements = contextElement.getElementsByTagName("*");
    var length = elements.length;
    var list = [];
    for (var index = 0; index < length; index++) {
      if (hasClassName(elements[index], className)) {
        list.push(elements[index]);
      }
    }
    return list;
  };

  // KUDOS: Prototype JS (http://www.prototypejs.org/)
  function addClassName(element, className) {
    if (hasClassName(element, className)) return;
    var existingClassName = (element.className == null || element.className == "") ? "" : element.className + " ";
    element.className = existingClassName + className;
  };
  function removeClassName(element, className) {
    element.className = strip(element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), " "));
  };
  function hasClassName(element, className) {
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  };
  function strip(str) {
    return str.replace(/^\s+/, "").replace(/\s+$/, "");
  };


  /*  =Modal Window
  ----------------------------------------------- */

  // KUDOS: http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
  function getViewportDimensions() {
    var width  = 0;
    var height = 0;

    try {
      // Gecko, WebKit & Opera
      if (window.innerWidth) {
        width  = window.innerWidth;
        height = window.innerHeight;
      } else {

        // IE
        if (document.documentElement &&
          document.documentElement.clientWidth &&
          document.documentElement.clientWidth > 0) {
          width  = document.documentElement.clientWidth;
          height = document.documentElement.clientHeight;

        // IE (Quirks-mode)
        } else {
          width  = document.body.clientWidth;
          height = document.body.clientHeight;
        }
      }
    } catch(e) {}

    return {
      width : width,
      height: height
    };
  };

  function getDimensions() {
    var width  = 0;
    var height = 0;

    try {
      var pageDimensions = {
        width : document.body.offsetWidth,
        height: document.body.offsetHeight
      };

      // Special case, for IE in quirksmode
      if (document.body.scrollHeight > pageDimensions.height) {
        pageDimensions = {
          width : document.body.scrollWidth,
          height: document.body.scrollHeight
        };
      }

      var viewportDimensions = getViewportDimensions();

      width  = (pageDimensions.width  > viewportDimensions.width  ? pageDimensions.width  : viewportDimensions.width);
      height = (pageDimensions.height > viewportDimensions.height ? pageDimensions.height : viewportDimensions.height);
    } catch(e) {}

    return {
      width : width,
      height: height
    };
  };
  function getScrollOffsets() {
    var top  = 0;
    var left = 0;

    try {
      var top  = document.documentElement.scrollTop  ? document.documentElement.scrollTop : document.body.scrollTop;
      var left = document.documentElement.scrollLeft ? document.documentElement.scrollTop : document.body.scrollTop;
    } catch(e) {}

    return {
      top : top,
      left: left
    };
  };

  var ModalWindow = function(element/* HTMLLinkElement */, config/* HashObject */) {
    if (!element) return;

    if (!config) config = {};

    var request/* XMLHttpRequest */;  // Ajax request object
    var outer/* HTMLElement */;       // Outermost element of the modal window (mask/shadow)
    var inner/* HTMLElement */;       // The modal window frame
    var width = config.width || 600;
    var height = config.height;
    var id;
    var body;
    var rendered = false;

    function initialize() {
      if (typeof(element) === "string") {
        onClick();
        return;
      }
      if (element.nodeName.toLowerCase() == "a") {
        if (element.href.indexOf("#") >= 0) {
          body = document.getElementById(element.href.split("#")[1]);
          if (body) body.parentNode.removeChild(body);
        }
        addListener(element, "click", onClick);
      } else if (element.nodeName.toLowerCase() == "button") {  
        addListener(element, "click", onClick);
      } else {
        body = element;
        if (config.delaySeconds) {
          element.style.display = "none";
          setTimeout(function() {
            element.style.display = "block";
            onContentReady();
          }, config.delaySeconds * 1000);
        } else {
          onContentReady();
        }
      }
    }
    function onClick(e) {
      if (e) preventDefault(e);

      if (!rendered) {
        sendRequest();
      } else {
        outer.style.display = "block";
        center();
      }
    };
    function sendRequest() {
      request = new XMLHttpRequest();
      request.onreadystatechange = onResponse;
      request.open("GET", element.href, true);
      request.send(null);
    };
    function onResponse() {
      if (request.readyState != 4) return;

      try {
        // If the request was successfull, open a modal window.
        if (request.status == 200) {
          onContentReady();
          return;
        }

      } catch(error) {
        if (window.console && window.console.log) window.console.log(error);
      }

      // If an error occurred while setting up the modal window, open a new window instead.
      window.open(element.href, "_blank");
      if (outer && outer.parentNode) outer.parentNode.removeChild(outer);
    };
    function onContentReady() {
      render();
      center();

      return;
    }
    function render() {
      rendered = true;
      if (!body) body = getBody(request.responseText);

      // Create an outer element (for the page mask).
      outer = document.createElement("div");
      outer.id = "modal";
      document.body.appendChild(outer);

      // Create an innter element (to represent the modal window).
      inner = document.createElement("div");
      inner.innerHTML = body.html;
      inner.className = "inner";
      outer.appendChild(inner);

      var dimensions = getDimensions();
      outer.style.width = "100%";
      outer.style.height = dimensions.height + "px";

      // Create a close button.
      var p = document.createElement("p");
      p.className = "close";
      inner.appendChild(p);
      var closeButton = document.createElement("a");
      closeButton.href = "#close";
      closeButton.appendChild(document.createTextNode("Close"));
      p.appendChild(closeButton);
      addListener(closeButton, "click", onCloseButtonClick);

      // Create a close link.
      p = document.createElement("p");
      p.className = "close-last";
      inner.appendChild(p);
      var closeButton = document.createElement("a");
      closeButton.href = "#close";
      closeButton.appendChild(document.createTextNode("Close this window"));
      p.appendChild(closeButton);
      addListener(closeButton, "click", onCloseButtonClick);

      if (config.easyEscape) {
        // If the user clicks on the mask, hide this window.
        addListener(outer, "click", function(e) {
          var target = e.target;
          if (!target && e.srcElement) target =  e.srcElement; // For IE
          if (target === outer) {
            hide();
          }
        });
      }

      // If the user presses "esc" hide this window.
      addListener(document, "keydown", function(e) {
        if (e && e.keyCode == 27) {
          hide();
        }
      });
    };
    function center() {
      inner.style.width = width + "px";
      if (height) inner.style.height = height + "px";
      inner.style.overflow = "auto";

      var viewport = getViewportDimensions();
      var scroll = getScrollOffsets();
      var top = scroll.top + Math.floor((viewport.height - inner.offsetHeight) / 2);

      // Handle the case where the document is shorter than the modal window.
      if (inner.offsetHeight > viewport.height) top = scroll.top + 50;

      inner.style.marginTop = top + "px";
    };
    function getBody(responseText) {

      // Get the content of the body element.
      var regexp    = new RegExp("<body[^>]*>");
      var results   = responseText.match(regexp);
      var start     = results.index + results[0].length;
      var end       = responseText.indexOf("</body>");
      var html      = responseText.substring(start, end);

      return {
        html: html
      };
    };
    function onCloseButtonClick(e) {
      if (e.preventDefault) e.preventDefault();
      e.returnValue = false; // For IE
      hide();
    };
    function hide() {
      if (outer) outer.style.display = "none";
    };

    initialize();
  };

  (function() {

    function initialize() {
      var links = getAllElementsByClassName(document.body, "modal-window");
      for (var index = 0; index < links.length; index++) {
        var link = links[index];
        try {
          if (link.nodeName.toLowerCase() != "a") link = link.getElementsByTagName("a")[0];
          var modal = new ModalWindow(link, {
            width: 650
          });
          console.log("link: " + link);
        } catch (e) {}
      }
    };

    var temp = window.onload;
    window.onload = function() {
      if (temp && typeof(temp) == "function") {
        temp();
      }
      initialize();
    };

  })();
  
})();
