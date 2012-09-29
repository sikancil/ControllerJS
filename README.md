ControllerJS-PubSub-StateControl
================================

ControllerJS PubSub-StateControl help in the management of web applications 
Benchmarks
-------------
[PubSub Methods](http://jsperf.com/my-pubsub-lib/6)

[ControllerJS Vs other PubSub Libs](http://jsperf.com/pubsubjs-vs-jquery-custom-events/57)

<img src='http://s16.postimage.org/h3kgrxkat/benchmarks.png' />

PubSub API
-------------

#### ```createChannel( channelName ) ```

creates the channel and sets it up for subscriptions and publications. To create subtopics
use a colon ':' this will allow for User or User:Example to subscribe to the channel listed below;

```
PubSub.createChannel('User:Example:Test');

PubSub.createChannel('User:Module:Action:Event');
```

#### ```subscribe( channelName, function ) ```

subscribes a function to be executed when ever a channel is published too

```
var id = PubSub.subscribe('User:Example:Test', function( data ) { 
    console.log(data.name);
});

var id2 = PubSub.subscribe('User:Module:Action:Event', function( data ) { 
    console.log(data.success);
});
```

#### ```publish( channelName, data ) ```

publishes to a channel with, the data provide by the code, there are no restrictions on the data. 
This will publish an event to any of the subchannels as well to User and User:Example will also get this publication.
```
PubSub.publish('User:Example:Test', 'data' );

PubSub.publish('User:Example:Test', { info: 'test', number: 89 });
```

#### ```unsubscribe( channelName, id ) ```

unsubscribes a function based on their id. The id is always a number.
```
PubSub.unsubscribe('User:Example:Test',  0);

PubSub.unsubscribe('User:Module:Action:Event', 33);
```
Additions to come:
Merge Channels, unsubscribeAll, cleanChannel
