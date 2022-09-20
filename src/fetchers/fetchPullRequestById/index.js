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

module.exports = (octokit, number, repo_owner, repo_name) => {
  const variables = { number: number, owner: repo_owner, name: repo_name};
  return octokit
    .graphql(PR_BY_ID_QUERY, variables)
    .then(parsePullRequest)
    .catch((error) => {
      const msg = `Error fetching pull requests with id "${number} for ${repo_owner}/${repo_name}"`;
      throw new Error(`${msg}. Error: ${error}`);
    });
};
