/**
 * Analytics Dashboard JavaScript
 * Handles data loading, chart rendering, and interactive elements
 */

const AnalyticsDashboard = {
    // Configuration
    config: {
        apiEndpoints: {
            profileViews: '/api/analytics/profile-views',
            matchStats: '/api/analytics/match-stats',
            profilePerformance: '/api/analytics/profile-performance',
            activityHeatmap: '/api/analytics/activity-heatmap',
            interestAnalytics: '/api/analytics/interest-analytics',
            recommendations: '/api/analytics/recommendations'
        },
        chartColors: {
            primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
            secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim(),
            success: getComputedStyle(document.documentElement).getPropertyValue('--success').trim(),
            warning: getComputedStyle(document.documentElement).getPropertyValue('--warning').trim(),
            danger: getComputedStyle(document.documentElement).getPropertyValue('--danger').trim(),
            textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
            textSecondary: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
            bgCard: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim(),
        },
        chartOptions: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 10,
                    cornerRadius: 4,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    displayColors: false
                }
            }
        },
        heatmapColors: [
            '#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'
        ],
        animationDuration: 800
    },
    
    // State
    state: {
        charts: {},
        data: {},
        timeRange: '30d', // Default time range
        isLoading: true
    },
    
    // DOM Elements
    elements: {},
    
    /**
     * Initialize the dashboard
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadAllData();
    },
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Charts
        this.elements.viewsChart = document.getElementById('views-chart');
        this.elements.matchRateChart = document.getElementById('match-rate-chart');
        this.elements.matchSourcesChart = document.getElementById('match-sources-chart');
        this.elements.interestMatchChart = document.getElementById('interest-match-chart');
        this.elements.popularInterestsChart = document.getElementById('popular-interests-chart');
        
        // Stats
        this.elements.totalViews = document.getElementById('total-views');
        this.elements.avgDailyViews = document.getElementById('avg-daily-views');
        this.elements.viewsChange = document.getElementById('views-change');
        this.elements.totalMatches = document.getElementById('total-matches');
        this.elements.matchRate = document.getElementById('match-rate');
        this.elements.conversionRate = document.getElementById('conversion-rate');
        
        // Profile Performance
        this.elements.completenessPercentage = document.getElementById('completeness-percentage');
        this.elements.completenessProgress = document.getElementById('completeness-progress');
        this.elements.completenessItems = document.getElementById('completeness-items');
        this.elements.engagementScore = document.getElementById('engagement-score');
        this.elements.engagementProgress = document.getElementById('engagement-score-progress');
        this.elements.visibilityScore = document.getElementById('visibility-score');
        this.elements.visibilityProgress = document.getElementById('visibility-score-progress');
        
        // Insights
        this.elements.profileStrengths = document.getElementById('profile-strengths');
        this.elements.profileWeaknesses = document.getElementById('profile-weaknesses');
        
        // Heatmap
        this.elements.activityHeatmap = document.getElementById('activity-heatmap');
        this.elements.peakTimesList = document.getElementById('peak-times-list');
        
        // Interests
        this.elements.interestTags = document.getElementById('interest-tags');
        
        // Recommendations
        this.elements.recommendationsList = document.getElementById('recommendations-list');
        
        // Time range selectors
        this.elements.timeRangeSelectors = document.querySelectorAll('.time-range-selector');
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Time range selectors
        this.elements.timeRangeSelectors.forEach(selector => {
            selector.addEventListener('click', (e) => {
                e.preventDefault();
                const range = e.target.dataset.range;
                const section = e.target.dataset.section;
                
                // Update active state
                e.target.parentNode.querySelectorAll('.time-range-selector').forEach(el => {
                    el.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Reload data for the specific section
                this.loadSectionData(section, range);
            });
        });
        
        // Window resize event for chart responsiveness
        window.addEventListener('resize', this.handleResize.bind(this));
    },
    
    /**
     * Handle window resize event
     */
    handleResize() {
        // Update charts on window resize
        Object.values(this.state.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    },
    
    /**
     * Load all dashboard data
     */
    loadAllData() {
        this.showLoading();
        
        Promise.all([
            this.loadProfileViews(),
            this.loadMatchStats(),
            this.loadProfilePerformance(),
            this.loadActivityHeatmap(),
            this.loadInterestAnalytics(),
            this.loadRecommendations()
        ])
        .then(() => {
            this.hideLoading();
        })
        .catch(error => {
            console.error('Error loading analytics data:', error);
            this.hideLoading();
            this.showError('Failed to load some analytics data. Please try again later.');
        });
    },
    
    /**
     * Load data for a specific section
     */
    loadSectionData(section, timeRange) {
        this.showSectionLoading(section);
        
        let loadPromise;
        
        switch (section) {
            case 'profile-views':
                loadPromise = this.loadProfileViews(timeRange);
                break;
            case 'match-stats':
                loadPromise = this.loadMatchStats(timeRange);
                break;
            case 'activity':
                loadPromise = this.loadActivityHeatmap(timeRange);
                break;
            case 'interests':
                loadPromise = this.loadInterestAnalytics(timeRange);
                break;
            default:
                loadPromise = Promise.resolve();
        }
        
        loadPromise
            .then(() => {
                this.hideSectionLoading(section);
            })
            .catch(error => {
                console.error(`Error loading ${section} data:`, error);
                this.hideSectionLoading(section);
                this.showSectionError(section, 'Failed to load data. Please try again.');
            });
    },
    
    /**
     * Load profile views data and render chart
     */
    loadProfileViews(timeRange = this.state.timeRange) {
        return fetch(`${this.config.apiEndpoints.profileViews}?timeRange=${timeRange}`)
            .then(response => response.json())
            .then(data => {
                this.state.data.profileViews = data;
                this.renderProfileViewsChart(data);
                this.updateProfileViewsStats(data);
            });
    },
    
    /**
     * Load match statistics data and render charts
     */
    loadMatchStats(timeRange = this.state.timeRange) {
        return fetch(`${this.config.apiEndpoints.matchStats}?timeRange=${timeRange}`)
            .then(response => response.json())
            .then(data => {
                this.state.data.matchStats = data;
                this.renderMatchRateChart(data);
                this.renderMatchSourcesChart(data);
                this.updateMatchStats(data);
            });
    },
    
    /**
     * Load profile performance data
     */
    loadProfilePerformance() {
        return fetch(this.config.apiEndpoints.profilePerformance)
            .then(response => response.json())
            .then(data => {
                this.state.data.profilePerformance = data;
                this.renderProfileCompleteness(data);
                this.renderPerformanceScores(data);
                this.renderProfileInsights(data);
            });
    },
    
    /**
     * Load activity heatmap data
     */
    loadActivityHeatmap(timeRange = this.state.timeRange) {
        return fetch(`${this.config.apiEndpoints.activityHeatmap}?timeRange=${timeRange}`)
            .then(response => response.json())
            .then(data => {
                this.state.data.activityHeatmap = data;
                this.renderActivityHeatmap(data);
                this.renderPeakTimes(data);
            });
    },
    
    /**
     * Load interest analytics data
     */
    loadInterestAnalytics(timeRange = this.state.timeRange) {
        return fetch(`${this.config.apiEndpoints.interestAnalytics}?timeRange=${timeRange}`)
            .then(response => response.json())
            .then(data => {
                this.state.data.interestAnalytics = data;
                this.renderInterestMatchChart(data);
                this.renderPopularInterestsChart(data);
                this.renderInterestTags(data);
            });
    },
    
    /**
     * Load personalized recommendations
     */
    loadRecommendations() {
        return fetch(this.config.apiEndpoints.recommendations)
            .then(response => response.json())
            .then(data => {
                this.state.data.recommendations = data;
                this.renderRecommendations(data);
            });
    },
    
    /**
     * Render profile views chart
     */
    renderProfileViewsChart(data) {
        const ctx = this.elements.viewsChart.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.state.charts.viewsChart) {
            this.state.charts.viewsChart.destroy();
        }
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(var(--primary-rgb), 0.4)');
        gradient.addColorStop(1, 'rgba(var(--primary-rgb), 0.05)');
        
        this.state.charts.viewsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dailyViews.map(item => item.date),
                datasets: [{
                    label: 'Profile Views',
                    data: data.dailyViews.map(item => item.count),
                    borderColor: this.config.chartColors.primary,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: this.config.chartColors.primary,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...this.config.chartOptions,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 7
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                },
                animation: {
                    duration: this.config.animationDuration
                }
            }
        });
    },
    
    /**
     * Update profile views statistics
     */
    updateProfileViewsStats(data) {
        // Animate counting up
        this.animateCounter(this.elements.totalViews, 0, data.totalViews);
        this.animateCounter(this.elements.avgDailyViews, 0, data.averageDailyViews);
        
        // Update percentage change
        const changeElement = this.elements.viewsChange;
        const percentChange = data.percentageChange;
        
        changeElement.textContent = `${Math.abs(percentChange)}%`;
        changeElement.className = 'stat-change';
        
        if (percentChange > 0) {
            changeElement.classList.add('positive');
            changeElement.innerHTML = `<i class="fas fa-arrow-up"></i>${Math.abs(percentChange)}%`;
        } else if (percentChange < 0) {
            changeElement.classList.add('negative');
            changeElement.innerHTML = `<i class="fas fa-arrow-down"></i>${Math.abs(percentChange)}%`;
        } else {
            changeElement.innerHTML = `0%`;
        }
    },
    
    /**
     * Render match rate chart
     */
    renderMatchRateChart(data) {
        const ctx = this.elements.matchRateChart.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.state.charts.matchRateChart) {
            this.state.charts.matchRateChart.destroy();
        }
        
        this.state.charts.matchRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.matchRate.map(item => item.date),
                datasets: [{
                    label: 'Match Rate',
                    data: data.matchRate.map(item => item.rate),
                    borderColor: this.config.chartColors.secondary,
                    backgroundColor: 'rgba(var(--secondary-rgb), 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: this.config.chartColors.secondary,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...this.config.chartOptions,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 7
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                animation: {
                    duration: this.config.animationDuration
                }
            }
        });
    },
    
    /**
     * Render match sources chart
     */
    renderMatchSourcesChart(data) {
        const ctx = this.elements.matchSourcesChart.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.state.charts.matchSourcesChart) {
            this.state.charts.matchSourcesChart.destroy();
        }
        
        this.state.charts.matchSourcesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.matchSources.map(item => item.source),
                datasets: [{
                    data: data.matchSources.map(item => item.percentage),
                    backgroundColor: [
                        'rgba(var(--primary-rgb), 0.8)',
                        'rgba(var(--secondary-rgb), 0.8)',
                        'rgba(var(--success-rgb), 0.8)',
                        'rgba(var(--warning-rgb), 0.8)',
                        'rgba(var(--danger-rgb), 0.8)'
                    ],
                    borderColor: this.config.chartColors.bgCard,
                    borderWidth: 2
                }]
            },
            options: {
                ...this.config.chartOptions,
                cutout: '65%',
                plugins: {
                    ...this.config.chartOptions.plugins,
                    tooltip: {
                        ...this.config.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                animation: {
                    duration: this.config.animationDuration
                }
            }
        });
    },
    
    /**
     * Update match statistics
     */
    updateMatchStats(data) {
        // Animate counting up
        this.animateCounter(this.elements.totalMatches, 0, data.totalMatches);
        this.elements.matchRate.textContent = `${data.overallMatchRate}%`;
        this.elements.conversionRate.textContent = `${data.conversationRate}%`;
    },
    
    /**
     * Render profile completeness
     */
    renderProfileCompleteness(data) {
        // Update percentage
        this.elements.completenessPercentage.textContent = `${data.completeness.percentage}%`;
        
        // Animate progress bar
        setTimeout(() => {
            this.elements.completenessProgress.style.width = `${data.completeness.percentage}%`;
        }, 100);
        
        // Render completeness items
        this.elements.completenessItems.innerHTML = '';
        data.completeness.sections.forEach(section => {
            const item = document.createElement('div');
            item.className = 'section-item';
            
            const status = document.createElement('div');
            status.className = `section-status ${section.completed ? 'completed' : 'incomplete'}`;
            if (section.completed) {
                status.innerHTML = '<i class="fas fa-check"></i>';
            }
            
            const name = document.createElement('div');
            name.className = 'section-name';
            name.textContent = section.name;
            
            item.appendChild(status);
            item.appendChild(name);
            this.elements.completenessItems.appendChild(item);
        });
    },
    
    /**
     * Render performance scores
     */
    renderPerformanceScores(data) {
        // Engagement score
        this.elements.engagementScore.textContent = `${data.scores.engagement}/10`;
        setTimeout(() => {
            this.elements.engagementProgress.style.width = `${data.scores.engagement * 10}%`;
        }, 100);
        
        // Visibility score
        this.elements.visibilityScore.textContent = `${data.scores.visibility}/10`;
        setTimeout(() => {
            this.elements.visibilityProgress.style.width = `${data.scores.visibility * 10}%`;
        }, 300);
    },
    
    /**
     * Render profile insights
     */
    renderProfileInsights(data) {
        // Profile strengths
        this.elements.profileStrengths.innerHTML = '';
        data.insights.strengths.forEach(strength => {
            const li = document.createElement('li');
            li.textContent = strength;
            this.elements.profileStrengths.appendChild(li);
        });
        
        // Profile weaknesses
        this.elements.profileWeaknesses.innerHTML = '';
        data.insights.weaknesses.forEach(weakness => {
            const li = document.createElement('li');
            li.textContent = weakness;
            this.elements.profileWeaknesses.appendChild(li);
        });
    },
    
    /**
     * Render activity heatmap
     */
    renderActivityHeatmap(data) {
        // Clear existing heatmap
        this.elements.activityHeatmap.innerHTML = '';
        
        // Create heatmap grid
        // Add hour labels (top row)
        const hourLabelRow = document.createElement('div');
        hourLabelRow.className = 'heatmap-label';
        hourLabelRow.textContent = '';
        this.elements.activityHeatmap.appendChild(hourLabelRow);
        
        for (let hour = 0; hour < 24; hour++) {
            const hourLabel = document.createElement('div');
            hourLabel.className = 'heatmap-label';
            hourLabel.textContent = hour === 0 ? '12am' : 
                                   hour === 12 ? '12pm' : 
                                   hour < 12 ? `${hour}am` : 
                                   `${hour-12}pm`;
            this.elements.activityHeatmap.appendChild(hourLabel);
        }
        
        // Add day rows with activity cells
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach((day, dayIndex) => {
            // Add day label
            const dayLabel = document.createElement('div');
            dayLabel.className = 'heatmap-label';
            dayLabel.textContent = day;
            this.elements.activityHeatmap.appendChild(dayLabel);
            
            // Add hour cells for this day
            for (let hour = 0; hour < 24; hour++) {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                
                // Find activity level for this day and hour
                const activityData = data.heatmap.find(item => 
                    item.day === dayIndex && item.hour === hour
                );
                
                const activityLevel = activityData ? activityData.level : 0;
                cell.style.backgroundColor = this.config.heatmapColors[activityLevel];
                
                // Add tooltip data
                cell.dataset.day = day;
                cell.dataset.hour = hour === 0 ? '12am' : 
                                   hour === 12 ? '12pm' : 
                                   hour < 12 ? `${hour}am` : 
                                   `${hour-12}pm`;
                cell.dataset.level = activityLevel;
                
                // Add hover event for tooltip
                cell.addEventListener('mouseover', this.showHeatmapTooltip.bind(this));
                cell.addEventListener('mouseout', this.hideHeatmapTooltip.bind(this));
                
                this.elements.activityHeatmap.appendChild(cell);
            }
        });
    },
    
    /**
     * Show heatmap tooltip
     */
    showHeatmapTooltip(event) {
        const cell = event.target;
        const day = cell.dataset.day;
        const hour = cell.dataset.hour;
        const level = parseInt(cell.dataset.level);
        
        // Create tooltip if it doesn't exist
        let tooltip = document.getElementById('heatmap-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'heatmap-tooltip';
            tooltip.className = 'heatmap-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Set tooltip content
        let activityText = 'No activity';
        if (level === 1) activityText = 'Low activity';
        if (level === 2) activityText = 'Medium activity';
        if (level === 3) activityText = 'High activity';
        if (level === 4) activityText = 'Very high activity';
        
        tooltip.innerHTML = `<strong>${day} at ${hour}</strong><br>${activityText}`;
        
        // Position tooltip
        const rect = cell.getBoundingClientRect();
        tooltip.style.top = `${rect.top - 40}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - 75}px`;
        
        // Show tooltip
        tooltip.style.opacity = '1';
    },
    
    /**
     * Hide heatmap tooltip
     */
    hideHeatmapTooltip() {
        const tooltip = document.getElementById('heatmap-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    },
    
    /**
     * Render peak times
     */
    renderPeakTimes(data) {
        this.elements.peakTimesList.innerHTML = '';
        
        data.peakTimes.forEach(peak => {
            const item = document.createElement('li');
            item.className = 'peak-time-item';
            item.innerHTML = `<i class="far fa-clock"></i> ${peak}`;
            this.elements.peakTimesList.appendChild(item);
        });
    },
    
    /**
     * Render interest match chart
     */
    renderInterestMatchChart(data) {
        const ctx = this.elements.interestMatchChart.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.state.charts.interestMatchChart) {
            this.state.charts.interestMatchChart.destroy();
        }
        
        this.state.charts.interestMatchChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.commonInterests.map(item => item.interest),
                datasets: [{
                    label: 'Match Rate',
                    data: data.commonInterests.map(item => item.matchRate),
                    backgroundColor: 'rgba(var(--primary-rgb), 0.7)',
                    borderColor: this.config.chartColors.primary,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                ...this.config.chartOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: this.config.animationDuration
                }
            }
        });
    },
    
    /**
     * Render popular interests chart
     */
    renderPopularInterestsChart(data) {
        const ctx = this.elements.popularInterestsChart.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.state.charts.popularInterestsChart) {
            this.state.charts.popularInterestsChart.destroy();
        }
        
        this.state.charts.popularInterestsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.popularInterests.map(item => item.interest),
                datasets: [{
                    data: data.popularInterests.map(item => item.percentage),
                    backgroundColor: [
                        'rgba(var(--primary-rgb), 0.7)',
                        'rgba(var(--secondary-rgb), 0.7)',
                        'rgba(var(--success-rgb), 0.7)',
                        'rgba(var(--warning-rgb), 0.7)',
                        'rgba(var(--danger-rgb), 0.7)',
                        'rgba(var(--info-rgb), 0.7)'
                    ],
                    borderColor: this.config.chartColors.bgCard,
                    borderWidth: 1
                }]
            },
            options: {
                ...this.config.chartOptions,
                plugins: {
                    ...this.config.chartOptions.plugins,
                    tooltip: {
                        ...this.config.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                animation: {
                    duration: this.config.animationDuration
                }
            }
        });
    },
    
    /**
     * Render interest tags
     */
    renderInterestTags(data) {
        this.elements.interestTags.innerHTML = '';
        
        data.popularInterests.forEach(interest => {
            const tag = document.createElement('div');
            tag.className = 'interest-tag';
            
            const progress = document.createElement('div');
            progress.className = 'interest-tag-progress';
            progress.style.width = `${interest.percentage}%`;
            
            const text = document.createElement('span');
            text.className = 'interest-tag-text';
            text.textContent = interest.interest;
            
            const percentage = document.createElement('span');
            percentage.className = 'interest-tag-percentage';
            percentage.textContent = `${interest.percentage}%`;
            
            tag.appendChild(progress);
            tag.appendChild(text);
            tag.appendChild(percentage);
            
            this.elements.interestTags.appendChild(tag);
        });
    },
    
    /**
     * Render recommendations
     */
    renderRecommendations(data) {
        this.elements.recommendationsList.innerHTML = '';
        
        data.recommendations.forEach(recommendation => {
            const card = document.createElement('div');
            card.className = `recommendation-card ${recommendation.priority}-priority`;
            
            const category = document.createElement('div');
            category.className = 'recommendation-category';
            category.textContent = recommendation.category;
            
            const title = document.createElement('div');
            title.className = 'recommendation-title';
            title.textContent = recommendation.title;
            
            const description = document.createElement('div');
            description.className = 'recommendation-description';
            description.textContent = recommendation.description;
            
            card.appendChild(category);
            card.appendChild(title);
            card.appendChild(description);
            
            this.elements.recommendationsList.appendChild(card);
        });
    },
    
    /**
     * Animate counter from start to end value
     */
    animateCounter(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current.toLocaleString();
            
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = end.toLocaleString();
                clearInterval(timer);
            }
        }, stepTime);
    },
    
    /**
     * Show loading state
     */
    showLoading() {
        this.state.isLoading = true;
        document.body.classList.add('analytics-loading');
    },
    
    /**
     * Hide loading state
     */
    hideLoading() {
        this.state.isLoading = false;
        document.body.classList.remove('analytics-loading');
    },
    
    /**
     * Show section loading state
     */
    showSectionLoading(section) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.classList.add('section-loading');
        }
    },
    
    /**
     * Hide section loading state
     */
    hideSectionLoading(section) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.classList.remove('section-loading');
        }
    },
    
    /**
     * Show error message
     */
    showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'analytics-error-toast';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    },
    
    /**
     * Show section error message
     */
    showSectionError(section, message) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            const errorElement = document.createElement('div');
            errorElement.className = 'section-error';
            errorElement.textContent = message;
            
            // Remove existing error messages
            const existingError = sectionElement.querySelector('.section-error');
            if (existingError) {
                existingError.parentNode.removeChild(existingError);
            }
            
            sectionElement.appendChild(errorElement);
        }
    }
};

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AnalyticsDashboard.init();
});