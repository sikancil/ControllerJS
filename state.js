/**
 * Created with JetBrains WebStorm.
 * User: brian
 * Date: 9/29/12
 * Time: 3:11 PM
 * To change this template use File | Settings | File Templates.
 */
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