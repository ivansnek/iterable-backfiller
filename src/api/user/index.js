const moment = require('moment')
const axios = require('axios')
const path = require('path');
const csv = require('../../csv')

const REGISTER_USER = '/api/users/registerDeviceToken';

const delay = (ms = 1000) => new Promise((resolve) => setTimeout(() => resolve('Done'), ms))

const registerDevice = ({ email, token, platform, applicationName}) => {
  const result = {
    email,
    ok: true
  }
  const body = {
    email,
    device: {
      token,
      platform,
      applicationName
    }
  }
  return axios.post(`${process.env.ITERABLE_URL}${REGISTER_USER}`, body, {
    'Authorization': process.env.ITERABLE_API_KEY,
    'Auth_Key': process.env.ITERABLE_API_KEY,
    'Content-Type': 'application/json'
  })
  .then(() => result)
  .catch(e => {
    result.ok = false
    return result
  })
}

const registerDeviceMock = ({email, ...rest}) => {
  return new Promise((resolve) => {
    resolve({ email, ok: Math.random() * 10 <= 2})
  })
}

const backFillUserDevices = async (limit = 20, offset = 0) => {
  const startPoint = moment()
  console.log(`------------- START DEVICES BACKFILL AT [${startPoint.format('YYYY-MM-DDTHH:mm:ss')}] -------------`)
  const data = await csv.readFileContents('assets/IterableBackFill.csv')
  let loopIndex = successIndex = 0 + offset
  let waitIndex = 0
  const result = {
    success: [],
    ommited: [],
    failed: []
  }
  while (successIndex >= 0 && successIndex < limit) {
    const {email, token, iterableUserId, applicationName, platform} = data[loopIndex];
    if (email && iterableUserId && email !== '#N/A' && iterableUserId !== '#N/A') {
      const deviceStatus = await registerDevice({
        email,
        token,
        platform,
        applicationName
      });
      if (deviceStatus.ok) {
        console.log('[iterable.backFillUserDevices] User registered: ', email)
        result.success.push(email)
        successIndex++
      } else {
        result.failed.push(email)
      }
    } else {
      result.ommited.push(email)
    }
    // Wait 2 secods every 350 devices
    if (waitIndex === 400) {
      console.log('[iterable.backFillUserDevices] Paused at: ', loopIndex)
      console.log('[iterable.backFillUserDevices] Devices registered ATM: ', result.success.length)
      waitIndex = 0
      await delay(2000)
    }
    waitIndex++
    loopIndex++
  }
  const stopPoint = moment()
  console.log(`------------- END DEVICES BACKFILL AT [${stopPoint.format('YYYY-MM-DDTHH:mm:ss')}] ------------- `)
  console.log('[iterable.backFillUserDevices] Devices registered: ', result.success.length)
  console.log('[iterable.backFillUserDevices] Devices ommited: ', result.ommited.length)
  console.log('[iterable.backFillUserDevices] Devices registered failed: ', result.failed.length)
  console.log('[iterable.backFillUserDevices] Last Index: ', loopIndex)
  // LOG RESULTS
}

module.exports = {
  registerDevice,
  backFillUserDevices
}