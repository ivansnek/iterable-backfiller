const moment = require('moment')
const axios = require('axios')
const path = require('path');
const csv = require('../../csv')

const REGISTER_USER = '/api/users/registerDeviceToken';
const GET_USER = '/api/users';

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
    headers: {
      'Authorization': process.env.ITERABLE_API_KEY,
      'Api-Key': process.env.ITERABLE_API_KEY,
      'Content-Type': 'application/json'
    }
  })
  .then(() => result)
  .catch(e => {
    result.ok = false
    return result
  })
}

const validateUserData = ({data}) => {
  const {user} = data;
  // No devices associated
  if (!user || !user?.dataFields?.devices) {
    return {
      email: user.email,
      platform: 'N/A',
      token: 'N/A',
      applicationName: 'N/A',
      endpointEnabled: 'N/A'
    }
  }
  const validDevice = user?.dataFields?.devices?.find?.((d) => d.platform && d.token && d.applicationName && Boolean(d.endpointEnabled))
  // Invalid required data or disabled endpoint https://support.iterable.com/hc/en-us/articles/217744303-User-Profile-Fields-Used-by-Iterable-#devices
  if (!validDevice) {
    const {
      platform,
      token,
      applicationName,
      endpointEnabled
    } = user?.dataFields?.devices[0] || {};
    return {
      email: user.email,
      platform,
      token,
      applicationName,
      endpointEnabled,
    }
  }
  return null;
}

const getUser = email => axios.get(`${process.env.ITERABLE_URL}${GET_USER}/${email}`, {
    headers: {
      'Authorization': process.env.ITERABLE_API_KEY,
      'Api-Key': process.env.ITERABLE_API_KEY,
      'Content-Type': 'application/json'
    }
  })
  .then(validateUserData)
  .catch(e => {
    console.log(`[iterable.getUser] Error`, e?.message ?? e)
    return {email}
  })

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
  while (successIndex >= 0 && successIndex < (limit + offset)) {
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

const validateUsers = async (limit = 20, offset = 0) => {
  const startPoint = moment()
  console.log(`------------- START USERS VALIDATION AT [${startPoint.format('YYYY-MM-DDTHH:mm:ss')}] -------------`)
  const data = await csv.readFileContents('assets/mobile_users.csv')
  let loopIndex = successIndex = 0 + offset
  const badEmails = []
  let waitIndex = 0

  while (successIndex >= 0 && successIndex < (limit + offset)) {
    const {email} = data[loopIndex];
    if (email && email !== '#N/A') {
      const user = await getUser(email);
      if (user && user.email) {
        console.log(`[iterable.validateUsers] ${loopIndex} - User invalid PN data: `, email)
        badEmails.push(user);
      } else {
        console.log(`[iterable.validateUsers] ${loopIndex} - Valid PN data for user: `, email)
      }
    } else {
      console.log(`[iterable.validateUsers] ${loopIndex} - Invalid EMAIL: `, email)
    }
    await delay(1001)
    if (waitIndex === 500) {
      console.log('[iterable.validateUsers] Paused at: ', loopIndex)
      console.log('[iterable.validateUsers] Users invalid ATM: ', badEmails.length)
      waitIndex = 0
      await delay(5000)
    }
    waitIndex++
    successIndex++
    loopIndex++
  }
  await csv.writeBadPNFile(badEmails);
  const stopPoint = moment()
  console.log(`------------- END DEVICES BACKFILL AT [${stopPoint.format('YYYY-MM-DDTHH:mm:ss')}] ------------- `)
  console.log('[iterable.validateUsers] Last Index: ', loopIndex)
  console.log('[iterable.validateUsers] Users with invalid PN Data: ', badEmails.length);
}

module.exports = {
  registerDevice,
  backFillUserDevices,
  validateUsers,
}