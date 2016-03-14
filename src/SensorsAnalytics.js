import R from 'ramda'
import { Subject } from 'rx'
import { pascal2Snake, translateKeys, translateTimeStamp } from './translators'
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

const snakenizeKeys = translateKeys(pascal2Snake)

class SensorsAnalytics extends Subject {
  constructor() {
    super()
    this.clearSuperProperties()
  }

  registerSuperProperties(values = {}) {
    checkProperties(values, checkPattern)
    checkProperties(values, checkValueType)

    return Object.assign(this.superProperties, values)
  }

  clearSuperProperties() {
    this.superProperties = {
      $lib: 'Node',
      $libVersion: PACKAGE_VERSION,
    }

    return this.superProperties
  }

  superizeProperties(properties = {}) {
    return R.merge(this.superProperties, properties)
  }

  track(distinctId, event, eventProperties) {
    checkExists(distinctId, 'distinctId')
    checkPattern(event, 'event')
    checkProperties(eventProperties, checkValueType)

    const properties = this.superizeProperties(eventProperties)

    this.internalTrack('track', { event, distinctId, properties })
  }

  trackSignup(distinctId, originalId, eventProperties) {
    checkExists(distinctId, 'distinctId')
    checkExists(originalId, 'originalId')
    checkProperties(eventProperties, checkValueType)

    const properties = this.superizeProperties(eventProperties)

    this.internalTrack('track_signup', { event: '$SignUp', distinctId, originalId, properties })
  }

  profileSet(distinctId, properties) {
    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueType)

    this.internalTrack('profile_set', { distinctId, properties })
  }

  profileSetOnce(distinctId, properties) {
    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueType)

    this.internalTrack('profile_set_once', { distinctId, properties })
  }

  profileIncrement(distinctId, properties) {
    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueIsNumber)

    this.internalTrack('profile_increment', { distinctId, properties })
  }

  profileAppend(distinctId, properties) {
    checkExists(distinctId, 'distinctId')
    checkProperties(properties, checkValueIsStringArray)

    this.internalTrack('profile_append', { distinctId, properties })
  }

  profileUnset(distinctId, keys = []) {
    checkExists(distinctId, 'distinctId')
    checkIsStringArray(keys, 'Keys')

    const properties = R.zipObj(keys, R.repeat(true, keys.length))

    this.internalTrack('profile_unset', { distinctId, properties })
  }

  internalTrack(type, { event, distinctId, originalId, properties }) {
    const time = translateTimeStamp(properties.$time)

    const envelope = snakenizeKeys({
      type,
      event,
      time,
      distinctId,
      originalId,
      properties: checkProperties(snakenizeKeys(properties), checkPattern),
    })

    this.onNext(envelope)
  }

  inBatch({ count, timeSpan }) {
    const mode = `${count != null ? 'count' : ''}${timeSpan != null ? 'time' : ''}`

    switch (mode) {
      case 'count':
        return this.windowWithCount(count).filter((events) => events.length > 0)
      case 'counttime':
        return this.windowWithTimeOrCount(timeSpan, count).filter((events) => events.length > 0)
      case 'time':
        return this.windowWithTime(timeSpan).filter((events) => events.length > 0)
      default:
        return this
    }
  }

  submitTo(options, batchOptions = {}) {
    const observable = this.inBatch(batchOptions)
    const submitter = new Submitter(options)

    observable.subscribe(submitter)

    return submitter
  }
}

export default SensorsAnalytics
