# Touch
Touch是一个轻量级的移动事件库，解决移动端存在的click 300ms延迟问题和由此引出的点透鬼点击问题。
###demo
```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <!-- <meta name="viewport" content="width=device-width,initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"> -->
  <title>Backbone.js Todos</title>
  <script type="text/javascript" src="./Touch.js"></script>

  <style type="text/css">
  *{
    margin:0;
    padding:0;

  }
  ul{
    position:relative;
    width:200px;
    padding: 20px;
    background: red;
  }
  li {
    background: yellow;
  }
  li:before{
    position:absolute;
    content:"";
    height:1px;
    top:0;
    left:0;
    right:0;
    display:block;
    border-top:1px solid black;
    transform: scaleY(0.5);
  }
  </style>
</head>

<body>
  <ul>
    <li id="li">sdffffaa</li>
  </ul>
  <div id="di" style="width:100%;height:200px;background:green;opacity:0.5;position:absolute"></div>
  <input id="box" type="text">fffff</button>

  <script>
    var time = Date.now();
    Touch.markFastClick(document);
    Touch.press(di, function(evt) {
     li.innerHTML = Date.now() - time;
     time = Date.now();
     // evt.preventDefault();
    });

    di.addEventListener('click', function() {
      di.style.top="200px"
      li.innerHTML = Date.now() - time;
    });

    box.addEventListener('click', function(evt) {
      alert('click');
      console.log(evt._fastclick)
      li.innerHTML = Date.now() - time;
    });
  </script>
  </body>
</html>

```
