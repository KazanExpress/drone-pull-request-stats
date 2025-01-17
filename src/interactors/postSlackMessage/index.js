const { t } = require('../../i18n');
const { postToSlack } = require('../../fetchers');
const buildSlackMessage = require('./buildSlackMessage');
const splitInChunks = require('./splitInChunks');

module.exports = async ({
  org,
  repos,
  slack,
  isSponsor,
  reviewers,
  periodLength,
  disableLinks,
  displayCharts,
  pullRequest = null,
}) => {
  const { webhook, channel } = slack || {};

  if (!webhook || !channel) {
    console.debug(t('integrations.slack.logs.notConfigured'));
    return;
  }

  if (!isSponsor) {
    console.error(t('integrations.slack.errors.notSponsor'));
    return;
  }

  const send = (message) => {
    const params = {
      webhook,
      channel,
      message,
      iconUrl: t('table.icon'),
      username: t('table.title'),
    };
    console.debug(t('integrations.slack.logs.posting', {
      params: JSON.stringify(params, null, 2),
    }));
    return postToSlack(params);
  };

  const fullMessage = buildSlackMessage({
    org,
    repos,
    reviewers,
    pullRequest,
    periodLength,
    disableLinks,
    displayCharts,
  });

  const chunks = splitInChunks(fullMessage);
  await chunks.reduce(async (promise, message) => {
    await promise;
    return send(message).catch((error) => {
      console.error(t('integrations.slack.errors.requestFailed', { error }));
      throw error;
    });
  }, Promise.resolve());

  console.debug(t('integrations.slack.logs.success'));
};
