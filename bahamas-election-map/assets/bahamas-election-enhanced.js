/**
 * Enhanced Bahamas Interactive Election Map JavaScript
 * Nassau-focused with 24 individual constituencies
 */

jQuery(document).ready(function($) {
    
    // Configuration
    const PARTIES = ['PLP', 'FNM', 'COI', 'DNA', 'IND'];
    const PARTY_COLORS = {
        'PLP': '#FFD700',
        'FNM': '#FF0000', 
        'COI': '#00FFFF',
        'DNA': '#00FF00',
        'IND': '#808080'
    };
    
    const PARTY_NAMES = {
        'PLP': 'Progressive Liberal Party',
        'FNM': 'Free National Movement',
        'COI': 'Coalition of Independence',
        'DNA': 'Democratic National Alliance',
        'IND': 'Independent'
    };

    const COLORBLIND_COLORS = {
        'PLP': '#FFA500',
        'FNM': '#CC0000',
        'COI': '#0066CC', 
        'DNA': '#228B22',
        'IND': '#666666'
    };
    
    // Global variables
    let constituencyData = {};
    let currentSimulation = {};
    let isColorblindMode = false;
    let showNumbers = true;
    let svgElement = null;
    let mapContainer = null;
    let selectedConstituency = null;
    
    // Initialize the enhanced application
    init();
    
    function init() {
        loadConstituencyData();
        setupEventListeners();
        loadEnhancedSVGMap();
        updateSeatCounts();
        updateRegionalCounts();
    }
    
    function loadConstituencyData() {
        const dataScript = document.getElementById('constituency-data');
        if (dataScript) {
            const data = JSON.parse(dataScript.textContent);
            data.forEach(constituency => {
                constituencyData[constituency.constituency_number] = constituency;
                currentSimulation[constituency.constituency_number] = constituency.current_party;
            });
            console.log('✅ Loaded', Object.keys(constituencyData).length, 'constituencies');
        }
    }
    
    function setupEventListeners() {
        // Enhanced button handlers
        $('#reset-map').on('click', resetMap);
        $('#share-simulation').on('click', shareSimulation);
        $('#download-svg').on('click', downloadSVG);
        
        // Toggle handlers
        $('#colorblind-mode').on('change', toggleColorblindMode);
        $('#show-numbers').on('change', toggleShowNumbers);
        
        // Party selector handlers
        $(document).on('click', '.party-btn', function() {
            const newParty = $(this).data('party');
            if (selectedConstituency) {
                updateConstituency(selectedConstituency, newParty);
            }
        });
        
        // Window resize handler
        $(window).on('resize', debounce(handleResize, 250));
        
        // Keyboard navigation
        $(document).on('keydown', handleKeyboardNavigation);
    }
    
    function loadEnhancedSVGMap() {
        mapContainer = $('#bahamas-map');
        
        // Load the enhanced SVG via AJAX
        $.ajax({
            url: bahamas_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'get_svg_map',
                nonce: bahamas_ajax.nonce
            },
            success: function(response) {
                if (response.success && response.data.svg) {
                    // Insert the enhanced SVG
                    mapContainer.html(response.data.svg);
                    svgElement = mapContainer.find('svg')[0];
                    
                    // Apply initial colors and setup interactions
                    Object.keys(currentSimulation).forEach(id => {
                        updateConstituencyVisual(parseInt(id), currentSimulation[id]);
                    });
                    
                    setupConstituencyHandlers();
                    console.log('✅ Enhanced SVG map loaded successfully');
                } else {
                    console.error('❌ Failed to load enhanced SVG map');
                    loadFallbackMap();
                }
            },
            error: function() {
                console.warn('⚠️ AJAX failed, loading fallback map');
                loadFallbackMap();
            }
        });
    }
    
    function loadFallbackMap() {
        // Enhanced fallback with proper Nassau layout
        mapContainer.html(`
            <div class="svg-placeholder">
                <h3>🗺️ The Bahamas - Interactive Constituency Map</h3>
                <div class="enhanced-fallback-container">
                    ${generateEnhancedFallbackHTML()}
                </div>
            </div>
        `);
        setupConstituencyHandlers();
    }
    
    function generateEnhancedFallbackHTML() {
        let html = '';
        
        // Nassau section (1-24)
        html += '<div class="fallback-section nassau-section">';
        html += '<h4>NASSAU / NEW PROVIDENCE (24 Constituencies)</h4>';
        html += '<div class="nassau-grid">';
        
        for (let i = 1; i <= 24; i++) {
            const constituency = constituencyData[i];
            const party = currentSimulation[i] || 'PLP';
            
            html += `
                <div class="constituency-item nassau-item" 
                     data-constituency="${i}" 
                     data-party="${party}"
                     data-region="Nassau"
                     style="background-color: ${PARTY_COLORS[party]}">
                    <span class="constituency-number">${i}</span>
                    <span class="constituency-name">${constituency ? constituency.constituency_name : 'Unknown'}</span>
                </div>
            `;
        }
        html += '</div></div>';
        
        // Grand Bahama section (25-29)  
        html += '<div class="fallback-section gb-section">';
        html += '<h4>GRAND BAHAMA (5 Constituencies)</h4>';
        html += '<div class="gb-grid">';
        
        for (let i = 25; i <= 29; i++) {
            const constituency = constituencyData[i];
            const party = currentSimulation[i] || 'PLP';
            
            html += `
                <div class="constituency-item gb-item" 
                     data-constituency="${i}" 
                     data-party="${party}"
                     data-region="Grand Bahama"
                     style="background-color: ${PARTY_COLORS[party]}">
                    <span class="constituency-number">${i}</span>
                    <span class="constituency-name">${constituency ? constituency.constituency_name : 'Unknown'}</span>
                </div>
            `;
        }
        html += '</div></div>';
        
        // Family Islands section (30-39)
        html += '<div class="fallback-section fi-section">';
        html += '<h4>FAMILY ISLANDS (10 Constituencies)</h4>';
        html += '<div class="fi-grid">';
        
        for (let i = 30; i <= 39; i++) {
            const constituency = constituencyData[i];
            const party = currentSimulation[i] || 'PLP';
            
            html += `
                <div class="constituency-item fi-item" 
                     data-constituency="${i}" 
                     data-party="${party}"
                     data-region="Family Islands"
                     style="background-color: ${PARTY_COLORS[party]}">
                    <span class="constituency-number">${i}</span>
                    <span class="constituency-name">${constituency ? constituency.constituency_name : 'Unknown'}</span>
                </div>
            `;
        }
        html += '</div></div>';
        
        return html;
    }
    
    function setupConstituencyHandlers() {
        // Enhanced click handler for constituency switching
        $(document).off('click', '[data-constituency]').on('click', '[data-constituency]', function(e) {
            e.preventDefault();
            const constituencyId = parseInt($(this).data('constituency'));
            selectConstituency(constituencyId);
        });
        
        // Enhanced hover handlers for info display
        $(document).off('mouseenter', '[data-constituency]').on('mouseenter', '[data-constituency]', function() {
            const constituencyId = parseInt($(this).data('constituency'));
            showConstituencyInfo(constituencyId, false);
            $(this).css('transform', 'scale(1.05)');
        });
        
        $(document).off('mouseleave', '[data-constituency]').on('mouseleave', '[data-constituency]', function() {
            $(this).css('transform', 'scale(1)');
            if (selectedConstituency === null) {
                clearConstituencyInfo();
            }
        });
        
        // Double-click to cycle party
        $(document).off('dblclick', '[data-constituency]').on('dblclick', '[data-constituency]', function(e) {
            e.preventDefault();
            const constituencyId = parseInt($(this).data('constituency'));
            cycleParty(constituencyId);
        });
    }
    
    function selectConstituency(constituencyId) {
        // Remove previous selection
        $('[data-constituency]').removeClass('selected');
        
        // Add selection to current constituency
        $(`[data-constituency="${constituencyId}"]`).addClass('selected');
        
        selectedConstituency = constituencyId;
        showConstituencyInfo(constituencyId, true);
        
        // Show party selector
        $('#party-selector').show();
    }
    
    function cycleParty(constituencyId) {
        const currentParty = currentSimulation[constituencyId];
        const currentIndex = PARTIES.indexOf(currentParty);
        const nextIndex = (currentIndex + 1) % PARTIES.length;
        const newParty = PARTIES[nextIndex];
        
        updateConstituency(constituencyId, newParty);
    }
    
    function updateConstituency(constituencyId, newParty) {
        currentSimulation[constituencyId] = newParty;
        updateConstituencyVisual(constituencyId, newParty);
        updateSeatCounts();
        updateRegionalCounts();
        showConstituencyInfo(constituencyId, true);
        updateConstituencyOnServer(constituencyId, newParty);
        
        // Visual feedback
        const element = $(`[data-constituency="${constituencyId}"]`);
        element.addClass('updated');
        setTimeout(() => element.removeClass('updated'), 500);
    }
    
    function updateConstituencyVisual(constituencyId, party) {
        const color = isColorblindMode ? COLORBLIND_COLORS[party] : PARTY_COLORS[party];
        
        // Update SVG elements
        const svgElement = $(`#constituency-${constituencyId}`);
        if (svgElement.length) {
            svgElement.attr('fill', color);
            svgElement.attr('data-party', party);
        }
        
        // Update fallback grid items
        const gridItem = $(`.constituency-item[data-constituency="${constituencyId}"]`);
        if (gridItem.length) {
            gridItem.attr('data-party', party).css('background-color', color);
        }
    }
    
    function updateSeatCounts() {
        const counts = {
            'PLP': 0,
            'FNM': 0,
            'COI': 0,
            'DNA': 0,
            'IND': 0
        };
        
        Object.values(currentSimulation).forEach(party => {
            if (counts.hasOwnProperty(party)) {
                counts[party]++;
            }
        });
        
        // Update seat count displays
        Object.keys(counts).forEach(party => {
            $(`#${party.toLowerCase()}-seats`).text(counts[party]);
            
            const partyElement = $(`.${party.toLowerCase()}-count`);
            if (counts[party] >= 20) {
                partyElement.addClass('majority-party');
            } else {
                partyElement.removeClass('majority-party');
            }
        });
        
        updateMajorityIndicator(counts);
    }
    
    function updateRegionalCounts() {
        const regionalCounts = {
            nassau: { PLP: 0, FNM: 0, COI: 0, DNA: 0, IND: 0 },
            grandBahama: { PLP: 0, FNM: 0, COI: 0, DNA: 0, IND: 0 },
            familyIslands: { PLP: 0, FNM: 0, COI: 0, DNA: 0, IND: 0 }
        };
        
        // Count Nassau (1-24)
        for (let i = 1; i <= 24; i++) {
            const party = currentSimulation[i];
            if (party && regionalCounts.nassau[party] !== undefined) {
                regionalCounts.nassau[party]++;
            }
        }
        
        // Count Grand Bahama (25-29)
        for (let i = 25; i <= 29; i++) {
            const party = currentSimulation[i];
            if (party && regionalCounts.grandBahama[party] !== undefined) {
                regionalCounts.grandBahama[party]++;
            }
        }
        
        // Count Family Islands (30-39)
        for (let i = 30; i <= 39; i++) {
            const party = currentSimulation[i];
            if (party && regionalCounts.familyIslands[party] !== undefined) {
                regionalCounts.familyIslands[party]++;
            }
        }
        
        console.log('Regional breakdown:', regionalCounts);
    }
    
    function updateMajorityIndicator(counts) {
        const majorityParty = Object.keys(counts).find(party => counts[party] >= 20);
        const majorityElement = $('#majority-indicator');
        const majorityText = $('#majority-text');
        
        if (majorityParty) {
            majorityElement.addClass('has-majority');
            const surplus = counts[majorityParty] - 20;
            majorityText.html(`
                <strong>${PARTY_NAMES[majorityParty]} Forms Government</strong>
                <br><small>${counts[majorityParty]} seats ${surplus > 0 ? `(+${surplus} majority)` : '(Exact majority)'}</small>
            `);
        } else {
            majorityElement.removeClass('has-majority');
            const maxParty = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            const needed = 20 - counts[maxParty];
            majorityText.html(`
                <strong>Hung Parliament</strong>
                <br><small>${PARTY_NAMES[maxParty]} leads with ${counts[maxParty]} seats (needs ${needed} more)</small>
            `);
        }
    }
    
    function showConstituencyInfo(constituencyId, isSelected = false) {
        const constituency = constituencyData[constituencyId];
        const currentParty = currentSimulation[constituencyId];
        
        if (constituency) {
            $('#info-title').text(constituency.constituency_name);
            $('#info-number').html(`<strong>Number:</strong> ${constituencyId}`);
            $('#info-mp').html(`<strong>MP:</strong> ${constituency.current_mp || 'TBD'}`);
            $('#info-party').html(`<strong>Current Party:</strong> ${PARTY_NAMES[currentParty]} (${currentParty})`);
            $('#info-region').html(`<strong>Region:</strong> ${constituency.region || 'Unknown'}`);
            $('#info-island').html(`<strong>Island:</strong> ${constituency.island || 'Unknown'}`);
            
            if (isSelected) {
                $('#party-selector').show();
                // Highlight current party button
                $('.party-btn').removeClass('active');
                $(`.party-btn[data-party="${currentParty}"]`).addClass('active');
            }
        }
    }
    
    function clearConstituencyInfo() {
        $('#info-title').text('Select a Constituency');
        $('#info-number').html('<strong>Number:</strong> -');
        $('#info-mp').html('<strong>MP:</strong> Click on any constituency');
        $('#info-party').html('<strong>Current Party:</strong> -');
        $('#info-region').html('<strong>Region:</strong> -');
        $('#info-island').html('<strong>Island:</strong> -');
        $('#party-selector').hide();
        $('.party-btn').removeClass('active');
        selectedConstituency = null;
        $('[data-constituency]').removeClass('selected');
    }
    
    function resetMap() {
        // Show loading state
        showNotification('Resetting map to 2021 results...', 'info');
        
        Object.keys(constituencyData).forEach(id => {
            const originalParty = constituencyData[id].current_party;
            currentSimulation[id] = originalParty;
            updateConstituencyVisual(parseInt(id), originalParty);
        });
        
        updateSeatCounts();
        updateRegionalCounts();
        clearConstituencyInfo();
        
        $.ajax({
            url: bahamas_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'reset_map',
                nonce: bahamas_ajax.nonce
            },
            success: function(response) {
                showNotification('Map reset to 2021 results successfully!', 'success');
                console.log('✅ Map reset successfully');
            },
            error: function() {
                showNotification('Failed to reset map on server', 'error');
                console.error('❌ Failed to reset map on server');
            }
        });
    }
    
    function shareSimulation() {
        const stateString = btoa(JSON.stringify(currentSimulation));
        const shareUrl = `${window.location.origin}${window.location.pathname}?simulation=${stateString}`;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showNotification('Simulation link copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(shareUrl);
            });
        } else {
            fallbackCopyToClipboard(shareUrl);
        }
    }
    
    function fallbackCopyToClipboard(text) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('Simulation link copied to clipboard!', 'success');
        } catch (err) {
            prompt('Copy this link to share your simulation:', text);
        }
        
        document.body.removeChild(textArea);
    }
    
    function downloadSVG() {
        if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `bahamas-election-simulation-${new Date().toISOString().split('T')[0]}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('Map downloaded successfully!', 'success');
        } else {
            showNotification('No map available to download', 'error');
        }
    }
    
    function toggleColorblindMode() {
        isColorblindMode = $('#colorblind-mode').is(':checked');
        
        Object.keys(currentSimulation).forEach(id => {
            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
        });
        
        if (isColorblindMode) {
            $('.map-legend').addClass('colorblind-mode');
            showNotification('Colorblind mode enabled', 'info');
        } else {
            $('.map-legend').removeClass('colorblind-mode');
            showNotification('Colorblind mode disabled', 'info');
        }
    }
    
    function toggleShowNumbers() {
        showNumbers = $('#show-numbers').is(':checked');
        
        if (showNumbers) {
            $('.constituency-label').show();
            $('.constituency-number').show();
        } else {
            $('.constituency-label').hide();
            $('.constituency-number').hide();
        }
    }
    
    function updateConstituencyOnServer(constituencyId, newParty) {
        $.ajax({
            url: bahamas_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'update_constituency',
                nonce: bahamas_ajax.nonce,
                constituency_id: constituencyId,
                new_party: newParty
            },
            success: function(response) {
                if (response.success) {
                    console.log(`✅ Constituency ${constituencyId} updated to ${newParty}`);
                } else {
                    console.error('❌ Failed to update constituency:', response.data);
                }
            },
            error: function() {
                console.error('❌ AJAX error updating constituency');
            }
        });
    }
    
    function handleResize() {
        // Responsive adjustments
        const containerWidth = $('#bahamas-election-container').width();
        
        if (containerWidth < 768) {
            // Mobile adjustments
            $('.constituency-info').addClass('mobile-mode');
        } else {
            $('.constituency-info').removeClass('mobile-mode');
        }
        
        console.log('🔄 Window resized, container width:', containerWidth);
    }
    
    function handleKeyboardNavigation(e) {
        if (!selectedConstituency) return;
        
        let newSelection = selectedConstituency;
        
        switch(e.key) {
            case 'ArrowLeft':
                newSelection = Math.max(1, selectedConstituency - 1);
                break;
            case 'ArrowRight':
                newSelection = Math.min(39, selectedConstituency + 1);
                break;
            case 'ArrowUp':
                newSelection = Math.max(1, selectedConstituency - 6); // Nassau grid navigation
                break;
            case 'ArrowDown':
                newSelection = Math.min(39, selectedConstituency + 6);
                break;
            case 'Space':
            case 'Enter':
                e.preventDefault();
                cycleParty(selectedConstituency);
                return;
            case 'Escape':
                clearConstituencyInfo();
                return;
            default:
                return;
        }
        
        if (newSelection !== selectedConstituency) {
            e.preventDefault();
            selectConstituency(newSelection);
        }
    }
    
    function loadSimulationFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const simulationParam = urlParams.get('simulation');
        
        if (simulationParam) {
            try {
                const simulation = JSON.parse(atob(simulationParam));
                
                // Validate simulation data
                const validConstituencies = Object.keys(simulation).every(id => 
                    id >= 1 && id <= 39 && PARTIES.includes(simulation[id])
                );
                
                if (validConstituencies) {
                    currentSimulation = simulation;
                    
                    Object.keys(simulation).forEach(id => {
                        updateConstituencyVisual(parseInt(id), simulation[id]);
                    });
                    
                    updateSeatCounts();
                    updateRegionalCounts();
                    showNotification('Simulation loaded from URL!', 'success');
                } else {
                    console.error('❌ Invalid simulation data in URL');
                    showNotification('Invalid simulation data in URL', 'error');
                }
            } catch (e) {
                console.error('❌ Invalid simulation URL parameter:', e);
                showNotification('Invalid simulation URL parameter', 'error');
            }
        }
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        $('.notification').remove();
        
        const notification = $(`
            <div class="notification notification-${type}">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `);
        
        $('body').append(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.fadeOut(() => notification.remove());
        }, 5000);
        
        // Manual close
        notification.find('.notification-close').on('click', () => {
            notification.fadeOut(() => notification.remove());
        });
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Add custom CSS for enhanced features
    function addEnhancedStyles() {
        const styles = `
            <style>
            .constituency-item.selected {
                border: 3px solid #007bff;
                box-shadow: 0 0 15px rgba(0,123,255,0.5);
                transform: scale(1.05);
            }
            
            .constituency-item.updated {
                animation: pulse 0.5s ease-in-out;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .party-btn.active {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 2px solid #333;
            }
            
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 300px;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-success { background: #28a745; }
            .notification-error { background: #dc3545; }
            .notification-info { background: #17a2b8; }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .enhanced-fallback-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
                padding: 20px;
            }
            
            .fallback-section {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .fallback-section h4 {
                margin: 0 0 15px 0;
                text-align: center;
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 10px;
            }
            
            .nassau-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 8px;
            }
            
            .gb-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            
            .fi-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            
            .constituency-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 10px;
                border: 2px solid #333;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-height: 60px;
                text-align: center;
            }
            
            .nassau-item {
                min-height: 70px;
                font-size: 11px;
            }
            
            .constituency-number {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .constituency-name {
                font-size: 9px;
                line-height: 1.2;
            }
            
            .constituency-item:hover {
                transform: scale(1.05);
                border-width: 3px;
                z-index: 10;
            }
            
            @media (max-width: 768px) {
                .nassau-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
                
                .gb-grid, .fi-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .constituency-item {
                    min-height: 50px;
                    font-size: 10px;
                }
                
                .notification {
                    min-width: auto;
                    max-width: 90%;
                    right: 5%;
                }
            }
            </style>
        `;
        
        $('head').append(styles);
    }
    
    // Initialize enhanced styles
    addEnhancedStyles();
    
    // Load simulation from URL if present
    loadSimulationFromUrl();
    
    // Add helpful tooltips
    $(document).ready(function() {
        // Add tooltips to buttons
        $('#reset-map').attr('title', 'Reset map to official 2021 election results');
        $('#share-simulation').attr('title', 'Generate shareable link for current simulation');
        $('#download-svg').attr('title', 'Download current map as SVG file');
        $('#colorblind-mode').attr('title', 'Toggle colorblind-friendly color scheme');
        $('#show-numbers').attr('title', 'Show/hide constituency numbers on map');
        
        console.log('🎉 Enhanced Bahamas Election Map initialized successfully!');
        console.log('📋 Features: Nassau focus, keyboard navigation, sharing, downloading');
        console.log('💡 Tip: Double-click constituencies to cycle parties, use arrow keys to navigate');
    });
});