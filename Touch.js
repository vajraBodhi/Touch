(function(factory) {

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = (typeof self == 'object' && self.self === self && self) ||
    (typeof global == 'object' && global.global === global && global);

  // Set up Touch appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['exports'], function(exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Touch.
      root.Touch = factory(root, exports);
    });

    // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    factory(root, exports);

    // Finally, as a browser global.
  } else {
    root.Touch = factory(root, {});
  }

})(function(root, Touch) {
    var root = window;
    var doc = document;
    var delegate = (function() {
      var T = function() {};
      return function(s) {
        T.prototype = s;

        return new T();
      };
    })();
    var lastTouchTime = Date.now();


    function markFastClick(node, useTarget) {
      if (useTarget) {
        node.fastClick = 'usetarget';
      } else {
        node.fastClick = true;
      }
    }

    function on(node, type, listener) {
      node.addEventListener(type, listener);

      return {
        remove: function() {
          node.removeEventListener(type, listener);
        }
      };
    }

    function emit(node, type, evt) {
      var ne = document.createEvent('HTMLEvents');
      ne.initEvent(type, !!evt.bubbles, !!evt.canCancel);

      for (var p in evt) {
        if (!(p in ne)) {
          ne[p] = evt[p];
        }
      }

      //The return value is false if at least one of the event handlers
      //which handled this event called Event.preventDefault(). Otherwise it returns true.
      // 如果注册的回调事件中有的调用了preventDefault方法，dispatEvent返回false，否则都返回true
      return node.dispatchEvent(ne);
    }

    function eventHandler(type) {
      // return on()
      return function(node, listener) {
        return on(node, type, function(e) {
          if (!node.contains(e.relatedTarget, node)) {
            listener.apply(node, arguments);
          }
        });
      };
    }

    function dualEvent(type) {
      return function(node, listener) {
        return on(node, type, listener);
      };
    }

    function copyEventProps(evt) {
      return evt;
    }

    function elementFromPoint(evt) {
      var touch = evt.changedTouches[0];
      return doc.elementFromPoint(touch.clientX, touch.clientY);
    }

    function marked(node) {
      while (node) {
        if (node.fastClick) {
          return node;
        }

        node = node.parentNode;
      }
    }
    function doFastClick(evt, moveType, endType) {
      // lastTouchTime = Date.now();
      var markNode = marked(evt.target);
      var clickTracker = !evt.target.disabled && markNode && markNode.fastClick;

      if (clickTracker) {
        var useTarget = markNode && markNode.fastClick && markNode.fastClick === 'useTarget';
        var clickTarget = useTarget ? markNode : evt.target;
        var clickX = evt.changedTouches[0].clientX;
        var clickY = evt.changedTouches[0].clientY;

        //判断触控点是否移出
        function updateClickTracker(evt) {
          if (useTarget) {
            clickTracker = markNode.contains(elementFromPoint(evt)) ? markNode : null;
          } else {
            clickTracker = clickTarget === evt.target && (Date.now() - lastTouchTime < 300) &&
              Math.abs(evt.changedTouches[0].clientX - clickX) < 4 &&
              Math.abs(evt.changedTouches[0].clientY - clickY) < 4;
          }
        }

        doc.addEventListener(moveType, function(evt) {
          updateClickTracker(evt);
          if (useTarget) { //
            evt.preventDefault();
          }
        }, true);

        doc.addEventListener(endType, function(evt) {
          updateClickTracker(evt);
          if (clickTracker) { // endtype触发时，是否touch点还在clickTarget上
            clickTime = (new Date()).getTime();
            var target = (useTarget ? clickTarget : evt.target);
            if (target.tagName === "LABEL") { // label的特殊处理，label的操作应当对应到for指定的元素上
              target = dom.byId(target.getAttribute("for")) || target;
            }
            var src = (evt.changedTouches) ? evt.changedTouches[0] : evt;
            var clickEvt = document.createEvent("MouseEvents");
            clickEvt._fastclick = true; // 标识着我们自己的click事件
            clickEvt.initMouseEvent("click",
              true, //bubbles
              true, //cancelable
              evt.view,
              evt.detail,
              src.screenX,
              src.screenY,
              src.clientX,
              src.clientY,
              evt.ctrlKey,
              evt.altKey,
              evt.shiftKey,
              evt.metaKey,
              0, //button
              null //related target
            );
            setTimeout(function() {
              emit(target, "click", clickEvt);

              // refresh clickTime in case app-defined click handler took a long time to run
              clickTime = (new Date()).getTime();
            }, 0);
          }
        }, true);

        stopNativeEvents("click");

        // We also stop mousedown/up since these would be sent well after with our "fast" click (300ms),
        // which can confuse some dijit widgets.
        //移动web中文本框在mousedown中弹出键盘，在mousedown中preventDefault可以阻止键盘弹出
        //但一棒子打死，文本框永远不会弹出键盘
        stopNativeEvents("mousedown");
        stopNativeEvents("mouseup");
        function stopNativeEvents(type) {
          doc.addEventListener(type, function(evt) {
            if (!evt._fastclick && (Date.now() - clickTime) <= 1000) {
              evt.stopPropagation();
              evt.stopImmediatePropagation && evt.stopImmediatePropagation();

              if (type == "click" &&
                (evt.target.tagName != "INPUT" || evt.target.type == "radio" || evt.target.type == "checkbox")
                && evt.target.tagName != "TEXTAREA" && evt.target.tagName != "AUDIO" && evt.target.tagName != "VIDEO"){
                evt.preventDefault();
              }
            }
          }, true);
        }
      }
    }

  doc.addEventListener('DOMContentLoaded', function() {
    var hoverNode = document.body;
    doc.addEventListener('touchstart', function(evt) {
      lastTouchTime = Date.now();
      var newNode = evt.target;

      if (hoverNode) {
        emit(hoverNode, 'mytouchout', {
          relatedTarget: newNode,
          bubbles: true
        });
      }

      emit(newNode, 'mytouchover', {
        relatedTarget: hoverNode,
        bubbles: true
      });
      hoverNode = newNode;

      doFastClick(evt, 'touchmove', 'touchend');
    }, true);

    //为移出元素触发mytouchout，为移入元素触发mytouchover
    //touchmove事件只与触摸操作相关，不会具有mouseover、mouseout的效果
    doc.addEventListener('touchmove', function(evt) {
      lastTouchTime = Date.now();
      var newNode = elementFromPoint(evt);

      if (newNode) {
        if (newNode !== hoverNode) {
          emit(hoverNode, 'mytouchout', {
            relatedTarget: newNode,
            bubbles: true
          });

          emit(newNode, 'mytouchover', {
            relatedTarget: hoverNode,
            bubbles: true
          });

          hoverNode = newNode;
        }

        if (!emit(newNode, 'mytouchmove', copyEventProps(evt))) {
          evt.preventDefault();
        }
      }
    });

    doc.addEventListener('touchend', function(evt) {
      lastTouchTime = Date.now();
      var newNode = elementFromPoint(evt) || doc.body;
      if (newNode) {
        emit(newNode, 'mytouchend', copyEventProps(evt));
      }
    });
  });

  return root.Touch = Touch = {
    // root.Touch ={
    press: dualEvent('touchstart'),
    move: dualEvent('mytouchmove'),
    release: dualEvent('mytouchend'),
    cancel: dualEvent('touchcancel'),
    over: dualEvent('mytouchover'),
    out: dualEvent('mytouchout'),
    enter: eventHandler('mytouchover'),
    leave: eventHandler('mytouchout'),

    markFastClick: markFastClick
  };
});