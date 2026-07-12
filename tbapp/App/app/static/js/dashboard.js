// Dashboard functionality
class DashboardManager {
    static init() {
        this.charts = {};
        this.setupCharts();
        this.setupEventListeners();
        this.loadAnalytics();
    }

    static setupEventListeners() {
        // Timeframe selector
        const timeframeSelect = document.getElementById('views-timeframe');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', () => {
                this.updateProfileViewsChart();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-analytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalytics();
            });
        }
    }

    static setupCharts() {
        this.setupProfileViewsChart();
        this.setupCompatibilityChart();
        this.setupActivityChart();
    }

    static setupProfileViewsChart() {
        const ctx = document.getElementById('profileViewsChart');
        if (!ctx) return;

        this.charts.profileViews = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Profile Views',
                    data: [],
                    borderColor: '#ff4757',
                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ff4757',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ff4757',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    static setupCompatibilityChart() {
        const ctx = document.getElementById('compatibilityChart');
        if (!ctx) return;

        this.charts.compatibility = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Interests', 'Lifestyle', 'Values', 'Personality'],
                datasets: [{
                    data: [85, 72, 90, 68],
                    backgroundColor: [
                        '#ff4757',
                        '#5352ed',
                        '#2ed573',
                        '#ffa502'
                    ],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    static setupActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Messages',
                    data: [12, 19, 8, 15, 22, 18, 14],
                    backgroundColor: 'rgba(255, 71, 87, 0.8)',
                    borderColor: '#ff4757',
                    borderWidth: 0,
                    borderRadius: 4
                }, {
                    label: 'Matches',
                    data: [3, 7, 2, 5, 8, 6, 4],
                    backgroundColor: 'rgba(46, 213, 115, 0.8)',
                    borderColor: '#2ed573',
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    static async loadAnalytics() {
        try {
            const response = await fetch('/dashboard/api/analytics');
            const data = await response.json();
            
            this.updateStats(data);
            this.updateProfileViewsChart(data.profile_views);
            this.updateCompatibilityChart(data.compatibility);
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data');
        }
    }

    static updateStats(data) {
        // Update stat cards
        const profileViews = document.getElementById('profile-views-count');
        const totalMatches = document.getElementById('total-matches-count');
        const messagesCount = document.getElementById('messages-count');
        const compatibilityScore = document.getElementById('compatibility-score');

        if (profileViews) {
            this.animateNumber(profileViews, data.profile_views?.total || 0);
        }

        if (totalMatches) {
            this.animateNumber(totalMatches, data.matches?.total || 0);
        }

        if (messagesCount) {
            this.animateNumber(messagesCount, data.activity?.messages_sent || 0);
        }

        if (compatibilityScore) {
            const avgCompatibility = data.compatibility?.reduce((sum, item) => sum + item.score, 0) / data.compatibility?.length || 0;
            this.animateNumber(compatibilityScore, Math.round(avgCompatibility), '%');
        }
    }

    static updateProfileViewsChart(data) {
        if (!this.charts.profileViews || !data) return;

        this.charts.profileViews.data.labels = data.dates || [];
        this.charts.profileViews.data.datasets[0].data = data.values || [];
        this.charts.profileViews.update();
    }

    static updateCompatibilityChart(data) {
        if (!this.charts.compatibility || !data) return;

        this.charts.compatibility.data.datasets[0].data = data.map(item => item.score);
        this.charts.compatibility.update();
    }

    static async updateProfileViewsChart() {
        const timeframe = document.getElementById('views-timeframe')?.value || '7';
        
        try {
            const response = await fetch(`/dashboard/api/analytics/profile-views?timeRange=${timeframe}d`);
            const data = await response.json();
            
            this.updateProfileViewsChart(data);
        } catch (error) {
            console.error('Error updating profile views chart:', error);
        }
    }

    static animateNumber(element, targetValue, suffix = '') {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    static showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        
        // Insert at top of dashboard
        const dashboard = document.querySelector('.dashboard-container');
        if (dashboard) {
            dashboard.insertBefore(errorDiv, dashboard.firstChild);
            
            // Remove after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    static setupProgressCircles() {
        const progressCircles = document.querySelectorAll('.progress-circle');
        
        progressCircles.forEach(circle => {
            const percent = parseInt(circle.dataset.percent) || 0;
            const circumference = 2 * Math.PI * 40; // radius = 40
            const offset = circumference - (percent / 100) * circumference;
            
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100');
            svg.setAttribute('height', '100');
            svg.setAttribute('viewBox', '0 0 100 100');
            
            const backgroundCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            backgroundCircle.setAttribute('cx', '50');
            backgroundCircle.setAttribute('cy', '50');
            backgroundCircle.setAttribute('r', '40');
            backgroundCircle.setAttribute('fill', 'none');
            backgroundCircle.setAttribute('stroke', '#e9ecef');
            backgroundCircle.setAttribute('stroke-width', '8');
            
            const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            progressCircle.setAttribute('cx', '50');
            progressCircle.setAttribute('cy', '50');
            progressCircle.setAttribute('r', '40');
            progressCircle.setAttribute('fill', 'none');
            progressCircle.setAttribute('stroke', '#ff4757');
            progressCircle.setAttribute('stroke-width', '8');
            progressCircle.setAttribute('stroke-linecap', 'round');
            progressCircle.setAttribute('stroke-dasharray', circumference);
            progressCircle.setAttribute('stroke-dashoffset', offset);
            progressCircle.style.transition = 'stroke-dashoffset 1s ease-in-out';
            
            svg.appendChild(backgroundCircle);
            svg.appendChild(progressCircle);
            
            circle.innerHTML = '';
            circle.appendChild(svg);
            circle.appendChild(document.createElement('span'));
        });
    }

    static setupQuickActions() {
        const quickActions = document.querySelectorAll('.quick-action');
        
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Add loading state
                const originalContent = action.innerHTML;
                action.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                action.style.pointerEvents = 'none';
                
                // Simulate loading
                setTimeout(() => {
                    action.innerHTML = originalContent;
                    action.style.pointerEvents = 'auto';
                    
                    // Navigate to the link
                    const href = action.getAttribute('href');
                    if (href) {
                        window.location.href = href;
                    }
                }, 1000);
            });
        });
    }

    static setupActivityItems() {
        const activityItems = document.querySelectorAll('.activity-item');
        
        activityItems.forEach((item, index) => {
            // Stagger animation
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease-out';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    DashboardManager.init();
    DashboardManager.setupProgressCircles();
    DashboardManager.setupQuickActions();
    DashboardManager.setupActivityItems();
});

// Export for global access
window.DashboardManager = DashboardManager;