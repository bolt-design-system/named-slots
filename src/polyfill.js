import mapPolyfilled from './internal/map-polyfilled';
import prop from './internal/prop';


// Helpers.

function applyParentNode (node, parent) {
  prop(node, 'parentElement', {
    configurable: true,
    get () {
      return parent.nodeType === 1 ? parent : null;
    }
  });

  prop(node, 'parentNode', {
    configurable: true,
    get () {
      return parent;
    }
  });

  prop(node, 'nextSibling', {
    configurable: true,
    get () {
      let index;
      const parChs = parent.childNodes;
      const parChsLen = parChs.length;
      for (let a = 0; a < parChsLen; a++) {
        if (parChs[a] === node) {
          index = a;
          continue;
        }
      }
      return typeof index === 'number' ? parChs[index + 1] : null;
    }
  });

  prop(node, 'nextElementSibling', {
    configurable: true,
    get () {
      let next;
      while ((next = this.nextSibling)) {
        if (next.nodeType === 1) {
          return next;
        }
      }
      return null;
    }
  });

  prop(node, 'previousSibling', {
    configurable: true,
    get () {
      let index;
      const parChs = parent.childNodes;
      const parChsLen = parChs.length;
      for (let a = 0; a < parChsLen; a++) {
        if (parChs[a] === node) {
          index = a;
          continue;
        }
      }
      return typeof index === 'number' ? parChs[index - 1] : null;
    }
  });

  prop(node, 'previousElementSibling', {
    configurable: true,
    get () {
      let prev;
      while ((prev = this.previousSibling)) {
        if (prev.nodeType === 1) {
          return prev;
        }
      }
      return null;
    }
  });
}

function removeParentNode (node) {
  prop(node, 'parentNode', {
    configurable: true,
    get: function () {
      return null;
    }
  });
}

function arrayItem (idx) {
  return this[idx];
}

function doForNodesIfSlot (elem, node, func) {
  nodeToArray(node).forEach(function (node) {
    const slot = getSlot(elem, node);
    if (slot) {
      func(elem, node, slot);
    }
  });
}

function getSlot (elem, node) {
  if (!node) {
    return;
  }

  const name = node.getAttribute && node.getAttribute('slot') || 'content';

  if (!elem.__slots) {
    elem.__slots = {};
  }

  const slots = elem.__slots;

  if (typeof slots[name] === 'undefined') {
    const slot = elem.querySelector(`[slot-name="${elem.__shadowId || ''}${name === 'content' ? '' : name}"]`);
    if (slot) {
      slots[name] = slot;
    }
  }

  if (slots[name]) {
    return slots[name];
  }
}

function makeLikeNodeList (arr) {
  arr.item = arrayItem;
  return arr;
}

function nodeToArray (node) {
  return node instanceof DocumentFragment ? toArray(node.childNodes) : [node];
}

function toArray (obj) {
  return Array.prototype.slice.call(obj);
}


// Prop overrides.

const props = {
  childElementCount: {
    get () {
      return this.children.length;
    }
  },
  childNodes: {
    get () {
      let nodes = [];
      const slots = this.__slots;
      if (slots) {
        for (let name in slots) {
          const slot = slots[name];
          const childNodes = slot.childNodes;
          const childNodesLen = childNodes.length;
          for (let a = 0; a < childNodesLen; a++) {
            nodes.push(childNodes[a]);
          }
        }
      }
      return makeLikeNodeList(nodes);
    }
  },
  children: {
    get () {
      return makeLikeNodeList(this.childNodes.filter(node => node.nodeType === 1));
    }
  },
  firstChild: {
    get () {
      return this.childNodes[0] || null;
    }
  },
  firstElementChild: {
    get () {
      return this.children[0] || null;
    }
  },
  innerHTML: {
    get () {
      return this.childNodes.map(node => node.outerHTML || node.textContent).join('');
    },
    set (val) {
      const div = document.createElement('div');
      const frag = document.createDocumentFragment();

      // TODO: This may not be foolproof with incompatible child nodes.
      div.innerHTML = val;

      // Ensure existing nodes are cleaned up properly.
      while (this.hasChildNodes()) {
        this.removeChild(this.firstChild);
      }

      // Ensures new nodes are set up properly.
      while (div.hasChildNodes()) {
        frag.appendChild(div.firstChild);
      }

      this.appendChild(frag);
    }
  },
  lastChild: {
    get () {
      const ch = this.childNodes;
      return ch[ch.length - 1] || null;
    }
  },
  lastElementChild: {
    get () {
      const ch = this.children;
      return ch[ch.length - 1] || null;
    }
  },
  outerHTML: {
    get () {
      const name = this.tagName.toLowerCase();
      const attributes = toArray(this.attributes).map(function (attr) {
        return ` ${attr.name}${attr.value ? `="${attr.value}"` : ''}`;
      }).join('');
      return `<${name}${attributes}>${this.innerHTML}</${name}>`;
    }
  },
  textContent: {
    get () {
      return this.childNodes.map(node => node.textContent).join('');
    },
    set (val) {
      // Ensure existing nodes are cleaned up properly.
      while (this.hasChildNodes()) {
        this.removeChild(this.firstChild);
      }

      doForNodesIfSlot(this, val.toString(), function (elem, node, slot) {
        slot.textContent = node;
      });
    }
  }
};


// Method overrides.

const funcs = {
  appendChild (newNode) {
    doForNodesIfSlot(this, newNode, function (elem, node, slot) {
      slot.appendChild(node);
      applyParentNode(node, elem);
    });
    return newNode;
  },
  hasChildNodes () {
    return this.childNodes.length > 0;
  },
  insertBefore (newNode, refNode) {
    doForNodesIfSlot(this, newNode, function (elem, node, slot) {
      slot.insertBefore(node, refNode);
      applyParentNode(node, elem);
    });
    return newNode;
  },
  removeChild (refNode) {
    doForNodesIfSlot(this, refNode, function (elem, node, slot) {
      slot.removeChild(node);
      removeParentNode(node);
    });
    return refNode;
  },
  replaceChild (newNode, refNode) {
    doForNodesIfSlot(this, newNode, function (elem, node, slot) {
      slot.replaceChild(node, refNode);
      applyParentNode(node, elem);
    });
    removeParentNode(refNode);
    return refNode;
  }
};


// Polyfills an element.
export default function (elem) {
  if (mapPolyfilled.get(elem)) {
    return;
  }

  // Polyfill properties.
  for (let name in props) {
    prop(elem, name, props[name]);
  }

  // Polyfill methods.
  for (let name in funcs) {
    elem[name] = funcs[name];
  }

  mapPolyfilled.set(elem, true);
  return elem;
}
