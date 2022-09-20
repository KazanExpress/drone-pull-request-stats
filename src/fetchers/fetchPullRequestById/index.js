const parsePullRequest = require('./parser');

const PR_BY_ID_QUERY = `
query ($number: Int!, $name: String!, $owner: String!) {
  repository(name: $name, owner: $owner) {
    id
    pullRequest(number: $number) {
      id
      url
      body
      number
      comments(last: 100) {
        nodes {
          author {
            login
          }
          body
        }
      }
    }
  }
}
`;

module.exports = (octokit, number, repoOwner, repoName) => {
  const variables = { number, owner: repoOwner, name: repoName };
  return octokit
    .graphql(PR_BY_ID_QUERY, variables)
    .then(parsePullRequest)
    .catch((error) => {
      const msg = `Error fetching pull requests with id "${number} for ${repoOwner}/${repoName}"`;
      throw new Error(`${msg}. Error: ${error}`);
    });
};
