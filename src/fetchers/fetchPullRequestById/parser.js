const get = require('lodash.get');

const parseComments = (node) => ({
  ...node,
});

module.exports = (data) => ({
  id: get(data, 'repository.pullRequest.id'),
  comments: (get(data, 'repository.pullRequest.comments.nodes') || []).map(parseComments),
});
