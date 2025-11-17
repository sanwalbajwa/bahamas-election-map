<?php
/**
 * Plugin Name: Bahamas Interactive Election Map - Enhanced
 * Plugin URI: https://sanwalbajwa.com/
 * Description: Interactive election simulation tool for all 39 Bahamian constituencies with admin panel
 * Version: 2.1.0
 * Author: Sanwal Bajwa
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit; 
}

// Define plugin constants
define('BAHAMAS_ELECTION_VERSION', '2.1.0');
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
        18 => 'St. Barnabas',       
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
        add_action('wp_ajax_download_svg', array($this, 'ajax_download_svg'));
        add_action('wp_ajax_nopriv_download_svg', array($this, 'ajax_download_svg'));
        
		 // Admin functionality
		add_action('admin_menu', array($this, 'add_admin_menu'));
		add_action('admin_init', array($this, 'admin_init'));
		add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
		add_action('wp_ajax_update_mp_info', array($this, 'ajax_update_mp_info'));
		add_action('wp_ajax_upload_mp_image', array($this, 'ajax_upload_mp_image'));
		add_action('wp_ajax_delete_mp_image', array($this, 'ajax_delete_mp_image')); // ADD THIS LINE
		add_action('wp_ajax_export_mp_data', array($this, 'ajax_export_mp_data'));
		add_action('wp_ajax_reset_all_mp_data', array($this, 'ajax_reset_all_mp_data'));
		add_action('wp_ajax_test_connection', array($this, 'ajax_test_connection'));
		
		// Small URL
		add_action('wp_ajax_save_shared_simulation', array($this, 'ajax_save_shared_simulation'));
		add_action('wp_ajax_nopriv_save_shared_simulation', array($this, 'ajax_save_shared_simulation'));
		add_action('wp_ajax_load_shared_simulation', array($this, 'ajax_load_shared_simulation'));
		add_action('wp_ajax_nopriv_load_shared_simulation', array($this, 'ajax_load_shared_simulation'));
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
            mp_image varchar(255) DEFAULT '',
            island varchar(50) DEFAULT '',
            region varchar(20) DEFAULT '',
            is_simulation tinyint(1) DEFAULT 0,
            PRIMARY KEY (id),
            UNIQUE KEY constituency_number (constituency_number)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
		
		$shared_table = $wpdb->prefix . 'bahamas_shared_simulations';
    
		$shared_sql = "CREATE TABLE $shared_table (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			share_code varchar(10) NOT NULL,
			simulation_data longtext NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP,
			expires_at datetime DEFAULT NULL,
			view_count int DEFAULT 0,
			PRIMARY KEY (id),
			UNIQUE KEY share_code (share_code),
			KEY expires_at (expires_at)
		) $charset_collate;";

		dbDelta($shared_sql);
    }
    
    public function insert_default_data() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        // Check if data already exists
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        if ($count > 0) return;
        
        // CORRECT 2021 ELECTION RESULTS
        // FNM won these 6 constituencies
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
                    'mp_image' => '',
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
                    'mp_image' => '',
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
                    'mp_image' => '',
                    'island' => 'Family Islands',
                    'region' => 'Family Islands',
                    'is_simulation' => 0
                )
            );
        }
    }
    
    public function enqueue_scripts() {
		wp_enqueue_style(
			'font-awesome',
			'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
			array(),
			'6.0.0'
		);
        wp_enqueue_script(
            'bahamas-election-enhanced-js',
            BAHAMAS_ELECTION_PLUGIN_URL . 'assets/bahamas-election-enhanced.js?ac3a',
            array('jquery'),
            BAHAMAS_ELECTION_VERSION,
            true
        );
        
        wp_enqueue_style(
            'bahamas-election-enhanced-css',
            BAHAMAS_ELECTION_PLUGIN_URL . 'assets/bahamas-election-enhanced.css?a',
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
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on our admin page
        if ($hook !== 'toplevel_page_bahamas-election-map') {
            return;
        }
        
        wp_enqueue_script(
            'bahamas-admin-js',
            BAHAMAS_ELECTION_PLUGIN_URL . 'assets/admin-panel.js',
            array('jquery'),
            BAHAMAS_ELECTION_VERSION,
            true
        );
        
        // Localize script for AJAX
        wp_localize_script('bahamas-admin-js', 'bahamas_admin_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bahamas_admin_nonce'),
            'plugin_url' => BAHAMAS_ELECTION_PLUGIN_URL
        ));
        
        // Enqueue WordPress media uploader
        wp_enqueue_media();
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            'Bahamas Election Map',
            'Election Map',
            'manage_options',
            'bahamas-election-map',
            array($this, 'admin_page'),
            'dashicons-location-alt',
            30
        );
    }
    
    /**
     * Initialize admin settings
     */
    public function admin_init() {
        register_setting('bahamas_election_group', 'bahamas_election_settings');
    }
    
    /**
     * Admin page callback
     */
    public function admin_page() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        // Get all constituencies
        $constituencies = $wpdb->get_results("SELECT * FROM $table_name ORDER BY constituency_number");
        
        ?>
        <div class="wrap">
            <h1>Bahamas Election Map - MP Management</h1>
            
            <div id="bahamas-admin-container">
                <div class="admin-tabs">
                    <button class="tab-button active" onclick="openTab(event, 'mp-management')">MP Management</button>
                    <button class="tab-button" onclick="openTab(event, 'settings')">Settings</button>
                    <button class="tab-button" onclick="openTab(event, 'import-export')">Import/Export</button>
                </div>
                
                <div id="mp-management" class="tab-content active">
                    <h2>Manage Members of Parliament</h2>
                    <p>Update MP names and upload their photos for each constituency.</p>
                    
                    <!-- Search Filter -->
                    <div class="mp-search-container" style="margin-bottom: 20px;">
                        <input type="text" 
                               id="mp-search" 
                               placeholder="Search constituencies, MPs, or parties..." 
                               style="width: 300px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;">
                        <button type="button" id="clear-search" class="button" style="margin-left: 10px;">Clear</button>
                    </div>
                    
                    <!-- Bulk Actions -->
                    <div class="bulk-actions-container" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4>Bulk Actions</h4>
                        <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                            <select id="bulk-party-select">
                                <option value="">Select Party</option>
                                <option value="PLP">PLP</option>
                                <option value="FNM">FNM</option>
                                <option value="COI">COI</option>
                                <option value="DNA">DNA</option>
                                <option value="IND">IND</option>
                            </select>
                            <button type="button" id="bulk-update-party" class="button">Update Selected Party</button>
                            <button type="button" id="bulk-clear-names" class="button">Clear All MP Names</button>
                            <button type="button" id="bulk-clear-images" class="button">Clear All Images</button>
                        </div>
                        <div style="margin-top: 10px;">
                            <label>
                                <input type="checkbox" id="select-all-cards"> Select All Constituencies
                            </label>
                        </div>
                    </div>
                    
                    <div class="mp-grid">
                        <?php foreach ($constituencies as $constituency): ?>
                            <div class="mp-card" data-constituency="<?php echo $constituency->constituency_number; ?>">
                                <div class="mp-card-header">
                                    <label style="float: right;">
                                        <input type="checkbox" class="constituency-checkbox" value="<?php echo $constituency->constituency_number; ?>">
                                    </label>
                                    <h3>Constituency <?php echo $constituency->constituency_number; ?></h3>
                                    <span class="constituency-name"><?php echo esc_html($constituency->constituency_name); ?></span>
                                    <span class="party-badge <?php echo strtolower($constituency->current_party); ?>">
                                        <?php echo esc_html($constituency->current_party); ?>
                                    </span>
                                </div>
                                
                                <div class="mp-card-body">
                                    <div class="mp-image-section">
                                        <div class="mp-image-container">
                                            <?php if (!empty($constituency->mp_image)): ?>
                                                <img src="<?php echo esc_url($constituency->mp_image); ?>" 
                                                     alt="<?php echo esc_attr($constituency->current_mp); ?>"
                                                     class="mp-photo">
                                            <?php else: ?>
                                                <div class="mp-photo-placeholder">
                                                    <span class="dashicons dashicons-businessman"></span>
                                                    <p>No Photo</p>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <div class="image-upload-section">
                                            <input type="file" 
                                                   id="mp-image-<?php echo $constituency->constituency_number; ?>" 
                                                   class="mp-image-upload" 
                                                   accept="image/*"
                                                   data-constituency="<?php echo $constituency->constituency_number; ?>">
                                            <label for="mp-image-<?php echo $constituency->constituency_number; ?>" 
                                                   class="upload-btn">
                                                <span class="dashicons dashicons-camera"></span>
                                                Upload Photo
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div class="mp-info-section">
                                        <div class="form-group">
                                            <label for="mp-name-<?php echo $constituency->constituency_number; ?>">
                                                MP Name:
                                            </label>
                                            <input type="text" 
                                                   id="mp-name-<?php echo $constituency->constituency_number; ?>"
                                                   class="mp-name-input"
                                                   value="<?php echo esc_attr($constituency->current_mp); ?>"
                                                   placeholder="Enter MP name..."
                                                   data-constituency="<?php echo $constituency->constituency_number; ?>">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="mp-party-<?php echo $constituency->constituency_number; ?>">
                                                Party:
                                            </label>
                                            <select id="mp-party-<?php echo $constituency->constituency_number; ?>"
                                                    class="mp-party-select"
                                                    data-constituency="<?php echo $constituency->constituency_number; ?>">
                                                <option value="PLP" <?php selected($constituency->current_party, 'PLP'); ?>>PLP</option>
                                                <option value="FNM" <?php selected($constituency->current_party, 'FNM'); ?>>FNM</option>
                                                <option value="COI" <?php selected($constituency->current_party, 'COI'); ?>>COI</option>
                                                <option value="DNA" <?php selected($constituency->current_party, 'DNA'); ?>>DNA</option>
                                                <option value="IND" <?php selected($constituency->current_party, 'IND'); ?>>IND</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-actions">
                                            <button type="button" 
                                                    class="button button-primary save-mp-btn"
                                                    data-constituency="<?php echo $constituency->constituency_number; ?>">
                                                <span class="dashicons dashicons-yes"></span>
                                                Save Changes
                                            </button>
                                            
                                            <button type="button" 
                                                    class="button button-secondary reset-mp-btn"
                                                    data-constituency="<?php echo $constituency->constituency_number; ?>">
                                                <span class="dashicons dashicons-undo"></span>
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mp-card-footer">
                                    <small>Region: <?php echo esc_html($constituency->region); ?> | 
                                           Island: <?php echo esc_html($constituency->island); ?></small>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <div id="settings" class="tab-content">
                    <h2>General Settings</h2>
                    <form method="post" action="options.php">
                        <?php settings_fields('bahamas_election_group'); ?>
                        <?php do_settings_sections('bahamas_election_group'); ?>
                        
                        <table class="form-table">
                            <tr>
                                <th scope="row">Default Image Size</th>
                                <td>
                                    <select name="bahamas_election_settings[image_size]">
                                        <option value="thumbnail">Thumbnail (150x150)</option>
                                        <option value="medium">Medium (300x300)</option>
                                        <option value="large">Large (1024x1024)</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Enable MP Photos in Map</th>
                                <td>
                                    <input type="checkbox" name="bahamas_election_settings[show_mp_photos]" value="1" checked>
                                    <label>Show MP photos in the interactive map</label>
                                </td>
                            </tr>
                        </table>
                        
                        <?php submit_button(); ?>
                    </form>
                </div>
                
                <div id="import-export" class="tab-content">
                    <h2>Import/Export Data</h2>
                    
                    <div class="import-export-section">
                        <h3>Export MP Data</h3>
                        <p>Download all MP information as CSV file.</p>
                        <button type="button" class="button button-primary" id="export-mp-data">
                            <span class="dashicons dashicons-download"></span>
                            Export MP Data
                        </button>
                    </div>
                    
                    <div class="import-export-section">
                        <h3>Import MP Data</h3>
                        <p>Upload CSV file to bulk update MP information.</p>
                        <input type="file" id="import-mp-file" accept=".csv">
                        <button type="button" class="button button-secondary" id="import-mp-data">
                            <span class="dashicons dashicons-upload"></span>
                            Import MP Data
                        </button>
                    </div>
                    
                    <div class="import-export-section">
                        <h3>Reset to 2021 Results</h3>
                        <p><strong>Warning:</strong> This will reset all MP data to the original 2021 election results.</p>
                        <button type="button" class="button button-secondary" id="reset-to-2021-admin">
                            <span class="dashicons dashicons-undo"></span>
                            Reset All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <?php wp_nonce_field('wp_rest', '_wpnonce'); ?>
        
        <style>
        #bahamas-admin-container {
            max-width: 1200px;
            margin: 20px 0;
        }
        
        .admin-tabs {
            border-bottom: 1px solid #ccc;
            margin-bottom: 20px;
        }
        
        .tab-button {
            background: #f1f1f1;
            border: none;
            outline: none;
            padding: 14px 20px;
            cursor: pointer;
            transition: 0.3s;
            font-size: 16px;
            margin-right: 5px;
        }
        
        .tab-button:hover {
            background: #ddd;
        }
        
        .tab-button.active {
            background: #0073aa;
            color: white;
        }
        
        .tab-content {
            display: none;
            padding: 20px 0;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .mp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .mp-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .mp-card-header {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .mp-card-header h3 {
            margin: 0 0 5px 0;
            color: #2c3e50;
        }
        
        .constituency-name {
            font-weight: bold;
            color: #495057;
            display: block;
            margin-bottom: 8px;
        }
        
        .party-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
        }
        
        .party-badge.plp { background: #FFD700; color: #333; }
        .party-badge.fnm { background: #FF0000; }
        .party-badge.coi { background: #00FFFF; color: #333; }
        .party-badge.dna { background: #00FF00; color: #333; }
        .party-badge.ind { background: #808080; }
        
        .mp-card-body {
            padding: 20px;
            display: flex;
            gap: 20px;
        }
        
        .mp-image-section {
            flex: 1;
            text-align: center;
        }
        
        .mp-image-container {
            width: 120px;
            height: 120px;
            margin: 0 auto 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
        }
        
        .mp-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .mp-photo-placeholder {
            text-align: center;
            color: #6c757d;
        }
        
        .mp-photo-placeholder .dashicons {
            font-size: 40px;
            margin-bottom: 5px;
        }
        
        .mp-photo-placeholder p {
            margin: 0;
            font-size: 12px;
        }
        
        .mp-image-upload {
            display: none;
        }
        
        .upload-btn {
            display: inline-block;
            padding: 8px 16px;
            background: #0073aa;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            text-decoration: none;
            transition: background 0.3s;
        }
        
        .upload-btn:hover {
            background: #005a87;
            color: white;
        }
        
        .upload-btn .dashicons {
            font-size: 14px;
            margin-right: 5px;
        }
        
        .mp-info-section {
            flex: 2;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .mp-name-input,
        .mp-party-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .form-actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        
        .save-mp-btn {
            background: #28a745 !important;
            border-color: #28a745 !important;
        }
        
        .save-mp-btn:hover {
            background: #218838 !important;
            border-color: #218838 !important;
        }
        
        .mp-card-footer {
            background: #f8f9fa;
            padding: 10px 15px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #6c757d;
        }
        
        .import-export-section {
            background: white;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .import-export-section h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        
        #import-mp-file {
            margin: 10px 10px 10px 0;
        }
        
        .notification {
            padding: 12px 20px;
            margin: 15px 0;
            border-radius: 4px;
            display: none;
        }
        
        .notification.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .notification.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        
        .spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
        
        <script>
        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].classList.remove("active");
            }
            tablinks = document.getElementsByClassName("tab-button");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].classList.remove("active");
            }
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
        }
        </script>
        <?php
    }
    
    public function render_map_shortcode($atts) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        // Parse shortcode attributes
        $atts = shortcode_atts(array(
            'height' => '800px',
            'show_mp_photos' => 'true'
        ), $atts);
        // Get current constituency data
        $constituencies = $wpdb->get_results("SELECT * FROM $table_name ORDER BY constituency_number");
        
        ob_start();
        ?>
        <div id="bahamas-election-container">
            
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
<!--                 <div class="majority-indicator" id="majority-indicator">
                    <span id="majority-text">No Majority</span>
                </div> -->
            </div>
            
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
                <?php if ($atts['show_mp_photos'] === 'true'): ?>
                <label class="control-label mp-photo" title="Show MP photos">
                    <input type="checkbox" id="show-mp-photos" checked> 
                    <span class="checkbox-icon">📷</span> Show MP Photos
                </label>
                <?php endif; ?>
                <div class="simulation-status" id="simulation-status">
                    <span class="status-icon">✅</span>
                    <span class="status-text">2021 Election Results</span>
                </div>
            </div>
            <div class="map-container-with-overlay">
                <div id="bahamas-map" ?>;">
                    <div class="map-loading">
                        <span>Loading enhanced interactive map...</span>
                    </div>
                </div>
               <div class="parent-info"> 
                <!-- UPDATED MP Avatar with Photo -->
				<div class="mp-avatar">
					<?php if ($atts['show_mp_photos'] === 'true'): ?>
					<!-- MP Photo Container (hidden by default) -->
					<div class="mp-photo-container" id="mp-photo-container" style="display: none;">
						<img id="mp-photo" src="" alt="" class="mp-profile-photo">
					</div>
					<?php endif; ?>

					<!-- Avatar Icon (shown by default) -->
					<span class="avatar-icon" id="mp-avatar-icon" style="display: block;">👤</span>

					<!-- MP Info (always visible) -->
					<span id="info-mp-name">Click on any constituency</span>
					<span id="info-party-badge">-</span>
				</div>
                
                <div class="constituency-info-overlay" id="constituency-info">
                    <div class="info-details">
                        <div class="info-row">
                            <span class="info-label">Constituency:</span>
                            <span id="info-constituency-name">-</span>
                        </div>
<!--                         <div class="info-row">
                            <span class="info-label">MP:</span>
                            <span id="info-mp-full">-</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Current Party:</span>
                            <span id="info-current-party">-</span>
                        </div> -->
						<div class="info-row flip-row">
							<span class="flip-label">Flip (Prediction):</span>
							<span id="info-flip-prediction">-</span>
                    	</div>
                        <div class="info-row">
                            <span class="info-label">Region:</span>
                            <span id="info-region">-</span>
                        </div>
						 <button class="btn btn-reset mobile-btn reset-button" title="Reset to 2021 Election Results">
							<span class="btn-icon">🔄</span> Reset to 2021
						</button>
						<label class="control-label colorblind-mode-label" title="Enable colorblind-friendly colors">
							<input type="checkbox" class="colorblind-toggle"> 
							<span class="checkbox-icon">🎨</span> Colorblind Mode
						</label>
                    </div>  
                    <div class="legend-compact">
                        <div class="legend-title">Party Colors</div>
                        <div class="legend-items-compact">
                            <div class="legend-item-compact">
                                <span class="color-dot plp-color"></span>
                                <span>Progressive Liberal Party (PLP) - Current Government</span>
                            </div>
                            <div class="legend-item-compact">
                                <span class="color-dot fnm-color"></span>
                                <span>Free National Movement (FNM) - Opposition</span>
                            </div>
                            <div class="legend-item-compact">
                                <span class="color-dot coi-color"></span>
                                <span>Coalition of Independence (COI)</span>
                            </div>
                            <div class="legend-item-compact">
                                <span class="color-dot dna-color"></span>
                                <span>Democratic National Alliance (DNA)</span>
                            </div>
                            <div class="legend-item-compact">
                                <span class="color-dot ind-color"></span>
                                <span>Independent (IND)</span>
                            </div>
                        </div>
                    </div>
                </div>
			</div>
            </div>
            
        </div>
        
        <script type="application/json" id="constituency-data">
        <?php echo json_encode($constituencies); ?>
        </script>
        <div class="social-share-container">
    <span class="social-share-label"><i class="fa fa-share-alt">:</i></span>
    <div class="social-share-buttons">
        <a href="#" id="share-whatsapp" class="social-share-btn whatsapp-btn" title="Share on WhatsApp">
            <i class="fa fa-whatsapp" aria-hidden="true"></i>
        </a>
        <a href="#" id="share-facebook" class="social-share-btn facebook-btn" title="Share on Facebook">
            <i class="fa fa-facebook" aria-hidden="true"></i>
        </a>
        <a href="#" id="share-twitter" class="social-share-btn twitter-btn" title="Share on Twitter">
           <i class="fa fa-twitter" aria-hidden="true"></i>
        </a>
        <a href="#" id="share-tiktok" class="social-share-btn tiktok-btn" title="Share on TikTok">
            <i class="fa fa-music"></i>
        </a>
        <a href="#" id="share-instagram" class="social-share-btn instagram-btn" title="Share on Instagram">
            <i class="fa fa-instagram"></i>
        </a>
    </div>
</div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * AJAX handler for updating MP information
     */
    public function ajax_update_mp_info() {
        check_ajax_referer('bahamas_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $constituency_id = intval($_POST['constituency_id']);
        $mp_name = sanitize_text_field($_POST['mp_name']);
        $party = sanitize_text_field($_POST['party']);
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        $result = $wpdb->update(
            $table_name,
            array(
                'current_mp' => $mp_name,
                'current_party' => $party
            ),
            array('constituency_number' => $constituency_id),
            array('%s', '%s'),
            array('%d')
        );
        
        if ($result !== false) {
            wp_send_json_success(array(
                'message' => 'MP information updated successfully',
                'constituency_id' => $constituency_id,
                'mp_name' => $mp_name,
                'party' => $party
            ));
        } else {
            wp_send_json_error('Failed to update MP information');
        }
    }
    
    /**
     * AJAX handler for uploading MP images
     */
    public function ajax_upload_mp_image() {
    // Check nonce first
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'bahamas_admin_nonce')) {
        wp_send_json_error('Security check failed - invalid nonce');
        return;
    }
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    // Check if file was uploaded
    if (!isset($_FILES['mp_image']) || $_FILES['mp_image']['error'] !== UPLOAD_ERR_OK) {
        $error_messages = array(
            UPLOAD_ERR_INI_SIZE => 'File is too large (exceeds upload_max_filesize)',
            UPLOAD_ERR_FORM_SIZE => 'File is too large (exceeds MAX_FILE_SIZE)',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
        );
        
        $error_code = isset($_FILES['mp_image']['error']) ? $_FILES['mp_image']['error'] : UPLOAD_ERR_NO_FILE;
        $error_message = isset($error_messages[$error_code]) ? $error_messages[$error_code] : 'Unknown upload error';
        
        wp_send_json_error('Upload error: ' . $error_message);
        return;
    }
    
    // Validate constituency ID
    if (!isset($_POST['constituency_id']) || !is_numeric($_POST['constituency_id'])) {
        wp_send_json_error('Invalid constituency ID');
        return;
    }
    
    $constituency_id = intval($_POST['constituency_id']);
    
    if ($constituency_id < 1 || $constituency_id > 39) {
        wp_send_json_error('Constituency ID must be between 1 and 39');
        return;
    }
    
    // Include WordPress file handling functions
    if (!function_exists('wp_handle_upload')) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
    }
    
    // Validate file type
    $allowed_types = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp');
    $file_type = $_FILES['mp_image']['type'];
    
    if (!in_array($file_type, $allowed_types)) {
        wp_send_json_error('Invalid file type. Please upload JPG, PNG, GIF, or WebP images only.');
        return;
    }
    
    // Validate file size (5MB limit)
    $max_size = 5 * 1024 * 1024; // 5MB in bytes
    if ($_FILES['mp_image']['size'] > $max_size) {
        wp_send_json_error('File is too large. Maximum size is 5MB.');
        return;
    }
    
    // Set upload overrides
    $upload_overrides = array(
        'test_form' => false,
        'mimes' => array(
            'jpg|jpeg|jpe' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp'
        )
    );
    
    // Handle the upload
    $uploadedfile = $_FILES['mp_image'];
    $movefile = wp_handle_upload($uploadedfile, $upload_overrides);
    
    if ($movefile && !isset($movefile['error'])) {
        // Upload successful, save to database
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        $result = $wpdb->update(
            $table_name,
            array('mp_image' => $movefile['url']),
            array('constituency_number' => $constituency_id),
            array('%s'),
            array('%d')
        );
        
        if ($result !== false) {
            wp_send_json_success(array(
                'message' => 'Image uploaded successfully',
                'image_url' => $movefile['url'],
                'constituency_id' => $constituency_id,
                'file_info' => array(
                    'original_name' => $uploadedfile['name'],
                    'size' => size_format($uploadedfile['size']),
                    'type' => $uploadedfile['type']
                )
            ));
        } else {
            // Delete the uploaded file since database update failed
            if (file_exists($movefile['file'])) {
                unlink($movefile['file']);
            }
            wp_send_json_error('Failed to save image URL to database');
        }
    } else {
        // Upload failed
        $error_message = isset($movefile['error']) ? $movefile['error'] : 'Unknown upload error';
        wp_send_json_error('File upload failed: ' . $error_message);
    }
}
	public function ajax_delete_mp_image() {
    check_ajax_referer('bahamas_admin_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    $constituency_id = intval($_POST['constituency_id']);
    
    if ($constituency_id < 1 || $constituency_id > 39) {
        wp_send_json_error('Invalid constituency ID');
        return;
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'bahamas_constituencies';
    
    // Get current image URL to delete file
    $current_image = $wpdb->get_var($wpdb->prepare(
        "SELECT mp_image FROM $table_name WHERE constituency_number = %d",
        $constituency_id
    ));
    
    // Update database to remove image URL
    $result = $wpdb->update(
        $table_name,
        array('mp_image' => ''),
        array('constituency_number' => $constituency_id),
        array('%s'),
        array('%d')
    );
    
    if ($result !== false) {
        // Optionally delete the physical file
        if ($current_image) {
            $file_path = str_replace(wp_upload_dir()['baseurl'], wp_upload_dir()['basedir'], $current_image);
            if (file_exists($file_path)) {
                unlink($file_path);
            }
        }
        
        wp_send_json_success(array(
            'message' => 'Image deleted successfully',
            'constituency_id' => $constituency_id
        ));
    } else {
        wp_send_json_error('Failed to delete image from database');
    }
}
    
    /**
     * Export MP data as CSV
     */
    public function ajax_export_mp_data() {
        check_ajax_referer('bahamas_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        $constituencies = $wpdb->get_results("SELECT * FROM $table_name ORDER BY constituency_number");
        
        $csv_data = array();
        $csv_data[] = array(
            'Constituency Number',
            'Constituency Name',
            'MP Name',
            'Party',
            'Region',
            'Island',
            'MP Image URL'
        );
        
        foreach ($constituencies as $constituency) {
            $csv_data[] = array(
                $constituency->constituency_number,
                $constituency->constituency_name,
                $constituency->current_mp,
                $constituency->current_party,
                $constituency->region,
                $constituency->island,
                $constituency->mp_image
            );
        }
        
        wp_send_json_success(array(
            'csv_data' => $csv_data,
            'filename' => 'bahamas-mp-data-' . date('Y-m-d') . '.csv'
        ));
    }
    
    /**
     * Reset all MP data to 2021 results
     */
    public function ajax_reset_all_mp_data() {
        check_ajax_referer('bahamas_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        // FNM won these constituencies in 2021
        $fnm_constituencies = array(1, 10, 26, 28, 29, 36);
        
        $updated = 0;
        for ($i = 1; $i <= 39; $i++) {
            $party = in_array($i, $fnm_constituencies) ? 'FNM' : 'PLP';
            
            $result = $wpdb->update(
                $table_name,
                array(
                    'current_mp' => 'TBD',
                    'current_party' => $party,
                    'mp_image' => ''
                ),
                array('constituency_number' => $i),
                array('%s', '%s', '%s'),
                array('%d')
            );
            
            if ($result !== false) {
                $updated++;
            }
        }
        
        wp_send_json_success(array(
            'message' => "Reset $updated constituencies to 2021 results",
            'updated_count' => $updated
        ));
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
        
        // Generate the actual map sections
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
        
        // Nassau title and subtitle
        $svg .= '<text x="350" y="140" class="region-title">NASSAU / NEW PROVIDENCE</text>';
        $svg .= '<text x="350" y="160" class="region-subtitle">24 Constituencies (Most Important Region)</text>';
        
        // Nassau grid - 6 columns x 4 rows for 24 constituencies
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
            
            // Constituency number
            $svg .= sprintf(
                '<text x="%d" y="%d" class="constituency-label" font-weight="bold" font-size="14">%d</text>',
                $x + $width/2, $y + $height/2 - 5, $const_num
            );
            
            // Constituency name
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
     * Generate Grand Bahama section for download
     */
    private function generate_download_grand_bahama_section($simulation_data) {
        $svg = '';
        
        // Grand Bahama title
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
            
            // Wrap to second row if needed
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
     * Generate Family Islands section for download
     */
    private function generate_download_family_islands_section($simulation_data) {
        $svg = '';
        
        // Family Islands title
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
    
/**
 * Save shared simulation and return short code
 */
public function ajax_save_shared_simulation() {
    check_ajax_referer('bahamas_election_nonce', 'nonce');
    
    // CRITICAL FIX: Don't use sanitize_text_field on JSON data!
    // It destroys the JSON structure
    $simulation_data = wp_unslash($_POST['simulation_data']);
    
    // Validate it's proper JSON
    $decoded = json_decode($simulation_data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        wp_send_json_error('Invalid simulation data format');
        return;
    }
    
    if (empty($simulation_data)) {
        wp_send_json_error('No simulation data provided');
        return;
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'bahamas_shared_simulations';
    
    // Generate unique 6-character code
    do {
        $share_code = $this->generate_share_code();
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE share_code = %s",
            $share_code
        ));
    } while ($exists > 0);
    
    // Set expiration to 1 year from now
    $expires_at = date('Y-m-d H:i:s', strtotime('+1 year'));
    
    $result = $wpdb->insert(
        $table_name,
        array(
            'share_code' => $share_code,
            'simulation_data' => $simulation_data, // Store the raw JSON
            'expires_at' => $expires_at
        ),
        array('%s', '%s', '%s')
    );
    
    if ($result) {
        // Clean up old expired simulations (optional)
        $wpdb->query("DELETE FROM $table_name WHERE expires_at < NOW()");
        
        wp_send_json_success(array(
            'share_code' => $share_code,
            'share_url' => home_url('?share=' . $share_code),
            'expires_at' => $expires_at
        ));
    } else {
        wp_send_json_error('Failed to save simulation');
    }
}

/**
 * Load shared simulation by code
 */
public function ajax_load_shared_simulation() {
    check_ajax_referer('bahamas_election_nonce', 'nonce');
    
    $share_code = sanitize_text_field($_POST['share_code']);
    
    if (empty($share_code)) {
        wp_send_json_error('No share code provided');
        return;
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'bahamas_shared_simulations';
    
    $simulation = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE share_code = %s AND (expires_at IS NULL OR expires_at > NOW())",
        $share_code
    ));
    
    if ($simulation) {
        // Increment view count
        $wpdb->update(
            $table_name,
            array('view_count' => $simulation->view_count + 1),
            array('share_code' => $share_code),
            array('%d'),
            array('%s')
        );
        
        wp_send_json_success(array(
            'simulation_data' => $simulation->simulation_data,
            'created_at' => $simulation->created_at,
            'view_count' => $simulation->view_count + 1
        ));
    } else {
        wp_send_json_error('Simulation not found or expired');
    }
}

/**
 * Generate a random 6-character share code
 */
private function generate_share_code($length = 6) {
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $code;
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
    public function ajax_test_connection() {
    // Simple test to verify AJAX is working
    wp_send_json_success(array(
        'message' => 'AJAX connection working',
        'time' => current_time('mysql'),
        'user_can_manage' => current_user_can('manage_options'),
        'nonce_valid' => wp_verify_nonce($_POST['nonce'], 'bahamas_admin_nonce')
    ));
}
    public function debug_shortcode($atts) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bahamas_constituencies';
        
        $constituencies = $wpdb->get_results("SELECT * FROM $table_name ORDER BY constituency_number");
        
        $output = '<div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; margin: 20px 0;">';
        $output .= '<h3>🔍 Debug Information</h3>';
        $output .= '<p><strong>Total Constituencies:</strong> ' . count($constituencies) . '</p>';
        $output .= '<p><strong>Plugin Version:</strong> ' . BAHAMAS_ELECTION_VERSION . '</p>';
        $output .= '<p><strong>Database Table:</strong> ' . $table_name . '</p>';
        
        $output .= '<h4>Constituency Data Sample:</h4>';
        $output .= '<table border="1" cellpadding="5" style="border-collapse: collapse;">';
        $output .= '<tr><th>ID</th><th>Name</th><th>Party</th><th>MP</th><th>Region</th><th>Has Image</th></tr>';
        
        foreach (array_slice($constituencies, 0, 10) as $const) {
            $hasImage = !empty($const->mp_image) ? 'Yes' : 'No';
            $output .= '<tr>';
            $output .= '<td>' . $const->constituency_number . '</td>';
            $output .= '<td>' . esc_html($const->constituency_name) . '</td>';
            $output .= '<td>' . esc_html($const->current_party) . '</td>';
            $output .= '<td>' . esc_html($const->current_mp) . '</td>';
            $output .= '<td>' . esc_html($const->region) . '</td>';
            $output .= '<td>' . $hasImage . '</td>';
            $output .= '</tr>';
        }
        
        $output .= '</table>';
        $output .= '<p><em>Showing first 10 constituencies...</em></p>';
        $output .= '</div>';
        
        return $output;
    }
}

// Initialize the enhanced plugin
new BahamasElectionMapEnhanced();


// Membership Popup
add_action('wp_ajax_check_membership_access', 'pw_check_membership_access');
add_action('wp_ajax_nopriv_check_membership_access', 'pw_check_membership_access');

function pw_check_membership_access() {
    $user_id = get_current_user_id();

    $has_membership = function_exists('pmpro_hasMembershipLevel')
        ? pmpro_hasMembershipLevel(null, $user_id) // Any active membership
        : false;

    wp_send_json([
        'logged_in'      => is_user_logged_in(),
        'has_membership' => $has_membership
    ]);
}
function membership_info() {
    ?>
    <div id="membership-popup" class="membership-popup">
        <div id="membership-popup-overlay" class="popup-overlay">
            <div id="membership-popup-content" class="popup-content">
                <div class="popup-header">
                    <div class="popup-icon-large"></div>
                    <h2 class="popup-title">Signup Required</h2>
                    <button id="membership-popup-close" class="popup-close">&times;</button>
                </div>
                
                <div class="popup-body">
                    <p id="membership-popup-message" class="popup-message">
                        You need an active account to use this feature.
                    </p>
                    <div id="membership-popup-buttons" class="popup-buttons"></div>
                </div>
            </div>
        </div>
    </div>

    <style>
        .membership-popup {
            display: none;
            position: fixed;
            z-index: 99999;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .popup-overlay {
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        }

        .popup-content {
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 450px;
            width: 100%;
            transform: scale(0.9);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            position: relative;
        }

        .popup-show .popup-content {
            transform: scale(1);
        }

        .popup-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px 20px;
            text-align: center;
            position: relative;
        }

        .popup-icon-large {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }

        .popup-title {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .popup-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .popup-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        .popup-body {
            padding: 30px;
            text-align: center;
        }

        .popup-message {
            color: #555;
            font-size: 18px;
            line-height: 1.6;
            margin: 0 0 30px 0;
        }

        .popup-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .popup-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .popup-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .popup-btn:hover::before {
            left: 100%;
        }

        .popup-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .popup-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.6);
        }

        .popup-btn-secondary {
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
            box-shadow: 0 8px 25px rgba(116, 185, 255, 0.4);
        }

        .popup-btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(116, 185, 255, 0.6);
        }

        .popup-icon {
            font-size: 20px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
            .popup-content {
                margin: 0 15px;
                border-radius: 15px;
            }

            .popup-header {
                padding: 25px 15px 15px;
            }

            .popup-title {
                font-size: 24px;
            }

            .popup-body {
                padding: 20px 15px;
            }

            .popup-message {
                font-size: 16px;
            }

            .popup-btn {
                padding: 14px 20px;
                font-size: 15px;
            }
        }

        /* Animation keyframes */
        @keyframes popupSlideIn {
            from {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .popup-show .popup-content {
            animation: popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Glassmorphism effect for modern browsers */
        @supports (backdrop-filter: blur()) {
            .popup-overlay {
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(12px);
            }
        }
    </style>
    <?php
}
add_action('wp_footer', 'membership_info');
