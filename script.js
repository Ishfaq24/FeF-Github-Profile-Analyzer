const historyList = document.getElementById('historyList');
    const clearHistoryButton = document.getElementById('clearHistory');
    const themeToggleButton = document.getElementById('themeToggle');
    const body = document.body;

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

    // Toggle theme and save it
    themeToggleButton.addEventListener('click', () => {
        body.classList.toggle('dark');
        body.classList.toggle('light');

        const currentTheme = body.classList.contains('dark') ? 'dark' : 'light';
        saveTheme(currentTheme);
    });

    // Initialize theme on page load
    loadTheme();

    document.getElementById('submit').addEventListener('click', () => {
        const username = document.getElementById('username').value;
        if (username) {
            addToSearchHistory(username);
            fetchGitHubData(username);
        } else {
            showError('Please enter a GitHub username.');
        }
    });

    clearHistoryButton.addEventListener('click', () => {
        localStorage.removeItem('searchHistory');
        updateSearchHistory();
    });

    function addToSearchHistory(username) {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        if (!history.includes(username)) {
            history.push(username);
            localStorage.setItem('searchHistory', JSON.stringify(history));
            updateSearchHistory();
        }
    }


    function updateSearchHistory() {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        historyList.innerHTML = history.map(user => `
            <li><button class="history-item" data-username="${user}">${user}</button></li>
        `).join('');

        // Add click event listener to each history item
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const username = e.target.getAttribute('data-username');
                document.getElementById('username').value = username; // Set the input to the clicked username
                fetchGitHubData(username); // Call the function to fetch data for the clicked username
            });
        });
    }


    function fetchGitHubData(username) {
        const profileUrl = `https://api.github.com/users/${username}`;
        const reposUrl = `https://api.github.com/users/${username}/repos`;

        fetch(profileUrl)
            .then(response => {
                if (response.status === 404) {
                    showError('GitHub user not found.');
                    throw new Error('User not found');
                }
                return response.json();
            })
            .then(data => updateProfile(data))
            .catch(error => console.error('Error fetching profile:', error));

        fetch(reposUrl)
            .then(response => response.json())
            .then(data => {
                updateRepositories(data);
                updateLanguagesChart(data);
            })
            .catch(error => console.error('Error fetching repositories:', error));
    }

    function updateProfile(profile) {
    const profileContainer = document.getElementById('profile');
    if (!profile) {
        showError('Profile data is not available.');
        return;
    }

    profileContainer.innerHTML = `
        <a href="${profile.html_url}" target="_blank">
            <img src="${profile.avatar_url}" alt="${profile.login}" width="150">
        </a>
        <h3><a href="${profile.html_url}" target="_blank">${profile.name || profile.login}</a></h3>
        <p>Followers: ${profile.followers}</p>
        <p>Following: ${profile.following}</p>
        <p>Public Repos: ${profile.public_repos}</p>
    `;
    document.getElementById('error').textContent = '';
}

    function updateRepositories(repositories) {
        const repoContainer = document.getElementById('repositories');
        if (repositories.length === 0) {
            repoContainer.innerHTML = `<p>No public repositories found.</p>`;
            return;
        }
        repoContainer.innerHTML = repositories.map(repo => `
            <div>
                <strong><a href="${repo.html_url}" target="_blank">${repo.name}</a></strong>
                <p>${repo.description || 'No description'}</p>
                <p>Language: ${repo.language || 'Not specified'}</p>
            </div>
        `).join('');
    }

    function updateLanguagesChart(repositories) {
        const languageCount = {};
        repositories.forEach(repo => {
            const language = repo.language;
            if (language) {
                languageCount[language] = (languageCount[language] || 0) + 1;
            }
        });

        const ctx = document.getElementById('languagesChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(languageCount),
                datasets: [{
                    label: 'Languages Used',
                    data: Object.values(languageCount),
                    backgroundColor: ['#1e90ff', '#ff6347', '#32cd32', '#ffa500', '#ff69b4'],
                }]
            }
        });
    }

    function showError(message) {
        document.getElementById('error').textContent = message;
    }

    // Initialize search history on load
    updateSearchHistory();
