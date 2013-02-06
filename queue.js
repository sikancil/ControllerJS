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
