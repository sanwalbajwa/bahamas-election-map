<?php
/**
 * Plugin Name: Bahamas Interactive Election Map - Enhanced
 * Plugin URI: https://sanwalbajwa.live/
 * Description: Interactive election simulation tool for all 39 Bahamian constituencies
 * Version: 2.0.0
 * Author: Sanwal Bajwa
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BAHAMAS_ELECTION_VERSION', '2.0.0');
define('BAHAMAS_ELECTION_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BAHAMAS_ELECTION_PLUGIN_URL', plugin_dir_url(__FILE__));

class BahamasElectionMapEnhanced {
    
    // Nassau constituency mapping based on the PDF key provided
    private $nassau_constituencies = array(
    1 => 'Killarney',           
    2 => 'Golden Isles',        
    3 => 'Southern Shores',     
    4 => 'Tall Pines',          
    5 => 'Carmichael',          
    6 => 'South Beach',         
    7 => 'Seabreeze',           
    8 => 'Elizabeth',           
    9 => 'Yamacraw',            
    10 => 'St Annes',           
    11 => 'Fox Hill',           
    12 => 'Nassau Village',     
    13 => 'Pinewood',           
    14 => 'Bamboo Town',        
    15 => 'Golden Gates',       
    16 => 'Garden Hills',       
    17 => 'Mt. Moriah',         
    18 => 'St. Barnabas',       // Corrected from 'Nassau South'
    19 => 'Englerston',         
    20 => 'Marathon',           
    21 => 'Freetown',           
    22 => 'Centreville',        
    23 => 'Bains Town & Grants Town',
    24 => 'Fort Charlotte'      
);
    
    // Grand Bahama constituencies (5 total)
    private $grand_bahama_constituencies = array(
        25 => 'West Grand Bahama & Bimini',
        26 => 'Grand Central Bahama',
        27 => 'Pineridge',
        28 => 'Marco City',
        29 => 'East Grand Bahama'
    );
    
    // Family Islands constituencies
    private $family_islands_constituencies = array(
        30 => 'North Abaco',
        31 => 'Central & South Abaco',
        32 => 'North Eleuthera',
        33 => 'Eleuthera',
        34 => 'Cat Island, Rum Cay & San Salvador',
        35 => 'Exumas & Ragged Island',
        36 => 'Long Island',
        37 => 'MICAL',
        38 => 'Central & South Andros',
        39 => 'Mangrove Cay & South Andros'
    );
    
    public function __construct() {
    add_action('init', array($this, 'init'));
    add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    add_shortcode('bahamas_election_map', array($this, 'render_map_shortcode'));
    register_activation_hook(__FILE__, array($this, 'activate'));
    
    // Existing AJAX handlers
    add_action('wp_ajax_update_constituency', array($this, 'ajax_update_constituency'));
    add_action('wp_ajax_nopriv_update_constituency', array($this, 'ajax_update_constituency'));
    add_action('wp_ajax_get_svg_map', array($this, 'ajax_get_svg_map'));
    add_action('wp_ajax_nopriv_get_svg_map', array($this, 'ajax_get_svg_map'));
    
    // NEW AJAX handlers for features
    add_action('wp_ajax_download_svg', array($this, 'ajax_download_svg'));
    add_action('wp_ajax_nopriv_download_svg', array($this, 'ajax_download_svg'));
    
    add_shortcode('debug_bahamas', array($this, 'debug_shortcode'));
}
    
    public function init() {
        $this->create_tables();
    }
    
    public function activate() {
        $this->create_tables();
        $this->insert_default_data();
    }
    
    public function create_tables() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            constituency_name varchar(100) NOT NULL,
            constituency_number int(2) NOT NULL,
            current_party varchar(10) DEFAULT 'PLP',
            current_mp varchar(100) DEFAULT '',
            island varchar(50) DEFAULT '',
            region varchar(20) DEFAULT '',
            is_simulation tinyint(1) DEFAULT 0,
            PRIMARY KEY (id),
            UNIQUE KEY constituency_number (constituency_number)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
   public function insert_default_data() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'bahamas_constituencies';
    
    // Check if data already exists
    $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    if ($count > 0) return;
    
    // CORRECT 2021 ELECTION RESULTS
    // FNM won these 6 constituencies (we're missing St. Barnabas number)
    $fnm_constituencies = array(1, 10, 26, 28, 29, 36);
    
    // Insert Nassau constituencies (1-24)
    foreach ($this->nassau_constituencies as $number => $name) {
        $party = in_array($number, $fnm_constituencies) ? 'FNM' : 'PLP';
        
        $wpdb->insert(
            $table_name,
            array(
                'constituency_number' => $number,
                'constituency_name' => $name,
                'current_party' => $party,
                'current_mp' => 'TBD',
                'island' => 'New Providence',
                'region' => 'Nassau',
                'is_simulation' => 0
            )
        );
    }
    
    // Insert Grand Bahama constituencies (25-29)
    foreach ($this->grand_bahama_constituencies as $number => $name) {
        $party = in_array($number, $fnm_constituencies) ? 'FNM' : 'PLP';
        
        $wpdb->insert(
            $table_name,
            array(
                'constituency_number' => $number,
                'constituency_name' => $name,
                'current_party' => $party,
                'current_mp' => 'TBD',
                'island' => 'Grand Bahama',
                'region' => 'Grand Bahama',
                'is_simulation' => 0
            )
        );
    }
    
    // Insert Family Islands constituencies (30-39)
    foreach ($this->family_islands_constituencies as $number => $name) {
        $party = in_array($number, $fnm_constituencies) ? 'FNM' : 'PLP';
        
        $wpdb->insert(
            $table_name,
            array(
                'constituency_number' => $number,
                'constituency_name' => $name,
                'current_party' => $party,
                'current_mp' => 'TBD',
                'island' => 'Family Islands',
                'region' => 'Family Islands',
                'is_simulation' => 0
            )
        );
    }
}
    public function enqueue_scripts() {
        wp_enqueue_script(
            'bahamas-election-enhanced-js',
            BAHAMAS_ELECTION_PLUGIN_URL . 'assets/bahamas-election-enhanced.js',
            array('jquery'),
            BAHAMAS_ELECTION_VERSION,
            true
        );
        
        wp_enqueue_style(
            'bahamas-election-enhanced-css',
            BAHAMAS_ELECTION_PLUGIN_URL . 'assets/bahamas-election-enhanced.css',
            array(),
            BAHAMAS_ELECTION_VERSION
        );
        
        // Localize script for AJAX
        wp_localize_script('bahamas-election-enhanced-js', 'bahamas_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bahamas_election_nonce'),
            'plugin_url' => BAHAMAS_ELECTION_PLUGIN_URL
        ));
    }
    
    public function render_map_shortcode($atts) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'bahamas_constituencies';
    
    // Parse shortcode attributes
    $atts = shortcode_atts(array(
        'height' => '800px'
    ), $atts);
    
    // Get current constituency data
    $constituencies = $wpdb->get_results("SELECT * FROM $table_name ORDER BY constituency_number");
    
    ob_start();
    ?>
    <div id="bahamas-election-container">
        
        <!-- Enhanced Seat Counter -->
        <div class="seat-counter">
            <h3>Parliamentary Seats (39 Total - 20 for Majority)</h3>
            <div class="regional-breakdown">
                <div class="region-info">
                    <strong>Nassau:</strong> <span id="nassau-total">24</span> seats
                </div>
                <div class="region-info">
                    <strong>Grand Bahama:</strong> <span id="gb-total">5</span> seats
                </div>
                <div class="region-info">
                    <strong>Family Islands:</strong> <span id="fi-total">10</span> seats
                </div>
            </div>
            <div class="party-totals">
                <div class="party-count plp-count">
                    <span class="party-name">PLP</span>
                    <span class="seat-count" id="plp-seats">0</span>
                </div>
                <div class="party-count fnm-count">
                    <span class="party-name">FNM</span>
                    <span class="seat-count" id="fnm-seats">0</span>
                </div>
                <div class="party-count coi-count">
                    <span class="party-name">COI</span>
                    <span class="seat-count" id="coi-seats">0</span>
                </div>
                <div class="party-count dna-count">
                    <span class="party-name">DNA</span>
                    <span class="seat-count" id="dna-seats">0</span>
                </div>
                <div class="party-count ind-count">
                    <span class="party-name">IND</span>
                    <span class="seat-count" id="ind-seats">0</span>
                </div>
            </div>
            <div class="majority-indicator" id="majority-indicator">
                <span id="majority-text">No Majority</span>
            </div>
        </div>
        
        <!-- Enhanced Map Controls -->
        <div class="map-controls">
            <button id="reset-to-2021" class="btn btn-reset" title="Reset to 2021 Election Results">
                <span class="btn-icon">🔄</span> Reset to 2021
            </button>
            <button id="share-simulation" class="btn btn-share" title="Share your simulation">
                <span class="btn-icon">🔗</span> Share Simulation
            </button>
            <button id="download-svg" class="btn btn-download" title="Download the current map as SVG">
                <span class="btn-icon">⬇️</span> Download Map
            </button>
            <label class="control-label" title="Enable colorblind-friendly colors">
                <input type="checkbox" id="colorblind-mode"> 
                <span class="checkbox-icon">🎨</span> Colorblind Mode
            </label>
            <div class="simulation-status" id="simulation-status">
                <span class="status-icon">✅</span>
                <span class="status-text">2021 Election Results</span>
            </div>
        </div>
        
        <!-- FULL WIDTH MAP CONTAINER -->
        <div class="map-container-fullwidth">
            <div id="bahamas-map" style="height: <?php echo esc_attr($atts['height']); ?>;">
                <div class="map-loading">
                    <span>Loading enhanced interactive map...</span>
                </div>
            </div>
        </div>
        
        <!-- MOVED: Constituency Info and Controls Below Map -->
        <div class="bottom-controls-section">
            
            <!-- Two Column Layout: Info Panel + Quick Actions -->
            <div class="bottom-controls-grid">
                
                <!-- Constituency Info Panel -->
                <div class="constituency-info" id="constituency-info">
                    <h4 id="info-title">Select a Constituency</h4>
                    <div class="info-details">
                        <p id="info-number"><strong>Number:</strong> -</p>
                        <p id="info-mp"><strong>MP:</strong> Click on any constituency</p>
                        <p id="info-party"><strong>Current Party:</strong> -</p>
                        <p id="info-region"><strong>Region:</strong> -</p>
                        <p id="info-island"><strong>Island:</strong> -</p>
                    </div>
                    <div class="party-selector" id="party-selector" style="display:none;">
                        <p><strong>Click to change party:</strong></p>
                        <div class="party-buttons">
                            <button class="party-btn plp-btn" data-party="PLP">PLP</button>
                            <button class="party-btn fnm-btn" data-party="FNM">FNM</button>
                            <button class="party-btn coi-btn" data-party="COI">COI</button>
                            <button class="party-btn dna-btn" data-party="DNA">DNA</button>
                            <button class="party-btn ind-btn" data-party="IND">IND</button>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions Panel -->
                <div class="quick-actions-panel" id="quick-actions">
                    <h4>Quick Actions</h4>
                    <div class="quick-actions-grid">
                        <button class="quick-btn quick-btn-large" id="flip-all-plp" data-party="PLP">
                            <span class="quick-icon">🟡</span>
                            <span class="quick-text">All PLP Sweep</span>
                        </button>
                        <button class="quick-btn quick-btn-large" id="flip-all-fnm" data-party="FNM">
                            <span class="quick-icon">🔴</span>
                            <span class="quick-text">All FNM Sweep</span>
                        </button>
                        <button class="quick-btn quick-btn-large" id="flip-nassau" data-region="Nassau">
                            <span class="quick-icon">🏝️</span>
                            <span class="quick-text">Flip Nassau</span>
                        </button>
                        <button class="quick-btn quick-btn-large" id="flip-grand-bahama" data-region="GrandBahama">
                            <span class="quick-icon">🌊</span>
                            <span class="quick-text">Flip Grand Bahama</span>
                        </button>
                        <button class="quick-btn quick-btn-large" id="flip-family-islands" data-region="FamilyIslands">
                            <span class="quick-icon">🏖️</span>
                            <span class="quick-text">Flip Family Islands</span>
                        </button>
                        <button class="quick-btn quick-btn-large" id="random-simulation">
                            <span class="quick-icon">🎲</span>
                            <span class="quick-text">Random Simulation</span>
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
        
        <!-- Enhanced Legend -->
        <div class="map-legend" id="map-legend">
            <h4>Party Colors & Information</h4>
            <div class="legend-grid">
                <div class="legend-item">
                    <span class="color-box plp-color" id="plp-color-box"></span>
                    <span>Progressive Liberal Party (PLP) - Current Government</span>
                </div>
                <div class="legend-item">
                    <span class="color-box fnm-color" id="fnm-color-box"></span>
                    <span>Free National Movement (FNM) - Opposition</span>
                </div>
                <div class="legend-item">
                    <span class="color-box coi-color" id="coi-color-box"></span>
                    <span>Coalition of Independence (COI)</span>
                </div>
                <div class="legend-item">
                    <span class="color-box dna-color" id="dna-color-box"></span>
                    <span>Democratic National Alliance (DNA)</span>
                </div>
                <div class="legend-item">
                    <span class="color-box ind-color" id="ind-color-box"></span>
                    <span>Independent (IND)</span>
                </div>
            </div>
            <div class="legend-note">
                <small><strong>Interactive Map:</strong> Click any constituency to select it, then use the buttons below to change parties. The map shows all 39 constituencies across Nassau, Grand Bahama, and the Family Islands.</small>
            </div>
            <div class="legend-note colorblind-note" style="display:none;">
                <small><strong>Colorblind Mode:</strong> Enhanced contrast and pattern-based colors for better accessibility.</small>
            </div>
        </div>
    </div>
    
    <!-- Hidden data for JavaScript -->
    <script type="application/json" id="constituency-data">
    <?php echo json_encode($constituencies); ?>
    </script>
    <?php
    return ob_get_clean();
}
    /**
 * Add AJAX handler for SVG download
 */
public function ajax_download_svg() {
    check_ajax_referer('bahamas_election_nonce', 'nonce');
    
    $simulation_data = isset($_POST['simulation_data']) ? json_decode(stripslashes($_POST['simulation_data']), true) : array();
    
    // Generate SVG with current simulation data
    $svg_content = $this->generate_download_svg($simulation_data);
    
    if ($svg_content) {
        // Create filename with timestamp
        $filename = 'bahamas-election-map-' . date('Y-m-d-H-i-s') . '.svg';
        
        wp_send_json_success(array(
            'svg_content' => $svg_content,
            'filename' => $filename,
            'message' => 'SVG generated successfully'
        ));
    } else {
        wp_send_json_error('Failed to generate SVG');
    }
}

/**
 * Generate SVG for download with current simulation state
 */
private function generate_download_svg($simulation_data) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'bahamas_constituencies';
    $constituencies = $wpdb->get_results("SELECT * FROM $table_name ORDER BY constituency_number");
    
    // Count seats for each party
    $seat_counts = array('PLP' => 0, 'FNM' => 0, 'COI' => 0, 'DNA' => 0, 'IND' => 0);
    foreach ($simulation_data as $const_id => $party) {
        if (isset($seat_counts[$party])) {
            $seat_counts[$party]++;
        }
    }
    
    // Create enhanced SVG with proper map layout
    $svg = '<svg viewBox="0 0 1400 1000" xmlns="http://www.w3.org/2000/svg">';
    $svg .= '<defs>';
    $svg .= '<style>';
    $svg .= '.constituency-path { stroke: #333; stroke-width: 1.5; }';
    $svg .= '.constituency-label { font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-anchor: middle; fill: #fff; }';
    $svg .= '.region-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-anchor: middle; fill: #2c3e50; }';
    $svg .= '.region-subtitle { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; fill: #7f8c8d; }';
    $svg .= '.seat-counter-text { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: start; fill: #2c3e50; }';
    $svg .= '</style>';
    $svg .= '</defs>';
    
    // Background
    $svg .= '<rect width="1400" height="1000" fill="#f8f9fa"/>';
    
    // Title with timestamp
    $svg .= '<text x="700" y="30" class="region-title" font-size="24">The Bahamas - Election Simulation</text>';
    $svg .= '<text x="700" y="55" class="region-title" font-size="14" fill="#666">Generated: ' . date('F j, Y g:i A') . '</text>';
    
    // Seat counter at top
    $svg .= '<text x="50" y="100" class="seat-counter-text">PARLIAMENTARY SEATS:</text>';
    $x_pos = 250;
    foreach ($seat_counts as $party => $count) {
        $color = $this->get_party_color($party);
        $svg .= sprintf('<rect x="%d" y="85" width="80" height="20" fill="%s" stroke="#333"/>', $x_pos, $color);
        $svg .= sprintf('<text x="%d" y="98" class="constituency-label" fill="#fff">%s: %d</text>', $x_pos + 40, $party, $count);
        $x_pos += 90;
    }
    
    // Majority indicator
    $majority_party = null;
    foreach ($seat_counts as $party => $count) {
        if ($count >= 20) {
            $majority_party = $party;
            break;
        }
    }
    
    if ($majority_party) {
        $svg .= sprintf('<text x="900" y="98" class="seat-counter-text" fill="#008000">%s MAJORITY (%d seats)</text>', $majority_party, $seat_counts[$majority_party]);
    } else {
        $leading_party = array_keys($seat_counts, max($seat_counts))[0];
        $svg .= sprintf('<text x="900" y="98" class="seat-counter-text" fill="#ff6600">HUNG PARLIAMENT (%s leads with %d)</text>', $leading_party, $seat_counts[$leading_party]);
    }
    
    // Generate the actual map sections (using the same layout as the interactive map)
    $svg .= $this->generate_download_nassau_section($simulation_data);
    $svg .= $this->generate_download_grand_bahama_section($simulation_data);
    $svg .= $this->generate_download_family_islands_section($simulation_data);
    
    // Legend
    $svg .= $this->generate_legend_for_download();
    
    $svg .= '</svg>';
    return $svg;
}


/**
 * Generate Nassau section for download
 */
private function generate_download_nassau_section($simulation_data) {
    $svg = '';
    
    // Nassau title and subtitle (matching interactive map)
    $svg .= '<text x="350" y="140" class="region-title">NASSAU / NEW PROVIDENCE</text>';
    $svg .= '<text x="350" y="160" class="region-subtitle">24 Constituencies (Most Important Region)</text>';
    
    // Nassau grid - 6 columns x 4 rows for 24 constituencies (same as interactive)
    $cols = 6;
    $width = 85;
    $height = 60;
    $spacing = 8;
    $start_x = 50;
    $start_y = 180;
    
    $nassau_count = 0;
    foreach ($this->nassau_constituencies as $const_num => $const_name) {
        $party = isset($simulation_data[$const_num]) ? $simulation_data[$const_num] : 'PLP';
        $row = floor($nassau_count / $cols);
        $col = $nassau_count % $cols;
        $x = $start_x + $col * ($width + $spacing);
        $y = $start_y + $row * ($height + $spacing);
        
        $svg .= sprintf(
            '<rect class="constituency-path" x="%d" y="%d" width="%d" height="%d" fill="%s" rx="5"/>',
            $x, $y, $width, $height, $this->get_party_color($party)
        );
        
        // Constituency number (larger for Nassau)
        $svg .= sprintf(
            '<text x="%d" y="%d" class="constituency-label" font-weight="bold" font-size="14">%d</text>',
            $x + $width/2, $y + $height/2 - 5, $const_num
        );
        
        // Constituency name (smaller text below number)
        $display_name = strlen($const_name) > 12 ? substr($const_name, 0, 12) . '...' : $const_name;
        $svg .= sprintf(
            '<text x="%d" y="%d" class="constituency-label" font-size="8">%s</text>',
            $x + $width/2, $y + $height/2 + 8, esc_attr($display_name)
        );
        
        $nassau_count++;
    }
    
    return $svg;
}

/**
 * Generate Grand Bahama section for download - FIXED layout
 */
private function generate_download_grand_bahama_section($simulation_data) {
    $svg = '';
    
    // Grand Bahama title (positioned to the right like interactive map)
    $svg .= '<text x="1050" y="200" class="region-title">GRAND BAHAMA</text>';
    $svg .= '<text x="1050" y="220" class="region-subtitle">5 Constituencies</text>';
    
    $width = 120;
    $height = 50;
    $start_x = 800;
    $start_y = 240;
    $spacing = 10;
    
    $gb_count = 0;
    foreach ($this->grand_bahama_constituencies as $const_num => $const_name) {
        $party = isset($simulation_data[$const_num]) ? $simulation_data[$const_num] : 'PLP';
        $x = $start_x + $gb_count * ($width + $spacing);
        $y = $start_y;
        
        // Wrap to second row if needed (same as interactive)
        if ($gb_count >= 3) {
            $x = $start_x + ($gb_count - 3) * ($width + $spacing);
            $y = $start_y + $height + $spacing;
        }
        
        $svg .= sprintf(
            '<rect class="constituency-path" x="%d" y="%d" width="%d" height="%d" fill="%s" rx="4"/>',
            $x, $y, $width, $height, $this->get_party_color($party)
        );
        
        $svg .= sprintf(
            '<text x="%d" y="%d" class="constituency-label" font-weight="bold">%d</text>',
            $x + $width/2, $y + $height/2, $const_num
        );
        
        $gb_count++;
    }
    
    return $svg;
}

/**
 * Generate Family Islands section for download - FIXED layout
 */
private function generate_download_family_islands_section($simulation_data) {
    $svg = '';
    
    // Family Islands title (positioned to the right like interactive map)
    $svg .= '<text x="1050" y="420" class="region-title">FAMILY ISLANDS</text>';
    $svg .= '<text x="1050" y="440" class="region-subtitle">10 Constituencies</text>';
    
    $cols = 3;
    $width = 100;
    $height = 45;
    $start_x = 800;
    $start_y = 460;
    $spacing = 10;
    
    $fi_count = 0;
    foreach ($this->family_islands_constituencies as $const_num => $const_name) {
        $party = isset($simulation_data[$const_num]) ? $simulation_data[$const_num] : 'PLP';
        $row = floor($fi_count / $cols);
        $col = $fi_count % $cols;
        $x = $start_x + $col * ($width + $spacing);
        $y = $start_y + $row * ($height + $spacing);
        
        $svg .= sprintf(
            '<rect class="constituency-path" x="%d" y="%d" width="%d" height="%d" fill="%s" rx="4"/>',
            $x, $y, $width, $height, $this->get_party_color($party)
        );
        
        $svg .= sprintf(
            '<text x="%d" y="%d" class="constituency-label" font-size="10">%d</text>',
            $x + $width/2, $y + $height/2, $const_num
        );
        
        $fi_count++;
    }
    
    return $svg;
}
/**
 * Generate legend for download
 */
private function generate_legend_for_download() {
    $svg = '<text x="50" y="780" class="region-title">PARTY LEGEND</text>';
    
    $parties = array(
        'PLP' => 'Progressive Liberal Party (Gold)',
        'FNM' => 'Free National Movement (Red)', 
        'COI' => 'Coalition of Independence (Cyan)',
        'DNA' => 'Democratic National Alliance (Green)',
        'IND' => 'Independent (Gray)'
    );
    
    $y_pos = 810;
    foreach ($parties as $party => $name) {
        $color = $this->get_party_color($party);
        $svg .= sprintf('<rect x="50" y="%d" width="25" height="20" fill="%s" stroke="#333" stroke-width="1.5"/>', $y_pos - 15, $color);
        $svg .= sprintf('<text x="85" y="%d" class="constituency-label" fill="#333" text-anchor="start" font-size="12">%s</text>', $y_pos, $name);
        $y_pos += 30;
    }
    
    // Add download info
    $svg .= sprintf('<text x="50" y="%d" class="seat-counter-text" font-size="10" fill="#666">Downloaded from: %s</text>', $y_pos + 20, get_site_url());
    
    return $svg;
}
	public function enhance_official_svg($svg_content) {
    // Check if SVG content is valid
    if (!$svg_content || strlen($svg_content) < 100) {
        return $this->generate_enhanced_svg();
    }
    
    // Load XML safely
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadXML($svg_content);
    
    if (libxml_get_errors()) {
        libxml_clear_errors();
        return $this->generate_enhanced_svg();
    }
    
    $paths = $dom->getElementsByTagName('path');
    $manual_mapping = $this->get_manual_svg_mapping();
    
    $mapped_count = 0;
    $unmapped_paths = array();
    
    foreach ($paths as $path) {
        $path_id = $path->getAttribute('id');
        
        // Check if this path is in our manual mapping
        if (isset($manual_mapping[$path_id])) {
            $constituency_number = $manual_mapping[$path_id];
            
            // Add interactive attributes
            $path->setAttribute('class', 'constituency-path interactive');
            $path->setAttribute('data-constituency', $constituency_number);
            $path->setAttribute('data-path-id', $path_id);
            
            // Store original fill for reference
            $original_fill = $path->getAttribute('fill');
            if ($original_fill) {
                $path->setAttribute('data-original-fill', $original_fill);
            }
            
            // Add interactive styles
            $path->setAttribute('style', 'cursor: pointer; transition: filter 0.2s ease; stroke: #333; stroke-width: 1;');
            
            $mapped_count++;
        } else {
            $unmapped_paths[] = $path_id;
        }
    }
    
    // Add enhanced CSS styles
    $style = $dom->createElement('style');
    $style->appendChild($dom->createTextNode('
        .constituency-path { 
            cursor: pointer; 
            stroke: #333; 
            stroke-width: 1;
            transition: filter 0.2s ease;
        }
        
        .constituency-path:hover { 
            filter: brightness(1.1);
        }
        
        .constituency-path.selected {
            filter: brightness(1.2);
            stroke-width: 2;
        }
        
        .constituency-label { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            font-weight: bold; 
            pointer-events: none; 
            text-anchor: middle; 
        }
    '));
    
    // Add styles to defs section
    $defs = $dom->getElementsByTagName('defs')->item(0);
    if (!$defs) {
        $defs = $dom->createElement('defs');
        $dom->documentElement->insertBefore($defs, $dom->documentElement->firstChild);
    }
    $defs->appendChild($style);
    
    // Add JavaScript for interaction
    $script = $dom->createElement('script');
    $script->setAttribute('type', 'text/javascript');
    $script->appendChild($dom->createCDATASection('
        console.log("=== SVG MAPPING DEBUG ===");
        console.log("Mapped constituencies: ' . $mapped_count . '");
        console.log("Unmapped paths: ' . json_encode($unmapped_paths) . '");
        
        // Make selectConstituency globally available
        if (typeof window.selectConstituency === "undefined") {
            window.selectConstituency = function(constituencyId) {
                console.log("SVG selectConstituency called for:", constituencyId);
                
                // Trigger click event that the main JS will handle
                var event = new CustomEvent("constituencySelect", {
                    detail: { constituencyId: constituencyId }
                });
                document.dispatchEvent(event);
            };
        }
        
        console.log("=== SVG SETUP COMPLETE ===");
    '));
    
    $dom->appendChild($script);
    
    return $dom->saveXML();
}
	
    // Generate the enhanced SVG map with proper Nassau focus
    public function generate_enhanced_svg() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        $constituencies = $wpdb->get_results("SELECT * FROM $table_name ORDER BY constituency_number");
        
        $svg = '<svg viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">';
        $svg .= '<defs>';
        $svg .= '<style>';
        $svg .= '.constituency-path { cursor: pointer; stroke: #333; stroke-width: 1.5; transition: all 0.3s ease; }';
        $svg .= '.constituency-path:hover { stroke-width: 3; filter: brightness(1.1); }';
        $svg .= '.constituency-label { font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; pointer-events: none; text-anchor: middle; }';
        $svg .= '.region-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-anchor: middle; fill: #2c3e50; }';
        $svg .= '.region-subtitle { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; fill: #7f8c8d; }';
        $svg .= '</style>';
        $svg .= '</defs>';
        
        // Background
        $svg .= '<rect width="1400" height="900" fill="#ecf0f1"/>';
        
        // Title
        $svg .= '<text x="700" y="30" class="region-title" font-size="20">The Bahamas - Parliamentary Constituencies 2021</text>';
        
        // Create Nassau area (large detailed section) - LEFT SIDE
        $svg .= '<g id="nassau-area">';
        $svg .= $this->generate_nassau_section($constituencies);
        $svg .= '</g>';
        
        // Create Grand Bahama - TOP RIGHT
        $svg .= '<g id="grand-bahama-area">';
        $svg .= $this->generate_grand_bahama_section($constituencies);
        $svg .= '</g>';
        
        // Create Family Islands - BOTTOM RIGHT
        $svg .= '<g id="family-islands-area">';
        $svg .= $this->generate_family_islands_section($constituencies);
        $svg .= '</g>';
        
        $svg .= '</svg>';
        return $svg;
    }
    
    private function generate_nassau_section($constituencies) {
        $svg = '';
        
        // Nassau title and subtitle
        $svg .= '<text x="350" y="80" class="region-title">NASSAU / NEW PROVIDENCE</text>';
        $svg .= '<text x="350" y="100" class="region-subtitle">24 Constituencies (Most Important Region)</text>';
        
        // Nassau grid - 6 columns x 4 rows for 24 constituencies
        $cols = 6;
        $rows = 4;
        $width = 85;
        $height = 60;
        $spacing = 8;
        $start_x = 50;
        $start_y = 120;
        
        $nassau_count = 0;
        foreach ($this->nassau_constituencies as $const_num => $const_name) {
            foreach ($constituencies as $constituency) {
                if ($constituency->constituency_number == $const_num) {
                    $row = floor($nassau_count / $cols);
                    $col = $nassau_count % $cols;
                    $x = $start_x + $col * ($width + $spacing);
                    $y = $start_y + $row * ($height + $spacing);
                    
                    $svg .= sprintf(
                        '<rect id="constituency-%d" class="constituency-path" 
                               data-constituency="%d" 
                               data-name="%s"
                               data-region="Nassau"
                               x="%d" y="%d" width="%d" height="%d"
                               fill="%s" 
                               rx="5"
                               title="%s">
                        </rect>',
                        $const_num, $const_num,
                        esc_attr($const_name),
                        $x, $y, $width, $height,
                        $this->get_party_color($constituency->current_party),
                        esc_attr($const_name . ' (' . $const_num . ')')
                    );
                    
                    // Constituency number (larger for Nassau)
                    $svg .= sprintf(
                        '<text x="%d" y="%d" class="constituency-label" fill="#fff" font-weight="bold" font-size="14">%d</text>',
                        $x + $width/2,
                        $y + $height/2 - 5,
                        $const_num
                    );
                    
                    // Constituency name (smaller text below number)
                    $display_name = strlen($const_name) > 12 ? substr($const_name, 0, 12) . '...' : $const_name;
                    $svg .= sprintf(
                        '<text x="%d" y="%d" class="constituency-label" fill="#fff" font-size="8">%s</text>',
                        $x + $width/2,
                        $y + $height/2 + 8,
                        esc_attr($display_name)
                    );
                    
                    $nassau_count++;
                    break;
                }
            }
        }
        
        return $svg;
    }
    
    private function generate_grand_bahama_section($constituencies) {
        $svg = '';
        
        // Grand Bahama title
        $svg .= '<text x="1050" y="150" class="region-title">GRAND BAHAMA</text>';
        $svg .= '<text x="1050" y="170" class="region-subtitle">5 Constituencies</text>';
        
        $width = 120;
        $height = 50;
        $start_x = 800;
        $start_y = 190;
        $spacing = 10;
        
        $gb_count = 0;
        foreach ($this->grand_bahama_constituencies as $const_num => $const_name) {
            foreach ($constituencies as $constituency) {
                if ($constituency->constituency_number == $const_num) {
                    $x = $start_x + $gb_count * ($width + $spacing);
                    $y = $start_y;
                    
                    // Wrap to second row if needed
                    if ($gb_count >= 3) {
                        $x = $start_x + ($gb_count - 3) * ($width + $spacing);
                        $y = $start_y + $height + $spacing;
                    }
                    
                    $svg .= sprintf(
                        '<rect id="constituency-%d" class="constituency-path" 
                               data-constituency="%d" 
                               data-name="%s"
                               data-region="Grand Bahama"
                               x="%d" y="%d" width="%d" height="%d"
                               fill="%s" 
                               rx="4"
                               title="%s">
                        </rect>',
                        $const_num, $const_num,
                        esc_attr($const_name),
                        $x, $y, $width, $height,
                        $this->get_party_color($constituency->current_party),
                        esc_attr($const_name . ' (' . $const_num . ')')
                    );
                    
                    $svg .= sprintf(
                        '<text x="%d" y="%d" class="constituency-label" fill="#fff" font-weight="bold">%d</text>',
                        $x + $width/2,
                        $y + $height/2,
                        $const_num
                    );
                    
                    $gb_count++;
                    break;
                }
            }
        }
        
        return $svg;
    }
    
    private function generate_family_islands_section($constituencies) {
        $svg = '';
        
        // Family Islands title
        $svg .= '<text x="1050" y="380" class="region-title">FAMILY ISLANDS</text>';
        $svg .= '<text x="1050" y="400" class="region-subtitle">10 Constituencies</text>';
        
        $cols = 3;
        $width = 100;
        $height = 45;
        $start_x = 800;
        $start_y = 420;
        $spacing = 10;
        
        $fi_count = 0;
        foreach ($this->family_islands_constituencies as $const_num => $const_name) {
            foreach ($constituencies as $constituency) {
                if ($constituency->constituency_number == $const_num) {
                    $row = floor($fi_count / $cols);
                    $col = $fi_count % $cols;
                    $x = $start_x + $col * ($width + $spacing);
                    $y = $start_y + $row * ($height + $spacing);
                    
                    $svg .= sprintf(
                        '<rect id="constituency-%d" class="constituency-path" 
                               data-constituency="%d" 
                               data-name="%s"
                               data-region="Family Islands"
                               x="%d" y="%d" width="%d" height="%d"
                               fill="%s" 
                               rx="4"
                               title="%s">
                        </rect>',
                        $const_num, $const_num,
                        esc_attr($const_name),
                        $x, $y, $width, $height,
                        $this->get_party_color($constituency->current_party),
                        esc_attr($const_name . ' (' . $const_num . ')')
                    );
                    
                    $svg .= sprintf(
                        '<text x="%d" y="%d" class="constituency-label" fill="#fff" font-size="10">%d</text>',
                        $x + $width/2,
                        $y + $height/2,
                        $const_num
                    );
                    
                    $fi_count++;
                    break;
                }
            }
        }
        
        return $svg;
    }
    
    private function get_party_color($party, $colorblind_mode = false) {
    if ($colorblind_mode) {
        // Colorblind-friendly colors with better contrast
        $colors = array(
            'PLP' => '#FFA500', // Orange instead of gold
            'FNM' => '#CC0000', // Darker red
            'COI' => '#0066CC', // Darker blue instead of cyan
            'DNA' => '#228B22', // Forest green
            'IND' => '#666666'  // Darker gray
        );
    } else {
        // Default colors
        $colors = array(
            'PLP' => '#FFD700', // Gold
            'FNM' => '#FF0000', // Red
            'COI' => '#00FFFF', // Cyan
            'DNA' => '#00FF00', // Green
            'IND' => '#808080'  // Gray
        );
    }
    return isset($colors[$party]) ? $colors[$party] : '#CCCCCC';
}
    
    public function ajax_get_svg_map() {
    // Verify nonce
    if (!check_ajax_referer('bahamas_election_nonce', 'nonce', false)) {
        wp_send_json_error('Invalid nonce');
        return;
    }
    
    // Try to load official SVG file first
    $svg_path = BAHAMAS_ELECTION_PLUGIN_DIR . 'assets/bahamas-official-map.svg';
    
    if (file_exists($svg_path)) {
        // Load and enhance the official SVG
        $svg_content = file_get_contents($svg_path);
        
        if ($svg_content && strlen($svg_content) > 100) {
            $enhanced_svg = $this->enhance_official_svg($svg_content);
            
            wp_send_json_success(array(
                'svg' => $enhanced_svg,
                'source' => 'official_enhanced',
                'message' => 'Official SVG loaded and enhanced'
            ));
            return;
        }
    }
    
    // Fallback to generated SVG
    $generated_svg = $this->generate_enhanced_svg();
    
    if ($generated_svg && strlen($generated_svg) > 100) {
        wp_send_json_success(array(
            'svg' => $generated_svg,
            'source' => 'generated',
            'message' => 'Generated SVG created successfully'
        ));
        return;
    }
    
    // If both fail, send error
    wp_send_json_error(array(
        'message' => 'Failed to load SVG map',
        'svg_path_exists' => file_exists($svg_path),
        'svg_path' => $svg_path
    ));
}
    
    public function ajax_update_constituency() {
    check_ajax_referer('bahamas_election_nonce', 'nonce');
    
    $constituency_id = intval($_POST['constituency_id']);
    $new_party = sanitize_text_field($_POST['new_party']);
    
    // DO NOT update database - simulations are client-side only
    wp_send_json_success(array(
        'message' => 'Simulation updated (client-side only)',
        'constituency_id' => $constituency_id,
        'new_party' => $new_party,
        'note' => 'Changes are temporary and will reset on page reload'
    ));
}
	private function get_manual_svg_mapping() {
    return array(
        // Nassau Constituencies (1-24)
        'path16590' => 1,   // Killarney
        'path16592' => 2,   // Golden Isles
        'path16594' => 3,   // Southern Shores
        'path16596' => 4,   // Tall Pines
        'path16622' => 5,   // Carmichael
        'path16600' => 6,   // South Beach
        'path16602' => 7,   // Seabreeze
        'path16632' => 8,   // Elizabeth
        'path16614' => 9,   // Yamacraw
        'path16598' => 10,  // St Annes
        'path16608' => 11,  // Fox Hill
        'path16624' => 12,  // Nassau Village
        'path16630' => 13,  // Pinewood
        'path16616' => 14,  // Bamboo Town
        'path16620' => 15,  // Golden Gates
        'path16604' => 16,  // Garden Hills
        'path16610' => 17,  // Mt. Moriah
        'path16612' => 18,  // St. Barnabas
        'path16628' => 19,  // Englerston
        'path16606' => 20,  // Marathon
        'path16634' => 21,  // Freetown
        'path16618' => 22,  // Centreville
        'path16626' => 23,  // Bains Town & Grants Town
        'path16636' => 24,  // Fort Charlotte

        // Grand Bahama Constituencies (25-29)
        'path16650' => 25,  // West Grand Bahama & Bimini
        'path16644' => 26,  // Grand Central Bahama
        'path16648' => 27,  // Pineridge
        'path16646' => 28,  // Marco City
        'path16642' => 29,  // East Grand Bahama

        // Family Islands Constituencies (30-39)
        'path16574' => 30,  // North Abaco
        'path16576' => 31,  // Central & South Abaco
        'path16578' => 32,  // North Eleuthera
        'path16580' => 33,  // Eleuthera (Central & South Eleuthera)
        'path16582' => 34,  // Cat Island, Rum Cay & San Salvador
        'path16586' => 35,  // Exumas & Ragged Island
        'path16588' => 36,  // Long Island
        'path16584' => 37,  // MICAL
        'path16638' => 38,  // Central & South Andros (North Andros & The Berry Islands)
        'path16640' => 39,  // Mangrove Cay & South Andros
    );
}
	
	private function map_path_to_constituency($path_id, $path_index, $path_element) {
    // Use the manual mapping you provided
    $manual_mapping = $this->get_manual_svg_mapping();
    
    if (isset($manual_mapping[$path_id])) {
        return $manual_mapping[$path_id];
    }
    
    // Log unmapped paths for debugging
    error_log("Unmapped SVG path found: " . $path_id);
    
    return 'unknown';
}
}

// Initialize the enhanced plugin
new BahamasElectionMapEnhanced();
