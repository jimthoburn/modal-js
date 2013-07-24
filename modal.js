
(function() {

  /*  =Modal Window
  ----------------------------------------------- */
  var ModalWindow = function(element/* HTMLLinkElement */) {
    if (!element) return;

    var request; /* XMLHttpRequest */
    var mask;    /* HTMLElement */
    var chrome;  /* HTMLElement */
    var body;    /* String */
    var rendered = false;

    function initialize() {
      element.addEventListener("click", onClick, false);
    }
    function onClick(e) {

      // If the user wants to open the link in a new window, let the browser handle it.
      if (e && (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)) return;

      // If the window is small, we probably don’t want to
      // complicate things, so let the browser handle the click.
      var width = (window.innerWidth < screen.width) ? window.innerWidth : screen.width;
      if (width < 500) return;

      if (e) e.preventDefault();

      show();
    };
    function show() {
      if (!rendered) {
        sendRequest();
      } else {
        mask.style.display = "block";
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
        // If the request was successful, open a modal window.
        if (request.status == 200) {
          render();
          return;
        }

      } catch(error) {
        if (window.console && window.console.log) window.console.log(error);
      }

      // If an error occurred while setting up the modal window, follow the link the normal way.
      window.location.href = element.href;
    };
    function render() {
      rendered = true;
      if (!body) body = getBody(request.responseText);

      // Create an mask element.
      mask = document.createElement("div");
      mask.className = "modal-mask";
      document.body.appendChild(mask);

      // Create a few container elements, for styling
      var container1 = document.createElement("div");
      container1.className = "modal-container-1";
      mask.appendChild(container1);

      var container2 = document.createElement("div");
      container2.className = "modal-container-2";
      container1.appendChild(container2);

      var container3 = document.createElement("div");
      container3.className = "modal-container-3";
      container2.appendChild(container3);

      // Create an chrome element (the modal window itself).
      chrome = document.createElement("div");
      chrome.innerHTML = body;
      chrome.className = "modal-chrome";
      container3.appendChild(chrome);

      // Create a close link.
      p = document.createElement("p");
      p.className = "modal-close";
      chrome.appendChild(p);
      var closeButton = document.createElement("a");
      closeButton.href = "#close";
      closeButton.appendChild(document.createTextNode("Close this window"));
      p.appendChild(closeButton);
      closeButton.addEventListener("click", onCloseButtonClick, false);

      // Create another close link.
      p = document.createElement("p");
      p.className = "modal-close-corner";
      chrome.appendChild(p);
      var closeButton = document.createElement("a");
      closeButton.href = "#close";
      closeButton.appendChild(document.createTextNode("Close this window"));
      p.appendChild(closeButton);
      closeButton.addEventListener("click", onCloseButtonClick, false);

      // If the user clicks on the mask, hide this window.
      mask.addEventListener("click", function(e) {
        var target = e.target;
        if (target === mask) {
          hide();
        }
      }, false);

      // If the user presses "esc" hide this window.
      document.addEventListener("keydown", function(e) {
        if (e && e.keyCode == 27) {
          hide();
        }
      }, false);
    };
    function getBody(responseText) {
      var regexp, results, start, end, html;

      // First search for a modal element
      regexp  = new RegExp('<!-- modal -->');
      results = responseText.match(regexp);
      if (results && results.length >= 1) {
        start   = results.index + results[0].length;
        end     = responseText.indexOf('<!-- /modal -->');
        html    = responseText.substring(start, end);
        return html;
      }

      // If that doesn't work out, get the content of the whole body element.
      regexp  = new RegExp("<body[^>]*>");
      results = responseText.match(regexp);
      start   = results.index + results[0].length;
      end     = responseText.indexOf("</body>");
      html    = responseText.substring(start, end);
      return html;

    };
    function onCloseButtonClick(e) {
      hide();
      e.preventDefault();
    };
    function hide() {
      if (mask) mask.style.display = "none";
    };

    initialize();

    return {
      show: show
    };

  };

  (function() {

    function initialize() {
      var links = document.body.getElementsByTagName("a");
      for (var index = 0; index < links.length; index++) {
        try {
          if (links[index].getAttribute("data-modal")) {
            var modal = new ModalWindow(links[index]);
          }
        } catch(e) {}
      }
    };

    if (window.addEventListener) {
      window.addEventListener("load", initialize, false);
    }

  })();
  
})();