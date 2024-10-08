const historyList = document.getElementById('historyList');
const clearHistoryButton = document.getElementById('clearHistory');
const themeToggleButton = document.getElementById('themeToggle');
const body = document.body;
let languagesChart;

// Check for saved theme in localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.remove('dark', 'light');
        body.classList.add(savedTheme);
    }
}

// Save the current theme to localStorage
function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

// Toggle between dark and light mode
themeToggleButton.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark') ? 'light' : 'dark';
    body.classList.toggle('dark', newTheme === 'dark');
    body.classList.toggle('light', newTheme === 'light');
    saveTheme(newTheme);
});

// Load theme on page load
loadTheme();

document.getElementById('submit').addEventListener('click', function () {
    const username = document.getElementById('username').value.trim();
    if (username) {
        fetchGitHubProfile(username);
        saveSearchHistory(username);
    }
});

clearHistoryButton.addEventListener('click', clearSearchHistory);

function saveSearchHistory(username) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history.unshift(username);
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
    displaySearchHistory();
}

function displaySearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    historyList.innerHTML = '';
    history.forEach(username => {
        const listItem = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = username;
        button.onclick = () => {
            document.getElementById('username').value = username;
            fetchGitHubProfile(username);
        };
        listItem.appendChild(button);
        historyList.appendChild(listItem);
    });
}

function clearSearchHistory() {
    localStorage.removeItem('searchHistory');
    displaySearchHistory();
}

async function fetchGitHubProfile(username) {
    try {
        const profileResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!profileResponse.ok) {
            throw new Error('User not found');
        }
        const profileData = await profileResponse.json();
        updateProfile(profileData);
        fetchRepositories(username);
    } catch (error) {
        document.getElementById('error').textContent = error.message;
    }
}

async function fetchRepositories(username) {
    try {
        const repoResponse = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!repoResponse.ok) {
            throw new Error('Error fetching repositories');
        }
        const reposData = await repoResponse.json();
        updateRepositories(reposData);
        updateLanguagesChart(reposData);
    } catch (error) {
        document.getElementById('error').textContent = error.message;
    }
}

function updateProfile(data) {
    document.getElementById('profile').innerHTML = `
        <img src="${data.avatar_url}" alt="${data.login}'s avatar">
        <h3>${data.name || 'No name provided'}</h3>
        <p>${data.bio || 'No bio provided'}</p>
        <a href="${data.html_url}" target="_blank">View GitHub Profile</a>
    `;
}

function updateRepositories(repos) {
    const repositoriesDiv = document.getElementById('repositories');
    repositoriesDiv.innerHTML = repos.map(repo => `
        <div>
            <h4><a href="${repo.html_url}" target="_blank">${repo.name}</a></h4>
            <p>${repo.description || 'No description'}</p>
            <p>Language: ${repo.language || 'Not specified'}</p>
        </div>
    `).join('');
}

function updateLanguagesChart(repos) {
    const languageCounts = {};
    repos.forEach(repo => {
        if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        }
    });

    // Check if there is any language data to display
    if (Object.keys(languageCounts).length === 0) {
        document.getElementById('languagesChart').style.display = 'none';
        document.getElementById('error').textContent = 'No language data available to display.';
        return;
    } else {
        document.getElementById('languagesChart').style.display = 'block';
    }

    const ctx = document.getElementById('languagesChart').getContext('2d');

    // Destroy existing chart if it exists
    if (languagesChart) {
        languagesChart.destroy();
    }

    languagesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(languageCounts),
            datasets: [{
                data: Object.values(languageCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// Display search history on load
displaySearchHistory();
