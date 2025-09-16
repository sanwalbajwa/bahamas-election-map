# Bahamas Interactive Election Map - Enhanced

![License](https://img.shields.io/badge/License-GPL%20v2-blue.svg)
![WordPress](https://img.shields.io/badge/WordPress-5.0%2B-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-purple.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)

An interactive WordPress plugin that displays all 39 Bahamian parliamentary constituencies with real-time election simulation capabilities. Built with a focus on Nassau/New Providence's 24 constituencies while maintaining full coverage of Grand Bahama and the Family Islands.
 
## 🌟 Features
 
### 🗺️ Interactive Mapping
- **SVG-based interactive map** with fallback grid system
- **Click to simulate** different party outcomes
- **Hover effects** with constituency information
- **Keyboard navigation** support
- **Mobile-responsive design**

### 🏛️ Political Accuracy
- **2021 Election Results** as default (PLP: 33 seats, FNM: 6 seats)
- **All 39 constituencies** properly mapped and named
- **Regional breakdown**: Nassau (24), Grand Bahama (5), Family Islands (10)
- **Real-time seat counting** with majority calculations

### 🎨 Visual Excellence
- **Party color coding**: PLP (Gold), FNM (Red), COI (Cyan), DNA (Green), IND (Gray)
- **Colorblind-friendly mode** available
- **Smooth animations** and transitions
- **Modern gradient design** with professional styling

### 🔄 Simulation Tools
- **Reset to 2021 results** with prominent red button
- **Share simulations** via URL encoding
- **Download SVG maps** for offline use
- **Session-based simulations** (don't affect other users)

### 📱 User Experience
- **Responsive design** works on all devices
- **Touch-friendly** interface for mobile users
- **Accessibility features** with proper ARIA labels
- **Loading states** and error handling

## 🚀 Installation

### Method 1: Direct Upload
1. Download the plugin files
2. Upload to `/wp-content/plugins/bahamas-election-map-enhanced/`
3. Activate through WordPress admin
4. Use shortcode `[bahamas_election_map]` on any page/post

### Method 2: WordPress Admin
1. Download the plugin as a ZIP file
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin
3. Upload and activate
4. Use shortcode `[bahamas_election_map]` on any page/post

### Method 3: Git Clone
```bash
cd /path/to/wordpress/wp-content/plugins/
git clone https://github.com/yourusername/bahamas-election-map-enhanced.git
```

## 📋 Requirements

- **WordPress**: 5.0 or higher
- **PHP**: 7.4 or higher
- **MySQL**: 5.6 or higher
- **Modern browser** with JavaScript enabled

## 🎯 Usage

### Basic Usage
```php
// Simple map display
[bahamas_election_map]

// Custom height
[bahamas_election_map height="600px"]
```

### Advanced Usage
```php
// Debug mode (for developers)
[debug_bahamas]
```

### Programmatic Access
```php
// Get 2021 election results
$plugin = new BahamasElectionMapEnhanced();
$results = $plugin->get_2021_results();

// Access constituency data
global $wpdb;
$constituencies = $wpdb->get_results("
    SELECT * FROM {$wpdb->prefix}bahamas_constituencies 
    WHERE is_simulation = 0 
    ORDER BY constituency_number
");
```

## 🏗️ File Structure

```
bahamas-election-map-enhanced/
├── bahamas-election-map-enhanced.php    # Main plugin file
├── assets/
│   ├── bahamas-election-enhanced.js     # JavaScript functionality
│   ├── bahamas-election-enhanced.css    # Styling
│   └── bahamas-official-map.svg         # Official SVG map (optional)
├── README.md                            # This file
└── screenshots/                         # Plugin screenshots
```

## 📊 Constituency Data

### Nassau/New Providence (24 constituencies)
1. Killarney (FNM) - 2021 Winner
2. Golden Isles (PLP)
3. Southern Shores (PLP)
4. Tall Pines (PLP)
5. Carmichael (PLP)
6. South Beach (PLP)
7. Seabreeze (PLP)
8. Elizabeth (PLP)
9. Yamacraw (PLP)
10. St Annes (FNM) - 2021 Winner
11. Fox Hill (PLP)
12. Nassau Village (PLP)
13. Pinewood (PLP)
14. Bamboo Town (PLP)
15. Golden Gates (PLP)
16. Garden Hills (PLP)
17. Mt. Moriah (PLP)
18. St. Barnabas (PLP)
19. Englerston (PLP)
20. Marathon (PLP)
21. Freetown (PLP)
22. Centreville (PLP)
23. Bains Town & Grants Town (PLP)
24. Fort Charlotte (PLP)

### Grand Bahama (5 constituencies)
25. West Grand Bahama & Bimini (PLP)
26. Grand Central Bahama (FNM) - 2021 Winner
27. Pineridge (PLP)
28. Marco City (FNM) - 2021 Winner
29. East Grand Bahama (FNM) - 2021 Winner

### Family Islands (10 constituencies)
30. North Abaco (PLP)
31. Central & South Abaco (PLP)
32. North Eleuthera (PLP)
33. Eleuthera (PLP)
34. Cat Island, Rum Cay & San Salvador (PLP)
35. Exumas & Ragged Island (PLP)
36. Long Island (FNM) - 2021 Winner
37. MICAL (PLP)
38. Central & South Andros (PLP)
39. Mangrove Cay & South Andros (PLP)

## 🎨 Customization

### Colors
```css
/* Modify party colors in CSS */
.plp-color { background: #FFD700; } /* Gold */
.fnm-color { background: #FF0000; } /* Red */
.coi-color { background: #00FFFF; } /* Cyan */
.dna-color { background: #00FF00; } /* Green */
.ind-color { background: #808080; } /* Gray */
```

### JavaScript Configuration
```javascript
// Modify in bahamas-election-enhanced.js
const PARTY_COLORS = {
    'PLP': '#FFD700',
    'FNM': '#FF0000',
    'COI': '#00FFFF',
    'DNA': '#00FF00',
    'IND': '#808080'
};
```

## 🔧 Developer Notes

### Database Tables
- `wp_bahamas_constituencies` - Main constituency data
- Uses `is_simulation` flag to separate official results from user simulations

### AJAX Endpoints
- `get_svg_map` - Loads and enhances SVG map
- `update_constituency` - Handles constituency updates (client-side only)
- `reset_to_2021` - Resets to official 2021 results

### JavaScript Events
- `constituencySelect` - Fired when constituency is selected
- Custom event handling for SVG interaction

## 🛠️ Troubleshooting

### Common Issues

**SVG Not Loading**
- Check if `assets/bahamas-official-map.svg` exists
- Verify AJAX endpoints are working
- Check browser console for errors

**Grid Fallback Displaying**
- This is normal if SVG file is missing
- Plugin automatically falls back to grid system
- All functionality remains available

**Styling Issues**
- Clear WordPress cache
- Check for CSS conflicts with theme
- Verify plugin CSS is loading

**JavaScript Errors**
- Ensure jQuery is loaded
- Check browser console for specific errors
- Verify WordPress admin-ajax.php is accessible

### Debug Mode
Add this to your `wp-config.php` for debugging:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Clone repository
git clone https://github.com/yourusername/bahamas-election-map-enhanced.git

# Install in WordPress
cp -r bahamas-election-map-enhanced /path/to/wordpress/wp-content/plugins/

# Activate plugin in WordPress admin
```

## 📄 License

This project is licensed under the GPL v2 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Commonwealth of The Bahamas** for constituency data
- **2021 General Election Results** as baseline data
- **WordPress Community** for development standards
- **SVG.js** and modern web technologies

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bahamas-election-map-enhanced/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/bahamas-election-map-enhanced/wiki)
- **Website**: [sanwalbajwa.live](https://sanwalbajwa.live/)

## 📈 Roadmap

- [ ] **Historical election data** (2017, 2012, etc.)
- [ ] **Polling data integration**
- [ ] **Demographic overlays**
- [ ] **Export to various formats** (PNG, PDF)
- [ ] **Multi-language support**
- [ ] **API for external applications**

## 🔖 Version History

### v2.0.0 (Current)
- ✅ Enhanced SVG mapping with fallback grid
- ✅ Session-based simulations
- ✅ Reset to 2021 results functionality
- ✅ Improved mobile responsiveness
- ✅ Colorblind accessibility mode

### v1.0.0
- ✅ Initial release
- ✅ Basic constituency mapping
- ✅ WordPress plugin structure

---

**Made with ❤️ for The Bahamas** 🇧🇸

For more information, visit [sanwalbajwa.live](https://sanwalbajwa.live/)
