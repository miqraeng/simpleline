/*eslint no-console: "off"*/
/*eslint no-trailing-spaces: "off"*/

/* 
The MIT License (MIT)

Copyright (c) 2023 P.M. Kuipers
Copyright (c) 2023 Morglod/jchnkl for parts taken from the typescript @ https://github.com/Morglod/csscalc/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/** Code taken from https://github.com/Morglod/csscalc/*/
// units -> pixels
  const Absolute = {
    /** browser version of pixel */
    px: 1,
    /** One centimeter. 1cm = 96px/2.54 */
    cm: 96 / 2.54,
    /** One millimeter. 1mm = 1/10th of 1cm */
    mm: 96 / 25.4,
    /** One quarter of a millimeter. 1Q = 1/40th of 1cm */
    Q: 96 / 101.6,
    /** One inch. 1in = 2.54cm = 96px */
    in: 96,
    /** One pica. 1pc = 12pt = 1/6th of 1in */
    pc: 96 / 6,
    /** One point. 1pt = 1/72nd of 1in */
    pt: 96 / 72
  };
  
  // units ->(calc context)-> pixels
  const Relative = {
    /**
     * Equal to 1% of the height of the viewport 
     * @param {number} count
     * @param {object} ctx
    */
    vh: (count = 1, ctx) => {
      return ((ctx ? ctx.viewportHeight : window.innerHeight) / 100) * count;
    },
    /**
     * Equal to 1% of the width of the viewport  
     * @param {number} count
     * @param {object} ctx
    */
    vw: (count = 1, ctx) => {
      return ((ctx ? ctx.viewportWidth : window.innerWidth) / 100) * count;
    },
    /**
     * 1/100th of the smallest viewport side  
     * @param {number} count
     * @param {object} ctx
    */
    vmin: (count = 1, ctx) => {
      return (
        ((ctx
          ? Math.min(ctx.viewportWidth, ctx.viewportHeight)
          : Math.min(window.innerWidth, window.innerHeight)) /
          100) *
        count
      );
    },
    /**
     * 1/100th of the largest viewport side  
     * @param {number} count
     * @param {object} ctx
    */
    vmax: (count = 1, ctx) => {
      return (
        ((ctx
          ? Math.max(ctx.viewportWidth, ctx.viewportHeight)
          : Math.max(window.innerWidth, window.innerHeight)) /
          100) *
        count
      );
    },
    /**
     * Represents the font-size of <html> element  
     * @param {number} count
     * @param {object} ctx
    */
    rem: (count = 1, ctx) => {
      return (
        (ctx
          ? ctx.htmlFontSize
          : parseFloat(
              window.getComputedStyle(document.querySelector("html")).fontSize
            )) * count
      );
    },
    /**
     * percent of width  
     * @param {number} count
     * @param {object} ctx
    */
    "%w": (count = 1, ctx) => {
      return ((ctx ? ctx.width : document.body.clientWidth) / 100) * count;
    },
    /**
     * percent of height  
     * @param {number} count
     * @param {object} ctx
    */
    "%h": (count = 1, ctx) => {
      return ((ctx ? ctx.height : document.body.clientHeight) / 100) * count;
    }
  };
  
  const Units = {
    ...Relative,
    ...Absolute
  };
  
  const UnitRegexpStr = `(?:\\s|^)(\\d*(?:\\.\\d+)?)(${Object.keys(
    Units
  ).join("|")})(?:\\s|$|\\n)`;
  const UnitRegexp = new RegExp(UnitRegexpStr);
  const UnitRegexpGM = new RegExp(UnitRegexpStr, "gm");
  
  /**
   * 
   * @param {*} count 
   * @param {*} fromUnits 
   * @param {*} toUnits 
   * @param {*} ctx 
   * @returns 
   */
  function convert(count, fromUnits, toUnits, ctx = calcCtx()) {
    const baseUnit = Units[fromUnits];
    const basePx =
      typeof baseUnit === "function" ? baseUnit(count, ctx) : baseUnit * count;
  
    const dstUnit = Units[toUnits];
    const dstBasePx = typeof dstUnit === "function" ? dstUnit(1, ctx) : dstUnit;
  
    return basePx / dstBasePx;
  }
  
  /**
   * 
   * @param {*} expr 
   * @param {*} toUnits 
   * @param {*} ctx 
   * @returns 
   */
  export function convertAllInStr(expr, toUnits, ctx = calcCtx()) {
    return expr.replace(UnitRegexpGM, (substr, count, unit) => {
      return convert(parseFloat(count), unit, toUnits, ctx).toString();
    });
  }
  
  /**
   * 
   * @param {*} el 
   * @returns 
   */
  function calcCtx(el) {
    if (el) {
      const rect = el.getBoundingClientRect();
  
      return {
        width: rect.width,
        height: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        htmlFontSize: parseFloat(
          window.getComputedStyle(document.querySelector("html")).fontSize
        ),
      };
    } else {
      return {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        htmlFontSize: parseFloat(
          window.getComputedStyle(document.querySelector("html")).fontSize
        )
      };
    }
  }
  
  /**
   * 
   * @param {*} expression 
   * @param {*} el_ctx 
   * @param {*} ctx 
   * @returns 
   */
  function calc(expression, el_ctx, ctx) {
    if (el_ctx === undefined) {ctx = calcCtx(); }
    else {
      if (el_ctx instanceof HTMLElement) {
        if (!ctx) {ctx = calcCtx(el_ctx); }
      } else {
        ctx = el_ctx;
      }
    }
  
    return eval(convertAllInStr(expression, "px", ctx));
  }
  


/** End code taken from  https://github.com/Morglod/csscalc/ */


/**
 * Copies defined properties in to, over from the from object. Does so recursively
 * Used to copy user defined parameters onto a pre-existing object with defaults preset.
 * @param {Object} to The object to copy to
 * @param {Object} from The object tp copy from (but only the properties already named in "to")
 */
const specsCopy = (to, from) => {
    for(const ix in to){
        if(from.hasOwnProperty(ix)){
            if( typeof to[ix] == "object"
                && typeof from[ix] == "object")
            {
                if(Array.isArray(to[ix])){
                    if(Array.isArray(from[ix])){
                        to[ix] = Array.from(from[ix]);
                    } // else, skip...
                } else {
                    specsCopy(to[ix], from[ix]); // recursive copy
                }
            }
            else {
                to[ix] = from[ix];
            }
        }
    }
};

const debounce = (func, delay) => {
    let timer;
    return function(...args) {
        const context = this;
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
};

/**
 * Return the highest common offset parent for two element
 * @param {HTMLElement} one 
 * @param {HTMLElement} two 
 */
function getCommonOffsetParent(one,two){
    const op1 = one.offsetParent?one.offsetParent:document.body;
    const op2 = two.offsetParent?two.offsetParent:document.body;
    if( op1 == op2) {
        return op1;
    } else {
        return getCommonOffsetParent(op1,op2);
    }
}

/**
 * Get the position of an element relative to another
 * @param {HTMLElement} el The element whose position to determine
 * @param {HTMLElement} reference Relative to this element
 * @returns {object} Position object with {x: ..., y:...}
 */
const getElementPosition = (el, reference) => {
    if(!el || !(el instanceof HTMLElement)){
        // Always return 0,0 if the element is invalid
        return {x: 0, y: 0};
    }

    if (!reference || !(reference instanceof HTMLElement)){
        // Take the document body as reference if the reference is invalid
        reference = document.querySelector("body");
    }

    const elSP = getScrollParent(el);
    const elScroll = { x:0, y:0};
    if(elSP.tagName != 'BODY') {  // we do not want to take body scroll into account, that messes things up
        elScroll.x = elSP.scrollLeft;
        elScroll.y = elSP.scrollTop;
    }

    const refSP = getScrollParent(reference);
    const refScroll = { x:0, y:0};
    if(refSP.tagName != 'BODY') { // we do not want to take body scroll into account, that messes things up
        refScroll.x = refSP.scrollLeft;
        refScroll.y = refSP.scrollTop;
    }

    if( el.offsetParent === reference){
        // easily done if the reference element is also the offsetParent..
        return {x: (el.offsetLeft - elScroll.x) - ( 0 - refScroll.x), 
                y: (el.offsetTop - elScroll.y) - (0 - refScroll.y) };
    } else {
        const elR = el.getBoundingClientRect();
        const refR = reference.getBoundingClientRect();


        return {x: (elR.left - elScroll.x) - (refR.left - refScroll.x),
                y: (elR.top  - elScroll.y) - (refR.top - refScroll.y) };
    }
};

/**
 * Get the scroll parent of an element
 * @param {HTMLElement} el The element whose position to determine
 * @returns {HTMLElement|null} Position object with {x: ..., y:...}
 */
function getScrollParent(el){
    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
      return el;
    } else {
      return getScrollParent(el.parentNode);
    }
  }

export class SimpleLine {
    static idCounter = 0;

    /**
     * Create a new line object
     * 
     * @param {HTMLElement|string} start The element the line starts from
     * @param {HTMLElement|string} end The element the line ends at
     * @param {object} config Configuration for the 
     * @returns {SimpleLine} object
     */
    constructor(start, end, config){
        this.svg = null;
        this.id = SimpleLine.idCounter++;

        this.setConfig(config);
        // Validate start element
        if(start instanceof HTMLElement) {
            this.start = start;
        } else if (typeof start === 'string' || this.start instanceof String) {
            this.startSelector = start;
            this.start = document.querySelector(start);
            if(!(this.start instanceof HTMLElement)){
                console.error("Cannot find start element:",start);
                return;
            }
        } else {
            console.error("Start element not string or dom element",start);
            return;
        }

        // Validate end element
        if(end instanceof HTMLElement) {
            this.end = end;
        } else if (typeof end === 'string' || this.end instanceof String) {
            this.endSelector = end;
            this.end = document.querySelector(end);
            if(!(this.end instanceof HTMLElement)){
                console.error("Cannot find end element:",end);
                return;
            }
        } else {
            console.error("End element not string or dom element",start);
            return;
        }

        // create observers for both elements
        this.resizeObserver = new ResizeObserver(debounce(() => {
            this.update();
        },20));
        this.resizeObserver.observe(this.start);
        this.resizeObserver.observe(this.end);

        // Setup the mutationobserver so we can remove the line if it's start or end is removed.
        const self = this;
        this.mutationObserver = new MutationObserver(function(mutations_list) {
            mutations_list.forEach(function(mutation) {
                mutation.removedNodes.forEach(function(removed_node) {
                    if(removed_node == self.start  || removed_node == self.end) {
                        console.warning("Element removed",removed_node);
                        self.remove();
                    }
                });
            });
        });
        
        this.mutationObserver.observe(this.start.parentElement, { subtree: false, childList: true });
        this.mutationObserver.observe(this.end.parentElement, { subtree: false, childList: true });
        

        // Setup the position checker
        this.positionCheck(); // Initialize refresh
        if(this.specs.autorefresh > 0){
            this.refreshTimer = setInterval(()=>{this.positionCheck();},this.specs.autorefresh);
        }
        this.active = true;
        this.update(); // fist draw
    }

    /**
     * Change the simpleline config
     * @param {object} config The object containing the specs 
     */
    setConfig(config){
        // setup defaults
        if(!(this.specs)){
            this.specs = {
                autorefresh: 10,
                class: "",
                color: "", // invalid propery makes it inherit from parent containers
                anchors: {
                    // top, middle, bottom
                    // left, center, right
                    start: ["middle","right"],
                    end: ["middle", "left"],
                },
                gravity: {
                    start: 1,
                    end: 1,
                },
                stroke: "4px",
            };
        }

        if(config && typeof config == "object"){
            specsCopy(this.specs,config);
        }
        if(this.svg){
            // Re-initialize the refresh timer
            clearInterval(this.refreshTimer);
            if(this.specs.autorefresh > 0){
                this.refreshTimer = setInterval(()=>{this.positionCheck();},this.specs.autorefresh);
            }
            // Update the svg image
            this.update();
        }
    }

    /**
     * Get the css class of the line
     */
    get cssClass(){
        return this.specs.class;
    }

    /**
     * Set the css class of the line
     */
    set cssClass(cssClass)
    {
        this.specs.class = cssClass;
        this.update();
    }

    /**
     * Check for an element positino change and update accordingly
     */
    positionCheck(){
        const startSP = getScrollParent(this.start);
        const startScroll = { x:0, y:0};
        if(startSP.tagName != 'BODY') {  // we do not want to take body scroll into account, that messes things up
            startScroll.x = startSP.scrollLeft;
            startScroll.y = startSP.scrollTop;
        }

        const endSP = getScrollParent(this.end);
        const endScroll = { x:0, y:0};
        if(endSP.tagName != 'BODY') {  // we do not want to take body scroll into account, that messes things up
            endScroll.x = endSP.scrollLeft;
            endScroll.y = endSP.scrollTop;
        }

        const startPos  = { x: this.start.offsetLeft - startScroll.x, 
                            y: this.start.offsetTop - startScroll.y};
                            
        const endPos    = { x: this.end.offsetLeft - endScroll.x, 
                            y: this.end.offsetTop - endScroll.y};

        let needUpdate = false;
        if(this.startPos){
            needUpdate = needUpdate || (this.startPos.x != startPos.x || this.startPos.y != startPos.y);
          //console.info("Offset position changed for",this.start);
        }
        this.startPos = startPos;

        if(this.endPos){
            needUpdate = needUpdate || (this.endPos.x != endPos.x || this.endPos.y != endPos.y);
          //console.info("Offset position changed for",this.end);
        }
        this.endPos = endPos;

        if(needUpdate){
            this.update();
        }

    }

    getContainer(){
        // Validate or determine container
        let container = getCommonOffsetParent(this.start,this.end);
        return container;
    }

    getAnchorPoint(anchor){

        let el = this.start;
        if(anchor != "start"){
            anchor = "end";
            el = this.end;
        }

        let x, dirX;
        let y, dirY;
        // determine start coordinates
        if(this.specs.anchors[anchor].includes("left")){
            x = 0;
            dirX = -1;
        } else if (this.specs.anchors[anchor].includes("right")) {
            x = el.offsetWidth -1;
            dirX = 1;
        } else { // center
            x = el.offsetWidth / 2;
            dirX = 0;
        }
        if(this.specs.anchors[anchor].includes("top")){
            y = 0;
            dirY = -1;
        } else if (this.specs.anchors[anchor].includes("bottom")) {
            y = el.offsetHeight -1;
            dirY = 1;
        } else { // middle
            y = el.offsetHeight / 2;
            dirY = 0;
        }

        return { x: x, y: y, dir: {x: dirX, y: dirY}};
    }

    /**
     * Generates the svg defs parts including the marker
     * @returns {Object}
     */
    svgDefs(){
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id",`simpleline-${this.id}-arrow`);
        marker.setAttribute("markerUnits",`strokeWidth`);
        marker.setAttribute("viewBox",`-8 -8 16 16`);
        marker.setAttribute("orient",`auto`);
        marker.setAttribute("markerWidth",`4`);
        marker.setAttribute("markerHeight",`4`);
        defs.appendChild(marker);
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("fill",`currentColor`);
        polygon.setAttribute("points",`-8,-8 8,0 -8,8 -5,0`);
        marker.append(polygon);
        return defs;
    }

    /**
     * (Re)Paint the arrow
     * 
     */
    update(){
        if(!this.active){ return;} // don't do this if we are no longer active

        const container = this.getContainer();
        if (!container) { return; } // Do not create any svg if container is empty

        if(this.svg && (this.svg instanceof SVGElement)){
            if(container !== this.svg.offsetParent){
                // update the svg's parent if the container was changed
                container.appendChild(this.svg);
            }
        } else {
            this.svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            this.svg.setAttribute("id",`simpleline-${this.id}`);
            this.svg.setAttribute("class",`simpleline ${this.specs.class}`);
            this.svg.style.position = "absolute";
            this.svg.style.pointerEvents = 'none';

            container.appendChild(this.svg);
            this.svg.appendChild(this.svgDefs()); // create a new defs element and add it to the svg
            // Add the marker definitions

        }

        // determine proper x, y ,h and w
        const startAnchor = this.getAnchorPoint("start");
        const endAnchor = this.getAnchorPoint("end");

        // make it a little shorter at the end to compensate for the size of the arrow
        const strokeWpx = calc(this.specs.stroke);
        endAnchor.x += endAnchor.dir.x * strokeWpx *1.5;
        endAnchor.y += endAnchor.dir.y * strokeWpx *1.5;

        const elStartPos = getElementPosition(this.start,container);
        const elEndPos = getElementPosition(this.end,container);

      //console.info("startAnchor",startAnchor);
      //console.info("endAnchor",endAnchor);
      //console.info("elStartPos",elStartPos);
      //console.info("elEndPos",elEndPos);

        // Determine basic h/w between start and end anchor to help determine desired control point length
        const w = Math.max(elStartPos.x + startAnchor.x,elEndPos.x + endAnchor.x)
                - Math.min(elStartPos.x + startAnchor.x,elEndPos.x + endAnchor.x);
        const h = Math.max(elStartPos.y + startAnchor.y,elEndPos.y + endAnchor.y)
                - Math.min(elStartPos.y + startAnchor.y,elEndPos.y + endAnchor.y);
        const weight = Math.sqrt(h*h+w*w)/2;
        // Determine start positions and end positions relative to container
        const cStartPos = {
            x: elStartPos.x + startAnchor.x,
            y: elStartPos.y + startAnchor.y,
            dirx: elStartPos.x + startAnchor.x + startAnchor.dir.x * this.specs.gravity.start * weight,
            diry: elStartPos.y + startAnchor.y + startAnchor.dir.y * this.specs.gravity.start * weight,
        };

        const cEndPos = {
            x: elEndPos.x + endAnchor.x,
            y: elEndPos.y + endAnchor.y,
            dirx: elEndPos.x + endAnchor.x + endAnchor.dir.x * this.specs.gravity.end * weight,
            diry: elEndPos.y + endAnchor.y + endAnchor.dir.y * this.specs.gravity.end * weight,
        };

        // determine the bounding rectangle of the
      //console.info("cStartPos",cStartPos);
      //console.info("cEndPos",cEndPos);

        const margin = (!isNaN(this.specs.stroke)?5*this.specs.stroke:25);
        const bounds = {
            x: Math.min(cStartPos.x,cEndPos.x,cStartPos.dirx,cEndPos.dirx) - margin,
            y: Math.min(cStartPos.y,cEndPos.y,cStartPos.diry,cEndPos.diry) - margin,
            w: Math.max(cStartPos.x,cEndPos.x,cStartPos.dirx,cEndPos.dirx)
                - Math.min(cStartPos.x,cEndPos.x,cStartPos.dirx,cEndPos.dirx) + 2*margin,
            h: Math.max(cStartPos.y,cEndPos.y,cStartPos.diry,cEndPos.diry)
                - Math.min(cStartPos.y,cEndPos.y,cStartPos.diry,cEndPos.diry) + 2*margin,
        };

        // Now convert the coordinates to the svg space
        const startPos = {
            x: cStartPos.x - bounds.x,
            y: cStartPos.y - bounds.y,
            dirx: cStartPos.dirx - bounds.x,
            diry: cStartPos.diry - bounds.y,
        };
        const endPos = {
            x: cEndPos.x - bounds.x,
            y: cEndPos.y - bounds.y,
            dirx: cEndPos.dirx - bounds.x,
            diry: cEndPos.diry - bounds.y,
        };

      //console.info("Bounds",bounds);
      //console.info("startPos",startPos);
      //console.info("endPos",endPos);
        // Update the svg attributes
        this.svg.setAttribute("viewBox",`0 0 ${bounds.w}, ${bounds.h}`);
        this.svg.setAttribute("width",`${bounds.w}px`);
        this.svg.setAttribute("height",`${bounds.h}px`);
        this.svg.style.color = this.specs.color;

        // Reposition the SVG relative to the container
        this.svg.style.left = `${bounds.x}px`;
        this.svg.style.top  = `${bounds.y}px`;
        this.svg.style.width = `${bounds.w}px`;
        this.svg.style.height = `${bounds.h}px`;


        // Draw the line
        if(!this.line){
            this.line = document.createElementNS("http://www.w3.org/2000/svg", "path");
            this.line.setAttribute("marker-end",`url(#simpleline-${this.id}-arrow)`);
            this.svg.appendChild(this.line);
        }
        let strokeWidth = this.specs.stroke;
        if(!isNaN(strokeWidth) && strokeWidth != 0){
            strokeWidth = `${strokeWidth}px`;
        }
        this.line.style.stroke = "currentColor";
        this.line.style.fill = "none";
        this.line.style.strokeWidth= strokeWidth;
        this.line.setAttribute('d',
            `M ${startPos.x} ${startPos.y}
             C ${startPos.dirx} ${startPos.diry}, ${endPos.dirx} ${endPos.diry}, ${endPos.x} ${endPos.y}`);
    }

    /**
     * Remove the line element from the dom and invalidate it.
     */
    remove(){
        // remove the line
        this.svg.remove();
        this.svg = null;
        this.line = null;

        // clear the refresh timer
        clearInterval(this.refreshTimer);
        // stop the observers
        this.resizeObserver.disconnect();
        this.mutationObserver.disconnect();
        this.active = false;
    }
}
