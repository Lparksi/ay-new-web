export function notifySuccess(message: string) {
  // thin wrapper — use tdesign message in app; for tests this can be mocked
  try {
    // lazy require to avoid test environment bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { message: tdMessage } = require('tdesign-vue-next')
    if (tdMessage && typeof tdMessage.success === 'function') {
      tdMessage.success(message)
      return
    }
  } catch (_) {
    // fallthrough to fallback
  }
  // fallback to console in test env
  // keep silent to avoid throwing in jsdom
  // console.info('SUCCESS:', message)
}

export function notifyError(message: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { message: tdMessage } = require('tdesign-vue-next')
    if (tdMessage && typeof tdMessage.error === 'function') {
      tdMessage.error(message)
      return
    }
  } catch (_) {
    // noop
  }
  // console.error('ERROR:', message)
}

export default { notifySuccess, notifyError }
