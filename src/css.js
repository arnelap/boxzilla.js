function camelCase(string) {
    return string.replace('-', '');
}

function css(element, styles) {
    for(var prop in styles) {
        element.style[camelCase(prop)] = styles[prop];
    }
}

module.exports = css;