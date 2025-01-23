 // Theme Management
        const themeToggle = document.getElementById('themeToggle');
        const body = document.body;

        function loadTheme() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            body.className = savedTheme;
            themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '🌞';
        }

        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('dark') ? 'light' : 'dark';
            body.className = newTheme;
            themeToggle.textContent = newTheme === 'dark' ? '🌙' : '🌞';
            localStorage.setItem('theme', newTheme);
        });

        // Sidebar Management
        const burgerMenu = document.getElementById('burgerMenu');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const closeMenu = document.getElementById('closeMenu');

        function toggleSidebar() {
            sidebar.classList.toggle('active');
            overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
        }

        burgerMenu.addEventListener('click', toggleSidebar);
        closeMenu.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);

        // Search History
        const historyList = document.getElementById('historyList');
        const clearHistoryButton = document.getElementById('clearHistory');

        function saveSearchHistory(username) {
            const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            if (!history.includes(username)) {
                history.unshift(username);
                localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
            }
            displaySearchHistory();
        }

        function displaySearchHistory() {
            const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            historyList.innerHTML = history.map(username => `
                <li>
                    <button onclick="loadSearch('${username}')">${username}</button>
                </li>
            `).join('');
        }

        function loadSearch(username) {
            document.getElementById('username').value = username;
            fetchGitHubProfile(username);
            toggleSidebar();
        }

        clearHistoryButton.addEventListener('click', () => {
            localStorage.removeItem('searchHistory');
            displaySearchHistory();
        });

        // GitHub Integration
        let chartInstance = null;

        async function fetchGitHubProfile(username) {
            try {
                const [profileRes, reposRes] = await Promise.all([
                    fetch(`https://api.github.com/users/${username}`),
                    fetch(`https://api.github.com/users/${username}/repos`)
                ]);

                if (!profileRes.ok) throw new Error('User not found');
                if (!reposRes.ok) throw new Error('Failed to load repositories');

                const profile = await profileRes.json();
                const repos = await reposRes.json();

                displayProfile(profile);
                displayRepositories(repos);
                updateLanguageChart(repos);
                saveSearchHistory(username);
                document.getElementById('error').textContent = '';
            } catch (error) {
                document.getElementById('error').textContent = error.message;
                if (chartInstance) chartInstance.destroy();
            }
        }

        function displayProfile(profile) {
            document.getElementById('profile').innerHTML = `
                <img src="${profile.avatar_url}" alt="${profile.login}">
                <h3>${profile.name || profile.login}</h3>
                <p>${profile.bio || 'No bio available'}</p>
                <p>📌 ${profile.location || 'No location specified'}</p>
                <p>👥 Followers: ${profile.followers} | Following: ${profile.following}</p>
                <a href="${profile.html_url}" target="_blank">View Profile →</a>
            `;
        }

        function displayRepositories(repos) {
            const sortedRepos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
            document.getElementById('repositories').innerHTML = sortedRepos.slice(0, 5).map(repo => `
                <div>
                    <h4><a href="${repo.html_url}" target="_blank">${repo.name}</a></h4>
                    <p>${repo.description || 'No description available'}</p>
                    <p>⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} | 📅 ${new Date(repo.updated_at).toLocaleDateString()}</p>
                    <p>${repo.language ? `🔧 Main Language: ${repo.language}` : ''}</p>
                </div>
            `).join('');
        }

        function updateLanguageChart(repos) {
            const ctx = document.getElementById('languagesChart').getContext('2d');
            const languages = repos.reduce((acc, repo) => {
                if (repo.language) acc[repo.language] = (acc[repo.language] || 0) + 1;
                return acc;
            }, {});

            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(languages),
                    datasets: [{
                        data: Object.values(languages),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#E7E9ED'
                        ],
                        borderColor: body.classList.contains('dark') ? '#161b22' : '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: body.classList.contains('dark') ? '#c9d1d9' : '#121212'
                            }
                        }
                    }
                }
            });
        }

        // Initialization
        document.getElementById('submit').addEventListener('click', () => {
            const username = document.getElementById('username').value.trim();
            if (username) fetchGitHubProfile(username);
        });

        loadTheme();
        displaySearchHistory();
