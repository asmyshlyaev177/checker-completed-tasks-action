"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const utils_1 = require("./utils");
async function run() {
    var _a, _b, _c;
    try {
        const body = (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.body;
        const token = core.getInput('repo-token', { required: true });
        const githubApi = new github.GitHub(token);
        const appName = 'Task Completed Checker';
        if (!body) {
            core.info('no task list and skip the process.');
            await githubApi.checks.create({
                name: appName,
                // eslint-disable-next-line @typescript-eslint/camelcase
                head_sha: (_b = github.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.head.sha,
                status: 'completed',
                conclusion: 'success',
                // eslint-disable-next-line @typescript-eslint/camelcase
                completed_at: new Date().toISOString(),
                output: {
                    title: appName,
                    summary: 'No task list',
                    text: 'No task list'
                },
                owner: github.context.repo.owner,
                repo: github.context.repo.repo
            });
            return;
        }
        const result = (0, utils_1.removeIgnoreTaskLitsText)(body);
        core.debug('creates a list of tasks which removed ignored task: ');
        core.debug(result);
        const isTaskCompleted = result.match(/(- \[[ ]\].+)/g) === null;
        const text = (0, utils_1.createTaskListText)(result);
        core.debug('creates a list of completed tasks and uncompleted tasks: ');
        core.debug(text);
        await githubApi.checks.create({
            name: appName,
            // eslint-disable-next-line @typescript-eslint/camelcase
            head_sha: (_c = github.context.payload.pull_request) === null || _c === void 0 ? void 0 : _c.head.sha,
            status: 'completed',
            conclusion: isTaskCompleted ? 'success' : 'failure',
            // eslint-disable-next-line @typescript-eslint/camelcase
            completed_at: new Date().toISOString(),
            output: {
                title: appName,
                summary: isTaskCompleted
                    ? 'All tasks are completed!'
                    : 'Some tasks are uncompleted!',
                text
            },
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        });
        if (!isTaskCompleted) {
            throw new Error('Not all tasks completed');
        }
    }
    catch (error) {
        const message = (error === null || error === void 0 ? void 0 : error.message) || error || 'Something went wrong';
        core.setFailed(message);
    }
}
run();
