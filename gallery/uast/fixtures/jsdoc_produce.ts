/**
 * The current Immer draft from produce is always a proxy.
 * @param {Object} base
 * @param {Function} recipe
 * @param {Object} [patchListener]
 * @returns {Object}
 */
function produce(base, recipe, patchListener) {
    return base
}

/**
@class
@classdesc has a chainable method
*/
class Chainable {
    /**
     returns itself
     @chainable
     */
    method() {
        return this
    }
}
