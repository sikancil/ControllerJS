
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
/**
 * @Class State
 *
 * A state for a method, which has a name and 2 callbacks which are used to help
 * ease the work done by pubsub workers
 * a random underscore like toolkit
 *
 */
var State = Class({
    /**
     *
     * @param state {String}
     * @param cb1 {Function}
     * @param cb2 {Function}
     */
    constructor: function ( state, cb1, cb2 ) {
        "use strict";
        this.state = state;
        if( cb1 ) {
            this.initCallback = cb1;
        }
        if( cb2 ) {
            this.endCallback = cb2;
        }
    },
    deleteInitCB: function () {
        "use strict";
        this.initCallback = null;
    },
    deleteEndCB: function () {
        "use strict";
        this.endCallback = null;
    },
    setInitCB: function ( newCallback ) {
        "use strict";
        this.initCallback = newCallback;
    },
    setEndCB: function ( newCallback ) {
        "use strict";
        this.endCallback = newCallback;
    },
    /**
     *
     * @param newName
     *
     * @goal changes the name of the state to correct typos etc without losing subscribers
     */
    changeName: function ( newName ) {
        "use strict";
        this.state = newName;
    }
});
/**
 *
 * @type StateMachine {Class}
 *
 * @goal Manages the App and Modules States and the callbacks assoiated with them easier to manage
 * and also furthers the abstraction of the application as a whole.
 */
var StateMachine = Class({
    $singleton: true,
    /**
     * @goal initiate the state machine
     */
    main: function () {
        "use strict";
        // Will be used by other functions to help them determine what they might do
        this.appState = 'default';
        // The available states for the app as well as their callbacks
        this.appStates = {};
        this.modules = {};
        this.moduleList = [];

    },
    /**
     *
     * @param module {String}
     * @param states {Array}
     * @param currState {String}
     * @return {Boolean}
     */
    registerModule: function ( module, states, currState ) {
        "use strict";
        if( !this.modules[ module ] ) {
            this.modules[ module ] = {};
            this.modules[ module ].name = module;
            this.modules[ module ].states = {};
            if( currState ) {
                this.modules[ module ].state = currState;
            }

            var len = states.length,
                i = 0;
            for ( i = 0; i < len; i++ ) {
                this.createState( module, states[i].state, states[i].initCB, states[i].endCB );
            }


            return true;
        } else {
            return false;
        }
    },
    /**
     *
     * @param module
     * @param state
     * @param cb1
     * @param cb2
     * @return {Boolean}
     */
    createState: function ( module, state, cb1, cb2 ) {
        "use strict";
        if( !this.modules[ module ].states[ state ] ) {
            this.modules[ module ].states[ state ] = new State( state, cb1, cb2 );
            return true;
        } else {
            return false;
        }
    },
    /**
     *
     * @param module
     */
    deleteModule: function ( module ) {
        "use strict";
        if( this.modules[ module ] ) {
            delete this.modules[ module ];
        }
    },
    getState: function ( module ) {
        return this.modules[ module ].state;
    },
    /**
     *
     * @param module {String}
     * @param newState {String}
     * @param data {Object}/{JSON}
     *
     * @goal Change the state of the module as well as
     */
    changeState: function ( module, newState, data ) {
        "use strict";
        var oldState = this.modules[ module ].state;
        if ( this.modules[ module ].states[ oldState ] ) {
            if( this.modules[ module ].states[ oldState ].endCallback ) {
                if( data ) {
                    this.modules[ module ].states[ oldState ].endCallback( data );
                } else {
                    this.modules[ module ].states[ oldState ].endCallback();
                }
            }
        }

        this.modules[ module ].state = newState;
        if ( this.modules[ module ].states[ newState ] ) {
            if( this.modules[ module ].states[ newState ].initCallback ) {
                if( data ) {
                    this.modules[ module ].states[ newState ].initCallback( data );
                } else {
                    this.modules[ module ].states[ newState ].initCallback();
                }
            }
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
            if( Utils.asteriskEnd( channel ) ) {
                channel = parseChannel( channel );
            }
            
            if( !this.channels[ channel ] ) {
                return null;
            }
            
            if ( this.channels[ channel ].subscribers ) {
                this.channels[ channel ].subscribers.push({ callback: cb });

                return this.channels[ channel ].subscribers.length - 1;
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
            if ( this.channels[ channel ].subscribers[id] ) {
                this.channels[ channel ].subscribers[ id ] = 0;

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
/**
 * @Class Cluster
 *
 * Cluster for workers of all types to be grouped and load balanced.
 *
 * @type {*}
 */

    /*
var Cluster = Class({
    $singleton: true,
    main: function () {
        "use strict";
        this.group = {};
        this.groupList = [];
        this.files = [];
    },
    createGroup: function ( group, file, numOfWorkers, callback ) {
        "use strict";
        this.group[ group ] = {
            name: group,
            file: file,
            numOfWorkers: numOfWorkers,
            callback: callback,
            workers: [],
            que: []
        };
        for ( var i = 0; i < numOfWorkers; i++ ) {
            this.group[ group ].workers.push(new ClusterWorker( group, file, i ));
        }
    },
    deleteGroup: function ( group ) {
        "use strict";
        delete this.group[ group ];
        delete true;
    },
    newTask: function ( group, data ) {
        "use strict";
        var that = this;
       var workers = this.group[ group ].workers;

        var len = workers.length,
            i = 0;
        for ( i = 0; i < len; i++ ) {
            if ( workers[i].status === 'busy' ) {
                if ( i === ( len - 1 ) ) {
                    // Continue trying to find a worker
                    // could create a que class that waits for a message back from group x, workerId y and fills the
                    // slot but it may be best to use the que's exsistence as a reason to spawn more workers
                    this.queTask( group, data );
                }
            } else if ( workers[i].status === 'ready' ) {
                workers[i].status = 'busy';
                workers[i].postMessage( { data: data } );

                workers[i].addEventListener( 'message', function( e ) {
                    "use strict";
                    if ( this.status === 'busy' && e.data.status === 'done' ) {
                        this.status = 'ready';
                    }
                    that.group[ group ].callback( e.data );

                    if ( that.group[ group ].que.length ) {
                        this.status = 'busy';
                        this.postMessage( that.group[ group ].que[ 0 ].data );
                    }
                }, false );
            }
        }
    },
    queTask: function( group, data ) {
        "use strict";
        this.group[ group ].que.push({ data: data });
    }
});

var ClusterWorker = Class({
    constructor: function( group, file, i ) {
        "use strict";
        var worker = new Worker( file );
        worker.status = 'ready';
        worker.group = group;
        worker.id = i;
        worker.file = file;
    }
});

*/