const snoowrap = require('snoowrap');
const config = require('./config.json');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

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

const SUBREDDIT = 'MrTurtleBot_Prototype';
const SHOW_ID = '678';
const STATE_FILE = path.join(__dirname, 'episodeState.json');

// Function to read the current state
function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } else {
      // Default state if file doesn't exist
      const defaultState = { currentSeason: 1, currentEpisode: 0 };
      fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2));
      return defaultState;
    }
  } catch (error) {
    console.error('Error reading state file:', error);
    return { currentSeason: 1, currentEpisode: 0 };
  }
}

// Function to save the current state
function saveState(season, episode) {
  try {
    const state = { currentSeason: season, currentEpisode: episode };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`State updated: Season ${season}, Episode ${episode}`);
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// Function to format date to MM-DD-YYYY
function formatDate(dateString) {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

// Modified Reddit posting code
async function postNextEpisode() {
  try {
    // Read the current state
    const state = readState();
    
    // Fetch all episodes
    const response = await axios.get(`https://api.tvmaze.com/shows/${SHOW_ID}/episodes`);
    const allEpisodes = response.data;
    
    // Sort episodes by season and episode number
    allEpisodes.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.number - b.number;
    });
    
    // Find the next episode
    const nextEpisode = allEpisodes.find(ep => 
      (ep.season > state.currentSeason) || 
      (ep.season === state.currentSeason && ep.number > state.currentEpisode)
    );
    
    if (!nextEpisode) {
      console.log('No more episodes to post - end of series reached');
      return;
    }
    
    // Create the post
    const title = `Episode Discussion: ${nextEpisode.name} (S${nextEpisode.season}E${nextEpisode.number})`;
    const body = `
📺 **My Name Is Earl - 20th Anniversary Rewatch** 📺

## S${nextEpisode.season}E${nextEpisode.number}: ${nextEpisode.name}

📅 **Original Air Date:** ${formatDate(nextEpisode.airdate)}

📝 **Summary:** ${nextEpisode.summary.replace(/<\/?[^>]+(>|$)/g, "")}

---

*This is part of our weekly episode discussion series for the show's 20th anniversary.*
`;

    // Post to Reddit and capture the submission object
    const submission = await r.getSubreddit(SUBREDDIT).submitSelfpost({ title, text: body });
    console.log(`Posted to r/${SUBREDDIT}: ${title}`);

    // Try to pin the post, but handle errors gracefully
    try {
      await submission.sticky({ num: 1 });
      console.log('Post has been pinned to the top of the subreddit');
    } catch (pinError) {
      console.log('Note: Could not pin post - bot account needs moderator permissions');
    }
    
    // Update the state with the episode we just posted
    saveState(nextEpisode.season, nextEpisode.number);
    
  } catch (error) {
    console.error('Error posting episode:', error);
  }
}

// Function to initialize or reset the state
function setStartingPoint(season, episode) {
  saveState(season, episode);
  console.log(`Starting point set to Season ${season}, Episode ${episode}`);
}

// Schedule weekly posts (e.g., every Monday at 9:00 AM)
cron.schedule('29 19 * * 7', () => {
  console.log('Running scheduled episode post...' + new Date().toLocaleString());
  postNextEpisode();
});

console.log('MrTurtleBot is running...');

// Uncomment these lines to test/manually control the bot
// setStartingPoint(1, 0);  // Set starting point (will post S1E1 next)
// postNextEpisode();       // Post immediately instead of waiting for schedule

/**
 * ## How to use this script:

1. The first time you run it, use `setStartingPoint(1, 0)` to initialize the state (this will start with Season 1, Episode 1)
2. Run `postNextEpisode()` for your first post or wait for the scheduled time
3. The bot will automatically track which episode it last posted
4. It will post one episode per week on Mondays at 9 AM (you can customize this schedule)

## Key features:

- Maintains a simple state file to track the current episode
- Posts episodes in sequence regardless of air date
- Includes a formatted body with the episode information
- Uses cron to schedule regular weekly posts
- Allows you to set a specific starting point for the series


## Cron Schedule for Weekly Posts

This line of code sets up an automated task using cron scheduling in a JavaScript application. The `cron.schedule()` function takes two parameters: a cron expression and a callback function.

The cron expression `'0 9 * * 1'` specifies exactly when this task should run:
- `0` - At the 0th minute (top of the hour)
- `9` - At the 9th hour (9 AM)
- `*` - Every day of the month
- `*` - Every month
- `1` - Monday (in cron syntax, 1 represents Monday)

So this schedules a task to run every Monday at 9:00 AM precisely. The arrow function `() => {` that follows would contain the code that will execute at that time - presumably code that creates and publishes weekly posts, though that implementation isn't shown in the selection.

This is a common pattern in JavaScript applications that need to perform regular, scheduled tasks like sending newsletters, posting content, or running maintenance operations.

 */