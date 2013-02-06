/**
 * @Class Utils
 *
 * Methods for data manipulation etc that don't belong in any other object,
 * a random underscore like toolkit
 *
 * @type {*}
 */
var Utils = Class({
    $singleton: true,
    noop: function() {},
    /**
     *
     * @param string
     * @return {Boolean}
     */
    asteriskEnd: function ( string ) {
        return ( string.slice( string.length - 1) === '*' );
    },
    /**
     *
     * @param string
     * @return {String/Boolean}
     */
    removeAsteriskEnd: function ( string ) {
        if ( this.asteriskEnd( string ) ) {
            return string.slice( 0, string.length - 1 );
        } else {
            return false;
        }
    }
});
