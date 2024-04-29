import { getProjectId } from './tests/setup-env';

module.exports = async function (globalConfig: any, projectConfig: any) {

    // called here to create a project if needed before the tests run.
    const project_id = await getProjectId();
};