"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskListText = exports.removeIgnoreTaskLitsText = void 0;
function removeIgnoreTaskLitsText(text) {
    return text.replace(/<!-- ignore-task-list-start -->[\s| ]*(- \[[x| ]\] .+[\s| ]*)+<!-- ignore-task-list-end -->/g, '');
}
exports.removeIgnoreTaskLitsText = removeIgnoreTaskLitsText;
function createTaskListText(body) {
    const completedTasks = body.match(/(- \[[x]\].+)/g);
    const uncompletedTasks = body.match(/(- \[[ ]\].+)/g);
    let text = '';
    if (completedTasks !== null) {
        for (let index = 0; index < completedTasks.length; index++) {
            if (index === 0) {
                text += '## :white_check_mark: Completed Tasks\n';
            }
            text += `${completedTasks[index]}\n`;
        }
    }
    if (uncompletedTasks !== null) {
        for (let index = 0; index < uncompletedTasks.length; index++) {
            if (index === 0) {
                text += '## :x: Uncompleted Tasks\n';
            }
            text += `${uncompletedTasks[index]}\n`;
        }
    }
    return text;
}
exports.createTaskListText = createTaskListText;
