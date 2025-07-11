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
    
	const COLORBLIND_COLORS = {
        'PLP': '#FFA500', // Orange
        'FNM': '#CC0000', // Darker red
        'COI': '#0066CC', // Darker blue
        'DNA': '#228B22', // Forest green
        'IND': '#666666'  // Darker gray
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
    let isColorblindMode = false;
    let isSimulationModified = false;
    
    // Initialize with fresh 2021 results
    init();
    
    function init() {
        loadConstituencyData();
        resetTo2021Results();
        setupEventListeners();
        loadEnhancedSVGMap();
        initializeColorblindMode();
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
        currentSimulation = { ...DEFAULT_2021_RESULTS };
        isSimulationModified = false;
        
        // Update all visuals
        Object.keys(currentSimulation).forEach(id => {
            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
        });
        
        updateSeatCounts();
        clearConstituencyInfo();
        updateSimulationStatus('2021 Election Results', false);
        
        console.log('✅ Reset to 2021 election results');
        showNotification('Reset to 2021 Election Results', 'success');
    }
    function updateSimulationStatus(text, isModified) {
        const statusElement = $('#simulation-status');
        const statusText = statusElement.find('.status-text');
        const statusIcon = statusElement.find('.status-icon');
        
        statusText.text(text);
        
        if (isModified) {
            statusIcon.text('🔄');
            statusElement.addClass('simulation-modified');
        } else {
            statusIcon.text('✅');
            statusElement.removeClass('simulation-modified');
        }
        
        isSimulationModified = isModified;
    }
	
	function initializeColorblindMode() {
        // Check if user has colorblind mode preference stored
        const savedColorblindMode = localStorage.getItem('bahamas-colorblind-mode');
        if (savedColorblindMode === 'true') {
            $('#colorblind-mode').prop('checked', true);
            enableColorblindMode();
        }
    }
	
	function toggleColorblindMode() {
        isColorblindMode = !isColorblindMode;
        
        if (isColorblindMode) {
            enableColorblindMode();
        } else {
            disableColorblindMode();
        }
        
        // Save preference
        localStorage.setItem('bahamas-colorblind-mode', isColorblindMode.toString());
        
        // Update all constituency visuals
        Object.keys(currentSimulation).forEach(id => {
            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
        });
        
        updateLegendColors();
        
        showNotification(
            isColorblindMode ? 'Colorblind mode enabled' : 'Colorblind mode disabled', 
            'info'
        );
    }
	
	function enableColorblindMode() {
        isColorblindMode = true;
        $('#map-legend').addClass('colorblind-mode');
        $('.colorblind-note').show();
        $('body').addClass('colorblind-mode');
        console.log('✅ Colorblind mode enabled');
    }
    
    function disableColorblindMode() {
        isColorblindMode = false;
        $('#map-legend').removeClass('colorblind-mode');
        $('.colorblind-note').hide();
        $('body').removeClass('colorblind-mode');
        console.log('✅ Colorblind mode disabled');
    }
	
	function updateLegendColors() {
        const colors = isColorblindMode ? COLORBLIND_COLORS : PARTY_COLORS;
        
        Object.keys(colors).forEach(party => {
            const colorBox = $(`#${party.toLowerCase()}-color-box`);
            if (colorBox.length) {
                colorBox.css('background', colors[party]);
            }
        });
    }
	
	 function getCurrentColors() {
        return isColorblindMode ? COLORBLIND_COLORS : PARTY_COLORS;
    }
	
    function setupEventListeners() {
        // Reset button - NEW FEATURE
        $('#reset-to-2021').on('click', function() {
            if (isSimulationModified) {
                if (confirm('This will reset all changes and return to 2021 election results. Are you sure?')) {
                    resetTo2021Results();
                }
            } else {
                resetTo2021Results();
            }
        });
        
        // Colorblind mode toggle - NEW FEATURE
        $('#colorblind-mode').on('change', function() {
            toggleColorblindMode();
        });
        
        // Download SVG - NEW FEATURE
        $('#download-svg').on('click', function() {
            downloadSVG();
        });
        
        // Share simulation (enhanced)
        $('#share-simulation').on('click', shareSimulation);
        
        // Party selector handlers
        $(document).on('click', '.party-btn', function() {
            const newParty = $(this).data('party');
            if (selectedConstituency) {
                updateConstituency(selectedConstituency, newParty);
            }
        });
        
        // NEW: Quick action handlers
        $('#flip-all-plp').on('click', function() {
            flipAllConstituencies('PLP');
        });
        
        $('#flip-all-fnm').on('click', function() {
            flipAllConstituencies('FNM');
        });
        
        $('#flip-nassau').on('click', function() {
            flipRegion('Nassau');
        });
        
        // Keyboard shortcuts
        $(document).on('keydown', function(e) {
    // Only trigger if not typing in an input
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
        return;
    }
    
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'r':
                e.preventDefault();
                $('#reset-to-2021').click();
                break;
            case 'd':
                e.preventDefault();
                $('#download-svg').click();
                break;
            case 's':
                e.preventDefault();
                $('#share-simulation').click();
                break;
            case 'c':
                e.preventDefault();
                $('#colorblind-mode').click();
                break;
            case '/':
            case '?':
                e.preventDefault();
                showKeyboardShortcuts();
                break;
        }
    } else {
        switch(e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                $('#random-simulation').click();
                break;
            case '1':
                $('#flip-all-plp').click();
                break;
            case '2':
                $('#flip-all-fnm').click();
                break;
            case 'n':
                $('#flip-nassau').click();
                break;
            case 'g':
                $('#flip-grand-bahama').click();
                break;
            case 'f':
                $('#flip-family-islands').click();
                break;
        }
    }
});
    }
    
	function flipAllConstituencies(party) {
        if (confirm(`This will set ALL 39 constituencies to ${party}. Are you sure?`)) {
            for (let i = 1; i <= 39; i++) {
                currentSimulation[i] = party;
                updateConstituencyVisual(i, party);
            }
            updateSeatCounts();
            updateSimulationStatus(`All ${party} Simulation`, true);
            showNotification(`All constituencies set to ${party}`, 'success');
        }
    }
    
    function flipRegion(region) {
        let constituencies = [];
        let regionName = '';
        
        if (region === 'Nassau') {
            constituencies = Array.from({length: 24}, (_, i) => i + 1);
            regionName = 'Nassau';
        } else if (region === 'GrandBahama') {
            constituencies = Array.from({length: 5}, (_, i) => i + 25);
            regionName = 'Grand Bahama';
        } else if (region === 'FamilyIslands') {
            constituencies = Array.from({length: 10}, (_, i) => i + 30);
            regionName = 'Family Islands';
        }
        
        if (constituencies.length > 0) {
            // Determine which party to flip to (opposite of current majority in region)
            const regionParties = constituencies.map(id => currentSimulation[id]);
            const partyCounts = {};
            regionParties.forEach(party => {
                partyCounts[party] = (partyCounts[party] || 0) + 1;
            });
            
            const currentMajority = Object.keys(partyCounts).reduce((a, b) => 
                partyCounts[a] > partyCounts[b] ? a : b
            );
            
            const newParty = currentMajority === 'PLP' ? 'FNM' : 'PLP';
            
            if (confirm(`This will flip all ${regionName} constituencies to ${newParty}. Continue?`)) {
                constituencies.forEach(id => {
                    currentSimulation[id] = newParty;
                    updateConstituencyVisual(id, newParty);
                });
                
                updateSeatCounts();
                updateSimulationStatus(`${regionName} Flipped to ${newParty}`, true);
                showNotification(`${regionName} flipped to ${newParty}`, 'success');
            }
        }
    }
	
   function setupConstituencyHandlers() {
        $(document).off('click', '[data-constituency], .constituency-path').on('click', '[data-constituency], .constituency-path', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let constituencyId;
            
            if ($(this).data('constituency')) {
                constituencyId = parseInt($(this).data('constituency'));
            } else if ($(this).hasClass('constituency-path')) {
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
    
    $(document).off('mouseenter', '[data-constituency], .constituency-path').on('mouseenter', '[data-constituency], .constituency-path', function() {
            let constituencyId;
            
            if ($(this).data('constituency')) {
                constituencyId = parseInt($(this).data('constituency'));
            } else if ($(this).hasClass('constituency-path')) {
                constituencyId = parseInt($(this).attr('data-constituency'));
            }
            
            if (constituencyId && constituencyId >= 1 && constituencyId <= 39) {
                showConstituencyInfo(constituencyId, false);
                
                if ($(this).hasClass('constituency-item')) {
                    $(this).css('transform', 'scale(1.05)');
                }
            }
        });
        
        $(document).off('mouseleave', '[data-constituency], .constituency-path').on('mouseleave', '[data-constituency], .constituency-path', function() {
            if ($(this).hasClass('constituency-item')) {
                $(this).css('transform', 'scale(1)');
            }
            
            if (selectedConstituency === null) {
                clearConstituencyInfo();
            }
        });
        
        console.log('✅ Enhanced constituency handlers set up');
    }
    
    function updateConstituency(constituencyId, newParty) {
        // Update simulation
        currentSimulation[constituencyId] = newParty;
        
        // Update visual
        updateConstituencyVisual(constituencyId, newParty);
        
        // Update counts
        updateSeatCounts();
        
        // Update info panel
        showConstituencyInfo(constituencyId, true);
        
        // Mark as modified
        updateSimulationStatus('Custom Simulation', true);
        
        // Visual feedback
        const element = $(`[data-constituency="${constituencyId}"]`);
        element.addClass('updated');
        setTimeout(() => element.removeClass('updated'), 500);
        
        console.log(`✅ Updated constituency ${constituencyId} to ${newParty}`);
    }
    
    function cycleParty(constituencyId) {
    const currentParty = currentSimulation[constituencyId];
    const currentIndex = PARTIES.indexOf(currentParty);
    const nextIndex = (currentIndex + 1) % PARTIES.length;
    const newParty = PARTIES[nextIndex];
    
    updateConstituency(constituencyId, newParty);
    
    // Show quick feedback
    const partyNames = {
        'PLP': 'Progressive Liberal Party',
        'FNM': 'Free National Movement',
        'COI': 'Coalition of Independence',
        'DNA': 'Democratic National Alliance',
        'IND': 'Independent'
    };
    
    const constituencyName = constituencyData[constituencyId]?.constituency_name || `Constituency ${constituencyId}`;
    showNotification(`${constituencyName} → ${partyNames[newParty]}`, 'info', 2000);
}
    
    function selectConstituency(constituencyId) {
        $('[data-constituency]').removeClass('selected');
        $(`[data-constituency="${constituencyId}"]`).addClass('selected');
        
        selectedConstituency = constituencyId;
        showConstituencyInfo(constituencyId, true);
        
        $('#party-selector').show();
    }
    
    function updateConstituencyVisual(constituencyId, party) {
        const colors = getCurrentColors();
        const color = colors[party];
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
            'PLP': 0, 'FNM': 0, 'COI': 0, 'DNA': 0, 'IND': 0
        };
        
        Object.values(currentSimulation).forEach(party => {
            if (counts.hasOwnProperty(party)) {
                counts[party]++;
            }
        });
        
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
        const stateString = btoa(JSON.stringify({
            simulation: currentSimulation,
            colorblind: isColorblindMode,
            timestamp: Date.now()
        }));
        
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
    showNotification('Generating SVG download...', 'info');
    
    // Show loading state
    const downloadBtn = $('#download-svg');
    const originalText = downloadBtn.html();
    downloadBtn.html('<span class="btn-icon">⏳</span> Generating...').prop('disabled', true);
    
    $.ajax({
        url: bahamas_ajax.ajax_url,
        type: 'POST',
        data: {
            action: 'download_svg',
            nonce: bahamas_ajax.nonce,
            simulation_data: JSON.stringify(currentSimulation),
            colorblind_mode: isColorblindMode ? 'true' : 'false'  // Fixed: ensure proper boolean string
        },
        success: function(response) {
            downloadBtn.html(originalText).prop('disabled', false);
            
            if (response.success && response.data.svg_content) {
                // Create blob and download
                const blob = new Blob([response.data.svg_content], { 
                    type: 'image/svg+xml;charset=utf-8' 
                });
                const url = window.URL.createObjectURL(blob);
                
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = response.data.filename;
                downloadLink.style.display = 'none';
                
                // Trigger download
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                // Clean up
                window.URL.revokeObjectURL(url);
                
                const modeText = response.data.colorblind_mode ? ' (Colorblind Mode)' : '';
                showNotification(`Map downloaded successfully${modeText}!`, 'success');
                console.log('✅ SVG downloaded:', response.data.filename);
                
                // Show helpful tip
                setTimeout(() => {
                    showNotification('💡 Tip: The downloaded SVG can be opened in any browser or vector graphics program!', 'info');
                }, 2000);
                
            } else {
                showNotification('Failed to generate download', 'error');
                console.error('❌ Download failed:', response);
            }
        },
        error: function(xhr, status, error) {
            downloadBtn.html(originalText).prop('disabled', false);
            showNotification('Download failed: ' + error, 'error');
            console.error('❌ Download AJAX failed:', error);
            
            // Provide fallback option
            setTimeout(() => {
                showNotification('💡 Try refreshing the page and downloading again', 'info');
            }, 2000);
        }
    });
}
    
   function loadEnhancedSVGMap() {
        const mapContainer = $('#bahamas-map');
        
        mapContainer.html('<div class="map-loading"><span>Loading interactive SVG map...</span></div>');
        
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
                    mapContainer.html(response.data.svg);
                    setupConstituencyHandlers();
                    
                    setTimeout(() => {
                        Object.keys(currentSimulation).forEach(id => {
                            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
                        });
                        updateSeatCounts();
                        updateLegendColors();
                    }, 100);
                    
                    console.log('✅ Enhanced SVG map loaded successfully');
                    showNotification('Interactive SVG map loaded!', 'success');
                } else {
                    console.warn('⚠️ SVG load failed, falling back to grid');
                    loadFallbackMap();
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX failed:', error);
                loadFallbackMap();
            }
        });
    }

    function loadFallbackMap() {
        const mapContainer = $('#bahamas-map');
        const fallbackHTML = generateEnhancedFallbackHTML();
        mapContainer.html(fallbackHTML);
        setupConstituencyHandlers();
        updateLegendColors();
        showNotification('Using fallback grid view', 'info');
    }
	
    function generateEnhancedFallbackHTML() {
        let html = '<div class="enhanced-fallback-container">';
        
        // Nassau section
        html += '<div class="fallback-section nassau-section">';
        html += '<h4>NASSAU / NEW PROVIDENCE (24 Constituencies)</h4>';
        html += '<div class="nassau-grid">';
        
        for (let i = 1; i <= 24; i++) {
            const constituency = constituencyData[i];
            const party = currentSimulation[i] || 'PLP';
            const colors = getCurrentColors();
            
            html += `
                <div class="constituency-item nassau-item" 
                     data-constituency="${i}" 
                     data-party="${party}"
                     data-region="Nassau"
                     style="background-color: ${colors[party]}">
                    <span class="constituency-number">${i}</span>
                    <span class="constituency-name">${constituency ? constituency.constituency_name : 'Unknown'}</span>
                </div>
            `;
        }
        html += '</div></div>';
        
        // Grand Bahama section
        html += '<div class="fallback-section gb-section">';
        html += '<h4>GRAND BAHAMA (5 Constituencies)</h4>';
        html += '<div class="gb-grid">';
        
        for (let i = 25; i <= 29; i++) {
            const constituency = constituencyData[i];
            const party = currentSimulation[i] || 'PLP';
            const colors = getCurrentColors();
            
            html += `
                <div class="constituency-item gb-item" 
                     data-constituency="${i}" 
                     data-party="${party}"
                     data-region="Grand Bahama"
                     style="background-color: ${colors[party]}">
                    <span class="constituency-number">${i}</span>
                    <span class="constituency-name">${constituency ? constituency.constituency_name : 'Unknown'}</span>
                </div>
            `;
        }
        html += '</div></div>';
        
        // Family Islands section
        html += '<div class="fallback-section fi-section">';
        html += '<h4>FAMILY ISLANDS (10 Constituencies)</h4>';
        html += '<div class="fi-grid">';
        
        for (let i = 30; i <= 39; i++) {
            const constituency = constituencyData[i];
            const party = currentSimulation[i] || 'PLP';
            const colors = getCurrentColors();
            
            html += `
                <div class="constituency-item fi-item" 
                     data-constituency="${i}" 
                     data-party="${party}"
                     data-region="Family Islands"
                     style="background-color: ${colors[party]}">
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
                const data = JSON.parse(atob(simulationParam));
                
                if (data.simulation) {
                    const validConstituencies = Object.keys(data.simulation).every(id => 
                        id >= 1 && id <= 39 && PARTIES.includes(data.simulation[id])
                    );
                    
                    if (validConstituencies) {
                        currentSimulation = data.simulation;
                        
                        if (data.colorblind !== undefined) {
                            isColorblindMode = data.colorblind;
                            $('#colorblind-mode').prop('checked', isColorblindMode);
                            if (isColorblindMode) {
                                enableColorblindMode();
                            }
                        }
                        
                        Object.keys(data.simulation).forEach(id => {
                            updateConstituencyVisual(parseInt(id), data.simulation[id]);
                        });
                        
                        updateSeatCounts();
                        updateLegendColors();
                        updateSimulationStatus('Shared Simulation', true);
                        showNotification('Simulation loaded from URL!', 'success');
                    }
                }
            } catch (e) {
                console.error('❌ Invalid simulation URL parameter:', e);
                showNotification('Invalid simulation URL parameter', 'error');
            }
        }
    }
    
    // Load simulation from URL after initialization
    setTimeout(loadSimulationFromUrl, 500);
    
    console.log('🎉 Bahamas Election Map initialized with enhanced features!');
    console.log('✨ New features: Reset Button, Colorblind Mode, SVG Download');
    console.log('⌨️ Keyboard shortcuts: Ctrl+R (Reset), Ctrl+D (Download), Ctrl+S (Share)');
    
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
	
	$('#flip-all-plp').on('click', function() {
    flipAllConstituencies('PLP');
});

$('#flip-all-fnm').on('click', function() {
    flipAllConstituencies('FNM');
});

$('#flip-nassau').on('click', function() {
    flipRegion('Nassau');
});

// NEW: Grand Bahama flip
$('#flip-grand-bahama').on('click', function() {
    flipRegion('GrandBahama');
});

// NEW: Family Islands flip
$('#flip-family-islands').on('click', function() {
    flipRegion('FamilyIslands');
});

// NEW: Random simulation
$('#random-simulation').on('click', function() {
    generateRandomSimulation();
});

/**
 * ADD THESE NEW FUNCTIONS TO YOUR JAVASCRIPT FILE
 */

// Enhanced flipRegion function with all three regions
function flipRegion(region) {
    let constituencies = [];
    let regionName = '';
    
    if (region === 'Nassau') {
        constituencies = Array.from({length: 24}, (_, i) => i + 1);
        regionName = 'Nassau';
    } else if (region === 'GrandBahama') {
        constituencies = Array.from({length: 5}, (_, i) => i + 25);
        regionName = 'Grand Bahama';
    } else if (region === 'FamilyIslands') {
        constituencies = Array.from({length: 10}, (_, i) => i + 30);
        regionName = 'Family Islands';
    }
    
    if (constituencies.length > 0) {
        // Determine which party to flip to (opposite of current majority in region)
        const regionParties = constituencies.map(id => currentSimulation[id]);
        const partyCounts = {};
        regionParties.forEach(party => {
            partyCounts[party] = (partyCounts[party] || 0) + 1;
        });
        
        const currentMajority = Object.keys(partyCounts).reduce((a, b) => 
            partyCounts[a] > partyCounts[b] ? a : b
        );
        
        const newParty = currentMajority === 'PLP' ? 'FNM' : 'PLP';
        
        if (confirm(`This will flip all ${regionName} constituencies to ${newParty}. Continue?`)) {
            constituencies.forEach(id => {
                currentSimulation[id] = newParty;
                updateConstituencyVisual(id, newParty);
            });
            
            updateSeatCounts();
            updateSimulationStatus(`${regionName} Flipped to ${newParty}`, true);
            showNotification(`${regionName} flipped to ${newParty}`, 'success');
            
            // Add visual effect
            addRegionFlipEffect(region);
        }
    }
}

// NEW: Generate random simulation
function generateRandomSimulation() {
    if (confirm('This will generate a completely random election result. Continue?')) {
        for (let i = 1; i <= 39; i++) {
            // Weight the randomness: PLP 40%, FNM 35%, Others 25%
            const rand = Math.random();
            let party;
            
            if (rand < 0.40) {
                party = 'PLP';
            } else if (rand < 0.75) {
                party = 'FNM';
            } else if (rand < 0.85) {
                party = 'COI';
            } else if (rand < 0.95) {
                party = 'DNA';
            } else {
                party = 'IND';
            }
            
            currentSimulation[i] = party;
            updateConstituencyVisual(i, party);
        }
        
        updateSeatCounts();
        updateSimulationStatus('Random Simulation', true);
        showNotification('Random election generated!', 'success');
        
        // Add fun visual effect
        addRandomSimulationEffect();
    }
}

// NEW: Add visual effect for region flipping
function addRegionFlipEffect(region) {
    let constituencies = [];
    
    if (region === 'Nassau') {
        constituencies = Array.from({length: 24}, (_, i) => i + 1);
    } else if (region === 'GrandBahama') {
        constituencies = Array.from({length: 5}, (_, i) => i + 25);
    } else if (region === 'FamilyIslands') {
        constituencies = Array.from({length: 10}, (_, i) => i + 30);
    }
    
    // Staggered animation effect
    constituencies.forEach((id, index) => {
        setTimeout(() => {
            const element = $(`[data-constituency="${id}"]`);
            element.addClass('updated');
            setTimeout(() => element.removeClass('updated'), 600);
        }, index * 50);
    });
}

// NEW: Add visual effect for random simulation
function addRandomSimulationEffect() {
    // Animate all constituencies in random order
    const allConstituencies = Array.from({length: 39}, (_, i) => i + 1);
    const shuffled = allConstituencies.sort(() => Math.random() - 0.5);
    
    shuffled.forEach((id, index) => {
        setTimeout(() => {
            const element = $(`[data-constituency="${id}"]`);
            element.addClass('updated');
            setTimeout(() => element.removeClass('updated'), 600);
        }, index * 30);
    });
    
    // Show confetti effect (simple text animation)
    setTimeout(() => {
        showNotification('🎊 Random simulation complete!', 'success');
    }, 1500);
}
	function showEnhancedNotification(message, type = 'info', duration = 4000) {
    $('.notification').remove();
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️',
        'warning': '⚠️'
    };
    
    const notification = $(`
        <div class="notification notification-${type}">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `);
    
    $('body').append(notification);
    
    setTimeout(() => {
        notification.fadeOut(() => notification.remove());
    }, duration);
    
    notification.find('.notification-close').on('click', () => {
        notification.fadeOut(() => notification.remove());
    });
}
function getSimulationStatistics() {
    const stats = {
        total: 39,
        parties: {},
        regions: {
            Nassau: { total: 24, parties: {} },
            'Grand Bahama': { total: 5, parties: {} },
            'Family Islands': { total: 10, parties: {} }
        }
    };
    
    // Count by party
    PARTIES.forEach(party => {
        stats.parties[party] = 0;
        Object.values(stats.regions).forEach(region => {
            region.parties[party] = 0;
        });
    });
    
    // Nassau (1-24)
    for (let i = 1; i <= 24; i++) {
        const party = currentSimulation[i];
        stats.parties[party]++;
        stats.regions.Nassau.parties[party]++;
    }
    
    // Grand Bahama (25-29)
    for (let i = 25; i <= 29; i++) {
        const party = currentSimulation[i];
        stats.parties[party]++;
        stats.regions['Grand Bahama'].parties[party]++;
    }
    
    // Family Islands (30-39)
    for (let i = 30; i <= 39; i++) {
        const party = currentSimulation[i];
        stats.parties[party]++;
        stats.regions['Family Islands'].parties[party]++;
    }
    
    return stats;
}

// NEW: Intelligent party suggestions
function suggestCompetitiveScenario() {
    if (confirm('This will create a competitive scenario with close results. Continue?')) {
        // Create a scenario where PLP has 20 seats (exact majority)
        // FNM has 18 seats, and others have 1 seat
        
        const scenarios = [
            { party: 'PLP', count: 20 },
            { party: 'FNM', count: 18 },
            { party: 'DNA', count: 1 }
        ];
        
        let constituencyIndex = 1;
        scenarios.forEach(scenario => {
            for (let i = 0; i < scenario.count; i++) {
                currentSimulation[constituencyIndex] = scenario.party;
                updateConstituencyVisual(constituencyIndex, scenario.party);
                constituencyIndex++;
            }
        });
        
        updateSeatCounts();
        updateSimulationStatus('Competitive Scenario', true);
        showNotification('Competitive scenario created: PLP 20, FNM 18, DNA 1', 'success');
    }
}

// NEW: Historical scenarios
function loadHistoricalScenario(year) {
    const scenarios = {
        2017: {
            // 2017 FNM victory
            description: '2017 Election (FNM Victory)',
            results: {
                1: 'FNM', 2: 'PLP', 3: 'PLP', 4: 'PLP', 5: 'FNM', 6: 'PLP', 7: 'PLP', 8: 'PLP', 9: 'PLP', 10: 'FNM',
                11: 'PLP', 12: 'FNM', 13: 'PLP', 14: 'FNM', 15: 'FNM', 16: 'FNM', 17: 'FNM', 18: 'FNM', 19: 'FNM', 20: 'FNM',
                21: 'FNM', 22: 'FNM', 23: 'FNM', 24: 'FNM', 25: 'FNM', 26: 'FNM', 27: 'FNM', 28: 'FNM', 29: 'FNM', 30: 'FNM',
                31: 'FNM', 32: 'FNM', 33: 'FNM', 34: 'FNM', 35: 'FNM', 36: 'FNM', 37: 'FNM', 38: 'FNM', 39: 'FNM'
            }
        },
        2021: DEFAULT_2021_RESULTS
    };
    
    if (scenarios[year]) {
        if (confirm(`Load ${scenarios[year].description}?`)) {
            currentSimulation = { ...scenarios[year].results || scenarios[year] };
            
            Object.keys(currentSimulation).forEach(id => {
                updateConstituencyVisual(parseInt(id), currentSimulation[id]);
            });
            
            updateSeatCounts();
            updateSimulationStatus(scenarios[year].description || `${year} Election Results`, true);
            showNotification(`${year} election results loaded!`, 'success');
        }
    }
}

// NEW: Export simulation data
function exportSimulationData() {
    const stats = getSimulationStatistics();
    const timestamp = new Date().toLocaleString();
    
    const exportData = {
        timestamp: timestamp,
        simulation: currentSimulation,
        statistics: stats,
        isColorblindMode: isColorblindMode,
        isModified: isSimulationModified
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `bahamas-election-simulation-${Date.now()}.json`;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    window.URL.revokeObjectURL(url);
    
    showNotification('Simulation data exported successfully!', 'success');
}

// NEW: Keyboard shortcuts help
function showKeyboardShortcuts() {
    const shortcuts = `
        <div class="shortcuts-modal">
            <div class="shortcuts-content">
                <h3>⌨️ Keyboard Shortcuts</h3>
                <div class="shortcuts-list">
                    <div><kbd>Ctrl</kbd> + <kbd>R</kbd> - Reset to 2021</div>
                    <div><kbd>Ctrl</kbd> + <kbd>D</kbd> - Download SVG</div>
                    <div><kbd>Ctrl</kbd> + <kbd>S</kbd> - Share Simulation</div>
                    <div><kbd>Ctrl</kbd> + <kbd>C</kbd> - Toggle Colorblind Mode</div>
                    <div><kbd>Ctrl</kbd> + <kbd>?</kbd> - Show this help</div>
                    <div><kbd>Space</kbd> - Random Simulation</div>
                    <div><kbd>1</kbd> - All PLP</div>
                    <div><kbd>2</kbd> - All FNM</div>
                    <div><kbd>N</kbd> - Flip Nassau</div>
                    <div><kbd>G</kbd> - Flip Grand Bahama</div>
                    <div><kbd>F</kbd> - Flip Family Islands</div>
                </div>
                <button class="close-shortcuts">Close</button>
            </div>
        </div>
    `;
    
    $('body').append(shortcuts);
    
    $('.close-shortcuts, .shortcuts-modal').on('click', function(e) {
        if (e.target === this) {
            $('.shortcuts-modal').fadeOut(() => $('.shortcuts-modal').remove());
        }
    });
}
});
