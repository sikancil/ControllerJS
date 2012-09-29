/**
 * Created with JetBrains WebStorm.
 * User: brian
 * Date: 9/29/12
 * Time: 2:39 PM
 * To change this template use File | Settings | File Templates.
 */


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
        "use strict";
        return ( string.slice( string.length - 1) === '*' );
    },
    /**
     *
     * @param string
     * @return {*|Blob}
     */
    removeAsteriskEnd: function ( string ) {
        "use strict";
        if ( this.asteriskEnd( string ) ) {
            return string.slice( 0, string.length - 1 );
        } else {
            return false;
        }
    }
});

var PubSub = Class(function () {
    "use strict";
    /**
     *
     * @param string {String}
     * @return {*}
     */
    var parseChannel = function ( string ) {
        if ( string.length ) {
            if( Utils.asteriskEnd( string ) ) {
                return Utils.removeAsteriskEnd( string );
            }
        }
    };
    return {
        main: function () {
            this.modules = []; // Subscribers
            this.channels = {}; // channels by name includes info;
            this.channelsList = [];
            this.subscriptions = {}; // every module has a list of the subscriptions/regexs
        },
        $singleton: true,
        $statics: {
            /**
             *
             * @param fn {Function}
             */
            async: function ( fn ) {
                setTimeout(function() { fn(); }, 0 );
            },
            /**
             *
             * @param channel {String}
             * @return {Boolean}
             */
            hasSubscribers: function (channel) {
                return ( (this.channels[channel].subscribers).length > 0 );
            }
        },
        /**
         *
         * @param channel {String}
         *
         * @goal creates a new channel as well as any subchannels
         *
         */
        createChannel: function ( channel ) {
            if ( this.channels[ channel ] ) {
                return this;
            } else {
                this.channels[ channel ] = new Channel( channel, true );
                this.channelsList.push( channel );

                var len = this.channels[ channel ].subChannels.length,
                    i = 0;
                for ( i = 0; i < len; i++ ) {
                    if ( !this.channels[ this.channels[ channel ].subChannels[i] ] ) {
                        this.channels[ this.channels[ channel ].subChannels[i]] = new Channel( this.channels[ channel ].subChannels[i],  false );
                        this.channelsList.push( this.channels[ channel ].subChannels[i] );
                    }
                }
                return this;
            }
        },
        /**
         *
         * @param channel {String}
         * @param data {JSON/Object}
         */
        deliver: function( channel, data ) {
            var len = this.channels[ channel ].subscribers.length, i = 0;

            for ( i = 0; i < len; i++ ) {
                if ( this.channels[ channel ].subscribers[i] ) {
                    this.channels[ channel ].subscribers[i].callback( data );
                }
            }
        },
        /**
         *
         * @param channel {String}
         * @param data {JSON/Object}
         */
        publish: function ( channel, data ) {
            var theChannel = this.channels[ channel ];
            if ( theChannel.subscribers.length ) {
                var len = theChannel.subscribers.length, i;

                for ( i = 0; i < len; i++ ) {
                    if ( theChannel.subscribers[i] ) {
                        theChannel.subscribers[i].callback( data );
                    }
                }
                if ( theChannel.subChannels.length ) {
                    len = theChannel.subChannels.length;
                    for ( i = 0; i < len; i++ ) {
                        this.deliver( theChannel.subChannels[i], data );
                    }
                }
            }
        },
        /**
         *
         * @param channel {String}
         * @param cb {Function}
         * @return {Number}
         */
        subscribe: function ( channel, cb ) {
            var theChannel = this.channels[ channel ];
            if( Utils.asteriskEnd( channel ) ) {
                channel = parseChannel( channel );
            }

            if( !theChannel ) {
                return null;
            }

            if ( theChannel.subscribers ) {
                theChannel.subscribers.push({ callback: cb });

                return theChannel.subscribers.length - 1;
            } else {
                return null;
            }
        },
        /**
         *
         * @param channel {String}
         * @param id {Integer}
         * @return {Number}
         */
        unsubscribe: function ( channel, id ) {
            var theChannel = this.channels[ channel ];
            if ( theChannel.subscribers[id] ) {
                theChannel.subscribers[ id ] = null;

                return this;
            } else {
                return this;
            }
        }
    };
});
/**
 *
 * @type {Class}
 */
var Channel = Class({
    constructor: function ( channel, original ) {
        "use strict";
        this.channel = channel;
        this.original = original;
        this.subscribers = [];
        this.splitter = ':';
        if( this.original ) {
            this.subChannels = [];
            this.parseTopics();
        }
    },
    /**
     *
     * @return {Boolean}
     */
    deleteChannel: function () {
        "use strict";
        this.channel = null;
        this.original = null;
        this.subscribers = null;
        this.splitter = null;
        this.subChannels = null;
        this.parseTopics = null;
        this.clearSubs = null;
        this.changeChannel = null;
        return true;
    },
    /**
     * @goal Clear current Subscriptions
     */
    clearSubs: function () {
        "use strict";
        this.subscribers = [];
    },
    /**
     *
     * @param channel
     */
    changeChannel: function ( channel ) {
        "use strict";
        PubSub.publish( 'pubsub:channels:changeChannel', { prev: this.channel, next: channel }, true );

        this.channel = channel;
    },
    /**
     * @goal parse the topics within the channels name such that even the partial subs will recieve the
     * channel's messages as expected.
     */
    parseTopics: function () {
        "use strict";
        var colonIdx = this.channel.indexOf(':'),
            dotIdx = this.channel.indexOf('.');

        if( colonIdx > -1 ) {
            this.splitter = ':';
        } else if( dotIdx > -1 ) {
            this.splitter = '.';
        }

        var channelArr = this.channel.split(this.splitter);
        var len = channelArr.length,
            str = '', i = 0, x = 0;

        for ( i = 0; i < ( len - 1 ); i++ ) {
            str = '';
            for ( x = 0; x <= i; x++ ) {

                if (x === 0) {
                    str = channelArr[x];
                } else {
                    str = str + this.splitter + channelArr[x];
                }
            }
            this.subChannels.push(str);
        }
    }
});
