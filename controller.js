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


var ActionStack = new Class({
    constructor: function(defaultAction, pairedAction) {
        this.stack = [];
        this.channels = {};

        if(typeof defaultAction === 'function')
            this.defaultAction = defaultAction;
        else
            this.defaultAction = undefined;

        if(typeof pairedAction === 'function')
            this.pairedAction = pairedAction;
        else
            this.pairedAction = undefined;
    },
    addToStack: function(data) {
        if (typeof data.event === 'function' || typeof data.event === 'string') {

            var id = this.stack.length;
            this.stack.push({ id: id, event: data.event, data: data.data, context: data.context });
            return id;
        } else {
            return -1;
        }
    },
    removeFromStack: function(stackId) {
        if (this.stack[stackId] && this.stack[stackId].id === stackId) {
            this.stack[stackId] = null;
            return stackId;
        } else {
            return false;
        }
    },
    startStack: function() {
        this.executeStack();
    },
    setDefaultAction: function(newDefaultAction) {
        this.defaultAction = newDefaultAction;
    },
    setPairedAction: function(newPairedAction) {
        this.pairedAction = newPairedAction;
    },
    clearStack: function(returnStack) {
        if (!returnStack)
            returnStack = false;

        if (returnStack === true && returnStack === false)
            return;

        if(this.stack.length === 0) {
            if (returnStack === true)
                return this.stack;
            else if (returnStack === false)
                return;
        }

        var oldStack = this.stack;
        this.stack = [];

        if (returnStack === true)
            return this.stack;
    },
    runStack: function(stackId) {
        var event = this.stack[stackId].event,
            success = 0;

        if (typeof event === "string") {

            if(!this.stack[stackId].context) {
                PubSub.publish(event, this.stack[stackId].data);
                success = this.removeFromStack(stackId);

                if (this.pairedAction)
                    this.pairedAction.call(this.stack[stackId].context, this.stack[stackId].data);
            }
        } else if(typeof event === "function") {

            if (this.stack[stackId].context) {
                event.call(this.stack[stackId].context, this.stack[stackId].data);

                if (this.pairedAction)
                    this.pairedAction.call(this.stack[stackId].context, this.stack[stackId].data);
            } else {
                event(this.stack[stackId].data);

                if (this.pairedAction)
                    this.pairedAction(this.stack[stackId].data);
            }

            success = this.removeFromStack(stackId);
        } else {
            return false;
        }

        if(success === stackId) {
            return stackId;
        }
    },
    executeStack: function(stackId) {
        switch(true) {
            case (stackId > 0):
                if (this.stack[stackId]) {
                    return this.runStack(stackId);
                } else {
                    this.executeStack(stackId - 1);
                }
                break;
            case (stackId === 0 || stackId === -1):
                if (this.stack[0]) {
                    return this.runStack(stackId);
                } else {
                    if (this.defaultAction)
                        this.defaultAction();
                    return;
                }
                break;
            case (stackId === -1):
                var nullArr = true, i = this.stack.length - 1;
                for (; i > -1; i--) {
                    if (this.stack[i]) {
                        nullArr = false;
                        break;
                    }
                }
                if(i + 1 === 0 || nullArr === true) {
                    if (this.defaultAction)
                        this.defaultAction();
                }

                return false;
                break;

            case (!stackId && stackId !== 0):
                var start = this.stack.length - 1;
                if(start !== 0 && !start) {
                    start = -1;
                }

                this.executeStack(start);
                break;
        }
    },
    opened: function(chan, func, data, context) {
        if(this.channels && this.channels[chan] && this.stack[this.channels[chan]]) {
            this.removeFromStack(this.channels[chan]);
        }

        this.channels[chan] = this.addToStack({ event: func, data: data, context: context });
        return this.channels[chan];
    },
    close: function(chan) {
        if(this.channels && this.channels[chan] > -1) {
            this.executeStack(this.channels[chan]);
            this.channels[chan] = -1;
        }
    },
    closed: function(chan) {
        if(this.channels && this.channels[chan] > -1) {
            this.removeFromStack(this.channels[chan]);
            this.channels[chan] = -1;
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
var State = new Class({
    /**
     * @param state {String}
     * @param cb1 {Function}
     * @param cb2 {Function}
     **/
    constructor: function ( state, cb1, cb2 ) {
        this.state = state;
        this.secondState = '';
        if( cb1 ) {
            this.initCallback = cb1;
        }
        if( cb2 ) {
            this.endCallback = cb2;
        }
    },
    deleteInitCB: function () {
        this.initCallback = null;
    },
    deleteEndCB: function () {
        this.endCallback = null;
    },
    setInitCB: function ( newCallback ) {
            this.initCallback = newCallback;
        },
        setEndCB: function ( newCallback ) {
            this.endCallback = newCallback;
        },
        /**
         * @param newName
         * @goal changes the name of the state to correct typos etc without losing subscribers
         **/
        changeName: function ( newName ) {
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
    main: function () {
        this.modules = {};
        this.escapeStack = new ActionStack(function() {
            StateMachine.escapeStack.stack = [];

            var focusedInput = $('input:focus, select:focus, textarea:focus');
            if(focusedInput.length === 1) {

                focusedInput.first().trigger('blur');

            } else if (focusedInput.length > 1) {

                focusedInput.each(function(idx, el) {
                    el.trigger('blur');
                });

            }

            $('body').trigger('click');
        });
    },
    /**
     * @param module {String}
     * @param states {Array}
     * @param currState {String}
     * @return {Boolean}
     **/
    registerModule: function ( module, states, currState ) {
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
     * @param module
     * @param state
     * @param cb1
     * @param cb2
     * @return {Boolean}
     */
    createState: function ( module, state, cb1, cb2 ) {
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
    },
    getSecondState: function ( module ) {
        return this.modules[ module ].secondState;
    },
    setSecondState: function ( module, newState, data ) {
        if ( this.modules[module].secondState === '' ) {
            this.modules[module].secondState = newState;
            if( this.modules[module].states[newState] ) {
                this.modules[module].states[newState].initCallback( data );
            }
        } else {
            var currState = this.modules[module].secondState;

            if( this.modules[module].states[currState] ) {
                // Ending Callback
                this.modules[module].states[currState].endCallback( data );

                // Change State AND Init Callback if available
                this.modules[module].secondState = newState;
                if( this.modules[module].states[newState] ) {
                    this.modules[module].states[newState].initCallback( data );
                }
            }
        }
    }
});

var PubSub = Class(function () {
    /**
     ** @param string {String}
     ** @return {*}
     **/
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
             ** @param fn {Function}
             **/
            async: function ( fn ) {
                setTimeout(function() { fn(); }, 0 );
            },
            /**
             ** @param channel {String}
             ** @return {Boolean}
             **/
            hasSubscribers: function (channel) {
                return ( (this.channels[channel].subscribers).length > 0 );
            }
        },
        /**
         ** @param channel {String}
         ** @goal creates a new channel as well as any subchannels
         **/
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
         ** @param channel {String}
         ** @param data {JSON/Object}
         **/
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
            if( !this.channels[ channel ] || !this.channels[ channel ].subscribers ) {
                return;
            }

            if ( this.channels[ channel ].subscribers.length ) {
                var len = this.channels[ channel ].subscribers.length, i;

                for ( i = 0; i < len; i++ ) {
                    if ( this.channels[ channel ].subscribers[i] ) {
                        this.channels[ channel ].subscribers[i].callback( data );
                    }
                }
                if ( this.channels[ channel ].subChannels.length ) {
                    len = this.channels[ channel ].subChannels.length;
                    for ( i = 0; i < len; i++ ) {
                        this.deliver( this.channels[ channel ].subChannels[i], data );
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
        subscribe: function (channel, cb) {
            if(Utils.asteriskEnd( channel )) {
                channel = parseChannel( channel );
            }

            if(!this.channels[ channel ]) {
                this.createChannel(channel);
            }

            if (this.channels[channel].subscribers) {
                this.channels[channel].subscribers.push({callback: cb });

                return this.channels[channel].subscribers.length - 1;
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

var TaskQueue = new Class(function() {
    //Private
    return {
        queue: [],
        data: {},
        main: function() {

        },
        constructor: function(qOrder, qData, start) {
            // theTimeout prevents the tasks from never ending or taking forever
            if (typeof qOrder === "array" && typeof qData === "object") {
                this.queue = qOrder;
                this.data = qData;

                if(start) {
                    this.start();
                }
            }
        },
        addTask: function(task) {
            if(task.async === true) {
                this.data[task.name] = { task: task.task, params: task.params, async: task.async, timeout: task.timeout };
            } else if(task.async === false) {
                this.data[task.name] = { task: task.task, params: task.params, async: task.async };
            }

            return this;
        },
        removeTask: function(name) {
            if(this.data[name]) {
                this.data[name] = undefined;
            }

            var len = this.queue.length, i = 0;
            for (i = 0; i < len; i++) {
                if(this.queue[i] === name) {
                    this.queue.splice(i, 1);
                }
            }

            return this;
        },
        enQ: function(name) {
            if(this.data[name]) {
                this.queue.push(name);
            }

            if (this.active && this.queue.length === 1) {
                this.start(0);
            }

            return this;
        },
        deQ: function(name) { // Removes the first with the queue name

            var loc = this.queue.indexOf(name);
            if (loc > -1) {
                this.queue.splice(loc, 1);
            }

            return this;
        },
        deQLast: function(name) {
            var loc = this.queue.lastIndexOf(name);
            if (loc > -1) {
                this.queue.splice(loc, 1);
            }

            return this;
        },
        start: function() {
            if(this.queue[0]) {
                var that = this,
                    name = this.queue[0],
                    task = this.data[name];

                if (task && task.task) {

                    if(task.async === false) {
                        this.active = true;
                    } else {
                        this.active = false;
                    }

                    if(task.params)  {
                        task.task(task.params);
                        this.nextTask(0);
                    } else {
                        task.task();
                        this.nextTask(0);
                    }
                }
            } else {
                this.active = true; // There is nothing waiting in the queue
            }

        },
        stop: function() {
            this.active = false;
        },
        clearQueue: function() {
            this.queue = [];

            return this;
        },
        nextTask: function(i) {
            this.queue.splice(i, 1);

            if(this.queue[i] && this.active) {
                var name = this.queue[i];
                if (this.data[name] && this.data[name].task) {
                    if(this.data[name].params)  {
                        this.data[name].task(this.data[name].params);
                        this.nextTask(i);
                    } else {
                        this.data[name].task();

                        this.nextTask(i);
                    }
                }
            } else {

            }
        }
    }
});
