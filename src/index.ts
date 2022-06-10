import * as core from '@actions/core'
import * as github from '@actions/github'
import {removeIgnoreTaskLitsText, createTaskListText} from './utils'

async function run() {
  try {
    const body = github.context.payload.pull_request?.body

    const token = core.getInput('repo-token', {required: true})
    const githubApi = new github.GitHub(token)
    const appName = 'Task Completed Checker'

    if (!body) {
      core.info('no task list and skip the process.')
      await githubApi.checks.create({
        name: appName,
        head_sha: github.context.payload.pull_request?.head.sha,
        status: 'completed',
        conclusion: 'success',
        completed_at: new Date().toISOString(),
        output: {
          title: appName,
          summary: 'No task list',
          text: 'No task list'
        },
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
      })
      return
    }

    const result = removeIgnoreTaskLitsText(body)

    core.debug('creates a list of tasks which removed ignored task: ')
    core.debug(result)

    const uncompletedTasks = result.match(/(- \[[ ]\].+)/g)
    const completedTasks = result.match(/(- \[[x]\].+)/g)
    // const isTaskCompleted = result.match(/(- \[[ ]\].+)/g) === null
    const isTaskCompleted = !uncompletedTasks

    const text = createTaskListText(result)

    core.debug('creates a list of completed tasks and uncompleted tasks: ')
    core.debug(text)
    core.debug('COMPLETED ' + completedTasks)
    core.debug('UNCOMPLETED ' + uncompletedTasks)
    core.debug('isTaskCompleted ' + isTaskCompleted)
    const summary = `Completed tasks:
    ${(completedTasks && `${completedTasks}`) || 'Nothing....'};
    
    Uncompleted tasks:
    ${(uncompletedTasks && `${uncompletedTasks}`) || 'All done!'}`
    core.debug('SUMMARY ' + summary)

    const conclusion = isTaskCompleted ? 'success' : 'failure'
    return await githubApi.checks.create({
      name: appName,
      head_sha: github.context.payload.pull_request?.head.sha,
      status: 'completed',
      conclusion,
      completed_at: new Date().toISOString(),
      output: {
        title: appName,
        // summary: isTaskCompleted
        //   ? 'All tasks are completed'
        //   : 'Some tasks are uncompleted!',
        summary: 'Results',
        // text
        text: summary
      },
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    })
    // if (!isTaskCompleted) {
    //   throw new Error('Not all tasks completed')
    // }
  } catch (error) {
    const message =
      ((error as unknown) as Error)?.message || error || 'Something went wrong'
    core.setFailed(message as string)
  }
}

run()
