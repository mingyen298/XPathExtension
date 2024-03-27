Crawler = {}

/**
 * @param {!SDK.DOMNode} node
 * @param {boolean=} optimized
 * @return {string}
 */
Crawler.xPath = function (node, optimized) {
    if (node.nodeType === Node.DOCUMENT_NODE) {
        return '/';
    }

    const steps = [];
    let contextNode = node;
    while (contextNode) {
        const step = Crawler._xPathValue(contextNode, optimized);
        if (!step) {
            break;
        }  // Error - bail out early.
        steps.push(step);
        if (step.optimized) {
            break;
        }
        contextNode = contextNode.parentNode;
    }

    steps.reverse();
    return (steps.length && steps[0].optimized ? '' : '/') + steps.join('/');
};

/**
 * @param {!SDK.DOMNode} node
 * @param {boolean=} optimized
 * @return {?Crawler.Step}
 */
Crawler._xPathValue = function (node, optimized) {
    let ownValue;
    const ownIndex = Crawler._xPathIndex(node);
    if (ownIndex === -1) {
        return null;
    }  // Error.

    switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            if (optimized && node.getAttribute('id')) {
                return new Crawler.Step('//*[@id="' + node.getAttribute('id') + '"]', true);
            }
            ownValue = node.localName;
            break;
        case Node.ATTRIBUTE_NODE:
            ownValue = '@' + node.nodeName();
            break;
        case Node.TEXT_NODE:
        case Node.CDATA_SECTION_NODE:
            ownValue = 'text()';
            break;
        case Node.PROCESSING_INSTRUCTION_NODE:
            ownValue = 'processing-instruction()';
            break;
        case Node.COMMENT_NODE:
            ownValue = 'comment()';
            break;
        case Node.DOCUMENT_NODE:
            ownValue = '';
            break;
        default:
            ownValue = '';
            break;
    }

    if (ownIndex > 0) {
        ownValue += '[' + ownIndex + ']';
    }

    return new Crawler.Step(ownValue, node.nodeType === Node.DOCUMENT_NODE);
};

/**
 * @param {!SDK.DOMNode} node
 * @return {number}
 */
Crawler._xPathIndex = function (node) {
    // Returns -1 in case of error, 0 if no siblings matching the same expression, <XPath index among the same expression-matching sibling nodes> otherwise.
    function areNodesSimilar(left, right) {
        if (left === right) {
            return true;
        }

        if (left.nodeType === Node.ELEMENT_NODE && right.nodeType === Node.ELEMENT_NODE) {
            return left.localName === right.localName;
        }

        if (left.nodeType === right.nodeType) {
            return true;
        }

        // XPath treats CDATA as text nodes.
        const leftType = left.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : left.nodeType;
        const rightType = right.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : right.nodeType;
        return leftType === rightType;
    }

    const siblings = node.parentNode ? node.parentNode.children : null;
    if (!siblings) {
        return 0;
    }  // Root node - no siblings.
    let hasSameNamedElements;
    for (let i = 0; i < siblings.length; ++i) {
        if (areNodesSimilar(node, siblings[i]) && siblings[i] !== node) {
            hasSameNamedElements = true;
            break;
        }
    }
    if (!hasSameNamedElements) {
        return 0;
    }
    let ownIndex = 1;  // XPath indices start with 1.
    for (let i = 0; i < siblings.length; ++i) {
        if (areNodesSimilar(node, siblings[i])) {
            if (siblings[i] === node) {
                return ownIndex;
            }
            ++ownIndex;
        }
    }
    return -1;  // An error occurred: |node| not found in parent's children.
};

/**
 * @unrestricted
 */
Crawler.Step = class {
    /**
     * @param {string} value
     * @param {boolean} optimized
     */
    constructor(value, optimized) {
        this.value = value;
        this.optimized = optimized || false;
    }

    /**
     * @override
     * @return {string}
     */
    toString() {
        return this.value;
    }
};

Crawler.getPageXY = function (element) {
    var x = 0, y = 0;
    while (element) {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    }
    return [x, y];
}


XPathEvent = {}
XPathEvent.Click = function (event) {
    if (event === undefined) event = window.event;                     // IE hack
    var target = 'target' in event ? event.target : event.srcElement; // another IE hack

    var root = document.compatMode === 'CSS1Compat' ? document.documentElement : document.body;
    var mxy = [event.clientX + root.scrollLeft, event.clientY + root.scrollTop];


    var txy = Crawler.getPageXY(target);
    xpath = Crawler.xPath(target)
    var message = {
        xpath: xpath,
        position: { x: (mxy[0] - txy[0]), y: (mxy[1] - txy[1]) }
    }


    console.log(message)
};
XPathEvent.Mouseover = function (event) {
    if (event === undefined) event = window.event;                     // IE hack
    var target = 'target' in event ? event.target : event.srcElement; // another IE hack

    target.attributeStyleMap.set('opacity', '0.3');
    target.attributeStyleMap.set('border', 'solid');

}
XPathEvent.Mouseout = function (event) {
    if (event === undefined) event = window.event;                     // IE hack
    var target = 'target' in event ? event.target : event.srcElement; // another IE hack
    target.attributeStyleMap.delete('opacity');
    target.attributeStyleMap.delete('border');
}

function Run() {
    document.addEventListener('click', XPathEvent.Click)

    document.addEventListener("mouseover", XPathEvent.Mouseover);

    document.addEventListener("mouseout", XPathEvent.Mouseout);
}

function Stop() {
    document.removeEventListener('click', XPathEvent.Click);

    document.removeEventListener("mouseover", XPathEvent.Mouseover);

    document.removeEventListener("mouseout", XPathEvent.Mouseout);
}



const onMessage = (message) => {

    switch (message.action) {

        case 'run':
            console.log("run");
            Run();
            break;
        case 'stop':
            console.log("stop");
            Stop();
            break;
    }
}

chrome.runtime.onMessage.addListener(onMessage);