// FIXED admin-panel.js - Remove duplicate elements
jQuery(document).ready(function($) {
    
    // Initialize admin panel
    initializeAdminPanel();
    
    function initializeAdminPanel() {
        setupEventListeners();
        setupExistingElements(); // Setup existing HTML elements instead of creating new ones
        console.log('✅ Bahamas Election Admin Panel initialized');
    }
    
    function setupEventListeners() {
        // Save MP button click
        $(document).on('click', '.save-mp-btn', handleSaveMp);
        
        // Reset MP button click
        $(document).on('click', '.reset-mp-btn', handleResetMp);
        
        // Image upload change
        $(document).on('change', '.mp-image-upload', handleImageUpload);
        
        // Export data button
        $(document).on('click', '#export-mp-data', handleExportData);
        
        // Import data button
        $(document).on('click', '#import-mp-data', handleImportData);
        
        // Reset to 2021 button
        $(document).on('click', '#reset-to-2021-admin', handleResetTo2021);
        
        // Auto-save on input change (with debounce)
        $(document).on('input', '.mp-name-input, .mp-party-select', debounce(handleAutoSave, 2000));
    }
    
    // Setup existing HTML elements instead of creating duplicates
    function setupExistingElements() {
        // Setup search functionality for existing search box
        $('#mp-search').on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            
            $('.mp-card').each(function() {
                const $card = $(this);
                const constituencyName = $card.find('.constituency-name').text().toLowerCase();
                const mpName = $card.find('.mp-name-input').val().toLowerCase();
                const party = $card.find('.mp-party-select').val().toLowerCase();
                const constituencyNumber = $card.data('constituency').toString();
                
                const matches = constituencyName.includes(searchTerm) ||
                              mpName.includes(searchTerm) ||
                              party.includes(searchTerm) ||
                              constituencyNumber.includes(searchTerm);
                
                $card.toggle(matches);
            });
        });
        
        // Clear search functionality
        $('#clear-search').on('click', function() {
            $('#mp-search').val('');
            $('.mp-card').show();
        });
        
        // Setup bulk actions for existing elements
        $('#select-all-cards').on('change', function() {
            $('.constituency-checkbox').prop('checked', $(this).prop('checked'));
        });
        
        // Bulk update party
        $('#bulk-update-party').on('click', function() {
            const selectedParty = $('#bulk-party-select').val();
            if (!selectedParty) {
                showNotification('Please select a party first', 'error');
                return;
            }
            
            const selectedCards = $('.constituency-checkbox:checked');
            if (selectedCards.length === 0) {
                showNotification('Please select at least one constituency', 'error');
                return;
            }
            
            selectedCards.each(function() {
                const constituencyId = $(this).val();
                const $card = $(`.mp-card[data-constituency="${constituencyId}"]`);
                $card.find('.mp-party-select').val(selectedParty);
                updateCardHeader($card, $card.find('.mp-name-input').val(), selectedParty);
            });
            
            showNotification(`Updated ${selectedCards.length} constituencies to ${selectedParty}`, 'success');
        });
        
        // Bulk clear names
        $('#bulk-clear-names').on('click', function() {
            if (!confirm('Are you sure you want to clear all MP names?')) return;
            
            $('.mp-name-input').val('TBD');
            showNotification('All MP names cleared', 'success');
        });
        
        // Bulk clear images
        $('#bulk-clear-images').on('click', function() {
            if (!confirm('Are you sure you want to clear all MP images?')) return;
            
            $('.mp-image-container').html(`
                <div class="mp-photo-placeholder">
                    <span class="dashicons dashicons-businessman"></span>
                    <p>No Photo</p>
                </div>
            `);
            showNotification('All MP images cleared', 'success');
        });
    }
    
    /**
     * Handle saving MP information
     */
    function handleSaveMp(e) {
        e.preventDefault();
        
        const $button = $(this);
        const constituencyId = $button.data('constituency');
        const $card = $button.closest('.mp-card');
        
        const mpName = $card.find('.mp-name-input').val().trim();
        const party = $card.find('.mp-party-select').val();
        
        if (!mpName) {
            showNotification('Please enter an MP name', 'error');
            return;
        }
        
        $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Saving...');
        $card.addClass('loading');
        
        $.ajax({
            url: bahamas_admin_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'update_mp_info',
                nonce: bahamas_admin_ajax.nonce,
                constituency_id: constituencyId,
                mp_name: mpName,
                party: party
            },
            success: function(response) {
                if (response.success) {
                    showNotification(`Updated ${mpName} for Constituency ${constituencyId}`, 'success');
                    updateCardHeader($card, mpName, party);
                    $button.html('<span class="dashicons dashicons-yes"></span> Saved!');
                    
                    setTimeout(() => {
                        $button.html('<span class="dashicons dashicons-yes"></span> Save Changes');
                    }, 2000);
                } else {
                    showNotification('Failed to update MP information: ' + response.data, 'error');
                    $button.html('<span class="dashicons dashicons-yes"></span> Save Changes');
                }
            },
            error: function(xhr, status, error) {
                showNotification('Error updating MP information: ' + error, 'error');
                $button.html('<span class="dashicons dashicons-yes"></span> Save Changes');
            },
            complete: function() {
                $button.prop('disabled', false);
                $card.removeClass('loading');
            }
        });
    }
    
    /**
     * Handle resetting MP information
     */
    function handleResetMp(e) {
        e.preventDefault();
        
        const $button = $(this);
        const constituencyId = $button.data('constituency');
        const $card = $button.closest('.mp-card');
        
        if (!confirm('Are you sure you want to reset this MP\'s information?')) {
            return;
        }
        
        // Reset form fields
        $card.find('.mp-name-input').val('TBD');
        $card.find('.mp-party-select').val('PLP');
        
        // Clear image
        const $imageContainer = $card.find('.mp-image-container');
        $imageContainer.html(`
            <div class="mp-photo-placeholder">
                <span class="dashicons dashicons-businessman"></span>
                <p>No Photo</p>
            </div>
        `);
        
        showNotification(`Reset constituency ${constituencyId}`, 'success');
    }
    
    /**
     * Handle image upload
     */
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const $input = $(this);
        const constituencyId = $input.data('constituency');
        const $card = $input.closest('.mp-card');
        const $imageContainer = $card.find('.mp-image-container');
        
        console.log('Starting upload for constituency:', constituencyId);
        console.log('File info:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Validate file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('Please select a valid image file (JPG, PNG, GIF, or WebP)', 'error');
            $input.val('');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showNotification('Image file size must be less than 5MB', 'error');
            $input.val('');
            return;
        }
        
        // Show loading state
        $imageContainer.html(`
            <div class="mp-photo-placeholder">
                <span class="dashicons dashicons-update spin"></span>
                <p>Uploading...</p>
            </div>
        `);
        
        // Create form data
        const formData = new FormData();
        formData.append('action', 'upload_mp_image');
        formData.append('nonce', bahamas_admin_ajax.nonce);
        formData.append('constituency_id', constituencyId);
        formData.append('mp_image', file);
        
        $.ajax({
            url: bahamas_admin_ajax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            timeout: 30000,
            success: function(response) {
                console.log('Upload response:', response);
                
                if (response.success) {
                    const mpName = $card.find('.mp-name-input').val() || 'MP';
                    $imageContainer.html(`
                        <img src="${response.data.image_url}" 
                             alt="${mpName}" 
                             class="mp-photo">
                        <button type="button" class="delete-image-btn" data-constituency="${constituencyId}" title="Delete Image">
                            <span class="dashicons dashicons-trash"></span>
                        </button>
                    `);
                    showNotification('Image uploaded successfully!', 'success');
                } else {
                    console.error('Upload failed:', response.data);
                    $imageContainer.html(`
                        <div class="mp-photo-placeholder">
                            <span class="dashicons dashicons-businessman"></span>
                            <p>Upload Failed</p>
                        </div>
                    `);
                    showNotification('Failed to upload image: ' + response.data, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Upload Error:', {
                    status: status,
                    error: error,
                    responseText: xhr.responseText,
                    statusCode: xhr.status
                });
                
                $imageContainer.html(`
                    <div class="mp-photo-placeholder">
                        <span class="dashicons dashicons-businessman"></span>
                        <p>Upload Failed</p>
                    </div>
                `);
                
                let errorMessage = 'Error uploading image: ';
                if (xhr.status === 0) {
                    errorMessage += 'Network connection failed';
                } else if (xhr.status === 413) {
                    errorMessage += 'File too large';
                } else if (xhr.status === 500) {
                    errorMessage += 'Server error';
                } else {
                    errorMessage += error || 'Unknown error';
                }
                
                showNotification(errorMessage, 'error');
            },
            complete: function() {
                $input.val('');
            }
        });
    }

    // Add delete image handler
    $(document).on('click', '.delete-image-btn', function(e) {
        e.preventDefault();
        
        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }
        
        const $button = $(this);
        const constituencyId = $button.data('constituency');
        const $imageContainer = $button.closest('.mp-image-container');
        
        $imageContainer.html(`
            <div class="mp-photo-placeholder">
                <span class="dashicons dashicons-update spin"></span>
                <p>Deleting...</p>
            </div>
        `);
        
        $.ajax({
            url: bahamas_admin_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'delete_mp_image',
                nonce: bahamas_admin_ajax.nonce,
                constituency_id: constituencyId
            },
            success: function(response) {
                if (response.success) {
                    $imageContainer.html(`
                        <div class="mp-photo-placeholder">
                            <span class="dashicons dashicons-businessman"></span>
                            <p>No Photo</p>
                        </div>
                    `);
                    showNotification('Image deleted successfully', 'success');
                } else {
                    showNotification('Failed to delete image: ' + response.data, 'error');
                }
            },
            error: function(xhr, status, error) {
                showNotification('Error deleting image: ' + error, 'error');
                location.reload();
            }
        });
    });
    
    /**
     * Handle auto-save functionality
     */
    function handleAutoSave() {
        const $input = $(this);
        const $card = $input.closest('.mp-card');
        const $saveButton = $card.find('.save-mp-btn');
        
        $saveButton.html('<span class="dashicons dashicons-clock"></span> Auto-saving...');
        $saveButton.addClass('button-secondary').removeClass('button-primary');
        
        setTimeout(() => {
            $saveButton.trigger('click');
        }, 500);
    }
    
    /**
     * Handle export functionality
     */
    function handleExportData(e) {
        e.preventDefault();
        
        const $button = $(this);
        $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Exporting...');
        
        const mpData = [];
        $('.mp-card').each(function() {
            const $card = $(this);
            const constituencyId = $card.data('constituency');
            const constituencyName = $card.find('.constituency-name').text();
            const mpName = $card.find('.mp-name-input').val();
            const party = $card.find('.mp-party-select').val();
            const region = $card.find('.mp-card-footer').text().split('|')[0].replace('Region:', '').trim();
            const island = $card.find('.mp-card-footer').text().split('|')[1].replace('Island:', '').trim();
            
            mpData.push({
                'Constituency Number': constituencyId,
                'Constituency Name': constituencyName,
                'MP Name': mpName,
                'Party': party,
                'Region': region,
                'Island': island
            });
        });
        
        const csvContent = convertToCSV(mpData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bahamas-mp-data-${getCurrentDate()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('MP data exported successfully', 'success');
        $button.prop('disabled', false).html('<span class="dashicons dashicons-download"></span> Export MP Data');
    }
    
    /**
     * Handle import functionality
     */
    function handleImportData(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('import-mp-file');
        const file = fileInput.files[0];
        
        if (!file) {
            showNotification('Please select a CSV file to import', 'error');
            return;
        }
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showNotification('Please select a valid CSV file', 'error');
            return;
        }
        
        const $button = $(this);
        $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Importing...');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const csv = event.target.result;
                const data = parseCSV(csv);
                
                if (data.length === 0) {
                    showNotification('No valid data found in CSV file', 'error');
                    return;
                }
                
                processImportData(data);
                
            } catch (error) {
                showNotification('Error reading CSV file: ' + error.message, 'error');
            }
            
            $button.prop('disabled', false).html('<span class="dashicons dashicons-upload"></span> Import MP Data');
        };
        
        reader.readAsText(file);
    }
    
    /**
     * Handle reset to 2021 results
     */
    function handleResetTo2021(e) {
        e.preventDefault();
        
        const confirmMessage = 'This will reset ALL MP data to the original 2021 election results. This action cannot be undone. Are you sure?';
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        const $button = $(this);
        $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Resetting...');
        
        $('.mp-card').each(function() {
            const $card = $(this);
            const constituencyId = $card.data('constituency');
            
            const party2021 = get2021Party(constituencyId);
            
            $card.find('.mp-name-input').val('TBD');
            $card.find('.mp-party-select').val(party2021);
            
            const $imageContainer = $card.find('.mp-image-container');
            $imageContainer.html(`
                <div class="mp-photo-placeholder">
                    <span class="dashicons dashicons-businessman"></span>
                    <p>No Photo</p>
                </div>
            `);
            
            updateCardHeader($card, 'TBD', party2021);
        });
        
        showNotification('All data reset to 2021 election results', 'success');
        $button.prop('disabled', false).html('<span class="dashicons dashicons-undo"></span> Reset All Data');
    }
    
    /**
     * Process imported CSV data
     */
    function processImportData(data) {
        let successCount = 0;
        let errorCount = 0;
        
        data.forEach(row => {
            const constituencyId = parseInt(row['Constituency Number']);
            const mpName = row['MP Name'];
            const party = row['Party'];
            
            if (!constituencyId || constituencyId < 1 || constituencyId > 39) {
                errorCount++;
                return;
            }
            
            if (!['PLP', 'FNM', 'COI', 'DNA', 'IND'].includes(party)) {
                errorCount++;
                return;
            }
            
            const $card = $(`.mp-card[data-constituency="${constituencyId}"]`);
            if ($card.length) {
                $card.find('.mp-name-input').val(mpName || 'TBD');
                $card.find('.mp-party-select').val(party);
                updateCardHeader($card, mpName || 'TBD', party);
                successCount++;
            } else {
                errorCount++;
            }
        });
        
        if (successCount > 0) {
            showNotification(`Successfully imported ${successCount} MP records`, 'success');
        }
        
        if (errorCount > 0) {
            showNotification(`${errorCount} records had errors and were skipped`, 'error');
        }
    }
    
    /**
     * Update card header with new information
     */
    function updateCardHeader($card, mpName, party) {
        const $partyBadge = $card.find('.party-badge');
        $partyBadge.text(party);
        $partyBadge.removeClass('plp fnm coi dna ind').addClass(party.toLowerCase());
    }
    
    /**
     * Get 2021 election party result for constituency
     */
    function get2021Party(constituencyId) {
        const fnmWins = [1, 10, 26, 28, 29, 36];
        return fnmWins.includes(parseInt(constituencyId)) ? 'FNM' : 'PLP';
    }
    
    /**
     * Convert array of objects to CSV string
     */
    function convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        csvRows.push(headers.join(','));
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    /**
     * Parse CSV string to array of objects
     */
    function parseCSV(csv) {
        const lines = csv.split('\n');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index].trim().replace(/"/g, '');
                });
                data.push(row);
            }
        }
        
        return data;
    }
    
    /**
     * Parse a single CSV line handling quoted values
     */
    function parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }
    
    /**
     * Get current date in YYYY-MM-DD format
     */
    function getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Show notification message
     */
    function showNotification(message, type = 'success') {
        $('.notification').remove();
        
        const icons = {
            'success': '✅',
            'error': '❌',
            'info': 'ℹ️',
            'warning': '⚠️'
        };
        
        const notification = $(`
            <div class="notification ${type}" style="
                position: fixed;
                top: 30px;
                right: 30px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 300px;
                max-width: 500px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease-out;
            ">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message" style="word-wrap: break-word;">${message}</span>
                <button class="notification-close" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                    padding: 0;
                    line-height: 1;
                ">&times;</button>
            </div>
        `);
        
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'info': '#17a2b8',
            'warning': '#ffc107'
        };
        
        notification.css('background-color', colors[type] || colors.info);
        $('body').append(notification);
        
        setTimeout(() => {
            notification.fadeOut(() => notification.remove());
        }, 5000);
        
        notification.find('.notification-close').on('click', () => {
            notification.fadeOut(() => notification.remove());
        });
        
        console.log(`Notification (${type}):`, message);
    }

    // Add CSS for image delete button and animations
    const deleteButtonStyles = `
    <style>
    .mp-image-container {
        position: relative;
    }

    .delete-image-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(220, 53, 69, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .mp-image-container:hover .delete-image-btn {
        opacity: 1;
    }

    .delete-image-btn:hover {
        background: rgba(220, 53, 69, 1);
        transform: scale(1.1);
    }

    .delete-image-btn .dashicons {
        font-size: 12px;
        line-height: 1;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .spin {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .mp-card.loading {
        opacity: 0.7;
        pointer-events: none;
    }
    
    .mp-card.loading .mp-card-header {
        background: #f0f0f0;
    }
    </style>
    `;

    if (!document.getElementById('mp-delete-button-styles')) {
        $(deleteButtonStyles.replace('<style>', '<style id="mp-delete-button-styles">')).appendTo('head');
    }

    /**
     * Debounce function to limit rapid function calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Debug function to check AJAX setup
    function debugAjaxSetup() {
        console.log('=== AJAX Debug Info ===');
        console.log('AJAX URL:', bahamas_admin_ajax.ajax_url);
        console.log('Nonce:', bahamas_admin_ajax.nonce);
        console.log('Plugin URL:', bahamas_admin_ajax.plugin_url);
        
        $.ajax({
            url: bahamas_admin_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'test_connection',
                nonce: bahamas_admin_ajax.nonce
            },
            success: function(response) {
                console.log('AJAX test successful:', response);
            },
            error: function(xhr, status, error) {
                console.error('AJAX test failed:', {status, error, responseText: xhr.responseText});
            }
        });
    }

    // Run debug on page load
    debugAjaxSetup();
    
    console.log('✅ Bahamas Election Admin Panel fully loaded with all features');
});
