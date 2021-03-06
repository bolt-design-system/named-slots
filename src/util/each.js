const { DocumentFragment } = window;

export function eachChildNode (node, func) {
  if (!node) {
    return;
  }

  const chs = node.childNodes;
  const chsLen = chs.length;
  for (let a = 0; a < chsLen; a++) {
    const ret = func(chs[a], a, chs);
    if (typeof ret !== 'undefined') {
      return ret; // eslint-disable-line consistent-return
    }
  }
}

// Re-implemented to avoid Array.prototype.slice.call for performance reasons
function reverse (arr) {
  const reversedArray = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    reversedArray.push(arr[i]);
  }
  return reversedArray;
}

/**
 * Execute func over all child nodes or a document fragment, or a single node
 * @param node the node or document fragment
 * @param func a function to execute on node or the children of node, if node is a document fragment.
 *        func may optionally append the node elsewhere, in the case of a document fragment
 */
export function eachNodeOrFragmentNodes (node, func) {
  if (node instanceof DocumentFragment) {
    const chs = node.childNodes;
    const chsLen = chs.length;

    // We must iterate in reverse to handle the case where child nodes are moved elsewhere during execution
    for (let a = chsLen - 1; a >= 0; a--) {
      const thisNode = reverse(node.childNodes)[a];
      func(thisNode, a);
    }
  } else {
    func(node, 0);
  }
}
