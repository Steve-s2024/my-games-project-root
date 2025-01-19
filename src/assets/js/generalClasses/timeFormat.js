class TimeFormat {
  static formatBySecond (time) {
    let minute = parseInt(time / 60)
    minute = minute < 10 ? '0' + minute : '' + minute
    let second = (time % 60)
    second = second < 10 ? '0' + second : '' + second
    const TIME = minute + ':' + second
    return TIME
  }
}

export {
  TimeFormat
}
