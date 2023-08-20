/*eslint no-trailing-spaces: "off"*/
/*eslint no-eval: "off"*/

/***********************************
 * Licence: MIT
 * (c) 2023  Morglod/jchnkl
 * converted from the typescript @ https://github.com/Morglod/csscalc/
 */

// units -> pixels
export const Absolute = {
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
  export const Relative = {
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
  
  export const Units = {
    ...Relative,
    ...Absolute
  };
  
  export const UnitRegexpStr = `(?:\\s|^)(\\d*(?:\\.\\d+)?)(${Object.keys(
    Units
  ).join("|")})(?:\\s|$|\\n)`;
  export const UnitRegexp = new RegExp(UnitRegexpStr);
  export const UnitRegexpGM = new RegExp(UnitRegexpStr, "gm");
  
  /**
   * 
   * @param {*} count 
   * @param {*} fromUnits 
   * @param {*} toUnits 
   * @param {*} ctx 
   * @returns 
   */
  export function convert(count, fromUnits, toUnits, ctx = calcCtx()) {
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
  export function calcCtx(el) {
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
  export function calc(expression, el_ctx, ctx) {
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
  