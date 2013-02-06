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

