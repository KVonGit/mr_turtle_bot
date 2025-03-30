const snoowrap = require('snoowrap');
const config = require('./config.json');
const axios = require('axios');
const cron = require('node-cron');

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
/*
  // Example: Get the top posts from a subreddit
r.getSubreddit('MyNameIsEarlFans').getHot().then(posts => {
	const topTen = [];
	posts.forEach(post => {
	  console.log(post.title);
	  topTen.push(post.title);
	});
    r.getSubreddit('MrTurtleBot_Prototype').submitSelfpost({ title: 'Top ranked MyNameIsEarlFans posts', text: '- ' + topTen.join('\n\n- ') })
		.then(post => {
			console.log(`Post submitted: ${post.url}`);
		})
		.catch(console.error);
  }).catch(console.error);
*/
const SUBREDDIT = 'MrTurtleBot_Prototype';
const SHOW_ID = '678';

async function fetchLatestEpisode(seasonNumber = "3") {
    try {
        const response = await axios.get(`https://api.tvmaze.com/shows/${SHOW_ID}/episodes`);
        const allEpisodes = response.data;
        
        // Filter episodes by the specified season
        const seasonEpisodes = allEpisodes.filter(ep => ep.season.toString() === seasonNumber);
        
        if (seasonEpisodes.length === 0) {
            console.error(`No episodes found for season ${seasonNumber}`);
            return null;
        }
        
        // Get today's date
        const today = new Date();
        
        // Filter episodes that have aired before today
        const airedEpisodes = seasonEpisodes.filter(ep => {
            const airDate = new Date(ep.airdate);
            return airDate <= today;
        });
        
        if (airedEpisodes.length === 0) {
            console.error(`No episodes from season ${seasonNumber} have aired yet`);
            return null;
        }
        
        // Sort the aired episodes by airdate in descending order
        airedEpisodes.sort((a, b) => new Date(b.airdate) - new Date(a.airdate));
        
        // Get the latest aired episode
        const latestEpisode = airedEpisodes[0];
        
        return {
            title: latestEpisode.name,
            airDate: latestEpisode.airdate,
            summary: latestEpisode.summary.replace(/<\/?[^>]+(>|$)/g, ""),
            season: seasonNumber,
            episode: latestEpisode.number,
        };
    } catch (error) {
        console.error('Error fetching episode:', error);
        return null;
    }
}

// Update postToReddit to accept a season parameter
async function postToReddit(seasonNumber = "3") {
    const episode = await fetchLatestEpisode(seasonNumber);
    if (!episode) return;

    const title = `New Episode: ${episode.title} (S${episode.season}E${episode.episode})`;
    const body = `📅 **Aired on:** ${episode.airDate}\n\n📝 **Summary:** ${episode.summary}`;

    try {
        await r.getSubreddit(SUBREDDIT).submitSelfpost({ title, text: body });
        console.log(`Posted to r/${SUBREDDIT}: ${title}`);
    } catch (error) {
        console.error('Error posting to Reddit:', error);
    }
}

// Call with specific season
postToReddit("3");