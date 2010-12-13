
require.paths.unshift(__dirname + '/../lib/');

Client = require('client');
EventEmitter = require('events').EventEmitter;

sys = require('sys');
assert = require('assert');
BufferList = require(__dirname+'/buffer-list')
buffers = require(__dirname + '/test-buffers');
Connection = require('connection');
var args = require(__dirname + '/cli');

assert.same = function(actual, expected) {
  for(var key in expected) {
    assert.equal(actual[key], expected[key]);
  }
};


assert.emits = function(item, eventName, callback) {
  var called = false;
  var id = setTimeout(function() {
    test("Should have called " + eventName, function() {
      assert.ok(called, "Expected '" + eventName + "' to be called.")
    });
  },20000);

  item.once(eventName, function() {
    called = true;
    clearTimeout(id);
    assert.ok(true);
    if(callback) {
      callback.apply(item, arguments);
    }
  });
};

assert.UTCDate = function(actual, year, month, day, hours, min, sec, milisecond) {
  var actualYear = actual.getUTCFullYear();
  assert.equal(actualYear, year, "expected year " + year + " but got " + actualYear);

  var actualDate = actual.getUTCDate();
  assert.equal(actualDate, day, "expected day " + day + " but got " + actualDate);

  var actualHours = actual.getUTCHours();
  assert.equal(actualHours, hours, "expected hours " + hours + " but got " + actualHours);

  var actualMin = actual.getUTCMinutes();
  assert.equal(actualMin, min, "expected min " + min + " but got " + actualMin);

  var actualSec = actual.getUTCSeconds();
  assert.equal(actualSec, sec, "expected sec " + sec + " but got " + actualSec);

  var actualMili = actual.getUTCMilliseconds();
  assert.equal(actualMili, milisecond, "expected milisecond " + milisecond + " but got " + actualMili);
};

assert.equalBuffers = function(actual, expected) {
  if(actual.length != expected.length) {
    console.log("");
    console.log("actual " + sys.inspect(actual));
    console.log("expect " + sys.inspect(expected));
    console.log("");
    assert.equal(actual.length, expected.length);
  }
  for(var i = 0; i < actual.length; i++) {
    if(actual[i] != expected[i]) {
      console.log(actual);
      console.log(expected);
    }
    assert.equal(actual[i],expected[i]);
  }
};

assert.empty = function(actual) {
  assert.length(actual, 0);
};


assert.length = function(actual, expectedLength) {
  assert.equal(actual.length, expectedLength);
};

var expect = function(callback, timeout) {
  var executed = false;
  var id = setTimeout(function() {
    assert.ok(executed, "Expected execution of funtion to be fired");
  }, timeout || 2000)

  return function(err, queryResult) {
    clearTimeout(id);
    assert.ok(true);
    callback.apply(this, arguments)
  }
}
assert.calls = expect;

assert.isNull = function(item, message) {
  message = message || "expected " + item + " to be null";
  assert.ok(item === null, message);
};

['equal', 'length', 'empty', 'strictEqual', 'emits', 'equalBuffers', 'same', 'calls', 'ok'].forEach(function(name) {
  var old = assert[name];
  assert[name] = function() {
    test.assertCount++
    return old.apply(this, arguments);
  };
});

test = function(name, action) {
  test.testCount ++;
  var result = action();
  if(result === false) {
    test.ignored.push(name);
    process.stdout.write('?');
  }else{
    process.stdout.write('.');
  }
};

test.assertCount = test.assertCount || 0;
test.testCount = test.testCount || 0;
test.ignored = test.ignored || [];
test.errors = test.errors || [];
test.start = test.start || new Date();

process.on('exit', function() {
  console.log('');
  var duration = ((new Date() - test.start)/1000);
  console.log(test.testCount + ' tests ' + test.assertCount + ' assertions in ' + duration + ' seconds');
  test.ignored.forEach(function(name) {
    console.log("Ignored: " + name);
  });
  test.errors.forEach(function(error) {
    console.log("Error: " + error.name);
  });
  test.errors.forEach(function(error) {
    throw error.e;
  });
});
var count = 0;

var Sink = function(expected, timeout, callback) {
  var defaultTimeout = 1000;
  if(typeof timeout == 'function') {
    callback = timeout;
    timeout = defaultTimeout;
  }
  timeout = timeout || defaultTimeout;
  var internalCount = 0;
  var kill = function() {
    assert.ok(false, "Did not reach expected " + expected + " with an idle timeout of " + timeout);
  }
  var killTimeout = setTimeout(kill, timeout);
  return {
    add: function(count) {
      count = count || 1;
      internalCount += count;
      clearTimeout(killTimeout)
      if(internalCount < expected) {
        killTimeout = setTimeout(kill, timeout)
      }
      else {
        assert.equal(internalCount, expected);
        callback();
      }
    }
  }
}

module.exports = {
  args: args,
  Sink: Sink,
  connectionString: function() {
    return "pg"+(count++)+"://"+args.user+":"+args.password+"@"+args.host+":"+args.port+"/"+args.database;
  }
};


