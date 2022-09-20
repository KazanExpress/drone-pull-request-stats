const { upperCase, replace, toInteger } = require('lodash');
const execute = require('./execute');
const { t } = require('./i18n');

const constCase = (str) => {
  const s = upperCase(str);
  return replace(replace(s, '-', '_'), ' ', '_');
};

const parseArray = (value) => value.split(',');

const getEnv = (env) => {
  const val = process.env[env];
  if (val) {
    return val;
  }
  throw new Error(`${env} env var must be set!`);
};

const getEnvOrDefault = (env, def) => {
  const val = process.env[env];
  if (val) {
    return val;
  }
  return def;
};

const getInput = (param) => getEnv(`PLUGIN_${constCase(param)}`);

const getInputOrDefault = (param, def) => getEnvOrDefault(`PLUGIN_${constCase(param)}`, def);

const getPeriod = () => {
  const MAX_PERIOD_DATE = 365;
  const value = parseInt(getInputOrDefault('period', `${MAX_PERIOD_DATE}`), 10);
  return Math.min(value, MAX_PERIOD_DATE);
};

const getRepositories = (currentRepo) => {
  const input = getInputOrDefault('repositories', '');
  return input ? parseArray(input) : [currentRepo];
};

const getBoolInput = (param) => {
  const val = getInputOrDefault(param, 'false');
  return val === 'true';
};

const getParams = () => {
  const currentRepo = getEnv('DRONE_REPO');
  const personalToken = getInput('github_token');
  const githubToken = personalToken;

  return {
    currentRepo,
    githubToken,
    personalToken,
    org: getInputOrDefault('organization', null),
    repos: getRepositories(currentRepo),
    sortBy: getInputOrDefault('sort-by', 'REVIEWS'),
    publishAs: getInputOrDefault('publish-as', 'COMMENT'),
    periodLength: getPeriod(),
    displayCharts: getBoolInput('charts'),
    disableLinks: getBoolInput('disable-links'),
    pullRequestId: toInteger(getEnv('DRONE_PULL_REQUEST')),
    limit: parseInt(getInputOrDefault('limit', '0'), 10),
    telemetry: getBoolInput('telemetry'),
    webhook: getInputOrDefault('webhook', null),
    slack: {
      webhook: getInputOrDefault('slack-webhook', null),
      channel: getInputOrDefault('slack-channel', null),
    },
  };
};

const run = async () => {
  try {
    await execute(getParams());
    console.info(t('execution.logs.success'));
    console.info(t('execution.logs.news'));
  } catch (error) {
    console.debug(t('execution.errors.main', error));
    console.debug(error.stack);
  }
};

run();
