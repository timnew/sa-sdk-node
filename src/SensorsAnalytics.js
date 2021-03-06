import R from 'ramda'
import { Subject } from 'rx'

import {
  pascal2Snake,
  snakenizeKeys,
  extractTimestamp,
  extractCodeProperties,
  translateUserAgent,
} from './translators'
import { version as PACKAGE_VERSION } from './readPackageInfo'
import {
  checkExists,
  checkPattern,
  checkIsStringArray,
  checkProperties,
  checkValueType,
  checkValueIsNumber,
  checkValueIsStringArray,
} from './assertions'
import Submitter from './Submitter'

import createDebug from 'debug'
const debug = createDebug('sa:SensorsAnalytics')

const SDK_PROPERTIES = {
  $lib: 'Node',
  $libVersion: PACKAGE_VERSION,
}

class SensorsAnalytics extends Subject {
  constructor() {
    super()
    this.clearSuperProperties()
  }

  registerSuperProperties(values = {}) {
    debug('registerSuperProperties(%j)', values)
    checkProperties(values, checkPattern)
    checkProperties(values, checkValueType)

    return Object.assign(this.superProperties, values)
  }

  clearSuperProperties() {
    debug('clearSuperProperties()')

    this.superProperties = {}

    return this.superProperties
  }

  superizeProperties(properties = {}, callIndex) {
    const codeProperties = extractCodeProperties(callIndex)

    return R.mergeAll([SDK_PROPERTIES, this.superProperties, codeProperties, translateUserAgent(properties)])
  }

  track(distinctId, event, eventProperties) {
    debug('track(%j)', { distinctId, event, eventProperties })

    checkExists(distinctId, 'distinctId')
    checkPattern(event, 'event')
    checkProperties(eventProperties, checkValueType)

    const properties = this.superizeProperties(eventProperties, 4)

    this.internalTrack('track', { event, distinctId, properties })
  }

  trackSignup(distinctId, originalId, eventProperties) {
    debug('trackSignup(%j)', { distinctId, originalId, eventProperties })

    checkExists(distinctId, 'distinctId')
    checkExists(originalId, 'originalId')
    checkProperties(eventProperties, checkValueType)

    const properties = this.superizeProperties(eventProperties, 4)

    this.internalTrack('track_signup', { event: '$SignUp', distinctId, originalId, properties })
  }

  profileSet(distinctId, properties) {
    debug('profileSet(%j)', { distinctId, properties })

    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueType)

    this.internalTrack('profile_set', { distinctId, properties })
  }

  profileSetOnce(distinctId, properties) {
    debug('profileSetOnce(%j)', { distinctId, properties })

    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueType)

    this.internalTrack('profile_set_once', { distinctId, properties })
  }

  profileIncrement(distinctId, properties) {
    debug('profileIncrement(%j)', { distinctId, properties })

    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueIsNumber)

    this.internalTrack('profile_increment', { distinctId, properties })
  }

  profileAppend(distinctId, properties) {
    debug('profileAppend(%j)', { distinctId, properties })

    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueIsStringArray)

    this.internalTrack('profile_append', { distinctId, properties })
  }

  profileUnset(distinctId, keys = []) {
    debug('profileUnset(%j)', { distinctId, keys })

    checkExists(distinctId, 'distinctId')
    checkIsStringArray(keys, 'Keys')

    const properties = R.zipObj(keys, R.repeat(true, keys.length))

    this.internalTrack('profile_unset', { distinctId, properties })
  }

  internalTrack(type, { event, distinctId, originalId, properties }) {
    const envelope = snakenizeKeys({
      type,
      event: pascal2Snake(event),
      time: extractTimestamp(properties),
      distinctId,
      originalId,
      properties: checkProperties(snakenizeKeys(properties), checkPattern),
    })

    debug('envelope: %j', envelope)

    this.onNext(envelope)
  }

  inBatch({ count, timeSpan }) {
    const mode = `${count != null ? 'count' : ''}${timeSpan != null ? 'time' : ''}`

    debug('inBatch(%j)', { count, timeSpan, mode })

    switch (mode) {
      case 'count':
        return this.bufferWithCount(count).filter((events) => events.length > 0)
      case 'counttime':
        return this.bufferWithTimeOrCount(timeSpan, count).filter((events) => events.length > 0)
      case 'time':
        return this.bufferWithTime(timeSpan).filter((events) => events.length > 0)
      default:
        return this
    }
  }

  submitTo(options, batchOptions = {}) {
    debug('submitTo(%j, %j)', options, batchOptions)

    const observable = this.inBatch(batchOptions)
    const submitter = new Submitter(options)

    observable.subscribe(submitter)

    return submitter
  }

  close() {
    this.onCompleted()
  }
}

export default SensorsAnalytics
