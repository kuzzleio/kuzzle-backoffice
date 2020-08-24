module.exports = {
  startsWithSpace(value) {
    return value[0] === ' '
  },
  isWhitespace(value) {
    return trim(value) === ''
  },
  isValidHostname(value) {
    return /^@$|^(\*)$|^(\*\.)?(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9](\.?))$/.test(
      value
    )
  },
  notIncludeScheme(value) {
    return !/^(http|ws):\/\//.test(value)
  }
}
