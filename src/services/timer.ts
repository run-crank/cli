import chalk from 'chalk'

export class Timer {
  protected testStartTime: number
  protected passedSteps = 0
  protected failedSteps = 0
  protected skippedSteps = 0

  constructor() {
    this.testStartTime = Date.now()
  }

  public addPassedStep() {
    this.passedSteps++
  }

  public addFailedStep() {
    this.failedSteps++
  }

  public addSkippedStep() {
    this.skippedSteps++
  }

  public printTime(printFunc: (msg: string) => void): void {
    const timerText = ` (${((Date.now() - this.testStartTime) / 1000).toFixed(2)}s)`

    printFunc('\n')
    if (this.passedSteps) {
      printFunc(chalk.green(`${this.passedSteps} passing${timerText}`))
    }
    if (this.failedSteps) {
      printFunc(chalk.red(`${this.failedSteps} failing${!this.passedSteps ? timerText : ''}`))
    }
    if (this.skippedSteps) {
      printFunc(chalk.gray(`${this.skippedSteps} skipped`))
    }
  }

}
