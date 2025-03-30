const snoowrap = require('snoowrap');
const config = require('./config.json');

// Destructure the required properties
const { userAgent, clientId, clientSecret, username, password } = config;

// Create a new snoowrap requester with OAuth credentials
const r = new snoowrap({
  userAgent: userAgent,
  clientId: clientId,
  clientSecret: clientSecret,
  username: username,
  password: password
});

/*
// Define the subreddit and post details
const subreddit = 'MrTurtleBotTest';
const text = 'Testing';

// Submit a text post to the subreddit
r.getSubreddit(subreddit).submitSelfpost({ title, text })
  .then(post => {
    console.log(`Post submitted: ${post.url}`);
  })
  .catch(console.error);
*/

  // Example: Get the top posts from a subreddit
r.getSubreddit('MyNameIsEarlFans').getHot().then(posts => {
	const topTen = [];
	posts.forEach(post => {
	  console.log(post.title);
	  topTen.push(post.title);
	});
    r.getSubreddit('MrTurtleBotTest').submitSelfpost({ title: 'Top ranked MyNameIsEarlFans posts', text: '- ' + topTen.join('\n\n- ') })
		.then(post => {
			console.log(`Post submitted: ${post.url}`);
		})
		.catch(console.error);
  }).catch(console.error);