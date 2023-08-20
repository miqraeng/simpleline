/*eslint no-console: "off"*/
/*eslint no-trailing-spaces: "off"*/

/* 
The MIT License (MIT)

Copyright (c) 2023 P.M. Kuipers

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

import {calc} from "./css-calc";


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
        // Take the document body as reference if the reference is invalud
        reference = document.querySelector("body");
    }

    if( el.offsetParent === reference){
        // easily done if the reference element is also the offsetParent..
        return {x: el.offsetLeft, y: el.offsetTop};
    } else {
        const elR = el.getBoundingClientRect();
        const refR = reference.getBoundingClientRect();

        return {x: elR.left - refR.left,
                y: elR.top - refR.top};
    }
};

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
        this.mutationObserver = new MutationObserver(function(mutations_list) {
            mutations_list.forEach(function(mutation) {
                mutation.removedNodes.forEach(function(removed_node) {
                    if(removed_node == this.start  || removed_node == this.end) {
                        console.warning("Element removed",removed_node);
                        this.remove();
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
        const startPos = {x: this.start.offsetLeft, y: this.start.offsetTop};
        const endPos = {x: this.end.offsetLeft, y: this.end.offsetTop};

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
        let container = this.start.offsetParent;
        if(!container) {
            if(getComputedStyle(this.start).position == "fixed"){
                container = document.querySelector("body");
            } else {
                console.error("Start element has no offsetParent. likely ");
            }
        }
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
