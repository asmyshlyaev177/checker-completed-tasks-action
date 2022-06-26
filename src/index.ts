import * as core from '@actions/core'
import * as github from '@actions/github'
import {removeIgnoreTaskLitsText, createTaskListText} from './utils'

type conclusion = 'success' | 'failure'

async function run() {
  try {
    const body = github.context.payload.pull_request?.body

    const token = core.getInput('repo-token', {required: true})
    const appName = 'Task Completed Checker'

    if (!body) {
      core.info('no task list and skip the process.')
      await createCheck({
        name: appName,
        conclusion: 'success',
        summary: 'No task list',
        text: 'No task list'
      })
      return
    }

    const result = removeIgnoreTaskLitsText(body)

    core.debug('creates a list of tasks which removed ignored task: ')
    core.debug(result)

    const isTaskCompleted = result.match(/(- \[[ ]\].+)/g) === null

    const text = createTaskListText(result)

    core.debug('creates a list of completed tasks and uncompleted tasks: ')
    core.debug(text)

    const conclusion = isTaskCompleted ? 'success' : 'failure'
    core.debug('CONCLUSION ' + conclusion)
    return await createCheck({
      name: appName,
      conclusion,
      summary: isTaskCompleted
        ? 'All tasks are completed'
        : 'Some tasks are uncompleted!',
      text
    })
  } catch (error) {
    const message =
      ((error as unknown) as Error)?.message || error || 'Something went wrong'
    core.setFailed(message as string)
  }
}

async function createCheck({
  name,
  conclusion,
  summary,
  text
}: {
  name: string
  conclusion: conclusion
  summary: string
  text: string
}) {
  core.debug('token : ' + core.getInput('repo-token'))
  const octokit = github.getOctokit(core.getInput('repo-token'))

  // const head_sha = core.getInput('ref', {required: true})
  const head_sha = github.context.payload.pull_request?.head.sha
  core.debug('head_sha : ' + head_sha)
  const req = {
    ...github.context.repo,
    ref: head_sha
  }
  const run_id = github.context.runId
  core.debug('run_id: ' + run_id)
  const res = await octokit.rest.checks.listForRef(req)
  const workflowRun = await octokit.rest.actions.getWorkflowRun({
    ...github.context.repo,
    run_id
  })
  core.debug('workflowRun: ' + JSON.stringify(workflowRun?.data, null, 2))

  const checkSuiteUrl = workflowRun.data.check_suite_url
  core.debug('checkSuiteUrl: ' + JSON.stringify(checkSuiteUrl, null, 2))

  // const checkSuiteId = Number(
  //   checkSuiteUrl.substring(checkSuiteUrl.lastIndexOf('/') + 1)
  // )
  const checkSuiteId = Number(workflowRun.data.check_suite_id)
  core.debug('checkSuiteId: ' + checkSuiteId)
  // core.debug('checkRuns: ' + JSON.stringify(res.data.check_runs, null, 2))
  const existingCheckRun = res.data.check_runs.find(
    check => Number(check?.check_suite?.id) === checkSuiteId
  )
  core.debug('existingCheckRun: ' + existingCheckRun)
  const options = {
    name,
    head_sha: head_sha,
    status: 'completed',
    conclusion,
    completed_at: new Date().toISOString(),
    output: {
      title: name,
      summary,
      text
    },
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
  }
  return existingCheckRun
    ? await octokit.rest.checks.update({
        ...options,
        check_run_id: existingCheckRun.id
      })
    : await octokit.rest.checks.create(options)
}

run()
