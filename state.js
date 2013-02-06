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
