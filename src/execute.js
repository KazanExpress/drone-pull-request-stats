const core = require('@actions/core');
const github = require('@actions/github');
const { subtractDaysToDate } = require('./utils');
const { Telemetry } = require('./services');
const { fetchPullRequestById } = require('./fetchers');
const {
  getPulls,
  buildTable,
  postComment,
  getReviewers,
  buildComment,
  setUpReviewers,
  alreadyPublished,
  postSlackMessage,
  postWebhook,
} = require('./interactors');
const { split } = require('lodash');

const run = async (params) => {
  const {
    org,
    currentRepo,
    repos,
    limit,
    sortBy,
    octokit,
    publishAs,
    periodLength,
    disableLinks,
    personalToken,
    displayCharts,
    pullRequestId,
  } = params;

  parts = split(currentRepo, "/");

  const pullRequest = pullRequestId
    ? await fetchPullRequestById(octokit, pullRequestId, parts[0], parts[1])
    : null;


  if (alreadyPublished(pullRequest)) {
    console.info('Skipping execution because stats are published already');
    return;
  }

  const pulls = await getPulls({
    org,
    repos,
    octokit: github.getOctokit(personalToken),
    startDate: subtractDaysToDate(new Date(), periodLength),
  });
  console.info(`Found ${pulls.length} pull requests to analyze`);

  const reviewersRaw = getReviewers(pulls);
  console.info(`Analyzed stats for ${reviewersRaw.length} pull request reviewers`);

  const reviewers = setUpReviewers({
    limit,
    sortBy,
    periodLength,
    reviewers: reviewersRaw,
  });

  const table = buildTable({ reviewers, disableLinks, displayCharts });
  console.debug('Stats table built successfully');

  const content = buildComment({
    table, periodLength, org, repos,
  });
  // console.debug(`Commit content built successfully: ${content}`);

  await postWebhook({ ...params, core, reviewers });
  await postSlackMessage({
    ...params,
    core,
    reviewers,
    pullRequest,
  });
  if (!pullRequestId) return;
  await postComment({
    octokit,
    content,
    publishAs,
    pullRequestId: pullRequest.id,
    currentBody: pullRequest.body,
  });
  console.debug('Posted comment successfully');
};

module.exports = async (params) => {
  console.debug(`Params: ${JSON.stringify(params, null, 2)}`);

  const { githubToken, org, repos } = params;
  const octokit = github.getOctokit(githubToken);
  const isSponsor = true
  const telemetry = new Telemetry({ core, isSponsor, telemetry: params.telemetry });

  try {
    telemetry.start(params);
    await run({ ...params, isSponsor, octokit });
    telemetry.success();
  } catch (error) {
    telemetry.error(error);
    throw error;
  }
};
