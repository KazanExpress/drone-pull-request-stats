const { t } = require('../../i18n');
const { postToWebhook } = require('../../fetchers');
const buildPayload = require('./buildPayload');

module.exports = async ({
  org,
  repos,
  webhook,
  reviewers,
  periodLength,
}) => {
  if (!webhook) {
    console.debug(t('integrations.webhook.logs.notConfigured'));
    return;
  }

  const payload = buildPayload({
    org,
    repos,
    reviewers,
    periodLength,
  });

  const params = { payload, webhook };

  console.debug(t('integrations.webhook.logs.posting', {
    params: JSON.stringify(params, null, 2),
  }));

  await postToWebhook({ payload, webhook }).catch((error) => {
    console.error(t('integrations.webhook.errors.requestFailed', { error }));
    throw error;
  });

  console.debug(t('integrations.webhook.logs.success'));
};
