'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _rx = require('rx');

var _translators = require('./translators');

var _readPackageInfo = require('./readPackageInfo');

var _assertions = require('./assertions');

var _Submitter = require('./Submitter');

var _Submitter2 = _interopRequireDefault(_Submitter);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

const debug = (0, _debug2.default)('sa:SensorsAnalytics');

const SDK_PROPERTIES = {
  $lib: 'Node',
  $libVersion: _readPackageInfo.version
};

let SensorsAnalytics = function (_Subject) {
  _inherits(SensorsAnalytics, _Subject);

  function SensorsAnalytics() {
    _classCallCheck(this, SensorsAnalytics);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SensorsAnalytics).call(this));

    _this.clearSuperProperties();
    return _this;
  }

  _createClass(SensorsAnalytics, [{
    key: 'registerSuperProperties',
    value: function registerSuperProperties() {
      let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      debug('registerSuperProperties(%j)', values);
      (0, _assertions.checkProperties)(values, _assertions.checkPattern);
      (0, _assertions.checkProperties)(values, _assertions.checkValueType);

      return Object.assign(this.superProperties, values);
    }
  }, {
    key: 'clearSuperProperties',
    value: function clearSuperProperties() {
      debug('clearSuperProperties()');

      this.superProperties = {};

      return this.superProperties;
    }
  }, {
    key: 'superizeProperties',
    value: function superizeProperties() {
      let properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      let callIndex = arguments[1];

      const codeProperties = (0, _translators.extractCodeProperties)(callIndex);

      return _ramda2.default.mergeAll([SDK_PROPERTIES, this.superProperties, codeProperties, (0, _translators.translateUserAgent)(properties)]);
    }
  }, {
    key: 'track',
    value: function track(distinctId, event, eventProperties) {
      debug('track(%j)', { distinctId, event, eventProperties });

      (0, _assertions.checkExists)(distinctId, 'distinctId');
      (0, _assertions.checkPattern)(event, 'event');
      (0, _assertions.checkProperties)(eventProperties, _assertions.checkValueType);

      const properties = this.superizeProperties(eventProperties, 4);

      this.internalTrack('track', { event, distinctId, properties });
    }
  }, {
    key: 'trackSignup',
    value: function trackSignup(distinctId, originalId, eventProperties) {
      debug('trackSignup(%j)', { distinctId, originalId, eventProperties });

      (0, _assertions.checkExists)(distinctId, 'distinctId');
      (0, _assertions.checkExists)(originalId, 'originalId');
      (0, _assertions.checkProperties)(eventProperties, _assertions.checkValueType);

      const properties = this.superizeProperties(eventProperties, 4);

      this.internalTrack('track_signup', { event: '$SignUp', distinctId, originalId, properties });
    }
  }, {
    key: 'profileSet',
    value: function profileSet(distinctId, properties) {
      debug('profileSet(%j)', { distinctId, properties });

      (0, _assertions.checkExists)(distinctId, 'distinctId');
      (0, _assertions.checkProperties)(properties, _assertions.checkValueType);

      this.internalTrack('profile_set', { distinctId, properties });
    }
  }, {
    key: 'profileSetOnce',
    value: function profileSetOnce(distinctId, properties) {
      debug('profileSetOnce(%j)', { distinctId, properties });

      (0, _assertions.checkExists)(distinctId, 'distinctId');
      (0, _assertions.checkProperties)(properties, _assertions.checkValueType);

      this.internalTrack('profile_set_once', { distinctId, properties });
    }
  }, {
    key: 'profileIncrement',
    value: function profileIncrement(distinctId, properties) {
      debug('profileIncrement(%j)', { distinctId, properties });

      (0, _assertions.checkExists)(distinctId, 'distinctId');
      (0, _assertions.checkProperties)(properties, _assertions.checkValueIsNumber);

      this.internalTrack('profile_increment', { distinctId, properties });
    }
  }, {
    key: 'profileAppend',
    value: function profileAppend(distinctId, properties) {
      debug('profileAppend(%j)', { distinctId, properties });

      (0, _assertions.checkExists)(distinctId, 'distinctId');
      (0, _assertions.checkProperties)(properties, _assertions.checkValueIsStringArray);

      this.internalTrack('profile_append', { distinctId, properties });
    }
  }, {
    key: 'profileUnset',
    value: function profileUnset(distinctId) {
      let keys = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      debug('profileUnset(%j)', { distinctId, keys });

      (0, _assertions.checkExists)(distinctId, 'distinctId');
      (0, _assertions.checkIsStringArray)(keys, 'Keys');

      const properties = _ramda2.default.zipObj(keys, _ramda2.default.repeat(true, keys.length));

      this.internalTrack('profile_unset', { distinctId, properties });
    }
  }, {
    key: 'internalTrack',
    value: function internalTrack(type, _ref) {
      let event = _ref.event;
      let distinctId = _ref.distinctId;
      let originalId = _ref.originalId;
      let properties = _ref.properties;

      const envelope = (0, _translators.snakenizeKeys)({
        type,
        event: (0, _translators.pascal2Snake)(event),
        time: (0, _translators.extractTimestamp)(properties),
        distinctId,
        originalId,
        properties: (0, _assertions.checkProperties)((0, _translators.snakenizeKeys)(properties), _assertions.checkPattern)
      });

      debug('envelope: %j', envelope);

      this.onNext(envelope);
    }
  }, {
    key: 'inBatch',
    value: function inBatch(_ref2) {
      let count = _ref2.count;
      let timeSpan = _ref2.timeSpan;

      const mode = `${ count != null ? 'count' : '' }${ timeSpan != null ? 'time' : '' }`;

      debug('inBatch(%j)', { count, timeSpan, mode });

      switch (mode) {
        case 'count':
          return this.bufferWithCount(count).filter(events => events.length > 0);
        case 'counttime':
          return this.bufferWithTimeOrCount(timeSpan, count).filter(events => events.length > 0);
        case 'time':
          return this.bufferWithTime(timeSpan).filter(events => events.length > 0);
        default:
          return this;
      }
    }
  }, {
    key: 'submitTo',
    value: function submitTo(options) {
      let batchOptions = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      debug('submitTo(%j, %j)', options, batchOptions);

      const observable = this.inBatch(batchOptions);
      const submitter = new _Submitter2.default(options);

      observable.subscribe(submitter);

      return submitter;
    }
  }, {
    key: 'close',
    value: function close() {
      this.onCompleted();
    }
  }]);

  return SensorsAnalytics;
}(_rx.Subject);

exports.default = SensorsAnalytics;