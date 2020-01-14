function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
} 
function intToRGB(i){
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

function getRandomColor(str) {
    return intToRGB(hashCode(str));
}

function checkLuma(rgb) {
    // var c = hex.substring(1);      // strip #
    // var rgb = parseInt(c, 16);   // convert rrggbb to decimal
    // var r = (rgb >> 16) & 0xff;  // extract red
    // var g = (rgb >>  8) & 0xff;  // extract green
    // var b = (rgb >>  0) & 0xff;  // extract blue

    var c = rgb.substring(4, rgb.length);
    c = c.split(",");
    var r = parseInt(c[0])/255;
    var g = parseInt(c[1])/255;
    var b = parseInt(c[2])/255;

    var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
    return luma;
}

function textColor(color) {
   var luma = checkLuma(color);
   if (luma >= 0.9) {
       return "#000000";
   } else {
       return "#ffffff"
   }
}