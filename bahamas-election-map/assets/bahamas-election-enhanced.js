/**
 * COMPLETE UPDATED JavaScript for Overlay Layout with Mobile Social Icons
 * Client-side only simulations with new overlay styling and mobile social repositioning
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
    
    // BACKUP 2021 RESULTS (only used for reset function)
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
        26: 'COI',  // Grand Central Bahama - FIXED: This was PLP in your admin but should be COI in 2021
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
	let flipPredictions = {};
    let selectedConstituency = null;
    let isColorblindMode = false;
    let isSimulationModified = false;
    
    // Mobile zoom variables
    let isZooming = false;
    let isPanning = false;
    let initialDistance = 0;
    let currentScale = 1;
    let minScale = 0.5;
    let maxScale = 3;
    let translateX = 0;
    let translateY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let mapSvgElement = null;
    let touchStartTime = 0;
    let touchMoved = false;
    let mapContainer = null;
    
    // Initialize
    init();
    
    function init() {
    injectOverlayStyles();
    injectStickySeatCounterStyles();
    injectMobileSocialStyles();
    loadConstituencyData();
    injectStickyOverlayStyles();
    
    // CRITICAL FIX: Load shared simulation FIRST, before any other initialization
    const hasSharedSimulation = loadSimulationFromUrl();
    
    if (!hasSharedSimulation) {
        // Only load database state if no shared simulation
        loadCurrentDatabaseState();
        initializeFlipPredictions();
    }
    
    setupEventListeners();
    setupImageErrorHandling();
    loadEnhancedSVGMap();
    initializeColorblindMode();
    injectEnhancedStickyStyles();
    
    setTimeout(() => {
        initializeStickySeatCounter();
        enhanceForMobile();
        initializeStickyConstituencyOverlay();
        repositionSocialIconsForMobile();
    }, 1000);
    
    console.log('🎉 Bahamas Election Map initialized with short URL sharing!');
}

	
	function loadCurrentDatabaseState() {
        console.log('📊 Loading current database state...');
        
        // Build current simulation from loaded constituency data
        Object.keys(constituencyData).forEach(id => {
            const constituency = constituencyData[id];
            currentSimulation[id] = constituency.current_party || 'PLP';
        });
        
        // Update all visuals with current database state
        Object.keys(currentSimulation).forEach(id => {
            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
        });
        
        updateSeatCounts();
        clearConstituencyInfo();
        
        // Determine status based on whether current state matches 2021 results
        const matches2021 = Object.keys(DEFAULT_2021_RESULTS).every(id => 
            currentSimulation[id] === DEFAULT_2021_RESULTS[id]
        );
        
        if (matches2021) {
            updateSimulationStatus('2021 Election Results', false);
            isSimulationModified = false;
        } else {
            updateSimulationStatus('Current Database State', false);
            isSimulationModified = false; // Not modified by user, just different from 2021
        }
        
        console.log('✅ Loaded current database state:', currentSimulation);
    }
	
    // Add this function to handle image loading errors
    function setupImageErrorHandling() {
        // Handle image loading errors
        $(document).on('error', '#mp-photo', function() {
            console.warn('Failed to load MP image:', $(this).attr('src'));
            
            // Hide photo container and show avatar icon
            $('#mp-photo-container').hide();
            $('#mp-avatar-icon').show();
            
            // Optional: Show a notification
            showNotification('MP photo failed to load', 'warning', 2000);
        });
        
        // Handle successful image loading
        $(document).on('load', '#mp-photo', function() {
            console.log('MP image loaded successfully:', $(this).attr('src'));
        });
    }
    
	function injectMobileSocialStyles() {
    if ($('#bahamas-mobile-social-styles').length === 0) {
        const mobileSocialCSS = `
            <style id="bahamas-mobile-social-styles">
            /* Parent Container for MP Avatar + Social Icons - MOBILE ONLY */
            @media (max-width: 768px) {
                .parent-info {
                    display: flex !important;
                    flex-direction: column;
                    gap: 15px;
                    margin-bottom: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    padding: 15px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    align-items: center;
                    text-align: center;
                }
                
                /* Mobile Social Icons within Parent Container */
                .parent-info .social-share-container.mobile-social-icons {
                    margin: 0 !important;
                    padding: 10px !important;
                    background: rgba(248, 249, 250, 0.8) !important;
                    border-radius: 8px !important;
                    border: 1px solid rgba(0, 0, 0, 0.1) !important;
                    align-self: stretch !important;
                    flex-direction: row;
                }
                
                .parent-info .social-share-container.mobile-social-icons .social-share-label {
                    font-size: 15px !important;
                    margin-bottom: 8px !important;
                    text-align: center !important;
                    width: 5% !important;
                    color: #6c757d !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                }
                
                .parent-info .social-share-container.mobile-social-icons .social-share-buttons {
                    justify-content: center !important;
                    gap: 10px !important;
                    flex-wrap: wrap !important;
                    width: 88%;
                }
                
                .parent-info .social-share-container.mobile-social-icons .social-share-btn {
                    width: 36px !important;
                    height: 36px !important;
                    line-height: 32px !important;
                    font-size: 20px !important;
                    border-radius: 50% !important;
                    transition: transform 0.2s ease !important;
                }
                
                /* MP Avatar adjustments within parent container - MOBILE ONLY */
                .parent-info .mp-avatar {
                    position: relative !important;
                    top: auto !important;
                    right: auto !important;
                    margin: 0 !important;
                    padding: 10px !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                
                .constituency-info-overlay {
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .constituency-info-overlay .parent-info {
                    order: 1 !important;
                }
                
                .constituency-info-overlay .info-details {
                    order: 2 !important;
                }
                
                .constituency-info-overlay .legend-compact {
                    order: 3 !important;
                }
            }
            
            @media (max-width: 520px) {
                .parent-info {
                    margin-top: 20px;
                    padding: 10px !important;
                    gap: 12px !important;
                }
                .map-controls {
                    display: none;
                }
            }
            
            /* Extra small screens */
            @media (max-width: 480px) {
                .parent-info {
                    margin-top: 20px;
                    padding: 26px !important;
                    gap: 12px !important;
                }
                
                .parent-info .social-share-container.mobile-social-icons {
                    padding: 8px !important;
                }
                
                .parent-info .social-share-container.mobile-social-icons .social-share-btn {
                    width: 32px !important;
                    height: 32px !important;
                    line-height: 30px !important;
                    font-size: 20px !important;
                }
            }
            
            /* DESKTOP - NO STICKY, just absolute positioning */
            @media (min-width: 769px) {
                /* Desktop MP Avatar Positioning - NO STICKY */
                .mp-avatar {
                    position: absolute !important;
                    top: 20px !important;
                    right: 347px !important;
                    transition: all 0.3s ease !important;
                    z-index: 10 !important;
                }
                
                /* Remove all sticky states for desktop */
                .mp-avatar.sticky {
                    position: absolute !important; /* Keep absolute, not fixed */
                    top: 20px !important;
                    right: 347px !important;
                    z-index: 10 !important; /* Lower z-index */
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important; /* Regular shadow */
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    background: rgba(255, 255, 255, 0.95) !important;
                    border: 1px solid rgba(0, 0, 0, 0.1) !important;
                    animation: none !important; /* No animation */
                }
                
                .constituency-info-overlay.sticky {
                    position: absolute !important; /* Keep absolute, not fixed */
                    top: 20px !important;
                    right: 20px !important;
                    z-index: 10 !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
                    backdrop-filter: blur(10px) !important;
                    -webkit-backdrop-filter: blur(10px) !important;
                    background: rgba(255, 255, 255, 0.95) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    animation: none !important;
                }
            }
            </style>
        `;
        
        $('head').append(mobileSocialCSS);
        console.log('✅ Mobile social styles with desktop non-sticky support injected');
    }
}
	
    // CRITICAL: Inject overlay styles if not already present
    function injectOverlayStyles() {
        if ($('#bahamas-overlay-styles').length === 0) {
            const overlayCSS = `
                <style id="bahamas-overlay-styles">
                /* Map Container with Overlay */
                .map-container-with-overlay {
                    position: relative !important;
                    width: 100% !important;
                    margin-bottom: 0px !important;
                }
                
                #bahamas-map {
                    background: white !important;
                    border-radius: 15px !important;
                    padding: 20px !important;
                    min-height: 800px !important;
                    width: 80% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
                    overflow: hidden !important;
                    position: relative !important;
                    touch-action: none !important;
                }
                
                /* Constituency Info Overlay */
                .constituency-info-overlay {
                    position: absolute !important;
                    top: 20px !important;
                    right: 20px !important;
                    width: 320px !important;
                    max-height: calc(100% - 40px) !important;
                    background: rgba(255, 255, 255, 0.95) !important;
                    backdrop-filter: blur(10px) !important;
                    -webkit-backdrop-filter: blur(10px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    border-radius: 15px !important;
                    padding: 20px !important;
                    overflow-y: auto !important;
                    z-index: 10 !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
                    transition: all 0.3s ease !important;
                    pointer-events: auto !important;
                    touch-action: auto !important;
                }
                
                .constituency-info-overlay:hover {
                    background: rgba(255, 255, 255, 0.98) !important;
                    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15) !important;
                }
                
                .info-header {
                    text-align: center !important;
                    margin-bottom: 20px !important;
                    border-bottom: 2px solid #e9ecef !important;
                    padding-bottom: 15px !important;
                }
                
                .info-header h4 {
                    margin: 0 !important;
                    color: #2c3e50 !important;
                    font-size: 18px !important;
                    font-weight: 600 !important;
                }

                /* MP Avatar Section with Photo */
                .mp-photo-container {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    overflow: hidden;
                    margin: 0 auto 10px;
                    border: 3px solid #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    background: #f8f9fa;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .mp-profile-photo {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                    transition: opacity 0.3s ease;
                }

                .mp-profile-photo:hover {
                    opacity: 0.9;
                }

                .mp-avatar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    min-width: 200px;
                    transition: all 0.3s ease;
					position: absolute !important;
                    top: 20px !important;
                    right: 347px !important;
                }

                .mp-avatar:hover {
                    background: rgba(255, 255, 255, 0.98);
                    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
                }

                .avatar-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                    display: block;
                }

                .avatar-icon[style*="display: none"] {
                    display: none !important;
                }
                
                #info-mp-name {
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    color: #2c3e50 !important;
                    margin-bottom: 5px !important;
                    display: block !important;
                }
                
                #info-party-badge {
                    display: inline-block !important;
                    padding: 4px 12px !important;
                    border-radius: 20px !important;
                    font-size: 12px !important;
                    font-weight: bold !important;
                    color: white !important;
                    background: #6c757d !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                }
                
                /* Info Details */
                .info-details {
                    margin-bottom: 0px !important;
                }
                
                .info-row {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    margin-bottom: 0px !important;
                    padding: 0px 0 !important;
                    border-bottom: 0px solid rgba(0, 0, 0, 0.05) !important;
                }
                .info-label {
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #6c757d !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    flex: 1 !important;
                }
                
                .info-row span:last-child {
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    color: #2c3e50 !important;
                    text-align: right !important;
                    flex: 1 !important;
                }
                
                /* Party Selector Overlay */
                .party-selector-overlay {
                    margin-bottom: 20px !important;
                    padding: 15px !important;
                    background: rgba(248, 249, 250, 0.8) !important;
                    border-radius: 12px !important;
                    border: 1px solid rgba(0, 0, 0, 0.05) !important;
                }
                
                .party-buttons-grid {
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 8px !important;
                }
                
                .party-btn {
                    padding: 10px 8px !important;
                    border: none !important;
                    border-radius: 8px !important;
                    cursor: pointer !important;
                    font-size: 11px !important;
                    font-weight: bold !important;
                    transition: all 0.3s ease !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.3px !important;
                }
                
                .party-btn:hover {
                    transform: scale(1.05) !important;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2) !important;
                }
                
                .party-btn.active {
                    transform: scale(1.05) !important;
                    box-shadow: 0 0 15px rgba(0,123,255,0.4) !important;
                    border: 2px solid #007bff !important;
                }
                
                /* Party button colors */
                .plp-btn { background: #FFD700 !important; color: #333 !important; }
                .fnm-btn { background: #FF0000 !important; color: white !important; }
                .coi-btn { background: #00FFFF !important; color: #333 !important; }
                .dna-btn { background: #00FF00 !important; color: #333 !important; }
                .ind-btn { background: #808080 !important; color: white !important; }
                
                /* Compact Legend */
                .legend-compact {
                    border-top: 2px solid #e9ecef !important;
                    padding-top: 15px !important;
                }
                
                .legend-title {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    color: #2c3e50 !important;
                    margin-bottom: 12px !important;
                    text-align: center !important;
                }
                
                .legend-items-compact {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 8px !important;
                }
                
                .legend-item-compact {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    font-size: 11px !important;
                    line-height: 1.3 !important;
                }
                
                .color-dot {
                    width: 12px !important;
                    height: 12px !important;
                    border-radius: 50% !important;
                    border: 1px solid rgba(0, 0, 0, 0.2) !important;
                    flex-shrink: 0 !important;
                }
                /* Legend colors */
                .plp-color { background: linear-gradient(135deg, #FFD700, #FFA500) !important; }
                .fnm-color { background: linear-gradient(135deg, #FF0000, #CC0000) !important; }
                .coi-color { background: linear-gradient(135deg, #00FFFF, #0099CC) !important; }
                .dna-color { background: linear-gradient(135deg, #00FF00, #228B22) !important; }
                .ind-color { background: linear-gradient(135deg, #808080, #555555) !important; }
                
                /* Mobile Zoom Styles */
                #bahamas-map svg,
                .zoom-wrapper {
                    transform-origin: center center !important;
                    transition: transform 0.2s ease !important;
                    will-change: transform !important;
                    user-select: none !important;
                    -webkit-user-select: none !important;
                    touch-action: none !important;
                }
                
                .map-zooming #bahamas-map svg,
                .map-zooming .zoom-wrapper {
                    transition: none !important;
                }
                
                .map-zooming {
                    cursor: grab !important;
                }
                
                .map-zooming:active {
                    cursor: grabbing !important;
                }
                
                .no-select {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                
                #mobile-zoom-controls {
					display: none !important;
				}

				/* Remove all zoom control button styles since they won't be used */
				.zoom-control-btn {
					display: none !important;
				}

                /* Hide old layout elements */
                .bottom-controls-section,
                .bottom-controls-grid,
                .quick-actions-panel,
                .quick-actions-grid,
                .quick-btn-large,
                .map-container,
                .map-container-fullwidth,
                .constituency-info:not(.constituency-info-overlay),
                .map-legend {
                    display: none !important;
                }
                
                /* Responsive */
                @media (max-width: 1025px) {
                    .constituency-info-overlay {
                        position: relative !important;
                        top: auto !important;
                        right: auto !important;
                        width: 100% !important;
                        margin-top: -20px !important;
                        max-height: none !important;
                        background: white !important;
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                    }
                    
                    .map-container-with-overlay {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    
                    .mp-avatar {
                        position: relative !important;
                        top: auto !important;
                        right: auto !important;
                        margin-top: 20px !important;
                    }
					.parent-info{
						display:flex;
						flex-direction: row;
						gap: 10px;
						margin-bottom: 0px;
					}
                }

                @media (max-width: 768px) {
                    #bahamas-map {
                        min-height: 260px !important;
                        touch-action: none !important;
						width: 100% !important;
                    }
                    
                    .mp-photo-container {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .mp-profile-photo {
                        width: 60px;
                        height: 60px;
                    }
                    .mp-avatar{
						width: 100% !important;
                        max-height: 300px !important;
                        bottom: 20px !important;
                        top: 0px !important;
                        right: 0px !important;
                        left: 0px !important;
					}

                    .avatar-icon {
                        font-size: 36px;
						display: none !important;
                    }
                    #info-mp-name {
                        font-size: 14px;
                    }
                    
                   #mobile-zoom-controls {
						display: none !important;
					}
                    .map-container-with-overlay {
                        display: flex !important;
                        flex-direction: column-reverse !important;
                    }
                    .constituency-info-overlay {
                        width: 100% !important;
                        max-height: 440px !important;
                        bottom: 20px !important;
                        top: 0px !important;
                        right: 0px !important;
                        left: 0px !important;
                    }
                    
                    /* Prevent zoom on double-tap for other elements */
                    .seat-counter, .map-controls, .social-share-container {
                        touch-action: manipulation !important;
                    }
					 .parent-info{
						display:flex;
						flex-direction: row;
					}
					.info-row {
						flex-direction: row;
						align-items: flex-start !important;
						gap: 4px;
					}
					.info-row span:last-child{
						text-align: center !important;
					}
                }

                @media (min-width: 769px) {
                    #mobile-zoom-controls {
                        display: none !important;
                    }
                }
                
                .btn-share {
                    background: linear-gradient(135deg, #17a2b8, #138496);
                    color: white;
                }

                /* Colorblind mode adjustments */
                .colorblind-mode .plp-color { background: linear-gradient(135deg, #FFA500, #FF8C00) !important; }
                .colorblind-mode .coi-color { background: linear-gradient(135deg, #0066CC, #004499) !important; }
                .colorblind-mode .fnm-color { background: linear-gradient(135deg, #CC0000, #990000) !important; }
                .colorblind-mode .dna-color { background: linear-gradient(135deg, #228B22, #006400) !important; }
                .colorblind-mode .ind-color { background: linear-gradient(135deg, #666666, #444444) !important; }


                </style>
            `;
            
            $('head').append(overlayCSS);
            console.log('✅ Overlay styles injected');
        }
    }
    
    function loadConstituencyData() {
        const dataScript = document.getElementById('constituency-data');
        if (dataScript) {
            const data = JSON.parse(dataScript.textContent);
            data.forEach(constituency => {
                constituencyData[constituency.constituency_number] = constituency;
            });
            console.log('✅ Loaded constituency data:', constituencyData);
        }
    }
    
     function resetTo2021Results() {
        if (isSimulationModified) {
            if (!confirm('This will reset all changes and return to 2021 election results. Are you sure?')) {
                return;
            }
        }
        
        // Update simulation state
        currentSimulation = { ...DEFAULT_2021_RESULTS };
        isSimulationModified = false;
        
        // Update all visuals
        Object.keys(currentSimulation).forEach(id => {
            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
        });
        
        updateSeatCounts();
        clearConstituencyInfo();
        updateSimulationStatus('2021 Election Results (Temporary)', true); // Mark as modified since it's different from DB
        
        console.log('✅ Reset to 2021 election results (temporary simulation)');
        showNotification('Reset to 2021 Election Results (Simulation Only)', 'success');
    }
    
function injectStickySeatCounterStyles() {
    if ($('#bahamas-sticky-seat-counter-styles').length === 0) {
        const stickyCSS = `
            <style id="bahamas-sticky-seat-counter-styles">
            /* Sticky Seat Counter Styles - MOBILE/TABLET ONLY */
            @media (max-width: 768px) {
                .seat-counter {
                    position: relative !important;
                    transition: all 0.3s ease !important;
                    z-index: 999 !important;
                }
                
                .seat-counter.sticky {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    z-index: 1000 !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
                    backdrop-filter: blur(10px) !important;
                    -webkit-backdrop-filter: blur(15px) !important;
                    background: white !important;
                    border-radius: 0 !important;
                    margin-bottom: 0 !important;
                    padding: 12px 15px !important;
                    animation: stickySlideIn 0.3s ease-out !important;
                    display: block !important;
                }
                
                .seat-counter.sticky h3,
                .seat-counter.sticky .regional-breakdown,
                .seat-counter.sticky #majority-indicator {
                    display: none !important;
                }
                
                .seat-counter.sticky .party-totals {
                    justify-content: center !important;
                    margin-bottom: 0 !important;
                    gap: 8px !important;
                    flex-wrap: nowrap;
                }
                
                .seat-counter.sticky .party-count {
                    min-width: 60px !important;
                    padding: 8px 12px !important;
                    flex-direction: row !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                
                .seat-counter.sticky .party-name {
                    font-size: 12px !important;
                }
                
                .seat-counter.sticky .seat-count {
                    font-size: 18px !important;
                }
                
                /* WordPress admin bar on mobile */
                @media (max-width: 782px) {
                    .admin-bar .seat-counter.sticky {
                        top: 0px !important;
                    }
                }
                
                /* Sticky animation */
                @keyframes stickySlideIn {
                    from {
                        transform: translateY(-100%) !important;
                        opacity: 0 !important;
                    }
                    to {
                        transform: translateY(0) !important;
                        opacity: 1 !important;
                    }
                }
            }
            
            /* Desktop - NO STICKY */
            @media (min-width: 769px) {
                .seat-counter.sticky {
                    position: relative !important; /* Override to relative */
                    top: auto !important;
                    left: auto !important;
                    right: auto !important;
                    z-index: auto !important;
                    box-shadow: none !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    animation: none !important;
                }
            }
            
            /* Sticky placeholder */
            .seat-counter-placeholder {
                display: none !important;
                height: 0 !important;
                transition: height 0.3s ease !important;
            }
            
            .seat-counter-placeholder.active {
                display: block !important;
            }
            
            /* Ensure overlay doesn't conflict with sticky counter */
            .constituency-info-overlay {
                z-index: 10 !important;
            }
            
            /* Extra small screens */
            @media (max-width: 480px) {
                .seat-counter.sticky {
                    padding: 10px 12px !important;
                }
                
                .seat-counter.sticky .party-count {
                    min-width: 70px !important;
                    padding: 6px 10px !important;
                }
                
                .seat-counter.sticky .party-name {
                    font-size: 10px !important;
                }
                
                .seat-counter.sticky .seat-count {
                    font-size: 16px !important;
                }
                
                .legend-compact{
                    display:none;
                }
                
                .majority-indicator.has-majority{
                    display: none;
                }
            }
            </style>
        `;
        
        $('head').append(stickyCSS);
        console.log('✅ Mobile/tablet-only sticky seat counter styles injected');
    }
}

// Add this new function to initialize sticky functionality
function initializeStickySeatCounter() {
    console.log('🔧 Initializing sticky seat counter...');
    
    // Only initialize sticky for mobile/tablet
    if (window.innerWidth > 768) {
        console.log('📱 Desktop detected, skipping sticky seat counter');
        return;
    }
    
    const seatCounter = document.querySelector('.seat-counter');
    
    if (!seatCounter) {
        console.warn('⚠️ Seat counter not found');
        return;
    }
    
    console.log('✅ Found seat counter for mobile/tablet');
    const placeholder = document.createElement('div');
    placeholder.className = 'seat-counter-placeholder';
    seatCounter.parentNode.insertBefore(placeholder, seatCounter.nextSibling);

    let isSticky = false;
    let seatCounterHeight = 0;
    let seatCounterTop = 0;

    function updateMeasurements() {
        if (!isSticky) {
            const rect = seatCounter.getBoundingClientRect();
            seatCounterHeight = rect.height;
            seatCounterTop = rect.top + window.pageYOffset;
        }
    }
    
    function makeSticky() {
        if (!isSticky && window.innerWidth <= 768) { // Only sticky on mobile/tablet
            const currentRect = seatCounter.getBoundingClientRect();
            placeholder.style.height = currentRect.height + 'px';
            placeholder.style.width = currentRect.width + 'px';
            placeholder.style.marginTop = getComputedStyle(seatCounter).marginTop;
            placeholder.style.marginBottom = getComputedStyle(seatCounter).marginBottom;
            placeholder.classList.add('active');

            requestAnimationFrame(() => {
                isSticky = true;
                seatCounter.classList.add('sticky');
                seatCounter.style.transform = 'translateZ(0)';
                hideThemeStickyHeader();
                console.log('📌 Seat counter is now sticky (mobile/tablet)');
            });
        }
    }
    
    function removeSticky() {
        if (isSticky) {
            isSticky = false;
            seatCounter.classList.remove('sticky');
            placeholder.classList.remove('active');
            placeholder.style.height = '0px';
            placeholder.style.width = '';
            placeholder.style.marginTop = '';
            placeholder.style.marginBottom = '';
            showThemeStickyHeader();
            console.log('📌 Seat counter sticky removed');
        }
    }
    
    let scrollTimeout;
    function handleScroll() {
        // Skip if desktop
        if (window.innerWidth > 768) {
            removeSticky();
            return;
        }
        
        if (scrollTimeout) {
            cancelAnimationFrame(scrollTimeout);
        }

        scrollTimeout = requestAnimationFrame(() => {
            const scrollTop = window.pageYOffset;
            const adminBarHeight = document.body.classList.contains('admin-bar') ? 
                  (window.innerWidth <= 782 ? 46 : 32) : 0;

            const delayOffset = 50; // 50px delay for mobile
            const shouldBeSticky = scrollTop > seatCounterTop - adminBarHeight + delayOffset;

            if (shouldBeSticky && !isSticky) {
                makeSticky();
            } else if (!shouldBeSticky && isSticky) {
                removeSticky();
            }
        });
    }
    
    // Helper functions remain the same...
    function hideThemeStickyHeader() {
        const themeHeaderSelectors = [
            '.admin-bar .mkd-page-header .mkd-sticky-header.header-appear',
            '.mkd-page-header .mkd-sticky-header.header-appear',
            '.mkd-sticky-header.header-appear',
            '.mkd-page-header .mkd-sticky-header',
            '.header-appear',
            '.sticky-header',
            '.fixed-header',
            '.site-header.sticky'
        ];
        themeHeaderSelectors.forEach(selector => {
            const headers = document.querySelectorAll(selector);
            headers.forEach(header => {
                if (header && !header.hasAttribute('data-bahamas-hidden')) {
                    header.setAttribute('data-bahamas-original-display', getComputedStyle(header).display);
                    header.setAttribute('data-bahamas-hidden', 'true');
                    header.style.display = 'none !important';
                }
            });
        });
    }
    
    function showThemeStickyHeader() {
        const hiddenHeaders = document.querySelectorAll('[data-bahamas-hidden="true"]');
        hiddenHeaders.forEach(header => {
            const originalDisplay = header.getAttribute('data-bahamas-original-display');
            header.style.display = originalDisplay || '';
            header.removeAttribute('data-bahamas-hidden');
            header.removeAttribute('data-bahamas-original-display');
        });
    }

    // Initialize measurements and add event listeners
    updateMeasurements();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
        updateMeasurements();
        handleScroll();
    });

    console.log('✅ Mobile/tablet sticky seat counter initialized successfully');
}
	
	// Add this CSS to your injectOverlayStyles() function or create a separate function
function injectStickyOverlayStyles() {
    if ($('#bahamas-sticky-overlay-styles').length === 0) {
        const stickyOverlayCSS = `
            <style id="bahamas-sticky-overlay-styles">
            /* Sticky Constituency Info Overlay Styles - DESKTOP ONLY */
            @media (min-width: 1026px) {
                .constituency-info-overlay {
                    position: absolute !important;
                    top: 20px !important;
                    right: 20px !important;
                    width: 320px !important;
                    transition: all 0.3s ease !important;
                    z-index: 10 !important;
                }
                
                .constituency-info-overlay.sticky {
                    position: fixed !important;
                    top: 20px !important;
                    right: 20px !important;
                    z-index: 1001 !important;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.25) !important;
                    backdrop-filter: blur(15px) !important;
                    -webkit-backdrop-filter: blur(15px) !important;
                    background: rgba(255, 255, 255, 0.98) !important;
                    border: 2px solid rgba(255, 255, 255, 0.5) !important;
                    animation: stickyOverlaySlideIn 0.3s ease-out !important;
                    max-height: calc(100vh - 40px) !important;
                    width: 320px !important;
                }
                
                /* MP Avatar sticky positioning */
                .mp-avatar {
                    position: absolute !important;
                    top: 20px !important;
                    right: 347px !important;
                    transition: all 0.3s ease !important;
                    z-index: 9 !important;
                }
                
                .mp-avatar.sticky {
                    position: fixed !important;
                    top: 20px !important;
                    right: 347px !important;
                    z-index: 1002 !important;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.25) !important;
                    backdrop-filter: blur(15px) !important;
                    -webkit-backdrop-filter: blur(15px) !important;
                    background: rgba(255, 255, 255, 0.98) !important;
                    border: 2px solid rgba(255, 255, 255, 0.5) !important;
                    animation: stickyAvatarSlideIn 0.3s ease-out !important;
                }
                
                /* Adjust for sticky seat counter */
                .seat-counter.sticky ~ * .constituency-info-overlay.sticky,
                .constituency-info-overlay.sticky.with-sticky-counter {
                    top: 120px !important;
                    max-height: calc(100vh - 140px) !important;
                }
                
                .seat-counter.sticky ~ * .mp-avatar.sticky,
                .mp-avatar.sticky.with-sticky-counter {
                    top: 120px !important;
                }
                
                /* WordPress admin bar compatibility */
                .admin-bar .constituency-info-overlay.sticky {
                    top: 52px !important;
                }
                
                .admin-bar .mp-avatar.sticky {
                    top: 52px !important;
                }
                
                .admin-bar .constituency-info-overlay.sticky.with-sticky-counter {
                    top: 140px !important;
                }
                
                .admin-bar .mp-avatar.sticky.with-sticky-counter {
                    top: 140px !important;
                }
                
                /* Animation for sticky overlay */
                @keyframes stickyOverlaySlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                /* Animation for sticky avatar */
                @keyframes stickyAvatarSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes stickyPinPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                
                /* Ensure overlay content remains scrollable when sticky */
                .constituency-info-overlay.sticky .info-details {
                    max-height: calc(100% - 100px) !important;
                    overflow-y: auto !important;
                }
            }
            
            /* Mobile - keep relative positioning */
            @media (max-width: 1025px) {
                .constituency-info-overlay.sticky {
                    position: relative !important;
                    top: auto !important;
                    right: auto !important;
                    width: 100% !important;
                    max-height: none !important;
                    background: white !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    animation: none !important;
                    box-shadow: none !important;
                    border: 1px solid #ddd !important;
                }
                
                .mp-avatar.sticky {
                    position: relative !important;
                    top: auto !important;
                    right: auto !important;
                    z-index: auto !important;
                    box-shadow: none !important;
                    background: rgba(255, 255, 255, 0.95) !important;
                    border: 1px solid rgba(0, 0, 0, 0.1) !important;
                }
            }
            </style>
        `;
        
        $('head').append(stickyOverlayCSS);
        console.log('✅ Sticky overlay styles with avatar support injected');
    }
}

// Add this new function to initialize sticky functionality for constituency overlay
function initializeStickyConstituencyOverlay() {
    console.log('🔧 Sticky overlay disabled for all devices');
    // Completely disabled - no sticky behavior for constituency overlay or mp-avatar
    return;
}

// Also update the CSS injection to handle dynamic positioning
function injectEnhancedStickyStyles() {
    if ($('#bahamas-enhanced-sticky-styles').length === 0) {
        const enhancedStickyCSS = `
            <style id="bahamas-enhanced-sticky-styles">
            /* Enhanced Sticky Styles with Dynamic Positioning */
            @media (min-width: 1026px) {
                .constituency-info-overlay.sticky,
                .mp-avatar.sticky {
                    position: fixed !important;
                    z-index: 999 !important;
                    transition: top 0.3s ease, transform 0.3s ease !important;
                }
                
                .constituency-info-overlay.sticky {
                    right: 20px !important;
                    width: 320px !important;
                    max-height: calc(100vh - var(--sticky-top, 40px) - 20px) !important;
                }
                
                .mp-avatar.sticky {
                    right: 347px !important;
                }
                
                /* Smooth transition when sticky state changes */
                .constituency-info-overlay,
                .mp-avatar {
                    transition: all 0.3s ease !important;
                }
                
                /* Ensure proper stacking with theme headers */
                .mkd-sticky-header,
                .sticky-header,
                .fixed-header {
                    z-index: 998 !important;
                }
                
                .seat-counter.sticky {
                    z-index: 997 !important;
                }
                
                /* Handle overlapping scenarios */
                body:has(.mkd-sticky-header.header-appear) .constituency-info-overlay.sticky,
                body:has(.mkd-sticky-header.header-appear) .mp-avatar.sticky {
                    z-index: 996 !important;
                }
            }
            </style>
        `;
        
        $('head').append(enhancedStickyCSS);
        console.log('✅ Enhanced sticky styles injected');
    }
}
	
	function saveSimulationToDatabase() {
        if (!confirm('Save current simulation to database? This will overwrite the stored party data.')) {
            return;
        }

        const savePromises = [];
        
        Object.keys(currentSimulation).forEach(constituencyId => {
            const party = currentSimulation[constituencyId];
            
            const savePromise = $.ajax({
                url: bahamas_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'update_constituency',
                    nonce: bahamas_ajax.nonce,
                    constituency_id: constituencyId,
                    new_party: party,
                    save_to_db: true // Add this flag to your PHP handler
                }
            });
            
            savePromises.push(savePromise);
        });

        Promise.all(savePromises)
            .then(() => {
                showNotification('Simulation saved to database successfully!', 'success');
                isSimulationModified = false;
                updateSimulationStatus('Current Database State', false);
                
                // Update constituency data to match simulation
                Object.keys(currentSimulation).forEach(id => {
                    if (constituencyData[id]) {
                        constituencyData[id].current_party = currentSimulation[id];
                    }
                });
            })
            .catch((error) => {
                console.error('Failed to save simulation:', error);
                showNotification('Failed to save simulation to database', 'error');
            });
    }
	
    function updateSimulationStatus(text, isModified) {
        const statusElement = $('#simulation-status');
        const statusText = statusElement.find('.status-text');
        const statusIcon = statusElement.find('.status-icon');
        
        statusText.text(text);
        
        if (isModified || isDifferentFromDatabase()) {
            statusIcon.text('🔄');
            statusElement.addClass('simulation-modified');
            isSimulationModified = true;
        } else {
            statusIcon.text('✅');
            statusElement.removeClass('simulation-modified');
            isSimulationModified = false;
        }
    }
    
    function initializeColorblindMode() {
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
        $('body').addClass('colorblind-mode');
        console.log('✅ Colorblind mode enabled');
    }
    
    function disableColorblindMode() {
        isColorblindMode = false;
        $('body').removeClass('colorblind-mode');
        console.log('✅ Colorblind mode disabled');
    }
    
    function updateLegendColors() {
        const colors = isColorblindMode ? COLORBLIND_COLORS : PARTY_COLORS;
        
        Object.keys(colors).forEach(party => {
            const colorDot = $(`.${party.toLowerCase()}-color`);
            if (colorDot.length) {
                colorDot.css('background', colors[party]);
            }
        });
    }
    
    function getCurrentColors() {
        return isColorblindMode ? COLORBLIND_COLORS : PARTY_COLORS;
    }
    
    function setupEventListeners() {
        // Reset button
        $('#reset-to-2021').on('click', function() {
            resetFlipPredictionsTo2021();
        });
		$(document).on('click', '.reset-button', function() {
			resetFlipPredictionsTo2021();
		});
        
        // ADD: Save simulation button (if you want this feature)
        if ($('#save-simulation').length) {
            $('#save-simulation').on('click', function() {
                saveSimulationToDatabase();
            });
        }
        
        // Colorblind mode toggle
        $('#colorblind-mode').on('change', function() {
            toggleColorblindMode();
        });
		 $(document).on('change', '.colorblind-toggle', function() {
			const isChecked = $(this).is(':checked');

			// Sync all colorblind checkboxes to the same state
			$('.colorblind-toggle').prop('checked', isChecked);

			// Apply the colorblind mode
			if (isChecked !== isColorblindMode) {
				toggleColorblindMode();
			}
    	});
		
$(document).on('click', '.social-share-label', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = $(this);

    // 🔹 Check login status only (no membership check)
    $.post(bahamas_ajax.ajax_url, {
        action: 'check_membership_access'
    }, function(res) {
        if (!res.logged_in) {
            showMembershipPopup(res.logged_in);
            return;
        }

        console.log('🔗 Share icon clicked - generating short link...');

        // Show loading state
        showNotification('Creating shareable link...', 'info', 1000);

        // Generate the simulation URL (returns a Promise)
        generateSimulationUrl().then(simulationUrl => {
            // Ensure we have a valid URL
            if (!simulationUrl) {
                showNotification('Failed to create share link', 'error');
                return;
            }

            // Copy to clipboard
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(simulationUrl).then(() => {
                    showShareIconFeedback(button);
                    showNotification('Short link copied to clipboard! 📋', 'success', 3000);
                    console.log('✅ Short simulation URL copied to clipboard via share icon:', simulationUrl);
                }).catch((error) => {
                    console.warn('⚠️ Clipboard API failed, using fallback');
                    fallbackCopyToClipboard(simulationUrl);
                    showShareIconFeedback(button);
                    showNotification('Short link copied to clipboard! 📋', 'success', 3000);
                });
            } else {
                console.log('ℹ️ Using fallback copy method for share icon');
                fallbackCopyToClipboard(simulationUrl);
                showShareIconFeedback(button);
                showNotification('Short link copied to clipboard! 📋', 'success', 3000);
            }
        }).catch(error => {
            console.error('❌ Failed to generate share URL:', error);
            showNotification('Failed to create share link', 'error');
        });

    }, 'json');
});

    
    console.log('✅ Share icon click handler setup complete');
        // Download SVG
        $('#download-svg').on('click', function() {
            downloadSVG();
        });
        
        // Share simulation
        $('#share-simulation').on('click', shareSimulation);
        
        // Party selector handlers
        $(document).on('click', '.party-btn', function() {
            const newParty = $(this).data('party');
            if (selectedConstituency) {
                updateFlipPrediction(selectedConstituency, newParty);
            }
        });
        
        setupSocialShareListeners();
        
        // NEW: Add resize listener for mobile social repositioning
        window.addEventListener('resize', function() {
		clearTimeout(window.resizeTimeout);
		window.resizeTimeout = setTimeout(() => {
			repositionSocialIconsForMobile();
		}, 250);
	});
        
        console.log('✅ Event listeners set up');
    }
    // Add visual feedback for share icon click
    function showShareIconFeedback(button) {
        button.addClass('share-icon-clicked');
        setTimeout(() => {
            button.removeClass('share-icon-clicked');
        }, 600);
    }
    function setupConstituencyHandlers() {
        console.log('🔧 Setting up constituency handlers...');
        
        // Remove any existing handlers to prevent conflicts
        $(document).off('click touchend mouseenter mouseleave', '[data-constituency], .constituency-path, .constituency-item');
        
        // Setup mobile-friendly handlers
        setupMobileConstituencyHandlers();
        
        // HOVER HANDLER - Show info on hover (desktop only)
        $(document).on('mouseenter', '[data-constituency], .constituency-path, .constituency-item', function(e) {
            // Only on desktop
            if (!('ontouchstart' in window)) {
                let constituencyId = null;
                
                if ($(this).data('constituency')) {
                    constituencyId = parseInt($(this).data('constituency'));
                } else if ($(this).attr('data-constituency')) {
                    constituencyId = parseInt($(this).attr('data-constituency'));
                }
                
                if (constituencyId && constituencyId >= 1 && constituencyId <= 39) {
                    showConstituencyInfo(constituencyId, false);
                    $(this).addClass('constituency-hover');
                }
            }
        });
        
        // MOUSE LEAVE HANDLER - Clear info if nothing selected (desktop only)
        $(document).on('mouseleave', '[data-constituency], .constituency-path, .constituency-item', function(e) {
            if (!('ontouchstart' in window)) {
                $(this).removeClass('constituency-hover');
                
                if (selectedConstituency === null) {
                    clearConstituencyInfo();
                }
            }
        });
        
        console.log('✅ Enhanced constituency handlers set up');
    }

    function updateConstituency(constituencyId, newParty) {
        console.log(`🔧 Updating constituency ${constituencyId} to ${newParty}`);
        
        // Update simulation data
        const oldParty = currentSimulation[constituencyId];
        currentSimulation[constituencyId] = newParty;
        
        // Update visual representation
        const visualUpdated = updateConstituencyVisual(constituencyId, newParty);
        console.log(`🎨 Visual update result:`, visualUpdated);
        
        // Update seat counts
        updateSeatCounts();
        
        // Update info panel
        showConstituencyInfo(constituencyId, true);
        
        // Mark as modified (simulation differs from database)
        updateSimulationStatus('Custom Simulation', true);
        
        // Visual feedback
        const elements = $(`[data-constituency="${constituencyId}"]`);
        elements.addClass('updated');
        setTimeout(() => elements.removeClass('updated'), 500);
        
        console.log(`✅ Updated constituency ${constituencyId}: ${oldParty} → ${newParty}`);
    }

    // ADD: Function to check if current state differs from database
    function isDifferentFromDatabase() {
        return Object.keys(constituencyData).some(id => {
            const dbParty = constituencyData[id]?.current_party || 'PLP';
            const simParty = currentSimulation[id];
            return dbParty !== simParty;
        });
    }

    function cycleParty(constituencyId) {
        console.log('🔄 Cycling party for constituency:', constituencyId);
        
        const currentParty = currentSimulation[constituencyId];
        const currentIndex = PARTIES.indexOf(currentParty);
        const nextIndex = (currentIndex + 1) % PARTIES.length;
        const newParty = PARTIES[nextIndex];
        
        console.log(`🎨 Changing ${constituencyId} from ${currentParty} to ${newParty}`);
        
        updateConstituency(constituencyId, newParty);
        
        const constituencyName = constituencyData[constituencyId]?.constituency_name || `Constituency ${constituencyId}`;
        
        // Add pulse effect to party badge
        const partyBadge = $('#info-party-badge');
        partyBadge.addClass('badge-updated');
        setTimeout(() => partyBadge.removeClass('badge-updated'), 500);
    }
    
    function selectConstituency(constituencyId) {
        console.log('🎯 Selecting constituency:', constituencyId);
        
        // Remove selection from all constituencies
        $('[data-constituency]').removeClass('selected');
        $('.constituency-path').removeClass('selected');
        $('.constituency-item').removeClass('selected');
        
        // Add selection to the clicked constituency
        $(`[data-constituency="${constituencyId}"]`).addClass('selected');
        $(`#constituency-${constituencyId}`).addClass('selected');
        
        selectedConstituency = constituencyId;
        showConstituencyInfo(constituencyId, true);
        
        // Show party selector
        $('#party-selector').show();
        
        // Add visual feedback
        const overlay = $('.constituency-info-overlay');
        overlay.addClass('constituency-selected');
        setTimeout(() => overlay.removeClass('constituency-selected'), 300);
        
        console.log('✅ Constituency selected:', constituencyId);
    }
    
    function updateConstituencyVisual(constituencyId, party) {
        const colors = getCurrentColors();
        const color = colors[party];
        let updatedElements = 0;
        
        console.log(`🎨 Updating visual for constituency ${constituencyId} to ${party} (${color})`);
        
        // Update all possible SVG elements
        const selectors = [
            `[data-constituency="${constituencyId}"]`,
            `#constituency-${constituencyId}`,
            `.constituency-item[data-constituency="${constituencyId}"]`
        ];
        
        selectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                elements.each(function() {
                    // For SVG elements
                    if (this.tagName && (this.tagName.toLowerCase() === 'rect' || this.tagName.toLowerCase() === 'path')) {
                        $(this).attr('fill', color);
                        $(this).css('fill', color);
                    }
                    // For HTML elements
                    else {
                        $(this).css('background-color', color);
                    }
                    
                    $(this).attr('data-party', party);
                    updatedElements++;
                });
                console.log(`✅ Updated ${elements.length} elements with selector: ${selector}`);
            }
        });
        
        console.log(`🎨 Total elements updated: ${updatedElements}`);
        return updatedElements > 0;
    }
    
    function addEnhancedClickStyles() {
        if (!document.getElementById('enhanced-click-styles')) {
            const clickStyles = `
                <style id="enhanced-click-styles">
                /* Enhanced hover and click states */
                .constituency-hover {
                    filter: brightness(1.1) !important;
                    stroke-width: 2 !important;
                    cursor: pointer !important;
                }
                
                .constituency-path.selected,
                [data-constituency].selected,
                .constituency-item.selected {
                    filter: brightness(1.3) !important;
                    stroke-width: 3 !important;
                    box-shadow: 0 0 10px rgba(0,123,255,0.5) !important;
                }
                
                /* Click animation */
                .constituency-click-animation {
                    animation: clickPulse 0.3s ease-out !important;
                }
                
                @keyframes clickPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                /* Better cursor indication */
                .constituency-path,
                [data-constituency],
                .constituency-item {
                    cursor: pointer !important;
                }
                
                .constituency-path:hover,
                [data-constituency]:hover,
                .constituency-item:hover {
                    cursor: pointer !important;
                }
                
                /* Debug outline for troubleshooting */
                .debug-constituency {
                    outline: 2px solid red !important;
                    outline-offset: 2px !important;
                }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', clickStyles);
            console.log('✅ Enhanced click styles added');
        }
    }
    
    function updateSeatCounts() {
    const counts = {
        'PLP': 0, 'FNM': 0, 'COI': 0, 'DNA': 0, 'IND': 0
    };
    
    Object.values(flipPredictions).forEach(party => {
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
    
    // NEW: Add visual feedback when counts update and counter is sticky
    if ($('.seat-counter').hasClass('sticky')) {
        $('.seat-counter').addClass('updated');
        setTimeout(() => {
            $('.seat-counter').removeClass('updated');
        }, 500);
    }
}
    
    function updateMajorityIndicator(counts) {
        const majorityParty = Object.keys(counts).find(party => counts[party] >= 20);
        const majorityElement = $('#majority-indicator');
        const majorityText = $('#majority-text');
        
        if (majorityParty) {
            majorityElement.addClass('has-majority');
            const surplus = counts[majorityParty] - 20;
            majorityText.html(`
                <strong>${PARTY_NAMES[majorityParty]} Predicted to Form Government</strong>
                <br><small>${counts[majorityParty]} seats ${surplus > 0 ? `(+${surplus} majority)` : '(Exact majority)'}</small>
            `);
        } else {
            majorityElement.removeClass('has-majority');
            const maxParty = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            const needed = 20 - counts[maxParty];
            majorityText.html(`
                <strong>Predicted Hung Parliament</strong>
                <br><small>${PARTY_NAMES[maxParty]} leads with ${counts[maxParty]} seats (needs ${needed} more)</small>
            `);
        }
    }
    
	function initializeFlipPredictions() {
    console.log('📊 Initializing flip predictions...');
    
    // Check if we already have flip predictions (from shared simulation)
    if (Object.keys(flipPredictions).length > 0) {
        console.log('✅ Flip predictions already loaded from shared simulation');
        // Update visuals with existing flip predictions
        setTimeout(() => {
            Object.keys(flipPredictions).forEach(id => {
                updateConstituencyVisual(parseInt(id), flipPredictions[id]);
            });
            updateSeatCounts();
        }, 100);
        return;
    }
    
    // Initialize from current database state if no shared simulation
    console.log('📊 No shared simulation, using current database state...');
    Object.keys(constituencyData).forEach(id => {
        const constituency = constituencyData[id];
        flipPredictions[id] = constituency.current_party || 'PLP';
    });
    
    updateSimulationStatus('Current State (2024)', false);
    
    // Update visuals
    setTimeout(() => {
        Object.keys(flipPredictions).forEach(id => {
            updateConstituencyVisual(parseInt(id), flipPredictions[id]);
        });
        updateSeatCounts();
        clearConstituencyInfo();
    }, 100);
    
    console.log('✅ Flip predictions initialized:', flipPredictions);
}
    
    // FLIP FEATURE: Update constituency flip prediction
    function updateFlipPrediction(constituencyId, newParty) {
        console.log(`🔧 Updating flip prediction for constituency ${constituencyId} to ${newParty}`);
        
        const oldFlip = flipPredictions[constituencyId];
        flipPredictions[constituencyId] = newParty;
        
        // Update visual representation (map colors reflect flip, not current party)
        const visualUpdated = updateConstituencyVisual(constituencyId, newParty);
        console.log(`🎨 Visual update result:`, visualUpdated);
        
        // Update seat counts based on flip predictions
        updateSeatCounts();
        
        // Update info panel
        showConstituencyInfo(constituencyId, true);
        
        // Mark as modified
        updateSimulationStatus('2025 Election Simulation', true);
        
        // Visual feedback
        const elements = $(`[data-constituency="${constituencyId}"]`);
        elements.addClass('updated');
        setTimeout(() => elements.removeClass('updated'), 500);
        
        console.log(`✅ Updated flip prediction ${constituencyId}: ${oldFlip} → ${newParty}`);
    }
    
    // FLIP FEATURE: Cycle through parties for flip prediction
    function cycleFlipPrediction(constituencyId) {
        console.log('🔄 Cycling flip prediction for constituency:', constituencyId);
        
        const currentFlip = flipPredictions[constituencyId];
        const currentIndex = PARTIES.indexOf(currentFlip);
        const nextIndex = (currentIndex + 1) % PARTIES.length;
        const newParty = PARTIES[nextIndex];
        
        console.log(`🎨 Changing flip ${constituencyId} from ${currentFlip} to ${newParty}`);
        
        updateFlipPrediction(constituencyId, newParty);
        
        const constituencyName = constituencyData[constituencyId]?.constituency_name || `Constituency ${constituencyId}`;
    }
    
    // FLIP FEATURE: Reset flip predictions to 2021 results
    function resetFlipPredictionsTo2021() {
        if (isSimulationModified) {
            if (!confirm('This will reset all flip predictions to 2021 election results. Are you sure?')) {
                return;
            }
        }
        
        // Update flip predictions (not current party data)
        flipPredictions = { ...DEFAULT_2021_RESULTS };
        isSimulationModified = false;
        
        // Update all visuals based on flip predictions
        Object.keys(flipPredictions).forEach(id => {
            updateConstituencyVisual(parseInt(id), flipPredictions[id]);
        });
        
        updateSeatCounts();
        clearConstituencyInfo();
        updateSimulationStatus('2021 Election Results (Simulation)', true);
        
        console.log('✅ Reset flip predictions to 2021 election results');
        showNotification('Flip predictions reset to 2021 Election Results', 'success');
    }
	
    // FIXED: Show constituency info with proper image/avatar visibility control
    function showConstituencyInfo(constituencyId, isSelected = false) {
        const constituency = constituencyData[constituencyId];
        const currentParty = currentSimulation[constituencyId];
		const flipPrediction = flipPredictions[constituencyId];
        
        if (constituency) {
            // Update info header
            $('#info-title').text(constituency.constituency_name);
            
            // Get references to photo and avatar elements
            const mpPhotoContainer = $('#mp-photo-container');
            const mpPhoto = $('#mp-photo');
            const mpAvatarIcon = $('#mp-avatar-icon');
            
            // Check if MP image exists and is not empty
            if (constituency.mp_image && constituency.mp_image.trim() !== '') {
                console.log('MP image exists:', constituency.mp_image);
                
                // Show photo, hide avatar icon
                if (mpPhotoContainer.length > 0 && mpPhoto.length > 0) {
                    mpPhoto.attr('src', constituency.mp_image);
                    mpPhoto.attr('alt', constituency.current_mp || 'MP Photo');
                    
                    // Show photo container, hide avatar icon
                    mpPhotoContainer.css('display', 'flex');
                    mpAvatarIcon.css('display', 'none');
                } else {
                    console.warn('Photo container or image element not found');
                }
            } else {
                console.log('No MP image, showing default avatar');
                
                // Hide photo container, show avatar icon
                if (mpPhotoContainer.length > 0) {
                    mpPhotoContainer.css('display', 'none');
                }
                mpAvatarIcon.css('display', 'block');
            }
            
            // Update MP name and party badge
            $('#info-mp-name').text(constituency.current_mp || 'TBD');
            
            const partyBadge = $('#info-party-badge');
            partyBadge.text(currentParty);
            partyBadge.css('background-color', getCurrentColors()[currentParty]);
            
            // Update other info fields
            $('#info-constituency-name').text(constituency.constituency_name);
            $('#info-mp-full').text(constituency.current_mp || 'To Be Determined');
            $('#info-current-party').text(`${currentParty}`);
			$('#info-flip-prediction').text(`${flipPrediction}`);
            $('#info-region').text(constituency.region || 'Unknown');
            
            if (isSelected) {
                $('#party-selector').show();
                $('.party-btn').removeClass('active');
                $(`.party-btn[data-party="${currentParty}"]`).addClass('active');
            }
        }
    }

    // FIXED: Clear constituency info with proper visibility reset
    function clearConstituencyInfo() {
        $('#info-title').text('Select a Constituency');
        $('#info-mp-name').text('Click on any constituency');
        $('#info-party-badge').text('-').css('background-color', '#6c757d');
        $('#info-constituency-name').text('-');
        $('#info-mp-full').text('-');
        $('#info-current-party').text('-');
		$('#info-flip-prediction').text('-');
        $('#info-region').text('-');
        $('#party-selector').hide();
        $('.party-btn').removeClass('active');
        selectedConstituency = null;
        $('[data-constituency]').removeClass('selected');
        
        // Reset visibility: hide photo, show avatar
        const mpPhotoContainer = $('#mp-photo-container');
        const mpAvatarIcon = $('#mp-avatar-icon');
        
        if (mpPhotoContainer.length > 0) {
            mpPhotoContainer.css('display', 'none');
        }
        mpAvatarIcon.css('display', 'block');
    }
    
    // Updated shareSimulation function with database storage
function shareSimulation() {
    // Step 1: Check login status only (no membership check)
    $.post(bahamas_ajax.ajax_url, {
        action: 'check_membership_access'
    }, function(res) {
        if (!res.logged_in) {
            showMembershipPopup(res.logged_in);
            return;
        }

        // ✅ Step 2: Only runs if logged in & has membership
        const simulationData = {
            flipPredictions: flipPredictions,
            colorblind: isColorblindMode,
            timestamp: Date.now(),
            version: '2.0'
        };

        console.log('📦 Packaging simulation data:', simulationData);

        showNotification('Creating shareable link...', 'info', 1000);

        $.ajax({
            url: bahamas_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'save_shared_simulation',
                nonce: bahamas_ajax.nonce,
                simulation_data: JSON.stringify(simulationData)
            },
            success: function(response) {
                if (response.success) {
                    const shareUrl = response.data.share_url;
                    console.log('✅ Short share URL created:', shareUrl);

                    if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(shareUrl).then(() => {
                            showNotification(`Link Copied!`, 'success', 4000);
                            console.log('✅ Short share URL copied to clipboard');
                        }).catch(() => {
                            console.warn('⚠️ Clipboard API failed, using fallback');
                            fallbackCopyToClipboard(shareUrl);
                            showNotification(`Short link created! (${response.data.share_code})`, 'success', 4000);
                        });
                    } else {
                        console.log('ℹ️ Using fallback copy method');
                        fallbackCopyToClipboard(shareUrl);
                        showNotification(`Short link created! (${response.data.share_code})`, 'success', 4000);
                    }
                } else {
                    console.error('❌ Failed to create short link:', response.data);
                    showNotification('Failed to create short link. Using long URL...', 'warning');
                    shareSimulationFallback();
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX error:', error);
                console.error('❌ Response:', xhr.responseText);
                showNotification('Error creating short link. Using long URL...', 'warning');
                shareSimulationFallback();
            }
        });

    }, 'json');
}

    // Fallback to original long URL method
function shareSimulationFallback() {
    const simulationData = {
        flipPredictions: flipPredictions,
        colorblind: isColorblindMode,
        timestamp: Date.now(),
        version: '2.0'
    };
    
    try {
        const stateString = btoa(JSON.stringify(simulationData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?simulation=${stateString}`;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showNotification('Long simulation link copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(shareUrl);
            });
        } else {
            fallbackCopyToClipboard(shareUrl);
        }
    } catch (error) {
        console.error('❌ Error creating fallback URL:', error);
        showNotification('Failed to create share link', 'error');
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
                colorblind_mode: isColorblindMode ? 'true' : 'false'
            },
            success: function(response) {
                downloadBtn.html(originalText).prop('disabled', false);
                
                if (response.success && response.data.svg_content) {
                    const blob = new Blob([response.data.svg_content], { 
                        type: 'image/svg+xml;charset=utf-8' 
                    });
                    const url = window.URL.createObjectURL(blob);
                    
                    const downloadLink = document.createElement('a');
                    downloadLink.href = url;
                    downloadLink.download = response.data.filename;
                    downloadLink.style.display = 'none';
                    
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    
                    window.URL.revokeObjectURL(url);
                    
                    const modeText = response.data.colorblind_mode ? ' (Colorblind Mode)' : '';
                    showNotification(`Map downloaded successfully${modeText}!`, 'success');
                    console.log('✅ SVG downloaded:', response.data.filename);
                    
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
                    
                    setTimeout(() => {
                        // Update visuals first
                        Object.keys(currentSimulation).forEach(id => {
                            updateConstituencyVisual(parseInt(id), currentSimulation[id]);
                        });
                        updateSeatCounts();
                        updateLegendColors();
                        
                        // Setup handlers AFTER visual updates
                        setupConstituencyHandlers();
                        addEnhancedClickStyles();
                        
                    }, 200);
                    
                    console.log('✅ Enhanced SVG map loaded successfully');
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

    // Enhanced mobile zoom initialization with better detection
    function initializeMobileZoom() {
        console.log('🔍 Initializing mobile zoom...');
        
        // Wait for SVG to be fully loaded
        setTimeout(() => {
            findAndSetupSVG();
        }, 1000);
        
        // Also try again after a longer delay in case SVG loads slowly
        setTimeout(() => {
            if (!mapSvgElement) {
                console.warn('⚠️ SVG not found on first attempt, retrying...');
                findAndSetupSVG();
            }
        }, 3000);
    }

    function findAndSetupSVG() {
        // Try multiple selectors to find the SVG
        const selectors = [
            '#bahamas-map svg',
            'svg[viewBox]',
            '.map-container-with-overlay svg',
            '#Bahamas',
            'svg'
        ];
        
        for (const selector of selectors) {
            mapSvgElement = document.querySelector(selector);
            if (mapSvgElement) {
                console.log('✅ Found SVG element with selector:', selector);
                break;
            }
        }
        
        if (mapSvgElement) {
            mapContainer = mapSvgElement.parentElement;
            setupAdvancedTouchZoom(mapSvgElement);
            addMobileZoomControls();
            console.log('✅ Mobile touch zoom initialized successfully');
        } else {
            console.error('❌ SVG element not found for touch zoom');
            console.log('Available elements:', {
                'bahamas-map': document.querySelector('#bahamas-map'),
                'svgs': document.querySelectorAll('svg').length,
                'all elements in map': document.querySelector('#bahamas-map')?.innerHTML.substring(0, 200)
            });
            
            // Try to setup zoom on the map container itself if SVG not found
            setupFallbackZoom();
        }
    }

    function setupFallbackZoom() {
        console.log('🔄 Setting up fallback zoom on map container...');
        mapContainer = document.querySelector('#bahamas-map');
        
        if (mapContainer) {
            // Create a wrapper for zoom
            const zoomWrapper = document.createElement('div');
            zoomWrapper.className = 'zoom-wrapper';
            zoomWrapper.style.cssText = 'transform-origin: center center; transition: transform 0.2s ease; will-change: transform;';
            
            // Move all children to wrapper
            while (mapContainer.firstChild) {
                zoomWrapper.appendChild(mapContainer.firstChild);
            }
            
            mapContainer.appendChild(zoomWrapper);
            mapSvgElement = zoomWrapper; // Use wrapper as zoom target
            
            setupAdvancedTouchZoom(zoomWrapper);
            addMobileZoomControls();
            console.log('✅ Fallback zoom setup complete');
        }
    }

    function setupAdvancedTouchZoom(targetElement) {
        console.log('🎯 Setting up touch zoom on:', targetElement);
        
        if (!targetElement) {
            console.error('❌ No target element for touch zoom');
            return;
        }
        
        const parentContainer = targetElement.parentElement;
        
        // Reset transform function
        function resetZoom() {
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
            console.log('🔄 Zoom reset');
        }
        
        // Update transform
        function updateTransform() {
            if (targetElement) {
                const transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
                targetElement.style.transform = transform;
                console.log('📐 Transform updated:', transform);
            }
        }
        
        // Get distance between two touch points
        function getDistance(touch1, touch2) {
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        // Get center point between two touches
        function getTouchCenter(touch1, touch2) {
            return {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }
        
        // Touch start handler
        function handleTouchStart(e) {
            const touches = e.touches;
            touchStartTime = Date.now();
            touchMoved = false;
            
            console.log('👆 Touch start:', touches.length, 'touches');
            
            if (touches.length === 1) {
                // Single touch - prepare for potential panning
                lastTouchX = touches[0].clientX;
                lastTouchY = touches[0].clientY;
                isPanning = false;
                isZooming = false;
                
            } else if (touches.length === 2) {
                // Two touches - start zooming
                e.preventDefault();
                isZooming = true;
                isPanning = false;
                touchMoved = true;
                
                initialDistance = getDistance(touches[0], touches[1]);
                console.log('📏 Initial pinch distance:', initialDistance);
                
                // Add visual feedback
                if (parentContainer) {
                    parentContainer.classList.add('map-zooming');
                }
                document.body.classList.add('no-select');
            }
        }
        
        // Touch move handler
        function handleTouchMove(e) {
            const touches = e.touches;
            touchMoved = true;
            
            if (isZooming && touches.length === 2) {
                // Handle pinch zoom
                e.preventDefault();
                
                const currentDistance = getDistance(touches[0], touches[1]);
                const scaleChange = currentDistance / initialDistance;
                
                // Calculate new scale with limits
                const newScale = Math.max(minScale, Math.min(maxScale, currentScale * scaleChange));
                
                if (newScale !== currentScale) {
                    console.log('🔍 Zoom scale change:', currentScale, '->', newScale);
                    
                    // Get center point for zoom
                    const center = getTouchCenter(touches[0], touches[1]);
                    const rect = targetElement.getBoundingClientRect();
                    const elementCenterX = center.x - rect.left;
                    const elementCenterY = center.y - rect.top;
                    
                    // Adjust translation to zoom towards touch center
                    const scaleRatio = newScale / currentScale;
                    translateX = elementCenterX - (elementCenterX - translateX) * scaleRatio;
                    translateY = elementCenterY - (elementCenterY - translateY) * scaleRatio;
                    
                    currentScale = newScale;
                    initialDistance = currentDistance;
                    
                    updateTransform();
                }
                
            } else if (!isZooming && touches.length === 1 && currentScale > 1.1) {
                // Handle panning only when zoomed in
                const touch = touches[0];
                const deltaX = touch.clientX - lastTouchX;
                const deltaY = touch.clientY - lastTouchY;
                
                // Only start panning if we've moved enough AND we're zoomed in
                if (!isPanning && (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15)) {
                    isPanning = true;
                    e.preventDefault();
                    console.log('👋 Started panning');
                }
                
                if (isPanning) {
                    e.preventDefault();
                    
                    // Calculate movement with bounds
                    const rect = targetElement.getBoundingClientRect();
                    const maxTranslateX = (currentScale - 1) * rect.width / 2;
                    const maxTranslateY = (currentScale - 1) * rect.height / 2;
                    
                    translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX + deltaX));
                    translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY + deltaY));
                    
                    updateTransform();
                    
                    lastTouchX = touch.clientX;
                    lastTouchY = touch.clientY;
                }
            }
        }
        
        // Touch end handler
        function handleTouchEnd(e) {
            const touchDuration = Date.now() - touchStartTime;
            
            console.log('👆 Touch end - Duration:', touchDuration, 'Moved:', touchMoved);
            
            if (isZooming) {
                isZooming = false;
                if (parentContainer) {
                    parentContainer.classList.remove('map-zooming');
                }
                document.body.classList.remove('no-select');
            }
            
            // Reset panning state with delay to allow click detection
            if (isPanning) {
                setTimeout(() => {
                    isPanning = false;
                    console.log('👋 Panning ended');
                }, 100);
            }
            
            // Allow clicks if touch was quick and didn't move much
            if (!touchMoved && touchDuration < 300) {
                isPanning = false;
                isZooming = false;
            }
        }
        
        // Double tap to zoom
        let lastTap = 0;
        function handleDoubleTap(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                touchMoved = true;
                
                console.log('👆👆 Double tap detected');
                
                if (currentScale === 1) {
                    // Zoom in to 2x at tap location
                    const touch = e.changedTouches[0];
                    const rect = targetElement.getBoundingClientRect();
                    const centerX = touch.clientX - rect.left;
                    const centerY = touch.clientY - rect.top;
                    
                    currentScale = 2;
                    translateX = rect.width / 2 - centerX;
                    translateY = rect.height / 2 - centerY;
                    
                    console.log('🔍 Double tap zoom in');
                } else {
                    // Reset zoom
                    resetZoom();
                    console.log('🔍 Double tap zoom out');
                }
                
                updateTransform();
            }
            
            lastTap = currentTime;
        }
        
        // Add event listeners with debugging
        targetElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        targetElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        targetElement.addEventListener('touchend', handleTouchEnd, { passive: false });
        targetElement.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        targetElement.addEventListener('touchend', handleDoubleTap, { passive: false });
        
        console.log('✅ Touch event listeners added to:', targetElement.tagName || targetElement.className);
    }

    // UPDATED: Remove mobile zoom control buttons - fingers only zoom
	function addMobileZoomControls() {
		// REMOVED: No longer add zoom control buttons
		// Users will only be able to zoom using pinch gestures
		console.log('📱 Mobile zoom controls disabled - using pinch-to-zoom only');

		// Remove any existing controls if they were added before
		const existingControls = document.querySelector('#mobile-zoom-controls');
		if (existingControls) {
			existingControls.remove();
			console.log('🗑️ Removed existing mobile zoom controls');
		}
	}

    // Enhanced constituency click handler for mobile
    function setupMobileConstituencyHandlers() {
        $(document).on('touchend', '[data-constituency], .constituency-path', function(e) {
            // Only handle constituency selection if we didn't pan/zoom
            if (!isPanning && !isZooming && !touchMoved) {
                handleConstituencyInteraction(this, e);
            }
        });
        
        // Desktop click handler
        $(document).on('click', '[data-constituency], .constituency-path', function(e) {
            // Only handle on desktop or if touch didn't interfere
            if (!('ontouchstart' in window) || (!isPanning && !isZooming)) {
                handleConstituencyInteraction(this, e);
            }
        });
    }

    function handleConstituencyInteraction(element, e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🖱️ Constituency clicked:', element);
        
        let constituencyId = null;
        
        // Try different ways to get constituency ID
        if ($(element).data('constituency')) {
            constituencyId = parseInt($(element).data('constituency'));
        } else if ($(element).attr('data-constituency')) {
            constituencyId = parseInt($(element).attr('data-constituency'));
        } else if ($(element).hasClass('constituency-path')) {
            constituencyId = parseInt($(element).attr('data-constituency'));
        }
        
        console.log('🔍 Found constituency ID:', constituencyId);
        
        if (constituencyId && constituencyId >= 1 && constituencyId <= 39) {
            if (selectedConstituency === constituencyId) {
                console.log('🔄 Cycling party for constituency:', constituencyId);
                cycleFlipPrediction(constituencyId);
            } else {
                console.log('✅ Selecting constituency:', constituencyId);
                selectConstituency(constituencyId);
            }
        } else {
            console.warn('❌ Invalid constituency ID:', constituencyId);
        }
    }

    // Enhanced mobile setup
    function enhanceForMobile() {
    console.log('📱 Enhancing for mobile - pinch-to-zoom only...');
    
    // Initialize mobile zoom
    initializeMobileZoom();
    
    // Test touch capabilities
    console.log('Touch support:', {
        'ontouchstart in window': 'ontouchstart' in window,
        'Touch events': typeof TouchEvent !== 'undefined',
        'Pointer events': typeof PointerEvent !== 'undefined',
        'Screen width': window.innerWidth
    });
    
    console.log('✅ Mobile enhancements applied - finger zoom only');
}

    function loadFallbackMap() {
        const mapContainer = $('#bahamas-map');
        const fallbackHTML = generateEnhancedFallbackHTML();
        mapContainer.html(fallbackHTML);
        setupConstituencyHandlers();
        updateLegendColors();
        showNotification('Using fallback grid view', 'info');
    }
    
    // NEW: Enhanced social share listener setup that works with cloned elements
    function setupSocialShareListeners(container = null) {
        console.log('🔗 Setting up social share listeners...');
        
        // If container is provided, only set up listeners for that container
        // Otherwise, set up for all social share buttons
        const targetContainer = container || document;
        const shareButtons = targetContainer.querySelectorAll ? 
            targetContainer.querySelectorAll('.social-share-btn') : 
            $(targetContainer).find('.social-share-btn');

        if (shareButtons.forEach) {
            // Native NodeList
            shareButtons.forEach(button => {
                // Remove existing listeners to prevent duplicates
                button.removeEventListener('click', handleSocialShare);
                // Add new listener
                button.addEventListener('click', handleSocialShare);
            });
        } else {
            // jQuery object
            shareButtons.off('click', handleSocialShare);
            shareButtons.on('click', handleSocialShare);
        }
        
        console.log('✅ Social share listeners set up for', shareButtons.length, 'buttons');
    }

    // NEW: Social share handler function
function handleSocialShare(e) {
    e.preventDefault();

    const platform = this.getAttribute('id');
    const shareText = 'Check out my Bahamas election simulation:';

    // 🔹 Check login status only (no membership check)
    $.post(bahamas_ajax.ajax_url, {
        action: 'check_membership_access'
    }, function(res) {
        if (!res.logged_in) {
            showMembershipPopup(res.logged_in);
            return;
        }
        console.log('📤 Sharing to platform:', platform);

        // Show loading state
        showNotification('Creating share link...', 'info', 1000);

        generateSimulationUrl().then(simulationUrl => {
            let shareUrl;

            switch (platform) {
                case 'share-whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(simulationUrl)}`;
                    break;
                case 'share-facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(simulationUrl)}`;
                    break;
                case 'share-twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(simulationUrl)}&text=${encodeURIComponent(shareText)}`;
                    break;
                case 'share-tiktok':
                    shareUrl = `https://www.tiktok.com/share?url=${encodeURIComponent(simulationUrl)}`;
                    break;
                case 'share-instagram':
                    fallbackCopyToClipboard(simulationUrl);
                    window.open('https://www.instagram.com/', '_blank');
                    showNotification('Short link copied! Paste it in your Instagram story or bio.', 'info');
                    return;
            }

            if (shareUrl) {
                window.open(shareUrl, 'social-share-window', 'height=450,width=550');
                showNotification('Opening share window...', 'info', 2000);
            }
        });
    }, 'json');
}

    
	function generateSimulationUrl() {
    console.log('🔗 Generating simulation URL for social sharing...');
    
    return new Promise((resolve) => {
        const simulationData = {
            flipPredictions: flipPredictions,
            colorblind: isColorblindMode,
            timestamp: Date.now(),
            version: '2.0'
        };
        
        $.ajax({
            url: bahamas_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'save_shared_simulation',
                nonce: bahamas_ajax.nonce,
                simulation_data: JSON.stringify(simulationData)
            },
            success: function(response) {
                if (response.success) {
                    console.log('✅ Short URL generated for social sharing');
                    resolve(response.data.share_url);
                } else {
                    console.warn('⚠️ Failed to generate short URL, using fallback');
                    resolve(generateLongSimulationUrl());
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX error in generateSimulationUrl:', error);
                resolve(generateLongSimulationUrl());
            }
        });
    });
}
// Helper function for long URL generation
function generateLongSimulationUrl() {
    const simulationData = {
        flipPredictions: flipPredictions,
        colorblind: isColorblindMode,
        timestamp: Date.now(),
        version: '2.0'
    };
    
    try {
        const stateString = btoa(JSON.stringify(simulationData));
        return `${window.location.origin}${window.location.pathname}?simulation=${stateString}`;
    } catch (error) {
        console.error('❌ Error generating long URL:', error);
        return window.location.href;
    }
}

	function generateSimulationUrl() {
    console.log('🔗 Generating simulation URL for social sharing...');
    
    // For social sharing, we'll use a Promise to handle the async database call
    return new Promise((resolve) => {
        const simulationData = {
            flipPredictions: flipPredictions,
            colorblind: isColorblindMode,
            timestamp: Date.now(),
            version: '2.0'
        };
        
        $.ajax({
            url: bahamas_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'save_shared_simulation',
                nonce: bahamas_ajax.nonce,
                simulation_data: JSON.stringify(simulationData)
            },
            success: function(response) {
                if (response.success) {
                    resolve(response.data.share_url);
                } else {
                    // Fallback to long URL
                    resolve(generateLongSimulationUrl());
                }
            },
            error: function() {
                // Fallback to long URL
                resolve(generateLongSimulationUrl());
            }
        });
    });
}

// Helper function for long URL generation
function generateLongSimulationUrl() {
    const simulationData = {
        flipPredictions: flipPredictions,
        colorblind: isColorblindMode,
        timestamp: Date.now(),
        version: '2.0'
    };
    
    try {
        const stateString = btoa(JSON.stringify(simulationData));
        return `${window.location.origin}${window.location.pathname}?simulation=${stateString}`;
    } catch (error) {
        console.error('❌ Error generating long URL:', error);
        return window.location.href;
    }
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
    
    function showNotification(message, type = 'info', duration = 4000) {
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
    
    // Load simulation from URL if present
function loadSimulationFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for short share code first
    const shareCode = urlParams.get('share');
    if (shareCode) {
        console.log('🔗 Found share code in URL:', shareCode);
        loadSharedSimulation(shareCode);
        return true;
    }
    
    // Check for long simulation parameter (backward compatibility)
    const simulationParam = urlParams.get('simulation');
    if (simulationParam) {
        console.log('🔗 Found long simulation parameter in URL');
        return loadLongSimulationFromUrl(simulationParam);
    }
    
    return false;
}
	
	// Load simulation using share code
function loadSharedSimulation(shareCode) {
    console.log('📥 Loading shared simulation with code:', shareCode);
    
    // Show loading notification
    showNotification('Loading shared simulation...', 'info', 2000);
    
    $.ajax({
        url: bahamas_ajax.ajax_url,
        type: 'POST',
        data: {
            action: 'load_shared_simulation',
            nonce: bahamas_ajax.nonce,
            share_code: shareCode
        },
        success: function(response) {
            console.log('📥 AJAX Response:', response);
            
            if (response.success) {
    try {
        // Check if simulation_data is already an object or needs parsing
        const data = typeof response.data.simulation_data === 'string' 
            ? JSON.parse(response.data.simulation_data) 
            : response.data.simulation_data;
            
        console.log('✅ Loaded shared simulation data:', data);
        
        if (data.flipPredictions) {
            // CRITICAL: Set flipPredictions directly
            flipPredictions = { ...data.flipPredictions };
            
            // Set colorblind mode if specified
            if (data.colorblind !== undefined) {
                isColorblindMode = data.colorblind;
                $('#colorblind-mode').prop('checked', isColorblindMode);
                $('.colorblind-toggle').prop('checked', isColorblindMode);
                if (isColorblindMode) {
                    enableColorblindMode();
                }
            }
            
            // Update status
            updateSimulationStatus(`Shared Simulation (${shareCode})`, true);
            
            // Update visuals after a short delay
            setTimeout(() => {
                Object.keys(flipPredictions).forEach(id => {
                    updateConstituencyVisual(parseInt(id), flipPredictions[id]);
                });
                updateSeatCounts();
                clearConstituencyInfo();
            }, 500);
            
            showNotification(`Shared simulation loaded! Views: ${response.data.view_count}`, 'success', 4000);
            console.log('🎯 Shared simulation loaded successfully');
            
        } else {
            console.error('❌ No flipPredictions found in shared simulation data');
            showNotification('Invalid shared simulation data', 'error');
        }
    } catch (e) {
        console.error('❌ Error parsing shared simulation data:', e);
        console.error('❌ Raw data:', response.data.simulation_data);
        showNotification('Error parsing shared simulation', 'error');
    }
} else {
                console.error('❌ Failed to load shared simulation:', response.data);
                showNotification(`Simulation not found: ${response.data || 'Unknown error'}`, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ AJAX error loading shared simulation:', error);
            console.error('❌ Status:', status);
            console.error('❌ Response:', xhr.responseText);
            showNotification('Network error loading shared simulation', 'error');
        }
    });
}
    function loadLongSimulationFromUrl(simulationParam) {
    try {
        const data = JSON.parse(atob(simulationParam));
        console.log('📥 Found long simulation data:', data);
        
        if (data.flipPredictions || data.simulation) {
            const predictions = data.flipPredictions || data.simulation;
            
            const validConstituencies = Object.keys(predictions).every(id => 
                id >= 1 && id <= 39 && PARTIES.includes(predictions[id])
            );
            
            if (validConstituencies) {
                console.log('✅ Valid long simulation found, loading...');
                
                flipPredictions = { ...predictions };
                
                if (data.colorblind !== undefined) {
                    isColorblindMode = data.colorblind;
                    $('#colorblind-mode').prop('checked', isColorblindMode);
                    $('.colorblind-toggle').prop('checked', isColorblindMode);
                    if (isColorblindMode) {
                        enableColorblindMode();
                    }
                }
                
                updateSimulationStatus('Shared Simulation (Legacy)', true);
                showNotification('Shared simulation loaded successfully!', 'success');
                
                // Update visuals
                setTimeout(() => {
                    Object.keys(flipPredictions).forEach(id => {
                        updateConstituencyVisual(parseInt(id), flipPredictions[id]);
                    });
                    updateSeatCounts();
                }, 100);
                
                console.log('🎯 Long simulation loaded:', flipPredictions);
                return true;
            } else {
                console.error('❌ Invalid constituency data in long simulation');
            }
        } else {
            console.error('❌ No flip predictions found in long simulation');
        }
    } catch (e) {
        console.error('❌ Error parsing long simulation:', e);
        showNotification('Invalid simulation URL parameter', 'error');
    }
    
    return false;
}
    // Load simulation from URL after initialization
    setTimeout(loadSimulationFromUrl, 500);
    
    // Add additional CSS for enhanced overlay functionality
    const additionalStyles = `
        <style id="bahamas-additional-styles">
        .constituency-selected {
            transform: scale(1.02) !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2) !important;
        }
        
        .badge-updated {
            animation: badgePulse 0.5s ease-in-out !important;
        }
        
        @keyframes badgePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .constituency-info-overlay .info-row:hover {
            background: rgba(0,123,255,0.05) !important;
            border-radius: 6px !important;
            margin: 0 -6px 12px -6px !important;
        }
        
        /* Enhanced scrollbar for overlay */
        .constituency-info-overlay::-webkit-scrollbar {
            width: 8px !important;
        }
        
        .constituency-info-overlay::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05) !important;
            border-radius: 4px !important;
        }
        
        .constituency-info-overlay::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2) !important;
            border-radius: 4px !important;
        }
        
        .constituency-info-overlay::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3) !important;
        }
        
        .notification {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            padding: 15px 20px !important;
            border-radius: 8px !important;
            color: white !important;
            font-weight: bold !important;
            z-index: 1000 !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            min-width: 300px !important;
            animation: slideIn 0.3s ease-out !important;
        }
        
        .notification-success { background: #28a745 !important; }
        .notification-error { background: #dc3545 !important; }
        .notification-info { background: #17a2b8 !important; }
        
        .notification-close {
            background: none !important;
            border: none !important;
            color: white !important;
            font-size: 18px !important;
            cursor: pointer !important;
            margin-left: auto !important;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .constituency-item.updated {
            animation: pulse 0.5s ease-in-out !important;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Ensure SVG elements remain interactive */
        .constituency-path,
        svg .constituency-path,
        [data-constituency] {
            cursor: pointer !important;
            stroke: #333 !important;
            stroke-width: 1 !important;
            transition: filter 0.2s ease !important;
            transform: none !important;
        }
        
        .constituency-path:hover,
        svg .constituency-path:hover,
        [data-constituency]:hover {
            stroke-width: 1 !important;
            filter: brightness(1.1) !important;
            transform: none !important;
        }
        
        .constituency-path.selected,
        svg .constituency-path.selected,
        [data-constituency].selected {
            stroke-width: 1 !important;
            filter: brightness(1.2) !important;
            transform: none !important;
        }
        
        /* Social Share Buttons */
        .social-share-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 0px;
            padding: 15px;
            background: #e9ecef;
            border-radius: 12px;
            flex-wrap: wrap;
        }

        .social-share-label {
            font-size: 30px;
            font-weight: bold;
            color: #495057;
            margin-right: 15px;
        }

        .social-share-buttons {
            display: flex;
            gap: 10px;
        }

        .social-share-btn {
            display: inline-block;
            width: 40px;
            height: 40px;
            line-height: 40px;
            border-radius: 50%;
            text-align: center;
            color: white;
            font-size: 20px;
            text-decoration: none;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .social-share-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            color: #fff;
        }

        @media (max-width: 768px) {
            #bahamas-election-container {
                width: 100%;
                padding: 10px;
				margin-top: 55px;
            }
        }

        .whatsapp-btn { background: #25D366; }
        .facebook-btn { background: #1877F2; }
        .twitter-btn { background: #1DA1F2; }
        .tiktok-btn { background: #000; }
        .instagram-btn { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
        .link-btn { background: #6c757d; }
        </style>
    `;
    
    if ($('#bahamas-additional-styles').length === 0) {
        $('head').append(additionalStyles);
    }
});
// Membership popup
// Membership popup
function showMembershipPopup(isLoggedIn) {
    const popup = jQuery('#membership-popup');
    const buttonsContainer = jQuery('#membership-popup-buttons');
    const message = jQuery('#membership-popup-message');
    
    // Reset previous buttons
    buttonsContainer.empty();
    
    if (!isLoggedIn) {
        // Not logged in - show both Register and Login buttons
        message.text('Please login or register to access this feature.');
        buttonsContainer.append(
            `<a href="/register/" 
                class="popup-btn popup-btn-primary">
                <i class="popup-icon">📝</i>
                Register
             </a>
             <a href="/our-community/" 
                class="popup-btn popup-btn-secondary">
                <i class="popup-icon">🔑</i>
                Login
             </a>`
        );
    }
    
    popup.addClass('popup-show').fadeIn(300);
}

// Close popup with animation
jQuery(document).on('click', '#membership-popup-close, #membership-popup-overlay', function (e) {
    if (e.target === this) {
        jQuery('#membership-popup').removeClass('popup-show').fadeOut(300);
    }
});

// Prevent closing when clicking inside the popup content
jQuery(document).on('click', '#membership-popup-content', function (e) {
    e.stopPropagation();
});
