/**
 * FIXED: Client-side only simulations
 * Each user sees fresh 2021 results, simulations don't persist
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
    
    // DEFAULT 2021 RESULTS (Always fresh for each user)
    const DEFAULT_2021_RESULTS = {
        1: 'FNM',   // Killarney
        2: 'PLP',   // Golden Isles
        3: 'PLP',   // Southern Shores
        4: 'PLP',   // Tall Pines
        5: 'PLP',   // Carmichael
        6: 'PLP',   // South Beach
        7: 'PLP',   // Seabreeze
        8: 'PLP',   // Elizabeth
        9: 'PLP',   // Yamacraw
        10: 'FNM',  // St Annes
        11: 'PLP',  // Fox Hill
        12: 'PLP',  // Nassau Village
        13: 'PLP',  // Pinewood
        14: 'PLP',  // Bamboo Town
        15: 'PLP',  // Golden Gates
        16: 'PLP',  // Garden Hills
        17: 'PLP',  // Mt. Moriah
        18: 'PLP',  // St. Barnabas
        19: 'PLP',  // Englerston
        20: 'PLP',  // Marathon
        21: 'PLP',  // Freetown
        22: 'PLP',  // Centreville
        23: 'PLP',  // Bains Town & Grants Town
        24: 'PLP',  // Fort Charlotte
        25: 'PLP',  // West Grand Bahama & Bimini
        26: 'FNM',  // Grand Central Bahama
        27: 'PLP',  // Pineridge
        28: 'FNM',  // Marco City
        29: 'FNM',  // East Grand Bahama
        30: 'PLP',  // North Abaco
        31: 'PLP',  // Central & South Abaco
        32: 'PLP',  // North Eleuthera
        33: 'PLP',  // Eleuthera
        34: 'PLP',  // Cat Island, Rum Cay & San Salvador
        35: 'PLP',  // Exumas & Ragged Island
        36: 'FNM',  // Long Island
        37: 'PLP',  // MICAL
        38: 'PLP',  // Central & South Andros
        39: 'PLP'   // Mangrove Cay & South Andros
    };
    
    // Global variables
    let constituencyData = {};
    let currentSimulation = {};
    let selectedConstituency = null;
    
    // Initialize with fresh 2021 results
    init();
    
    function init() {
        loadConstituencyData();
        resetTo2021Results(); // Always start with 2021 results
        setupEventListeners();
        loadEnhancedSVGMap();
    }
    
    function loadConstituencyData() {
        const dataScript = document.getElementById('constituency-data');
        if (dataScript) {
            const data = JSON.parse(dataScript.textContent);
            data.forEach(constituency => {
                constituencyData[constituency.constituency_number] = constituency;
            });
            console.log('✅ Loaded constituency data');
        }
    }
    
    function resetTo2021Results() {
        // ALWAYS start with fresh 2021 results
        currentSimulation = { ...DEFAULT_2021_RESULTS };
        
        // Update all visuals
        Object.keys(currentSimulation).forEach(id => {
            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
        });
        
        updateSeatCounts();
        clearConstituencyInfo();
        
        console.log('✅ Reset to 2021 election results');
        showNotification('Showing 2021 Election Results', 'info');
    }
    
    function setupEventListeners() {
        // Reset button
        $('#reset-to-2021').on('click', function() {
            resetTo2021Results();
            showNotification('Reset to 2021 Election Results', 'success');
        });
        
        // Share simulation (URL-based)
        $('#share-simulation').on('click', shareSimulation);
        
        // Download SVG
        $('#download-svg').on('click', downloadSVG);
        
        // Party selector handlers
        $(document).on('click', '.party-btn', function() {
            const newParty = $(this).data('party');
            if (selectedConstituency) {
                updateConstituency(selectedConstituency, newParty);
            }
        });
    }
    
   function setupConstituencyHandlers() {
    // Enhanced click handler for both SVG paths and grid items
    $(document).off('click', '[data-constituency], .constituency-path').on('click', '[data-constituency], .constituency-path', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        let constituencyId;
        
        // Handle both data-constituency attribute and SVG paths
        if ($(this).data('constituency')) {
            constituencyId = parseInt($(this).data('constituency'));
        } else if ($(this).hasClass('constituency-path')) {
            // For SVG paths, get constituency from data-constituency attribute
            constituencyId = parseInt($(this).attr('data-constituency'));
        }
        
        if (constituencyId && constituencyId >= 1 && constituencyId <= 39) {
            if (selectedConstituency === constituencyId) {
                cycleParty(constituencyId);
            } else {
                selectConstituency(constituencyId);
            }
        }
    });
    
    // Enhanced hover handlers for both SVG and grid
    $(document).off('mouseenter', '[data-constituency], .constituency-path').on('mouseenter', '[data-constituency], .constituency-path', function() {
        let constituencyId;
        
        if ($(this).data('constituency')) {
            constituencyId = parseInt($(this).data('constituency'));
        } else if ($(this).hasClass('constituency-path')) {
            constituencyId = parseInt($(this).attr('data-constituency'));
        }
        
        if (constituencyId && constituencyId >= 1 && constituencyId <= 39) {
            showConstituencyInfo(constituencyId, false);
            
            // Add hover effect for grid items
            if ($(this).hasClass('constituency-item')) {
                $(this).css('transform', 'scale(1.05)');
            }
        }
    });
    
    $(document).off('mouseleave', '[data-constituency], .constituency-path').on('mouseleave', '[data-constituency], .constituency-path', function() {
        // Remove hover effect for grid items
        if ($(this).hasClass('constituency-item')) {
            $(this).css('transform', 'scale(1)');
        }
        
        if (selectedConstituency === null) {
            clearConstituencyInfo();
        }
    });
    
    console.log('✅ Constituency handlers set up for both SVG and grid');
}

    
    function updateConstituency(constituencyId, newParty) {
        // Update simulation (client-side only)
        currentSimulation[constituencyId] = newParty;
        
        // Update visual
        updateConstituencyVisual(constituencyId, newParty);
        
        // Update counts
        updateSeatCounts();
        
        // Update info panel
        showConstituencyInfo(constituencyId, true);
        
        // Visual feedback
        const element = $(`[data-constituency="${constituencyId}"]`);
        element.addClass('updated');
        setTimeout(() => element.removeClass('updated'), 500);
        
        // DO NOT call server - simulations are temporary
        console.log(`✅ Updated constituency ${constituencyId} to ${newParty} (client-side only)`);
    }
    
    function cycleParty(constituencyId) {
        const currentParty = currentSimulation[constituencyId];
        const currentIndex = PARTIES.indexOf(currentParty);
        const nextIndex = (currentIndex + 1) % PARTIES.length;
        const newParty = PARTIES[nextIndex];
        
        updateConstituency(constituencyId, newParty);
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
    
    function updateConstituencyVisual(constituencyId, party) {
        const color = PARTY_COLORS[party];
        let updatedElements = 0;
        
        // Update SVG elements
        const svgElements = $(`[data-constituency="${constituencyId}"]`);
        if (svgElements.length > 0) {
            svgElements.each(function() {
                $(this).attr('fill', color);
                $(this).attr('data-party', party);
                $(this).css('fill', color);
                updatedElements++;
            });
        }
        
        // Update fallback grid items
        const gridItems = $(`.constituency-item[data-constituency="${constituencyId}"]`);
        if (gridItems.length > 0) {
            gridItems.each(function() {
                $(this).attr('data-party', party);
                $(this).css('background-color', color);
                updatedElements++;
            });
        }
        
        // Update by ID
        const idElements = $(`#constituency-${constituencyId}`);
        if (idElements.length > 0) {
            idElements.each(function() {
                $(this).attr('fill', color);
                $(this).attr('data-party', party);
                $(this).css('fill', color);
                updatedElements++;
            });
        }
        
        return updatedElements > 0;
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
        
        // Update display
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
    
    function shareSimulation() {
        // Create URL with current simulation state
        const stateString = btoa(JSON.stringify(currentSimulation));
        const shareUrl = `${window.location.origin}${window.location.pathname}?simulation=${stateString}`;
        
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
        // Implementation for SVG download
        showNotification('Download feature coming soon!', 'info');
    }
    
   function loadEnhancedSVGMap() {
    const mapContainer = $('#bahamas-map');
    
    // Show loading message
    mapContainer.html('<div class="map-loading"><span>Loading interactive SVG map...</span></div>');
    
    // Try to load the enhanced SVG via AJAX first
    $.ajax({
        url: bahamas_ajax.ajax_url,
        type: 'POST',
        data: {
            action: 'get_svg_map',
            nonce: bahamas_ajax.nonce
        },
        success: function(response) {
            console.log('AJAX Response:', response);
            
            if (response.success && response.data.svg) {
                // Insert the enhanced SVG
                mapContainer.html(response.data.svg);
                
                // Set up interactions
                setupConstituencyHandlers();
                
                // Apply current simulation colors to SVG
                setTimeout(() => {
                    Object.keys(currentSimulation).forEach(id => {
                        updateConstituencyVisual(parseInt(id), currentSimulation[id]);
                    });
                    updateSeatCounts();
                }, 100);
                
                console.log('✅ Enhanced SVG map loaded successfully from', response.data.source);
                showNotification('Interactive SVG map loaded!', 'success');
            } else {
                console.warn('⚠️ SVG load failed, falling back to grid');
                loadFallbackMap();
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ AJAX failed:', error);
            console.log('Falling back to grid system');
            loadFallbackMap();
        }
    });
}

    
    function generateEnhancedFallbackHTML() {
        let html = '<div class="enhanced-fallback-container">';
        
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
        
        html += '</div>';
        return html;
    }
    
    function showNotification(message, type = 'info') {
        $('.notification').remove();
        
        const notification = $(`
            <div class="notification notification-${type}">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `);
        
        $('body').append(notification);
        
        setTimeout(() => {
            notification.fadeOut(() => notification.remove());
        }, 4000);
        
        notification.find('.notification-close').on('click', () => {
            notification.fadeOut(() => notification.remove());
        });
    }
    
    // Load simulation from URL if present
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
    
    // Load simulation from URL after initialization
    setTimeout(loadSimulationFromUrl, 500);
    
    console.log('🎉 Bahamas Election Map initialized with 2021 results!');
    
    // Add CSS for reset button and notifications
    const additionalStyles = `
        <style>
        .btn-reset {
            background: linear-gradient(135deg, #6c757d, #5a6268);
            color: white;
            margin-right: 10px;
        }
        
        .btn-reset:hover {
            background: linear-gradient(135deg, #5a6268, #495057);
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
        
        .constituency-item.updated {
            animation: pulse 0.5s ease-in-out;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        </style>
    `;
    
    $('head').append(additionalStyles);
});
